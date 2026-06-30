import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Search, LoaderCircle, CheckCircle, AlertCircle } from "lucide-react";
import { crawlWebsite } from "../services/api.js";

const CRAWL_STEPS = [
  { text: "Crawling Website...", icon: Globe },
  { text: "Processing Pages...", icon: Search },
  { text: "Creating Search Index...", icon: CheckCircle },
];

function CrawlProgress() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < CRAWL_STEPS.length - 1 ? prev + 1 : prev));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: "auto", marginTop: 24 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      className="bg-slate-50 border border-slate-200 shadow-inner rounded-xl p-5 flex flex-col gap-4 overflow-hidden"
    >
      {/* Progress bar */}
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-blue-600 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${((stepIndex + 1) / CRAWL_STEPS.length) * 100}%` }}
          transition={{ duration: 3, ease: "linear" }}
        />
      </div>

      {/* Active step with icon */}
      <div className="flex items-center gap-3">
        <LoaderCircle className="w-5 h-5 text-blue-600 animate-spin" />
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            {(() => {
              const Icon = CRAWL_STEPS[stepIndex].icon;
              return <Icon className="w-4 h-4 text-slate-500" />;
            })()}
            <span className="text-sm text-slate-700 font-semibold">{CRAWL_STEPS[stepIndex].text}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-xs text-slate-500 font-medium pl-8">
        This can take 30–90 seconds depending on the size of the website.
      </p>
    </motion.div>
  );
}

export default function UrlInput({ onCrawlComplete }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function isValidUrl(value) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!isValidUrl(url)) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setLoading(true);
    try {
      await crawlWebsite(url);
      onCrawlComplete(url);
    } catch (err) {
      const msg = err.response?.data?.error || "Crawling failed. Check the URL and try again.";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
      <div className="mb-4">
        <label htmlFor="url-input" className="block text-sm font-bold text-slate-900 mb-1">
          Website URL
        </label>
        <p className="text-xs text-slate-500 font-medium">Enter the address of the website you want to chat with.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Globe className="h-5 w-5 text-slate-400" />
          </div>
          <input
            id="url-input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            disabled={loading}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 text-slate-900 placeholder-slate-400
              rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent 
              disabled:opacity-50 disabled:bg-slate-50 transition shadow-sm"
          />
        </div>
        <button
          id="crawl-btn"
          type="submit"
          disabled={loading || !url.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
            text-white rounded-xl px-8 py-3 text-sm font-bold transition-all duration-150
            active:scale-[0.98] shrink-0 shadow-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <LoaderCircle className="w-4 h-4 animate-spin" />
              Crawling...
            </>
          ) : (
            "Start Chat"
          )}
        </button>
      </form>

      <AnimatePresence>
        {loading && <CrawlProgress />}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 flex items-center gap-2 text-red-700 text-sm font-medium bg-red-50 border border-red-200 shadow-sm rounded-lg px-4 py-3"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
