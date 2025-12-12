import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { PerspectiveType } from "@/types";
import { getPromptForPerspective } from "@/lib/prompts";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { input, perspective } = (await request.json()) as {
      input: string;
      perspective: PerspectiveType;
    };

    if (!input || !perspective) {
      return new Response(
        JSON.stringify({ error: "Missing input or perspective" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { system, user } = getPromptForPerspective(perspective, input);

    // Create streaming response
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system,
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
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
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
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate perspective" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
