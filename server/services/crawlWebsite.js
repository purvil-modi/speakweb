import axios from "axios";
import * as cheerio from "cheerio";
import robotsParser from "robots-parser";
import { URL } from "url";
import delay from "../utils/delay.js";
import cleanText from "./cleanText.js";

const MAX_PAGES = 30;
const MAX_DEPTH = 2;
const CRAWL_DELAY_MS = 500;
const MAX_CONCURRENCY = 5;
const USER_AGENT = "ChatWithWebsiteBot/1.0";

async function fetchRobotsRules(baseUrl) {
  try {
    const robotsUrl = new URL("/robots.txt", baseUrl).href;
    const { data } = await axios.get(robotsUrl, { timeout: 5000 });
    return robotsParser(robotsUrl, data);
  } catch {
    return null;
  }
}

function isAllowed(robots, url) {
  if (!robots) return true;
  return robots.isAllowed(url, USER_AGENT) !== false;
}

function extractLinks($, baseUrl, currentUrl) {
  const base = new URL(baseUrl);
  const links = new Set();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    try {
      const resolved = new URL(href, currentUrl);
      if (resolved.hostname === base.hostname && /^https?:$/.test(resolved.protocol)) {
        resolved.hash = "";
        links.add(resolved.href);
      }
    } catch {
      // Ignore
    }
  });
  return [...links];
}

async function fetchPage(url) {
  const { data } = await axios.get(url, {
    timeout: 10000,
    headers: { "User-Agent": USER_AGENT },
    maxRedirects: 5,
  });
  return data;
}

async function crawlWebsite(startUrl) {
  const robots = await fetchRobotsRules(startUrl);
  const visited = new Set();
  const results = [];
  const queue = [{ url: startUrl, depth: 0 }];
  let activeCount = 0;
  
  return new Promise((resolve) => {
    const processQueue = async () => {
      // Stop if we hit limits or queue is empty while no active workers are running
      if (results.length >= MAX_PAGES) {
        if (activeCount === 0) resolve(results);
        return;
      }

      if (queue.length === 0) {
        if (activeCount === 0) resolve(results);
        return;
      }

      // Fill up to MAX_CONCURRENCY
      while (queue.length > 0 && activeCount < MAX_CONCURRENCY && results.length + activeCount < MAX_PAGES) {
        const item = queue.shift();
        
        if (visited.has(item.url)) continue;
        visited.add(item.url);

        activeCount++;
        
        // Process item asynchronously without awaiting immediately
        (async (url, depth) => {
          if (!isAllowed(robots, url)) {
            console.log(`[Crawler] Blocked by robots.txt: ${url}`);
          } else {
            try {
              console.log(`[Crawler] Fetching (depth=${depth}): ${url}`);
              // Wait slightly between batch items for politeness
              await delay(CRAWL_DELAY_MS);
              
              const html = await fetchPage(url);
              const $ = cheerio.load(html);
              const text = cleanText($);
              
              if (text.length > 100 && results.length < MAX_PAGES) {
                results.push({ url, text });
              }
              
              if (depth < MAX_DEPTH) {
                const links = extractLinks($, startUrl, url);
                for (const link of links) {
                  if (!visited.has(link)) {
                    queue.push({ url: link, depth: depth + 1 });
                  }
                }
              }
            } catch (err) {
              console.warn(`[Crawler] Failed to fetch ${url}: ${err.message}`);
            }
          }
          activeCount--;
          processQueue(); // Check for more work when a worker finishes
        })(item.url, item.depth);
      }
    };
    
    processQueue();
  }).then((res) => {
    console.log(`[Crawler] Done. Pages crawled: ${res.length}`);
    return res;
  });
}

export default crawlWebsite;
