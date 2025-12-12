import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { PerspectiveType } from "@/types";
import { getPromptForPerspective } from "@/lib/prompts";

const anthropic = new Anthropic();

// Simple in-memory cache (survives across requests in serverless warm instances)
// Key: hash of input+perspective, Value: { response, timestamp }
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const MAX_CACHE_SIZE = 100;

function getCacheKey(input: string, perspective: string): string {
  // Simple hash for cache key
  const str = `${perspective}:${input.toLowerCase().trim()}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

function cleanCache() {
  const now = Date.now();
  responseCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_TTL) {
      responseCache.delete(key);
    }
  });
  // If still too large, remove oldest entries
  if (responseCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(responseCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => responseCache.delete(key));
  }
}

export async function POST(request: NextRequest) {
  try {
    const { input, perspective, context } = (await request.json()) as {
      input: string;
      perspective: PerspectiveType;
      context?: string;
    };

    if (!input || !perspective) {
      return new Response(
        JSON.stringify({ error: "Missing input or perspective" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Include context in cache key if provided
    const cacheKey = getCacheKey(input + (context || ""), perspective);
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // Return cached response as SSE
      const encoder = new TextEncoder();
      const cachedStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: cached.response })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(cachedStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Cache": "HIT",
        },
      });
    }

    const { system, user } = getPromptForPerspective(perspective, input, context);

    // Use Haiku for cost savings (60x cheaper than Sonnet)
    // Enable prompt caching for system prompt
    const stream = anthropic.messages.stream({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 512, // 2-3 paragraphs don't need 1024
      system: [
        {
          type: "text",
          text: system,
          cache_control: { type: "ephemeral" }, // Enable prompt caching
        },
      ],
      messages: [{ role: "user", content: user }],
    });

    // Convert to ReadableStream for the browser
    const encoder = new TextEncoder();
    let fullResponse = "";

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              fullResponse += text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();

          // Cache the response for future requests
          cleanCache();
          responseCache.set(cacheKey, {
            response: fullResponse,
            timestamp: Date.now(),
          });
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate perspective" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
