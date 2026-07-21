"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Cpu } from "lucide-react";

interface LoadingProps {
  message?: string;
}

const MESSAGES = [
  "Connecting to OpenAI gpt-image-2 API...",
  "Analyzing composition and lighting...",
  "Synthesizing high-resolution canvas...",
  "Refining textures & details with gpt-image-2...",
  "Finalizing your AI masterpiece...",
];

export function LoadingSpinner({ message }: LoadingProps) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % MESSAGES.length);
    }, 2500);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return 92;
        return prev + Math.floor(Math.random() * 8 + 3);
      });
    }, 800);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto my-12 p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
      {/* Icon & Glow Aura */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
        
        <div className="relative p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
          <Sparkles className="absolute w-4 h-4 text-emerald-300 animate-bounce top-2 right-2" />
        </div>
      </div>

      {/* Message & Model Tag */}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-zinc-100 transition-all duration-300">
          {message || MESSAGES[msgIdx]}
        </h3>
        <p className="text-xs text-zinc-400 font-mono">
          Model Engine: <span className="text-emerald-400 font-bold">gpt-image-2</span>
        </p>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>Processing</span>
          <span>{progress}%</span>
        </div>

        <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full"
            initial={{ width: "10%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.5 }}
          />
        </div>
      </div>

      {/* Skeleton Shimmer Card */}
      <div className="w-full aspect-[16/9] rounded-2xl bg-zinc-950 border border-zinc-800/80 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-800/40 to-transparent animate-shimmer" />
        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
          <Cpu className="w-8 h-8 animate-pulse mb-2" />
          <span className="text-xs font-mono">Rendering Pixels with gpt-image-2...</span>
        </div>
      </div>
    </div>
  );
}
