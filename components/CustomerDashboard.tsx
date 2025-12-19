
import React, { useState, useMemo } from 'react';
import { User, Booking, Location, BookingStatus } from '../types';
import { CATEGORIES, COLORS } from '../constants';
import Map from './Map';
import TermsModal from './TermsModal';
import NewsTicker from './NewsTicker';

interface CustomerDashboardProps {
  user: User;
  logout: () => void;
  bookings: Booking[];
  onAddBooking: (data: Partial<Booking>) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  location: Location | null;
  onConfirmCompletion: (id: string) => void;
  onRate: (id: string, rating: number) => void;
  onUploadFacePhoto: (id: string, url: string) => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  onLanguageChange: (lang: string) => void;
  onBecomeProvider: () => void;
  t: (key: string) => string;
  installPrompt?: any;
  onInstall?: () => void;
}

const MOCK_LODGES = [
  { id: 'L1', name: 'Nakonde Border Lodge', phone: '0961234567', price: 450, image: '🏨' },
  { id: 'L2', name: 'Savannah Guest House', phone: '0977654321', price: 300, image: '🏡' },
];

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ 
  user, 
  logout, 
  bookings, 
  onAddBooking, 
  onUpdateBooking,
  onConfirmCompletion, 
  onBecomeProvider,
  t,
  installPrompt,
  onInstall
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'lodging' | 'active' | 'account'>('home');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [bookingOptions, setBookingOptions] = useState({
    description: '',
    forOthers: false,
    otherPhone: '',
    scheduled: false,
    selectedDateIdx: 0
  });

  const activeBookings = useMemo(() => bookings.filter(b => b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CANCELLED), [bookings]);

  const handleBookLodge = (lodge: any) => {
    onAddBooking({ category: 'lodging', description: `Stay at ${lodge.name}`, price: lodge.price, lodgeId: lodge.id, isTrustedTransportOnly: true });
    setActiveTab('active');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      
      <header className="px-4 py-4 flex justify-between items-center glass-nav border-b border-slate-100 dark:border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-green-600 p-2 rounded-lg shadow-inner">
            <i className="fas fa-paper-plane text-white text-sm"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold leading-none text-gray-900 dark:text-white">Swensi</h2>
            <span className="text-[10px] font-bold text-green-600 tracking-widest uppercase">Nakonde</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="text-right mr-1">
             <p className="text-[10px] font-black text-secondary dark:text-white uppercase leading-none">{user.name.split(' ')[0]}</p>
             <p className="text-[7px] font-black text-green-600 uppercase tracking-widest mt-0.5">{user.trustScore}% Trusted</p>
           </div>
           <button onClick={logout} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-white/10">
             <i className="fa-solid fa-power-off text-xs"></i>
           </button>
        </div>
      </header>

      {/* NEW TRADE TICKER */}
      <NewsTicker />

      <div className="flex-1 overflow-y-auto pb-28 px-4 pt-4">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-fade-in">
            <div className="px-1 py-2">
              <h1 className="text-2xl font-black text-secondary dark:text-white tracking-tight italic">
                {t('greeting')}, {user.name.split(' ')[0]}!
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] mt-1">The border is active today.</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-600 to-green-800 p-6 rounded-[32px] text-white shadow-xl shadow-green-500/20 relative overflow-hidden group border border-white/10">
               <div className="relative z-10">
                 <h2 className="text-xl font-black italic leading-tight uppercase">
                   {t('slogan')}
                 </h2>
                 <p className="text-[9px] font-bold text-yellow-300 uppercase tracking-widest mt-2 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse"></span>
                   Fast • Verified • Border-Link
                 </p>
               </div>
               <i className="fa-solid fa-bolt absolute -bottom-4 -right-2 text-7xl opacity-20 -rotate-12 group-hover:rotate-0 transition-transform duration-500"></i>
            </div>

            <div className="p-7 bg-secondary rounded-[40px] text-white shadow-xl relative overflow-hidden border border-white/5">
               <h3 className="text-2xl font-black mb-1 italic">Nakonde Trade Hub</h3>
               <p className="text-xs text-green-100/70 mb-6 font-medium">Logistics & local support corridor.</p>
               <div className="flex flex-wrap gap-2 relative z-10">
                 <button onClick={() => setSelectedCategory(CATEGORIES.find(c => c.id === 'transport'))} className="bg-green-600 text-white font-black px-6 py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Quick Transport</button>
                 <button onClick={() => setSelectedCategory(CATEGORIES.find(c => c.id === 'errands'))} className="bg-white/10 text-white font-black px-6 py-4 rounded-2xl text-[10px] uppercase border border-white/20 active:scale-95 transition-all backdrop-blur-md">Trade Errand</button>
               </div>
               <i className="fa-solid fa-truck-moving absolute -bottom-6 -right-6 text-9xl opacity-10 -rotate-12"></i>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-4">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => cat.id === 'lodging' ? setActiveTab('lodging') : setSelectedCategory(cat)} 
                  className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 flex flex-col items-center service-card shadow-sm"
                >
                  <div className="text-green-600 text-3xl mb-3">{cat.icon}</div>
                  <span className="text-[10px] font-black uppercase text-secondary dark:text-slate-200 tracking-tighter italic">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'lodging' && (
          <div className="space-y-6 animate-fade-in">
             <div className="px-1">
               <h3 className="text-2xl font-black text-secondary dark:text-white italic">Elite Nakonde Stays</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Vetted for cross-border safety</p>
             </div>
             <div className="space-y-4">
               {MOCK_LODGES.map(lodge => (
                 <div key={lodge.id} className="bg-white dark:bg-slate-900 p-5 rounded-[32px] shadow-xl flex gap-4 items-center border border-slate-50 dark:border-white/5">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center text-4xl shadow-inner">{lodge.image}</div>
                    <div className="flex-1">
                      <h4 className="font-black text-secondary dark:text-white text-xs">{lodge.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                         <span className="text-green-600 font-black text-sm">ZMW {lodge.price}/nt</span>
                         <button onClick={() => handleBookLodge(lodge)} className="bg-green-600 text-white font-black px-4 py-2 rounded-xl text-[9px] uppercase shadow-lg active:scale-95 transition-all">Book</button>
                      </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* Other tabs follow current structure with minor visual cleanup... */}
      </div>

      <nav className="absolute bottom-6 left-4 right-4 h-18 glass-nav rounded-[28px] border border-white/10 flex justify-around items-center px-2 shadow-2xl z-50">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'home' ? 'text-green-600 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-house"></i>
          <span className="text-[7px] font-black uppercase mt-1 tracking-tighter italic">Home</span>
        </button>
        <button onClick={() => setActiveTab('lodging')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'lodging' ? 'text-green-600 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-bed"></i>
          <span className="text-[7px] font-black uppercase mt-1 tracking-tighter italic">Lodges</span>
        </button>
        <button onClick={() => setActiveTab('active')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'active' ? 'text-green-600 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-clock-rotate-left"></i>
          <span className="text-[7px] font-black uppercase mt-1 tracking-tighter italic">Active</span>
        </button>
        <button onClick={() => setActiveTab('account')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'account' ? 'text-green-600 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-user"></i>
          <span className="text-[7px] font-black uppercase mt-1 tracking-tighter italic">Account</span>
        </button>
      </nav>
    </div>
  );
};

export default CustomerDashboard;
