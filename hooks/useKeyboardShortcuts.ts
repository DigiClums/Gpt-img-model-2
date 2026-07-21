"use client";

import { useEffect } from "react";

interface ShortcutHandlers {
  onGenerate?: () => void;
  onFocusPrompt?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts({
  onGenerate,
  onFocusPrompt,
  onEscape,
}: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Ctrl + Enter -> Generate
      if (isCtrlOrCmd && e.key === "Enter") {
        if (onGenerate) {
          e.preventDefault();
          onGenerate();
        }
      }

      // Ctrl + K -> Focus prompt
      if (isCtrlOrCmd && (e.key === "k" || e.key === "K")) {
        if (onFocusPrompt) {
          e.preventDefault();
          onFocusPrompt();
        }
      }

      // Esc -> Close modal / viewer / drawer
      if (e.key === "Escape") {
        if (onEscape) {
          onEscape();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onGenerate, onFocusPrompt, onEscape]);
}
