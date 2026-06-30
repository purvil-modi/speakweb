import { MemoryVectorStore } from "langchain/vectorstores/memory";
import getEmbeddings from "./createEmbeddings.js";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// Single in-memory store
let store = null;
const CACHE_DIR = path.join(process.cwd(), ".cache");

function getCachePath(url) {
  const hash = crypto.createHash("md5").update(url).digest("hex");
  return path.join(CACHE_DIR, `${hash}.json`);
}

async function loadCachedVectors(url) {
  const cachePath = getCachePath(url);
  try {
    const data = await fs.readFile(cachePath, "utf-8");
    const memoryVectors = JSON.parse(data);
    
    // Reconstruct the store
    store = new MemoryVectorStore(getEmbeddings());
    store.memoryVectors = memoryVectors; // MemoryVectorStore uses this internal array
    
    console.log(`[VectorStore] Loaded ${memoryVectors.length} vectors from cache for ${url}`);
    return true;
  } catch (err) {
    // No cache or error reading
    return false;
  }
}

async function storeVectors(docs, url) {
  store = await MemoryVectorStore.fromDocuments(docs, getEmbeddings());
  
  // Save to cache
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const cachePath = getCachePath(url);
    await fs.writeFile(cachePath, JSON.stringify(store.memoryVectors));
  } catch (err) {
    console.warn(`[VectorStore] Failed to cache vectors: ${err.message}`);
  }

  console.log(`[VectorStore] Indexed and cached ${docs.length} chunks`);
}

function getStore() {
  return store;
}

export { storeVectors, getStore, loadCachedVectors };
