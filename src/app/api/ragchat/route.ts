// src/app/api/chat/route.ts
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { searchDocuments } from "@/lib/search";



export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body));

    const messages: UIMessage[] = body.messages || [];
    const model =
      body.data?.model || body.model || "nvidia/nemotron-nano-12b-v2-vl:free";

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required and must not be empty" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Find the last user message (support multiple user messages)
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMessage || !lastUserMessage.parts) {
      return new Response(
        JSON.stringify({ error: "No user message found" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Support array content (merge) and non-string content
   const query = (lastUserMessage.parts || [])
  .filter((p: any) => p && p.type === "text" && typeof p.text === "string")
  .map((p: any) => p.text.trim())
  .filter(Boolean)
  .join(" ")
  .trim();
    // 1) RAG search using your existing helper
    let results: any[] = [];
    try {
      if (query) {
        results = await searchDocuments(query, 5, 0.5);
      }
    } catch (err) {
      console.warn("searchDocuments failed, continuing without retrieved context:", err);
      results = [];
    }

    const context =
      results && results.length
        ? results.map((r: any, i: number) => `[Document ${i + 1}] ${r.content}`).join("\n\n")
        : "";

    console.log("RAG Search Results:", results.length, "documents found");

    // 2) System prompt that includes retrieved context
    const systemPrompt = `You are a helpful AI assistant with access to a document database.

Retrieved Context from Database:
${context || "No relevant documents found."}

Instructions:
- You are running on model: ${model}
- Use the context above to answer the user's question accurately.
- If the context helps, cite document numbers in your replies.
- If the context has no relevant info, say so.
- Be clear, concise, and helpful.`;

    // Construct a typed UIMessage for the system prompt (avoids TypeScript mismatch)
    const systemMessage: UIMessage = {
      id: `system-${Date.now()}`,
      role: "system",
       parts: [
        {
          type: "text",
          text: `You are a helpful AI assistant.

   Retrieved Context:
      ${context}

Instructions:
- Use the retrieved context when answering.
- Cite document numbers when relevant.
- If context doesn’t help, say so.`
        }
      ]
    };
   

    // Build final messages list (system + original messages)
    const augmentedMessages: UIMessage[] = [systemMessage, ...messages];

    // Create OpenRouter client (preserves your custom headers)
    const openrouter = createOpenRouter({
      headers: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "ragchatbot",
        // If you prefer to use API key instead, set: apiKey: process.env.OPENROUTER_API_KEY
      },
    });

    // Resolve model reference (works with createOpenRouter(...)("model-ref"))
    const modelRef = openrouter(model);

    // 3) Stream the model response back as UI message stream
    const result = streamText({
      model: modelRef,
      messages: convertToModelMessages(augmentedMessages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("RAG Error:", error);
    return new Response(
      JSON.stringify({
        error: "RAG processing failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
