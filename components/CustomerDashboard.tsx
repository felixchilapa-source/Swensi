
import React, { useState, useMemo, useRef } from 'react';
import { User, Booking, Location, BookingStatus, Role, CouncilOrder, SavedNode, Feedback, ShoppingItem } from '../types';
import { CATEGORIES, Category, PAYMENT_NUMBERS, LANGUAGES, COLORS } from '../constants';
import Map from './Map';
import NewsTicker from './NewsTicker';
import AIAssistant from './AIAssistant';

interface CustomerDashboardProps {
  user: User;
  logout: () => void;
  bookings: Booking[];
  councilOrders: CouncilOrder[];
  allUsers?: User[]; 
  onAddBooking: (data: Partial<Booking>) => void;
  onCancelBooking: (id: string) => void;
  onAcceptNegotiation: (id: string) => void;
  onCounterNegotiation: (id: string, price: number) => void;
  onRejectNegotiation: (id: string) => void;
  location: Location;
  onSendFeedback: (f: Partial<Feedback>) => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  onLanguageChange: (lang: string) => void;
  onBecomeProvider: (kyc: { license: string, address: string, photo: string, categories: string[] }) => void;
  onUpdateUser: (updates: Partial<User>) => void;
  t: (key: string) => string;
  onToggleViewMode?: () => void;
  onSOS?: () => void;
  onDeposit?: (amount: number) => void;
  onSaveNode?: (node: SavedNode) => void;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ 
  user, logout, bookings, allUsers = [], onAddBooking, onCancelBooking, onAcceptNegotiation, onCounterNegotiation, onRejectNegotiation, location, onSOS, onDeposit, onBecomeProvider, onToggleViewMode, onSaveNode, onSendFeedback, t, onToggleTheme, isDarkMode, onLanguageChange 
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'active' | 'account'>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showKycForm, setShowKycForm] = useState(false);
  
  const [kycLicense, setKycLicense] = useState('');
  const [kycAddress, setKycAddress] = useState('');
  const [kycCategory, setKycCategory] = useState<string>(CATEGORIES[0].id);
  
  const [isHaggling, setIsHaggling] = useState(false);
  const [haggledPrice, setHaggledPrice] = useState<number>(0);
  const [counterInputs, setCounterInputs] = useState<{[key:string]: number}>({});

  const [isForOther, setIsForOther] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const [missionDesc, setMissionDesc] = useState('');
  const [mapCenter, setMapCenter] = useState<Location>(location);
  
  const [shoppingItems, setShoppingItems] = useState<string[]>([]);

  const activeBookings = useMemo(() => bookings.filter(b => b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CANCELLED), [bookings]);

  const { mapMarkers, mapMissions } = useMemo(() => {
    const markers: Array<{ loc: Location; color: string; label: string; isLive?: boolean; id?: string }> = [
      { loc: location, color: '#059669', label: 'Me', isLive: true, id: user.id }
    ];
    const missions: Array<{ from: Location; to: Location; id: string }> = [];

    activeBookings.forEach(b => {
      if (b.providerId) {
        const provider = allUsers.find(u => u.id === b.providerId);
        if (provider && provider.location) {
          markers.push({
            loc: provider.location,
            color: '#3b82f6',
            label: `Agent: ${provider.name}`,
            isLive: true,
            id: provider.id
          });
          if ([BookingStatus.ACCEPTED, BookingStatus.ON_TRIP].includes(b.status)) {
            missions.push({ from: location, to: provider.location, id: b.id });
          }
        }
      }
    });

    allUsers.forEach(u => {
      if (u.id !== user.id && u.location && !markers.some(m => m.id === u.id)) {
        if (u.role === Role.LODGE) {
          markers.push({ loc: u.location, color: COLORS.HOSPITALITY, label: u.name });
        } else if (u.role === Role.SHOP_OWNER) {
          markers.push({ loc: u.location, color: COLORS.WARNING, label: u.name });
        }
      }
    });

    return { mapMarkers: markers, mapMissions: missions };
  }, [allUsers, activeBookings, location, user.id]);

  const handleLaunchMission = () => {
    if (!selectedCategory) return;
    
    let finalDesc = missionDesc;
    let finalItems: ShoppingItem[] = [];

    if (selectedCategory.id === 'shop_for_me') {
      finalDesc = `Shopping Mission: ${shoppingItems.join(', ')}. ${missionDesc}`;
      finalItems = shoppingItems.map(name => ({ id: Math.random().toString(36).substr(2, 5), name, isAvailable: true }));
    }

    onAddBooking({ 
      category: selectedCategory.id, 
      description: finalDesc, 
      price: selectedCategory.basePrice, 
      negotiatedPrice: isHaggling ? haggledPrice : undefined,
      location: location,
      isShoppingOrder: selectedCategory.id === 'shop_for_me',
      shoppingItems: finalItems,
      recipientName: isForOther ? recipientName : undefined,
      recipientPhone: isForOther ? recipientPhone : undefined
    });
    
    setSelectedCategory(null);
    setMissionDesc('');
    setShoppingItems([]);
    setIsHaggling(false);
    setIsForOther(false);
    setRecipientName('');
    setRecipientPhone('');
    setActiveTab('active');
  };

  const handleSubmitKyc = () => {
    if (!kycLicense || !kycAddress) return alert('License and Address are mandatory for Partner status.');
    onBecomeProvider({ 
      license: kycLicense, 
      address: kycAddress, 
      photo: user.avatarUrl || '',
      categories: [kycCategory] 
    });
    setShowKycForm(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <AIAssistant />

      <header className="px-5 py-4 flex justify-between items-center glass-nav border-b dark:border-white/5 sticky top-0 z-[50] backdrop-blur-xl safe-pt">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-700 w-10 h-10 rounded-2xl flex items-center justify-center transform -rotate-6">
            <i className="fas fa-link text-white text-base"></i>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Swensi</h2>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right">
             <p className="text-[11px] font-black dark:text-white uppercase italic">ZMW {user.balance.toFixed(0)}</p>
           </div>
           {user.role !== Role.CUSTOMER && (
              <button onClick={onToggleViewMode} className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-600/20"><i className="fa-solid fa-rotate"></i></button>
           )}
           <button onClick={logout} className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400"><i className="fa-solid fa-power-off text-xs"></i></button>
        </div>
      </header>

      <NewsTicker />

      {/* Increased bottom padding to prevent nav overlap */}
      <div className="flex-1 overflow-y-auto pb-40 px-5 pt-6 space-y-10 no-scrollbar">
        {activeTab === 'home' && (
          <div className="animate-fade-in space-y-8">
            
            {/* Welcome Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[35px] p-6 shadow-sm border border-slate-100 dark:border-white/5">
               <div className="flex items-center gap-5 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-3xl shadow-lg shadow-emerald-500/30">
                     <i className="fa-regular fa-user"></i>
                  </div>
                  <div>
                     <h2 className="text-2xl font-black italic uppercase text-slate-900 dark:text-white leading-none">Welcome to Swensi!</h2>
                     <p className="text-sm text-slate-500 font-medium mt-1">You're logged in as a <span className="text-emerald-500 font-bold">{user.role.charAt(0) + user.role.slice(1).toLowerCase()}</span></p>
                  </div>
               </div>
               <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                     <span className="text-xs font-black uppercase text-slate-400 w-16">Phone:</span>
                     <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{user.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-xs font-black uppercase text-slate-400 w-16">Status:</span>
                     <span className="text-sm font-bold text-emerald-500 flex items-center gap-2">
                        {user.isVerified ? 'Verified' : 'Active'}
                        {user.isVerified && <i className="fa-solid fa-circle-check"></i>}
                     </span>
                  </div>
               </div>
            </div>

            {/* Quick Actions */}
            <div>
               <h3 className="text-lg font-black italic uppercase text-slate-900 dark:text-white mb-4">Quick Actions</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={() => document.getElementById('services-grid')?.scrollIntoView({ behavior: 'smooth' })} className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm text-left hover:shadow-md transition-all group">
                     <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-magnifying-glass"></i>
                     </div>
                     <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">Browse Services</h4>
                     <p className="text-xs text-slate-500">Find transport, beauty, skilled trades, and casual labor services</p>
                  </button>

                  <button onClick={() => setActiveTab('active')} className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm text-left hover:shadow-md transition-all group">
                     <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-suitcase"></i>
                     </div>
                     <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">My Bookings</h4>
                     <p className="text-xs text-slate-500">View your service requests</p>
                  </button>

                  <button onClick={() => { setActiveTab('account'); setShowKycForm(true); }} className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm text-left hover:shadow-md transition-all group">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-briefcase"></i>
                     </div>
                     <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">Become a Provider</h4>
                     <p className="text-xs text-slate-500">Start offering your services</p>
                  </button>
               </div>
            </div>

            {/* Serving Banner */}
            <div className="bg-emerald-500 rounded-[24px] p-5 flex items-center gap-4 text-white shadow-xl shadow-emerald-500/20">
               <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <i className="fa-solid fa-map-location-dot text-lg"></i>
               </div>
               <span className="font-black italic uppercase tracking-wide text-sm">Serving Nakonde & Muchinga Province</span>
            </div>

            {/* Services Grid (Anchored) */}
            <div id="services-grid" className="space-y-6 pt-4">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-2xl font-black text-secondary dark:text-white uppercase italic tracking-tighter">Service Categories</h1>
                  <p className="text-xs text-slate-500 font-medium">Browse services available in your area</p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[35px] border border-white/5 overflow-hidden shadow-2xl relative">
                 <Map center={mapCenter} markers={mapMarkers} activeMissions={mapMissions} />
              </div>

              <div className="grid grid-cols-2 gap-4 pb-4">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => { setSelectedCategory(cat); setHaggledPrice(cat.basePrice); }} className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-white/5 flex flex-col items-start gap-4 text-left hover:shadow-md transition-all h-full min-h-[140px]">
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl bg-opacity-10 dark:bg-opacity-20 ${cat.color ? cat.color.replace('text-', 'bg-') : 'bg-slate-100 dark:bg-slate-800'}`}>
                        <i className={`${cat.icon} ${cat.color || 'text-slate-500'}`}></i>
                     </div>
                     <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 leading-tight">{cat.name}</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">{cat.hint}</p>
                     </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedCategory && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-[45px] p-8 shadow-2xl animate-zoom-in my-auto space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black italic uppercase leading-none">{selectedCategory.name}</h3>
                <button onClick={() => { setSelectedCategory(null); setIsHaggling(false); setIsForOther(false); }} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400"><i className="fa-solid fa-xmark"></i></button>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-[32px] space-y-4">
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase italic">Standard Rate</p>
                    <p className="text-sm font-black italic">ZMW {selectedCategory.basePrice}</p>
                 </div>
                 
                 <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/5">
                    <label className="text-[10px] font-black text-emerald-600 uppercase italic">Negotiate Price?</label>
                    <button onClick={() => setIsHaggling(!isHaggling)} className={`w-12 h-6 rounded-full relative transition-all ${isHaggling ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isHaggling ? 'right-1' : 'left-1'}`}></div>
                    </button>
                 </div>

                 {isHaggling && (
                   <div className="pt-4 space-y-3 animate-slide-up">
                      <input type="number" value={haggledPrice} onChange={(e) => setHaggledPrice(Number(e.target.value))} className="w-full bg-white dark:bg-slate-800 p-4 rounded-2xl text-xl font-black italic border-none outline-none text-emerald-600" placeholder="Offer Amount" />
                   </div>
                 )}
              </div>
              <textarea value={missionDesc} onChange={(e) => setMissionDesc(e.target.value)} placeholder="Specific Mission Notes..." className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-[24px] p-5 text-sm font-black h-28 focus:ring-2 ring-emerald-600 outline-none" />
              <button onClick={() => handleLaunchMission()} className="w-full py-5 bg-emerald-600 text-white font-black rounded-[24px] text-[10px] uppercase shadow-2xl italic tracking-widest">Launch Mission Protocol</button>
            </div>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-6 animate-fade-in pb-10">
             {activeBookings.length === 0 && <div className="py-20 text-center opacity-20 italic">No Active Corridor Ops</div>}
             {activeBookings.map(b => {
                const isNegotiating = b.status === BookingStatus.NEGOTIATING;
                const isProviderTurn = b.lastOfferBy === Role.PROVIDER;
                const hasProvider = !!b.providerId;
                const displayPrice = b.negotiatedPrice || b.price;

                return (
                  <div key={b.id} className={`bg-white dark:bg-slate-900 rounded-[40px] border overflow-hidden shadow-xl p-6 space-y-4 ${isNegotiating ? 'border-amber-500/50' : 'border-slate-100 dark:border-white/5'}`}>
                     <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xl font-black italic">{b.id}</h4>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full mt-2 inline-block ${isNegotiating ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-600/10 text-emerald-600'}`}>{b.status}</span>
                        </div>
                        <p className={`text-lg font-black italic ${isNegotiating ? 'text-amber-500' : 'text-emerald-600'}`}>ZMW {displayPrice}</p>
                     </div>
                     <p className="text-[11px] text-slate-500 italic leading-relaxed">"{b.description}"</p>
                     
                     {/* Negotiation UI for Customer */}
                     {isNegotiating && (
                       <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-3xl space-y-3">
                          {isProviderTurn && hasProvider ? (
                            <div className="space-y-3 animate-slide-up">
                              <p className="text-[10px] font-black uppercase text-blue-500 italic">Provider Counter Offer: ZMW {displayPrice}</p>
                              <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => onAcceptNegotiation(b.id)} className="py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase italic">Accept {displayPrice}</button>
                                <button onClick={() => onRejectNegotiation(b.id)} className="py-3 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase italic">Reject</button>
                              </div>
                              <div className="flex gap-2">
                                <input 
                                  type="number" 
                                  placeholder="Counter..."
                                  className="w-20 px-3 py-2 rounded-xl text-xs font-black bg-white dark:bg-slate-900 border-none outline-none"
                                  onChange={(e) => setCounterInputs({...counterInputs, [b.id]: Number(e.target.value)})}
                                />
                                <button 
                                  onClick={() => counterInputs[b.id] && onCounterNegotiation(b.id, counterInputs[b.id])}
                                  className="flex-1 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase italic"
                                >
                                  Counter
                                </button>
                              </div>
                            </div>
                          ) : (
                             <div className="text-center py-2 animate-pulse">
                                <p className="text-[10px] font-black uppercase text-amber-500 italic">
                                  {hasProvider ? 'Waiting for Provider Response...' : 'Broadcasting Offer to Partners...'}
                                </p>
                             </div>
                          )}
                       </div>
                     )}

                     {!isNegotiating && (
                       <button onClick={() => onCancelBooking(b.id)} className="w-full py-3 bg-red-600/5 text-red-600 border border-red-600/20 rounded-2xl text-[9px] font-black uppercase italic">Abort Mission</button>
                     )}
                  </div>
                );
             })}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="animate-fade-in space-y-8 pb-20">
             <div className="bg-slate-900 rounded-[40px] p-8 border border-white/5 shadow-2xl">
                <div className="flex items-center gap-6 mb-8">
                   <div className="w-20 h-20 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                      {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <i className="fa-solid fa-user text-3xl text-slate-700"></i>}
                   </div>
                   <div>
                      <h3 className="text-2xl font-black italic uppercase text-white leading-none">{user.name}</h3>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">{user.phone}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white/5 p-6 rounded-[30px] border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase italic mb-1">My Wallet</p>
                      <p className="text-xl font-black text-white italic tracking-tighter">ZMW {user.balance.toFixed(2)}</p>
                   </div>
                   <div className="bg-white/5 p-6 rounded-[30px] border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase italic mb-1">Trust Score</p>
                      <p className="text-xl font-black text-emerald-500 italic tracking-tighter">{user.trustScore}%</p>
                   </div>
                </div>
             </div>

             {!showKycForm ? (
               <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-xl text-center space-y-4">
                  <div className="w-14 h-14 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                     <i className="fa-solid fa-id-card text-2xl"></i>
                  </div>
                  <h3 className="text-base font-black italic uppercase">Become a Service Partner</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold leading-relaxed px-4">Start earning by providing transport, customs, or trade services in the Nakonde corridor.</p>
                  <button onClick={() => setShowKycForm(true)} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl text-[9px] uppercase italic tracking-widest shadow-xl">Apply for Partner Terminal</button>
               </div>
             ) : (
               <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border-2 border-blue-600 shadow-2xl space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black italic uppercase">Partner KYC</h3>
                    <button onClick={() => setShowKycForm(false)} className="text-slate-400"><i className="fa-solid fa-xmark"></i></button>
                  </div>
                  <div className="space-y-4">
                     <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase italic ml-2">License / ID Number</label>
                        <input value={kycLicense} onChange={e => setKycLicense(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-xl text-xs font-black italic" placeholder="e.g. NRC-XXXXX-X" />
                     </div>
                     <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase italic ml-2">Service Category</label>
                        <select 
                          value={kycCategory} 
                          onChange={e => setKycCategory(e.target.value)} 
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-xl text-xs font-black italic appearance-none outline-none text-slate-800 dark:text-white"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                     </div>
                     <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase italic ml-2">Nakonde Home Address / Landmark</label>
                        <input value={kycAddress} onChange={e => setKycAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-xl text-xs font-black italic" placeholder="e.g. Near Market Station" />
                     </div>
                     <button onClick={handleSubmitKyc} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl text-[9px] uppercase italic">Submit Verification</button>
                  </div>
               </div>
             )}

             <button onClick={logout} className="w-full py-4 bg-red-600/5 text-red-600 rounded-2xl text-[9px] font-black uppercase italic border border-red-600/10">Sign Out</button>
          </div>
        )}
      </div>

      <nav className="fixed bottom-6 left-6 right-6 h-20 glass-nav rounded-[32px] border border-white/10 flex justify-around items-center px-4 shadow-2xl z-50">
        <button onClick={() => setActiveTab('home')} className={`flex-1 flex flex-col items-center ${activeTab === 'home' ? 'text-emerald-600' : 'text-slate-400'}`}><i className="fa-solid fa-house"></i></button>
        <button onClick={() => setActiveTab('active')} className={`flex-1 flex flex-col items-center ${activeTab === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}><i className="fa-solid fa-route"></i></button>
        <button onClick={() => setActiveTab('account')} className={`flex-1 flex flex-col items-center ${activeTab === 'account' ? 'text-emerald-600' : 'text-slate-400'}`}><i className="fa-solid fa-user"></i></button>
      </nav>
    </div>
  );
};

export default CustomerDashboard;
