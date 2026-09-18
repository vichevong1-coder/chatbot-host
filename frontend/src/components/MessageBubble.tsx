import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { HelpCircle, BookOpen, AlertCircle, Copy, ThumbsDown, Share, RefreshCw, MoreHorizontal, Volume2, Languages } from 'lucide-react';
import { Message } from '../store';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [showMore, setShowMore] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMore(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`py-6 px-4 md:px-8 flex gap-4 bg-transparent ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      
      <div className={`flex flex-col min-w-0 space-y-3 ${isUser ? 'max-w-[70%] items-end' : 'flex-1'}`}>
        {!isUser && message.category && (
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <BookOpen size={14} />
              {message.category.replace('_', ' ')}
            </span>
            {message.practice_mode && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Practice Mode
              </span>
            )}
            {message.hint_count !== undefined && message.hint_count > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <AlertCircle size={14} />
                Hints: {message.hint_count}
              </span>
            )}
          </div>
        )}

        <div className={`prose prose-sm md:prose-base break-words dark:prose-invert ${isUser ? 'bg-[#f4f4f4] dark:bg-[#2f2f2f] rounded-3xl px-5 py-2.5 text-black dark:text-white' : 'max-w-none text-gray-800 dark:text-gray-200'}`}>
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
            components={{
              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {!isUser && message.steps && message.steps.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <HelpCircle size={16} />
              Progress Steps
            </h4>
            <ul className="space-y-2">
              {message.steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 bg-transparent p-2 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-200 min-w-[20px]">{idx + 1}.</span>
                  <div className="prose prose-sm dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {step.description || step.content || JSON.stringify(step)}
                    </ReactMarkdown>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isUser && (
          <div className="flex items-center gap-1 mt-2 text-gray-500 dark:text-gray-400">
            <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#2f2f2f] transition-colors" title="Copy">
              <Copy size={16} />
            </button>
            <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#2f2f2f] transition-colors" title="Bad response">
              <ThumbsDown size={16} />
            </button>
            <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#2f2f2f] transition-colors" title="Share">
              <Share size={16} />
            </button>
            <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#2f2f2f] transition-colors" title="Regenerate">
              <RefreshCw size={16} />
            </button>
            <div className="relative" ref={moreMenuRef}>
              <button 
                onClick={() => setShowMore(!showMore)}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#2f2f2f] transition-colors" 
                title="More"
              >
                <MoreHorizontal size={16} />
              </button>
              
              {showMore && (
                <div className="absolute bottom-full left-0 mb-1 w-48 bg-white dark:bg-[#2f2f2f] rounded-lg shadow-lg border border-gray-100 dark:border-white/10 py-1.5 z-10 overflow-hidden">
                  <button 
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    onClick={() => setShowMore(false)}
                  >
                    <Volume2 size={16} />
                    Read out loud
                  </button>
                  <button 
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    onClick={() => setShowMore(false)}
                  >
                    <Languages size={16} />
                    Translate to Khmer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
