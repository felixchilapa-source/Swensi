import React, { useState, useMemo } from 'react';
import { User, Booking, Location, BookingStatus, ShoppingItem } from '../types';
import { CATEGORIES, COLORS } from '../constants';
import Map from './Map';
import NewsTicker from './NewsTicker';

interface CustomerDashboardProps {
  user: User;
  logout: () => void;
  bookings: Booking[];
  onAddBooking: (data: Partial<Booking>) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  location: Location;
  onConfirmCompletion: (id: string) => void;
  onRate: (id: string, rating: number) => void;
  onUploadFacePhoto: (id: string, url: string) => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  onLanguageChange: (lang: string) => void;
  onBecomeProvider: () => void;
  t: (key: string) => string;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ 
  user, logout, bookings, onAddBooking, onConfirmCompletion, onUpdateBooking, t, location, onBecomeProvider
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'active' | 'account'>('home');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [missionDesc, setMissionDesc] = useState('');
  const [shoppingItems, setShoppingItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  
  // Booking for Others State
  const [isForOther, setIsForOther] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const isNight = useMemo(() => {
    const hours = new Date().getHours();
    return hours >= 19 || hours < 5;
  }, []);

  const activeBookings = useMemo(() => bookings.filter(b => b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CANCELLED), [bookings]);

  const handleLaunch = () => {
    const isShopping = selectedCategory.id === 'errands';
    const finalItems: ShoppingItem[] = shoppingItems.map(name => ({
      id: Math.random().toString(36).substr(2, 5),
      name,
      isAvailable: true
    }));

    onAddBooking({
      category: selectedCategory.id,
      description: missionDesc || `Mission: ${selectedCategory.name}`,
      price: selectedCategory.basePrice,
      scheduledAt: isScheduling && scheduleTime ? new Date(scheduleTime).getTime() : undefined,
      isShoppingOrder: isShopping,
      shoppingItems: isShopping ? finalItems : undefined,
      isTrustedTransportOnly: isNight || selectedCategory.requiresLicense,
      // Pass recipient info
      recipientName: isForOther ? recipientName : undefined,
      recipientPhone: isForOther ? recipientPhone : undefined,
    });

    // Reset all states
    setSelectedCategory(null);
    setMissionDesc('');
    setShoppingItems([]);
    setIsScheduling(false);
    setIsForOther(false);
    setRecipientName('');
    setRecipientPhone('');
    setActiveTab('active');
  };

  const getTrustLabel = (score: number) => {
    if (score >= 98) return { label: 'Elite', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: 'fa-crown' };
    if (score >= 90) return { label: 'Verified', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: 'fa-shield-check' };
    return { label: 'Standard', color: 'text-slate-400', bg: 'bg-slate-400/10', icon: 'fa-user-check' };
  };

  const myTrust = getTrustLabel(user.trustScore);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      {/* Launch Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 animate-fade-in">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setSelectedCategory(null)}></div>
           <div className="relative w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black italic tracking-tighter text-secondary dark:text-white uppercase flex items-center gap-3">
                   <span className="text-blue-600">{selectedCategory.icon}</span>
                   {selectedCategory.name}
                </h3>
                <button onClick={() => setSelectedCategory(null)} className="text-slate-400"><i className="fa-solid fa-circle-xmark text-xl"></i></button>
              </div>

              <div className="space-y-6">
                {isNight && (
                  <div className="bg-blue-600/10 p-4 rounded-3xl flex items-center gap-3 border border-blue-600/20">
                    <i className="fa-solid fa-shield-halved text-blue-600 animate-pulse"></i>
                    <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest italic leading-tight">Night Security Active:<br/>High-Trust Nodes Only</p>
                  </div>
                )}

                <textarea 
                  value={missionDesc}
                  onChange={(e) => setMissionDesc(e.target.value)}
                  placeholder="Deployment Directives (e.g. Precise drop-off instructions, gate codes, or landmarks)..."
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-5 text-sm font-medium outline-none focus:border-blue-600 min-h-[90px]"
                />

                {/* Booking for Others Toggle */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Booking for someone else?</label>
                    <button 
                      onClick={() => setIsForOther(!isForOther)}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${isForOther ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isForOther ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                  
                  {isForOther && (
                    <div className="space-y-3 animate-fade-in px-1">
                       <input 
                         value={recipientName}
                         onChange={(e) => setRecipientName(e.target.value)}
                         placeholder="Recipient Name"
                         className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-xs outline-none focus:border-blue-600"
                       />
                       <input 
                         value={recipientPhone}
                         onChange={(e) => setRecipientPhone(e.target.value)}
                         placeholder="Recipient Phone Number"
                         className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-xs outline-none focus:border-blue-600"
                       />
                    </div>
                  )}
                </div>

                {selectedCategory.id === 'errands' && (
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 pl-2 italic">Trade Manifest</label>
                    <div className="flex gap-2">
                       <input 
                         value={newItem}
                         onChange={(e) => setNewItem(e.target.value)}
                         placeholder="Add manifest item..."
                         className="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-xs outline-none"
                         onKeyPress={(e) => e.key === 'Enter' && (newItem && (setShoppingItems([...shoppingItems, newItem]), setNewItem('')))}
                       />
                       <button onClick={() => { if(newItem){setShoppingItems([...shoppingItems, newItem]); setNewItem('');}}} className="w-12 h-12 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all"><i className="fa-solid fa-plus"></i></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {shoppingItems.map((it, i) => (
                         <span key={i} className="bg-blue-500/10 px-3 py-1.5 rounded-full text-[10px] font-bold text-blue-600 flex items-center gap-2 border border-blue-500/20">
                           {it} <i className="fa-solid fa-xmark text-red-500 cursor-pointer" onClick={() => setShoppingItems(shoppingItems.filter((_, idx) => idx !== i))}></i>
                         </span>
                       ))}
                    </div>
                  </div>
                )}

                <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                   <button onClick={() => setIsScheduling(false)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!isScheduling ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>Instant Deployment</button>
                   <button onClick={() => setIsScheduling(true)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isScheduling ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400'}`}>Advanced Schedule</button>
                </div>

                {isScheduling && (
                  <input type="datetime-local" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-xs font-bold dark:text-white outline-none focus:border-blue-600" />
                )}

                <button onClick={handleLaunch} className="w-full font-black py-5 rounded-[28px] text-[10px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all text-white bg-blue-700 hover:bg-blue-800 italic">Initiate Mission Link</button>
              </div>
           </div>
        </div>
      )}

      <header className="px-5 py-5 flex justify-between items-center glass-nav border-b border-slate-200 dark:border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-700 w-10 h-10 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center transform rotate-3">
            <i className="fas fa-route text-white text-base"></i>
          </div>
          <div>
            <h2 className="text-lg font-black leading-none text-slate-900 dark:text-white uppercase italic tracking-tighter">Swensi</h2>
            <span className="text-[8px] font-black text-blue-600 tracking-[0.2em] uppercase mt-1 inline-block">Nakonde HUB</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-right">
           <div className="flex flex-col items-end">
             <div className="flex items-center gap-1.5">
               <span className={`${myTrust.bg} ${myTrust.color} text-[7px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-1`}>
                 <i className={`fa-solid ${myTrust.icon}`}></i> {myTrust.label}
               </span>
               <p className="text-[10px] font-black dark:text-white uppercase italic tracking-tighter">ZMW {user.balance.toFixed(2)}</p>
             </div>
             <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Escrow Active</p>
           </div>
           <button onClick={logout} className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors shadow-sm"><i className="fa-solid fa-power-off text-xs"></i></button>
        </div>
      </header>

      <NewsTicker />

      <div className="flex-1 overflow-y-auto pb-32 px-5 pt-6 space-y-8 no-scrollbar">
        {activeTab === 'home' && (
          <div className="animate-fade-in space-y-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-secondary dark:text-white tracking-tighter italic leading-none">Trade Node.</h1>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] opacity-70 mt-2">Corridor Status: {isNight ? '🌙 Night Security Protocol Active' : '☀️ Optimal Trade Window'}</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-700 to-indigo-950 p-8 rounded-[40px] text-white shadow-2xl shadow-blue-600/30 relative overflow-hidden group">
               <div className="relative z-10">
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none max-w-[180px]">{t('slogan')}</h2>
                 <div className="mt-8 flex items-center gap-3">
                    <button onClick={() => setSelectedCategory(CATEGORIES[0])} className="bg-amber-600 text-white font-black px-6 py-3 rounded-2xl text-[9px] uppercase tracking-widest shadow-xl shadow-amber-600/20 active:scale-95 transition-all">Quick Deployment</button>
                 </div>
               </div>
               <i className="fa-solid fa-satellite absolute -bottom-6 -right-6 text-[100px] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700"></i>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat)} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center service-card shadow-sm group hover:border-blue-600">
                  <div className="bg-slate-50 dark:bg-white/5 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-700 text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">{cat.icon}</div>
                  <span className="text-[10px] font-black uppercase text-secondary dark:text-slate-200 tracking-widest text-center italic">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'active' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Live Operations Pipeline</h3>
            {activeBookings.length === 0 && (
              <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                <i className="fa-solid fa-radar text-4xl animate-pulse"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">No Active Nodes Detected</p>
              </div>
            )}
            {activeBookings.map(b => (
              <div key={b.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-xl relative overflow-hidden mb-6">
                {(b.status === BookingStatus.ON_TRIP || b.status === BookingStatus.GOODS_IN_TRANSIT) && (
                   <Map center={b.location} markers={[{ loc: b.location, color: '#1E40AF', label: 'Partner' }]} trackingHistory={b.trackingHistory} />
                )}
                <div className="p-7">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-500/10 px-3 py-1 rounded-xl border border-blue-500/10">{b.category}</span>
                      {b.providerTrustSnapshot && (
                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-xl flex items-center gap-1 ${getTrustLabel(b.providerTrustSnapshot).bg} ${getTrustLabel(b.providerTrustSnapshot).color}`}>
                          <i className={`fa-solid ${getTrustLabel(b.providerTrustSnapshot).icon}`}></i> Partner {getTrustLabel(b.providerTrustSnapshot).label}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase italic animate-pulse tracking-widest text-blue-500">{b.status}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 space-y-4 shadow-inner relative">
                     <p className="text-xs font-black text-slate-600 dark:text-slate-300 italic leading-relaxed">{b.description}</p>
                     
                     {/* Cancellation Trigger for Customer */}
                     {b.status === BookingStatus.PENDING && (
                       <button 
                        onClick={() => onUpdateBooking(b.id, { status: BookingStatus.CANCELLED })}
                        className="absolute top-4 right-4 text-red-500 text-xs hover:scale-110 transition-transform"
                       >
                         <i className="fa-solid fa-ban"></i>
                       </button>
                     )}

                     {/* Tactical Operational Brief (High Priority Visibility for Customer during ON_TRIP) */}
                     {b.status === BookingStatus.ON_TRIP && (
                       <div className="bg-slate-900/5 dark:bg-white/5 p-5 rounded-[28px] border-2 border-blue-600/20 space-y-5 animate-fade-in shadow-lg">
                          <div className="flex items-start gap-4">
                             <div className="w-10 h-10 rounded-2xl bg-amber-600/10 flex items-center justify-center text-amber-600 border border-amber-600/20 shrink-0 shadow-sm">
                                <i className="fa-solid fa-location-crosshairs text-sm"></i>
                             </div>
                             <div>
                                <p className="text-[8px] font-black uppercase text-amber-600 tracking-widest italic mb-1">Target Mission Destination</p>
                                <p className="text-[12px] font-black text-slate-900 dark:text-white uppercase italic leading-tight tracking-tight">
                                  {b.destination?.address || 'Tactical Point Beta (Nakonde Corridor)'}
                                </p>
                             </div>
                          </div>
                          
                          <div className="flex items-start gap-4">
                             <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 border border-blue-600/20 shrink-0 shadow-sm">
                                <i className="fa-solid fa-clipboard-check text-sm"></i>
                             </div>
                             <div>
                                <p className="text-[8px] font-black uppercase text-blue-600 tracking-widest italic mb-1">Specific Mission Directives</p>
                                <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase italic leading-tight tracking-tight">
                                  {b.description || 'Proceed to destination point under standard protocol.'}
                                </p>
                             </div>
                          </div>
                          
                          <div className="pt-2 flex justify-end">
                             <div className="flex items-center gap-1.5 opacity-40">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                <p className="text-[6px] font-black uppercase tracking-widest italic">Encrypted Brief Data</p>
                             </div>
                          </div>
                       </div>
                     )}

                     {/* Provider Identity & Trust */}
                     {b.providerTrustSnapshot && (
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm animate-fade-in">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-black italic">P</div>
                            <div>
                               <p className="text-[9px] font-black text-slate-800 dark:text-white uppercase italic leading-none">Partner Assigned</p>
                               <p className="text-[7px] font-bold text-blue-500 uppercase tracking-widest mt-1">Trust Score: {b.providerTrustSnapshot}%</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => <i key={s} className="fa-solid fa-star text-[7px] text-amber-500"></i>)}
                             </div>
                             <p className="text-[7px] font-black text-slate-400 uppercase mt-1">Verified Node</p>
                          </div>
                        </div>
                     )}

                     {/* Recipient info display */}
                     {b.recipientName && (
                        <div className="pt-3 border-t border-slate-200 dark:border-white/10">
                           <p className="text-[8px] font-black uppercase text-amber-600 mb-1 tracking-widest italic">Recipient Signal</p>
                           <p className="text-[11px] font-black text-slate-800 dark:text-white italic uppercase tracking-tighter">{b.recipientName}</p>
                           <p className="text-[10px] font-bold text-slate-400 font-mono italic">{b.recipientPhone}</p>
                        </div>
                     )}

                     {b.isShoppingOrder && b.shoppingItems && (
                       <div className="pt-3 border-t border-slate-200 dark:border-white/5">
                         <p className="text-[8px] font-black uppercase text-blue-600 mb-2 italic">Manifest Checklist</p>
                         {b.shoppingItems.map(item => (
                           <div key={item.id} className="flex items-center gap-2 mb-1">
                             <i className={`fa-solid ${item.isAvailable ? 'fa-check text-blue-500' : 'fa-xmark text-red-500'} text-[10px]`}></i>
                             <span className={`text-[10px] font-bold uppercase italic tracking-tight ${item.isAvailable ? 'text-slate-500' : 'text-slate-300 line-through'}`}>{item.name}</span>
                           </div>
                         ))}
                       </div>
                     )}
                  </div>
                  {b.status === BookingStatus.DELIVERED && (
                    <button onClick={() => onConfirmCompletion(b.id)} className="w-full bg-blue-700 text-white font-black py-5 rounded-[24px] text-[10px] uppercase tracking-widest mt-6 shadow-xl shadow-blue-600/30 active:scale-95 transition-all italic">Confirm & Release Escrow</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="animate-fade-in space-y-6 pb-12">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-white/5 shadow-xl text-center">
              <div className="relative mx-auto w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-full bg-blue-600 blur-2xl opacity-20 animate-pulse"></div>
                <div className="relative w-full h-full bg-blue-700 rounded-full flex items-center justify-center text-white text-3xl font-black italic border-4 border-white dark:border-slate-800 shadow-2xl">
                  {user.name.charAt(0)}
                </div>
              </div>
              <h2 className="text-2xl font-black text-secondary dark:text-white italic uppercase tracking-tighter">{user.name}</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 opacity-70 italic">{user.phone}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                 <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/5">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Mission Success</p>
                    <p className="text-lg font-black text-blue-600 italic tracking-tighter">{user.completedMissions || 0}</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/5">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Reliability</p>
                    <p className="text-lg font-black text-amber-600 italic tracking-tighter">{user.onTimeRate || 95}%</p>
                 </div>
              </div>

              <div className={`mt-6 p-6 rounded-[32px] border-2 shadow-inner ${myTrust.color} ${myTrust.bg} border-current opacity-90 transition-all`}>
                 <div className="flex items-center justify-center gap-3 mb-2">
                    <i className={`fa-solid ${myTrust.icon} text-2xl`}></i>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">{myTrust.label} Node</h3>
                 </div>
                 <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 leading-relaxed italic">Verified Nakonde Trade Clearance Level: {user.trustScore}%</p>
                 <div className="w-full h-1 bg-current opacity-20 rounded-full mt-4">
                    <div className="h-full bg-current rounded-full" style={{ width: `${user.trustScore}%` }}></div>
                 </div>
              </div>

              {/* Account Upgrade Option */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 space-y-4">
                 <h4 className="text-[9px] font-black uppercase text-slate-500 tracking-widest italic">Partner Programs</h4>
                 <button 
                  onClick={onBecomeProvider}
                  className="w-full bg-amber-600/10 text-amber-600 border border-amber-600/20 py-4 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                 >
                   <i className="fa-solid fa-rocket text-sm"></i>
                   <span className="text-[10px] font-black uppercase tracking-widest italic">Elevate to Partner Node</span>
                 </button>
              </div>
            </div>

            <button onClick={logout} className="w-full bg-red-500/10 text-red-500 font-black py-5 rounded-[28px] text-[10px] uppercase tracking-[0.2em] border border-red-500/20 active:scale-95 transition-all italic">Terminate Link Session</button>
          </div>
        )}
      </div>

      <nav className="absolute bottom-6 left-6 right-6 h-18 glass-nav rounded-[32px] border border-white/10 flex justify-around items-center px-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'home' ? 'text-blue-500 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-house-chimney text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1.5 tracking-widest italic">Signal</span>
        </button>
        <button onClick={() => setActiveTab('active')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'active' ? 'text-blue-500 scale-110' : 'text-slate-400'}`}>
          <div className="relative">
             <i className="fa-solid fa-satellite-dish text-lg"></i>
             {activeBookings.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>}
          </div>
          <span className="text-[8px] font-black uppercase mt-1.5 tracking-widest italic">Pipeline</span>
        </button>
        <button onClick={() => setActiveTab('account')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'account' ? 'text-blue-500 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-fingerprint text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1.5 tracking-widest italic">Portal</span>
        </button>
      </nav>
    </div>
  );
};

export default CustomerDashboard;