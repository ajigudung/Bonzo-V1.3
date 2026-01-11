export interface ImageState {
  url: string | null;
  blob: Blob | null;
  mimeType: string | null;
}

export interface HistoryItem {
  id: string;
  url: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export enum EditorMode {
  IDLE = 'IDLE',
  EDITING = 'EDITING',
  GENERATING = 'GENERATING',
  ANALYZING = 'ANALYZING',
}

export interface EditedImage {
  url: string;
  blob: Blob;
  mimeType: string;
}

export interface EditedImageResponse {
  image: EditedImage;
  text: string | null;
  fromCache?: boolean;
}
