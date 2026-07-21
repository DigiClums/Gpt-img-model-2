"use client";

import React from "react";
import { Sparkles, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full py-6 px-4 border-t border-zinc-900 bg-zinc-950/80 text-center text-xs text-zinc-500 space-y-2">
      <div className="flex items-center justify-center space-x-2">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-semibold text-zinc-300">ChatGPT Images (gpt-image-2)</span>
        <span>—</span>
        <span className="flex items-center text-emerald-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Server-side API protection
        </span>
      </div>
      <p>
        Personal Office Studio built with Next.js 15, React 19, TypeScript & OpenAI gpt-image-2 SDK.
      </p>
    </footer>
  );
}
