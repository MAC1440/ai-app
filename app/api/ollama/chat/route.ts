import { OLLAMA_BASE_URL, type OllamaChatRequest } from "@/lib/ollama";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OllamaChatRequest;

    if (!body.model?.trim()) {
      return NextResponse.json({ error: "Model is required" }, { status: 400 });
    }

    if (!body.messages?.length) {
      return NextResponse.json(
        { error: "At least one message is required" },
        { status: 400 },
      );
    }

    const stream = body.stream ?? true;

    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, stream }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      return NextResponse.json(
        { error: errorText || ollamaResponse.statusText },
        { status: ollamaResponse.status },
      );
    }

    if (!stream) {
      const data = await ollamaResponse.json();
      return NextResponse.json(data);
    }

    // Stream the Ollama response back to the browser as NDJSON so the UI can render
    // reasoning and final text incrementally while the model is still generating.
    if (!ollamaResponse.body) {
      return NextResponse.json(
        { error: "No response body from Ollama" },
        { status: 502 },
      );
    }

    return new Response(ollamaResponse.body, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reach Ollama";
    return NextResponse.json(
      {
        error: message,
        hint: "Ensure Ollama is running at " + OLLAMA_BASE_URL,
      },
      { status: 503 },
    );
  }
}
