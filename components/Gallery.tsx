"use client";

import React from "react";
import { GeneratedImage } from "@/types";
import { ImageGrid } from "./ImageGrid";
import { LoadingSpinner } from "./Loading";
import { ErrorCard } from "./ErrorCard";
import { EmptyState } from "./EmptyState";

interface GalleryProps {
  images: GeneratedImage[];
  isLoading: boolean;
  error: { message: string; code?: number | string } | null;
  onRetry: () => void;
  onSelectPrompt: (prompt: string) => void;
  onRegenerate: (prompt: string, aspectRatio: any) => void;
  onEditImage?: (image: GeneratedImage) => void;
}

export function Gallery({
  images,
  isLoading,
  error,
  onRetry,
  onSelectPrompt,
  onRegenerate,
  onEditImage,
}: GalleryProps) {
  if (isLoading) {
    return <LoadingSpinner message="Generating high-resolution canvas with gpt-image-2..." />;
  }

  if (error) {
    return <ErrorCard error={error.message} code={error.code} onRetry={onRetry} />;
  }

  if (images.length === 0) {
    return <EmptyState onSelectPrompt={onSelectPrompt} />;
  }

  return (
    <ImageGrid
      images={images}
      onRegenerate={onRegenerate}
      onEditImage={onEditImage}
    />
  );
}
