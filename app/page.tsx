"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { PromptBox } from "@/components/PromptBox";
import { Gallery } from "@/components/Gallery";
import { FullscreenViewer } from "@/components/FullscreenViewer";
import { Settings } from "@/components/Settings";
import { ToastContainer } from "@/components/Toast";
import { Footer } from "@/components/Footer";
import { useAppStore } from "@/store/useAppStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { GenerateImageSchemaInput } from "@/lib/validations";
import { GeneratedImage, AspectRatio } from "@/types";
import { aspectRatioToSize } from "@/utils";

export default function Home() {
  const {
    images,
    addImages,
    addPrompt,
    settings,
    editingSeedImage,
    setEditingSeedImage,
    setActiveImage,
    setSidebarOpen,
    setSettingsOpen,
    addToast,
  } = useAppStore();

  const [promptValue, setPromptValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; code?: number | string } | null>(null);
  const [lastRequestData, setLastRequestData] = useState<GenerateImageSchemaInput | null>(null);

  // Global Keyboard Shortcuts
  useKeyboardShortcuts({
    onFocusPrompt: () => {
      const el = document.getElementById("prompt-textarea");
      if (el) el.focus();
    },
    onEscape: () => {
      setActiveImage(null);
      setSidebarOpen(false);
      setSettingsOpen(false);
    },
  });

  const handleGenerate = async (formData: GenerateImageSchemaInput) => {
    if (!formData.prompt.trim()) {
      setError({ message: "Please enter a description for the image you want to generate." });
      return;
    }

    setError(null);
    setIsLoading(true);
    setLastRequestData(formData);

    const targetSize = aspectRatioToSize(formData.aspectRatio as AspectRatio);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: formData.prompt.trim(),
          aspectRatio: formData.aspectRatio,
          size: targetSize,
          model: "gpt-image-2",
          n: formData.n,
          autoEnhance: formData.autoEnhance,
          image: editingSeedImage || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw {
          message: data.error || "Failed to generate image.",
          code: data.code || response.status,
        };
      }

      const generatedList: GeneratedImage[] = (data.images || []).map(
        (item: { url: string; revisedPrompt?: string }, idx: number) => ({
          id: `img_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          prompt: formData.prompt.trim(),
          enhancedPrompt: data.enhancedPrompt || item.revisedPrompt,
          url: item.url,
          createdAt: Date.now() + idx,
          aspectRatio: formData.aspectRatio as AspectRatio,
          size: targetSize,
          model: "gpt-image-2",
          format: settings.outputFormat || "png",
          isEdited: !!editingSeedImage,
          originalImage: editingSeedImage || undefined,
          isFavorite: false,
        })
      );

      if (generatedList.length > 0) {
        await addImages(generatedList);
        addPrompt(formData.prompt.trim(), data.enhancedPrompt);
        setEditingSeedImage(null);

        addToast({
          type: "success",
          title: "Image Generation Complete",
          message: `Generated ${generatedList.length} image(s) with gpt-image-2.`,
        });
      }
    } catch (err: any) {
      console.error("[Home handleGenerate Error]:", err);
      const errMsg = err?.message || "Failed to connect to OpenAI gpt-image-2 endpoint.";
      const errCode = err?.code || 500;

      setError({ message: errMsg, code: errCode });
      addToast({
        type: "error",
        title: "Generation Error",
        message: errMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPrompt = (selectedText: string) => {
    setPromptValue(selectedText);
    setError(null);
  };

  const handleRegenerate = (promptText: string, ratio: AspectRatio) => {
    setPromptValue(promptText);
    setError(null);
    handleGenerate({
      prompt: promptText,
      aspectRatio: ratio || settings.defaultAspectRatio,
      size: aspectRatioToSize(ratio || settings.defaultAspectRatio),
      model: "gpt-image-2",
      n: settings.imageCount,
      quality: settings.quality || "auto",
      autoEnhance: settings.autoEnhance,
    });
  };

  const handleEditImage = (img: GeneratedImage) => {
    setEditingSeedImage(img.url);
    setPromptValue(`Modify image: ${img.prompt}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    addToast({
      type: "info",
      title: "Image Edit Mode",
      message: "Seed image attached for gpt-image-2 editing.",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d0e] text-zinc-100 selection:bg-emerald-500 selection:text-zinc-950">
      {/* Header Navigation */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col space-y-6">
        
        {/* Fixed Top Prompt Input Bar */}
        <section className="sticky top-20 z-20 py-2">
          <PromptBox
            onGenerate={handleGenerate}
            isLoading={isLoading}
            promptValue={promptValue}
            setPromptValue={setPromptValue}
          />
        </section>

        {/* Canvas / Gallery View */}
        <section className="flex-1 flex flex-col justify-center">
          <Gallery
            images={images}
            isLoading={isLoading}
            error={error}
            onRetry={() => {
              if (lastRequestData) handleGenerate(lastRequestData);
            }}
            onSelectPrompt={handleSelectPrompt}
            onRegenerate={handleRegenerate}
            onEditImage={handleEditImage}
          />
        </section>
      </main>

      {/* Drawer & Modal Overlays */}
      <Sidebar onSelectPrompt={handleSelectPrompt} />
      <FullscreenViewer />
      <Settings />
      <ToastContainer />

      {/* Footer */}
      <Footer />
    </div>
  );
}
