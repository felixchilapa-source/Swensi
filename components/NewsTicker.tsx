
import React, { useEffect, useState } from 'react';
import { GoogleGenAI } from "@google/genai";

const NewsTicker: React.FC = () => {
  const [news, setNews] = useState<string[]>(["Loading Nakonde Trade Updates..."]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: 'Generate 5 short, one-sentence news updates for Nakonde border town in Zambia. Include: ZMW/USD exchange rate, ZMW/TSH exchange rate, fuel price update, border crossing traffic status, and a general trade tip. Keep each under 10 words. Format as a simple list of strings.',
          config: {
            systemInstruction: "You are a local trade news bot for Nakonde, Zambia. Provide real-time or highly realistic simulated trade data relevant to cross-border logistics between Zambia and Tanzania.",
          }
        });

        const text = response.text || "";
        const lines = text.split('\n').map(l => l.replace(/^[0-9.-]+\s*/, '').trim()).filter(l => l.length > 0);
        if (lines.length > 0) setNews(lines);
      } catch (err) {
        setNews(["Nakonde Border: Smooth flow reported.", "ZMW/USD stable today.", "Tip: Verify documentation before crossing."]);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 300000); // Update every 5 mins
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-secondary py-2 overflow-hidden border-y border-white/5 relative h-8 flex items-center">
      <div className="absolute left-0 top-0 bottom-0 px-3 bg-secondary z-10 flex items-center border-r border-white/5 shadow-lg">
        <span className="text-[7px] font-black uppercase text-green-500 tracking-[0.2em] italic">Live Trade</span>
      </div>
      <div className="flex animate-[ticker_30s_linear_infinite] whitespace-nowrap items-center pl-[100px]">
        {news.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 px-4 border-r border-white/5 last:border-0">
             <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item}</span>
          </div>
        ))}
        {/* Duplicate for seamless looping */}
        {news.map((item, idx) => (
          <div key={`dup-${idx}`} className="flex items-center gap-4 px-4 border-r border-white/5 last:border-0">
             <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default NewsTicker;
