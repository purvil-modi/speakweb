import { getStore } from "./vectorStore.js";

// Returns top-k most relevant chunks for the given question
async function searchDocuments(question, k = 3) {
  const store = getStore();
  if (!store) throw new Error("No website has been crawled yet.");

  const tStart = performance.now();
  const results = await store.similaritySearch(question, k);
  const tEnd = performance.now();
  
  console.log(`[Retriever] Retrieved ${results.length} chunks. Time: ${((tEnd - tStart) / 1000).toFixed(3)}s`);

  return results.map((doc) => ({
    content: doc.pageContent,
    source: doc.metadata.source,
  }));
}

export default searchDocuments;
