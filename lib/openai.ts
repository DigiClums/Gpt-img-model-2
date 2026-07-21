import OpenAI from "openai";

/**
 * Default timeout for image generation (180 seconds = 3 minutes).
 * Can be overridden via process.env.OPENAI_TIMEOUT_MS.
 */
const DEFAULT_TIMEOUT_MS = 180000;

/**
 * Server-only OpenAI Client helper
 * Never import on the client side.
 */
export function getOpenAIClient(timeoutMs?: number): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_openai_api_key_here") {
    throw new Error("OPENAI_API_KEY is not configured in .env.local on the server.");
  }

  const effectiveTimeout = timeoutMs || parseInt(process.env.OPENAI_TIMEOUT_MS || `${DEFAULT_TIMEOUT_MS}`, 10);

  return new OpenAI({
    apiKey: apiKey.trim(),
    timeout: effectiveTimeout,
    maxRetries: 3, // Official OpenAI SDK automatic retries with exponential backoff
  });
}

export interface GenerateOptions {
  prompt: string;
  size: "1024x1024" | "1536x1024" | "1024x1536";
  n: number;
  quality?: "low" | "medium" | "high" | "auto";
  image?: string; // base64 string for image editing
}

/**
 * Generate images using strictly the latest gpt-image-2 model with 180s timeout and detailed error logging
 */
export async function generateWithGPTImage2(options: GenerateOptions) {
  const timeoutMs = parseInt(process.env.OPENAI_TIMEOUT_MS || `${DEFAULT_TIMEOUT_MS}`, 10);
  const openai = getOpenAIClient(timeoutMs);
  const { prompt, size, n, quality = "auto", image } = options;

  const targetModel = "gpt-image-2";

  // Map requested dimensions to OpenAI SDK supported size string
  let requestSize: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024";
  if (size === "1536x1024") {
    requestSize = "1792x1024";
  } else if (size === "1024x1536") {
    requestSize = "1024x1792";
  }

  console.log(`[OpenAI SDK] Initiating gpt-image-2 request (Timeout: ${timeoutMs}ms, Size: ${requestSize}, Count: ${n}, Quality: ${quality})`);

  try {
    const results: Array<{ url: string; revisedPrompt?: string }> = [];

    // Image Editing Mode with gpt-image-2 (if seed image uploaded)
    if (image && typeof image === "string" && image.startsWith("data:image")) {
      const base64Data = image.split(",")[1];
      const imageBuffer = Buffer.from(base64Data, "base64");
      const file = new File([imageBuffer], "input.png", { type: "image/png" });

      const editParams: any = {
        model: targetModel,
        image: file,
        prompt: prompt,
        n: Math.min(n, 4),
        size: "1024x1024",
      };

      console.log(`[OpenAI SDK] Calling openai.images.edit with model=${targetModel}`);
      const editResponse = await openai.images.edit(editParams);

      if (process.env.NODE_ENV === "development") {
        console.log(`[OpenAI SDK Development Log] Edit Response Data Count: ${editResponse.data?.length || 0}`);
      }

      for (const item of editResponse.data || []) {
        if (item.b64_json) {
          results.push({
            url: `data:image/png;base64,${item.b64_json}`,
            revisedPrompt: prompt,
          });
        } else if (item.url) {
          try {
            const res = await fetch(item.url);
            const buffer = await res.arrayBuffer();
            const base64Str = Buffer.from(buffer).toString("base64");
            const mime = res.headers.get("content-type") || "image/png";
            results.push({
              url: `data:${mime};base64,${base64Str}`,
              revisedPrompt: prompt,
            });
          } catch {
            results.push({
              url: item.url,
              revisedPrompt: prompt,
            });
          }
        }
      }
      return results;
    }

    // Standard Image Generation Mode with gpt-image-2
    const count = Math.min(Math.max(1, n), 4);
    for (let i = 0; i < count; i++) {
      const genParams: any = {
        model: targetModel,
        prompt: prompt,
        n: 1,
        size: requestSize,
        quality: quality || "auto",
      };

      console.log(`[OpenAI SDK] Calling openai.images.generate #${i + 1}/${count} with model=${targetModel}`);
      const response = await openai.images.generate(genParams);

      if (process.env.NODE_ENV === "development") {
        console.log(`[OpenAI SDK Development Log] Generation Response Item #${i + 1}:`, {
          hasB64: !!response.data?.[0]?.b64_json,
          hasUrl: !!response.data?.[0]?.url,
          revisedPrompt: response.data?.[0]?.revised_prompt,
        });
      }

      const item = response.data?.[0];
      if (item?.b64_json) {
        results.push({
          url: `data:image/png;base64,${item.b64_json}`,
          revisedPrompt: item.revised_prompt || prompt,
        });
      } else if (item?.url) {
        // Convert remote URL to Base64 data URL for permanent client storage
        try {
          const res = await fetch(item.url);
          const buffer = await res.arrayBuffer();
          const base64Str = Buffer.from(buffer).toString("base64");
          const mime = res.headers.get("content-type") || "image/png";
          results.push({
            url: `data:${mime};base64,${base64Str}`,
            revisedPrompt: item.revised_prompt || prompt,
          });
        } catch {
          results.push({
            url: item.url,
            revisedPrompt: item.revised_prompt || prompt,
          });
        }
      }
    }

    return results;
  } catch (error: any) {
    console.error("[OpenAI SDK Error Details]:", {
      name: error?.name,
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
      param: error?.param,
      errorBody: error?.error,
    });
    throw error;
  }
}

/**
 * Auto Enhancer: Expands simple user prompts into rich photorealistic prompts for gpt-image-2
 */
export async function enhanceUserPrompt(userPrompt: string): Promise<string> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert AI image prompt engineer for gpt-image-2. Transform simple user prompts into highly detailed, vivid, photorealistic, cinematic image prompts suitable for high quality image synthesis. Focus on lighting, art style, camera angle, textures, and color palette. Output ONLY the enhanced prompt string without commentary, quotes, or prefix.",
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 250,
    });

    const enhanced = response.choices[0]?.message?.content?.trim();
    return enhanced || userPrompt;
  } catch (error) {
    console.warn("Prompt enhancement failed, fallback to original prompt:", error);
    return userPrompt;
  }
}
