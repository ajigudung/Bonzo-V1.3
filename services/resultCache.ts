// Simple IndexedDB cache for generated images (Blob).
// Keyed by a stable SHA-256 hash of (input image bytes + prompt + mode).

export interface CachedImageEntry {
  key: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}

const DB_NAME = 'ajigudung_cache_v1';
const STORE = 'images';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'key' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

export async function getCachedImage(key: string): Promise<CachedImageEntry | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req = store.get(key);
      req.onerror = () => reject(req.error ?? new Error('Cache get failed'));
      req.onsuccess = () => {
        const v = req.result as CachedImageEntry | undefined;
        resolve(v ?? null);
      };
    });
  } catch {
    return null;
  }
}

export async function setCachedImage(entry: CachedImageEntry): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.onabort = () => reject(tx.error ?? new Error('Cache put aborted'));
      tx.onerror = () => reject(tx.error ?? new Error('Cache put failed'));
      tx.oncomplete = () => resolve();
      tx.objectStore(STORE).put(entry);
    });
    try {
      db.close();
    } catch {}
  } catch {
    // ignore cache failures
  }
}

/**
 * Hard clear all cached images (used by Reset).
 * This removes ALL entries from the object store.
 */
export async function clearAllCachedImages(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.onabort = () => reject(tx.error ?? new Error('Cache clear aborted'));
      tx.onerror = () => reject(tx.error ?? new Error('Cache clear failed'));
      tx.oncomplete = () => resolve();
      tx.objectStore(STORE).clear();
    });
    try {
      db.close();
    } catch {}
  } catch {
    // ignore
  }
}

export async function sha256Hex(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  const enc = new TextEncoder();
  let buf: ArrayBuffer;
  if (typeof data === 'string') {
    buf = enc.encode(data).buffer;
  } else if (data instanceof Uint8Array) {
    buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  } else {
    buf = data;
  }
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(digest);
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}

export async function digestFile(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  return await sha256Hex(ab);
}

export async function buildCacheKey(parts: { files: File[]; prompt: string; mode: string }): Promise<string> {
  // Hash each file, then hash the concatenation with prompt+mode.
  const fileDigests = await Promise.all(parts.files.map(digestFile));
  const combined =
    `mode:${parts.mode}\n` +
    `prompt:${parts.prompt}\n` +
    fileDigests.map((d, i) => `f${i}:${d}`).join('\n');
  return await sha256Hex(combined);
}
