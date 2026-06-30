import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, LoaderCircle, CheckCircle, Search, FileText, Sparkles, Bot } from "lucide-react";
import ChatMessage from "./ChatMessage.jsx";

// Animated progress stages shown while waiting for a response
function ChatProgressIndicator({ phase }) {
  const steps = [
    { id: "searching", label: "Searching Website...", icon: Search },
    { id: "retrieving", label: "Finding Relevant Documents...", icon: FileText },
    { id: "generating", label: "Generating AI Response...", icon: Sparkles },
  ];

  const activeIndex = steps.findIndex((s) => s.id === phase);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex justify-start mb-4"
    >
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-tl-sm px-5 py-4 flex flex-col gap-3 min-w-[260px]">
        {steps.map((step, idx) => {
          const isActive = idx === activeIndex;
          const isDone = idx < activeIndex;
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="flex items-center gap-3">
              {isDone ? (
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              ) : isActive ? (
                <LoaderCircle className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0" />
              )}
              <span className={`text-sm font-semibold transition-colors duration-200 ${isActive ? 'text-blue-700' : isDone ? 'text-slate-500' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function ChatBox({ crawledUrl }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Website successfully indexed! I'm ready to answer any questions you have about the content on **${crawledUrl}**.`,
      sources: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loadingPhase, setLoadingPhase] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingPhase]);

  async function handleSubmit(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loadingPhase) return;

    const userMsg = { role: "user", content: question, sources: [] };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    
    setLoadingPhase("retrieving");

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let streamMessageAdded = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (!dataStr) continue;

              try {
                const parsed = JSON.parse(dataStr);
                
                if (parsed.type === "progress") {
                  setLoadingPhase(parsed.phase);
                } else if (parsed.type === "sources") {
                  setLoadingPhase(null);
                  if (!streamMessageAdded) {
                    setMessages((prev) => [
                      ...prev,
                      { role: "assistant", content: "", sources: parsed.sources, id: "streaming" },
                    ]);
                    streamMessageAdded = true;
                  } else {
                    setMessages((prev) =>
                      prev.map((m) => m.id === "streaming" ? { ...m, sources: parsed.sources } : m)
                    );
                  }
                } else if (parsed.type === "token") {
                  if (!streamMessageAdded) {
                    setLoadingPhase(null);
                    setMessages((prev) => [
                      ...prev,
                      { role: "assistant", content: "", sources: [], id: "streaming" },
                    ]);
                    streamMessageAdded = true;
                  }
                  
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === "streaming" ? { ...m, content: m.content + parsed.text } : m
                    )
                  );
                } else if (parsed.type === "timing") {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === "streaming" ? { ...m, timing: { retrieval: parsed.retrieval, llm: parsed.llm, total: parsed.total } } : m
                    )
                  );
                } else if (parsed.type === "error") {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === "streaming" ? { ...m, content: m.content + "\n\n**Error:** " + parsed.text } : m
                    )
                  );
                } else if (parsed.type === "done") {
                  done = true;
                }
              } catch (e) {
                // Ignore split chunks
              }
            }
          }
        }
      }
    } catch (err) {
      setLoadingPhase(null);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `**Error:** ${err.message || "Something went wrong."}`, sources: [] }
      ]);
    } finally {
      setLoadingPhase(null);
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === "streaming") {
            const { id, ...rest } = m;
            return rest;
          }
          return m;
        })
      );
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-6">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        <AnimatePresence>
          {loadingPhase && <ChatProgressIndicator phase={loadingPhase} />}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-slate-200 px-4 md:px-8 py-5 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleSubmit} className="flex items-end gap-3 max-w-4xl mx-auto relative">
          <textarea
            id="chat-input"
            rows="1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask a question about the website..."
            disabled={!!loadingPhase}
            className="flex-1 bg-white border border-slate-300 text-slate-900 placeholder-slate-400
              rounded-2xl pl-5 pr-14 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 
              focus:border-transparent disabled:opacity-50 disabled:bg-slate-50 transition shadow-sm resize-none"
            style={{ minHeight: "54px", maxHeight: "150px" }}
          />
          <button
            id="send-btn"
            type="submit"
            disabled={!!loadingPhase || !input.trim()}
            className="absolute right-2 bottom-2 w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 
              disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-150 
              active:scale-95 shadow-sm"
          >
            {loadingPhase ? (
              <LoaderCircle className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </form>
        <div className="text-center mt-3">
          <p className="text-[11px] text-slate-400 font-medium">
            AI can make mistakes. Check the provided source links for accuracy.
          </p>
        </div>
      </div>
    </div>
  );
}
