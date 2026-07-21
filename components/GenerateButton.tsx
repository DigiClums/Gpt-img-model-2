"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

interface GenerateButtonProps {
  isLoading: boolean;
  disabled?: boolean;
  onClick?: () => void;
  text?: string;
}

export function GenerateButton({
  isLoading,
  disabled = false,
  onClick,
  text = "Generate",
}: GenerateButtonProps) {
  const isBtnDisabled = disabled || isLoading;

  return (
    <motion.button
      whileHover={!isBtnDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isBtnDisabled ? { scale: 0.98 } : undefined}
      type="button"
      onClick={onClick}
      disabled={isBtnDisabled}
      className={`relative group flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-xl ${
        isBtnDisabled
          ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
          : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-950/50 hover:shadow-emerald-500/20 border border-emerald-400/30 cursor-pointer"
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 text-zinc-950 transition-transform group-hover:rotate-12" />
          <span>{text}</span>
        </>
      )}

      {!isBtnDisabled && (
        <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </motion.button>
  );
}
