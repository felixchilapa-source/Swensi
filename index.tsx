import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import * as d3 from 'd3';
import { GoogleGenAI } from "@google/genai";

// Safe access to environment variables injected by server.js
const getApiKey = () => (window as any).process?.env?.API_KEY || '';

// --- 1. TYPES ---
enum Role {
  CUSTOMER = 'CUSTOMER',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
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
  isPremium?: boolean;
}

interface Booking {
  id: string;
  customerId: string;
  providerId?: string;
  category: string;
  description: string;
  status: BookingStatus;
  location: Location;
  createdAt: number;
  price: number;
  commission: number;
  isPaid: boolean;
  trackingHistory: Location[];
  customerTrustSnapshot?: number;
  roomNumber?: string;
}

// --- 2. CONSTANTS ---
const CATEGORIES = [
  { id: 'transport', name: 'Taxi & Bike', icon: 'fa-car-side', basePrice: 65, hint: "Fast movement in Nakonde" },
  { id: 'customs', name: 'Customs Clearing', icon: 'fa-file-contract', basePrice: 200, hint: "Border paperwork help" },
  { id: 'lodging', name: 'Lodges & Rooms', icon: 'fa-bed', basePrice: 350, hint: "Safe stays near the border" },
  { id: 'errands', name: 'Shopping/Errands', icon: 'fa-cart-shopping', basePrice: 50, hint: "Get groceries or goods" },
];

const TRANSLATIONS: Record<string, any> = {
  en: { welcome: "Mwapoleni!", slogan: "Nakonde Trade Terminal", home: "Home", trips: "Trips", profile: "Profile" }
};

// --- 3. COMPONENTS ---

const Map: React.FC<{ center: Location; markers?: any[]; trackingHistory?: Location[] }> = ({ center, markers = [], trackingHistory = [] }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const width = 400, height = 250;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.append("rect").attr("width", width).attr("height", height).attr("fill", "#0F172A");

    const xScale = d3.scaleLinear().domain([center.lng - 0.02, center.lng + 0.02]).range([0, width]);
    const yScale = d3.scaleLinear().domain([center.lat - 0.02, center.lat + 0.02]).range([height, 0]);

    if (trackingHistory.length > 1) {
      svg.append("path").datum(trackingHistory).attr("fill", "none").attr("stroke", "#1E40AF").attr("stroke-width", 3).attr("d", d3.line<any>().x(d => xScale(d.lng)).y(d => yScale(d.lat)));
    }

    markers.forEach(m => {
      svg.append("circle").attr("cx", xScale(m.loc.lng)).attr("cy", yScale(m.loc.lat)).attr("r", 7).attr("fill", m.color).attr("stroke", "#fff").attr("stroke-width", 2);
    });
  }, [center, markers, trackingHistory]);

  return <div className="w-full bg-slate-950 overflow-hidden relative shadow-inner"><svg ref={svgRef} viewBox="0 0 400 250" className="w-full h-auto"></svg></div>;
};

const NewsTicker: React.FC = () => {
  const [news, setNews] = useState(["Connecting to Swensi Intelligence...", "Fetching Corridor Status..."]);
  
  useEffect(() => {
    const fetchNews = async () => {
      const apiKey = getApiKey();
      if (!apiKey) return;
      try {
        const ai = new GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: 'Short trade news items for Nakonde border.',
          config: { systemInstruction: "Concise border news bot." }
        });
        if (res.text) setNews(res.text.split('\n').filter(l => l.trim().length > 5).slice(0, 5));
      } catch (e) { console.debug("Ticker offline"); }
    };
    fetchNews();
  }, []);

  return (
    <div className="bg-slate-900 py-2 overflow-hidden border-y border-white/5 h-8 flex items-center">
      <div className="flex animate-[ticker_40s_linear_infinite] whitespace-nowrap px-4">
        {news.concat(news).map((item, idx) => (
          <span key={idx} className="text-[9px] font-black text-blue-400 uppercase italic tracking-widest mx-6">• {item}</span>
        ))}
      </div>
    </div>
  );
};

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([{role: 'bot', text: "Mwapoleni! Swensi AI at your service."}]);

  const handleSend = async () => {
    const apiKey = getApiKey();
    if (!input.trim() || !apiKey) return;
    const userText = input; setInput(''); setMessages(prev => [...prev, {role: 'user', text: userText}]);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: userText });
      setMessages(prev => [...prev, {role: 'bot', text: res.text || "Zikomo!"}]);
    } catch { setMessages(prev => [...prev, {role: 'bot', text: "Signal lost."}]); }
  };

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl z-[500] flex items-center justify-center border-4 border-slate-900 animate-bounce">
        <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-robot'}`}></i>
      </button>
      {isOpen && (
        <div className="fixed inset-x-6 bottom-40 bg-slate-900 rounded-[32px] shadow-2xl z-[500] border border-blue-500/20 flex flex-col max-h-[50vh] overflow-hidden text-white">
          <div className="p-4 bg-blue-700 font-black text-[10px] uppercase">Swensi Assistant</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">{messages.map((m, i) => <div key={i} className={`p-3 rounded-2xl text-xs ${m.role === 'user' ? 'bg-blue-600 ml-auto' : 'bg-white/5'}`}>{m.text}</div>)}</div>
          <div className="p-3 border-t border-white/5 flex gap-2"><input value={input} onChange={e=>setInput(e.target.value)} className="flex-1 p-2 text-xs bg-white/5 rounded-xl border-none outline-none" /><button onClick={handleSend} className="bg-blue-600 px-4 rounded-xl">Send</button></div>
        </div>
      )}
    </>
  );
};

// --- 4. MAIN DASHBOARDS ---

const Auth: React.FC<{ onLogin: any }> = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(Role.CUSTOMER);

  return (
    <div className="flex flex-col justify-center items-center px-6 h-full bg-slate-950">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black italic text-blue-600 uppercase tracking-tighter">Swensi Link</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Nakonde Trade Terminal</p>
      </div>
      <div className="w-full max-w-[340px] space-y-4">
        {step === 1 ? (
          <>
            <div className="flex items-center bg-white/5 border border-white/10 rounded-[28px] p-5">
              <span className="text-slate-500 font-black mr-3 text-lg">+260</span>
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="9XXXXXXXX" className="bg-transparent text-white text-xl font-black outline-none w-full" />
            </div>
            <select className="w-full p-5 bg-white/5 border border-white/10 rounded-[28px] font-black text-xs text-slate-400 appearance-none" onChange={e=>setRole(e.target.value as Role)}>
              <option value={Role.CUSTOMER}>Market User</option>
              <option value={Role.PROVIDER}>Corridor Partner</option>
              <option value={Role.LODGE}>Station Manager</option>
            </select>
            <button onClick={()=>setStep(2)} className="w-full bg-blue-700 text-white font-black py-5 rounded-[28px] uppercase italic shadow-xl shadow-blue-600/20">Verify Link</button>
          </>
        ) : (
          <>
            <input placeholder="Code 123456" className="w-full p-5 text-center text-4xl font-black border border-white/10 bg-white/5 rounded-[28px] text-white" />
            <button onClick={()=>onLogin(phone, role)} className="w-full bg-blue-600 text-white font-black py-5 rounded-[28px] uppercase italic">Establish Link</button>
          </>
        )}
      </div>
    </div>
  );
};

const CustomerView: React.FC<any> = ({ user, bookings, onAddBooking, logout }) => {
  const [tab, setTab] = useState('home');
  return (
    <div className="flex flex-col h-full bg-slate-950">
      <AIAssistant />
      <header className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-900/80 backdrop-blur-xl">
        <h2 className="text-lg font-black italic text-blue-600">SWENSI</h2>
        <div className="text-right">
          <p className="text-[10px] font-black text-white">ZMW {user.balance}</p>
          <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Escrow Balance</p>
        </div>
      </header>
      <NewsTicker />
      <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-6">
        {tab === 'home' ? (
          <div className="grid grid-cols-2 gap-4">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={()=>onAddBooking(c)} className="bg-slate-900 p-6 rounded-[32px] border border-white/5 flex flex-col items-center gap-3 shadow-xl hover:border-blue-600 transition-all">
                <i className={`fa-solid ${c.icon} text-2xl text-blue-600`}></i>
                <p className="text-[10px] font-black uppercase text-white tracking-tighter">{c.name}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.length === 0 && <p className="text-center text-slate-600 py-10 uppercase text-[10px] font-black">No active missions detected</p>}
            {bookings.map(b => (
              <div key={b.id} className="bg-slate-900 rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
                {(b.status === 'ON_TRIP' || b.status === 'GOODS_IN_TRANSIT') && <Map center={b.location} markers={[{loc: b.location, color: '#059669'}]} />}
                <div className="p-6">
                  <p className="text-[10px] font-black text-blue-600 uppercase italic">{b.category} • {b.id}</p>
                  <p className="text-xs font-black uppercase mt-1 text-white">{b.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <nav className="absolute bottom-6 left-6 right-6 h-18 bg-slate-900/90 border border-white/10 rounded-[32px] flex justify-around items-center shadow-2xl backdrop-blur-xl">
        <button onClick={()=>setTab('home')} className={tab==='home'?'text-blue-600':'text-slate-500'}><i className="fa-solid fa-house-chimney text-lg"></i></button>
        <button onClick={()=>setTab('active')} className={tab==='active'?'text-blue-600':'text-slate-500'}><i className="fa-solid fa-truck-fast text-lg"></i></button>
        <button onClick={logout} className="text-slate-500"><i className="fa-solid fa-power-off text-lg"></i></button>
      </nav>
    </div>
  );
};

const ProviderView: React.FC<any> = ({ user, bookings, onUpdate, logout }) => {
  const [tab, setTab] = useState('leads');
  const leads = bookings.filter(b => b.status === BookingStatus.PENDING);
  const active = bookings.filter(b => b.providerId === user.id && b.status !== BookingStatus.COMPLETED);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      <header className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-900/80 backdrop-blur-xl">
        <h2 className="text-lg font-black italic text-blue-500">CORRIDOR PARTNER</h2>
        <button onClick={logout} className="text-slate-600"><i className="fa-solid fa-power-off"></i></button>
      </header>
      <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-4">
        {tab === 'leads' ? leads.map(l => (
          <div key={l.id} className="bg-slate-900 border border-white/10 p-6 rounded-[32px] shadow-2xl">
            <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">{l.category}</p>
            <p className="text-3xl font-black italic mt-1">ZMW {l.price}</p>
            <button onClick={()=>onUpdate(l.id, BookingStatus.ACCEPTED, user.id)} className="w-full bg-blue-600 mt-4 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/20">Accept Mission</button>
          </div>
        )) : active.map(a => (
          <div key={a.id} className="bg-slate-900 border border-white/10 p-6 rounded-[32px] shadow-2xl">
             <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">{a.status}</p>
             <button onClick={()=>onUpdate(a.id, BookingStatus.COMPLETED, user.id)} className="w-full bg-green-600 mt-4 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-green-600/20">Mission Success</button>
          </div>
        ))}
      </div>
      <nav className="absolute bottom-6 left-6 right-6 h-18 bg-slate-900/90 border border-white/10 rounded-[32px] flex justify-around items-center backdrop-blur-xl shadow-2xl">
        <button onClick={()=>setTab('leads')} className={tab==='leads'?'text-blue-500':'text-slate-500'}><i className="fa-solid fa-satellite text-lg"></i></button>
        <button onClick={()=>setTab('active')} className={tab==='active'?'text-blue-500':'text-slate-500'}><i className="fa-solid fa-route text-lg"></i></button>
      </nav>
    </div>
  );
};

// --- 5. CORE APP ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(() => JSON.parse(localStorage.getItem('swensi-users-v4') || '[]'));
  const [bookings, setBookings] = useState<Booking[]>(() => JSON.parse(localStorage.getItem('swensi-bookings-v4') || '[]'));

  useEffect(() => localStorage.setItem('swensi-users-v4', JSON.stringify(allUsers)), [allUsers]);
  useEffect(() => localStorage.setItem('swensi-bookings-v4', JSON.stringify(bookings)), [bookings]);

  const handleLogin = (phone: string, role: Role) => {
    const existing = allUsers.find(u => u.phone === phone);
    const u: User = existing || {
      id: 'U-' + Math.random().toString(36).substr(2, 5),
      phone, role, name: 'Node ' + phone.slice(-4),
      isActive: true, balance: 1250, rating: 5, memberSince: Date.now(),
      trustScore: 90, isVerified: true, language: 'en'
    };
    if (!existing) setAllUsers(prev => [...prev, u]);
    setUser(u);
  };

  const addBooking = (cat: any) => {
    if (user!.balance < cat.basePrice) return alert("Insufficient Escrow Balance");
    const b: Booking = {
      id: 'SW-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      customerId: user!.id, status: BookingStatus.PENDING,
      createdAt: Date.now(), location: { lat: -9.3283, lng: 32.7569 },
      category: cat.id, price: cat.basePrice, commission: cat.basePrice * 0.1,
      isPaid: false, trackingHistory: [{ lat: -9.3283, lng: 32.7569 }],
      description: `Trade Request: ${cat.name}`
    };
    setBookings(prev => [b, ...prev]);
    setUser(u => u ? {...u, balance: u.balance - cat.basePrice} : null);
  };

  const updateBooking = (id: string, status: BookingStatus, pid: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status, providerId: pid } : b));
  };

  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <div className="mobile-container dark">
      {user.role === Role.CUSTOMER && <CustomerView user={user} bookings={bookings.filter(b=>b.customerId===user.id)} onAddBooking={addBooking} logout={()=>setUser(null)} />}
      {user.role === Role.PROVIDER && <ProviderView user={user} bookings={bookings} onUpdate={updateBooking} logout={()=>setUser(null)} />}
      {(user.role === Role.LODGE || user.role === Role.ADMIN) && <div className="p-10 text-white text-center">Terminal View Restricted to Desktop Command Nodes<button onClick={()=>setUser(null)} className="block mx-auto mt-10 bg-white/10 p-4 rounded-xl">Logout</button></div>}
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}