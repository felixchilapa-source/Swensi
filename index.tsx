import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import * as d3 from 'd3';
import { GoogleGenAI } from "@google/genai";

// POLYFILL: Ensure process is defined for the browser to prevent crashes
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

const getApiKey = () => (window as any).process?.env?.API_KEY || '';

// --- 1. CORE TYPES ---
enum Role { CUSTOMER = 'CUSTOMER', PROVIDER = 'PROVIDER', ADMIN = 'ADMIN', LODGE = 'LODGE' }
enum BookingStatus { PENDING = 'PENDING', ACCEPTED = 'ACCEPTED', ON_TRIP = 'ON_TRIP', DELIVERED = 'DELIVERED', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED' }

interface User {
  id: string; phone: string; role: Role; name: string; balance: number; trustScore: number; isVerified: boolean;
}

interface Booking {
  id: string; customerId: string; providerId?: string; category: string; description: string; 
  status: BookingStatus; price: number; createdAt: number; location: { lat: number; lng: number };
  trackingHistory: { lat: number; lng: number }[];
}

// --- 2. UI COMPONENTS ---

const NewsTicker = () => {
  const [news, setNews] = useState(["Connecting to Nakonde Trade Signal...", "Scanning Corridor..."]);
  useEffect(() => {
    const fetchNews = async () => {
      const apiKey = getApiKey();
      if (!apiKey) return;
      try {
        const ai = new GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: 'Generate 3 very short news items for Nakonde trade link (max 8 words each).'
        });
        if (res.text) setNews(res.text.split('\n').filter(l => l.length > 5).slice(0, 3));
      } catch (e) { console.debug("Ticker offline"); }
    };
    fetchNews();
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

// --- 3. DASHBOARDS ---

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
      <div className="w-full space-y-4">
        {step === 1 ? (
          <>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" className="w-full p-6 bg-white/5 border border-white/10 rounded-[28px] text-xl font-black outline-none focus:border-blue-600" />
            <select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full p-6 bg-white/5 border border-white/10 rounded-[28px] font-black text-sm text-slate-400 outline-none">
              <option value={Role.CUSTOMER}>Market User</option>
              <option value={Role.PROVIDER}>Corridor Partner</option>
            </select>
            <button onClick={() => setStep(2)} className="w-full bg-blue-700 py-6 rounded-[28px] font-black uppercase italic shadow-xl shadow-blue-600/20">Verify Node</button>
          </>
        ) : (
          <>
            <input placeholder="Code 123456" className="w-full p-6 text-center text-4xl font-black bg-white/5 border border-white/10 rounded-[28px]" />
            <button onClick={() => onLogin(phone, role)} className="w-full bg-blue-600 py-6 rounded-[28px] font-black uppercase italic">Establish Link</button>
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
          <p className="text-[12px] font-black">ZMW {user.balance}</p>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Wallet</p>
        </div>
      </header>
      <NewsTicker />
      
      <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-6 no-scrollbar">
        {tab === 'home' ? (
          user.role === Role.CUSTOMER ? (
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'transport', name: 'Taxi', icon: 'fa-car-side' },
                { id: 'customs', name: 'Customs', icon: 'fa-file-contract' },
                { id: 'lodging', name: 'Lodges', icon: 'fa-bed' },
                { id: 'errands', name: 'Errands', icon: 'fa-shopping-cart' }
              ].map(c => (
                <button key={c.id} onClick={() => onAddBooking(c)} className="bg-slate-900 p-8 rounded-[32px] border border-white/5 flex flex-col items-center gap-4 shadow-xl active:scale-95 transition-all">
                  <i className={`fa-solid ${c.icon} text-3xl text-blue-600`}></i>
                  <p className="text-[10px] font-black uppercase tracking-widest">{c.name}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Available Missions</h3>
              {bookings.filter((b:any) => b.status === BookingStatus.PENDING).map((b:any) => (
                <div key={b.id} className="bg-slate-900 p-6 rounded-[32px] border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-black uppercase text-blue-500">{b.category}</p>
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
                  <div className="flex justify-between items-center mb-2">
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

// --- 4. ROOT APP ---

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>(() => JSON.parse(localStorage.getItem('swensi-v5-db') || '[]'));

  useEffect(() => localStorage.setItem('swensi-v5-db', JSON.stringify(bookings)), [bookings]);

  const onLogin = (phone: string, role: Role) => {
    setUser({ id: 'U' + Math.random().toString(36).substr(2, 5), phone, role, name: 'Node-' + phone.slice(-4), balance: 1500, trustScore: 98, isVerified: true });
  };

  const onAddBooking = (cat: any) => {
    const b: Booking = { id: 'SW-' + Math.random().toString(36).substr(2, 4).toUpperCase(), customerId: user!.id, category: cat.name, description: `Request for ${cat.name}`, status: BookingStatus.PENDING, price: 100, createdAt: Date.now(), location: { lat: -9.3283, lng: 32.7569 }, trackingHistory: [{ lat: -9.3283, lng: 32.7569 }] };
    setBookings([b, ...bookings]);
  };

  const onUpdateBooking = (id: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status, providerId: user?.id } : b));
  };

  return (
    <div className="app-container">
      {!user ? <Auth onLogin={onLogin} /> : <MainApp user={user} logout={() => setUser(null)} bookings={bookings} onAddBooking={onAddBooking} onUpdateBooking={onUpdateBooking} />}
    </div>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<App />);
}