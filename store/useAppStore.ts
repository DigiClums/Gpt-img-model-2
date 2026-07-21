import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  GeneratedImage,
  PromptHistoryItem,
  AppSettings,
  ToastMessage,
} from "@/types";
import {
  saveImageBlobsToIDB,
  getLazyObjectURL,
  deleteImageBlobsFromIDB,
  clearAllImagesFromIDB,
  revokeImageObjectUrls,
  revokeAllObjectUrls,
} from "@/lib/db";

const MAX_IMAGE_HISTORY = 50;

interface AppState {
  // Data State
  images: GeneratedImage[];
  prompts: PromptHistoryItem[];
  favorites: string[]; // Image IDs
  pinnedPrompts: string[]; // Prompt IDs
  isHydrated: boolean;

  // App Settings
  settings: AppSettings;

  // UI State
  activeImage: GeneratedImage | null;
  editingSeedImage: string | null;
  isSidebarOpen: boolean;
  isSettingsOpen: boolean;
  toasts: ToastMessage[];

  // Actions
  addImages: (newImages: GeneratedImage[]) => Promise<void>;
  deleteImage: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => void;
  
  addPrompt: (promptText: string, enhancedPrompt?: string) => void;
  deletePrompt: (id: string) => void;
  togglePinPrompt: (id: string) => void;
  
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  setActiveImage: (image: GeneratedImage | null) => void;
  openImageExplicitly: (image: GeneratedImage) => Promise<string>;
  setEditingSeedImage: (seedUrl: string | null) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setSettingsOpen: (isOpen: boolean) => void;
  
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
  
  clearAllHistory: () => Promise<void>;
  setImportedState: (images: GeneratedImage[], prompts: PromptHistoryItem[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      images: [],
      prompts: [],
      favorites: [],
      pinnedPrompts: [],
      isHydrated: false,

      settings: {
        defaultModel: "gpt-image-2",
        defaultAspectRatio: "1:1",
        defaultSize: "1024x1024",
        imageCount: 1,
        autoEnhance: true,
        quality: "auto",
        outputFormat: "png",
      },

      activeImage: null,
      editingSeedImage: null,
      isSidebarOpen: false,
      isSettingsOpen: false,
      toasts: [],

      /**
       * Add generated images to state & IndexedDB
       * Stores Blobs in IndexedDB without creating Object URLs during startup/generation.
       */
      addImages: async (newImages) => {
        const preparedImages: GeneratedImage[] = [];

        for (const img of newImages) {
          if (img.url) {
            // Save Blob to IndexedDB. Do NOT generate Object URLs for the whole gallery!
            await saveImageBlobsToIDB(img.id, img.url);
            preparedImages.push({
              ...img,
              url: "", // Lazy: Object URLs created only on explicit user request
              thumbnailUrl: "",
            });
          } else {
            preparedImages.push(img);
          }
        }

        set((state) => {
          let updatedImages = [...preparedImages, ...state.images];

          // Automatic cleanup: keep max MAX_IMAGE_HISTORY items
          if (updatedImages.length > MAX_IMAGE_HISTORY) {
            for (let i = updatedImages.length - 1; i >= 0 && updatedImages.length > MAX_IMAGE_HISTORY; i--) {
              const item = updatedImages[i];
              if (!state.favorites.includes(item.id)) {
                revokeImageObjectUrls(item.id);
                deleteImageBlobsFromIDB(item.id);
                updatedImages.splice(i, 1);
              }
            }
          }

          return { images: updatedImages };
        });
      },

      deleteImage: async (id) => {
        revokeImageObjectUrls(id);
        await deleteImageBlobsFromIDB(id);

        set((state) => ({
          images: state.images.filter((img) => img.id !== id),
          favorites: state.favorites.filter((favId) => favId !== id),
          activeImage: state.activeImage?.id === id ? null : state.activeImage,
        }));
      },

      toggleFavorite: (id) => {
        set((state) => {
          const isFav = state.favorites.includes(id);
          const updatedFavs = isFav
            ? state.favorites.filter((favId) => favId !== id)
            : [...state.favorites, id];
          
          const updatedImages = state.images.map((img) =>
            img.id === id ? { ...img, isFavorite: !isFav } : img
          );

          return {
            favorites: updatedFavs,
            images: updatedImages,
            activeImage: state.activeImage?.id === id ? { ...state.activeImage, isFavorite: !isFav } : state.activeImage,
          };
        });
      },

      addPrompt: (promptText, enhancedPrompt) => {
        if (!promptText.trim()) return;
        set((state) => {
          const filtered = state.prompts.filter(
            (p) => p.prompt.toLowerCase() !== promptText.toLowerCase()
          );
          const newItem: PromptHistoryItem = {
            id: `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            prompt: promptText.trim(),
            enhancedPrompt,
            timestamp: Date.now(),
          };
          return {
            prompts: [newItem, ...filtered],
          };
        });
      },

      deletePrompt: (id) => {
        set((state) => ({
          prompts: state.prompts.filter((p) => p.id !== id),
          pinnedPrompts: state.pinnedPrompts.filter((pinId) => pinId !== id),
        }));
      },

      togglePinPrompt: (id) => {
        set((state) => {
          const isPinned = state.pinnedPrompts.includes(id);
          const updatedPinned = isPinned
            ? state.pinnedPrompts.filter((pinId) => pinId !== id)
            : [...state.pinnedPrompts, id];

          const updatedPrompts = state.prompts.map((p) =>
            p.id === id ? { ...p, isPinned: !isPinned } : p
          );

          return {
            pinnedPrompts: updatedPinned,
            prompts: updatedPrompts,
          };
        });
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      setActiveImage: (image) => set({ activeImage: image }),

      /**
       * EXPLICIT ACTION TRIGGER:
       * Generates and caches an Object URL ONLY when the user explicitly clicks/opens/edits an image.
       */
      openImageExplicitly: async (image) => {
        const objectUrl = await getLazyObjectURL(image.id, false);
        const resolved = { ...image, url: objectUrl };
        set({ activeImage: resolved });
        return objectUrl;
      },

      setEditingSeedImage: (seedUrl) => set({ editingSeedImage: seedUrl }),
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),

      addToast: (toast) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }],
        }));
        setTimeout(() => {
          get().removeToast(id);
        }, 4000);
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      clearAllHistory: async () => {
        revokeAllObjectUrls();
        await clearAllImagesFromIDB();

        set({
          images: [],
          prompts: [],
          favorites: [],
          pinnedPrompts: [],
          activeImage: null,
        });
      },

      setImportedState: (importedImages, importedPrompts) => {
        set((state) => ({
          images: [...importedImages, ...state.images],
          prompts: [...importedPrompts, ...state.prompts],
        }));
      },
    }),
    {
      name: "gpt_image_2_lazy_metadata_v4",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        images: state.images.map((img) => ({
          ...img,
          url: "", // NO Object URLs in localStorage
          thumbnailUrl: "",
        })),
        prompts: state.prompts,
        favorites: state.favorites,
        pinnedPrompts: state.pinnedPrompts,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        // Startup/hydration: DO NOT create Object URLs for gallery!
        if (state) {
          state.isHydrated = true;
        }
      },
    }
  )
);
