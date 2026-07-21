"use client";

import React from "react";
import { GeneratedImage } from "@/types";
import { ImageCard } from "./ImageCard";
import { Download, Sparkles } from "lucide-react";
import { downloadAllImages } from "@/utils";
import { useAppStore } from "@/store/useAppStore";

interface ImageGridProps {
  images: GeneratedImage[];
  onRegenerate: (prompt: string, aspectRatio: any) => void;
  onEditImage?: (image: GeneratedImage) => void;
}

export function ImageGrid({ images, onRegenerate, onEditImage }: ImageGridProps) {
  const { settings, addToast } = useAppStore();

  const handleDownloadAll = async () => {
    addToast({
      type: "info",
      title: "Batch Download Started",
      message: `Downloading ${images.length} images...`,
    });
    await downloadAllImages(images, settings.outputFormat);
  };

  return (
    <div className="w-full space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h2 className="font-bold text-base text-zinc-100">
            Generated Images ({images.length})
          </h2>
        </div>

        {images.length > 1 && (
          <button
            onClick={handleDownloadAll}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All ({images.length})</span>
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((img) => (
          <ImageCard
            key={img.id}
            image={img}
            onRegenerate={onRegenerate}
            onEditImage={onEditImage}
          />
        ))}
      </div>
    </div>
  );
}
