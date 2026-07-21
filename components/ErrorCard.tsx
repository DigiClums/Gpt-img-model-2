"use client";

import React from "react";
import { AlertCircle, RefreshCw, Key } from "lucide-react";

interface ErrorCardProps {
  error: string;
  code?: number | string;
  onRetry: () => void;
}

export function ErrorCard({ error, code, onRetry }: ErrorCardProps) {
  const isKeyError = code === 401 || error.toLowerCase().includes("key") || error.toLowerCase().includes("env");

  return (
    <div className="w-full max-w-xl mx-auto my-8 p-6 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-200 shadow-2xl backdrop-blur-xl space-y-4 animate-fade-in">
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0 mt-0.5">
          {isKeyError ? <Key className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-red-100">
              {isKeyError ? "API Key Configuration Required" : "Generation Failed"}
            </h3>
            {code && (
              <span className="px-2 py-0.5 rounded-md font-mono text-xs bg-red-950 text-red-400 border border-red-500/30">
                HTTP {code}
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-red-200/90 leading-relaxed">
            {error}
          </p>

          {isKeyError && (
            <div className="mt-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 space-y-1 font-mono">
              <p className="text-emerald-400 font-semibold">How to fix:</p>
              <p>1. Open <code className="text-amber-300 font-bold">.env.local</code> in project root.</p>
              <p>2. Add: <code className="text-emerald-300">OPENAI_API_KEY=your_actual_key</code></p>
              <p>3. Restart dev server (<code className="text-cyan-300">npm run dev</code>)</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-red-500/20">
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-zinc-950 font-bold text-xs transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}
