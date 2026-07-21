"use client";

import React from "react";
import { Sparkles, Image as ImageIcon, Zap, Layers, Wand2, Lightbulb } from "lucide-react";

export const PROMPT_EXAMPLES = [
  "A futuristic cyberpunk city at sunset with neon reflections",
  "A realistic tiger wearing royal golden armor in a lush jungle",
  "Minimal flat geometric logo of an AI startup company",
  "Modern luxury architecture villa in Dubai with infinity pool",
  "Photorealistic astronaut drinking chai on Mars in hyper-detail",
  "Surreal floating island with crystal waterfalls during golden hour",
];

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 py-8">
      {/* Icon Badge */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
        <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700/60 shadow-2xl">
          <Wand2 className="w-10 h-10 text-emerald-400" />
        </div>
      </div>

      {/* Main Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
        What image would you like to create today?
      </h1>
      <p className="text-sm text-zinc-400 max-w-md leading-relaxed mb-6">
        Describe your vision using plain language. Powered by OpenAI’s official state-of-the-art <span className="text-emerald-400 font-semibold">gpt-image-2</span> model.
      </p>

      {/* Feature Pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 text-xs text-zinc-400">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
          <Zap className="w-3 h-3 text-amber-400 mr-1.5" /> High-Resolution Canvas
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
          <Layers className="w-3 h-3 text-emerald-400 mr-1.5" /> Aspect Ratios (1:1, 16:9, 9:16)
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
          <ImageIcon className="w-3 h-3 text-cyan-400 mr-1.5" /> gpt-image-2 Image Editing
        </span>
      </div>

      {/* Prompt Suggestions Grid */}
      <div className="w-full max-w-4xl mx-auto my-4 px-2">
        <div className="flex items-center space-x-2 mb-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider justify-center">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Try these prompt suggestions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {PROMPT_EXAMPLES.map((example, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPrompt(example)}
              className="group relative flex items-start space-x-3 p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-emerald-500/40 text-left transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
            >
              <div className="p-1.5 rounded-lg bg-zinc-800 group-hover:bg-emerald-500/20 text-zinc-400 group-hover:text-emerald-400 transition-colors">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs text-zinc-300 group-hover:text-white line-clamp-2 leading-relaxed font-normal">
                {example}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
