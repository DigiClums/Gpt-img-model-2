"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GeneratedImage } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import {
  Download,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Maximize2,
  Heart,
  Info,
  Sliders,
} from "lucide-react";
import { formatDate, downloadImage, copyToClipboard } from "@/utils";
import { getLazyObjectURL } from "@/lib/db";

interface ImageCardProps {
  image: GeneratedImage;
  onRegenerate: (prompt: string, aspectRatio: any) => void;
  onEditImage?: (image: GeneratedImage) => void;
}

export function ImageCard({ image, onRegenerate, onEditImage }: ImageCardProps) {
  const {
    deleteImage,
    toggleFavorite,
    openImageExplicitly,
    settings,
    addToast,
  } = useAppStore();

  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [cardSrc, setCardSrc] = useState<string>(image.thumbnailUrl || image.url || "");

  // Lazily resolve thumbnail URL for card preview on mount if needed
  useEffect(() => {
    let isMounted = true;
    if (!cardSrc) {
      getLazyObjectURL(image.id, true).then((thumbUrl) => {
        if (isMounted && thumbUrl) {
          setCardSrc(thumbUrl);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [image.id, cardSrc]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(image.prompt);
    if (success) {
      setCopied(true);
      addToast({
        type: "success",
        title: "Prompt Copied",
        message: "Copied prompt to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCardClick = async () => {
    await openImageExplicitly(image);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    // Explicit action: fetch full resolution Object URL on-demand
    const fullUrl = await getLazyObjectURL(image.id, false);
    const ok = await downloadImage(fullUrl || cardSrc, image.prompt, settings.outputFormat);
    setIsDownloading(false);
    if (ok) {
      addToast({
        type: "success",
        title: "Download Started",
        message: `Image saved as .${settings.outputFormat}`,
      });
    }
  };

  const isFav = image.isFavorite;

  const aspectClass =
    image.aspectRatio === "16:9"
      ? "aspect-[16/9]"
      : image.aspectRatio === "9:16"
      ? "aspect-[9/16]"
      : "aspect-square";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className="group relative flex flex-col rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-emerald-500/40 transition-all duration-300 shadow-xl overflow-hidden"
    >
      {/* Image View Area */}
      <div
        onClick={handleCardClick}
        className={`relative w-full ${aspectClass} overflow-hidden cursor-pointer bg-zinc-950`}
      >
        {cardSrc ? (
          <img
            src={cardSrc}
            alt={image.prompt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-zinc-600 text-xs font-mono">
            Loading preview...
          </div>
        )}

        {/* Favorite heart badge top right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(image.id);
          }}
          className={`absolute top-3 right-3 z-10 p-2 rounded-xl backdrop-blur-md transition-all shadow-md cursor-pointer ${
            isFav
              ? "bg-red-500/20 border border-red-500/40 text-red-400"
              : "bg-zinc-950/60 border border-zinc-800 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100"
          }`}
          title={isFav ? "Remove favorite" : "Add to favorites"}
        >
          <Heart className={`w-4 h-4 ${isFav ? "fill-red-400" : ""}`} />
        </button>

        {/* Top Left Spec Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="px-2 py-0.5 rounded-md bg-zinc-950/80 backdrop-blur-md text-[10px] font-mono text-zinc-300 border border-zinc-700/50">
            {image.size}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 backdrop-blur-md text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
            {image.model || "gpt-image-2"}
          </span>
        </div>

        {/* Hover Action Bar */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-between pointer-events-none group-hover:pointer-events-auto">
          <div />

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-300 font-medium">
              {formatDate(image.createdAt)}
            </span>

            <div className="flex items-center space-x-1.5">
              {/* Zoom */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick();
                }}
                className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                title="Fullscreen view"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Copy Prompt */}
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                title="Copy prompt"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              {/* Edit Image */}
              {onEditImage && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const fullUrl = await getLazyObjectURL(image.id, false);
                    onEditImage({ ...image, url: fullUrl });
                  }}
                  className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-cyan-400 hover:text-cyan-300 transition-all active:scale-95 cursor-pointer"
                  title="Edit image with gpt-image-2"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              )}

              {/* Regenerate */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate(image.prompt, image.aspectRatio);
                }}
                className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 transition-all active:scale-95 cursor-pointer"
                title="Regenerate"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Download */}
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-all active:scale-95 cursor-pointer"
                title="Download image"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteImage(image.id);
                }}
                className="p-2 rounded-lg bg-zinc-900/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
                title="Delete image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Container */}
      <div className="p-4 space-y-2">
        <p className="text-sm text-zinc-200 line-clamp-2 leading-snug font-normal">
          {image.prompt}
        </p>

        {image.enhancedPrompt && (
          <div className="pt-1">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <Info className="w-3 h-3" />
              <span>{showDetails ? "Hide Enhanced Prompt" : "Show Enhanced Prompt"}</span>
            </button>
            {showDetails && (
              <p className="mt-1.5 p-2 rounded-lg bg-zinc-950 text-[11px] text-zinc-400 italic border border-zinc-800/80">
                "{image.enhancedPrompt}"
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
