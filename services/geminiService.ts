import { GoogleGenAI, Modality } from "@google/genai";
import type { EditedImageResponse } from "../types";
import { enhancePasFotoPrompt } from "./promptEnhancer";
import { fileToResizedJpegBase64, filesToCollageJpegBase64 } from "./imagePreprocess";
import { buildCacheKey, getCachedImage, setCachedImage, clearAllCachedImages } from "./resultCache";

// Pastikan API_KEY di environment
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export type EditMode = "default" | "pas_foto";
export interface EditImageOptions {
  mode?: EditMode;
  /** Enable IndexedDB cache (default true). */
  cache?: boolean;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryable(err: any): boolean {
  const msg = String(err?.message ?? err ?? "");
  // Common Gemini API transient errors
  return (
    msg.includes("INTERNAL") ||
    msg.includes("Internal error") ||
    msg.includes("500") ||
    msg.includes("503") ||
    msg.includes("UNAVAILABLE")
  );
}

function base64ToBlob(b64: string, mimeType: string): Blob {
  // atob handles standard base64 (no data-url prefix).
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

/**
 * Clear ALL local IndexedDB cache. Dipanggil saat tombol Reset.
 */
export async function clearGeminiCache(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    await clearAllCachedImages();
  } catch {
    // ignore
  }
}

// --- Main Function ---
export const editImageWithGemini = async (
  fileOrFiles: File | File[],
  prompt: string,
  options?: EditImageOptions
): Promise<EditedImageResponse> => {
  try {
    const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
    if (files.length < 1) throw new Error("No image provided.");
    if (files.length > 5) throw new Error("Upload maksimal 5 gambar.");

    const mode = options?.mode ?? "default";
    const useCache = options?.cache !== false;

    // ===== CACHE LOOKUP =====
    if (useCache && typeof indexedDB !== "undefined" && typeof crypto?.subtle !== "undefined") {
      try {
        const key = await buildCacheKey({ files, prompt, mode });
        const cached = await getCachedImage(key);
        if (cached?.blob) {
          const url = URL.createObjectURL(cached.blob);
          return {
            image: {
              url,
              blob: cached.blob,
              mimeType: cached.mimeType || cached.blob.type || "image/png",
            },
            text: null,
            fromCache: true,
          };
        }
      } catch {
        // ignore cache errors
      }
    }

    // ===== IMAGE PREPROCESSING =====
    // Gemini 2.5 Flash Image commonly supports max 3 image parts per prompt.
    // To still allow up to 5 uploads, we merge 4–5 images into a single collage.
    // Also, we resize/compress to reduce INTERNAL/500 errors caused by oversized payloads.
    const imagesForRequest = await (async () => {
      if (files.length <= 3) {
        return await Promise.all(files.map((f) => fileToResizedJpegBase64(f, { maxSide: 1536, quality: 0.9 })));
      }
      // 4–5 images => 1 collage image
      const collage = await filesToCollageJpegBase64(files, { maxWidth: 1536, quality: 0.9 });
      return [collage];
    })();

    // ===== SAFE PROMPT AUGMENTATION =====
    let finalPrompt = prompt;

    // Pas Foto rules: gunakan mode dari UI (lebih stabil daripada cek teks prompt)
    if (mode === "pas_foto") {
      finalPrompt = enhancePasFotoPrompt(prompt, {
        size: "3x4", // default Indonesia (tidak override UI)
      });
    }

    // Anti-artifact guard: cegah "corner haze/vignette" yang sering muncul tanpa diminta
    finalPrompt += `

[ANTI-ARTIFACT RULE]
• Do not add unintended vignetting, corner haze, light leaks, lens flare, bloom, or washed-out corners.
• Keep corners/edges clean and the background uniform unless the prompt explicitly requests otherwise.
`;

    const parts = [
      ...imagesForRequest.map((img) => ({
        inlineData: {
          data: img.data,
          mimeType: img.mimeType,
        },
      })),
      { text: finalPrompt },
    ];

    // Retry transient INTERNAL errors (common when payload is big or backend is busy)
    const maxAttempts = 3;
    let lastErr: any = null;
    let response: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: { parts },
          config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
          },
        });
        lastErr = null;
        break;
      } catch (e: any) {
        lastErr = e;
        if (attempt < maxAttempts && isRetryable(e)) {
          // backoff: 600ms, 1800ms
          await sleep(600 * attempt * attempt);
          continue;
        }
        throw e;
      }
    }

    if (!response && lastErr) throw lastErr;

    let blob: Blob | null = null;
    let mimeType: string | null = null;
    let text: string | null = null;

    // ===== RESPONSE PARSING =====
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const base64ImageBytes = part.inlineData.data;
          mimeType = part.inlineData.mimeType || "image/png";
          blob = base64ToBlob(base64ImageBytes, mimeType);
        } else if (part.text) {
          text = part.text;
        }
      }
    }

    if (!blob || !mimeType) {
      throw new Error("API did not return an image. The model may have refused or returned text only.");
    }

    // ===== CACHE STORE =====
    if (useCache && typeof indexedDB !== "undefined" && typeof crypto?.subtle !== "undefined") {
      try {
        const key = await buildCacheKey({ files, prompt, mode });
        await setCachedImage({ key, blob, mimeType, createdAt: Date.now() });
      } catch {
        // ignore
      }
    }

    const url = URL.createObjectURL(blob);
    return { image: { url, blob, mimeType }, text, fromCache: false };
  } catch (error) {
    console.error("Error calling Gemini API:", error);

    if (error instanceof Error) {
      if (error.message.includes("blocked")) {
        throw new Error("The request was blocked by safety policy. Try adjusting prompt or image.");
      }
      throw new Error(`Failed to edit image: ${error.message}`);
    }

    throw new Error("Unknown error while editing the image.");
  }
};
