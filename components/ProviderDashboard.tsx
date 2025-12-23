
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Booking, BookingStatus, Role, Location } from '../types';
import { PAYMENT_NUMBERS, SUBSCRIPTION_PLANS, LANGUAGES, CATEGORIES, PLATFORM_COMMISSION_RATE, VERIFIED_ADMINS } from '../constants';
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
  
  // Timer state for incoming job
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (incomingJob) {
      setTimeLeft(30);
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [incomingJob]);

  const isOnline = user.isOnline !== false; 
  const isAuthorized = user.isVerified;
  
  const isSubscribed = useMemo(() => {
    // Free access for admins
    if (VERIFIED_ADMINS.includes(user.phone)) return true;
    return user.subscriptionExpiry ? user.subscriptionExpiry > Date.now() : false;
  }, [user.subscriptionExpiry, user.phone]);

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
        if (user.trustScore < category.trustThreshold) return false;
      }
      return true;
    });
  }, [bookings, isOnline, isAuthorized, isSubscribed, user.id, user.trustScore, user.serviceCategories]);

  const activeJobs = useMemo(() => bookings.filter(b => b.providerId === user.id && b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.NEGOTIATING && b.status !== BookingStatus.CANCELLED), [bookings, user.id]);

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

      {/* Ringing Overlay - Full Screen "Call" Style */}
      {incomingJob && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center animate-zoom-in">
           {/* Pulsing Background Effects */}
           <div className="absolute inset-0 bg-emerald-600/10 animate-pulse pointer-events-none"></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>

           <div className="relative z-10 w-full max-w-sm px-6 text-center space-y-8">
               <div className="space-y-2">
                 <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <span className="absolute inset-0 rounded-full border-4 border-emerald-500 animate-ping opacity-20"></span>
                    <span className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-40 delay-75"></span>
                    <i className="fa-solid fa-bell text-4xl text-white animate-bounce-slight"></i>
                 </div>
                 <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">New Request</h2>
                 <p className="text-sm text-emerald-400 font-bold uppercase tracking-widest">{incomingJob.category} Service</p>
               </div>

               <div className="bg-white/10 rounded-[32px] p-6 backdrop-blur-md border border-white/5">
                 <p className="text-4xl font-black text-white italic mb-2">ZMW {incomingJob.negotiatedPrice || incomingJob.price}</p>
                 <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-emerald-500 transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / 30) * 100}%` }}></div>
                 </div>
                 <p className="text-xs text-slate-300 italic">"{incomingJob.description}"</p>
               </div>

               <div className="grid grid-cols-2 gap-4 pt-4">
                  <button onClick={() => setCounterInput({})} className="flex flex-col items-center gap-2 group">
                     <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500 text-red-500 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                        <i className="fa-solid fa-xmark text-2xl"></i>
                     </div>
                     <span className="text-[10px] font-black uppercase text-slate-400">Ignore</span>
                  </button>
                  <button 
                    onClick={() => {
                       if(incomingJob.negotiatedPrice) onAcceptNegotiation(incomingJob.id);
                       else onUpdateStatus(incomingJob.id, BookingStatus.ACCEPTED, user.id);
                    }} 
                    className="flex flex-col items-center gap-2 group"
                  >
                     <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-pulse group-hover:scale-110 transition-all">
                        <i className="fa-solid fa-check text-2xl"></i>
                     </div>
                     <span className="text-[10px] font-black uppercase text-white">Accept ({timeLeft}s)</span>
                  </button>
               </div>
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
            
            <div className="flex items-center justify-between px-2">
               <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                     Pending Gigs <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full align-top ml-1">{pendingLeads.length}</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Based on your Category & Trust Score</p>
               </div>
               <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                  <i className="fa-solid fa-filter"></i>
               </div>
            </div>

            {/* Leads Grid - Visually Distinct "Ticket" Style for Pending */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingLeads.map(lead => {
                  const isLeadHaggling = lead.status === BookingStatus.NEGOTIATING;
                  const isMyLock = lead.providerId === user.id;
                  const isDirectRequest = isMyLock && isLeadHaggling; // Specific to me
                  const isLeadOpenOffer = isLeadHaggling && !lead.providerId;
                  
                  const isMyTurn = lead.lastOfferBy === Role.CUSTOMER;
                  const grossPrice = lead.negotiatedPrice || lead.price;
                  const commission = grossPrice * PLATFORM_COMMISSION_RATE;
                  const netPayout = grossPrice - commission;

                  return (
                    <div key={lead.id} className={`relative rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all ${isDirectRequest ? 'bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-500' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10'}`}>
                      {/* Ticket Stub Design - Left Border */}
                      <div className={`absolute top-0 bottom-0 left-0 w-2 ${isDirectRequest ? 'bg-amber-500' : 'bg-blue-600'}`}></div>
                      
                      <div className="p-6 pl-8 space-y-4">
                          <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                   <span className={`text-[8px] font-black uppercase tracking-widest italic px-2 py-0.5 rounded-md ${isDirectRequest ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`}>
                                      {isDirectRequest ? 'Direct Request' : lead.category}
                                   </span>
                                   {isLeadHaggling && (
                                     <span className="text-[8px] font-black text-amber-600 uppercase animate-pulse">Negotiating</span>
                                   )}
                                </div>
                                <h4 className="text-base font-black text-slate-900 dark:text-white italic tracking-tighter mt-1">{lead.id}</h4>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-black italic text-slate-900 dark:text-white">ZMW {grossPrice}</p>
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mt-1 italic">Net: ZMW {netPayout.toFixed(2)}</span>
                              </div>
                          </div>

                          {lead.recipientName && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                                <p className="text-[7px] font-black text-blue-500 uppercase tracking-widest italic mb-1">Target Contact</p>
                                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase italic">{lead.recipientName} ({lead.recipientPhone})</p>
                            </div>
                          )}
                          
                          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 italic line-clamp-2">"{lead.description}"</p>
                          
                          {/* Negotiation Controls for Provider */}
                          <div className="space-y-3 pt-2">
                              {/* If it's a fresh lead (PENDING), provider can Accept or Bid */}
                              {!isLeadHaggling && (
                                <div className="flex gap-2">
                                    <button onClick={() => onUpdateStatus(lead.id, BookingStatus.ACCEPTED, user.id)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl text-[10px] uppercase italic tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Accept ZMW {grossPrice}</button>
                                    <button onClick={() => setCounterInput({...counterInput, [lead.id]: grossPrice})} className="px-5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-black rounded-xl text-[10px] uppercase italic border border-slate-200 dark:border-white/10">Bid</button>
                                </div>
                              )}

                              {/* Input for bidding/countering (shown if 'Bid' clicked or if already haggling) */}
                              {(counterInput[lead.id] !== undefined || isLeadHaggling) && (
                                <div className="animate-fade-in bg-slate-50 dark:bg-white/5 p-4 rounded-3xl space-y-3 border border-slate-100 dark:border-white/5">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[8px] font-black uppercase text-slate-400 italic">Your Offer</label>
                                      {/* Only allow dropping negotiation if it's locked to me */}
                                      {isLeadHaggling && isMyLock && (
                                        <button onClick={() => onRejectNegotiation(lead.id)} className="text-[8px] font-black uppercase text-red-500 italic hover:underline">Drop</button>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      <input 
                                        type="number" 
                                        value={counterInput[lead.id] || grossPrice} 
                                        onChange={(e) => setCounterInput({...counterInput, [lead.id]: Number(e.target.value)})}
                                        className="w-20 bg-white dark:bg-slate-900 rounded-xl px-3 py-2 text-sm font-black outline-none border border-slate-200 dark:border-white/10 focus:border-blue-500"
                                      />
                                      <button 
                                        onClick={() => onCounterNegotiation(lead.id, counterInput[lead.id] || grossPrice)} 
                                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-white font-black rounded-xl text-[9px] uppercase italic shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                                      >
                                        {isLeadHaggling ? 'Counter' : 'Send Bid'}
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
                    </div>
                  );
                })}
            </div>

            {isSubscribed && pendingLeads.length === 0 && (
               <div className="py-20 text-center opacity-30 flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                     <i className="fa-solid fa-satellite-dish text-2xl text-slate-400"></i>
                  </div>
                  <p className="text-[10px] font-black uppercase italic tracking-widest">Scanning for {user.serviceCategories?.[0] || 'Jobs'}...</p>
               </div>
            )}
          </div>
        )}

        {activeTab === 'active' && (
           <div className="space-y-6 animate-fade-in">
              <div className="px-2">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                     Active Ops <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full align-top ml-1">{activeJobs.length}</span>
                  </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeJobs.map(job => (
                    <div key={job.id} className="bg-white dark:bg-slate-900 rounded-[35px] border-2 border-emerald-500/20 overflow-hidden shadow-xl p-6 space-y-5 relative">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <i className="fa-solid fa-person-running text-6xl text-emerald-500"></i>
                      </div>
                      
                      <div className="flex justify-between items-center relative z-10">
                          <h4 className="text-base font-black italic uppercase text-slate-900 dark:text-white">{job.category} • {job.id}</h4>
                          <div className="text-right">
                            <p className="text-xs font-black italic text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">Net ZMW {(job.negotiatedPrice || job.price - job.commission).toFixed(2)}</p>
                          </div>
                      </div>
                      
                      <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 relative z-10">
                         <p className="text-xs italic text-slate-600 dark:text-slate-300">"{job.description}"</p>
                      </div>

                      <button onClick={() => onConfirmCompletion(job.id)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl text-[10px] uppercase italic shadow-lg shadow-emerald-600/30 active:scale-95 transition-all relative z-10">Close Mission</button>
                    </div>
                  ))}
                  {activeJobs.length === 0 && (
                    <div className="col-span-full py-10 text-center opacity-40">
                       <p className="text-[10px] font-black uppercase italic">No active missions running</p>
                    </div>
                  )}
              </div>
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

      <nav className="fixed bottom-6 left-6 right-6 h-20 glass-nav rounded-[32px] border border-white/10 flex justify-around items-center px-4 shadow-2xl z-50">
        <button onClick={() => setActiveTab('leads')} className={`flex-1 flex flex-col items-center transition-all ${activeTab === 'leads' ? 'text-blue-500 scale-110' : 'text-slate-400'}`}><i className="fa-solid fa-ticket text-lg"></i><span className="text-[7px] font-black uppercase mt-1">Pending</span></button>
        <button onClick={() => setActiveTab('active')} className={`flex-1 flex flex-col items-center transition-all ${activeTab === 'active' ? 'text-emerald-500 scale-110' : 'text-slate-400'}`}><i className="fa-solid fa-person-running text-lg"></i><span className="text-[7px] font-black uppercase mt-1">Active</span></button>
        <button onClick={() => setActiveTab('account')} className={`flex-1 flex flex-col items-center transition-all ${activeTab === 'account' ? 'text-blue-500 scale-110' : 'text-slate-400'}`}><i className="fa-solid fa-fingerprint text-lg"></i><span className="text-[7px] font-black uppercase mt-1">Node</span></button>
      </nav>
    </div>
  );
};

export default ProviderDashboard;
