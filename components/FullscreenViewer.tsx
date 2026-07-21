"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import {
  X,
  Download,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Heart,
  Trash2,
} from "lucide-react";
import { formatDate, downloadImage, copyToClipboard } from "@/utils";
import { OutputFormat } from "@/types";

export function FullscreenViewer() {
  const {
    activeImage,
    setActiveImage,
    deleteImage,
    toggleFavorite,
    settings,
    addToast,
  } = useAppStore();

  const [zoomLevel, setZoomLevel] = useState(1);
  const [copied, setCopied] = useState(false);
  const [chosenFormat, setChosenFormat] = useState<OutputFormat>(settings.outputFormat || "png");

  if (!activeImage) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  const handleCopy = async () => {
    const ok = await copyToClipboard(activeImage.prompt);
    if (ok) {
      setCopied(true);
      addToast({
        type: "success",
        title: "Copied!",
        message: "Prompt copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    const ok = await downloadImage(activeImage.url, activeImage.prompt, chosenFormat);
    if (ok) {
      addToast({
        type: "success",
        title: "Download Started",
        message: `Image saved in .${chosenFormat} format.`,
      });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/95 backdrop-blur-2xl">
        {/* Backdrop click */}
        <div className="absolute inset-0" onClick={() => setActiveImage(null)} />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-6xl max-h-[92vh] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={() => setActiveImage(null)}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur-md border border-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Canvas Image View */}
          <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden min-h-[350px] md:min-h-[550px]">
            
            {/* Zoom Controls Overlay */}
            <div className="absolute top-4 left-4 z-20 flex items-center space-x-1 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-md">
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <span className="px-2 text-[10px] font-mono text-zinc-400">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>

            {/* Display Image */}
            <motion.img
              src={activeImage.url}
              alt={activeImage.prompt}
              style={{ scale: zoomLevel }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl cursor-grab active:cursor-grabbing select-none"
            />
          </div>

          {/* Right Info Sidebar */}
          <div className="w-full md:w-96 p-6 bg-zinc-900 flex flex-col justify-between space-y-6 overflow-y-auto border-t md:border-t-0 md:border-l border-zinc-800">
            <div className="space-y-5">
              {/* Header Badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {activeImage.model}
                </span>
                <span className="text-xs text-zinc-500">
                  {formatDate(activeImage.createdAt)}
                </span>
              </div>

              {/* Prompt Text */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Prompt
                </h4>
                <p className="text-xs sm:text-sm text-zinc-100 leading-relaxed font-normal bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                  {activeImage.prompt}
                </p>
              </div>

              {/* Enhanced Prompt */}
              {activeImage.enhancedPrompt && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Enhanced Prompt
                  </h4>
                  <p className="text-xs text-zinc-400 italic bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
                    "{activeImage.enhancedPrompt}"
                  </p>
                </div>
              )}

              {/* Specs Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/60">
                  <span className="text-zinc-500 block mb-0.5">Size</span>
                  <span className="font-mono text-zinc-200 font-semibold">{activeImage.size}</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/60">
                  <span className="text-zinc-500 block mb-0.5">Aspect Ratio</span>
                  <span className="font-mono text-zinc-200 font-semibold">{activeImage.aspectRatio}</span>
                </div>
              </div>

              {/* Output Format Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Download Format
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
                  {(["png", "jpeg", "webp"] as OutputFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setChosenFormat(fmt)}
                      className={`py-1 rounded-lg text-xs font-mono font-semibold uppercase transition-all cursor-pointer ${
                        chosenFormat === fmt
                          ? "bg-emerald-500 text-zinc-950 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t border-zinc-800">
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download .{chosenFormat.toUpperCase()}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-all cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copied ? "Copied!" : "Copy Prompt"}</span>
                </button>

                <button
                  onClick={() => toggleFavorite(activeImage.id)}
                  className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeImage.isFavorite
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${activeImage.isFavorite ? "fill-red-400" : ""}`} />
                  <span>{activeImage.isFavorite ? "Favorited" : "Favorite"}</span>
                </button>
              </div>

              <button
                onClick={() => {
                  deleteImage(activeImage.id);
                  setActiveImage(null);
                  addToast({
                    type: "info",
                    title: "Deleted",
                    message: "Image removed from history.",
                  });
                }}
                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-red-400 hover:bg-red-500/10 text-xs font-medium transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Image</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
