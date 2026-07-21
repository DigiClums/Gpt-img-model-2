import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AspectRatio, ImageSize, OutputFormat } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Download a single image with chosen output format (png, jpeg, webp)
 */
export async function downloadImage(
  dataUrl: string,
  promptText: string,
  format: OutputFormat = "png"
): Promise<boolean> {
  try {
    const sanitizedPrompt = promptText
      .slice(0, 30)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");

    const filename = `gpt-image-2-${sanitizedPrompt || "generation"}-${Date.now()}.${format}`;

    if (dataUrl.startsWith("data:") && format !== "png") {
      const convertedUrl = await convertDataUrlFormat(dataUrl, format);
      triggerDownload(convertedUrl, filename);
      return true;
    }

    triggerDownload(dataUrl, filename);
    return true;
  } catch (error) {
    console.error("Download error:", error);
    return false;
  }
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Converts a data URL image to requested format (jpeg, webp, png)
 */
export function convertDataUrlFormat(
  dataUrl: string,
  format: OutputFormat
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Could not get canvas context");

      if (format === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);
      const mimeType = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
      resolve(canvas.toDataURL(mimeType, 0.95));
    };
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}

/**
 * Batch download all generated images
 */
export async function downloadAllImages(
  images: Array<{ url: string; prompt: string }>,
  format: OutputFormat = "png"
) {
  for (let i = 0; i < images.length; i++) {
    await downloadImage(images[i].url, `${images[i].prompt}_${i + 1}`, format);
    await new Promise((res) => setTimeout(res, 300));
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
}

/**
 * Format timestamp into relative date format
 */
export function formatDate(timestamp: number): string {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 30) return "Just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Map aspect ratio to dimension string
 */
export function aspectRatioToSize(aspectRatio: AspectRatio): ImageSize {
  switch (aspectRatio) {
    case "16:9":
      return "1536x1024";
    case "9:16":
      return "1024x1536";
    case "1:1":
    default:
      return "1024x1024";
  }
}
