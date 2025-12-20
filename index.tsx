import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import * as d3 from 'd3';
import { GoogleGenAI, Modality, Type } from "@google/genai";

// --- 1. TYPES ---
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
  address?: string;
}

interface ShoppingItem {
  id: string;
  name: string;
  isAvailable: boolean;
}

interface User {
  id: string;
  phone: string;
  role: Role;
  name: string;
  isActive: boolean;
  location?: Location;
  balance: number;
  rating: number;
  memberSince: number;
  trustScore: number;
  isVerified: boolean;
  language: string;
  completedMissions?: number;
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
  customerPhone: string;
  price: number;
  commission: number;
  isPaid: boolean;
  trackingHistory: Location[];
  isShoppingOrder?: boolean;
  shoppingItems?: ShoppingItem[];
  recipientName?: string;
  recipientPhone?: string;
  customerTrustSnapshot?: number;
}

// --- 2. CONSTANTS ---
const COLORS = {
  PRIMARY: '#1E40AF',
  ACCENT: '#B87333',
  SECONDARY: '#0F172A',
  SUCCESS: '#059669',
  DANGER: '#DC2626'
};

const CATEGORIES = [
  { id: 'transport', name: 'Taxi & Bike', icon: 'fa-car-side', basePrice: 65, hint: "Fast movement in Nakonde" },
  { id: 'customs', name: 'Customs Clearing', icon: 'fa-file-contract', basePrice: 200, hint: "Border paperwork help" },
  { id: 'lodging', name: 'Lodges & Rooms', icon: 'fa-bed', basePrice: 350, hint: "Safe stays near the border" },
  { id: 'errands', name: 'Shopping/Errands', icon: 'fa-cart-shopping', basePrice: 50, hint: "Get groceries or goods" },
];

const TRANSLATIONS: Record<string, any> = {
  en: { welcome: "Mwapoleni!", slogan: "Border Trade Made Simple", login_phone: "Enter Phone", verify_phone: "Secure Sign In", home: "Home", active: "Trips", account: "Profile" },
  bem: { welcome: "Mwapoleni!", slogan: "Ubusuma ku mupaka", login_phone: "Ingileni", verify_phone: "Ishibeni foni", home: "Ng'anda", active: "Imilimo", account: "Profile" }
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
  const [news, setNews] = useState(["Nakonde Corridor Signal Active...", "Scanning for trade updates..."]);
  
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: (window as any).process.env.API_KEY });
        const res = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: 'Generate 5 short trade news lines for Nakonde border.',
          config: { systemInstruction: "Concise trade intelligence bot." }
        });
        if (res.text) setNews(res.text.split('\n').filter(l => l.trim().length > 5));
      } catch (e) { console.debug("Ticker offline"); }
    };
    fetchNews();
  }, []);

  return (
    <div className="bg-secondary py-2 overflow-hidden border-y border-white/5 relative h-8 flex items-center">
      <div className="flex animate-[ticker_40s_linear_infinite] whitespace-nowrap px-4">
        {news.concat(news).map((item, idx) => (
          <span key={idx} className="text-[9px] font-black text-blue-400 uppercase italic tracking-widest mx-6">• {item}</span>
        ))}
      </div>
      <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
};

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([{role: 'bot', text: "Mwapoleni! How can I help you trade today?"}]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input; setInput(''); setMessages(prev => [...prev, {role: 'user', text: userText}]);
    try {
      const ai = new GoogleGenAI({ apiKey: (window as any).process.env.API_KEY });
      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: userText });
      setMessages(prev => [...prev, {role: 'bot', text: res.text || "Zikomo!"}]);
    } catch { setMessages(prev => [...prev, {role: 'bot', text: "Signal error."}]); }
  };

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl z-[500] flex items-center justify-center border-4 border-white dark:border-slate-900 animate-bounce">
        <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-robot'}`}></i>
      </button>
      {isOpen && (
        <div className="fixed inset-x-6 bottom-40 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl z-[500] border border-emerald-500/20 flex flex-col max-h-[50vh] overflow-hidden">
          <div className="p-4 bg-emerald-600 text-white font-black text-[10px] uppercase">Swensi AI</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">{messages.map((m, i) => <div key={i} className={`p-3 rounded-2xl text-xs ${m.role === 'user' ? 'bg-emerald-100 ml-auto' : 'bg-slate-100'}`}>{m.text}</div>)}</div>
          <div className="p-3 border-t flex gap-2"><input value={input} onChange={e=>setInput(e.target.value)} className="flex-1 p-2 text-xs border rounded-xl" /><button onClick={handleSend} className="bg-emerald-600 text-white px-4 rounded-xl">Send</button></div>
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
    <div className="flex flex-col justify-center items-center px-6 h-full bg-white dark:bg-slate-950">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black italic text-blue-600 uppercase">Swensi Link</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Nakonde Trade Terminal</p>
      </div>
      <div className="w-full max-w-[340px] space-y-4">
        {step === 1 ? (
          <>
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone Number" className="w-full p-5 bg-slate-50 dark:bg-white/5 border rounded-[28px] text-xl font-black" />
            <select className="w-full p-5 bg-slate-50 dark:bg-white/5 border rounded-[28px] font-black text-xs" onChange={e=>setRole(e.target.value as Role)}>
              <option value={Role.CUSTOMER}>Market User</option>
              <option value={Role.PROVIDER}>Corridor Partner</option>
              <option value={Role.LODGE}>Station Manager</option>
            </select>
            <button onClick={()=>setStep(2)} className="w-full bg-blue-700 text-white font-black py-5 rounded-[28px] uppercase italic">Verify Link</button>
          </>
        ) : (
          <>
            <input placeholder="Code 123456" className="w-full p-5 text-center text-4xl font-black border rounded-[28px]" />
            <button onClick={()=>onLogin(phone, role)} className="w-full bg-secondary text-white font-black py-5 rounded-[28px] uppercase italic">Establish Link</button>
          </>
        )}
      </div>
    </div>
  );
};

const CustomerView: React.FC<any> = ({ user, bookings, onAddBooking, logout }) => {
  const [tab, setTab] = useState('home');
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <AIAssistant />
      <header className="p-5 border-b flex justify-between items-center bg-white dark:bg-slate-900">
        <h2 className="text-lg font-black italic text-blue-600">SWENSI</h2>
        <div className="text-right">
          <p className="text-[10px] font-black dark:text-white">ZMW {user.balance}</p>
          <p className="text-[7px] font-black text-slate-400 uppercase">Wallet</p>
        </div>
      </header>
      <NewsTicker />
      <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-6">
        {tab === 'home' ? (
          <div className="grid grid-cols-2 gap-4">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={()=>onAddBooking(c)} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border flex flex-col items-center gap-3 shadow-sm">
                <i className={`fa-solid ${c.icon} text-2xl text-blue-600`}></i>
                <p className="text-[10px] font-black uppercase">{c.name}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.length === 0 && <p className="text-center text-slate-400 py-10 uppercase text-[10px] font-black">No active missions</p>}
            {bookings.map(b => (
              <div key={b.id} className="bg-white dark:bg-slate-900 rounded-[32px] border overflow-hidden shadow-sm">
                {(b.status === 'ON_TRIP' || b.status === 'GOODS_IN_TRANSIT') && <Map center={b.location} markers={[{loc: b.location, color: COLORS.SUCCESS}]} />}
                <div className="p-6">
                  <p className="text-[10px] font-black text-blue-600 uppercase">{b.category} • {b.id}</p>
                  <p className="text-xs font-black uppercase italic mt-1">{b.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <nav className="absolute bottom-6 left-6 right-6 h-18 bg-white dark:bg-slate-900 border rounded-[32px] flex justify-around items-center shadow-xl">
        <button onClick={()=>setTab('home')} className={tab==='home'?'text-blue-600':'text-slate-400'}><i className="fa-solid fa-house"></i></button>
        <button onClick={()=>setTab('active')} className={tab==='active'?'text-blue-600':'text-slate-400'}><i className="fa-solid fa-truck"></i></button>
        <button onClick={logout} className="text-slate-400"><i className="fa-solid fa-power-off"></i></button>
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
      <header className="p-5 border-b border-white/5 flex justify-between items-center">
        <h2 className="text-lg font-black italic text-blue-500">PARTNER</h2>
        <button onClick={logout} className="text-slate-600"><i className="fa-solid fa-power-off"></i></button>
      </header>
      <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-4">
        {tab === 'leads' ? leads.map(l => (
          <div key={l.id} className="bg-white/5 border border-white/10 p-6 rounded-[32px]">
            <p className="text-[10px] font-black uppercase text-blue-500">{l.category}</p>
            <p className="text-2xl font-black italic">ZMW {l.price}</p>
            <button onClick={()=>onUpdate(l.id, BookingStatus.ACCEPTED, user.id)} className="w-full bg-blue-600 mt-4 py-4 rounded-2xl font-black uppercase text-[10px]">Accept Mission</button>
          </div>
        )) : active.map(a => (
          <div key={a.id} className="bg-white/5 border border-white/10 p-6 rounded-[32px]">
             <p className="text-[10px] font-black uppercase text-amber-500">{a.status}</p>
             <button onClick={()=>onUpdate(a.id, BookingStatus.COMPLETED, user.id)} className="w-full bg-green-600 mt-4 py-4 rounded-2xl font-black uppercase text-[10px]">Complete</button>
          </div>
        ))}
      </div>
      <nav className="absolute bottom-6 left-6 right-6 h-18 bg-white/5 border border-white/10 rounded-[32px] flex justify-around items-center">
        <button onClick={()=>setTab('leads')} className={tab==='leads'?'text-blue-500':'text-slate-600'}><i className="fa-solid fa-satellite"></i></button>
        <button onClick={()=>setTab('active')} className={tab==='active'?'text-blue-500':'text-slate-600'}><i className="fa-solid fa-route"></i></button>
      </nav>
    </div>
  );
};

// --- 5. CORE APP ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(() => JSON.parse(localStorage.getItem('swensi-users-v3') || '[]'));
  const [bookings, setBookings] = useState<Booking[]>(() => JSON.parse(localStorage.getItem('swensi-bookings-v3') || '[]'));

  useEffect(() => localStorage.setItem('swensi-users-v3', JSON.stringify(allUsers)), [allUsers]);
  useEffect(() => localStorage.setItem('swensi-bookings-v3', JSON.stringify(bookings)), [bookings]);

  const handleLogin = (phone: string, role: Role) => {
    const existing = allUsers.find(u => u.phone === phone);
    const u: User = existing || {
      id: 'U-' + Math.random().toString(36).substr(2, 5),
      phone, role, name: 'Node ' + phone.slice(-4),
      isActive: true, balance: 1000, rating: 5, memberSince: Date.now(),
      trustScore: 90, isVerified: true, language: 'en'
    };
    if (!existing) setAllUsers(prev => [...prev, u]);
    setUser(u);
  };

  const addBooking = (cat: any) => {
    const b: Booking = {
      id: 'SW-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      customerId: user!.id, customerPhone: user!.phone, status: BookingStatus.PENDING,
      createdAt: Date.now(), location: { lat: -9.3283, lng: 32.7569 },
      category: cat.id, price: cat.basePrice, commission: cat.basePrice * 0.1,
      isPaid: false, trackingHistory: [{ lat: -9.3283, lng: 32.7569 }],
      description: `Service request for ${cat.name}`
    };
    setBookings(prev => [b, ...prev]);
  };

  const updateBooking = (id: string, status: BookingStatus, pid: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status, providerId: pid } : b));
  };

  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <div className="mobile-container dark">
      {user.role === Role.CUSTOMER && <CustomerView user={user} bookings={bookings.filter(b=>b.customerId===user.id)} onAddBooking={addBooking} logout={()=>setUser(null)} />}
      {user.role === Role.PROVIDER && <ProviderView user={user} bookings={bookings} onUpdate={updateBooking} logout={()=>setUser(null)} />}
      {(user.role === Role.LODGE || user.role === Role.ADMIN) && <div className="p-10 text-white text-center">Command Center Operational<button onClick={()=>setUser(null)} className="block mx-auto mt-10 bg-white/10 p-4 rounded-xl">Logout</button></div>}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);