import { NextRequest, NextResponse } from "next/server";
import { generateImageSchema } from "@/lib/validations";
import { generateWithGPTImage2, enhanceUserPrompt } from "@/lib/openai";

// Set max execution duration for Next.js App Router to 180 seconds
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const rawBody = await req.json();

    // Validate payload with Zod
    const validationResult = generateImageSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]?.message || "Invalid request parameters.";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const { prompt, aspectRatio, size, n, quality, autoEnhance, image } = validationResult.data;

    console.log(`[API /api/generate-image] Request received: prompt="${prompt.slice(0, 40)}...", size=${size}, n=${n}, quality=${quality}, autoEnhance=${autoEnhance}, model=gpt-image-2, editing=${!!image}`);

    // Auto Enhance Prompt if enabled
    let finalPrompt = prompt;
    let enhancedPrompt: string | undefined = undefined;

    if (autoEnhance && !image) {
      try {
        enhancedPrompt = await enhanceUserPrompt(prompt);
        if (enhancedPrompt && enhancedPrompt !== prompt) {
          finalPrompt = enhancedPrompt;
        }
      } catch (err) {
        console.warn("Auto enhance failed, keeping original prompt:", err);
      }
    }

    // Execute Image Generation with gpt-image-2
    const generatedImages = await generateWithGPTImage2({
      prompt: finalPrompt,
      size,
      n,
      quality,
      image: image || undefined,
    });

    const duration = Date.now() - startTime;
    console.log(`[API /api/generate-image] Success! Generated ${generatedImages.length} images with gpt-image-2 in ${duration}ms.`);

    return NextResponse.json({
      success: true,
      images: generatedImages,
      enhancedPrompt: enhancedPrompt !== prompt ? enhancedPrompt : undefined,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[API /api/generate-image] Error after ${duration}ms:`, error);

    const errorMessage = error?.message || "An unexpected server error occurred.";
    const status = error?.status || error?.statusCode || 500;

    let friendlyError = errorMessage;
    let errorCode = status;

    if (error?.name === "AbortError" || errorMessage.includes("aborted") || errorMessage.includes("timeout")) {
      friendlyError = "The request timed out. OpenAI servers took too long to respond. Please try again.";
      errorCode = 504;
    } else if (status === 401 || errorMessage.includes("Incorrect API key") || errorMessage.includes("invalid_api_key")) {
      friendlyError = "Invalid OpenAI API Key. Please verify OPENAI_API_KEY in your server .env.local file.";
      errorCode = 401;
    } else if (status === 403) {
      friendlyError = "Forbidden. Your OpenAI API key does not have permission for the gpt-image-2 model.";
      errorCode = 403;
    } else if (status === 404 || errorMessage.includes("model_not_found")) {
      friendlyError = "The model 'gpt-image-2' was not found or is unavailable for your OpenAI API account tier.";
      errorCode = 404;
    } else if (status === 429 || errorMessage.includes("rate_limit") || errorMessage.includes("quota")) {
      friendlyError = "OpenAI Rate Limit or Quota Exceeded. Please check your OpenAI billing plan and usage limits.";
      errorCode = 429;
    } else if (status === 500 || status === 502 || status === 503) {
      friendlyError = "OpenAI API services are currently experiencing issues or maintenance. Please try again shortly.";
      errorCode = status;
    } else if (errorMessage.includes("safety") || errorMessage.includes("content_policy") || errorMessage.includes("rejected")) {
      friendlyError = "Your prompt was rejected by OpenAI safety systems. Please revise your description.";
      errorCode = 400;
    }

    return NextResponse.json(
      {
        success: false,
        error: friendlyError,
        code: errorCode,
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        rawError: error?.error || undefined,
      },
      { status: typeof errorCode === "number" && errorCode >= 400 && errorCode < 600 ? errorCode : 500 }
    );
  }
}
