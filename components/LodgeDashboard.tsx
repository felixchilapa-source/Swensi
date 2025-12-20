
import React, { useState, useMemo, useRef } from 'react';
import { User, Booking, BookingStatus, Location } from '../types';
import Map from './Map';
import { GoogleGenAI } from "@google/genai";

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

const LodgeDashboard: React.FC<LodgeDashboardProps> = ({ user, logout, bookings, onUpdateBooking, onUpdateUser, location = { lat: -9.3283, lng: 32.7569 } }) => {
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
            retrievalConfig: {
              latLng: {
                latitude: location.lat,
                longitude: location.lng
              }
            }
          }
        },
      });

      const results: GroundingResult[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.maps) {
            results.push({
              title: chunk.maps.title,
              uri: chunk.maps.uri
            });
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateUser({ avatarUrl: reader.result as string });
      };
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
           <button onClick={logout} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10"><i className="fa-solid fa-power-off text-xs"></i></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-32 px-4 pt-6 space-y-6 no-scrollbar">
        {activeTab === 'requests' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-[35px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-lg">
                <Map center={location} markers={[{ loc: location, color: '#7C3AED', label: 'Station' }]} />
                <div className="p-4 flex gap-2">
                    <button 
                      onClick={() => handleSearchNearby('restaurants')}
                      disabled={isSearchingNearby}
                      className="flex-1 py-3 rounded-2xl bg-purple-600/10 text-purple-600 text-[9px] font-black uppercase tracking-widest italic border border-purple-600/20 active:scale-95 transition-all"
                    >
                      {isSearchingNearby ? <i className="fa-solid fa-circle-notch animate-spin"></i> : "Local Dining"}
                    </button>
                    <button 
                      onClick={() => handleSearchNearby('pharmacies')}
                      disabled={isSearchingNearby}
                      className="flex-1 py-3 rounded-2xl bg-red-600/10 text-red-600 text-[9px] font-black uppercase tracking-widest italic border border-red-600/20 active:scale-95 transition-all"
                    >
                      Pharmacies
                    </button>
                </div>
                {nearbyResults.length > 0 && (
                  <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-2 animate-slide-up">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic mb-2">Station Concierge Tips</p>
                      {nearbyResults.map((res, i) => (
                        <a 
                          key={i} 
                          href={res.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/10 shadow-sm"
                        >
                          <span className="text-[10px] font-bold dark:text-white truncate">{res.title}</span>
                          <i className="fa-solid fa-star text-purple-600 text-[10px]"></i>
                        </a>
                      ))}
                      <button onClick={() => setNearbyResults([])} className="w-full py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2">Dismiss Data</button>
                  </div>
                )}
            </div>

            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Reservation Queue</h3>
            {requests.length === 0 && (
              <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                <i className="fa-solid fa-bell-concierge text-4xl"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">No Pending Stays</p>
              </div>
            )}
            {requests.map(req => (
              <div key={req.id} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-xl border border-slate-100 dark:border-white/5">
                 <h4 className="text-lg font-black text-secondary dark:text-white italic">{req.customerPhone}</h4>
                 <div className="flex gap-2 mt-4">
                    <input placeholder="Room #" value={roomInput[req.id] || ''} onChange={(e) => setRoomInput({...roomInput, [req.id]: e.target.value})} className="w-24 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 text-xs font-black text-slate-800 dark:text-white outline-none focus:border-purple-600" />
                    <button onClick={() => handleCheckIn(req.id)} className="flex-1 bg-purple-600 text-white font-black py-4 rounded-2xl text-[9px] uppercase shadow-lg italic">Assign Room</button>
                 </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'guests' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Checked-in Hub</h3>
            {guests.length === 0 && (
              <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                <i className="fa-solid fa-key text-4xl"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">Lodge Empty</p>
              </div>
            )}
            {guests.map(g => (
              <div key={g.id} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border-l-[6px] border-purple-600 shadow-lg border border-slate-100 dark:border-white/5">
                <div className="flex justify-between items-start">
                   <div>
                     <h4 className="text-xl font-black italic text-secondary dark:text-white uppercase tracking-tighter">Room {g.roomNumber}</h4>
                     <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">{g.customerPhone}</p>
                   </div>
                   <div className="bg-purple-500/10 text-purple-600 px-3 py-1 rounded-full text-[8px] font-black uppercase">Occupied</div>
                </div>
                <button onClick={() => onUpdateBooking(g.id, { status: BookingStatus.COMPLETED })} className="w-full bg-slate-100 dark:bg-white/5 py-4 rounded-2xl text-[9px] font-black uppercase mt-6 tracking-widest border border-slate-200 dark:border-white/5 active:scale-95 transition-all italic">Process Checkout</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-white/5 shadow-xl text-center">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
              
              <div 
                onClick={handleAvatarClick}
                className="w-24 h-24 mx-auto bg-purple-700 rounded-full flex items-center justify-center text-white text-3xl font-black italic shadow-2xl mb-6 overflow-hidden relative group cursor-pointer"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Station" className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <i className="fa-solid fa-camera text-xl"></i>
                </div>
              </div>
              
              {!isEditing ? (
                <>
                  <h2 className="text-2xl font-black text-secondary dark:text-white italic uppercase tracking-tighter">{user.name}</h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 italic">{user.phone}</p>
                  
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 space-y-3">
                    <button onClick={() => setIsEditing(true)} className="w-full bg-white dark:bg-white/5 text-purple-600 border border-purple-600/20 font-black py-4 rounded-3xl text-[9px] uppercase tracking-widest active:scale-95 transition-all italic">Edit Station Info</button>
                    <button onClick={logout} className="w-full bg-red-500/10 text-red-500 font-black py-4 rounded-3xl text-[9px] uppercase tracking-widest border border-red-500/10">Logout</button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="text-left space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-2">Lodge Name</label>
                    <input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-black text-slate-800 dark:text-white outline-none focus:border-purple-600"
                    />
                  </div>
                  <div className="text-left space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-2">Official Phone</label>
                    <input 
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-black text-slate-800 dark:text-white outline-none focus:border-purple-600"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-100 dark:bg-white/5 text-slate-500 font-black py-4 rounded-2xl text-[9px] uppercase tracking-widest">Cancel</button>
                    <button onClick={handleSaveProfile} className="flex-1 bg-purple-600 text-white font-black py-4 rounded-2xl text-[9px] uppercase tracking-widest shadow-lg">Save Changes</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <nav className="absolute bottom-6 left-6 right-6 h-18 glass-nav rounded-[32px] border border-white/10 flex justify-around items-center px-4 shadow-2xl z-50">
        <button onClick={() => setActiveTab('requests')} className={`flex-1 flex flex-col items-center ${activeTab === 'requests' ? 'text-purple-600 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-bell-concierge text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1 tracking-widest italic">Queue</span>
        </button>
        <button onClick={() => setActiveTab('guests')} className={`flex-1 flex flex-col items-center ${activeTab === 'guests' ? 'text-purple-600 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-key text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1 tracking-widest italic">Guests</span>
        </button>
        <button onClick={() => setActiveTab('account')} className={`flex-1 flex flex-col items-center ${activeTab === 'account' ? 'text-purple-600 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-user-gear text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1 tracking-widest italic">Station</span>
        </button>
      </nav>
    </div>
  );
};

export default LodgeDashboard;
