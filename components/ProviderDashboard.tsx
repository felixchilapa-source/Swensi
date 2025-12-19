import React, { useState, useMemo } from 'react';
import { User, Booking, BookingStatus, Role } from '../types';
import { TRUSTED_COMMISSION_BONUS, COLORS } from '../constants';
import Map from './Map';
import NewsTicker from './NewsTicker';

interface ProviderDashboardProps {
  user: User;
  logout: () => void;
  bookings: Booking[];
  allUsers: User[];
  onUpdateStatus: (id: string, status: BookingStatus, providerId: string) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onConfirmCompletion: (id: string) => void;
  onUpdateSubscription: (plan: 'BASIC' | 'PREMIUM') => void;
  location: any;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  onLanguageChange: (lang: string) => void;
  t: (key: string) => string;
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ user, logout, bookings, allUsers, onUpdateStatus, onUpdateBooking }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'market' | 'active' | 'account'>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const isTrusted = user.trustScore >= 95;

  // Shopping Eligibility Logic: Premium, >= 4.5 stars, > 1 year membership
  const isEligibleForShopping = useMemo(() => {
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    const isMemberForAYear = (Date.now() - user.memberSince) >= oneYearInMs;
    const hasMinRating = user.rating >= 4.5;
    return !!(user.isPremium && hasMinRating && isMemberForAYear);
  }, [user.isPremium, user.rating, user.memberSince]);
  
  const pendingLeads = useMemo(() => bookings.filter(b => {
    if (b.status !== BookingStatus.PENDING) return false;
    
    // Check general trust requirements
    if (b.isTrustedTransportOnly && !isTrusted) return false;

    // Check shopping eligibility for errands/shopping category
    if (b.category === 'errands' && !isEligibleForShopping) return false;

    return true;
  }), [bookings, isTrusted, isEligibleForShopping]);

  const activeJobs = useMemo(() => bookings.filter(b => b.providerId === user.id && b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CANCELLED), [bookings, user.id]);
  const hospitalityEarnings = (user.hospitalityCashflow || 0) * TRUSTED_COMMISSION_BONUS;

  // Job Market Search Logic: Prioritize Premium, then sort by Rating
  const marketPartners = useMemo(() => {
    return allUsers
      .filter(u => u.role === Role.PROVIDER && u.id !== user.id)
      .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.phone.includes(searchQuery))
      .sort((a, b) => {
        // 1. Prioritize Premium
        if (a.isPremium && !b.isPremium) return -1;
        if (!a.isPremium && b.isPremium) return 1;
        // 2. Sort by Rating
        return (b.rating || 0) - (a.rating || 0);
      });
  }, [allUsers, user.id, searchQuery]);

  const handleProviderCancel = (id: string) => {
    const reason = window.prompt('Specify Termination Reason (e.g., Mechanical Failure, Security Risk):');
    if (reason) {
      onUpdateBooking(id, { status: BookingStatus.CANCELLED, cancellationReason: `Provider terminated: ${reason}` });
    }
  };

  const toggleShoppingItem = (bookingId: string, itemId: string) => {
    const job = activeJobs.find(j => j.id === bookingId);
    if (!job || !job.shoppingItems) return;
    const updatedItems = job.shoppingItems.map(item => item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item);
    onUpdateBooking(bookingId, { shoppingItems: updatedItems });
  };

  const getTrustLabel = (score: number) => {
    if (score >= 98) return { label: 'Elite', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: 'fa-crown' };
    if (score >= 90) return { label: 'Verified', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: 'fa-shield-check' };
    return { label: 'Standard', color: 'text-slate-400', bg: 'bg-slate-400/10', icon: 'fa-user-check' };
  };

  const myTrust = getTrustLabel(user.trustScore);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <header className="px-5 py-5 bg-secondary text-white sticky top-0 z-50 shadow-2xl border-b border-white/5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="bg-blue-600 w-11 h-11 rounded-[18px] shadow-lg shadow-blue-600/20 flex items-center justify-center transform rotate-2">
               <i className="fas fa-satellite text-white text-lg"></i>
             </div>
             <div>
               <h2 className="text-xl font-bold leading-none text-white italic tracking-tighter uppercase leading-none">Swensi</h2>
               <span className="text-[10px] font-bold text-blue-500 tracking-[0.2em] uppercase mt-2 inline-block">Partner Terminal</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <span className={`${myTrust.bg} ${myTrust.color} text-[6px] font-black px-1.5 py-0.5 rounded uppercase border border-current`}>
                    {myTrust.label}
                  </span>
                  <p className="text-[10px] font-black uppercase text-blue-500 italic tracking-tighter">Command Link</p>
                </div>
                <div className="flex items-center gap-1 justify-end">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                   <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Linked</p>
                </div>
             </div>
             <button onClick={logout} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 border border-white/10 hover:text-blue-600 transition-colors">
               <i className="fa-solid fa-power-off text-xs"></i>
             </button>
          </div>
        </div>
      </header>

      <NewsTicker />

      <div className="flex-1 overflow-y-auto pb-32 px-5 pt-6 space-y-8 no-scrollbar">
        {activeTab === 'leads' && (
          <div className="space-y-6 animate-fade-in">
            {isTrusted && (
               <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-slate-950 p-8 rounded-[40px] text-white shadow-2xl shadow-blue-600/30 relative overflow-hidden group">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-100 opacity-80 italic">Trusted Partner Multiplier Active</p>
                  <h4 className="text-4xl font-black italic mt-1 tracking-tighter leading-none">ZMW {hospitalityEarnings.toFixed(2)}</h4>
                  <div className="mt-4 flex items-center gap-2">
                    <i className="fa-solid fa-shield-halved text-amber-500 text-xs"></i>
                    <p className="text-[8px] font-black uppercase text-white/60 tracking-widest italic">Elite Corridor Permissions</p>
                  </div>
                  <i className="fa-solid fa-fingerprint absolute -bottom-6 -right-6 text-[110px] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700"></i>
               </div>
            )}

            {!isEligibleForShopping && (
              <div className="bg-amber-500/10 p-4 rounded-3xl border border-amber-500/20 flex items-center gap-3">
                 <i className="fa-solid fa-circle-info text-amber-600"></i>
                 <p className="text-[9px] font-black uppercase text-amber-700 tracking-widest leading-tight italic">
                   Shopping Lead Eligibility: Premium + 1 Year + 4.5★ Rating required to view retail missions.
                 </p>
              </div>
            )}
            
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] font-black text-secondary dark:text-white uppercase tracking-[0.3em] italic">Open Trade Missions</h3>
              <span className="text-[9px] font-bold text-blue-500 font-mono italic">{pendingLeads.length} nodes signal</span>
            </div>

            {pendingLeads.length === 0 && (
               <div className="py-24 text-center opacity-20 flex flex-col items-center">
                  <i className="fa-solid fa-radar text-6xl mb-6 animate-pulse"></i>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em]">Scanning corridor...</p>
               </div>
            )}

            {pendingLeads.map(lead => (
              <div key={lead.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 p-7 shadow-xl hover:border-blue-500 transition-all group active:scale-[0.98]">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                           <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] italic">{lead.category}</p>
                           {lead.customerTrustSnapshot && (
                              <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border flex items-center gap-1 ${getTrustLabel(lead.customerTrustSnapshot).bg} ${getTrustLabel(lead.customerTrustSnapshot).color} border-current`}>
                                <i className={`fa-solid ${getTrustLabel(lead.customerTrustSnapshot).icon}`}></i> Client {getTrustLabel(lead.customerTrustSnapshot).label}
                              </span>
                           )}
                        </div>
                        <h4 className="text-3xl font-black text-secondary dark:text-white italic tracking-tighter">ZMW {lead.price}</h4>
                    </div>
                    {lead.isTrustedTransportOnly && (
                       <div className="w-11 h-11 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner">
                         <i className="fa-solid fa-shield-check"></i>
                       </div>
                    )}
                 </div>

                 <div className="grid grid-cols-2 gap-3 mb-8">
                   <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/5">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Mission Success</p>
                      <p className="text-[10px] font-black text-secondary dark:text-white uppercase italic tracking-tighter">{lead.customerTrustSnapshot}% Reliabity</p>
                   </div>
                   <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/5">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Mission Window</p>
                      <p className="text-[10px] font-black text-amber-600 italic uppercase tracking-tighter">
                        {lead.scheduledAt ? new Date(lead.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Instant Launch'}
                      </p>
                   </div>
                 </div>

                 <button 
                  onClick={() => onUpdateStatus(lead.id, BookingStatus.ACCEPTED, user.id)} 
                  className="w-full bg-blue-700 text-white font-black py-5 rounded-[28px] text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 active:scale-95 transition-all italic"
                 >
                   Establish Mission Link
                 </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'market' && (
          <div className="space-y-6 animate-fade-in">
             <div className="space-y-2">
               <h3 className="text-[11px] font-black text-secondary dark:text-white uppercase tracking-[0.2em] italic">Partner Market Intelligence</h3>
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic opacity-70">Strategic view of all active nodes in the corridor.</p>
             </div>

             <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Node Name or ID..."
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[28px] py-4 pl-12 pr-6 text-xs font-black outline-none focus:border-blue-600 transition-all dark:text-white"
                />
             </div>

             <div className="space-y-4">
               {marketPartners.map(partner => (
                 <div key={partner.id} className={`p-6 rounded-[32px] border transition-all ${partner.isPremium ? 'bg-indigo-600/5 border-indigo-500/30 shadow-indigo-500/5' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm'}`}>
                    <div className="flex justify-between items-start">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black italic text-white shadow-xl ${partner.isPremium ? 'bg-indigo-600' : 'bg-slate-500'}`}>
                             {partner.name.charAt(0)}
                          </div>
                          <div>
                             <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-secondary dark:text-white uppercase italic tracking-tighter leading-none">{partner.name}</h4>
                                {partner.isPremium && (
                                   <div className="flex items-center gap-1 bg-indigo-600 px-2 py-0.5 rounded-full shadow-lg shadow-indigo-600/20">
                                      <i className="fa-solid fa-gem text-[7px] text-white"></i>
                                      <span className="text-[6px] font-black text-white uppercase tracking-tighter">Elite</span>
                                   </div>
                                )}
                             </div>
                             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 italic">Node ID: {partner.phone.slice(-6)}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="flex gap-0.5 justify-end">
                             {[1,2,3,4,5].map(s => (
                               <i key={s} className={`fa-solid fa-star text-[8px] ${s <= Math.floor(partner.rating) ? 'text-amber-500' : 'text-slate-200 dark:text-slate-800'}`}></i>
                             ))}
                          </div>
                          <p className="text-[9px] font-black text-amber-600 mt-1 uppercase italic tracking-tighter">{partner.rating.toFixed(1)} Reliability</p>
                       </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 gap-4">
                       <div>
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest italic mb-1">Missions</p>
                          <p className="text-xs font-black text-blue-600 italic tracking-tighter uppercase">{partner.completedMissions || 0} COMPLETED</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest italic mb-1">Standing</p>
                          <span className={`text-[7px] font-black px-2 py-0.5 rounded-lg border border-current uppercase ${getTrustLabel(partner.trustScore).bg} ${getTrustLabel(partner.trustScore).color}`}>
                             {getTrustLabel(partner.trustScore).label}
                          </span>
                       </div>
                    </div>
                 </div>
               ))}
               {marketPartners.length === 0 && (
                 <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                    <i className="fa-solid fa-satellite-dish text-4xl animate-bounce"></i>
                    <p className="text-[10px] font-black uppercase tracking-widest italic">No matching partner nodes detected</p>
                 </div>
               )}
             </div>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] font-black text-secondary dark:text-white uppercase tracking-[0.2em] italic">Active Mission Stream</h3>
              <span className="text-[9px] font-bold text-blue-500 font-mono italic">{activeJobs.length} live signals</span>
            </div>

            {activeJobs.map(job => (
              <div key={job.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-2xl relative overflow-hidden mb-8">
                {/* Persistent Path Visibility for the Provider side */}
                <Map 
                  center={job.location} 
                  markers={[
                    { loc: job.location, color: '#1E40AF', label: 'Node' },
                    { loc: job.destination || { lat: job.location.lat + 0.005, lng: job.location.lng + 0.005 }, color: '#B87333', label: 'Target' }
                  ]}
                  trackingHistory={job.trackingHistory || [job.location]}
                  showRoute={true}
                />
                
                <div className="p-7">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">{job.category} Node</p>
                      {job.customerTrustSnapshot && (
                        <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-lg border border-current flex items-center gap-1 ${getTrustLabel(job.customerTrustSnapshot).bg} ${getTrustLabel(job.customerTrustSnapshot).color}`}>
                          <i className={`fa-solid ${getTrustLabel(job.customerTrustSnapshot).icon}`}></i> Client {getTrustLabel(job.customerTrustSnapshot).label}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-black uppercase text-blue-500 animate-pulse italic tracking-widest">{job.status}</p>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 mb-8 space-y-4 shadow-inner relative">
                     <div className="flex justify-between items-start">
                        <div className="flex-1">
                           <div className="flex items-center gap-2 mb-2">
                             <h4 className="text-[11px] font-black text-secondary dark:text-white italic leading-none uppercase tracking-tighter">Client: {job.customerPhone}</h4>
                             <div className="flex gap-0.5 opacity-60">
                               {[1,2,3,4,5].map(s => <i key={s} className="fa-solid fa-star text-[6px] text-amber-500"></i>)}
                             </div>
                           </div>
                           <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">{job.description}</p>
                        </div>
                        {job.recipientName && (
                           <div className="bg-amber-600/10 p-1.5 rounded-xl border border-amber-600/10 ml-4">
                              <i className="fa-solid fa-user-tag text-amber-600 text-xs"></i>
                           </div>
                        )}
                        {/* Cancellation Trigger for Provider */}
                        <button 
                          onClick={() => handleProviderCancel(job.id)}
                          className="text-red-500 text-xs hover:scale-110 transition-transform ml-4"
                        >
                          <i className="fa-solid fa-ban"></i>
                        </button>
                     </div>

                     {/* RECIPIENT CARD */}
                     {job.recipientName && (
                        <div className="p-4 bg-amber-600/5 rounded-2xl border border-amber-600/10 animate-fade-in">
                           <p className="text-[8px] font-black uppercase text-amber-600 mb-1 tracking-widest italic">Mission Recipient Details</p>
                           <div className="flex justify-between items-center">
                              <div>
                                 <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase italic">{job.recipientName}</p>
                                 <p className="text-[10px] font-bold text-slate-500 font-mono tracking-tighter">{job.recipientPhone}</p>
                              </div>
                              <button className="w-9 h-9 bg-amber-600 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
                                 <i className="fa-solid fa-phone text-[10px]"></i>
                              </button>
                           </div>
                        </div>
                     )}
                     
                     {/* Interactive Manifest (Workflow Maintained) */}
                     {job.isShoppingOrder && job.shoppingItems && (
                       <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
                          <p className="text-[8px] font-black uppercase text-blue-600 tracking-widest italic">Manifest Checklist</p>
                          {job.shoppingItems.map(item => (
                            <button 
                              key={item.id} 
                              onClick={() => toggleShoppingItem(job.id, item.id)}
                              className="w-full flex items-center justify-between text-left group"
                            >
                               <span className={`text-[10px] font-bold uppercase italic tracking-tight transition-all ${item.isAvailable ? 'text-slate-500' : 'text-red-500 line-through opacity-50'}`}>
                                 {item.name}
                               </span>
                               <i className={`fa-solid ${item.isAvailable ? 'fa-square-check text-blue-600 shadow-blue-600/10' : 'fa-square-xmark text-slate-300'} text-xl`}></i>
                            </button>
                          ))}
                          {job.shopOwnerPhone && (
                            <div className="mt-4 p-4 bg-blue-600/5 rounded-2xl border border-blue-600/10 flex items-center justify-between shadow-inner">
                               <p className="text-[9px] font-black text-blue-600 uppercase italic">Shop Node: {job.shopOwnerPhone}</p>
                               <button className="text-blue-600 w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center"><i className="fa-solid fa-phone-volume text-[10px]"></i></button>
                            </div>
                          )}
                       </div>
                     )}
                  </div>

                  <div className="flex gap-3">
                    {job.status === BookingStatus.ACCEPTED && (
                      <button 
                        onClick={() => onUpdateStatus(job.id, BookingStatus.SO_TICKING, user.id)} 
                        className="flex-1 bg-amber-600 text-white font-black py-5 rounded-[24px] text-[10px] uppercase tracking-widest shadow-xl shadow-amber-600/20 active:scale-95 transition-all italic"
                      >
                        Notify Shop Owner
                      </button>
                    )}
                    {(job.status === BookingStatus.SO_TICKING || job.status === BookingStatus.ACCEPTED) && (
                      <button 
                        onClick={() => onUpdateStatus(job.id, BookingStatus.GOODS_IN_TRANSIT, user.id)} 
                        className="flex-1 bg-blue-700 text-white font-black py-5 rounded-[24px] text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all italic"
                      >
                        Start Delivery
                      </button>
                    )}
                    {job.status === BookingStatus.GOODS_IN_TRANSIT && (
                      <button 
                        onClick={() => onUpdateStatus(job.id, BookingStatus.DELIVERED, user.id)} 
                        className="flex-1 bg-blue-700 text-white font-black py-5 rounded-[24px] text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all italic"
                      >
                        Broadcast Reach
                      </button>
                    )}
                    <button className="w-16 h-[58px] bg-slate-100 dark:bg-white/10 rounded-[24px] flex items-center justify-center text-slate-500 border border-slate-200 dark:border-white/5">
                      <i className="fa-solid fa-comment-dots text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-white/5 shadow-xl text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                 <div className={`${myTrust.bg} ${myTrust.color} px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-current italic flex items-center gap-2`}>
                   <i className={`fa-solid ${myTrust.icon}`}></i> {myTrust.label} Partner
                 </div>
              </div>

              <div className="relative mx-auto w-24 h-24 mb-6 mt-4">
                <div className="absolute inset-0 rounded-full bg-blue-600 blur-2xl opacity-20 animate-pulse"></div>
                <div className="relative w-full h-full bg-indigo-700 rounded-full flex items-center justify-center text-white text-3xl font-black italic border-4 border-white dark:border-slate-800 shadow-2xl">
                  {user.name.charAt(0)}
                </div>
              </div>
              <h2 className="text-2xl font-black text-secondary dark:text-white italic uppercase tracking-tighter">{user.name}</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 opacity-70 italic">{user.phone}</p>
              
              <div className="grid grid-cols-3 gap-3 mt-8">
                 <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/5">
                    <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Earnings</p>
                    <p className="text-xs font-black text-blue-600 italic tracking-tighter">ZMW {user.balance.toFixed(0)}</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/5">
                    <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Reliability</p>
                    <p className="text-xs font-black text-amber-600 italic tracking-tighter">{user.onTimeRate || 98}%</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/5">
                    <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Missions</p>
                    <p className="text-xs font-black text-indigo-600 italic tracking-tighter">{user.completedMissions || 42}</p>
                 </div>
              </div>

              <div className={`mt-6 p-6 rounded-[32px] border-2 shadow-inner ${myTrust.color} ${myTrust.bg} border-current opacity-90 transition-all`}>
                 <div className="flex items-center justify-center gap-3 mb-2">
                    <i className={`fa-solid ${myTrust.icon} text-2xl`}></i>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">{user.trustScore}% Vetted</h3>
                 </div>
                 <p className="text-[8px] font-bold uppercase tracking-widest opacity-80 leading-relaxed italic">Strategic Node Standing: Elite Partner Tier</p>
                 <div className="w-full h-1 bg-current opacity-20 rounded-full mt-4">
                    <div className="h-full bg-current rounded-full" style={{ width: `${user.trustScore}%` }}></div>
                 </div>
              </div>

              {user.isPremium && (
                 <div className="mt-4 p-4 bg-indigo-600 text-white rounded-[24px] shadow-lg flex items-center justify-center gap-3 animate-fade-in border border-white/20">
                    <i className="fa-solid fa-gem animate-bounce"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Swensi Premium Active</span>
                 </div>
              )}
            </div>

            <button onClick={logout} className="w-full bg-red-500/10 text-red-500 font-black py-5 rounded-[28px] text-[10px] uppercase tracking-[0.2em] border border-red-500/20 active:scale-95 transition-all italic">Disconnect Operational Link</button>
          </div>
        )}
      </div>

      <nav className="absolute bottom-6 left-6 right-6 h-20 glass-nav rounded-[32px] border border-white/10 flex justify-around items-center px-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50">
        <button onClick={() => setActiveTab('leads')} className={`flex-1 transition-all flex flex-col items-center ${activeTab === 'leads' ? 'text-blue-500 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-satellite text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1.5 tracking-widest italic tracking-widest">Signal</span>
        </button>
        <button onClick={() => setActiveTab('market')} className={`flex-1 transition-all flex flex-col items-center ${activeTab === 'market' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-globe text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1.5 tracking-widest italic tracking-widest">Market</span>
        </button>
        <button onClick={() => setActiveTab('active')} className={`flex-1 transition-all flex flex-col items-center ${activeTab === 'active' ? 'text-blue-500 scale-110' : 'text-slate-400'}`}>
          <div className="relative">
             <i className="fa-solid fa-route text-lg"></i>
             {activeJobs.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900 animate-ping shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>}
          </div>
          <span className="text-[8px] font-black uppercase mt-1.5 tracking-widest italic tracking-widest">Ops</span>
        </button>
        <button onClick={() => setActiveTab('account')} className={`flex-1 transition-all flex flex-col items-center ${activeTab === 'account' ? 'text-blue-500 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-fingerprint text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1.5 tracking-widest italic tracking-widest">Access</span>
        </button>
      </nav>
    </div>
  );
};

export default ProviderDashboard;