
import React, { useState, useMemo } from 'react';
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
  user, logout, bookings, allUsers = [], onAddBooking, location, onSOS, onDeposit, onBecomeProvider, onToggleViewMode, onSaveNode, onSendFeedback, t, onToggleTheme, isDarkMode, onLanguageChange 
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'active' | 'account'>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [missionDesc, setMissionDesc] = useState('');
  const [mapCenter, setMapCenter] = useState<Location>(location);
  
  // Shopping list builder
  const [shoppingItems, setShoppingItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');

  // Discover nearby service nodes
  const nearbyMarkers = useMemo(() => {
    return allUsers
      .filter(u => u.id !== user.id && u.location && u.isActive)
      .map(u => {
        let color = '#94a3b8'; // Default slate
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
          // Consider "live" if active in last 10 mins
          isLive: u.lastActive > Date.now() - 600000 
        };
      });
  }, [allUsers, user.id]);

  const availableLodges = useMemo(() => 
    allUsers.filter(u => u.role === Role.LODGE && (u.availableRooms || 0) > 0),
  [allUsers]);

  const activeBookings = useMemo(() => bookings.filter(b => b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CANCELLED), [bookings]);

  const handleAddItem = () => {
    if (newItem.trim()) {
      setShoppingItems([...shoppingItems, newItem.trim()]);
      setNewItem('');
    }
  };

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
      location: location,
      providerId: targetLodgeId,
      isShoppingOrder: selectedCategory.id === 'shop_for_me',
      shoppingItems: finalItems
    });
    
    setSelectedCategory(null);
    setMissionDesc('');
    setShoppingItems([]);
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
             <button onClick={() => setShowFeedbackModal(true)} className="text-[7px] font-black text-emerald-600 uppercase italic">Rate Experience</button>
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
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest italic animate-pulse">Live Corridor Signal</span>
                <p className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">{nearbyMarkers.length} Active Nodes Nearby</p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[35px] border border-white/5 overflow-hidden shadow-2xl relative">
               <Map 
                  center={mapCenter} 
                  onSaveNode={onSaveNode} 
                  markers={[
                    { loc: location, color: '#059669', label: 'My Terminal', isLive: true },
                    ...nearbyMarkers
                  ]} 
               />
               <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                  <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    <span className="text-[7px] font-black text-white uppercase italic">Lodges</span>
                  </div>
                  <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span className="text-[7px] font-black text-white uppercase italic">Shops</span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat)} className="bg-white dark:bg-slate-900 p-6 rounded-[35px] border border-slate-100 dark:border-white/5 flex flex-col items-start justify-between min-h-[170px] shadow-sm group hover:border-emerald-500/50 transition-all">
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
            <div className="w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-[45px] p-8 shadow-2xl animate-zoom-in overflow-hidden flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black italic uppercase text-slate-900 dark:text-white leading-none">{selectedCategory.name}</h3>
                  <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest mt-2">{selectedCategory.hint}</p>
                </div>
                <button onClick={() => setSelectedCategory(null)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400"><i className="fa-solid fa-xmark"></i></button>
              </div>

              {selectedCategory.id === 'shop_for_me' && (
                <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar mb-6">
                   <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/10">
                      <p className="text-[10px] font-black text-slate-500 uppercase italic mb-3">Shopping List Builder</p>
                      <div className="flex gap-2 mb-4">
                        <input 
                          value={newItem} 
                          onChange={(e) => setNewItem(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                          placeholder="Add item..." 
                          className="flex-1 bg-white dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-xs outline-none" 
                        />
                        <button onClick={handleAddItem} className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center"><i className="fa-solid fa-plus"></i></button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {shoppingItems.map((item, idx) => (
                          <div key={idx} className="bg-emerald-600/10 text-emerald-600 border border-emerald-600/20 px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-2">
                            {item}
                            <button onClick={() => setShoppingItems(shoppingItems.filter((_, i) => i !== idx))}><i className="fa-solid fa-xmark"></i></button>
                          </div>
                        ))}
                      </div>
                   </div>
                   <textarea value={missionDesc} onChange={(e) => setMissionDesc(e.target.value)} placeholder="Specific instructions for the trusted agent..." className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-[24px] p-5 text-sm font-black text-slate-900 dark:text-white h-24 focus:border-emerald-600 outline-none" />
                   <button 
                    disabled={shoppingItems.length === 0}
                    onClick={() => handleLaunchMission()} 
                    className="w-full py-5 bg-emerald-600 text-white font-black rounded-[24px] text-[10px] uppercase shadow-2xl italic tracking-widest disabled:opacity-40"
                   >
                     Launch Trusted Mission
                   </button>
                </div>
              )}

              {selectedCategory.id === 'lodging' && (
                <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar mb-6">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic ml-2 mb-4">Available Vacancies</p>
                  {availableLodges.map(lodge => (
                      <button 
                        key={lodge.id} 
                        onClick={() => handleLaunchMission(lodge.id)}
                        className="w-full bg-slate-50 dark:bg-white/5 p-5 rounded-[28px] border border-slate-100 dark:border-white/5 flex items-center justify-between group active:scale-95 transition-all"
                      >
                         <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-600 flex items-center justify-center text-xl">
                             <i className="fa-solid fa-bed"></i>
                           </div>
                           <div className="text-left">
                             <p className="text-xs font-black uppercase text-slate-900 dark:text-white italic leading-none">{lodge.name}</p>
                             <p className="text-[8px] font-black uppercase text-purple-600 mt-2 tracking-widest">{lodge.availableRooms} Rooms Open</p>
                           </div>
                         </div>
                         <i className="fa-solid fa-chevron-right text-slate-300 group-hover:text-purple-600"></i>
                      </button>
                  ))}
                </div>
              )}

              {selectedCategory.id !== 'shop_for_me' && selectedCategory.id !== 'lodging' && (
                <div className="space-y-6">
                  <textarea value={missionDesc} onChange={(e) => setMissionDesc(e.target.value)} placeholder="Mission Directives..." className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-[24px] p-5 text-sm font-black text-slate-900 dark:text-white h-32 focus:border-emerald-600 outline-none" />
                  <button onClick={() => handleLaunchMission()} className="w-full py-5 bg-emerald-600 text-white font-black rounded-[24px] text-[10px] uppercase shadow-2xl italic tracking-widest">Launch Protocol</button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-6 animate-fade-in">
             {activeBookings.length === 0 && <div className="py-20 text-center opacity-20"><p className="text-[10px] font-black uppercase tracking-[0.4em]">No Active Gigs</p></div>}
             {activeBookings.map(b => (
                <div key={b.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-xl p-6">
                   <div className="flex justify-between items-start mb-4">
                      <h4 className="text-xl font-black text-secondary dark:text-white italic">{b.id}</h4>
                      <span className="text-[8px] font-black bg-emerald-600/10 text-emerald-600 px-3 py-1 rounded-full uppercase italic">{b.status}</span>
                   </div>
                   <p className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed">{b.description}</p>
                   {b.isShoppingOrder && b.shoppingItems && (
                     <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-2">
                       {b.shoppingItems.map(item => (
                         <span key={item.id} className="bg-slate-100 dark:bg-white/5 text-slate-500 text-[9px] px-3 py-1 rounded-full font-bold">
                           <i className="fa-solid fa-check mr-2 opacity-30"></i>{item.name}
                         </span>
                       ))}
                     </div>
                   )}
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
