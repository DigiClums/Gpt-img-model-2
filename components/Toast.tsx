"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex items-start justify-between p-4 rounded-2xl bg-zinc-900/95 border border-zinc-800 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-start space-x-3 pr-2">
              {t.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              {t.type === "error" && (
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              {t.type === "warning" && (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              {t.type === "info" && (
                <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              )}

              <div className="flex flex-col">
                <span className="font-semibold text-xs text-white">
                  {t.title}
                </span>
                {t.message && (
                  <span className="text-[11px] text-zinc-400 mt-0.5 leading-normal">
                    {t.message}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
