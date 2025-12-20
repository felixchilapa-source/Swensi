import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import * as d3 from 'd3';
import { GoogleGenAI } from "@google/genai";

// Ensure process is polyfilled for the browser if env-config.js failed or is slow
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}
const process = (window as any).process;

// --- 1. CORE TYPES ---
enum Role { CUSTOMER = 'CUSTOMER', PROVIDER = 'PROVIDER', ADMIN = 'ADMIN', LODGE = 'LODGE' }
enum BookingStatus { PENDING = 'PENDING', ACCEPTED = 'ACCEPTED', ON_TRIP = 'ON_TRIP', DELIVERED = 'DELIVERED', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED' }

interface User { id: string; phone: string; role: Role; name: string; balance: number; trustScore: number; isVerified: boolean; }
interface Booking { 
  id: string; customerId: string; providerId?: string; category: string; description: string; 
  status: BookingStatus; price: number; createdAt: number; location: { lat: number; lng: number };
  trackingHistory: { lat: number; lng: number }[];
}

const CATEGORIES = [
  { id: 'transport', name: 'Taxi & Bike', icon: 'fa-car-side', basePrice: 65, hint: "Fast movement in Nakonde" },
  { id: 'customs', name: 'Customs Clearing', icon: 'fa-file-contract', basePrice: 200, hint: "Border paperwork help" },
  { id: 'lodging', name: 'Lodges & Rooms', icon: 'fa-bed', basePrice: 350, hint: "Safe stays near the border" },
  { id: 'errands', name: 'Shopping/Errands', icon: 'fa-cart-shopping', basePrice: 50, hint: "Get groceries or goods" },
];

// --- 2. COMPONENTS ---

const NewsTicker = () => {
  const [news, setNews] = useState(["Connecting to Nakonde Trade Signal...", "Scanning Corridor..."]);
  useEffect(() => {
    const fetchNews = async () => {
      const apiKey = process.env.API_KEY;
      if (!apiKey) return;
      try {
        const ai = new GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: 'Generate 3 short news items for Nakonde trade link (max 8 words each).'
        });
        if (res.text) {
          const lines = res.text.split('\n').filter(l => l.length > 5).slice(0, 3);
          if (lines.length > 0) setNews(lines);
        }
      } catch (e) { console.debug("Ticker offline"); }
    };
    fetchNews();
    const interval = setInterval(fetchNews, 600000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900 py-2 overflow-hidden border-y border-white/5 h-8 flex items-center">
      <div className="flex animate-[ticker_30s_linear_infinite] whitespace-nowrap px-4">
        {news.concat(news).map((item, idx) => (
          <span key={idx} className="text-[10px] font-black text-blue-400 uppercase italic tracking-widest mx-8">• {item}</span>
        ))}
      </div>
    </div>
  );
};

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: "Mwapoleni! I'm Swensi AI. Ask me about Nakonde border procedures!" }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading || !process.env.API_KEY) return;
    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userText,
        config: { systemInstruction: `You are Swensi AI, helping with Nakonde border trade. Keep it brief and friendly.` },
      });
      setMessages(prev => [...prev, { role: 'bot', text: response.text || "Signal lost, zikomo." }]);
    } catch (err) { setMessages(prev => [...prev, { role: 'bot', text: "I'm currently offline." }]); }
    finally { setLoading(false); }
  };

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl z-[500] flex items-center justify-center animate-bounce border-4 border-slate-900">
        <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-robot'} text-xl`}></i>
      </button>
      {isOpen && (
        <div className="fixed inset-x-6 bottom-40 bg-slate-900 rounded-[32px] shadow-2xl z-[500] border border-blue-500/20 flex flex-col max-h-[50vh] overflow-hidden">
          <div className="p-4 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest italic">Swensi Assistant</div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-slate-800 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="Ask something..." className="flex-1 bg-slate-700 border-none rounded-xl px-4 py-3 text-xs text-white outline-none" />
            <button onClick={handleSend} className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center"><i className="fa-solid fa-paper-plane text-xs"></i></button>
          </div>
        </div>
      )}
    </>
  );
};

const MapView = ({ center, history = [] }: { center: { lat: number, lng: number }, history?: any[] }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!svgRef.current) return;
    const width = 400, height = 250;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.append("rect").attr("width", width).attr("height", height).attr("fill", "#020617");
    const xScale = d3.scaleLinear().domain([center.lng - 0.01, center.lng + 0.01]).range([0, width]);
    const yScale = d3.scaleLinear().domain([center.lat - 0.01, center.lat + 0.01]).range([height, 0]);
    if (history.length > 1) {
      svg.append("path").datum(history).attr("fill", "none").attr("stroke", "#1E40AF").attr("stroke-width", 3).attr("d", d3.line<any>().x(d => xScale(d.lng)).y(d => yScale(d.lat)));
    }
    svg.append("circle").attr("cx", xScale(center.lng)).attr("cy", yScale(center.lat)).attr("r", 8).attr("fill", "#059669").attr("stroke", "#fff").attr("stroke-width", 2);
  }, [center, history]);
  return <div className="w-full bg-slate-950 overflow-hidden shadow-inner"><svg ref={svgRef} viewBox="0 0 400 250" className="w-full h-auto"></svg></div>;
};

const Auth = ({ onLogin }: { onLogin: any }) => {
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(Role.CUSTOMER);
  const [step, setStep] = useState(1);
  return (
    <div className="flex flex-col justify-center items-center px-8 h-full bg-slate-950 text-white">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black italic text-blue-600 uppercase tracking-tighter">Swensi</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mt-2">Nakonde Trade Link</p>
      </div>
      <div className="w-full space-y-4 max-w-[340px]">
        {step === 1 ? (
          <>
            <div className="flex items-center bg-white/5 border border-white/10 rounded-[28px] p-5">
              <span className="text-slate-500 font-black mr-3">+260</span>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" className="bg-transparent text-white text-xl font-black outline-none w-full" />
            </div>
            <select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full p-6 bg-white/5 border border-white/10 rounded-[28px] font-black text-sm text-slate-400 outline-none appearance-none">
              <option value={Role.CUSTOMER}>Market User</option>
              <option value={Role.PROVIDER}>Corridor Partner</option>
            </select>
            <button onClick={() => setStep(2)} className="w-full bg-blue-700 py-6 rounded-[28px] font-black uppercase italic shadow-xl shadow-blue-600/20 active:scale-95 transition-all">Verify Node</button>
          </>
        ) : (
          <>
            <input placeholder="Code 123456" className="w-full p-6 text-center text-4xl font-black bg-white/5 border border-white/10 rounded-[28px] text-white" maxLength={6} />
            <button onClick={() => onLogin(phone, role)} className="w-full bg-blue-600 py-6 rounded-[28px] font-black uppercase italic active:scale-95 transition-all">Establish Link</button>
            <button onClick={() => setStep(1)} className="w-full text-slate-500 text-[10px] font-black uppercase italic mt-4">Change Phone</button>
          </>
        )}
      </div>
    </div>
  );
};

const MainApp = ({ user, logout, bookings, onAddBooking, onUpdateBooking }: any) => {
  const [tab, setTab] = useState('home');
  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      <header className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
        <h2 className="text-xl font-black italic text-blue-600">SWENSI</h2>
        <div className="text-right">
          <p className="text-[12px] font-black">ZMW {user.balance.toFixed(0)}</p>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Wallet</p>
        </div>
      </header>
      <NewsTicker />
      <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-6 no-scrollbar">
        {tab === 'home' ? (
          user.role === Role.CUSTOMER ? (
            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => onAddBooking(c)} className="bg-slate-900 p-8 rounded-[32px] border border-white/5 flex flex-col items-center gap-4 shadow-xl active:scale-95 transition-all">
                  <i className={`fa-solid ${c.icon} text-3xl text-blue-600`}></i>
                  <p className="text-[10px] font-black uppercase tracking-widest">{c.name}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Available Missions</h3>
              {bookings.filter((b:any) => b.status === BookingStatus.PENDING).map((b:any) => (
                <div key={b.id} className="bg-slate-900 p-6 rounded-[32px] border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-black uppercase text-blue-500 italic tracking-widest">{b.category}</p>
                    <p className="text-lg font-black italic">ZMW {b.price}</p>
                  </div>
                  <button onClick={() => onUpdateBooking(b.id, BookingStatus.ACCEPTED)} className="bg-blue-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase italic">Accept</button>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-6">
            {bookings.filter((b:any) => b.status !== BookingStatus.COMPLETED).map((b:any) => (
              <div key={b.id} className="bg-slate-900 rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
                {b.status === BookingStatus.ON_TRIP && <MapView center={b.location} history={b.trackingHistory} />}
                <div className="p-8">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase text-blue-500">{b.category} • {b.id}</span>
                    <span className="text-[10px] font-black uppercase text-emerald-500 animate-pulse">{b.status}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-400 italic">"{b.description}"</p>
                  {user.role === Role.PROVIDER && b.status === BookingStatus.ACCEPTED && (
                    <button onClick={() => onUpdateBooking(b.id, BookingStatus.COMPLETED)} className="w-full bg-blue-600 mt-6 py-4 rounded-2xl font-black uppercase italic text-xs">Complete Mission</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <nav className="absolute bottom-8 left-8 right-8 h-20 bg-slate-900/90 border border-white/10 rounded-[35px] flex justify-around items-center backdrop-blur-xl shadow-2xl z-[100]">
        <button onClick={() => setTab('home')} className={tab === 'home' ? 'text-blue-500 scale-110' : 'text-slate-500'}><i className="fa-solid fa-house-chimney text-xl"></i></button>
        <button onClick={() => setTab('active')} className={tab === 'active' ? 'text-blue-600 scale-110' : 'text-slate-500'}><i className="fa-solid fa-route text-xl"></i></button>
        <button onClick={logout} className="text-slate-500"><i className="fa-solid fa-power-off text-xl"></i></button>
      </nav>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>(() => JSON.parse(localStorage.getItem('swensi-v7-db') || '[]'));
  useEffect(() => localStorage.setItem('swensi-v7-db', JSON.stringify(bookings)), [bookings]);
  const onLogin = (phone: string, role: Role) => setUser({ id: 'U' + Math.random().toString(36).substr(2, 5).toUpperCase(), phone, role, name: 'Node-' + phone.slice(-4), balance: 1500, trustScore: 98, isVerified: true });
  const onAddBooking = (cat: any) => {
    const b: Booking = { id: 'SW-' + Math.random().toString(36).substr(2, 4).toUpperCase(), customerId: user!.id, category: cat.name, description: `Trade Request: ${cat.name}`, status: BookingStatus.PENDING, price: cat.basePrice || 100, createdAt: Date.now(), location: { lat: -9.3283, lng: 32.7569 }, trackingHistory: [{ lat: -9.3283, lng: 32.7569 }] };
    setBookings([b, ...bookings]);
  };
  const onUpdateBooking = (id: string, status: BookingStatus) => setBookings(prev => prev.map(b => b.id === id ? { ...b, status, providerId: user?.id } : b));

  return (
    <div className="app-container">
      {!user ? <Auth onLogin={onLogin} /> : <MainApp user={user} logout={() => setUser(null)} bookings={bookings} onAddBooking={onAddBooking} onUpdateBooking={onUpdateBooking} />}
      <AIAssistant />
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}