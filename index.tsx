import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import * as d3 from 'd3';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
enum Role {
  CUSTOMER = 'CUSTOMER',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
  SHOP_OWNER = 'SHOP_OWNER',
  LODGE = 'LODGE'
}

enum BookingStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  SO_TICKING = 'SO_TICKING',
  GOODS_IN_TRANSIT = 'GOODS_IN_TRANSIT',
  ON_TRIP = 'ON_TRIP',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ROOM_ASSIGNED = 'ROOM_ASSIGNED'
}

interface Location {
  lat: number;
  lng: number;
}

interface User {
  id: string;
  phone: string;
  role: Role;
  name: string;
  isActive: boolean;
  balance: number;
  rating: number;
  memberSince: number;
  trustScore: number;
  isVerified: boolean;
  language: string;
}

interface Booking {
  id: string;
  customerId: string;
  customerPhone: string;
  status: BookingStatus;
  category: string;
  price: number;
  location: Location;
  trackingHistory: Location[];
  description: string;
  providerId?: string;
}

// --- CONSTANTS ---
const CATEGORIES = [
  { id: 'transport', name: 'Taxi & Bike', icon: 'fa-car-side', basePrice: 65 },
  { id: 'customs', name: 'Customs Clearing', icon: 'fa-file-contract', basePrice: 200 },
  { id: 'lodging', name: 'Lodges & Rooms', icon: 'fa-bed', basePrice: 350 },
  { id: 'errands', name: 'Shopping/Errands', icon: 'fa-cart-shopping', basePrice: 50 },
];

const TRANSLATIONS: Record<string, any> = {
  en: { welcome: "Mwapoleni!", slogan: "Border Trade Made Simple", home: "Home", active: "Trips", account: "Profile" }
};

// --- COMPONENTS ---

const Map: React.FC<{ center: Location; markers?: any[] }> = ({ center, markers = [] }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!svgRef.current) return;
    const width = 400; const height = 200;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.append("rect").attr("width", width).attr("height", height).attr("fill", "#0F172A");
    const xScale = d3.scaleLinear().domain([center.lng - 0.02, center.lng + 0.02]).range([0, width]);
    const yScale = d3.scaleLinear().domain([center.lat - 0.02, center.lat + 0.02]).range([height, 0]);
    markers.forEach(m => {
      svg.append("circle").attr("cx", xScale(m.loc.lng)).attr("cy", yScale(m.loc.lat)).attr("r", 6).attr("fill", m.color).attr("stroke", "#fff");
    });
  }, [center, markers]);
  return <div className="w-full bg-slate-900 h-40"><svg ref={svgRef} viewBox="0 0 400 200" className="w-full h-full"></svg></div>;
};

const NewsTicker: React.FC = () => {
  const [news, setNews] = useState(["Nakonde Signal Active", "Trade Corridor Operational"]);
  useEffect(() => {
    const fetchNews = async () => {
      const apiKey = (window as any).process?.env?.API_KEY;
      if (!apiKey) return;
      try {
        const ai = new GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: 'Short Nakonde border news line.',
        });
        if (res.text) setNews([res.text.trim()]);
      } catch (e) { console.debug("Ticker offline"); }
    };
    fetchNews();
  }, []);
  return (
    <div className="bg-blue-900/20 py-2 border-y border-white/5 overflow-hidden whitespace-nowrap">
      <div className="animate-[ticker_20s_linear_infinite] inline-block px-4 text-[10px] font-bold text-blue-400 uppercase italic tracking-widest">
        {news.join(" • ")} • {news.join(" • ")}
      </div>
      <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [phone, setPhone] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState('home');

  const handleLogin = () => {
    if (phone.length < 9) return alert("Enter valid phone");
    setUser({
      id: 'u1', phone, role: Role.CUSTOMER, name: 'User ' + phone.slice(-4),
      isActive: true, balance: 1200, rating: 5, memberSince: Date.now(),
      trustScore: 95, isVerified: true, language: 'en'
    });
  };

  if (!user) {
    return (
      <div className="mobile-container dark flex flex-col items-center justify-center p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black italic text-blue-600">SWENSI</h1>
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Trade Terminal</p>
        </div>
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone Number" className="w-full p-5 bg-white/5 border border-white/10 rounded-[28px] text-white text-xl font-black mb-4" />
        <button onClick={handleLogin} className="w-full bg-blue-600 text-white font-black py-5 rounded-[28px] uppercase italic">Verify Link</button>
      </div>
    );
  }

  return (
    <div className="mobile-container dark flex flex-col">
      <header className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
        <h2 className="text-xl font-black italic text-blue-600 uppercase">Swensi</h2>
        <div className="text-right">
          <p className="text-[10px] font-black text-white italic">ZMW {user.balance}</p>
          <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Balance</p>
        </div>
      </header>
      <NewsTicker />
      <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-6 no-scrollbar">
        {tab === 'home' && (
          <div className="grid grid-cols-2 gap-4">
            {CATEGORIES.map(c => (
              <button key={c.id} className="bg-slate-900 border border-white/5 p-6 rounded-[32px] flex flex-col items-center gap-3">
                <i className={`fa-solid ${c.icon} text-2xl text-blue-500`}></i>
                <p className="text-[10px] font-black uppercase text-white">{c.name}</p>
              </button>
            ))}
          </div>
        )}
        {tab === 'active' && (
           <div className="text-center py-20 opacity-30">
             <i className="fa-solid fa-route text-4xl mb-4"></i>
             <p className="text-[10px] font-black uppercase">No active missions</p>
           </div>
        )}
      </div>
      <nav className="absolute bottom-6 left-6 right-6 h-18 bg-slate-900/90 border border-white/10 rounded-[32px] flex justify-around items-center backdrop-blur-xl">
        <button onClick={()=>setTab('home')} className={tab==='home'?'text-blue-500':'text-slate-500'}><i className="fa-solid fa-house"></i></button>
        <button onClick={()=>setTab('active')} className={tab==='active'?'text-blue-500':'text-slate-500'}><i className="fa-solid fa-truck"></i></button>
        <button onClick={()=>setUser(null)} className="text-slate-500"><i className="fa-solid fa-power-off"></i></button>
      </nav>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);