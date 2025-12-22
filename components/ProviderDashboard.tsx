
import React, { useState, useMemo, useRef } from 'react';
import { User, Booking, BookingStatus, Role, Location } from '../types';
import { PAYMENT_NUMBERS, SUBSCRIPTION_PLANS, LANGUAGES, CATEGORIES, PLATFORM_COMMISSION_RATE } from '../constants';
import Map from './Map';
import NewsTicker from './NewsTicker';

interface ProviderDashboardProps {
  user: User;
  logout: () => void;
  bookings: Booking[];
  allUsers: User[];
  incomingJob?: Booking | null; // New prop for ringing
  onUpdateStatus: (id: string, status: BookingStatus, providerId: string) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onAcceptNegotiation: (id: string) => void;
  onCounterNegotiation: (id: string, price: number) => void;
  onRejectNegotiation: (id: string) => void;
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
  user, logout, bookings, allUsers, incomingJob, onUpdateStatus, onAcceptNegotiation, onCounterNegotiation, onRejectNegotiation, onConfirmCompletion, onToggleViewMode, location, onToggleTheme, isDarkMode, onLanguageChange, t, onUpdateUser, onUpdateSubscription 
}) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'active' | 'account'>('leads');
  const [counterInput, setCounterInput] = useState<{ [key: string]: number }>({});
  
  const isOnline = user.isOnline !== false; 
  const isAuthorized = user.isVerified;
  const isSubscribed = useMemo(() => user.subscriptionExpiry ? user.subscriptionExpiry > Date.now() : false, [user.subscriptionExpiry]);

  const pendingLeads = useMemo(() => {
    if (!isOnline || !isAuthorized || !isSubscribed) return [];
    return bookings.filter(b => {
      // 1. Check basic status
      const isOpen = b.status === BookingStatus.PENDING;
      // Also show negotiations that are locked to me OR are open (no provider assigned yet)
      const isNegotiating = b.status === BookingStatus.NEGOTIATING;
      const isRelevantNegotiation = isNegotiating && (b.providerId === user.id || !b.providerId);
      
      if (!isOpen && !isRelevantNegotiation) return false;

      // 2. Check Service Category Match
      if (user.serviceCategories && user.serviceCategories.length > 0) {
        if (!user.serviceCategories.includes(b.category)) {
          return false; 
        }
      }

      // 3. Check Trust Threshold
      const category = CATEGORIES.find(c => c.id === b.category);
      if (category && category.trustThreshold) {
        return user.trustScore >= category.trustThreshold;
      }
      return true;
    });
  }, [bookings, isOnline, isAuthorized, isSubscribed, user.id, user.trustScore, user.serviceCategories]);

  const activeJobs = useMemo(() => bookings.filter(b => b.providerId === user.id && b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.NEGOTIATING), [bookings, user.id]);

  const daysLeft = useMemo(() => {
    if (!user.subscriptionExpiry) return 0;
    const diff = user.subscriptionExpiry - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [user.subscriptionExpiry]);

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
               <div className="flex items-center gap-2 mt-1">
                 {user.isPremium && <span className="bg-amber-500 text-slate-900 text-[6px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter">Trusted</span>}
                 <p className="text-[7px] font-black text-blue-500 uppercase">Trust: {user.trustScore}</p>
                 {user.serviceCategories && user.serviceCategories.length > 0 && (
                    <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest border border-slate-600 px-1.5 rounded-full">{user.serviceCategories[0]}</span>
                 )}
               </div>
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

      {/* Ringing Overlay */}
      {incomingJob && (
        <div className="absolute top-28 left-4 right-4 z-[100] bg-slate-900 border-2 border-emerald-500 rounded-[35px] p-6 shadow-2xl animate-bounce-slight">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center animate-ping">
                 <i className="fa-solid fa-bell text-white"></i>
               </div>
               <div>
                  <h3 className="text-lg font-black text-white italic uppercase leading-none">New Request</h3>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Accept quickly!</p>
               </div>
             </div>
             <span className="text-xl font-black text-white italic">ZMW {incomingJob.negotiatedPrice || incomingJob.price}</span>
           </div>
           <p className="text-xs text-slate-300 italic mb-6 border-l-2 border-emerald-500 pl-3">"{incomingJob.description}"</p>
           <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setCounterInput({})} className="py-3 bg-slate-800 text-slate-400 rounded-2xl font-black text-[10px] uppercase italic">Ignore</button>
              <button 
                onClick={() => {
                   if(incomingJob.negotiatedPrice) onAcceptNegotiation(incomingJob.id);
                   else onUpdateStatus(incomingJob.id, BookingStatus.ACCEPTED, user.id);
                }} 
                className="py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase italic shadow-lg shadow-emerald-600/30"
              >
                Accept Job
              </button>
           </div>
        </div>
      )}

      <NewsTicker />

      {/* Increased padding-bottom to pb-40 to clear nav */}
      <div className="flex-1 overflow-y-auto pb-40 px-5 pt-6 space-y-8 no-scrollbar">
        {activeTab === 'leads' && (
          <div className="space-y-6 animate-fade-in">
            {!isSubscribed && (
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-[35px] text-white shadow-xl">
                 <h3 className="text-lg font-black italic uppercase leading-none">Subscription Required</h3>
                 <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">Access leads in Nakonde corridor</p>
                 <button onClick={() => setActiveTab('account')} className="mt-6 w-full py-3 bg-white text-orange-600 rounded-2xl text-[10px] font-black uppercase italic shadow-lg">Upgrade Now</button>
              </div>
            )}
            {pendingLeads.map(lead => {
              const isLeadHaggling = lead.status === BookingStatus.NEGOTIATING;
              const isMyLock = lead.providerId === user.id;
              const isLeadOpenOffer = isLeadHaggling && !lead.providerId;
              
              const isMyTurn = lead.lastOfferBy === Role.CUSTOMER;
              const grossPrice = lead.negotiatedPrice || lead.price;
              const commission = grossPrice * PLATFORM_COMMISSION_RATE;
              const netPayout = grossPrice - commission;

              return (
                <div key={lead.id} className={`bg-white dark:bg-slate-900 rounded-[40px] border overflow-hidden shadow-xl p-6 space-y-4 ${isLeadHaggling ? 'border-amber-500/30' : 'border-slate-100 dark:border-white/5'}`}>
                   <div className="flex justify-between items-start">
                      <div>
                         <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest italic">{lead.category}</p>
                         <h4 className="text-lg font-black text-slate-900 dark:text-white italic tracking-tighter mt-1">{lead.id}</h4>
                         {isLeadHaggling && (
                           <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase inline-block mt-1 ${isLeadOpenOffer ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                             {isLeadOpenOffer ? 'Open Customer Offer' : 'Active Negotiation'}
                           </span>
                         )}
                      </div>
                      <div className="text-right">
                         <p className={`text-xl font-black italic ${isLeadHaggling ? 'text-amber-600' : 'text-emerald-600'}`}>ZMW {grossPrice}</p>
                         <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mt-1 italic">Net: ZMW {netPayout.toFixed(3)}</span>
                      </div>
                   </div>
                   {lead.recipientName && (
                     <div className="p-3 bg-blue-600/5 rounded-2xl border border-blue-600/10">
                        <p className="text-[7px] font-black text-blue-500 uppercase tracking-widest italic mb-1">Target Contact</p>
                        <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase italic">{lead.recipientName} ({lead.recipientPhone})</p>
                     </div>
                   )}
                   <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 italic">"{lead.description}"</p>
                   
                   {/* Negotiation Controls for Provider */}
                   <div className="space-y-3 pt-2">
                       {/* If it's a fresh lead (PENDING), provider can Accept or Bid */}
                       {!isLeadHaggling && (
                         <div className="flex gap-2">
                            <button onClick={() => onUpdateStatus(lead.id, BookingStatus.ACCEPTED, user.id)} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-[24px] text-[10px] uppercase italic tracking-widest">Accept ZMW {grossPrice}</button>
                            <button onClick={() => setCounterInput({...counterInput, [lead.id]: grossPrice})} className="px-6 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-black rounded-[24px] text-[10px] uppercase italic border border-slate-200 dark:border-white/10">Bid</button>
                         </div>
                       )}

                       {/* Input for bidding/countering (shown if 'Bid' clicked or if already haggling) */}
                       {(counterInput[lead.id] !== undefined || isLeadHaggling) && (
                         <div className="animate-fade-in bg-slate-50 dark:bg-white/5 p-4 rounded-3xl space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[8px] font-black uppercase text-slate-400 italic">Your Offer</label>
                              {/* Only allow dropping negotiation if it's locked to me */}
                              {isLeadHaggling && isMyLock && (
                                <button onClick={() => onRejectNegotiation(lead.id)} className="text-[8px] font-black uppercase text-red-500 italic">Drop Negotiation</button>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <input 
                                type="number" 
                                value={counterInput[lead.id] || grossPrice} 
                                onChange={(e) => setCounterInput({...counterInput, [lead.id]: Number(e.target.value)})}
                                className="w-24 bg-white dark:bg-slate-900 rounded-xl px-3 py-2 text-sm font-black outline-none border-none"
                              />
                              <button 
                                onClick={() => onCounterNegotiation(lead.id, counterInput[lead.id] || grossPrice)} 
                                className="flex-1 bg-amber-500 text-white font-black rounded-xl text-[9px] uppercase italic"
                              >
                                {isLeadHaggling ? 'Send Counter' : 'Send Bid'}
                              </button>
                            </div>
                            {isLeadHaggling && !isMyTurn && <p className="text-[9px] text-center text-slate-400 italic animate-pulse">Waiting for customer response...</p>}
                            {isLeadHaggling && isMyTurn && (
                                <button onClick={() => onAcceptNegotiation(lead.id)} className="w-full py-3 bg-emerald-600 text-white font-black rounded-xl text-[9px] uppercase italic">
                                   Accept Customer Price
                                </button>
                            )}
                         </div>
                       )}
                   </div>
                </div>
              );
            })}
            {isSubscribed && pendingLeads.length === 0 && (
               <div className="py-20 text-center opacity-30">
                  <i className="fa-solid fa-satellite-dish text-2xl mb-2"></i>
                  <p className="text-[10px] font-black uppercase italic">Scanning for {user.serviceCategories?.[0] || 'Jobs'}...</p>
               </div>
            )}
          </div>
        )}

        {activeTab === 'active' && (
           <div className="space-y-6 animate-fade-in">
              {activeJobs.map(job => (
                <div key={job.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-xl p-6 space-y-4">
                   <div className="flex justify-between items-center">
                      <h4 className="text-base font-black italic uppercase">{job.category} • {job.id}</h4>
                      <div className="text-right">
                         <p className="text-xs font-black italic text-emerald-600">Net ZMW {(job.negotiatedPrice || job.price - job.commission).toFixed(2)}</p>
                      </div>
                   </div>
                   <button onClick={() => onConfirmCompletion(job.id)} className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl text-[10px] uppercase italic">Close Mission</button>
                </div>
              ))}
           </div>
        )}

        {activeTab === 'account' && (
           <div className="animate-fade-in space-y-6 pb-20">
             <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 p-8 shadow-xl">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 italic">Terminal Subscription</h3>
                <div className="flex justify-between items-end mb-8">
                   <div>
                      <p className="text-2xl font-black italic text-secondary dark:text-white uppercase">{isSubscribed ? (user.isPremium ? 'Premium Plan' : 'Basic Plan') : 'No Plan Active'}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase mt-2 tracking-widest">{isSubscribed ? `${daysLeft} days remaining` : 'Upgrade to see leads'}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-blue-500 uppercase mb-1">Deduction Rate</p>
                      <p className="text-xs font-black italic">0.24% / Job</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <button 
                    onClick={() => onUpdateSubscription('BASIC')}
                    className={`p-6 rounded-[30px] border-2 text-left transition-all ${!user.isPremium && isSubscribed ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10'}`}
                   >
                      <p className="text-[10px] font-black uppercase italic mb-1">Basic</p>
                      <p className="text-lg font-black italic tracking-tighter">ZMW 10</p>
                   </button>
                   <button 
                    onClick={() => onUpdateSubscription('PREMIUM')}
                    className={`p-6 rounded-[30px] border-2 text-left transition-all ${user.isPremium ? 'bg-amber-500 border-amber-500 text-slate-900' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10'}`}
                   >
                      <p className="text-[10px] font-black uppercase italic mb-1">Premium</p>
                      <p className="text-lg font-black italic tracking-tighter">ZMW 20</p>
                   </button>
                </div>
             </div>

             <div className="p-8 bg-slate-900 rounded-[40px] border border-white/5 space-y-6 shadow-2xl">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Settlement Rails</h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center py-3 border-b border-white/5">
                      <span className="text-[10px] font-black text-white/50 uppercase">MTN</span>
                      <span className="text-[11px] font-black italic">{PAYMENT_NUMBERS.MTN}</span>
                   </div>
                   <div className="flex justify-between items-center py-3 border-b border-white/5">
                      <span className="text-[10px] font-black text-white/50 uppercase">Airtel</span>
                      <span className="text-[11px] font-black italic">{PAYMENT_NUMBERS.Airtel}</span>
                   </div>
                   <div className="flex justify-between items-center py-3 border-b border-white/5">
                      <span className="text-[10px] font-black text-white/50 uppercase">Zamtel</span>
                      <span className="text-[11px] font-black italic">{PAYMENT_NUMBERS.Zamtel}</span>
                   </div>
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
