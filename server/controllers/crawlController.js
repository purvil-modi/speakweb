import crawlWebsite from "../services/crawlWebsite.js";
import splitText from "../services/splitText.js";
import { storeVectors, loadCachedVectors } from "../services/vectorStore.js";

async function handleCrawl(req, res) {
  const { url } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "A valid URL is required." });
  }

  try {
    const tStart = performance.now();
    console.log(`[crawlController] Starting crawl for: ${url}`);

    // Check if vectors are already cached for this URL
    const isCached = await loadCachedVectors(url);

    if (isCached) {
      const totalTime = ((performance.now() - tStart) / 1000).toFixed(2);
      console.log(`[crawlController] Loaded from cache. Total time: ${totalTime}s`);
      return res.json({
        message: `Loaded website context from cache.`,
        cached: true
      });
    }

    // Crawl
    const tCrawlStart = performance.now();
    const pages = await crawlWebsite(url);
    const tCrawlEnd = performance.now();

    if (pages.length === 0) {
      return res.status(422).json({ error: "No content could be extracted from the given URL." });
    }

    // Chunk
    const tChunkStart = performance.now();
    const docs = await splitText(pages);
    const tChunkEnd = performance.now();

    // Embed & Store
    const tEmbedStart = performance.now();
    await storeVectors(docs, url);
    const tEmbedEnd = performance.now();

    // Timing summary
    const tTotal = performance.now() - tStart;
    console.log(`Crawler: ${((tCrawlEnd - tCrawlStart) / 1000).toFixed(2)}s`);
    console.log(`Chunking: ${((tChunkEnd - tChunkStart) / 1000).toFixed(2)}s`);
    console.log(`Embedding: ${((tEmbedEnd - tEmbedStart) / 1000).toFixed(2)}s`);
    console.log(`Total: ${(tTotal / 1000).toFixed(2)}s`);

    res.json({
      message: `Crawled ${pages.length} page(s) and indexed ${docs.length} chunks.`,
      pagesCrawled: pages.length,
      chunksIndexed: docs.length,
    });
  } catch (err) {
    console.error("[crawlController] Error:", err.message);
    res.status(500).json({ error: "Crawling failed. Check the URL and try again." });
  }
}

export { handleCrawl };
