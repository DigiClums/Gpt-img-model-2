"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateImageSchema, GenerateImageSchemaInput } from "@/lib/validations";
import { useAppStore } from "@/store/useAppStore";
import { GenerateButton } from "./GenerateButton";
import {
  Upload,
  X,
  Zap,
  Sparkles,
} from "lucide-react";
import { AspectRatio } from "@/types";

interface PromptBoxProps {
  onGenerate: (data: GenerateImageSchemaInput) => void;
  isLoading: boolean;
  promptValue: string;
  setPromptValue: (val: string) => void;
}

export function PromptBox({
  onGenerate,
  isLoading,
  promptValue,
  setPromptValue,
}: PromptBoxProps) {
  const { settings, updateSettings, editingSeedImage, setEditingSeedImage } =
    useAppStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
  } = useForm<GenerateImageSchemaInput>({
    resolver: zodResolver(generateImageSchema),
    defaultValues: {
      prompt: promptValue,
      aspectRatio: settings.defaultAspectRatio,
      size: settings.defaultSize,
      model: "gpt-image-2",
      n: settings.imageCount,
      autoEnhance: settings.autoEnhance,
      image: editingSeedImage || undefined,
    },
  });

  const currentPrompt = watch("prompt");
  const currentAspectRatio = watch("aspectRatio");
  const currentCount = watch("n");
  const currentAutoEnhance = watch("autoEnhance");

  useEffect(() => {
    setValue("prompt", promptValue);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [promptValue, setValue]);

  useEffect(() => {
    setValue("image", editingSeedImage || undefined);
  }, [editingSeedImage, setValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isLoading && currentPrompt?.trim()) {
        handleSubmit(onFormSubmit)();
      }
    }
  };

  const onFormSubmit = (data: GenerateImageSchemaInput) => {
    onGenerate({
      ...data,
      model: "gpt-image-2",
      image: editingSeedImage || undefined,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setEditingSeedImage(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="w-full max-w-4xl mx-auto px-2 sm:px-4"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col rounded-3xl transition-all duration-300 shadow-2xl bg-zinc-900/90 border backdrop-blur-xl ${
          isDragging
            ? "border-emerald-400 ring-4 ring-emerald-500/20 bg-zinc-900"
            : "border-zinc-800 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20"
        }`}
      >
        {/* Drag Notice */}
        {isDragging && (
          <div className="absolute inset-0 z-20 rounded-3xl bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-emerald-400 font-semibold border-2 border-dashed border-emerald-400">
            <Upload className="w-8 h-8 mb-2 animate-bounce" />
            <span>Drop image here for gpt-image-2 editing</span>
          </div>
        )}

        {/* Uploaded Seed Image Chip */}
        {editingSeedImage && (
          <div className="p-3 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60 rounded-t-3xl">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900">
                <img
                  src={editingSeedImage}
                  alt="Seed input"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-emerald-400">
                  Image Editing Active (gpt-image-2)
                </span>
                <span className="text-[11px] text-zinc-400">
                  gpt-image-2 will edit and transform this seed image
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditingSeedImage(null)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Remove seed image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Prompt Textarea */}
        <div className="p-4">
          <textarea
            ref={textareaRef}
            id="prompt-textarea"
            value={currentPrompt}
            onChange={(e) => {
              setValue("prompt", e.target.value);
              setPromptValue(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              editingSeedImage
                ? "Describe how you want gpt-image-2 to edit this image..."
                : "Describe the image you want to generate with gpt-image-2..."
            }
            rows={2}
            className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 text-sm sm:text-base font-normal resize-none focus:outline-none max-h-48 leading-relaxed"
          />
        </div>

        {/* Toolbar Controls */}
        <div className="px-4 pb-3 pt-2 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-3">
          
          {/* Left Toolbar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                editingSeedImage
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white"
              }`}
              title="Upload image for editing"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {editingSeedImage ? "Change Image" : "Upload Image"}
              </span>
            </button>

            {/* Aspect Ratio Selector */}
            <div className="flex items-center p-0.5 rounded-xl bg-zinc-950 border border-zinc-800">
              {(["1:1", "16:9", "9:16"] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setValue("aspectRatio", ratio)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                    currentAspectRatio === ratio
                      ? "bg-emerald-500 text-zinc-950 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>

            {/* Count Selector */}
            <div className="flex items-center p-0.5 rounded-xl bg-zinc-950 border border-zinc-800">
              {[1, 2, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setValue("n", count)}
                  className={`px-2 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                    currentCount === count
                      ? "bg-emerald-500 text-zinc-950 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {count}x
                </button>
              ))}
            </div>

            {/* Auto Enhance Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextVal = !currentAutoEnhance;
                setValue("autoEnhance", nextVal);
                updateSettings({ autoEnhance: nextVal });
              }}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                currentAutoEnhance
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-zinc-950 text-zinc-400 border-zinc-800"
              }`}
              title="Toggle Auto Prompt Enhancer"
            >
              <Zap className={`w-3 h-3 ${currentAutoEnhance ? "text-amber-400" : ""}`} />
              <span>Enhance {currentAutoEnhance ? "ON" : "OFF"}</span>
            </button>
          </div>

          {/* Right Action */}
          <div className="flex items-center space-x-3 ml-auto">
            <span className="hidden md:inline-flex items-center text-[10px] text-zinc-500 font-mono">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 mr-1">
                Ctrl
              </kbd>
              +
              <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 mx-1">
                Enter
              </kbd>
            </span>

            <GenerateButton
              isLoading={isLoading}
              disabled={!currentPrompt?.trim()}
              text={editingSeedImage ? "Edit Image" : "Generate"}
            />
          </div>

        </div>
      </div>
    </form>
  );
}
