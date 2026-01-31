
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import MarkdownRenderer from './common/MarkdownRenderer';
import AccuracyHint from './common/AccuracyHint';

interface AIChatProps {
  history: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

const AIChat: React.FC<AIChatProps> = ({ history, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isLoading]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-250px)]">
      <div className="col-span-1 md:col-span-3 mb-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <AccuracyHint />
        <h2 className="text-xl font-bold text-slate-800 armenian-text text-center mt-4">7. AI Օգնական (Chat)</h2>
        <p className="text-sm text-slate-600 armenian-text mt-2 text-center leading-relaxed">
          Սա ձեր անձնական AI օգնականն է։ Այն տիրապետում է ձեր վերբեռնած ֆայլերի և ստացված վերլուծությունների համատեքստին։ Դուք կարող եք հարցեր տալ՝ ավելի խորը հասկանալու համար այս կամ այն խախտումը, ճշգրտելու հաշվարկները կամ պարզապես զրուցելու նախագծի մանրամասների շուրջ։
        </p>
      </div>

      <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-6">
        {history.map((msg, index) => (
          <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth={2} /></svg>
              </div>
            )}
            <div className={`max-w-xl p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
              <MarkdownRenderer content={msg.content} />
            </div>
          </div>
        ))}
        {isLoading && history[history.length - 1]?.role === 'user' && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth={2} /></svg>
            </div>
            <div className="max-w-xl p-4 rounded-2xl bg-slate-100 flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-300"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        {history.length > 0 && <AccuracyHint />}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Գրեք ձեր հարցը այստեղ..."
            rows={2}
            className="w-full pl-4 pr-20 py-3 text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all armenian-text resize-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center transition-all hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
