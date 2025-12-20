import React, { useState, useMemo } from 'react';
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
  t: (key: string) => string;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ 
  user, logout, bookings, onAddBooking, onConfirmCompletion, t, onBecomeProvider
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'active' | 'account'>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isScheduling] = useState(false);
  const [scheduleTime] = useState('');
  const [missionDesc, setMissionDesc] = useState('');
  const [landmark, setLandmark] = useState('');
  const [shoppingItems, setShoppingItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  
  const [isForOther, setIsForOther] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const isNight = useMemo(() => {
    const hours = new Date().getHours();
    return hours >= 19 || hours < 5;
  }, []);

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
      scheduledAt: isScheduling && scheduleTime ? new Date(scheduleTime).getTime() : undefined,
      isShoppingOrder: isShopping,
      shoppingItems: isShopping ? finalItems : undefined,
      isTrustedTransportOnly: isNight || selectedCategory.requiresLicense,
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
                <button onClick={() => setSelectedCategory(null)} className="text-slate-400"><i className="fa-solid fa-circle-xmark text-xl"></i></button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 pl-2">What do you need done?</label>
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
                       <button onClick={() => { if(newItem){setShoppingItems([...shoppingItems, newItem]); setNewItem('');}}} className="w-12 h-12 bg-emerald-600 text-white rounded-2xl active:scale-95 transition-all"><i className="fa-solid fa-plus"></i></button>
                    </div>
                  </div>
                )}

                <button onClick={handleLaunch} className="w-full font-black py-5 rounded-[28px] text-[10px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all text-white bg-emerald-600 hover:bg-emerald-700 italic">
                  Book ZMW {selectedCategory.basePrice}
                </button>
              </div>
           </div>
        </div>
      )}

      <header className="px-5 py-5 flex justify-between items-center glass-nav border-b border-slate-200 dark:border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-700 w-10 h-10 rounded-2xl shadow-lg flex items-center justify-center transform -rotate-3">
            <i className="fas fa-link text-white text-base"></i>
          </div>
          <div>
            <h2 className="text-lg font-black leading-none text-slate-900 dark:text-white uppercase italic tracking-tighter">Swensi</h2>
            <span className="text-[8px] font-black text-emerald-600 tracking-[0.2em] uppercase mt-1 inline-block">Nakonde Mobile Link</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right">
             <div className="flex items-center gap-1.5 justify-end">
               <span className={`${myTrust.bg} ${myTrust.color} text-[6px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-1`}>
                 <i className={`fa-solid ${myTrust.icon}`}></i> {myTrust.label}
               </span>
               <p className="text-[10px] font-black dark:text-white uppercase italic tracking-tighter">ZMW {user.balance.toFixed(0)}</p>
             </div>
             <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Mobile Wallet</p>
           </div>
           <button onClick={logout} className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400"><i className="fa-solid fa-power-off text-xs"></i></button>
        </div>
      </header>

      <NewsTicker />

      <div className="flex-1 overflow-y-auto pb-32 px-5 pt-6 space-y-8 no-scrollbar">
        {activeTab === 'home' && (
          <div className="animate-fade-in space-y-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-secondary dark:text-white tracking-tighter italic leading-none">{t('welcome')}</h1>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2 italic">{t('slogan')}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat)} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 flex flex-col items-start justify-between min-h-[160px] service-card shadow-sm hover:border-emerald-600 group">
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-700 text-xl group-hover:scale-110 transition-all"><i className={cat.icon}></i></div>
                  <div className="w-full">
                    <p className="text-[10px] font-black uppercase text-secondary dark:text-white tracking-tight italic">{cat.name}</p>
                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">{cat.hint}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'active' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Ongoing Journeys</h3>
            {activeBookings.length === 0 && (
              <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                <i className="fa-solid fa-route text-4xl"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">No Active Bookings</p>
              </div>
            )}
            {activeBookings.map(b => (
              <div key={b.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-xl overflow-hidden mb-6">
                {(b.status === BookingStatus.ON_TRIP || b.status === BookingStatus.GOODS_IN_TRANSIT) && (
                   <Map center={b.location} markers={[{ loc: b.location, color: '#059669', label: 'Driver' }]} trackingHistory={b.trackingHistory} />
                )}
                <div className="p-7">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-xl">{b.category}</span>
                    <span className="text-[10px] font-black uppercase italic tracking-widest text-emerald-500">{b.status}</span>
                  </div>
                  <p className="text-xs font-black text-slate-600 dark:text-slate-300 italic mb-4">{b.description}</p>
                  
                  {b.status === BookingStatus.DELIVERED && (
                    <button onClick={() => onConfirmCompletion(b.id)} className="w-full bg-emerald-600 text-white font-black py-4 rounded-[20px] text-[10px] uppercase shadow-lg active:scale-95 transition-all">Receive & Finish</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-white/5 shadow-xl text-center">
              <div className="w-24 h-24 mx-auto bg-emerald-700 rounded-full flex items-center justify-center text-white text-3xl font-black italic shadow-2xl mb-6">
                {user.name.charAt(0)}
              </div>
              <h2 className="text-2xl font-black text-secondary dark:text-white italic uppercase tracking-tighter">{user.name}</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 italic">{user.phone}</p>
              
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
                <button onClick={onBecomeProvider} className="w-full bg-indigo-600 text-white font-black py-4 rounded-3xl text-[9px] uppercase tracking-widest shadow-xl active:scale-95 transition-all mb-4 italic">Become a Swensi Partner</button>
                <button onClick={logout} className="w-full bg-red-500/10 text-red-500 font-black py-4 rounded-3xl text-[9px] uppercase tracking-widest border border-red-500/10">Logout</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="absolute bottom-6 left-6 right-6 h-18 glass-nav rounded-[32px] border border-white/10 flex justify-around items-center px-4 shadow-2xl z-50">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center flex-1 ${activeTab === 'home' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-house-chimney text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1 tracking-widest italic">{t('home')}</span>
        </button>
        <button onClick={() => setActiveTab('active')} className={`flex flex-col items-center flex-1 ${activeTab === 'active' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
          <div className="relative">
             <i className="fa-solid fa-truck-fast text-lg"></i>
             {activeBookings.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>}
          </div>
          <span className="text-[8px] font-black uppercase mt-1 tracking-widest italic">{t('active')}</span>
        </button>
        <button onClick={() => setActiveTab('account')} className={`flex flex-col items-center flex-1 ${activeTab === 'account' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-user-circle text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1 tracking-widest italic">{t('account')}</span>
        </button>
      </nav>
    </div>
  );
};

export default CustomerDashboard;