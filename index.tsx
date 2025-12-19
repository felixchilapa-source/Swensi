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
  earnings?: number;
  memberSince: number;
  rating: number;
  language: string;
  trustScore: number;
  isVerified: boolean;
  hospitalityCashflow?: number;
  cancellationRate?: number;
  onTimeRate?: number;
  completedMissions?: number;
  isPremium?: boolean;
}

interface Booking {
  id: string;
  customerId: string;
  providerId?: string;
  lodgeId?: string;
  category: string;
  description: string;
  status: BookingStatus;
  location: Location;
  destination?: Location;
  createdAt: number;
  scheduledAt?: number;
  customerPhone: string;
  price: number;
  commission: number;
  isPaid: boolean;
  isTrustedTransportOnly?: boolean;
  trackingHistory: Location[];
  isShoppingOrder?: boolean;
  shoppingItems?: ShoppingItem[];
  shopOwnerPhone?: string;
  roomNumber?: string;
  receiptId?: string;
  cancellationReason?: string;
  recipientName?: string;
  recipientPhone?: string;
  customerTrustSnapshot?: number;
  providerTrustSnapshot?: number;
}

// --- CONSTANTS ---
const COLORS = {
  PRIMARY: '#1E40AF',
  ACCENT: '#B87333',
  SECONDARY: '#0F172A',
  NEUTRAL: '#F8FAFC',
  HOSPITALITY: '#7C3AED',
  DANGER: '#DC2626',
  SUCCESS: '#059669',
  WARNING: '#D97706'
};

const SUPER_ADMIN = '0961179384';

const CATEGORIES = [
  { id: 'transport', name: 'Taxi & Bike', icon: <i className="fa-solid fa-car-side"></i>, requiresLicense: true, basePrice: 65, hint: "Fast movement in Nakonde" },
  { id: 'customs', name: 'Customs Clearing', icon: <i className="fa-solid fa-file-contract"></i>, trustThreshold: 50, basePrice: 200, hint: "Help with border paperwork" },
  { id: 'lodging', name: 'Lodges & Rooms', icon: <i className="fa-solid fa-bed"></i>, subscriptionFee: 250, basePrice: 350, hint: "Safe stays near the border" },
  { id: 'errands', name: 'Shopping/Errands', icon: <i className="fa-solid fa-cart-shopping"></i>, trustThreshold: 20, basePrice: 50, hint: "Get groceries or goods" },
  { id: 'trades', name: 'Skilled Workers', icon: <i className="fa-solid fa-wrench"></i>, basePrice: 150, hint: "Mechanics, plumbers, etc." },
];

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇿🇲' },
  { code: 'bem', name: 'Bemba', flag: '🇿🇲' },
  { code: 'nya', name: 'Nyanja', flag: '🇿🇲' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
];

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    welcome: "Mwapoleni! Welcome to Swensi",
    slogan: "Border Trade Made Simple",
    login_phone: "Enter Phone Number",
    verify_phone: "Secure Sign In",
    home: "Home",
    active: "Trips",
    account: "Profile",
    book_now: "Book Service",
    wallet: "Mobile Money Wallet",
    landmark_placeholder: "e.g. Near Nakonde Market or Total Station"
  },
  bem: {
    welcome: "Mwapoleni! Karibu kuli Swensi",
    slogan: "Ubusuma ku mupaka wa Nakonde",
    login_phone: "Ingileni na foni yenu",
    verify_phone: "Ishibeni foni",
    home: "Pa Ng'anda",
    active: "Imilimo",
    account: "Ipepala",
    book_now: "Order Nomba",
    wallet: "Indalama sha foni",
    landmark_placeholder: "Papi na marketi nangu ku stationi"
  }
};

// --- COMPONENTS ---

const NewsTicker: React.FC = () => {
  const [news, setNews] = useState<string[]>(["Nakonde Corridor Operational", "USD/ZMW Rates Stable"]);
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: (window as any).process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: 'Generate 5 very short (under 8 words) news items for Nakonde trade link: include ZMW/USD rate, border status, and a trade tip. Format as plain text lines.',
          config: { systemInstruction: "You are a professional trade intelligence bot for the Nakonde border corridor." }
        });
        const text = response.text || "";
        const lines = text.split('\n').map(l => l.replace(/^[0-9.-]+\s*/, '').trim()).filter(l => l.length > 5);
        if (lines.length > 0) setNews(lines);
      } catch (err) { console.debug("Ticker use default news"); }
    };
    fetchNews();
    const interval = setInterval(fetchNews, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-secondary py-2 overflow-hidden border-y border-white/5 relative h-9 flex items-center shadow-2xl">
      <div className="absolute left-0 top-0 bottom-0 px-4 bg-secondary/95 backdrop-blur-md z-10 flex items-center border-r border-white/5">
        <span className="text-[8px] font-black uppercase text-blue-500 tracking-[0.3em] italic">Signal</span>
      </div>
      <div className="flex animate-[ticker_35s_linear_infinite] whitespace-nowrap items-center pl-10">
        {news.concat(news).map((item, idx) => (
          <div key={idx} className="flex items-center gap-6 px-6 border-r border-white/10">
             <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></div>
             <span className="text-[10px] font-black text-slate-300/80 uppercase tracking-tight italic">{item}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
};

const Map: React.FC<{ center: Location; markers?: any[]; trackingHistory?: Location[]; showRoute?: boolean }> = ({ center, markers = [], trackingHistory = [], showRoute = true }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!svgRef.current) return;
    const width = 400; const height = 300;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.append("rect").attr("width", width).attr("height", height).attr("fill", "#0F172A");
    const xScale = d3.scaleLinear().domain([center.lng - 0.04, center.lng + 0.04]).range([0, width]);
    const yScale = d3.scaleLinear().domain([center.lat - 0.04, center.lat + 0.04]).range([height, 0]);
    if (trackingHistory.length > 1) {
      svg.append("path").datum(trackingHistory).attr("fill", "none").attr("stroke", "#1E40AF").attr("stroke-width", 3).attr("d", d3.line<any>().x(d => xScale(d.lng)).y(d => yScale(d.lat)));
    }
    markers.forEach(m => {
      svg.append("circle").attr("cx", xScale(m.loc.lng)).attr("cy", yScale(m.loc.lat)).attr("r", 7).attr("fill", m.color).attr("stroke", "#fff").attr("stroke-width", 2);
    });
  }, [center, markers, trackingHistory]);
  return <div className="w-full bg-slate-950 overflow-hidden relative shadow-inner"><svg ref={svgRef} viewBox="0 0 400 300" className="w-full h-auto"></svg></div>;
};

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([{ role: 'bot', text: "Mwapoleni! I'm Swensi AI. Ask me about Nakonde border fees!" }]);
  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input; setInput(''); setMessages(prev => [...prev, { role: 'user', text: userText }]);
    try {
      const ai = new GoogleGenAI({ apiKey: (window as any).process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userText,
        config: { systemInstruction: "Friendly Zambian trade assistant for Nakonde border. Under 50 words." },
      });
      setMessages(prev => [...prev, { role: 'bot', text: response.text || "Zikomo!" }]);
    } catch { setMessages(prev => [...prev, { role: 'bot', text: "Signal error." }]); }
  };
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl z-[500] flex items-center justify-center animate-bounce border-4 border-white dark:border-slate-900">
        <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-robot'} text-xl`}></i>
      </button>
      {isOpen && (
        <div className="fixed inset-x-6 bottom-40 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl z-[500] border border-emerald-500/20 flex flex-col max-h-[60vh] overflow-hidden animate-slide-up">
           <div className="p-4 bg-emerald-600 text-white font-black text-[10px] uppercase italic">Swensi Assistant</div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4">{messages.map((m, i) => <div key={i} className={`p-3 rounded-2xl text-xs ${m.role === 'user' ? 'bg-emerald-100 text-emerald-900 ml-auto' : 'bg-slate-100 text-slate-800'}`}>{m.text}</div>)}</div>
           <div className="p-3 border-t flex gap-2"><input value={input} onChange={(e)=>setInput(e.target.value)} className="flex-1 p-3 text-xs border rounded-xl" /><button onClick={handleSend} className="bg-emerald-600 text-white px-4 rounded-xl"><i className="fa-solid fa-paper-plane"></i></button></div>
        </div>
      )}
    </>
  );
};

// --- DASHBOARDS ---

const Auth: React.FC<any> = ({ onLogin, onToggleTheme, isDarkMode, language, onLanguageChange, t, adminNumbers }) => {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<Role>(Role.CUSTOMER);
  const handleAuth = () => { if(phone.length >= 9) setStep(2); };
  const verify = () => onLogin(phone, language, selectedRole);
  return (
    <div className="flex flex-col justify-center items-center px-6 h-full bg-white dark:bg-slate-950">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-blue-600 italic">SWENSI LINK</h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nakonde Trade Terminal</p>
      </div>
      <div className="w-full max-w-[340px] space-y-6">
        {step === 1 ? (
          <div className="space-y-4">
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone Number" className="w-full p-5 bg-slate-100 dark:bg-white/5 border rounded-[28px] text-xl font-black" />
            <select className="w-full p-5 bg-slate-100 dark:bg-white/5 border rounded-[28px] font-black text-xs" onChange={(e)=>setSelectedRole(e.target.value as Role)}>
               <option value={Role.CUSTOMER}>Market User</option>
               <option value={Role.PROVIDER}>Corridor Partner</option>
               <option value={Role.LODGE}>Station Manager</option>
            </select>
            <button onClick={handleAuth} className="w-full bg-blue-700 text-white font-black py-5 rounded-[28px] uppercase italic">Verify Signal</button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-[10px] font-black text-slate-400">ENTER CODE 123456</p>
            <input placeholder="000000" className="w-full p-5 text-center text-4xl font-black border rounded-[28px] bg-slate-50" />
            <button onClick={verify} className="w-full bg-secondary text-white font-black py-5 rounded-[28px] uppercase italic">Establish Link</button>
          </div>
        )}
      </div>
    </div>
  );
};

const CustomerDashboard: React.FC<any> = ({ user, logout, bookings, onAddBooking, t }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'active' | 'account'>('home');
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <AIAssistant />
      <header className="px-5 py-5 border-b flex justify-between items-center glass-nav sticky top-0 z-50">
        <h2 className="text-xl font-black italic text-blue-600 uppercase">Swensi</h2>
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-black text-slate-600 dark:text-white italic">ZMW {user.balance.toFixed(0)}</p>
          <button onClick={logout} className="w-9 h-9 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-400"><i className="fa-solid fa-power-off"></i></button>
        </div>
      </header>
      <NewsTicker />
      <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-8 no-scrollbar">
        {activeTab === 'home' && (
          <div className="grid grid-cols-2 gap-4 animate-fade-in">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => onAddBooking({ category: cat.id, price: cat.basePrice })} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border flex flex-col items-center justify-center min-h-[140px] shadow-sm hover:border-blue-600">
                <div className="text-2xl text-blue-600 mb-2">{cat.icon}</div>
                <p className="text-[10px] font-black uppercase text-center">{cat.name}</p>
              </button>
            ))}
          </div>
        )}
        {activeTab === 'active' && (
          <div className="space-y-6 animate-fade-in">
             {bookings.map(b => (
               <div key={b.id} className="bg-white dark:bg-slate-900 rounded-[32px] border overflow-hidden shadow-lg">
                 {b.status === 'ON_TRIP' && <Map center={b.location} markers={[{loc: b.location, color: '#059669', label: 'Partner'}]} />}
                 <div className="p-6">
                    <p className="text-[9px] font-black text-blue-600 uppercase">{b.category} • {b.id}</p>
                    <p className="text-xs font-black uppercase italic mt-1">{b.status}</p>
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>
      <nav className="absolute bottom-6 left-6 right-6 h-18 glass-nav rounded-[32px] border flex justify-around items-center z-50">
        <button onClick={()=>setActiveTab('home')} className={activeTab==='home'?'text-blue-600':'text-slate-400'}><i className="fa-solid fa-house"></i></button>
        <button onClick={()=>setActiveTab('active')} className={activeTab==='active'?'text-blue-600':'text-slate-400'}><i className="fa-solid fa-truck"></i></button>
        <button onClick={()=>setActiveTab('account')} className={activeTab==='account'?'text-blue-600':'text-slate-400'}><i className="fa-solid fa-user"></i></button>
      </nav>
    </div>
  );
};

const ProviderDashboard: React.FC<any> = ({ user, logout, bookings, onUpdateStatus }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'ops'>('leads');
  const leads = bookings.filter(b => b.status === BookingStatus.PENDING);
  const active = bookings.filter(b => b.providerId === user.id && b.status !== BookingStatus.COMPLETED);
  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      <header className="p-5 border-b border-white/5 flex justify-between items-center">
        <h2 className="text-xl font-black italic text-blue-500 uppercase">Partner Hub</h2>
        <button onClick={logout} className="text-slate-500"><i className="fa-solid fa-power-off"></i></button>
      </header>
      <div className="flex-1 overflow-y-auto p-5 pb-32">
        {activeTab === 'leads' ? (
          <div className="space-y-4">
             {leads.map(l => (
               <div key={l.id} className="bg-white/5 border border-white/10 p-6 rounded-[32px]">
                  <p className="text-[10px] font-black uppercase text-blue-500">{l.category}</p>
                  <p className="text-2xl font-black mt-1">ZMW {l.price}</p>
                  <button onClick={()=>onUpdateStatus(l.id, BookingStatus.ACCEPTED, user.id)} className="w-full bg-blue-600 mt-4 py-4 rounded-2xl font-black uppercase text-[10px]">Accept Mission</button>
               </div>
             ))}
          </div>
        ) : (
          <div className="space-y-4">
            {active.map(a => (
               <div key={a.id} className="bg-white/5 border border-white/10 p-6 rounded-[32px]">
                  <p className="text-[10px] font-black uppercase text-amber-500">{a.status}</p>
                  <button onClick={()=>onUpdateStatus(a.id, BookingStatus.COMPLETED, user.id)} className="w-full bg-green-600 mt-4 py-4 rounded-2xl font-black uppercase text-[10px]">Finish Mission</button>
               </div>
            ))}
          </div>
        )}
      </div>
      <nav className="absolute bottom-6 left-6 right-6 h-18 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] flex justify-around items-center">
         <button onClick={()=>setActiveTab('leads')} className={activeTab==='leads'?'text-blue-500':'text-slate-500'}><i className="fa-solid fa-satellite"></i></button>
         <button onClick={()=>setActiveTab('ops')} className={activeTab==='ops'?'text-blue-500':'text-slate-500'}><i className="fa-solid fa-route"></i></button>
      </nav>
    </div>
  );
};

// --- APP CORE ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(() => JSON.parse(localStorage.getItem('swensi-users-v2') || '[]'));
  const [bookings, setBookings] = useState<Booking[]>(() => JSON.parse(localStorage.getItem('swensi-bookings-v2') || '[]'));
  const [language, setLanguage] = useState('en');

  useEffect(() => localStorage.setItem('swensi-users-v2', JSON.stringify(allUsers)), [allUsers]);
  useEffect(() => localStorage.setItem('swensi-bookings-v2', JSON.stringify(bookings)), [bookings]);

  const handleLogin = (phone: string, lang: string, forcedRole: Role) => {
    const existing = allUsers.find(u => u.phone === phone);
    const u: User = existing || {
      id: Math.random().toString(36).substr(2, 9),
      phone, role: forcedRole, name: 'Node ' + phone.slice(-4),
      isActive: true, balance: 500, rating: 5, memberSince: Date.now(),
      trustScore: 90, isVerified: true, language: lang
    };
    if(!existing) setAllUsers(prev => [...prev, u]);
    setUser(u);
  };

  const addBooking = (data: Partial<Booking>) => {
    const b: Booking = {
      id: 'SW-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      customerId: user!.id, customerPhone: user!.phone, status: BookingStatus.PENDING,
      createdAt: Date.now(), location: { lat: -9.3283, lng: 32.7569 },
      category: data.category!, price: data.price!, commission: data.price! * 0.1,
      isPaid: false, trackingHistory: [{ lat: -9.3283, lng: 32.7569 }],
      description: data.description || '', ...data
    } as Booking;
    setBookings(prev => [b, ...prev]);
  };

  const updateStatus = (id: string, status: BookingStatus, pid: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status, providerId: pid } : b));
  };

  if (!user) return <Auth onLogin={handleLogin} t={(k:string)=>TRANSLATIONS[language][k]||k} />;

  return (
    <div className="mobile-container dark">
      {user.role === Role.CUSTOMER && <CustomerDashboard user={user} bookings={bookings.filter(b=>b.customerId===user.id)} onAddBooking={addBooking} logout={()=>setUser(null)} t={(k:string)=>TRANSLATIONS[language][k]||k} />}
      {user.role === Role.PROVIDER && <ProviderDashboard user={user} bookings={bookings} onUpdateStatus={updateStatus} logout={()=>setUser(null)} />}
      {user.role === Role.LODGE && <div className="p-10 text-white text-center">Lodge View Operational (Demo Mode)<button onClick={()=>setUser(null)} className="block mx-auto mt-10 bg-white/10 p-4 rounded-xl">Logout</button></div>}
      {user.role === Role.ADMIN && <div className="p-10 text-white text-center">Command Center Active<button onClick={()=>setUser(null)} className="block mx-auto mt-10 bg-white/10 p-4 rounded-xl">Logout</button></div>}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
