
import React, { useState, useMemo, useRef } from 'react';
import { User, Booking, BookingStatus, Role, Location } from '../types';
import { PAYMENT_NUMBERS, SUBSCRIPTION_PLANS, LANGUAGES, CATEGORIES } from '../constants';
import Map from './Map';
import NewsTicker from './NewsTicker';

interface ProviderDashboardProps {
  user: User;
  logout: () => void;
  bookings: Booking[];
  allUsers: User[];
  onUpdateStatus: (id: string, status: BookingStatus, providerId: string) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onAcceptNegotiation: (id: string) => void;
  onCounterNegotiation: (id: string, price: number) => void;
  onConfirmCompletion: (id: string) => void;
  onUpdateSubscription: (plan: 'BASIC' | 'PREMIUM') => void;
  onUpdateUser: (updates: Partial<User>) => void;
  location: Location;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  onLanguageChange: (lang: string) => void;
  t: (key: string) => string;
  onToggleViewMode?: () => void;
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ 
  user, logout, bookings, allUsers, onUpdateStatus, onAcceptNegotiation, onCounterNegotiation, onConfirmCompletion, onToggleViewMode, location, onToggleTheme, isDarkMode, onLanguageChange, t, onUpdateUser 
}) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'active' | 'account'>('leads');
  const [counterInput, setCounterInput] = useState<{ [key: string]: number }>({});
  
  const isOnline = user.isOnline !== false; 
  const isAuthorized = user.isVerified;
  const isSubscribed = useMemo(() => user.subscriptionExpiry ? user.subscriptionExpiry > Date.now() : false, [user.subscriptionExpiry]);

  const pendingLeads = useMemo(() => {
    if (!isOnline || !isAuthorized || !isSubscribed) return [];
    return bookings.filter(b => {
      const isOpen = b.status === BookingStatus.PENDING;
      const isNegotiable = b.status === BookingStatus.NEGOTIATING && (!b.providerId || b.providerId === user.id);
      if (!isOpen && !isNegotiable) return false;
      
      const category = CATEGORIES.find(c => c.id === b.category);
      if (category && category.trustThreshold) {
        return user.trustScore >= category.trustThreshold;
      }
      return true;
    });
  }, [bookings, isOnline, isAuthorized, isSubscribed, user.id, user.trustScore]);

  const activeJobs = useMemo(() => bookings.filter(b => b.providerId === user.id && b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.NEGOTIATING), [bookings, user.id]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <header className="px-5 py-5 bg-secondary text-white sticky top-0 z-50 shadow-2xl safe-pt">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="bg-blue-600 w-11 h-11 rounded-[18px] flex items-center justify-center transform rotate-2">
               <i className="fas fa-satellite text-white text-lg"></i>
             </div>
             <div>
               <h2 className="text-xl font-bold italic tracking-tighter uppercase leading-none">Swensi</h2>
               <p className="text-[7px] font-black text-blue-500 uppercase mt-1">Trust Score: {user.trustScore}</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={onToggleViewMode} className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center border border-emerald-600/20"><i className="fa-solid fa-rotate"></i></button>
             <div className="flex flex-col items-end">
                <span className={`text-[8px] font-black uppercase tracking-widest ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>{isOnline ? 'Online' : 'Offline'}</span>
                <button onClick={() => onUpdateUser({ isOnline: !isOnline })} className={`w-10 h-5 rounded-full mt-1 relative transition-all ${isOnline ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isOnline ? 'right-1' : 'left-1'}`}></div>
                </button>
             </div>
          </div>
        </div>
      </header>

      <NewsTicker />

      <div className="flex-1 overflow-y-auto pb-32 px-5 pt-6 space-y-8 no-scrollbar">
        {activeTab === 'leads' && isAuthorized && isOnline && (
          <div className="space-y-6 animate-fade-in">
            {pendingLeads.map(lead => {
              const isLeadHaggling = lead.status === BookingStatus.NEGOTIATING;
              const isMyTurn = lead.lastOfferBy === Role.CUSTOMER;

              return (
                <div key={lead.id} className={`bg-white dark:bg-slate-900 rounded-[40px] border overflow-hidden shadow-xl p-6 space-y-4 ${isLeadHaggling ? 'border-amber-500/30' : 'border-slate-100 dark:border-white/5'}`}>
                   <div className="flex justify-between items-start">
                      <div>
                         <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest italic">{lead.category}</p>
                         <h4 className="text-lg font-black text-slate-900 dark:text-white italic tracking-tighter mt-1">{lead.id}</h4>
                      </div>
                      <div className="text-right">
                         <p className={`text-xl font-black italic ${isLeadHaggling ? 'text-amber-600' : 'text-emerald-600'}`}>ZMW {lead.negotiatedPrice || lead.price}</p>
                         {lead.recipientName && <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest italic leading-none block mt-1">Guest Order</span>}
                      </div>
                   </div>

                   {lead.recipientName && (
                     <div className="p-3 bg-blue-600/5 rounded-2xl border border-blue-600/10">
                        <p className="text-[7px] font-black text-blue-500 uppercase tracking-widest italic mb-1">Target Contact</p>
                        <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase italic">{lead.recipientName} ({lead.recipientPhone})</p>
                     </div>
                   )}

                   <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 italic">"{lead.description}"</p>

                   {isLeadHaggling && isMyTurn ? (
                     <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                           <button onClick={() => onAcceptNegotiation(lead.id)} className="py-4 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-2xl italic tracking-widest">Accept Price</button>
                           <button onClick={() => setCounterInput({...counterInput, [lead.id]: lead.negotiatedPrice || lead.price})} className="py-4 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-black uppercase rounded-2xl italic tracking-widest">Counter Offer</button>
                        </div>
                        {counterInput[lead.id] !== undefined && (
                          <div className="flex gap-2 animate-slide-up">
                             <input 
                               type="number"
                               value={counterInput[lead.id]}
                               onChange={(e) => setCounterInput({...counterInput, [lead.id]: Number(e.target.value)})}
                               className="flex-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-black italic border-none outline-none"
                             />
                             <button onClick={() => onCounterNegotiation(lead.id, counterInput[lead.id])} className="px-6 bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase italic">Send</button>
                          </div>
                        )}
                     </div>
                   ) : isLeadHaggling && !isMyTurn ? (
                     <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase italic animate-pulse">Waiting for Response...</p>
                     </div>
                   ) : (
                     <button onClick={() => onUpdateStatus(lead.id, BookingStatus.ACCEPTED, user.id)} className="w-full bg-blue-600 text-white font-black py-5 rounded-[24px] text-[10px] uppercase italic tracking-widest">Accept Mission</button>
                   )}
                </div>
              );
            })}
            {pendingLeads.length === 0 && <div className="py-20 text-center opacity-30 italic text-[10px] uppercase tracking-[0.3em]">No Leads Nearby</div>}
          </div>
        )}

        {activeTab === 'active' && (
           <div className="space-y-6 animate-fade-in">
              {activeJobs.map(job => (
                <div key={job.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-xl p-6 space-y-4">
                   <div className="flex justify-between items-center">
                      <h4 className="text-base font-black italic uppercase">{job.category} • {job.id}</h4>
                      <span className="text-[8px] font-black bg-blue-600/10 text-blue-600 px-3 py-1 rounded-full uppercase italic">{job.status}</span>
                   </div>

                   {job.recipientName && (
                     <div className="p-4 bg-blue-600/5 rounded-3xl border border-blue-600/10 flex justify-between items-center">
                        <div>
                           <p className="text-[7px] font-black text-blue-500 uppercase italic mb-1 tracking-widest">Mission Recipient</p>
                           <p className="text-xs font-black text-slate-900 dark:text-white uppercase italic">{job.recipientName}</p>
                           <p className="text-[9px] font-bold text-slate-500">{job.recipientPhone}</p>
                        </div>
                        <a href={`tel:${job.recipientPhone}`} className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
                           <i className="fa-solid fa-phone-flip text-xs"></i>
                        </a>
                     </div>
                   )}

                   <button onClick={() => onConfirmCompletion(job.id)} className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl text-[10px] uppercase italic">Close Mission</button>
                </div>
              ))}
              {activeJobs.length === 0 && <div className="py-20 text-center opacity-30 italic text-[10px] uppercase tracking-[0.4em]">No Live Ops</div>}
           </div>
        )}

        {activeTab === 'account' && (
           <div className="animate-fade-in space-y-6">
             <div className="p-6 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl italic uppercase">{user.name.charAt(0)}</div>
                <div>
                   <h4 className="text-lg font-black uppercase italic">{user.name}</h4>
                   <p className="text-[9px] font-bold text-slate-400 uppercase italic">{user.phone}</p>
                </div>
             </div>
             <button onClick={logout} className="w-full py-4 bg-red-600/5 text-red-600 rounded-2xl text-[9px] font-black uppercase italic border border-red-600/10">Terminate Session</button>
           </div>
        )}
      </div>

      <nav className="absolute bottom-6 left-6 right-6 h-20 glass-nav rounded-[32px] border border-white/10 flex justify-around items-center px-4 shadow-2xl z-50">
        <button onClick={() => setActiveTab('leads')} className={`flex-1 flex flex-col items-center transition-all ${activeTab === 'leads' ? 'text-blue-500 scale-110' : 'text-slate-400'}`}><i className="fa-solid fa-satellite text-lg"></i><span className="text-[7px] font-black uppercase mt-1">Leads</span></button>
        <button onClick={() => setActiveTab('active')} className={`flex-1 flex flex-col items-center transition-all ${activeTab === 'active' ? 'text-blue-500 scale-110' : 'text-slate-400'}`}><i className="fa-solid fa-route text-lg"></i><span className="text-[7px] font-black uppercase mt-1">Gigs</span></button>
        <button onClick={() => setActiveTab('account')} className={`flex-1 flex flex-col items-center transition-all ${activeTab === 'account' ? 'text-blue-500 scale-110' : 'text-slate-400'}`}><i className="fa-solid fa-fingerprint text-lg"></i><span className="text-[7px] font-black uppercase mt-1">Node</span></button>
      </nav>
    </div>
  );
};

export default ProviderDashboard;
