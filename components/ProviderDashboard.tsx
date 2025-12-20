
import React, { useState, useMemo, useRef } from 'react';
import { User, Booking, BookingStatus, Role, Location } from '../types';
import { TRUSTED_COMMISSION_BONUS } from '../constants';
import Map from './Map';
import NewsTicker from './NewsTicker';
import { GoogleGenAI } from "@google/genai";

interface GroundingResult {
  title: string;
  uri: string;
}

interface ProviderDashboardProps {
  user: User;
  logout: () => void;
  bookings: Booking[];
  allUsers: User[];
  onUpdateStatus: (id: string, status: BookingStatus, providerId: string) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onConfirmCompletion: (id: string) => void;
  onUpdateSubscription: (plan: 'BASIC' | 'PREMIUM') => void;
  onUpdateUser: (updates: Partial<User>) => void;
  location: Location;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  onLanguageChange: (lang: string) => void;
  t: (key: string) => string;
  onToggleViewMode?: () => void;
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ user, logout, bookings, allUsers, onUpdateStatus, onUpdateBooking, onUpdateUser, onToggleViewMode, location }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'active' | 'account'>('leads');
  const [isOnline, setIsOnline] = useState(true);
  const [nearbyResults, setNearbyResults] = useState<GroundingResult[]>([]);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isTrusted = user.trustScore >= 95;

  // Verification Check
  const isAuthorized = user.isVerified;

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone);

  const isEligibleForShopping = useMemo(() => {
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    const isMemberForAYear = (Date.now() - user.memberSince) >= oneYearInMs;
    const hasMinRating = user.rating >= 4.5;
    return !!(user.isPremium && hasMinRating && isMemberForAYear);
  }, [user.isPremium, user.rating, user.memberSince]);
  
  const pendingLeads = useMemo(() => {
    if (!isOnline || !isAuthorized) return [];
    return bookings.filter(b => {
      if (b.status !== BookingStatus.PENDING) return false;
      if (b.isTrustedTransportOnly && !isTrusted) return false;
      if (b.category === 'errands' && !isEligibleForShopping) return false;
      return true;
    });
  }, [bookings, isTrusted, isEligibleForShopping, isOnline, isAuthorized]);

  const activeJobs = useMemo(() => bookings.filter(b => b.providerId === user.id && b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CANCELLED), [bookings, user.id]);

  const handleSearchNearby = async (query: string) => {
    setIsSearchingNearby(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find ${query} for trade partners in Nakonde.`,
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
      <header className="px-5 py-5 bg-secondary text-white sticky top-0 z-50 shadow-2xl border-b border-white/5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="bg-blue-600 w-11 h-11 rounded-[18px] shadow-lg flex items-center justify-center transform rotate-2">
               <i className="fas fa-satellite text-white text-lg"></i>
             </div>
             <div>
               <h2 className="text-xl font-bold italic tracking-tighter uppercase leading-none">Swensi</h2>
               <span className="text-[10px] font-bold text-blue-500 tracking-[0.2em] uppercase mt-1 inline-block">Partner Node</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={onToggleViewMode}
                className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center border border-emerald-600/20"
                title="Switch to Booking"
              >
                <i className="fa-solid fa-cart-plus"></i>
              </button>
             <div className="flex flex-col items-end">
                <span className={`text-[8px] font-black uppercase tracking-widest ${isOnline && isAuthorized ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isAuthorized ? (isOnline ? 'Signal Active' : 'Offline') : 'Locked'}
                </span>
                <button 
                  onClick={() => isAuthorized && setIsOnline(!isOnline)}
                  disabled={!isAuthorized}
                  className={`w-10 h-5 rounded-full mt-1 relative transition-colors ${isOnline && isAuthorized ? 'bg-emerald-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isOnline && isAuthorized ? 'right-1' : 'left-1'}`}></div>
                </button>
             </div>
             <button onClick={logout} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 border border-white/10"><i className="fa-solid fa-power-off text-xs"></i></button>
          </div>
        </div>
      </header>

      <NewsTicker />

      {!isAuthorized ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-slate-50 dark:bg-slate-950">
           <div className="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center mb-6 border-2 border-red-600/20 shadow-2xl">
              <i className="fa-solid fa-user-lock text-4xl text-red-600 animate-pulse"></i>
           </div>
           <h3 className="text-2xl font-black text-secondary dark:text-white italic uppercase tracking-tighter mb-4">Verification Required</h3>
           <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-10">
              Swensi Command is currently reviewing your Partner Dossier. Mission leads and corridor signals are locked until your status is verified.
           </p>
           <button onClick={logout} className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] text-red-500 hover:bg-red-500/5 px-8 py-4 rounded-2xl transition-all">Deauthorize Terminal</button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-32 px-5 pt-6 space-y-8 no-scrollbar">
          {activeTab === 'leads' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-[35px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-lg">
                <Map center={location} markers={[{ loc: location, color: '#1E40AF', label: 'Home Node' }]} />
                <div className="p-4 flex gap-2">
                    <button 
                      onClick={() => handleSearchNearby('gas stations')}
                      disabled={isSearchingNearby}
                      className="flex-1 py-3 rounded-2xl bg-amber-600/10 text-amber-600 text-[9px] font-black uppercase tracking-widest italic border border-amber-600/20 active:scale-95 transition-all"
                    >
                      {isSearchingNearby ? <i className="fa-solid fa-circle-notch animate-spin"></i> : "Fuel Stations"}
                    </button>
                    <button 
                      onClick={() => handleSearchNearby('mechanics')}
                      disabled={isSearchingNearby}
                      className="flex-1 py-3 rounded-2xl bg-emerald-600/10 text-emerald-600 text-[9px] font-black uppercase tracking-widest italic border border-emerald-600/20 active:scale-95 transition-all"
                    >
                      Repair Hubs
                    </button>
                </div>
                {nearbyResults.length > 0 && (
                  <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-2 animate-slide-up">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic mb-2">Corridor Logistics Explorer</p>
                      {nearbyResults.map((res, i) => (
                        <a 
                          key={i} 
                          href={res.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/10 shadow-sm"
                        >
                          <span className="text-[10px] font-bold dark:text-white truncate">{res.title}</span>
                          <i className="fa-solid fa-location-arrow text-blue-600 text-[10px]"></i>
                        </a>
                      ))}
                      <button onClick={() => setNearbyResults([])} className="w-full py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2">Clear Map Data</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Earnings</p>
                    <p className="text-xl font-black text-secondary dark:text-white tracking-tighter">ZMW {user.balance.toFixed(0)}</p>
                 </div>
                 <div className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Missions</p>
                    <p className="text-xl font-black text-secondary dark:text-white tracking-tighter">{user.completedMissions || 0}</p>
                 </div>
              </div>

              {!isOnline && (
                <div className="bg-amber-600/10 border border-amber-600/20 p-8 rounded-[40px] text-center space-y-4">
                   <div className="w-16 h-16 bg-amber-600/10 rounded-full flex items-center justify-center mx-auto text-amber-600">
                      <i className="fa-solid fa-signal-slash text-2xl"></i>
                   </div>
                   <h4 className="text-lg font-black text-amber-600 italic uppercase">Signal Inhibited</h4>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Toggle your duty status to receive live mission leads from the corridor.</p>
                </div>
              )}

              {isOnline && pendingLeads.length === 0 && (
                <div className="py-20 text-center opacity-20 space-y-4">
                   <div className="w-20 h-20 border-4 border-dashed border-slate-300 dark:border-slate-800 rounded-full flex items-center justify-center mx-auto">
                      <i className="fa-solid fa-radar text-4xl animate-pulse"></i>
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em]">Scanning Corridor...</p>
                </div>
              )}
              
              {pendingLeads.map(lead => (
                <div key={lead.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 p-7 shadow-xl hover:border-blue-500 transition-all group relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform"></div>
                   <div className="flex justify-between items-start mb-6 relative z-10">
                      <div>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] italic">{lead.category}</p>
                          <h4 className="text-3xl font-black text-secondary dark:text-white italic tracking-tighter">ZMW {lead.price}</h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Comm: ZMW {lead.commission}</p>
                      </div>
                      <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-white/10">
                         <i className="fa-solid fa-map-location-dot text-slate-400"></i>
                      </div>
                   </div>
                   <p className="text-xs font-black text-slate-600 dark:text-slate-400 italic mb-8 line-clamp-2">"{lead.description}"</p>
                   <button 
                    onClick={() => onUpdateStatus(lead.id, BookingStatus.ACCEPTED, user.id)} 
                    className="w-full bg-blue-700 text-white font-black py-5 rounded-[28px] text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 active:scale-95 transition-all italic"
                   >
                     Establish Mission Link
                   </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'active' && (
            <div className="space-y-6 animate-fade-in">
              {activeJobs.length === 0 && (
                <div className="py-40 text-center opacity-10 flex flex-col items-center gap-6">
                   <i className="fa-solid fa-shuttle-van text-6xl"></i>
                   <p className="text-[10px] font-black uppercase tracking-[0.5em]">No Active Deployments</p>
                </div>
              )}
              {activeJobs.map(job => (
                <div key={job.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-2xl relative overflow-hidden mb-8">
                  <Map 
                    center={job.location} 
                    markers={[
                      { loc: job.location, color: '#1E40AF', label: 'Node' },
                      { loc: job.destination || { lat: job.location.lat + 0.005, lng: job.location.lng + 0.005 }, color: '#B87333', label: 'Target' }
                    ]}
                    trackingHistory={job.trackingHistory || [job.location]}
                    showRoute={true}
                  />
                  <div className="p-7">
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">{job.category} Node</p>
                      <p className="text-[10px] font-black uppercase text-blue-500 animate-pulse italic tracking-widest">{job.status}</p>
                    </div>
                    <div className="flex gap-2">
                       <button 
                          onClick={() => window.open(`tel:${job.customerPhone}`)}
                          className="w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center border border-emerald-600/20 active:scale-90 transition-all"
                       >
                          <i className="fa-solid fa-phone"></i>
                       </button>
                       <button 
                          onClick={() => onUpdateStatus(job.id, BookingStatus.DELIVERED, user.id)} 
                          className="flex-1 bg-blue-700 text-white font-black py-5 rounded-[24px] text-[10px] uppercase shadow-xl italic tracking-[0.1em]"
                       >
                          Broadcast Reach
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'account' && (
            <div className="animate-fade-in space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-white/5 shadow-xl text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-600/10 to-transparent"></div>
                
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                
                <div 
                  onClick={handleAvatarClick}
                  className="w-24 h-24 mx-auto bg-indigo-700 rounded-full flex items-center justify-center text-white text-3xl font-black italic border-4 border-white dark:border-slate-800 shadow-2xl mb-6 overflow-hidden relative group cursor-pointer z-10"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <i className="fa-solid fa-camera text-xl"></i>
                  </div>
                </div>
                
                {!isEditing ? (
                  <div className="relative z-10">
                    <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-3">
                       <span className="text-[9px] font-black text-blue-600 uppercase italic tracking-widest">Partner Node v2.1</span>
                    </div>
                    <h2 className="text-2xl font-black text-secondary dark:text-white italic uppercase tracking-tighter">{user.name}</h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 italic">{user.phone}</p>
                    
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 space-y-3">
                      <button onClick={() => setIsEditing(true)} className="w-full bg-white dark:bg-white/5 text-blue-600 border border-blue-600/20 font-black py-4 rounded-3xl text-[9px] uppercase tracking-widest active:scale-95 transition-all italic">Modify Ops ID</button>
                      <button onClick={logout} className="w-full bg-red-500/10 text-red-500 font-black py-5 rounded-[28px] text-[10px] uppercase border border-red-500/20 italic">Disconnect Terminal</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in relative z-10">
                    <div className="text-left space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-2">Partner Alias</label>
                      <input 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-black text-slate-800 dark:text-white outline-none focus:border-blue-600"
                      />
                    </div>
                    <div className="text-left space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-2">Contact Line</label>
                      <input 
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-black text-slate-800 dark:text-white outline-none focus:border-blue-600"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-100 dark:bg-white/5 text-slate-500 font-black py-4 rounded-2xl text-[9px] uppercase tracking-widest">Cancel</button>
                      <button onClick={handleSaveProfile} className="flex-1 bg-blue-700 text-white font-black py-4 rounded-2xl text-[9px] uppercase tracking-widest shadow-lg">Confirm Changes</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <nav className="absolute bottom-6 left-6 right-6 h-20 glass-nav rounded-[32px] border border-white/10 flex justify-around items-center px-4 shadow-2xl z-50">
        <button onClick={() => setActiveTab('leads')} className={`flex-1 flex flex-col items-center ${activeTab === 'leads' ? 'text-blue-500 scale-110' : 'text-slate-400'}`}>
          <div className="relative">
             <i className="fa-solid fa-satellite text-lg"></i>
             {pendingLeads.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>}
          </div>
          <span className="text-[8px] font-black uppercase mt-1.5 italic">Signal</span>
        </button>
        <button onClick={() => setActiveTab('active')} className={`flex-1 flex flex-col items-center ${activeTab === 'active' ? 'text-blue-500 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-route text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1.5 italic">Ops</span>
        </button>
        <button onClick={() => setActiveTab('account')} className={`flex-1 flex flex-col items-center ${activeTab === 'account' ? 'text-blue-500 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-fingerprint text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1.5 italic">Access</span>
        </button>
      </nav>
    </div>
  );
};

export default ProviderDashboard;
