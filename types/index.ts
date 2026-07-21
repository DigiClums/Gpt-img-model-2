export type AspectRatio = "1:1" | "16:9" | "9:16";

export type ImageSize = "1024x1024" | "1536x1024" | "1024x1536";

export type OutputFormat = "png" | "jpeg" | "webp";

export type ImageQuality = "low" | "medium" | "high" | "auto";

export interface GeneratedImage {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  url: string; // Object URL (URL.createObjectURL(blob)) or Base64 Data URL
  thumbnailUrl?: string; // 256x256 Object URL for thumbnails
  createdAt: number;
  aspectRatio: AspectRatio;
  size: ImageSize;
  model: string; // "gpt-image-2"
  format: OutputFormat;
  isEdited?: boolean;
  originalImage?: string;
  isFavorite?: boolean;
}

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  timestamp: number;
  isPinned?: boolean;
}

export interface AppSettings {
  defaultModel: string; // strictly "gpt-image-2"
  defaultAspectRatio: AspectRatio;
  defaultSize: ImageSize;
  imageCount: number;
  autoEnhance: boolean;
  quality: ImageQuality;
  outputFormat: OutputFormat;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
}

export interface GenerateImagePayload {
  prompt: string;
  aspectRatio?: AspectRatio;
  size?: ImageSize;
  model?: string;
  n?: number;
  quality?: ImageQuality;
  autoEnhance?: boolean;
  image?: string; // base64 string for image-to-image editing
}

export interface GenerateImageResponse {
  success: boolean;
  images?: Array<{ url: string; revisedPrompt?: string }>;
  enhancedPrompt?: string;
  error?: string;
  code?: number | string;
  details?: string;
}
