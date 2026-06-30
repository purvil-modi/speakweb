import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 100,
});

// pages: [{ url, text }]
// Returns LangChain Document objects with source metadata
async function splitText(pages) {
  const docs = [];
  const seenContent = new Set();

  for (const { url, text } of pages) {
    const chunks = await splitter.createDocuments([text], [{ source: url }]);
    
    // Deduplicate identical chunks (e.g., repeating navigation or footers)
    for (const chunk of chunks) {
      if (!seenContent.has(chunk.pageContent)) {
        seenContent.add(chunk.pageContent);
        docs.push(chunk);
      }
    }
  }

  return docs;
}

export default splitText;
