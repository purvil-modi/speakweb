import OpenAI from "openai";
import delay from "../utils/delay.js";

const SYSTEM_PROMPT = `You are an assistant that answers ONLY from the provided website content.
If the answer cannot be found inside the context, respond exactly:
"I couldn't find this information on the crawled website."
Never use outside knowledge.
Always include source URLs when referencing information.`;

let openaiClient = null;

function getOpenRouterClient() {
  if (!openaiClient) {
    if (process.env.LLM_PROVIDER !== "openrouter") {
      throw new Error("Invalid LLM_PROVIDER. Expected 'openrouter'.");
    }

    openaiClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      maxRetries: 0, // Disable internal SDK retries to allow instant fallback!
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "Chat-With-Website",
      },
    });
  }
  return openaiClient;
}

function buildPrompt(question, chunks) {
  const context = chunks
    .map((c, i) => `[Source ${i + 1}: ${c.source}]\n${c.content}`)
    .join("\n\n---\n\n");
  
  return `Context:\n${context}\n\nQuestion: ${question}`;
}

// We removed the retry loop so that 429 errors instantly fall back to the next model without waiting.

// Return an SSE-compatible stream generator
async function generateAnswerStream(question, chunks) {
  const prompt = buildPrompt(question, chunks);
  const sources = [...new Set(chunks.map((c) => c.source))];
  const client = getOpenRouterClient();

  const modelPriority = [
    process.env.OPENROUTER_MODEL || "deepseek/deepseek-r1:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "openrouter/free" // Guaranteed fallback endpoint
  ];

  let streamResponse = null;
  let finalModel = null;
  const tStart = performance.now();

  for (const model of modelPriority) {
    try {
      console.log(`[LLM] Attempting OpenRouter (Model: ${model})`);
      streamResponse = await client.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        stream: true,
      });
      finalModel = model;
      break; // Success! Break the loop.
    } catch (error) {
      console.error(`[LLM] Failed with model ${model}: ${error.message}`);
      // Continue to next model in the fallback array
    }
  }

  if (!streamResponse) {
    // All models failed
    const tEnd = performance.now();
    console.log(`[LLM] All models failed. Time: ${((tEnd - tStart) / 1000).toFixed(3)}s`);
    return {
      stream: null,
      errorMsg: "I apologize, but all AI providers are currently unavailable or experiencing heavy load. Please try again later.",
      sources: []
    };
  }

  // We got a successful stream
  return {
    stream: streamResponse,
    sources,
    onComplete: () => {
      const tEnd = performance.now();
      console.log(`[LLM] Finished streaming (Model: ${finalModel}). Time: ${((tEnd - tStart) / 1000).toFixed(3)}s`);
    }
  };
}

export { generateAnswerStream };
