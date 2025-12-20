import React, { useState, useMemo, useRef } from 'react';
import { User, Booking, Location, BookingStatus, ShoppingItem } from '../types';
import { CATEGORIES, Category } from '../constants';
import Map from './Map';
import NewsTicker from './NewsTicker';
import AIAssistant from './AIAssistant';

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
  onUpdateUser: (updates: Partial<User>) => void;
  t: (key: string) => string;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ 
  user, logout, bookings, onAddBooking, onConfirmCompletion, t, onBecomeProvider, onUpdateUser
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'active' | 'account'>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [missionDesc, setMissionDesc] = useState('');
  const [landmark, setLandmark] = useState('');
  const [shoppingItems, setShoppingItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isForOther, setIsForOther] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone);

  const activeBookings = useMemo(() => bookings.filter(b => b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CANCELLED), [bookings]);

  const handleLaunch = () => {
    if (!selectedCategory) return;
    
    const isShopping = selectedCategory.id === 'errands';
    const finalItems: ShoppingItem[] = shoppingItems.map(name => ({
      id: Math.random().toString(36).substr(2, 5),
      name,
      isAvailable: true
    }));

    onAddBooking({
      category: selectedCategory.id,
      description: `${missionDesc}${landmark ? ` | Landmark: ${landmark}` : ''}`,
      price: selectedCategory.basePrice,
      isShoppingOrder: isShopping,
      shoppingItems: isShopping ? finalItems : undefined,
      recipientName: isForOther ? recipientName : undefined,
      recipientPhone: isForOther ? recipientPhone : undefined,
    });

    setSelectedCategory(null);
    setMissionDesc('');
    setLandmark('');
    setShoppingItems([]);
    setIsForOther(false);
    setRecipientName('');
    setRecipientPhone('');
    setActiveTab('active');
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

  const getTrustLabel = (score: number) => {
    if (score >= 98) return { label: 'Elite', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: 'fa-crown' };
    if (score >= 90) return { label: 'Verified', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: 'fa-shield-check' };
    return { label: 'Standard', color: 'text-slate-400', bg: 'bg-slate-400/10', icon: 'fa-user-check' };
  };

  const myTrust = getTrustLabel(user.trustScore);

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
                <button onClick={() => setSelectedCategory(null)} className="text-slate-400 hover:text-red-500 transition-colors"><i className="fa-solid fa-circle-xmark text-xl"></i></button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 pl-2">Task Protocol</label>
                   <textarea 
                    value={missionDesc}
                    onChange={(e) => setMissionDesc(e.target.value)}
                    placeholder="Briefly describe your request..."
                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-sm font-medium outline-none focus:border-emerald-600 min-h-[80px]"
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase tracking-widest text-emerald-600 pl-2">Nearest Landmark</label>
                   <input 
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder={t('landmark_placeholder')}
                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-emerald-600"
                   />
                </div>

                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Booking for someone else?</label>
                    <button 
                      onClick={() => setIsForOther(!isForOther)}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${isForOther ? 'bg-emerald-600' : 'bg-slate-300'}`}
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
                         className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-xs outline-none focus:border-emerald-600"
                       />
                       <input 
                         value={recipientPhone}
                         onChange={(e) => setRecipientPhone(e.target.value)}
                         placeholder="Recipient Phone Number"
                         className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-xs outline-none focus:border-emerald-600"
                       />
                    </div>
                  )}
                </div>

                {selectedCategory.id === 'errands' && (
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 pl-2 italic">Shopping List</label>
                    <div className="flex gap-2">
                       <input 
                         value={newItem}
                         onChange={(e) => setNewItem(e.target.value)}
                         placeholder="Item name..."
                         className="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-xs outline-none"
                       />
                       <button onClick={() => { if(newItem){setShoppingItems([...shoppingItems, newItem]); setNewItem('');}}} className="w-12 h-12 bg-emerald-600 text-white rounded-2xl active:scale-95 transition-all flex items-center justify-center shadow-lg"><i className="fa-solid fa-plus"></i></button>
                    </div>
                  </div>
                )}

                <button onClick={handleLaunch} className="w-full font-black py-5 rounded-[28px] text-[10px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all text-white bg-emerald-600 hover:bg-emerald-700 italic">
                  Book Mission • ZMW {selectedCategory.basePrice}
                </button>
              </div>
           </div>
        </div>
      )}

      <header className="px-5 py-4 flex justify-between items-center glass-nav border-b border-slate-200 dark:border-white/5 sticky top-0 z-50 backdrop-blur-xl">
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
               <span className={`${myTrust.bg} ${myTrust.color} text-[6.5px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 border border-current opacity-80`}>
                 <i className={`fa-solid ${myTrust.icon}`}></i> {myTrust.label}
               </span>
               <p className="text-[11px] font-black dark:text-white uppercase italic tracking-tighter">ZMW {user.balance.toFixed(0)}</p>
             </div>
             <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5 opacity-60 italic">Escrow Balance</p>
           </div>
           <button onClick={logout} className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-red-500 border border-slate-200/50 dark:border-white/10 transition-colors">
            <i className="fa-solid fa-power-off text-xs"></i>
           </button>
        </div>
      </header>

      <NewsTicker />

      <div className="flex-1 overflow-y-auto pb-32 px-5 pt-6 space-y-8 no-scrollbar">
        {activeTab === 'home' && (
          <div className="animate-fade-in space-y-8">
            <div className="relative">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] italic mb-1">Station Status: Active</p>
                <h1 className="text-4xl font-black text-secondary dark:text-white tracking-tighter italic leading-[0.9] uppercase">
                  {t('welcome').split(' ')[0]} <br/> 
                  <span className="text-emerald-600">{user.name.split(' ')[0]}!</span>
                </h1>
              </div>
              <div className="absolute -right-2 top-0 w-16 h-16 bg-emerald-600/5 rounded-full blur-2xl"></div>
            </div>
            
            {/* Quick Action Tiles */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
               <div className="min-w-[140px] bg-emerald-600/10 border border-emerald-600/20 rounded-3xl p-5 flex flex-col gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <i className="fa-solid fa-plus"></i>
                  </div>
                  <p className="text-[10px] font-black uppercase italic text-emerald-600">Quick Deposit</p>
               </div>
               <div className="min-w-[140px] bg-blue-600/10 border border-blue-600/20 rounded-3xl p-5 flex flex-col gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <i className="fa-solid fa-headset"></i>
                  </div>
                  <p className="text-[10px] font-black uppercase italic text-blue-600">SOS Support</p>
               </div>
               <div className="min-w-[140px] bg-amber-600/10 border border-amber-600/20 rounded-3xl p-5 flex flex-col gap-3">
                  <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <i className="fa-solid fa-star"></i>
                  </div>
                  <p className="text-[10px] font-black uppercase italic text-amber-600">Saved Nodes</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat)} className="bg-white dark:bg-slate-900 p-6 rounded-[35px] border border-slate-100 dark:border-white/5 flex flex-col items-start justify-between min-h-[170px] service-card shadow-sm hover:border-emerald-600 group transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 w-14 h-14 rounded-2xl flex items-center justify-center text-emerald-700 dark:text-emerald-500 text-2xl group-hover:scale-110 group-hover:rotate-6 transition-all border border-emerald-100 dark:border-emerald-500/10"><i className={cat.icon}></i></div>
                  <div className="w-full relative z-10">
                    <p className="text-[11px] font-black uppercase text-secondary dark:text-white tracking-tight italic">{cat.name}</p>
                    <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 opacity-80">{cat.hint}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-gradient-to-br from-secondary to-slate-800 dark:from-slate-900 dark:to-black p-6 rounded-[40px] text-white shadow-xl relative overflow-hidden group border border-white/5">
                <div className="absolute right-[-10%] bottom-[-10%] w-32 h-32 bg-emerald-600/10 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                   <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-1">Community Insight</p>
                      <h4 className="text-xl font-black italic tracking-tighter">Your Trust Rating is {user.trustScore}%</h4>
                   </div>
                   <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:rotate-12 transition-transform">
                      <i className="fa-solid fa-shield-halved text-emerald-500"></i>
                   </div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 leading-relaxed max-w-[80%] relative z-10">
                   Higher trust scores reduce commission fees and prioritize your missions in the Nakonde corridor.
                </p>
            </div>
          </div>
        )}
        
        {activeTab === 'active' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Live Operations Center</h3>
            {activeBookings.length === 0 && (
              <div className="py-24 text-center opacity-30 flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center border-4 border-dashed border-slate-200 dark:border-slate-800">
                  <i className="fa-solid fa-radar text-3xl"></i>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">No Active Transmissions</p>
              </div>
            )}
            {activeBookings.map(b => (
              <div key={b.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-2xl overflow-hidden mb-8 transition-transform hover:scale-[1.01]">
                {(b.status === BookingStatus.ON_TRIP || b.status === BookingStatus.GOODS_IN_TRANSIT) && (
                   <Map center={b.location} markers={[{ loc: b.location, color: '#059669', label: 'Node-1' }]} trackingHistory={b.trackingHistory} />
                )}
                <div className="p-8">
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/10">{b.category} Task</span>
                    <span className="text-[11px] font-black uppercase italic tracking-widest text-emerald-500 animate-pulse">{b.status}</span>
                  </div>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-300 italic mb-6 leading-relaxed">"{b.description}"</p>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-3xl mb-6 border border-slate-100 dark:border-white/5">
                     <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Cost Protocol</span>
                        <span className="text-sm font-black dark:text-white">ZMW {b.price.toFixed(2)}</span>
                     </div>
                     <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                        <i className="fa-solid fa-fingerprint text-emerald-600"></i>
                     </div>
                  </div>

                  {b.status === BookingStatus.DELIVERED && (
                    <button onClick={() => onConfirmCompletion(b.id)} className="w-full bg-emerald-600 text-white font-black py-5 rounded-[24px] text-[10px] uppercase shadow-xl active:scale-95 transition-all italic tracking-[0.2em]">
                      Verify & Release Funds
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[45px] p-10 border border-slate-100 dark:border-white/5 shadow-2xl text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-600/10 to-transparent"></div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
              
              <div 
                onClick={handleAvatarClick}
                className="w-28 h-28 mx-auto bg-emerald-700 rounded-full flex items-center justify-center text-white text-4xl font-black italic shadow-2xl mb-8 overflow-hidden relative border-4 border-white dark:border-slate-800 z-10 group cursor-pointer"
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
                  <div className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
                     <span className="text-[9px] font-black text-emerald-600 uppercase italic tracking-widest">Market Client</span>
                  </div>
                  <h2 className="text-3xl font-black text-secondary dark:text-white italic uppercase tracking-tighter">{user.name}</h2>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest italic">{user.phone}</p>
                  </div>
                  
                  <div className="mt-10 pt-8 border-t border-slate-100 dark:border-white/5 space-y-4">
                    <button onClick={() => setIsEditing(true)} className="w-full bg-slate-50 dark:bg-white/5 text-emerald-600 border border-emerald-600/20 font-black py-4.5 rounded-[24px] text-[10px] uppercase tracking-widest active:scale-95 transition-all italic">Modify Operational Data</button>
                    <button onClick={onBecomeProvider} className="w-full bg-gradient-to-r from-indigo-600 to-blue-700 text-white font-black py-4.5 rounded-[24px] text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all italic border-b-4 border-indigo-900">Elevate to Partner Node</button>
                    <button onClick={logout} className="w-full text-red-500 font-black py-4 text-[9px] uppercase tracking-[0.3em] hover:bg-red-500/5 rounded-2xl transition-colors mt-4">Deauthorize Session</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in relative z-10">
                  <div className="text-left space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-3">Identity Alias</label>
                    <input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-slate-800 dark:text-white outline-none focus:border-emerald-600 shadow-inner"
                    />
                  </div>
                  <div className="text-left space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-3">Primary Line</label>
                    <input 
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-slate-800 dark:text-white outline-none focus:border-emerald-600 shadow-inner"
                    />
                  </div>
                  <div className="flex gap-3 pt-6">
                    <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-100 dark:bg-white/5 text-slate-500 font-black py-4.5 rounded-2xl text-[10px] uppercase tracking-widest">Abort</button>
                    <button onClick={handleSaveProfile} className="flex-1 bg-emerald-600 text-white font-black py-4.5 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl">Commit</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <nav className="absolute bottom-8 left-8 right-8 h-20 glass-nav rounded-[35px] border border-white/20 flex justify-around items-center px-6 shadow-2xl z-50 backdrop-blur-2xl">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'home' ? 'text-emerald-600 scale-110' : 'text-slate-400 opacity-60'}`}>
          <i className={`fa-solid ${activeTab === 'home' ? 'fa-house-chimney' : 'fa-house'} text-xl`}></i>
          <span className="text-[9px] font-black uppercase mt-1.5 tracking-widest italic">{t('home')}</span>
        </button>
        <button onClick={() => setActiveTab('active')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'active' ? 'text-emerald-600 scale-110' : 'text-slate-400 opacity-60'}`}>
          <div className="relative">
             <i className="fa-solid fa-bolt-lightning text-xl"></i>
             {activeBookings.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>}
          </div>
          <span className="text-[9px] font-black uppercase mt-1.5 tracking-widest italic">Live Ops</span>
        </button>
        <button onClick={() => setActiveTab('account')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'account' ? 'text-emerald-600 scale-110' : 'text-slate-400 opacity-60'}`}>
          <i className="fa-solid fa-circle-user text-xl"></i>
          <span className="text-[9px] font-black uppercase mt-1.5 tracking-widest italic">{t('account')}</span>
        </button>
      </nav>
    </div>
  );
};

export default CustomerDashboard;