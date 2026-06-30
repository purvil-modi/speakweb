import { Embeddings } from "@langchain/core/embeddings";
import OpenAI from "openai";

/**
 * Custom Embeddings class using the OpenAI SDK pointing to OpenRouter.
 * 
 * Replaces the Google GenAI dependency to support a fully OpenRouter-based RAG pipeline.
 */
class OpenRouterEmbeddingsAdapter extends Embeddings {
  constructor(fields) {
    super(fields ?? {});
    this.modelName = fields?.model ?? process.env.OPENROUTER_EMBEDDING_MODEL ?? "openai/text-embedding-3-small";
    this.apiKey = fields?.apiKey ?? process.env.OPENROUTER_API_KEY;
    
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is missing for embeddings");
    }

    this.client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: this.apiKey,
      maxRetries: 0, // Disable internal SDK retries
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "Chat-With-Website",
      },
    });
  }

  /**
   * Generates an embedding for a single query text.
   */
  async embedQuery(text) {
    const response = await this.client.embeddings.create({
      model: this.modelName,
      input: text,
    });
    return response.data[0].embedding;
  }

  /**
   * Generates embeddings for an array of document texts.
   */
  async embedDocuments(documents) {
    // Process documents in batches of 100 to avoid limits
    const batchSize = 100;
    const batches = [];
    for (let i = 0; i < documents.length; i += batchSize) {
      batches.push(documents.slice(i, i + batchSize));
    }

    const embeddings = [];
    for (const batch of batches) {
      const response = await this.client.embeddings.create({
        model: this.modelName,
        input: batch,
      });
      // OpenRouter/OpenAI returns data sorted by index
      const batchEmbeddings = response.data.map((item) => item.embedding);
      embeddings.push(...batchEmbeddings);
    }
    
    return embeddings;
  }
}

let embeddings = null;

function getEmbeddings() {
  if (!embeddings) {
    embeddings = new OpenRouterEmbeddingsAdapter({
      model: process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small",
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }
  return embeddings;
}

export default getEmbeddings;
