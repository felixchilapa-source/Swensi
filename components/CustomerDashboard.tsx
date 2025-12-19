import React, { useState, useMemo } from 'react';
import { User, Booking, Location, BookingStatus } from '../types';
import { CATEGORIES, COLORS } from '../constants';
import Map from './Map';
import TermsModal from './TermsModal';

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

  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return { label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }), timestamp: d.getTime() };
  }), []);

  const handleBookLodge = (lodge: any) => {
    onAddBooking({ category: 'lodging', description: `Stay at ${lodge.name}`, price: lodge.price, lodgeId: lodge.id, isTrustedTransportOnly: true });
    setActiveTab('active');
  };

  const handleConfirmBooking = () => {
    if (!selectedCategory) return;
    
    const finalData: Partial<Booking> = {
      category: selectedCategory.id,
      description: bookingOptions.description || selectedCategory.name,
      price: selectedCategory.id === 'transport' ? 65 : 50,
      customerPhone: bookingOptions.forOthers ? bookingOptions.otherPhone : user.phone,
    };

    if (bookingOptions.scheduled) {
      finalData.scheduledAt = dates[bookingOptions.selectedDateIdx].timestamp;
    }

    onAddBooking(finalData);
    setSelectedCategory(null);
    setBookingOptions({ description: '', forOthers: false, otherPhone: '', scheduled: false, selectedDateIdx: 0 });
    setActiveTab('active');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      
      <header className="px-4 py-5 flex justify-between items-center glass-nav border-b border-slate-100 dark:border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-white rotate-3">
            <i className="fa-solid fa-truck-fast text-xs"></i>
          </div>
          <div>
            <h2 className="text-xl font-black text-secondary dark:text-white italic leading-none">Swensi</h2>
            <span className="text-[7px] font-black uppercase text-primary tracking-widest">{user.trustScore}% Trust Score</span>
          </div>
        </div>
        <button onClick={logout} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
          <i className="fa-solid fa-power-off text-xs"></i>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-28 px-4 pt-4">
        {/* PWA INSTALL BANNER */}
        {installPrompt && (
          <div className="mb-6 p-4 bg-indigo-600 rounded-[28px] text-white flex items-center justify-between shadow-xl shadow-indigo-600/20 animate-fade-in border-2 border-indigo-400">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                 <i className="fa-solid fa-mobile-screen-button"></i>
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest">Install Swensi</p>
                 <p className="text-[8px] font-bold text-white/70">Better experience on Android</p>
               </div>
             </div>
             <button 
              onClick={onInstall}
              className="px-5 py-2.5 bg-white text-indigo-700 font-black rounded-xl text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-lg"
             >
               Add Now
             </button>
          </div>
        )}

        {activeTab === 'home' && (
          <div className="space-y-6 animate-fade-in">
            <div className="px-1 py-2">
              <h1 className="text-2xl font-black text-secondary dark:text-white tracking-tight">
                {t('greeting')}, {user.name.split(' ')[0]}!
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Ready for business in Nakonde?</p>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-[32px] text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group">
               <div className="relative z-10">
                 <h2 className="text-xl font-black italic leading-tight">
                   {t('slogan')}
                 </h2>
                 <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-2 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                   Fast • Trusted • Local
                 </p>
               </div>
               <i className="fa-solid fa-bolt absolute -bottom-4 -right-2 text-7xl opacity-20 -rotate-12 group-hover:rotate-0 transition-transform duration-500"></i>
            </div>

            <div className="p-7 bg-secondary rounded-[40px] text-white shadow-xl relative overflow-hidden">
               <h3 className="text-2xl font-black mb-1 italic">Nakonde Errands</h3>
               <p className="text-xs text-indigo-100/70 mb-6">Trade support and border logistics.</p>
               <div className="flex flex-wrap gap-2 relative z-10">
                 <button onClick={() => setSelectedCategory(CATEGORIES.find(c => c.id === 'transport'))} className="bg-primary text-white font-black px-6 py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Transport</button>
                 <button onClick={() => setSelectedCategory(CATEGORIES.find(c => c.id === 'errands'))} className="bg-white/10 text-white font-black px-6 py-4 rounded-2xl text-[10px] uppercase border border-white/20 active:scale-95 transition-all">Errands</button>
               </div>
               <i className="fa-solid fa-truck-moving absolute -bottom-6 -right-6 text-9xl opacity-10 -rotate-12"></i>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => cat.id === 'lodging' ? setActiveTab('lodging') : setSelectedCategory(cat)} 
                  className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 flex flex-col items-center service-card shadow-sm"
                >
                  <div className="text-primary text-3xl mb-3">{cat.icon}</div>
                  <span className="text-[10px] font-black uppercase text-secondary dark:text-slate-200">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'lodging' && (
          <div className="space-y-6 animate-fade-in">
             <div className="px-1">
               <h3 className="text-2xl font-black text-secondary dark:text-white italic">Premium Lodges</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Verified border-safe stays</p>
             </div>
             <div className="space-y-4">
               {MOCK_LODGES.map(lodge => (
                 <div key={lodge.id} className="bg-white dark:bg-slate-900 p-5 rounded-[32px] shadow-xl flex gap-4 items-center border border-slate-50 dark:border-white/5">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center text-4xl shadow-inner">{lodge.image}</div>
                    <div className="flex-1">
                      <h4 className="font-black text-secondary dark:text-white text-xs">{lodge.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                         <span className="text-primary font-black text-sm">ZMW {lodge.price}/nt</span>
                         <button onClick={() => handleBookLodge(lodge)} className="bg-indigo-600 text-white font-black px-4 py-2 rounded-xl text-[9px] uppercase shadow-lg active:scale-95 transition-all">Book</button>
                      </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-4 animate-fade-in">
            <div className="px-1">
              <h3 className="text-2xl font-black text-secondary dark:text-white italic">Active Pipeline</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ongoing operations</p>
            </div>
            {activeBookings.length === 0 && (
              <div className="py-20 text-center opacity-30 flex flex-col items-center">
                <i className="fa-solid fa-ghost text-4xl mb-4"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">No active orders</p>
              </div>
            )}
            {activeBookings.map(b => (
              <div key={b.id} className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border-2 border-slate-100 dark:border-white/5 shadow-lg overflow-hidden relative">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[8px] font-black uppercase px-2.5 py-1 bg-indigo-50 dark:bg-white/5 rounded-lg text-indigo-600">{b.category}</span>
                  <span className="text-[9px] font-black uppercase text-primary animate-pulse">{b.status}</span>
                </div>
                {b.category === 'lodging' && b.status === BookingStatus.ROOM_ASSIGNED && (
                   <div className="bg-indigo-50 dark:bg-black/20 p-6 rounded-3xl border-2 border-dashed border-indigo-200 text-center">
                      <p className="text-[10px] font-black uppercase text-indigo-500 mb-1 tracking-widest">Official Swensi Receipt</p>
                      <h4 className="text-3xl font-black text-secondary dark:text-white italic">ROOM {b.roomNumber}</h4>
                      <p className="text-[8px] text-slate-400 mt-2 font-mono">ID: {b.receiptId}</p>
                   </div>
                )}
                
                {(b.status === BookingStatus.ACCEPTED || b.status === BookingStatus.ON_TRIP || b.status === BookingStatus.GOODS_IN_TRANSIT) && (
                    <button 
                      onClick={() => onUpdateBooking(b.id, { status: BookingStatus.DELIVERED })} 
                      className="w-full mt-4 bg-orange-500 text-white font-black py-4 rounded-2xl text-[10px] uppercase shadow-xl active:scale-95 transition-all"
                    >
                      Confirm Goods Received
                    </button>
                )}

                {b.status === BookingStatus.DELIVERED && (
                    <button onClick={() => onConfirmCompletion(b.id)} className="w-full mt-4 bg-green-500 text-white font-black py-4 rounded-2xl text-[10px] uppercase shadow-xl active:scale-95 transition-all">Service Received - Confirm</button>
                )}
                
                {b.scheduledAt && (
                   <p className="text-[8px] font-black text-orange-500 mt-2 uppercase">Scheduled: {new Date(b.scheduledAt).toLocaleDateString()}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-white/5 text-center">
                <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden">
                  <i className="fa-solid fa-user text-4xl text-slate-300"></i>
                </div>
                <h3 className="text-2xl font-black text-secondary dark:text-white">{user.name}</h3>
                <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-1">+260 {user.phone}</p>
                <div className="flex justify-center gap-6 mt-8">
                   <div className="text-center">
                      <p className="text-xl font-black text-secondary dark:text-white">{user.balance.toFixed(0)}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Balance</p>
                   </div>
                   <div className="w-px h-10 bg-slate-100 dark:bg-white/5"></div>
                   <div className="text-center">
                      <p className="text-xl font-black text-secondary dark:text-white">{user.trustScore}%</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Trust Score</p>
                   </div>
                </div>
             </div>

             <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden group">
                <div className="relative z-10">
                   <h4 className="text-2xl font-black italic mb-2 tracking-tight">{t('become_provider')}</h4>
                   <p className="text-[10px] text-white/80 font-bold leading-relaxed mb-6 max-w-[200px]">{t('provider_desc')}</p>
                   <button 
                     onClick={onBecomeProvider}
                     className="bg-white text-indigo-700 font-black px-8 py-3.5 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                   >
                     {t('apply_now')}
                   </button>
                </div>
                <i className="fa-solid fa-briefcase absolute -bottom-6 -right-6 text-9xl opacity-10 -rotate-12 group-hover:rotate-0 transition-transform duration-500"></i>
             </div>

             <div className="space-y-3">
               <button 
                 onClick={() => setShowTermsModal(true)}
                 className="w-full bg-white dark:bg-white/5 text-slate-400 font-black py-4 rounded-[28px] text-[10px] uppercase tracking-widest border border-slate-100 dark:border-white/5 shadow-sm active:bg-slate-50 transition-colors flex items-center justify-center gap-2"
               >
                 <i className="fa-solid fa-file-contract"></i>
                 View Terms & Conditions
               </button>

               <button 
                 onClick={logout}
                 className="w-full bg-white dark:bg-white/5 text-red-500 font-black py-5 rounded-[28px] text-xs uppercase tracking-widest border border-slate-100 dark:border-white/5 shadow-sm active:bg-red-50 transition-colors"
               >
                 {t('logout')}
               </button>
             </div>
          </div>
        )}
      </div>

      {selectedCategory && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end justify-center animate-fade-in p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] p-8 animate-slide-up border-t-8 border-orange-500 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-primary text-3xl">{selectedCategory.icon}</div>
              <div>
                <h3 className="text-2xl font-black text-secondary dark:text-white italic leading-tight">{selectedCategory.name}</h3>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Service Configuration</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Who is this for?</p>
                <div className="flex gap-2">
                   <button 
                    onClick={() => setBookingOptions({...bookingOptions, forOthers: false})}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${!bookingOptions.forOthers ? 'bg-secondary border-secondary text-white' : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-400'}`}
                   >
                     Me
                   </button>
                   <button 
                    onClick={() => setBookingOptions({...bookingOptions, forOthers: true})}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${bookingOptions.forOthers ? 'bg-secondary border-secondary text-white' : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-400'}`}
                   >
                     Others
                   </button>
                </div>
                {bookingOptions.forOthers && (
                   <input 
                    type="tel" 
                    placeholder="Recipient Phone (+260...)"
                    value={bookingOptions.otherPhone}
                    onChange={(e) => setBookingOptions({...bookingOptions, otherPhone: e.target.value})}
                    className="w-full mt-3 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-black text-slate-800 dark:text-white outline-none focus:border-orange-500"
                   />
                )}
              </div>

              <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">When?</p>
                <div className="flex gap-2">
                   <button 
                    onClick={() => setBookingOptions({...bookingOptions, scheduled: false})}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${!bookingOptions.scheduled ? 'bg-orange-500 border-orange-500 text-white' : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-400'}`}
                   >
                     Quick (Now)
                   </button>
                   <button 
                    onClick={() => setBookingOptions({...bookingOptions, scheduled: true})}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${bookingOptions.scheduled ? 'bg-orange-500 border-orange-500 text-white' : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-400'}`}
                   >
                     Schedule
                   </button>
                </div>
                {bookingOptions.scheduled && (
                   <div className="flex gap-2 overflow-x-auto no-scrollbar pt-3">
                    {dates.map((d, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setBookingOptions({...bookingOptions, selectedDateIdx: idx})} 
                        className={`px-4 py-3 rounded-xl border-2 min-w-[80px] text-center ${bookingOptions.selectedDateIdx === idx ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-400'}`}
                      >
                        <span className="text-[9px] font-black uppercase">{d.label}</span>
                      </button>
                    ))}
                   </div>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Specific Instructions</p>
                <textarea 
                  placeholder="Tell the provider exactly what you need..."
                  value={bookingOptions.description}
                  onChange={(e) => setBookingOptions({...bookingOptions, description: e.target.value})}
                  className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-orange-500 h-24 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSelectedCategory(null)} className="flex-1 py-5 text-slate-400 font-black text-[11px] uppercase tracking-widest">Cancel</button>
                <button 
                  onClick={handleConfirmBooking}
                  className="flex-[2] py-5 bg-orange-500 text-white font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
                >
                  Confirm Swensi Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="absolute bottom-6 left-4 right-4 h-18 glass-nav rounded-[28px] border border-white/10 flex justify-around items-center px-2 shadow-2xl z-50">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'home' ? 'text-primary scale-110' : 'text-slate-400 hover:text-slate-500'}`}>
          <i className="fa-solid fa-house"></i>
          <span className="text-[7px] font-black uppercase mt-1">Home</span>
        </button>
        <button onClick={() => setActiveTab('lodging')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'lodging' ? 'text-primary scale-110' : 'text-slate-400 hover:text-slate-500'}`}>
          <i className="fa-solid fa-bed"></i>
          <span className="text-[7px] font-black uppercase mt-1">Lodges</span>
        </button>
        <button onClick={() => setActiveTab('active')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'active' ? 'text-primary scale-110' : 'text-slate-400 hover:text-slate-500'}`}>
          <i className="fa-solid fa-clock-rotate-left"></i>
          <span className="text-[7px] font-black uppercase mt-1">Active</span>
        </button>
        <button onClick={() => setActiveTab('account')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'account' ? 'text-primary scale-110' : 'text-slate-400 hover:text-slate-500'}`}>
          <i className="fa-solid fa-user"></i>
          <span className="text-[7px] font-black uppercase mt-1">Account</span>
        </button>
      </nav>
    </div>
  );
};

export default CustomerDashboard;