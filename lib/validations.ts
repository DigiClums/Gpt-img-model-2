import { z } from "zod";

export const generateImageSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt cannot be empty")
    .max(2000, "Prompt cannot exceed 2000 characters")
    .trim(),
  aspectRatio: z.enum(["1:1", "16:9", "9:16"]).default("1:1"),
  size: z.enum(["1024x1024", "1536x1024", "1024x1536"]).default("1024x1024"),
  model: z.string().default("gpt-image-2"),
  n: z.number().min(1).max(4).default(1),
  quality: z.enum(["low", "medium", "high", "auto"]).default("auto"),
  autoEnhance: z.boolean().default(true),
  image: z.string().optional().nullable(),
});

export const enhancePromptSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt cannot be empty")
    .max(1000, "Prompt too long for enhancement")
    .trim(),
});

export const settingsSchema = z.object({
  defaultModel: z.string().default("gpt-image-2"),
  defaultAspectRatio: z.enum(["1:1", "16:9", "9:16"]).default("1:1"),
  defaultSize: z.enum(["1024x1024", "1536x1024", "1024x1536"]).default("1024x1024"),
  imageCount: z.number().min(1).max(4).default(1),
  autoEnhance: z.boolean().default(true),
  quality: z.enum(["low", "medium", "high", "auto"]).default("auto"),
  outputFormat: z.enum(["png", "jpeg", "webp"]).default("png"),
});

export type GenerateImageSchemaInput = z.infer<typeof generateImageSchema>;
export type EnhancePromptSchemaInput = z.infer<typeof enhancePromptSchema>;
export type SettingsSchemaInput = z.infer<typeof settingsSchema>;
