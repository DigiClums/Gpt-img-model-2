"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import {
  X,
  History,
  Pin,
  Heart,
  Search,
  Trash2,
  Download,
  Upload,
} from "lucide-react";
import { formatDate } from "@/utils";
import { exportHistoryBackup, importHistoryBackup } from "@/utils/exportImport";

interface SidebarProps {
  onSelectPrompt: (prompt: string) => void;
}

export function Sidebar({ onSelectPrompt }: SidebarProps) {
  const {
    isSidebarOpen,
    setSidebarOpen,
    images,
    prompts,
    favorites,
    pinnedPrompts,
    deletePrompt,
    togglePinPrompt,
    setActiveImage,
    clearAllHistory,
    addToast,
    setImportedState,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<"history" | "pinned" | "favorites">("history");
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isSidebarOpen) return null;

  const filteredPrompts = prompts.filter((p) =>
    p.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteImages = images.filter((img) => favorites.includes(img.id));
  const pinnedPromptItems = prompts.filter((p) => pinnedPrompts.includes(p.id));

  const handleExport = async () => {
    addToast({
      type: "info",
      title: "Exporting History",
      message: "Creating backup JSON payload...",
    });
    const ok = await exportHistoryBackup(images, prompts);
    if (ok) {
      addToast({
        type: "success",
        title: "Export Complete",
        message: "History backup saved to downloads.",
      });
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addToast({
      type: "info",
      title: "Importing History",
      message: "Reading backup file & storing image blobs...",
    });

    const result = await importHistoryBackup(file);
    if (result.success && result.images && result.prompts) {
      setImportedState(result.images, result.prompts);
      addToast({
        type: "success",
        title: "Import Complete",
        message: `Restored ${result.images.length} images & ${result.prompts.length} prompts.`,
      });
    } else {
      addToast({
        type: "error",
        title: "Import Failed",
        message: result.error || "Failed to parse backup file.",
      });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/75 backdrop-blur-md">
        {/* Hidden import file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportFile}
          accept=".json,application/json"
          className="hidden"
        />

        {/* Backdrop Click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={() => setSidebarOpen(false)}
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 250 }}
          className="relative z-10 w-full max-w-md h-full bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col justify-between"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-lg text-white">Library & History</h2>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950 text-xs text-zinc-200 placeholder-zinc-500 border border-zinc-800 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "history"
                    ? "bg-zinc-800 text-emerald-400 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                History ({prompts.length})
              </button>
              <button
                onClick={() => setActiveTab("pinned")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "pinned"
                    ? "bg-zinc-800 text-amber-400 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Pinned ({pinnedPromptItems.length})
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "favorites"
                    ? "bg-zinc-800 text-red-400 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Favorites ({favoriteImages.length})
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeTab === "history" && (
              <div className="space-y-2">
                {filteredPrompts.length === 0 ? (
                  <p className="text-center py-12 text-zinc-500 text-xs">
                    No prompt history recorded yet.
                  </p>
                ) : (
                  filteredPrompts.map((p) => {
                    const isPinned = pinnedPrompts.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          onSelectPrompt(p.prompt);
                          setSidebarOpen(false);
                        }}
                        className="group flex items-start justify-between p-3 rounded-xl bg-zinc-950/70 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-emerald-500/30 cursor-pointer transition-all"
                      >
                        <div className="flex-1 pr-2 space-y-1">
                          <p className="text-xs text-zinc-200 group-hover:text-white line-clamp-2 leading-snug">
                            {p.prompt}
                          </p>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {formatDate(p.timestamp)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePinPrompt(p.id);
                            }}
                            className={`p-1 rounded-md transition-colors cursor-pointer ${
                              isPinned
                                ? "text-amber-400 bg-amber-400/10"
                                : "text-zinc-500 hover:text-amber-400"
                            }`}
                            title={isPinned ? "Unpin prompt" : "Pin prompt"}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePrompt(p.id);
                            }}
                            className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete prompt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === "pinned" && (
              <div className="space-y-2">
                {pinnedPromptItems.length === 0 ? (
                  <p className="text-center py-12 text-zinc-500 text-xs">
                    No pinned prompts yet. Pin your favorite prompts for quick access!
                  </p>
                ) : (
                  pinnedPromptItems.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectPrompt(p.prompt);
                        setSidebarOpen(false);
                      }}
                      className="group flex items-start justify-between p-3 rounded-xl bg-zinc-950/70 hover:bg-zinc-800/80 border border-amber-500/30 cursor-pointer transition-all"
                    >
                      <div className="flex-1 pr-2 space-y-1">
                        <p className="text-xs text-zinc-200 group-hover:text-white line-clamp-2">
                          {p.prompt}
                        </p>
                        <span className="text-[10px] text-amber-400 font-mono">
                          Pinned Prompt
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinPrompt(p.id);
                        }}
                        className="p-1 rounded-md text-amber-400 hover:text-zinc-400 cursor-pointer"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "favorites" && (
              <div className="grid grid-cols-2 gap-2.5">
                {favoriteImages.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-zinc-500 text-xs">
                    No favorite images saved. Click the heart icon on any generated image to add it here.
                  </div>
                ) : (
                  favoriteImages.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => {
                        setActiveImage(img);
                        setSidebarOpen(false);
                      }}
                      className="group relative rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 hover:border-red-500/50 cursor-pointer transition-all"
                    >
                      <img
                        src={img.thumbnailUrl || img.url}
                        alt={img.prompt}
                        className="w-full aspect-square object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-zinc-950/80 text-red-400">
                        <Heart className="w-3.5 h-3.5 fill-red-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 border-t border-zinc-800 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExport}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
                title="Export History Backup JSON"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
                title="Import History Backup JSON"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Import JSON</span>
              </button>
            </div>

            {(images.length > 0 || prompts.length > 0) && (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to clear all generation history?")) {
                    clearAllHistory();
                    addToast({
                      type: "info",
                      title: "History Cleared",
                      message: "All history items have been deleted.",
                    });
                  }
                }}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Entire History</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
