
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
  const [showKycForm, setShowKycForm] = useState(false);
  
  // KYC State
  const [kycLicense, setKycLicense] = useState('');
  const [kycAddress, setKycAddress] = useState('');
  const [kycPhoto, setKycPhoto] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleKycSubmit = () => {
    if (!kycLicense || !kycAddress) return alert("All fields are required for verification.");
    onBecomeProvider({ license: kycLicense, address: kycAddress, photo: kycPhoto });
    setShowKycForm(false);
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

        {activeTab === 'account' && (
          <div className="animate-fade-in space-y-8">
             <div className="flex items-center gap-6 p-6 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-xl">
                <div className="w-20 h-20 rounded-[30px] bg-slate-100 dark:bg-white/5 overflow-hidden border-2 border-emerald-600/20">
                   {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-black">{user.name.charAt(0)}</div>}
                </div>
                <div>
                   <h3 className="text-xl font-black text-secondary dark:text-white italic uppercase">{user.name}</h3>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{user.phone}</p>
                   <span className="inline-block mt-3 px-3 py-1 bg-emerald-600/10 text-emerald-600 text-[8px] font-black uppercase rounded-full italic">{user.role}</span>
                </div>
             </div>

             {/* Partner Enrollment */}
             {user.role === Role.CUSTOMER && (
               <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-3">Become a Partner</h4>
                    <p className="text-[11px] text-blue-100 font-medium mb-6 leading-relaxed">Monetize your trade skills or vehicle in the Nakonde Corridor. Join our network of verified agents.</p>
                    <button onClick={() => setShowKycForm(true)} className="px-8 py-4 bg-white text-blue-700 text-[10px] font-black uppercase rounded-2xl italic tracking-widest shadow-xl">Apply Now</button>
                  </div>
                  <i className="fa-solid fa-briefcase absolute -bottom-6 -right-6 text-9xl text-white/5 transform rotate-12"></i>
               </div>
             )}

             {showKycForm && (
                <div className="fixed inset-0 z-[2000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6">
                  <div className="w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-[45px] p-8 shadow-2xl animate-zoom-in space-y-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-black italic uppercase">Partner Enrollment</h3>
                      <button onClick={() => setShowKycForm(false)} className="text-slate-400"><i className="fa-solid fa-xmark"></i></button>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-600 uppercase italic">ID / License Number</label>
                        <input value={kycLicense} onChange={e => setKycLicense(e.target.value)} placeholder="NRC or Trade License #" className="w-full bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border-none outline-none text-xs font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-600 uppercase italic">Base Operations Address</label>
                        <input value={kycAddress} onChange={e => setKycAddress(e.target.value)} placeholder="e.g. Area 12, Nakonde" className="w-full bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border-none outline-none text-xs font-bold" />
                      </div>
                      <button onClick={handleKycSubmit} className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl text-[10px] uppercase italic tracking-widest shadow-xl">Submit for Verification</button>
                    </div>
                  </div>
                </div>
             )}
          </div>
        )}

        {/* ... existing logic for active bookings ... */}
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
