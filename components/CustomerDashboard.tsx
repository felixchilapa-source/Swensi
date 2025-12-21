import React, { useState, useMemo } from 'react';
import { User, Booking, Location, BookingStatus, Role, CouncilOrder, SavedNode } from '../types';
import { CATEGORIES, Category, PAYMENT_NUMBERS, LANGUAGES } from '../constants';
import Map from './Map';
import NewsTicker from './NewsTicker';
import AIAssistant from './AIAssistant';
import { GoogleGenAI } from "@google/genai";

interface GroundingResult {
  title: string;
  uri: string;
}

const STATIC_SAVED_NODES: SavedNode[] = [
  { id: 'border', name: 'Tunduma Border', icon: 'fa-solid fa-gate', loc: { lat: -9.3330, lng: 32.7600 } },
  { id: 'market', name: 'Nakonde Market', icon: 'fa-solid fa-shop', loc: { lat: -9.3250, lng: 32.7550 } },
  { id: 'station', name: 'Main Station', icon: 'fa-solid fa-bus-simple', loc: { lat: -9.3300, lng: 32.7580 } },
  { id: 'total', name: 'Total Station', icon: 'fa-solid fa-gas-pump', loc: { lat: -9.3200, lng: 32.7500 } },
];

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
  onSOS?: () => void;
  onDeposit?: (amount: number) => void;
  onSaveNode?: (node: SavedNode) => void;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ 
  user, logout, bookings, councilOrders, onAddBooking, location, onSOS, onDeposit, onBecomeProvider, onToggleViewMode, onSaveNode, t, onToggleTheme, isDarkMode, onLanguageChange 
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'active' | 'account'>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [mapCenter, setMapCenter] = useState<Location>(location);
  const [nearbyResults, setNearbyResults] = useState<GroundingResult[]>([]);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);
  
  const [kycLicense, setKycLicense] = useState('');
  const [kycAddress, setKycAddress] = useState('');
  
  const [missionDesc, setMissionDesc] = useState('');
  const [landmark, setLandmark] = useState('');

  const activeBookings = useMemo(() => bookings.filter(b => b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CANCELLED), [bookings]);

  const allSavedNodes = useMemo(() => {
    return [...STATIC_SAVED_NODES, ...(user.savedNodes || [])];
  }, [user.savedNodes]);

  const handleSearchNearby = async (query: string) => {
    setIsSearchingNearby(true);
    setNearbyResults([]);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find ${query} near Nakonde for a visitor.`,
        config: { tools: [{ googleSearch: {} }] },
      });
      
      const results: GroundingResult[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web) {
            results.push({ title: chunk.web.title, uri: chunk.web.uri });
          }
        });
      }
      setNearbyResults(results.length > 0 ? results : [{ title: `Top rated ${query} in Nakonde`, uri: 'https://maps.google.com' }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingNearby(false);
    }
  };

  const jumpToNode = (node: SavedNode) => {
    setMapCenter(node.loc);
  };

  const handleLaunchMission = () => {
    if (!selectedCategory) return;
    onAddBooking({
      category: selectedCategory.id,
      description: `${missionDesc}${landmark ? ` | Near ${landmark}` : ''}`,
      price: selectedCategory.basePrice,
      location: mapCenter
    });
    setSelectedCategory(null);
    setMissionDesc('');
    setLandmark('');
    setActiveTab('active');
  };

  const handleKYCSubmit = () => {
    if (!kycLicense || !kycAddress) return alert("Clearance requires all fields.");
    onBecomeProvider({ license: kycLicense, address: kycAddress, photo: user.avatarUrl || '' });
    setShowKYCModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <AIAssistant />

      {/* PROMINENT SOS TRIGGER */}
      <div className="fixed top-[12%] right-6 z-[400] flex flex-col items-center gap-1.5 group">
        <button 
          onClick={() => setShowSOSConfirm(true)}
          className="w-16 h-16 bg-red-600 text-white rounded-[26px] shadow-[0_0_50px_rgba(220,38,38,0.6)] flex items-center justify-center border-4 border-white dark:border-slate-900 animate-pulse active:scale-90 transition-all ring-4 ring-red-600/10"
          aria-label="Emergency SOS Alert"
        >
          <i className="fa-solid fa-circle-exclamation text-3xl"></i>
        </button>
        <span className="text-[7px] font-black uppercase text-red-600 tracking-[0.2em] bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 rounded-full border border-red-600/30 shadow-2xl backdrop-blur-md">SOS Distress</span>
      </div>

      {/* SOS CONFIRMATION MODAL */}
      {showSOSConfirm && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-red-950/95 backdrop-blur-3xl animate-fade-in">
           <div className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-[45px] p-10 text-center shadow-2xl border-t-[10px] border-red-600 animate-zoom-in overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-red-600/5 rounded-full translate-x-12 -translate-y-12"></div>
              <div className="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner ring-4 ring-red-600/5">
                <i className="fa-solid fa-tower-broadcast text-red-600 text-5xl animate-ping"></i>
              </div>
              <h3 className="text-2xl font-black italic uppercase text-slate-900 dark:text-white leading-none tracking-tighter">Emergency Signal</h3>
              <p className="text-[11px] font-bold text-slate-500 uppercase mt-4 mb-10 tracking-tight leading-relaxed px-2">
                Broadcast your current GPS coordinates to the <span className="text-red-600 font-black underline underline-offset-4 decoration-2">Super Admin Console</span> immediately?
              </p>
              <div className="space-y-4">
                <button 
                  onClick={() => { onSOS?.(); setShowSOSConfirm(false); }} 
                  className="w-full py-6 bg-red-600 text-white font-black rounded-[30px] text-[12px] uppercase italic tracking-[0.2em] shadow-2xl shadow-red-600/40 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <i className="fa-solid fa-satellite-dish"></i> Transmit Now
                </button>
                <button 
                  onClick={() => setShowSOSConfirm(false)} 
                  className="w-full py-3 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  Cancel Protocol
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Quick Wallet Deposit */}
      {showDepositModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl animate-zoom-in">
            <h3 className="text-xl font-black italic uppercase text-slate-900 dark:text-white">Corridor Credit</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 mb-6">Top up Escrow Wallet via MoMo</p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[50, 100, 200, 500].map(amt => (
                <button 
                  key={amt} 
                  onClick={() => { onDeposit?.(amt); setShowDepositModal(false); }}
                  className="py-4 rounded-2xl bg-emerald-600/10 text-emerald-600 font-black border border-emerald-600/20 hover:bg-emerald-600 hover:text-white transition-all text-xs"
                >
                  ZMW {amt}
                </button>
              ))}
            </div>
            <button onClick={() => setShowDepositModal(false)} className="w-full mt-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Dismiss</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-5 py-4 flex justify-between items-center glass-nav border-b dark:border-white/5 sticky top-0 z-[50] backdrop-blur-xl safe-pt">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-700 w-10 h-10 rounded-2xl shadow-lg flex items-center justify-center transform -rotate-6 border border-white/20">
            <i className="fas fa-link text-white text-base"></i>
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-black leading-none text-slate-900 dark:text-white uppercase italic tracking-tighter">Swensi</h2>
            <span className="text-[8px] font-black text-emerald-600 tracking-[0.2em] uppercase mt-1">Nakonde Hub</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right">
             <p className="text-[11px] font-black dark:text-white uppercase italic leading-none">ZMW {user.balance.toFixed(0)}</p>
             <button onClick={() => setShowDepositModal(true)} className="text-[7px] font-black text-emerald-600 uppercase mt-1 opacity-60 flex items-center gap-1 justify-end italic">
                <i className="fa-solid fa-plus-circle"></i> Quick Topup
             </button>
           </div>
           {user.role !== Role.CUSTOMER && (
              <button onClick={onToggleViewMode} className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-600/20 active:rotate-180 transition-all duration-500"><i className="fa-solid fa-rotate"></i></button>
           )}
           <button onClick={logout} className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"><i className="fa-solid fa-power-off text-xs"></i></button>
        </div>
      </header>

      <NewsTicker />

      <div className="flex-1 overflow-y-auto pb-32 px-5 pt-6 space-y-10 no-scrollbar">
        {activeTab === 'home' && (
          <div className="animate-fade-in space-y-8">
            <h1 className="text-3xl font-black text-secondary dark:text-white uppercase italic leading-tight tracking-tighter">
                Welcome to Nakonde, <br/> 
                <span className="text-emerald-600">{user.name.split(' ')[0]}!</span>
            </h1>

            <div className="bg-slate-900 rounded-[35px] border border-white/5 overflow-hidden shadow-2xl">
               <Map 
                center={mapCenter} 
                onSaveNode={onSaveNode}
                markers={[{ loc: location, color: '#059669', label: 'My Node' }, { loc: mapCenter, color: '#1E40AF', label: 'Selected' }]} 
               />
               <div className="p-5 flex flex-col gap-4">
                  <div className="flex flex-col gap-3">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic px-1">Corridor Nodes</p>
                    <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2">
                      {allSavedNodes.map(node => (
                        <button 
                          key={node.id} 
                          onClick={() => jumpToNode(node)}
                          className={`flex-shrink-0 px-4 py-3 rounded-2xl border flex items-center gap-3 transition-all active:scale-95 ${mapCenter.lat === node.loc.lat ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'}`}
                        >
                          <i className={node.icon}></i>
                          <span className="text-[10px] font-black uppercase whitespace-nowrap italic">{node.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSearchNearby('lodges')} className="flex-1 py-4 rounded-2xl bg-blue-600/10 text-blue-500 text-[9px] font-black uppercase tracking-widest italic border border-blue-500/20 active:scale-95 transition-all">Nearby Lodges</button>
                    <button onClick={() => handleSearchNearby('banks')} className="flex-1 py-4 rounded-2xl bg-emerald-600/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest italic border border-emerald-500/20 active:scale-95 transition-all">Banks & Forex</button>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat)} className="bg-white dark:bg-slate-900 p-6 rounded-[35px] border border-slate-100 dark:border-white/5 flex flex-col items-start justify-between min-h-[170px] shadow-sm hover:border-emerald-500 transition-all group">
                   <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <i className={`${cat.icon} text-xl`}></i>
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1 italic">{cat.name}</p>
                      <p className="text-sm font-black text-secondary dark:text-white leading-tight italic uppercase tracking-tighter">ZMW {cat.basePrice}</p>
                   </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-6 animate-fade-in">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Active Protocol</h3>
             {activeBookings.length === 0 && (
               <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                  <i className="fa-solid fa-radar text-4xl animate-pulse"></i>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Active Missions</p>
               </div>
             )}
             {activeBookings.map(b => (
                <div key={b.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-xl">
                   <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest italic">{b.category}</p>
                            <h4 className="text-xl font-black text-secondary dark:text-white italic tracking-tighter">{b.id}</h4>
                         </div>
                         <span className="text-[8px] font-black bg-emerald-600/10 text-emerald-600 px-3 py-1 rounded-full uppercase italic tracking-widest">{b.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{b.description}</p>
                   </div>
                </div>
             ))}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="animate-fade-in space-y-8">
             <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-white/5 shadow-xl text-center">
                <div className="w-24 h-24 mx-auto bg-emerald-700 rounded-full flex items-center justify-center text-white text-3xl font-black italic shadow-2xl mb-6 overflow-hidden">
                  {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                </div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h2 className="text-2xl font-black text-secondary dark:text-white italic uppercase tracking-tighter leading-none">{user.name}</h2>
                  {user.role === Role.PROVIDER && user.isVerified && (
                    <div className="bg-blue-600/20 text-blue-500 text-[8px] font-black px-2.5 py-1 rounded-full border border-blue-500/30 flex items-center gap-1 uppercase italic shadow-lg shadow-blue-500/10 animate-pulse">
                      <i className="fa-solid fa-certificate"></i>
                      Verified Agent
                    </div>
                  )}
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 italic leading-none">{user.phone}</p>
             </div>

             {/* System Preferences */}
             <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-white/5 shadow-xl space-y-8">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 italic ml-2">System Preferences</h3>
                  
                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <i className={`fa-solid ${isDarkMode ? 'fa-moon text-blue-500' : 'fa-sun text-amber-500'} text-lg`}></i>
                      <span className="text-[10px] font-black uppercase tracking-widest dark:text-white italic">Appearance</span>
                    </div>
                    <button 
                      onClick={onToggleTheme}
                      className={`w-12 h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${isDarkMode ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>

                {/* Language Picker */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 italic">Corridor Dialect</p>
                  <div className="grid grid-cols-2 gap-3">
                    {LANGUAGES.map(lang => (
                      <button 
                        key={lang.code}
                        onClick={() => onLanguageChange(lang.code)}
                        className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all active:scale-95 ${user.language === lang.code ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-600 dark:text-slate-400'}`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest italic">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
                   <button onClick={() => setShowKYCModal(true)} className="w-full bg-blue-700/10 text-blue-600 font-black py-4 rounded-3xl text-[9px] uppercase tracking-widest italic border border-blue-600/20">Become a Provider</button>
                   <button onClick={logout} className="w-full bg-red-500/10 text-red-500 font-black py-4 rounded-3xl text-[9px] uppercase tracking-widest italic border border-red-500/20">Disconnect</button>
                </div>
             </div>
          </div>
        )}
      </div>

      <nav className="absolute bottom-6 left-6 right-6 h-20 glass-nav rounded-[32px] border border-white/10 flex justify-around items-center px-4 shadow-2xl z-50">
        <button onClick={() => setActiveTab('home')} className={`flex-1 flex flex-col items-center ${activeTab === 'home' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-house text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1.5 italic">Hub</span>
        </button>
        <button onClick={() => setActiveTab('active')} className={`flex-1 flex flex-col items-center ${activeTab === 'active' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-route text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1.5 italic">Trips</span>
        </button>
        <button onClick={() => setActiveTab('account')} className={`flex-1 flex flex-col items-center ${activeTab === 'account' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-user text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1.5 italic">Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default CustomerDashboard;
