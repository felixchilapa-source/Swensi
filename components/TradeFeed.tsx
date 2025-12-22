
import React, { useEffect, useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

interface NewsItem {
  title: string;
  category: string;
  content: string;
  timestamp: string;
}

const TradeFeed: React.FC = () => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: 'Generate 3 short, relevant news items for traders and travelers in Nakonde. Focus on exchange rates, border queue times, and safety tips. JSON format.',
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  content: { type: Type.STRING },
                  timestamp: { type: Type.STRING, description: "Time like '2h ago' or 'Just now'" }
                }
              }
            }
          }
        });

        const data = JSON.parse(response.text || '[]');
        setItems(data);
      } catch (e) {
        console.error("News fetch failed", e);
        setItems([
          { title: "Border Flow Update", category: "Transport", content: "Main gate congestion is medium. Expect 1hr delay.", timestamp: "1h ago" },
          { title: "Currency Alert", category: "Finance", content: "Kwacha steady against Shilling. Good time to buy stock.", timestamp: "3h ago" },
          { title: "Safety Notice", category: "Security", content: "Heavy rains reported on T2 road. Drive carefully.", timestamp: "5h ago" }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
         {[1,2].map(i => (
           <div key={i} className="bg-white dark:bg-slate-900 rounded-[24px] p-5 border border-slate-100 dark:border-white/5 h-24"></div>
         ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-black italic uppercase text-slate-900 dark:text-white mb-2">Corridor Updates</h3>
      {items.map((item, idx) => (
        <div key={idx} className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="bg-blue-600/10 text-blue-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">{item.category}</span>
            <span className="text-[9px] text-slate-400 font-bold">{item.timestamp}</span>
          </div>
          <h4 className="text-sm font-black italic text-slate-800 dark:text-slate-200 mb-1">{item.title}</h4>
          <p className="text-xs text-slate-500 leading-relaxed">{item.content}</p>
        </div>
      ))}
    </div>
  );
};

export default TradeFeed;
