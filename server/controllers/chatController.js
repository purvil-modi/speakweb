import searchDocuments from "../services/searchDocuments.js";
import { generateAnswerStream } from "../services/generateAnswer.js";

async function handleChat(req, res) {
  const { question } = req.body;

  if (!question || question.trim().length === 0) {
    return res.status(400).json({ error: "Question cannot be empty." });
  }

  // Set SSE headers immediately so we can stream progress status back!
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const tTotalStart = performance.now();

    // 1. Retrieval
    res.write(`data: ${JSON.stringify({ type: "progress", phase: "retrieving" })}\n\n`);
    const tRetrievalStart = performance.now();
    const chunks = await searchDocuments(question.trim());
    const tRetrievalEnd = performance.now();
    const retrievalMs = tRetrievalEnd - tRetrievalStart;

    // 2. Generation Setup
    res.write(`data: ${JSON.stringify({ type: "progress", phase: "generating" })}\n\n`);
    const tLlmStart = performance.now();
    const { stream, errorMsg, sources, onComplete } = await generateAnswerStream(question.trim(), chunks);

    if (!stream) {
      res.write(`data: ${JSON.stringify({ type: "error", text: errorMsg })}\n\n`);
      return res.end();
    }

    res.write(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`);

    // Stream the tokens
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ type: "token", text: content })}\n\n`);
      }
    }

    // 3. Timing Calculation
    const tTotalEnd = performance.now();
    const llmTimeMs = tTotalEnd - tLlmStart;
    const totalTimeMs = tTotalEnd - tTotalStart;

    // Log the exact format requested
    console.log(`Retrieval: ${retrievalMs >= 1000 ? (retrievalMs / 1000).toFixed(1) + "s" : Math.round(retrievalMs) + "ms"}`);
    console.log(`LLM: ${(llmTimeMs / 1000).toFixed(1)}s`);
    console.log(`Total: ${(totalTimeMs / 1000).toFixed(1)}s`);

    // Send timing to frontend
    res.write(`data: ${JSON.stringify({ type: "timing", retrieval: retrievalMs, llm: llmTimeMs, total: totalTimeMs })}\n\n`);

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();

    if (onComplete) onComplete();

  } catch (err) {
    console.error("[chatController] Error:", err.message);

    if (err.message === "No website has been crawled yet.") {
      res.write(`data: ${JSON.stringify({ type: "error", text: err.message })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ type: "error", text: "An internal server error occurred while streaming." })}\n\n`);
    }
    res.end();
  }
}

export { handleChat };
