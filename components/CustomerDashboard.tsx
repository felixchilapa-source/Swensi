
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Booking, Location, BookingStatus, ShoppingItem, Role, CouncilOrder } from '../types';
import { CATEGORIES, Category } from '../constants';
import Map from './Map';
import NewsTicker from './NewsTicker';
import AIAssistant from './AIAssistant';
import { GoogleGenAI } from "@google/genai";

interface GroundingResult {
  title: string;
  uri: string;
}

interface CustomerDashboardProps {
  user: User;
  logout: () => void;
  bookings: Booking[];
  councilOrders: CouncilOrder[];
  onAddBooking: (data: Partial<Booking>) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  location: Location;
  onConfirmCompletion: (id: string) => void;
  onRate: (id: string, rating: number) => void;
  onUploadFacePhoto: (id: string, url: string) => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  onLanguageChange: (lang: string) => void;
  onBecomeProvider: (kyc: { license: string, address: string, photo: string }) => void;
  onUpdateUser: (updates: Partial<User>) => void;
  t: (key: string) => string;
  onToggleViewMode?: () => void;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ 
  user, logout, bookings, councilOrders, onAddBooking, onConfirmCompletion, t, onBecomeProvider, onUpdateUser, onToggleViewMode, location
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'active' | 'account'>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [nearbyResults, setNearbyResults] = useState<GroundingResult[]>([]);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);
  
  const [missionDesc, setMissionDesc] = useState('');
  const [landmark, setLandmark] = useState('');

  const activeBookings = useMemo(() => bookings.filter(b => b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CANCELLED), [bookings]);

  const handleSearchNearby = async (query: string) => {
    setIsSearchingNearby(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Locate ${query} near the Nakonde-Tunduma border.`,
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

  const handleLaunch = () => {
    if (!selectedCategory) return;
    onAddBooking({
      category: selectedCategory.id,
      description: `${missionDesc}${landmark ? ` | Landmark: ${landmark}` : ''}`,
      price: selectedCategory.basePrice,
    });
    setSelectedCategory(null);
    setMissionDesc('');
    setLandmark('');
    setActiveTab('active');
  };

  const myTrust = useMemo(() => {
    const score = user.trustScore;
    if (score >= 98) return { label: 'Elite', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: 'fa-crown' };
    if (score >= 90) return { label: 'Verified', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: 'fa-shield-check' };
    return { label: 'Standard', color: 'text-slate-400', bg: 'bg-slate-400/10', icon: 'fa-user-check' };
  }, [user.trustScore]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <AIAssistant />

      {selectedCategory && (
        <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-4 animate-fade-in">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setSelectedCategory(null)}></div>
           <div className="relative w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black italic tracking-tighter text-secondary dark:text-white uppercase flex items-center gap-3">
                   <span className="text-emerald-600"><i className={selectedCategory.icon}></i></span>
                   {selectedCategory.name}
                </h3>
                <button onClick={() => setSelectedCategory(null)} className="text-slate-400"><i className="fa-solid fa-circle-xmark text-xl"></i></button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
                   <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest italic mb-1">Local Authority Notice</p>
                   <p className="text-[10px] font-bold text-slate-500 leading-relaxed">This mission will automatically generate a Nakonde Council Order (Levy: ZMW {(selectedCategory.basePrice * 0.05).toFixed(2)}).</p>
                </div>

                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 pl-2">Task Protocol</label>
                   <textarea 
                    value={missionDesc} onChange={(e) => setMissionDesc(e.target.value)}
                    placeholder="Briefly describe your request..."
                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-sm font-medium outline-none focus:border-emerald-600 min-h-[80px]"
                   />
                </div>
                <button onClick={handleLaunch} className="w-full font-black py-5 rounded-[28px] text-[10px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all text-white bg-emerald-600 hover:bg-emerald-700 italic">
                  Launch & Register Mission
                </button>
              </div>
           </div>
        </div>
      )}

      <header className="px-5 py-4 flex justify-between items-center glass-nav border-b border-slate-200 dark:border-white/5 sticky top-0 z-[50] backdrop-blur-xl safe-pt">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-700 w-10 h-10 rounded-2xl shadow-lg flex items-center justify-center transform -rotate-6 border border-white/20">
            <i className="fas fa-link text-white text-base"></i>
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-black leading-none text-slate-900 dark:text-white uppercase italic tracking-tighter">Swensi</h2>
            <span className="text-[8px] font-black text-emerald-600 tracking-[0.2em] uppercase mt-1 inline-block">Nakonde Mobile Link</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right">
             <div className="flex items-center gap-1.5 justify-end">
               <span className={`${myTrust.bg} ${myTrust.color} text-[6.5px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 border border-current opacity-80`}><i className={`fa-solid ${myTrust.icon}`}></i> {myTrust.label}</span>
               <p className="text-[11px] font-black dark:text-white uppercase italic tracking-tighter leading-none">ZMW {user.balance.toFixed(0)}</p>
             </div>
             <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60 italic leading-none">Escrow Balance</p>
           </div>
           {user.role !== Role.CUSTOMER && (
              <button onClick={onToggleViewMode} className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-600/20"><i className="fa-solid fa-rotate"></i></button>
           )}
           <button onClick={logout} className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-red-500 border border-slate-200/50 dark:border-white/10 transition-colors"><i className="fa-solid fa-power-off text-xs"></i></button>
        </div>
      </header>

      <NewsTicker />

      <div className="flex-1 overflow-y-auto pb-32 px-5 pt-6 space-y-10 no-scrollbar">
        {activeTab === 'home' && (
          <div className="animate-fade-in space-y-8">
            <div className="relative">
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] italic mb-1">Station Status: Active</p>
                <h1 className="text-3xl font-black text-secondary dark:text-white tracking-tighter italic leading-tight uppercase">
                    {t('welcome').split(' ')[0]} <br/> 
                    <span className="text-emerald-600">{user.name.split(' ')[0]}!</span>
                </h1>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[35px] border border-white/5 overflow-hidden shadow-2xl">
               <Map center={location} markers={[{ loc: location, color: '#059669', label: 'You' }]} />
               <div className="p-5 flex flex-col gap-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleSearchNearby('lodges')} disabled={isSearchingNearby} className="flex-1 py-4 rounded-2xl bg-blue-600/10 text-blue-500 text-[9px] font-black uppercase tracking-widest italic border border-blue-500/20 active:scale-95 transition-all">
                      {isSearchingNearby ? <i className="fa-solid fa-circle-notch animate-spin mr-2"></i> : <i className="fa-solid fa-hotel mr-2"></i>} Lodges
                    </button>
                    <button onClick={() => handleSearchNearby('banks')} disabled={isSearchingNearby} className="flex-1 py-4 rounded-2xl bg-emerald-600/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest italic border border-emerald-500/20 active:scale-95 transition-all">
                      <i className="fa-solid fa-building-columns mr-2"></i> Banks/FX
                    </button>
                  </div>
                  
                  {nearbyResults.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 italic text-center">Grounding Active • Verified Locations</p>
                      {nearbyResults.map((res, i) => (
                        <a key={i} href={res.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                          <span className="text-[10px] font-black text-slate-200 uppercase truncate pr-4 leading-none">{res.title}</span>
                          <i className="fa-solid fa-arrow-right-long text-blue-500 text-xs flex-shrink-0"></i>
                        </a>
                      ))}
                      <button onClick={() => setNearbyResults([])} className="w-full py-2 text-[8px] font-black text-slate-600 uppercase tracking-widest mt-2 hover:text-white transition-colors">Dismiss Data</button>
                    </div>
                  )}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat)} className="bg-white dark:bg-slate-900 p-6 rounded-[35px] border border-slate-100 dark:border-white/5 flex flex-col items-start justify-between min-h-[170px] service-card shadow-sm hover:border-emerald-600 group transition-all duration-300 relative overflow-hidden text-left">
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 w-14 h-14 rounded-2xl flex items-center justify-center text-emerald-700 dark:text-emerald-500 text-2xl group-hover:scale-110 group-hover:rotate-6 transition-all border border-emerald-100 dark:border-emerald-500/10"><i className={cat.icon}></i></div>
                  <div className="w-full relative z-10 mt-4">
                    <p className="text-[11px] font-black uppercase text-secondary dark:text-white tracking-tight italic leading-tight">{cat.name}</p>
                    <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest mt-2 opacity-80 leading-relaxed">{cat.hint}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'active' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic px-2">Live Mission Log</h3>
            {activeBookings.length === 0 && (
              <div className="py-24 text-center opacity-30 flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center border-4 border-dashed border-slate-200 dark:border-slate-800"><i className="fa-solid fa-radar text-3xl"></i></div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">No Active Transmissions</p>
              </div>
            )}
            {activeBookings.map(b => {
              const councilOrder = councilOrders.find(co => co.id === b.councilOrderId);
              return (
                <div key={b.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-2xl overflow-hidden mb-8">
                  <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/10">{b.category} Task</span>
                      <span className="text-[11px] font-black uppercase italic tracking-widest text-emerald-500 animate-pulse">{b.status}</span>
                    </div>
                    
                    <p className="text-sm font-black text-slate-700 dark:text-slate-300 italic mb-6 leading-relaxed">"{b.description}"</p>
                    
                    {councilOrder && (
                      <div className="p-5 bg-purple-600/5 dark:bg-purple-600/10 rounded-3xl mb-6 border border-purple-600/20">
                         <div className="flex justify-between items-center mb-3">
                            <span className="text-[8px] font-black text-purple-600 uppercase tracking-widest italic">Council Compliance</span>
                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">Paid</span>
                         </div>
                         <div className="flex justify-between items-end">
                            <div>
                               <p className="text-[11px] font-black text-secondary dark:text-white uppercase italic tracking-tighter leading-none">{councilOrder.id}</p>
                               <p className="text-[7px] font-bold text-slate-400 uppercase mt-1.5 leading-none">Levy: ZMW {councilOrder.levyAmount.toFixed(2)}</p>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-purple-600 flex-shrink-0"><i className="fa-solid fa-stamp"></i></div>
                         </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Escrow Commit</span>
                          <span className="text-sm font-black dark:text-white leading-none">ZMW {b.price.toFixed(2)}</span>
                       </div>
                       <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm flex-shrink-0"><i className="fa-solid fa-fingerprint text-emerald-600"></i></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[45px] p-10 border border-slate-100 dark:border-white/5 shadow-2xl text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-600/10 to-transparent"></div>
               <div className="w-28 h-28 mx-auto bg-emerald-700 rounded-full flex items-center justify-center text-white text-4xl font-black italic shadow-2xl mb-8 overflow-hidden relative border-4 border-white dark:border-slate-800 z-10">
                 {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.name.charAt(0)}
               </div>
               <h2 className="text-3xl font-black text-secondary dark:text-white italic uppercase tracking-tighter leading-none">{user.name}</h2>
               <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest italic mt-2 leading-none">{user.phone}</p>
               <button onClick={logout} className="w-full text-red-500 font-black py-5 text-[9px] uppercase tracking-[0.3em] hover:bg-red-500/5 rounded-2xl transition-colors mt-12 italic">Deauthorize Terminal</button>
            </div>
          </div>
        )}
      </div>

      <nav className="absolute bottom-6 left-8 right-8 h-20 glass-nav rounded-[35px] border border-white/20 flex justify-around items-center px-6 shadow-2xl z-50 backdrop-blur-2xl safe-pb">
        <button onClick={() => setActiveTab('home')} className={`flex-1 flex flex-col items-center transition-all ${activeTab === 'home' ? 'text-emerald-600 scale-110' : 'text-slate-400 opacity-60'}`}><i className={`fa-solid ${activeTab === 'home' ? 'fa-house-chimney' : 'fa-house'} text-xl`}></i></button>
        <button onClick={() => setActiveTab('active')} className={`flex-1 flex flex-col items-center transition-all ${activeTab === 'active' ? 'text-emerald-600 scale-110' : 'text-slate-400 opacity-60'}`}><i className="fa-solid fa-bolt-lightning text-xl"></i></button>
        <button onClick={() => setActiveTab('account')} className={`flex-1 flex flex-col items-center transition-all ${activeTab === 'account' ? 'text-emerald-600 scale-110' : 'text-slate-400 opacity-60'}`}><i className="fa-solid fa-circle-user text-xl"></i></button>
      </nav>
    </div>
  );
};

export default CustomerDashboard;
