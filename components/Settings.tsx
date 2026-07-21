"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import {
  X,
  Sliders,
  Sparkles,
  Zap,
} from "lucide-react";
import { AspectRatio, OutputFormat } from "@/types";

export function Settings() {
  const { isSettingsOpen, setSettingsOpen, settings, updateSettings, addToast } =
    useAppStore();

  if (!isSettingsOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
        <div className="absolute inset-0" onClick={() => setSettingsOpen(false)} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-lg text-white">Generator Settings</h2>
            </div>
            <button
              onClick={() => setSettingsOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Model Status Card */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5" />
                Active Model Engine
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                gpt-image-2
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Exclusively utilizing OpenAI’s latest <code className="text-emerald-400 font-semibold">gpt-image-2</code> API model for superior photorealism, fine prompt fidelity, and image editing.
            </p>
          </div>

          {/* Auto Enhance Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div className="space-y-0.5">
              <span className="font-semibold text-sm text-white flex items-center">
                <Zap className="w-4 h-4 text-amber-400 mr-2" />
                Auto Prompt Enhancer
              </span>
              <p className="text-xs text-zinc-400">
                Automatically transforms simple prompts into rich, detailed cinematic prompts for gpt-image-2.
              </p>
            </div>
            <button
              onClick={() => {
                updateSettings({ autoEnhance: !settings.autoEnhance });
                addToast({
                  type: "info",
                  title: "Setting Updated",
                  message: `Auto Enhancer set to ${!settings.autoEnhance ? "ON" : "OFF"}.`,
                });
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                settings.autoEnhance ? "bg-emerald-500 justify-end" : "bg-zinc-800 justify-start"
              }`}
            >
              <motion.div
                layout
                className="w-4 h-4 rounded-full bg-zinc-950 shadow-md"
              />
            </button>
          </div>

          {/* Default Aspect Ratio */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Default Aspect Ratio & Dimensions
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["1:1", "16:9", "9:16"] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => updateSettings({ defaultAspectRatio: ratio })}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
                    settings.defaultAspectRatio === ratio
                      ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md"
                      : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Default Image Count */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Images Per Generation
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => updateSettings({ imageCount: count })}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
                    settings.imageCount === count
                      ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md"
                      : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {count} {count === 1 ? "Image" : "Images"}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Download Format */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Default Download Output Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["png", "jpeg", "webp"] as OutputFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => updateSettings({ outputFormat: fmt })}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-semibold uppercase transition-all cursor-pointer ${
                    settings.outputFormat === fmt
                      ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md"
                      : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  .{fmt}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setSettingsOpen(false)}
            className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-all cursor-pointer"
          >
            Done
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
