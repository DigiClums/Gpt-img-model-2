"use client";

import React from "react";
import { Sparkles, History, Sliders, Command } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function Navbar() {
  const {
    images,
    isSidebarOpen,
    setSidebarOpen,
    setSettingsOpen,
  } = useAppStore();

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-zinc-950/85 border-b border-zinc-800/60 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="relative group cursor-pointer flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 shadow-md shadow-emerald-950/50">
            <Sparkles className="w-5 h-5 text-white transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 rounded-xl bg-emerald-400/20 blur group-hover:blur-md transition-all" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">
                ChatGPT <span className="text-emerald-400">Images</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                gpt-image-2
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">
              OpenAI Official GPT Image 2 Generator
            </span>
          </div>
        </div>

        {/* Right Navigation & Tools */}
        <div className="flex items-center space-x-2">
          <div className="hidden md:flex items-center px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
            <Command className="w-3 h-3 mr-1 text-zinc-500" />
            <span>K for search</span>
          </div>

          {/* History Sidebar Button */}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 hover:text-white border border-zinc-800 transition-all active:scale-95 cursor-pointer"
            title="Open History & Saved Images"
          >
            <History className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">History</span>
            {images.length > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                {images.length}
              </span>
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-all active:scale-95 cursor-pointer"
            title="Open Generator Settings"
          >
            <Sliders className="w-4.5 h-4.5 text-zinc-300" />
          </button>
        </div>

      </div>
    </header>
  );
}
