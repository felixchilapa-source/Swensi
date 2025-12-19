
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: "Mwapoleni! I'm Swensi AI. Ask me about Nakonde border fees, clearing, or how to use the app!" }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userText,
        config: {
          systemInstruction: `You are Swensi AI, a helpful Zambian trade assistant for the Nakonde border town. 
          Respond in a friendly "Zambian" style, occasionally using local words like "Mwapoleni", "Zikomo", or "Busa". 
          Help with: border procedures, clearing goods, finding transport, and safety tips. 
          Keep answers short (under 50 words).`,
        },
      });

      const botText = response.text || "I'm having a bit of signal trouble, zikomo for your patience!";
      setMessages(prev => [...prev, { role: 'bot', text: botText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I'm offline. Check your data!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl z-[500] flex items-center justify-center animate-bounce hover:animate-none active:scale-90 transition-all border-4 border-white dark:border-slate-900"
      >
        <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-robot'} text-xl`}></i>
      </button>

      {isOpen && (
        <div className="fixed inset-x-6 bottom-40 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl z-[500] border border-emerald-500/20 flex flex-col max-h-[60vh] animate-slide-up overflow-hidden">
          <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-brain-circuit"></i>
              <span className="text-[10px] font-black uppercase tracking-widest italic">Swensi Assistant</span>
            </div>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                  m.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-white/10'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-2xl rounded-tl-none animate-pulse">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex gap-2">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your question..."
              className="flex-1 bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 ring-emerald-500"
            />
            <button 
              onClick={handleSend}
              className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all"
            >
              <i className="fa-solid fa-paper-plane text-xs"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
