/**
 * Advanced IndexedDB & Lazy Object URL Cache Engine
 * Stores images strictly as Blob objects in IndexedDB.
 * Never creates Object URLs on app startup or hydration.
 * Generates Object URLs strictly on-demand (view, edit, download, fullscreen)
 * and caches them for reuse until closed, deleted, or unloaded.
 */

const DB_NAME = "ChatGPT_ImageGen_DB_v4";
const DB_VERSION = 4;
const STORE_ORIGINALS = "image_blobs";
const STORE_THUMBNAILS = "thumbnail_blobs";

interface ObjectUrlCacheEntry {
  url: string;
  blob: Blob;
  createdAt: number;
}

// Memory cache for active Object URLs (Key: `${id}_full` or `${id}_thumb`)
const objectUrlCache = new Map<string, ObjectUrlCacheEntry>();

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this browser."));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_ORIGINALS)) {
        db.createObjectStore(STORE_ORIGINALS);
      }
      if (!db.objectStoreNames.contains(STORE_THUMBNAILS)) {
        db.createObjectStore(STORE_THUMBNAILS);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Revoke specific cached Object URL
 */
export function revokeCacheEntry(cacheKey: string): void {
  const entry = objectUrlCache.get(cacheKey);
  if (entry) {
    try {
      URL.revokeObjectURL(entry.url);
    } catch (err) {
      console.warn("Error revoking Object URL:", err);
    }
    objectUrlCache.delete(cacheKey);
  }
}

/**
 * Revoke all active Object URLs for a specific image ID (both full & thumbnail)
 */
export function revokeImageObjectUrls(id: string): void {
  revokeCacheEntry(`${id}_full`);
  revokeCacheEntry(`${id}_thumb`);
}

/**
 * Revoke all Object URLs in cache (called on app unload / clear history)
 */
export function revokeAllObjectUrls(): void {
  objectUrlCache.forEach((entry) => {
    try {
      URL.revokeObjectURL(entry.url);
    } catch {
      // Ignore
    }
  });
  objectUrlCache.clear();
}

// Automatically revoke all Object URLs on window unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    revokeAllObjectUrls();
  });
}

/**
 * Convert Base64 string to binary Blob
 */
export function base64ToBlob(base64DataUrl: string): Blob {
  const parts = base64DataUrl.split(",");
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Compress original image Blob if > 3MB
 */
export async function compressImageIfNeeded(blob: Blob, maxSizeBytes = 3 * 1024 * 1024): Promise<Blob> {
  if (blob.size <= maxSizeBytes) {
    return blob;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const tempUrl = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(tempUrl);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) return resolve(blob);

      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (compressed) => {
          resolve(compressed && compressed.size < blob.size ? compressed : blob);
        },
        "image/webp",
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      resolve(blob);
    };

    img.src = tempUrl;
  });
}

/**
 * Generate 256x256 thumbnail Blob
 */
export async function generate256Thumbnail(blob: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const tempUrl = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(tempUrl);
      const canvas = document.createElement("canvas");
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      if (!ctx) return resolve(blob);

      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;

      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
      canvas.toBlob(
        (thumb) => {
          resolve(thumb || blob);
        },
        "image/webp",
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      resolve(blob);
    };

    img.src = tempUrl;
  });
}

/**
 * Save Original & Thumbnail Blobs into IndexedDB (Does NOT create Object URLs)
 */
export async function saveImageBlobsToIDB(
  id: string,
  base64OrBlob: string | Blob
): Promise<void> {
  const rawBlob = typeof base64OrBlob === "string" ? base64ToBlob(base64OrBlob) : base64OrBlob;
  const finalBlob = await compressImageIfNeeded(rawBlob);
  const thumbBlob = await generate256Thumbnail(finalBlob);

  const db = await openDB();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_ORIGINALS, STORE_THUMBNAILS], "readwrite");
    tx.objectStore(STORE_ORIGINALS).put(finalBlob, id);
    tx.objectStore(STORE_THUMBNAILS).put(thumbBlob, id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
}

/**
 * Retrieve Image Blob directly from IndexedDB without creating Object URLs
 */
export async function getImageBlobFromIDB(
  id: string,
  isThumbnail = false
): Promise<Blob | null> {
  try {
    const db = await openDB();
    const storeName = isThumbnail ? STORE_THUMBNAILS : STORE_ORIGINALS;

    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result as Blob);
      req.onerror = () => reject(req.error);
    });

    db.close();

    // Fallback to original if thumbnail missing
    if (!blob && isThumbnail) {
      return getImageBlobFromIDB(id, false);
    }

    return blob || null;
  } catch (err) {
    console.warn("Error fetching blob from IndexedDB:", err);
    return null;
  }
}

/**
 * LAZY OBJECT URL RESOLVER:
 * Generates an Object URL ONLY on-demand (e.g. when explicit action is taken).
 * Caches URL while in use, reusing cached URL if same image is opened again.
 */
export async function getLazyObjectURL(
  id: string,
  isThumbnail = false
): Promise<string> {
  const cacheKey = `${id}_${isThumbnail ? "thumb" : "full"}`;

  // 1. Reuse existing cached URL if available
  const existing = objectUrlCache.get(cacheKey);
  if (existing) {
    return existing.url;
  }

  // 2. Load Blob from IndexedDB on-demand
  const blob = await getImageBlobFromIDB(id, isThumbnail);
  if (!blob) {
    return "";
  }

  // 3. Create Object URL on-demand
  const objectUrl = URL.createObjectURL(blob);
  objectUrlCache.set(cacheKey, {
    url: objectUrl,
    blob,
    createdAt: Date.now(),
  });

  return objectUrl;
}

/**
 * Delete image blobs from IndexedDB and revoke cached Object URLs
 */
export async function deleteImageBlobsFromIDB(id: string): Promise<boolean> {
  try {
    revokeImageObjectUrls(id);
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_ORIGINALS, STORE_THUMBNAILS], "readwrite");
      tx.objectStore(STORE_ORIGINALS).delete(id);
      tx.objectStore(STORE_THUMBNAILS).delete(id);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch (err) {
    console.warn("Could not delete image blobs from IndexedDB:", err);
    return false;
  }
}

/**
 * Clear all stores in IndexedDB and revoke all active Object URLs
 */
export async function clearAllImagesFromIDB(): Promise<boolean> {
  try {
    revokeAllObjectUrls();
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_ORIGINALS, STORE_THUMBNAILS], "readwrite");
      tx.objectStore(STORE_ORIGINALS).clear();
      tx.objectStore(STORE_THUMBNAILS).clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch (err) {
    console.warn("Could not clear IndexedDB:", err);
    return false;
  }
}
