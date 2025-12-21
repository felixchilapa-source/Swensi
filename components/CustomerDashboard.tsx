
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
  location: Location;
  onSendFeedback: (f: Partial<Feedback>) => void;
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
  user, logout, bookings, allUsers = [], onAddBooking, onCancelBooking, onAcceptNegotiation, onCounterNegotiation, location, onSOS, onDeposit, onBecomeProvider, onToggleViewMode, onSaveNode, onSendFeedback, t, onToggleTheme, isDarkMode, onLanguageChange 
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'active' | 'account'>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showKycForm, setShowKycForm] = useState(false);
  
  // Haggling State
  const [isHaggling, setIsHaggling] = useState(false);
  const [haggledPrice, setHaggledPrice] = useState<number>(0);

  const [missionDesc, setMissionDesc] = useState('');
  const [mapCenter, setMapCenter] = useState<Location>(location);
  
  // Shopping list builder
  const [shoppingItems, setShoppingItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');

  const nearbyMarkers = useMemo(() => {
    return allUsers
      .filter(u => u.id !== user.id && u.location && u.isActive)
      .map(u => {
        let color = '#94a3b8'; 
        let label = u.name;

        if (u.role === Role.LODGE) {
          color = COLORS.HOSPITALITY;
          label = `Lodge: ${u.name}`;
        } else if (u.role === Role.SHOP_OWNER) {
          color = COLORS.WARNING;
          label = `Shop: ${u.name}`;
        } else if (u.role === Role.PROVIDER) {
          color = COLORS.PRIMARY;
          label = `Agent: ${u.name}`;
        }

        return {
          loc: u.location!,
          color,
          label,
          isLive: u.lastActive > Date.now() - 600000 
        };
      });
  }, [allUsers, user.id]);

  const activeBookings = useMemo(() => bookings.filter(b => b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CANCELLED), [bookings]);

  const handleLaunchMission = (targetLodgeId?: string) => {
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
      providerId: targetLodgeId,
      isShoppingOrder: selectedCategory.id === 'shop_for_me',
      shoppingItems: finalItems
    });
    
    setSelectedCategory(null);
    setMissionDesc('');
    setShoppingItems([]);
    setIsHaggling(false);
    setActiveTab('active');
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

      <div className="flex-1 overflow-y-auto pb-32 px-5 pt-6 space-y-10 no-scrollbar">
        {activeTab === 'home' && (
          <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-end">
              <h1 className="text-3xl font-black text-secondary dark:text-white uppercase italic tracking-tighter">Nakonde Hub</h1>
            </div>

            <div className="bg-slate-900 rounded-[35px] border border-white/5 overflow-hidden shadow-2xl relative">
               <Map 
                  center={mapCenter} 
                  markers={[
                    { loc: location, color: '#059669', label: 'My Terminal', isLive: true },
                    ...nearbyMarkers
                  ]} 
               />
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => { setSelectedCategory(cat); setHaggledPrice(cat.basePrice); }} className="bg-white dark:bg-slate-900 p-6 rounded-[35px] border border-slate-100 dark:border-white/5 flex flex-col items-start justify-between min-h-[170px] shadow-sm group hover:border-emerald-500/50 transition-all">
                   <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <i className={`${cat.icon} text-xl`}></i>
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1 italic">{cat.name}</p>
                      <p className="text-sm font-black text-secondary dark:text-white italic tracking-tighter">ZMW {cat.basePrice}</p>
                   </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedCategory && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-fade-in">
            <div className="w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-[45px] p-8 shadow-2xl animate-zoom-in overflow-hidden flex flex-col max-h-[85vh] space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black italic uppercase leading-none">{selectedCategory.name}</h3>
                <button onClick={() => { setSelectedCategory(null); setIsHaggling(false); }} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400"><i className="fa-solid fa-xmark"></i></button>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-[32px] space-y-4">
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase italic">Base Rate</p>
                    <p className="text-sm font-black italic">ZMW {selectedCategory.basePrice}</p>
                 </div>
                 
                 <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/5">
                    <label className="text-[10px] font-black text-emerald-600 uppercase italic">Offer Lower Price?</label>
                    <button 
                      onClick={() => setIsHaggling(!isHaggling)}
                      className={`w-12 h-6 rounded-full relative transition-all ${isHaggling ? 'bg-emerald-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isHaggling ? 'right-1' : 'left-1'}`}></div>
                    </button>
                 </div>

                 {isHaggling && (
                   <div className="pt-4 space-y-3 animate-slide-up">
                      <input 
                        type="number"
                        value={haggledPrice}
                        onChange={(e) => setHaggledPrice(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-800 p-4 rounded-2xl text-xl font-black italic border-none outline-none text-emerald-600"
                        placeholder="My Offer..."
                      />
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center">Lowest offers may be rejected by partners.</p>
                   </div>
                 )}
              </div>

              <textarea value={missionDesc} onChange={(e) => setMissionDesc(e.target.value)} placeholder="Mission Details..." className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-[24px] p-5 text-sm font-black h-32 focus:ring-2 ring-emerald-600 outline-none" />
              
              <button onClick={() => handleLaunchMission()} className="w-full py-5 bg-emerald-600 text-white font-black rounded-[24px] text-[10px] uppercase shadow-2xl italic tracking-widest">
                {isHaggling ? 'Launch with Offer' : 'Launch Protocol'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-6 animate-fade-in pb-10">
             {activeBookings.length === 0 && <div className="py-20 text-center opacity-20 italic">No Missions in Progress</div>}
             {activeBookings.map(b => (
                <div key={b.id} className={`bg-white dark:bg-slate-900 rounded-[40px] border overflow-hidden shadow-xl p-6 space-y-4 ${b.status === BookingStatus.NEGOTIATING ? 'border-amber-500/30' : 'border-slate-100 dark:border-white/5'}`}>
                   <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xl font-black italic">{b.id}</h4>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full mt-2 inline-block ${b.status === BookingStatus.NEGOTIATING ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-600/10 text-emerald-600'}`}>
                          {b.status}
                        </span>
                      </div>
                      <div className="text-right">
                         <p className="text-lg font-black italic text-emerald-600">ZMW {b.negotiatedPrice || b.price}</p>
                         {b.negotiatedPrice && <p className="text-[8px] font-bold text-slate-400 uppercase italic line-through">ZMW {b.price}</p>}
                      </div>
                   </div>

                   {b.status === BookingStatus.NEGOTIATING && b.lastOfferBy === Role.PROVIDER && (
                     <div className="bg-amber-500/5 p-4 rounded-3xl border border-amber-500/20 space-y-3">
                        <p className="text-[9px] font-black text-amber-600 uppercase italic tracking-widest">Counter-Offer Received!</p>
                        <div className="flex gap-2">
                           <button onClick={() => onAcceptNegotiation(b.id)} className="flex-1 py-3 bg-amber-500 text-white text-[9px] font-black uppercase rounded-xl italic">Accept ZMW {b.negotiatedPrice}</button>
                           <button onClick={() => onCancelBooking(b.id)} className="flex-1 py-3 bg-white/5 text-red-500 border border-red-500/20 text-[9px] font-black uppercase rounded-xl italic">Reject</button>
                        </div>
                     </div>
                   )}

                   <p className="text-[11px] text-slate-500 italic leading-relaxed">"{b.description}"</p>
                   <button onClick={() => onCancelBooking(b.id)} className="w-full py-3 bg-red-600/5 text-red-600 border border-red-600/20 rounded-2xl text-[9px] font-black uppercase italic tracking-widest">Cancel Mission</button>
                </div>
             ))}
          </div>
        )}
      </div>

      <nav className="absolute bottom-6 left-6 right-6 h-20 glass-nav rounded-[32px] border border-white/10 flex justify-around items-center px-4 shadow-2xl z-50">
        <button onClick={() => setActiveTab('home')} className={`flex-1 flex flex-col items-center ${activeTab === 'home' ? 'text-emerald-600' : 'text-slate-400'}`}><i className="fa-solid fa-house"></i></button>
        <button onClick={() => setActiveTab('active')} className={`flex-1 flex flex-col items-center ${activeTab === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}><i className="fa-solid fa-route"></i></button>
        <button onClick={() => setActiveTab('account')} className={`flex-1 flex flex-col items-center ${activeTab === 'account' ? 'text-emerald-600' : 'text-slate-400'}`}><i className="fa-solid fa-user"></i></button>
      </nav>
    </div>
  );
};

export default CustomerDashboard;
