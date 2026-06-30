import ReactMarkdown from "react-markdown";
import { Bot, User, ExternalLink, Globe } from "lucide-react";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`animate-fade-slide-up flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex gap-4 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        
        {/* Avatar */}
        <div className="shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center shadow-sm">
              <User className="w-5 h-5 text-slate-600" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2 px-1">
            <span className="text-sm font-bold text-slate-900">
              {isUser ? "You" : "Assistant"}
            </span>
            {!isUser && message.timing && (
              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {message.timing.total >= 1000 ? (message.timing.total / 1000).toFixed(1) + "s" : Math.round(message.timing.total) + "ms"}
              </span>
            )}
          </div>

          <div
            className={`px-5 py-4 text-[15px] leading-relaxed shadow-sm ${
              isUser
                ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"
                : "bg-white text-slate-800 rounded-2xl rounded-tl-sm border border-slate-200 markdown-body"
            }`}
          >
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            )}
          </div>

          {/* Sources Section */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                Sources
              </span>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((src, i) => {
                  let hostname = src;
                  try {
                    hostname = new URL(src).hostname.replace("www.", "");
                  } catch (e) {
                    // Ignore parsing errors for fallback
                  }
                  
                  return (
                    <a
                      key={i}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 
                        hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 shadow-sm max-w-full"
                      title={src}
                    >
                      <Globe className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0" />
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 truncate max-w-[200px]">
                        {hostname}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0 ml-1" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
