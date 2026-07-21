import { GeneratedImage, PromptHistoryItem } from "@/types";
import {
  saveImageBlobsToIDB,
  getImageBlobFromIDB,
  getLazyObjectURL,
} from "@/lib/db";

export interface BackupPayload {
  version: string;
  exportedAt: number;
  prompts: PromptHistoryItem[];
  images: Array<{
    id: string;
    prompt: string;
    enhancedPrompt?: string;
    createdAt: number;
    aspectRatio: any;
    size: any;
    model: string;
    format: any;
    isFavorite?: boolean;
    isEdited?: boolean;
    base64Data?: string;
  }>;
}

/**
 * Export full application history (prompts & images) as a JSON backup file
 */
export async function exportHistoryBackup(
  images: GeneratedImage[],
  prompts: PromptHistoryItem[]
): Promise<boolean> {
  try {
    const exportImages = await Promise.all(
      images.map(async (img) => {
        let base64Data: string | undefined = undefined;

        // Fetch Blob directly from IndexedDB without creating Object URLs
        const blob = await getImageBlobFromIDB(img.id, false);
        if (blob) {
          base64Data = await blobToBase64(blob);
        } else if (img.url && img.url.startsWith("data:")) {
          base64Data = img.url;
        }

        return {
          id: img.id,
          prompt: img.prompt,
          enhancedPrompt: img.enhancedPrompt,
          createdAt: img.createdAt,
          aspectRatio: img.aspectRatio,
          size: img.size,
          model: img.model,
          format: img.format,
          isFavorite: img.isFavorite,
          isEdited: img.isEdited,
          base64Data,
        };
      })
    );

    const payload: BackupPayload = {
      version: "4.0",
      exportedAt: Date.now(),
      prompts,
      images: exportImages,
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `chatgpt-image-history-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error("Export backup failed:", err);
    return false;
  }
}

/**
 * Import application history from a JSON backup file
 */
export async function importHistoryBackup(
  file: File
): Promise<{
  success: boolean;
  images?: GeneratedImage[];
  prompts?: PromptHistoryItem[];
  error?: string;
}> {
  try {
    const text = await file.text();
    const parsed: BackupPayload = JSON.parse(text);

    if (!parsed || !Array.isArray(parsed.prompts) || !Array.isArray(parsed.images)) {
      return { success: false, error: "Invalid backup file structure." };
    }

    const importedImages: GeneratedImage[] = [];

    for (const item of parsed.images) {
      if (item.base64Data) {
        await saveImageBlobsToIDB(item.id, item.base64Data);
      }

      importedImages.push({
        id: item.id,
        prompt: item.prompt,
        enhancedPrompt: item.enhancedPrompt,
        url: "", // Object URLs will be generated lazily on-demand only!
        thumbnailUrl: "",
        createdAt: item.createdAt || Date.now(),
        aspectRatio: item.aspectRatio || "1:1",
        size: item.size || "1024x1024",
        model: item.model || "gpt-image-2",
        format: item.format || "png",
        isFavorite: !!item.isFavorite,
        isEdited: !!item.isEdited,
      });
    }

    return {
      success: true,
      images: importedImages,
      prompts: parsed.prompts,
    };
  } catch (err: any) {
    console.error("Import backup error:", err);
    return { success: false, error: err?.message || "Failed to parse backup file." };
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
