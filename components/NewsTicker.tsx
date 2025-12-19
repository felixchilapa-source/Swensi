
import React, { useEffect, useState } from 'react';
import { GoogleGenAI } from "@google/genai";

const NewsTicker: React.FC = () => {
  const [news, setNews] = useState<string[]>(["Initializing Swensi Trade Signal...", "Nakonde Corridor Scanning..."]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Fix: Use direct API key reference as per coding guidelines
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: 'Generate 5 very short (under 8 words) news items for Nakonde trade link: include ZMW/USD rate, border status, and a trade tip. Format as plain text lines.',
          config: {
            systemInstruction: "You are a professional trade intelligence bot for the Nakonde border corridor.",
          }
        });

        const text = response.text || "";
        const lines = text.split('\n')
          .map(l => l.replace(/^[0-9.-]+\s*/, '').trim())
          .filter(l => l.length > 5);
          
        if (lines.length > 0) setNews(lines);
      } catch (err) {
        setNews([
          "Nakonde: T1 Corridor traffic clear.",
          "USD/ZMW: Stability observed today.",
          "Trade Tip: Use verified Swensi partners.",
          "Weather: Clear skies for transport.",
          "Safety: Security protocols active."
        ]);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 300000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-secondary py-2.5 overflow-hidden border-y border-white/5 relative h-9 flex items-center shadow-2xl">
      <div className="absolute left-0 top-0 bottom-0 px-4 bg-secondary/95 backdrop-blur-md z-10 flex items-center border-r border-white/5 shadow-[10px_0_20px_rgba(0,0,0,0.5)]">
        <span className="text-[8px] font-black uppercase text-blue-500 tracking-[0.3em] italic">Signal</span>
      </div>
      <div className="flex animate-[ticker_35s_linear_infinite] whitespace-nowrap items-center pl-10">
        {news.concat(news).map((item, idx) => (
          <div key={idx} className="flex items-center gap-6 px-6 border-r border-white/10">
             <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></div>
             <span className="text-[11px] font-black text-slate-300/80 uppercase tracking-tight italic">{item}</span>
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
