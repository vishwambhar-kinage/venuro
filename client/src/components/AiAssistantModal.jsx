import { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Sparkles, Send, X, Bot, User, ArrowRight } from 'lucide-react';

const QUICK_PROMPTS = [
  { label: '🎬 Movies Playing', msg: 'Show me top movies and showtimes' },
  { label: '🎵 Live Concerts', msg: 'Upcoming music concerts in Mumbai' },
  { label: '🏏 Sports Matches', msg: 'Sports matches and stadium tickets' },
  { label: '💳 Payment Modes', msg: 'What payment methods and discounts are available?' },
  { label: '❌ Refund Policy', msg: 'Explain the cancellation and instant refund policy' },
  { label: '🪑 Seat Types', msg: 'What seat tiers are available and how do Redis locks work?' },
];

export default function AiAssistantModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm **Venu AI** 🎟️, your personal entertainment concierge!\n\nI can assist you with:\n• Finding movies, concerts, standup comedy & sports\n• Answering venue and pricing details\n• Redis seat reservation & instant refund policies\n\nWhat would you like to experience today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiSource, setAiSource] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text = input.trim()) => {
    if (!text || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: text };
    const typingMsg = { role: 'assistant', content: '', typing: true };
    setMessages(prev => [...prev, userMsg, typingMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-8).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: m.content,
      }));
      const res = await aiAPI.chat(text, history);
      setAiSource(res.data?.source || res.source);
      setMessages(prev => [
        ...prev.filter(m => !m.typing),
        { role: 'assistant', content: res.data?.reply || res.reply, source: res.data?.source || res.source },
      ]);
    } catch {
      setMessages(prev => prev.filter(m => !m.typing));
      toast.error('AI assistant is momentarily busy. Please try again!');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 font-bold">$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-gray-200 w-full sm:max-w-lg flex flex-col shadow-2xl overflow-hidden"
        style={{ height: '88vh', maxHeight: '640px' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#333545] text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#f84464] rounded-xl flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Venu AI Concierge</p>
              <p className="text-[11px] text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block animate-pulse" />
                <span>{aiSource === 'gemini' ? 'Gemini 1.5 Flash + Vector RAG' : 'Instant Semantic Search'}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8f9fa]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-[#f84464] text-white'
                  : 'bg-[#333545] text-white'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#f84464] text-white rounded-tr-sm shadow-sm'
                  : 'bg-white text-slate-700 border border-gray-200 rounded-tl-sm shadow-sm'
              }`}>
                {msg.typing ? (
                  <div className="flex gap-1.5 items-center py-1">
                    <div className="w-2 h-2 bg-[#f84464] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-[#f84464] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-[#f84464] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <>
                    <div dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
                    {msg.source === 'gemini' && (
                      <p className="text-[#f84464] text-[10px] mt-2 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Gemini AI Verified
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 2 && (
          <div className="px-4 py-2.5 bg-white border-t border-gray-100 flex-shrink-0">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Suggested Questions</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map(({ label, msg }) => (
                <button key={label} onClick={() => sendMessage(msg)} disabled={loading}
                  className="bg-gray-100 hover:bg-rose-50 hover:border-[#f84464] hover:text-[#f84464] border border-gray-200 text-slate-700 text-xs px-2.5 py-1 rounded-full transition-all">
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="p-3.5 bg-white border-t border-gray-200 flex-shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask anything about shows, seats, prices..."
              disabled={loading}
              className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:border-[#f84464] focus:bg-white transition"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-[#f84464] hover:bg-[#d83552] text-white rounded-xl flex items-center justify-center transition disabled:opacity-40 flex-shrink-0 shadow-md shadow-[#f84464]/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
