
import React, { useState, useMemo, useRef } from 'react';
import { User, Booking, BookingStatus, Location } from '../types';
import Map from './Map';
import { GoogleGenAI } from "@google/genai";
import { LANGUAGES } from '../constants';

interface GroundingResult {
  title: string;
  uri: string;
}

interface LodgeDashboardProps {
  user: User;
  logout: () => void;
  bookings: Booking[];
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onUpdateUser: (updates: Partial<User>) => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  onLanguageChange: (lang: string) => void;
  t: (key: string) => string;
  location?: Location;
}

const LodgeDashboard: React.FC<LodgeDashboardProps> = ({ user, logout, bookings, onUpdateBooking, onUpdateUser, location = { lat: -9.3283, lng: 32.7569 }, onToggleTheme, isDarkMode, onLanguageChange, t }) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'guests' | 'account'>('requests');
  const [roomInput, setRoomInput] = useState<{ [key: string]: string }>({});
  const [nearbyResults, setNearbyResults] = useState<GroundingResult[]>([]);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone);

  const requests = useMemo(() => bookings.filter(b => b.status === BookingStatus.PENDING), [bookings]);
  const guests = useMemo(() => bookings.filter(b => b.status === BookingStatus.ROOM_ASSIGNED), [bookings]);

  const handleSearchNearby = async (query: string) => {
    setIsSearchingNearby(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find ${query} for guests in Nakonde.`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: { latLng: { latitude: location.lat, longitude: location.lng } }
          }
        },
      });

      const results: GroundingResult[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.maps) {
            results.push({ title: chunk.maps.title, uri: chunk.maps.uri });
          }
        });
      }
      setNearbyResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingNearby(false);
    }
  };

  const handleCheckIn = (id: string) => {
    const room = roomInput[id];
    if (!room) return alert('Assign room #');
    onUpdateBooking(id, { status: BookingStatus.ROOM_ASSIGNED, roomNumber: room, receiptId: 'RCIPT-' + Math.random().toString(36).substr(2, 6).toUpperCase() });
  };

  const handleSaveProfile = () => {
    onUpdateUser({ name: editName, phone: editPhone });
    setIsEditing(false);
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdateUser({ avatarUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <header className="px-5 py-6 bg-purple-700 text-white shadow-xl">
        <div className="flex justify-between items-center">
           <div>
             <h2 className="text-xl font-black italic uppercase">Swensi Stays</h2>
             <p className="text-[7px] font-black text-purple-200 tracking-[0.3em] uppercase mt-1">Hospitality Hub</p>
           </div>
           <button onClick={logout} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 active:scale-95 transition-all"><i className="fa-solid fa-power-off text-xs"></i></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-32 px-4 pt-6 space-y-6 no-scrollbar">
        {activeTab === 'requests' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-[35px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-lg">
                <Map center={location} markers={[{ loc: location, color: '#7C3AED', label: 'Station' }]} />
                <div className="p-4 flex flex-col gap-4">
                    <div className="flex gap-2">
                        <button onClick={() => handleSearchNearby('restaurants')} className="flex-1 py-3 rounded-2xl bg-purple-600/10 text-purple-600 text-[9px] font-black uppercase tracking-widest italic border border-purple-600/20 active:scale-95 transition-all">Dining</button>
                        <button onClick={() => handleSearchNearby('pharmacies')} className="flex-1 py-3 rounded-2xl bg-red-600/10 text-red-600 text-[9px] font-black uppercase tracking-widest italic border border-red-600/20 active:scale-95 transition-all">Pharmacy</button>
                    </div>
                    {/* Render grounding results as required by Google GenAI guidelines */}
                    {nearbyResults.length > 0 && (
                      <div className="mt-2 space-y-2 border-t border-slate-100 dark:border-white/5 pt-4">
                        <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest px-1">Nearby Map Results</p>
                        <div className="flex flex-wrap gap-2">
                          {nearbyResults.map((res, i) => (
                            <a key={i} href={res.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black uppercase bg-purple-600/5 border border-purple-500/20 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-purple-600/10 transition-colors">
                              <i className="fa-solid fa-arrow-up-right-from-square text-[7px]"></i> {res.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {isSearchingNearby && <p className="text-[8px] font-black uppercase text-purple-500 animate-pulse px-1">Querying Map Protocols...</p>}
                </div>
            </div>

            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Reservation Queue</h3>
            {requests.map(req => (
              <div key={req.id} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-xl border border-slate-100 dark:border-white/5">
                 <h4 className="text-lg font-black text-secondary dark:text-white italic">{req.customerPhone}</h4>
                 <div className="flex gap-2 mt-4">
                    <input placeholder="Room #" value={roomInput[req.id] || ''} onChange={(e) => setRoomInput({...roomInput, [req.id]: e.target.value})} className="w-24 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 text-xs font-black text-slate-800 dark:text-white outline-none focus:border-purple-600" />
                    <button onClick={() => handleCheckIn(req.id)} className="flex-1 bg-purple-600 text-white font-black py-4 rounded-2xl text-[9px] uppercase shadow-lg italic">Assign</button>
                 </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-white/5 shadow-xl text-center">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              <div onClick={handleAvatarClick} className="w-24 h-24 mx-auto bg-purple-700 rounded-full flex items-center justify-center text-white text-3xl font-black italic shadow-2xl mb-6 overflow-hidden relative group cursor-pointer">
                {user.avatarUrl ? <img src={user.avatarUrl} alt="Station" className="w-full h-full object-cover" /> : user.name.charAt(0)}
              </div>
              <h2 className="text-2xl font-black text-secondary dark:text-white italic uppercase tracking-tighter leading-none">{user.name}</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 italic leading-none">{user.phone}</p>
            </div>

            {/* Lodge Settings */}
            <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-white/5 shadow-xl space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 italic ml-2">Station Settings</h3>
              
              <button 
                onClick={onToggleTheme}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10"
              >
                <div className="flex items-center gap-3">
                  <i className={`fa-solid ${isDarkMode ? 'fa-moon text-purple-400' : 'fa-sun text-amber-500'} text-lg`}></i>
                  <span className="text-[10px] font-black uppercase tracking-widest dark:text-white italic">Theme</span>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-purple-600' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${isDarkMode ? 'right-1' : 'left-1'}`}></div>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.map(lang => (
                  <button 
                    key={lang.code}
                    onClick={() => onLanguageChange(lang.code)}
                    className={`p-4 rounded-2xl border flex items-center justify-center gap-2 transition-all active:scale-95 ${user.language === lang.code ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-600 dark:text-slate-400'}`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest italic">{lang.name}</span>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
                 <button onClick={() => setIsEditing(true)} className="w-full bg-purple-600/10 text-purple-600 font-black py-4 rounded-3xl text-[9px] uppercase tracking-widest italic border border-purple-600/20">Edit Details</button>
                 <button onClick={logout} className="w-full bg-red-500/10 text-red-500 font-black py-4 rounded-3xl text-[9px] uppercase tracking-widest italic border border-red-500/20">Sign Out</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="absolute bottom-6 left-6 right-6 h-20 glass-nav rounded-[32px] border border-white/10 flex justify-around items-center px-4 shadow-2xl z-50">
        <button onClick={() => setActiveTab('requests')} className={`flex-1 flex flex-col items-center ${activeTab === 'requests' ? 'text-purple-600 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-bell-concierge text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1.5 italic">Queue</span>
        </button>
        <button onClick={() => setActiveTab('guests')} className={`flex-1 flex flex-col items-center ${activeTab === 'guests' ? 'text-purple-600 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-key text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1.5 italic">Guests</span>
        </button>
        <button onClick={() => setActiveTab('account')} className={`flex-1 flex flex-col items-center ${activeTab === 'account' ? 'text-purple-600 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-user-gear text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1.5 italic">Station</span>
        </button>
      </nav>
    </div>
  );
};

export default LodgeDashboard;
