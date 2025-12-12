import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { PerspectiveType } from "@/types";
import { getDebatePrompt } from "@/lib/prompts";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { perspective, originalInput, perspectiveResponse, challenge } =
      (await request.json()) as {
        perspective: PerspectiveType;
        originalInput: string;
        perspectiveResponse: string;
        challenge: string;
      };

    if (!perspective || !originalInput || !perspectiveResponse || !challenge) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { system, user } = getDebatePrompt(
      perspective,
      originalInput,
      perspectiveResponse,
      challenge
    );

    // Use Haiku for cost savings, with prompt caching
    const stream = anthropic.messages.stream({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 512,
      system: [
        {
          type: "text",
          text: system,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: user }],
    });

    // Convert to ReadableStream for the browser
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
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
      },
    });
  } catch (error) {
    console.error("Debate API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate debate response" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
