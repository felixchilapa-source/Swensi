
import React, { useState, useMemo, useRef } from 'react';
import { User, Booking, BookingStatus, Location } from '../types';
import Map from './Map';
import { GoogleGenAI } from "@google/genai";
import { LANGUAGES, COLORS } from '../constants';

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
  const [priceInput, setPriceInput] = useState<{ [key: string]: string }>({});
  const [nearbyResults, setNearbyResults] = useState<GroundingResult[]>([]);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inventory logic
  const roomsCount = user.availableRooms || 0;

  const requests = useMemo(() => bookings.filter(b => b.status === BookingStatus.PENDING || b.status === BookingStatus.NEGOTIATING), [bookings]);
  const guests = useMemo(() => bookings.filter(b => b.status === BookingStatus.ROOM_ASSIGNED), [bookings]);

  const updateRooms = (delta: number) => {
    const newCount = Math.max(0, roomsCount + delta);
    onUpdateUser({ availableRooms: newCount });
  };

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
    const priceStr = priceInput[id];
    
    if (!room) return alert('Assign room #');
    if (!priceStr) return alert('Please set the final rate for this booking.');
    
    const finalPrice = parseFloat(priceStr);
    
    onUpdateBooking(id, { 
      status: BookingStatus.ROOM_ASSIGNED, 
      roomNumber: room, 
      receiptId: 'RCIPT-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      negotiatedPrice: finalPrice, // Set the price set by the lodge
      price: finalPrice 
    });
    // Auto-decrement inventory on check-in
    updateRooms(-1);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <header className="px-5 py-6 bg-purple-700 text-white shadow-xl flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black italic uppercase leading-none">Swensi Stays</h2>
          <p className="text-[7px] font-black text-purple-200 tracking-[0.3em] uppercase mt-1">Management Console</p>
        </div>
        <button onClick={logout} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10"><i className="fa-solid fa-power-off text-xs"></i></button>
      </header>

      <div className="flex-1 overflow-y-auto pb-40 px-4 pt-6 space-y-6 no-scrollbar">
        {/* INVENTORY CONTROL PANEL */}
        <div className="bg-white dark:bg-slate-900 rounded-[35px] p-6 shadow-xl border border-purple-500/20">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest italic">Inventory Control</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Live Room Availability</p>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${roomsCount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
              {roomsCount > 0 ? 'Vacancies' : 'Fully Booked'}
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 rounded-[28px] p-4 border border-slate-100 dark:border-white/5">
            <button onClick={() => updateRooms(-1)} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 shadow-md flex items-center justify-center active:scale-90 transition-all">
              <i className="fa-solid fa-minus"></i>
            </button>
            <div className="text-center">
              <span className="text-4xl font-black italic text-secondary dark:text-white leading-none">{roomsCount}</span>
              <p className="text-[8px] font-black uppercase text-slate-500 mt-1 tracking-widest">Available Units</p>
            </div>
            <button onClick={() => updateRooms(1)} className="w-12 h-12 rounded-2xl bg-purple-600 text-white shadow-lg flex items-center justify-center active:scale-90 transition-all">
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>

        {activeTab === 'requests' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Reservation Queue</h3>
            {requests.length === 0 && (
              <div className="py-20 text-center opacity-20 italic">No pending requests</div>
            )}
            {requests.map(req => (
              <div key={req.id} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-xl border border-slate-100 dark:border-white/5">
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <h4 className="text-lg font-black text-secondary dark:text-white italic">{req.customerPhone}</h4>
                     <p className="text-[10px] text-slate-500 mt-1 italic">"{req.description}"</p>
                   </div>
                   <span className="text-[8px] font-black bg-purple-600/10 text-purple-600 px-3 py-1 rounded-full uppercase">Action Needed</span>
                 </div>
                 
                 <div className="space-y-3 mt-4">
                   <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Rate (ZMW)</label>
                        <input 
                          type="number"
                          placeholder="Price" 
                          value={priceInput[req.id] || ''} 
                          onChange={(e) => setPriceInput({...priceInput, [req.id]: e.target.value})} 
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-xs font-black text-slate-800 dark:text-white outline-none focus:border-purple-600" 
                        />
                      </div>
                      <div className="w-24">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Room #</label>
                        <input 
                          placeholder="#" 
                          value={roomInput[req.id] || ''} 
                          onChange={(e) => setRoomInput({...roomInput, [req.id]: e.target.value})} 
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-xs font-black text-slate-800 dark:text-white outline-none focus:border-purple-600" 
                        />
                      </div>
                   </div>
                   
                   <button 
                      onClick={() => handleCheckIn(req.id)} 
                      disabled={roomsCount === 0}
                      className={`w-full font-black py-4 rounded-2xl text-[9px] uppercase shadow-lg italic transition-all ${roomsCount > 0 ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-400'}`}
                    >
                      {roomsCount > 0 ? 'Set Rate & Assign Room' : 'No Rooms Available'}
                    </button>
                 </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'guests' && (
          <div className="space-y-4 animate-fade-in">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">In-House Guests</h3>
             {guests.length === 0 && <p className="py-10 text-center text-slate-400 italic text-[10px]">No active check-ins</p>}
             {guests.map(g => (
               <div key={g.id} className="bg-white dark:bg-slate-900 p-5 rounded-[30px] border border-slate-100 dark:border-white/5 shadow-md flex justify-between items-center">
                  <div>
                    <p className="text-xs font-black text-secondary dark:text-white italic uppercase">{g.customerPhone}</p>
                    <p className="text-[8px] font-bold text-purple-600 uppercase mt-1 tracking-widest">Room {g.roomNumber} • ZMW {g.negotiatedPrice || g.price}</p>
                  </div>
                  <button onClick={() => onUpdateBooking(g.id, { status: BookingStatus.COMPLETED })} className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-[8px] font-black uppercase text-slate-500 rounded-xl">Check Out</button>
               </div>
             ))}
          </div>
        )}
      </div>

      <nav className="fixed bottom-6 left-6 right-6 h-20 glass-nav rounded-[32px] border border-white/10 flex justify-around items-center px-4 shadow-2xl z-50">
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
