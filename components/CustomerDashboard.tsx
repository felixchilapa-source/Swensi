
import React, { useState, useMemo } from 'react';
import { User, Booking, Location, BookingStatus, Role, CouncilOrder, SavedNode, Feedback } from '../types';
import { CATEGORIES, Category, PAYMENT_NUMBERS, LANGUAGES } from '../constants';
import Map from './Map';
import NewsTicker from './NewsTicker';
import AIAssistant from './AIAssistant';

interface CustomerDashboardProps {
  user: User;
  logout: () => void;
  bookings: Booking[];
  councilOrders: CouncilOrder[];
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
  user, logout, bookings, onAddBooking, location, onSOS, onDeposit, onBecomeProvider, onToggleViewMode, onSaveNode, onSendFeedback, t, onToggleTheme, isDarkMode, onLanguageChange 
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'active' | 'account'>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [missionDesc, setMissionDesc] = useState('');
  const [mapCenter, setMapCenter] = useState<Location>(location);
  const [destinationNode, setDestinationNode] = useState<SavedNode | null>(null);

  const activeBookings = useMemo(() => bookings.filter(b => b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CANCELLED), [bookings]);

  const handleLaunchMission = () => {
    if (!selectedCategory) return;
    onAddBooking({ category: selectedCategory.id, description: missionDesc, price: selectedCategory.basePrice, location: location, destination: destinationNode?.loc });
    setSelectedCategory(null);
    setMissionDesc('');
    setActiveTab('active');
  };

  const handleFeedbackSubmit = () => {
    onSendFeedback({ rating, comment });
    setShowFeedbackModal(false);
    setComment('');
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
            <h1 className="text-3xl font-black text-secondary dark:text-white uppercase italic tracking-tighter">Nakonde Hub</h1>

            <div className="bg-slate-900 rounded-[35px] border border-white/5 overflow-hidden shadow-2xl">
               <Map center={mapCenter} onSaveNode={onSaveNode} markers={[{ loc: location, color: '#059669', label: 'My Node' }]} />
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat)} className="bg-white dark:bg-slate-900 p-6 rounded-[35px] border border-slate-100 dark:border-white/5 flex flex-col items-start justify-between min-h-[170px] shadow-sm group">
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

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
            <div className="w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-[45px] p-10 shadow-2xl animate-zoom-in">
              <h3 className="text-2xl font-black italic uppercase text-slate-900 dark:text-white mb-6">Service Buzz</h3>
              <div className="flex gap-2 justify-center mb-8">
                 {[1,2,3,4,5].map(s => (
                   <button key={s} onClick={() => setRating(s)} className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${rating >= s ? 'text-amber-500 bg-amber-500/10' : 'text-slate-300'}`}>
                     <i className="fa-solid fa-star"></i>
                   </button>
                 ))}
              </div>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell us how we did..." className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-[24px] p-5 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-emerald-600 h-32 mb-6" />
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowFeedbackModal(false)} className="py-5 text-slate-400 font-black text-[10px] uppercase italic">Close</button>
                <button onClick={handleFeedbackSubmit} className="py-5 bg-emerald-600 text-white font-black rounded-[24px] text-[10px] uppercase italic shadow-2xl">Broadcast</button>
              </div>
            </div>
          </div>
        )}

        {/* Mission Launcher Modal */}
        {selectedCategory && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
            <div className="w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-[45px] p-10 animate-zoom-in">
              <h3 className="text-2xl font-black italic uppercase text-slate-900 dark:text-white mb-2">{selectedCategory.name}</h3>
              <textarea value={missionDesc} onChange={(e) => setMissionDesc(e.target.value)} placeholder="Instructions..." className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-[24px] p-5 text-sm font-black text-slate-900 dark:text-white h-32 mt-4" />
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button onClick={() => setSelectedCategory(null)} className="py-5 text-slate-400 font-black text-[10px] uppercase italic">Abort</button>
                <button onClick={handleLaunchMission} className="py-5 bg-emerald-600 text-white font-black rounded-[24px] text-[10px] uppercase shadow-2xl italic">Launch Mission</button>
              </div>
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
