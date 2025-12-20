
import React, { useEffect, useState } from 'react';
import { GoogleGenAI } from "@google/genai";

const NewsTicker: React.FC = () => {
  const [news, setNews] = useState<string[]>([
    "Scanning T1 Corridor...",
    "Fetching Exchange Rates...",
    "Monitoring Border Gates..."
  ]);

  useEffect(() => {
    const fetchTradeIntelligence = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: 'Generate 6 hyper-short trade updates for Nakonde border. Include: ZMW/TZS rate, ZMW/USD rate, a current border congestion status (Low/Med/High), and a safety tip for traders. Format: Plain lines.',
          config: {
            systemInstruction: "You are the Swensi Trade Intelligence Engine. Your data must be formatted for a fast-scrolling ticker.",
          }
        });

        const text = response.text || "";
        const lines = text.split('\n')
          .map(l => l.replace(/^[0-9.-]+\s*/, '').trim())
          .filter(l => l.length > 3);
          
        if (lines.length > 0) setNews(lines);
      } catch (err) {
        setNews([
          "USD/ZMW: 26.45 | TZS/ZMW: 0.01",
          "Border Flow: Medium Congestion",
          "Alert: Keep all council receipts digital",
          "Weather: Heavy rain likely - cover goods",
          "Trade: Customs system back online"
        ]);
      }
    };

    fetchTradeIntelligence();
    const interval = setInterval(fetchTradeIntelligence, 180000); // Update every 3 mins
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-slate-900 py-2.5 overflow-hidden border-y border-white/5 relative h-10 flex items-center shadow-2xl z-40">
      <div className="absolute left-0 top-0 bottom-0 px-5 bg-slate-900 z-50 flex items-center border-r border-white/5 shadow-[15px_0_20px_rgba(0,0,0,0.8)]">
        <span className="text-[8px] font-black uppercase text-blue-500 tracking-[0.3em] italic whitespace-nowrap">Intelligence</span>
      </div>
      <div className="flex animate-[ticker_40s_linear_infinite] whitespace-nowrap items-center pl-[120px]">
        {news.concat(news).map((item, idx) => (
          <div key={idx} className="flex items-center gap-6 px-6 border-r border-white/10">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0"></div>
             <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight italic leading-none">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsTicker;
