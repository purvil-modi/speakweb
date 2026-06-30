import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";
import UrlInput from "../components/UrlInput.jsx";
import ChatBox from "../components/ChatBox.jsx";

export default function Home() {
  const [crawledUrl, setCrawledUrl] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm px-6 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">SpeekWeb</h1>
            <p className="text-xs text-slate-500 font-medium">Crawl any website and chat with its content using AI.</p>
          </div>

          {/* Active crawl badge */}
          {crawledUrl && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-auto flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 shadow-sm"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-green-700 truncate max-w-[240px]" title={crawledUrl}>
                {crawledUrl}
              </span>
            </motion.div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center w-full">
        {!crawledUrl ? (
          /* Landing / crawl setup */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex flex-col items-center justify-center w-full max-w-[1200px] px-6 py-16 gap-12"
          >
            {/* Hero */}
            <div className="text-center max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 text-blue-700 text-xs font-semibold mb-6 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Powered by RAG & OpenRouter Api
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5 leading-tight tracking-tight">
                Talk to any website,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
                  instantly
                </span>
              </h2>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
                Enter a URL — we'll crawl the site, build a secure search index, and let you ask questions
                answered exclusively from that website.
              </p>
            </div>

            {/* URL input card */}
            <div className="w-full max-w-3xl">
              <UrlInput onCrawlComplete={setCrawledUrl} />
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-600 font-medium">
              {[
                "Respects robots.txt",
                "Up to 30 pages crawled",
                "Depth-2 BFS crawl",
                "Source citations",
                "Grounded answers",
              ].map((feat) => (
                <span
                  key={feat}
                  className="bg-white border border-slate-200 shadow-sm rounded-full px-4 py-2 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  {feat}
                </span>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Chat interface — full height once crawl completes */
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-6"
            style={{ height: "calc(100vh - 73px)" }}
          >
            <ChatBox crawledUrl={crawledUrl} />
          </motion.div>
        )}
      </main>
    </div>
  );
}
