import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Plus, Mic } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4 w-full">
      <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-[#f4f4f4] dark:bg-[#2f2f2f] border-none ring-0 focus-within:ring-0 rounded-3xl overflow-hidden pr-2">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
        />
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={disabled}
          className="absolute left-2 bottom-2 p-1.5 rounded-full text-gray-500 dark:text-gray-400 bg-transparent hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Upload picture"
        >
          <Plus size={22} />
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a science or math question... (Shift+Enter for new line)"
          className="w-full max-h-[200px] py-3 pl-12 pr-20 bg-transparent border-none focus:ring-0 resize-none outline-none text-gray-800 dark:text-gray-200"
          rows={1}
          disabled={disabled}
        />
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          <button
            type="button"
            disabled={disabled}
            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Voice input"
          >
            <Mic size={20} />
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className="p-1.5 rounded-full text-white bg-gray-800 dark:bg-white dark:text-black hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
      <div className="text-center mt-2 text-xs text-gray-400 dark:text-gray-500">
        AI Tutor can make mistakes. Consider verifying important information.
      </div>
    </div>
  );
}
