
import React, { useState, useMemo, useRef } from 'react';
import { User, Booking, BookingStatus, Role, Location } from '../types';
import { PAYMENT_NUMBERS, SUBSCRIPTION_PLANS, LANGUAGES } from '../constants';
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
  onUpdateUser: (updates: Partial<User>) => void;
  location: Location;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  onLanguageChange: (lang: string) => void;
  t: (key: string) => string;
  onToggleViewMode?: () => void;
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ 
  user, logout, bookings, allUsers, onUpdateStatus, onUpdateBooking, 
  // Fix: added missing onConfirmCompletion to props destructuring to resolve build error on line 189
  onConfirmCompletion,
  onUpdateUser, onUpdateSubscription, onToggleViewMode, location, onToggleTheme, isDarkMode, onLanguageChange, t 
}) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'active' | 'account'>('leads');
  const [isOnline, setIsOnline] = useState(true);
  const [showKYCModal, setShowKYCModal] = useState(false);
  
  const isAuthorized = user.isVerified;
  const isSubscribed = useMemo(() => {
    if (!user.subscriptionExpiry) return false;
    return user.subscriptionExpiry > Date.now();
  }, [user.subscriptionExpiry]);

  const pendingLeads = useMemo(() => {
    if (!isOnline || !isAuthorized || !isSubscribed) return [];
    return bookings.filter(b => b.status === BookingStatus.PENDING);
  }, [bookings, isOnline, isAuthorized, isSubscribed]);

  const totalPotentialValue = useMemo(() => {
    return pendingLeads.reduce((acc, curr) => acc + curr.price, 0);
  }, [pendingLeads]);

  const activeJobs = useMemo(() => bookings.filter(b => b.providerId === user.id && b.status !== BookingStatus.COMPLETED), [bookings, user.id]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <header className="px-5 py-5 bg-secondary text-white sticky top-0 z-50 shadow-2xl border-b border-white/5 safe-pt">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="bg-blue-600 w-11 h-11 rounded-[18px] shadow-lg flex items-center justify-center transform rotate-2">
               <i className="fas fa-satellite text-white text-lg"></i>
             </div>
             <div>
               <h2 className="text-xl font-bold italic tracking-tighter uppercase leading-none">Swensi</h2>
               <span className="text-[10px] font-bold text-blue-500 tracking-[0.2em] uppercase mt-1 inline-block">Partner Terminal</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={onToggleViewMode} className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center border border-emerald-600/20 active:rotate-180 transition-all duration-500"><i className="fa-solid fa-rotate"></i></button>
             <div className="flex flex-col items-end">
                <span className={`text-[8px] font-black uppercase tracking-widest ${isOnline && isAuthorized && isSubscribed ? 'text-emerald-500' : 'text-red-500'}`}>
                  {!isSubscribed ? 'Subs Expired' : (!isAuthorized ? 'Pending KYC' : (isOnline ? 'Online' : 'Offline'))}
                </span>
                <button 
                  onClick={() => isAuthorized && isSubscribed && setIsOnline(!isOnline)}
                  disabled={!isAuthorized || !isSubscribed}
                  className={`w-10 h-5 rounded-full mt-1 relative transition-colors ${isOnline && isAuthorized && isSubscribed ? 'bg-emerald-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isOnline ? 'right-1' : 'left-1'}`}></div>
                </button>
             </div>
          </div>
        </div>
      </header>

      <NewsTicker />

      <div className="flex-1 overflow-y-auto pb-32 px-5 pt-6 space-y-8 no-scrollbar">
        {activeTab === 'leads' && (
          <div className="space-y-6 animate-fade-in">
            {/* Gig Radar Stats */}
            <div className="bg-slate-900 rounded-[40px] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full translate-x-12 -translate-y-12"></div>
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase text-blue-500 tracking-widest italic">Corridor Radar</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-[8px] font-black text-slate-500 uppercase">Live Signal</span>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[28px] font-black text-white italic leading-none">{pendingLeads.length}</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-2">Pending Missions</p>
                  </div>
                  <div>
                    <p className="text-[28px] font-black text-emerald-500 italic leading-none">ZMW {totalPotentialValue}</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-2">Potential Flow</p>
                  </div>
               </div>
            </div>

            {!isOnline && isAuthorized && (
               <div className="py-10 text-center space-y-4 opacity-50">
                  <i className="fa-solid fa-moon text-4xl text-slate-400"></i>
                  <p className="text-[10px] font-black uppercase tracking-widest">You are currently offline</p>
               </div>
            )}

            {isOnline && pendingLeads.length === 0 && (
               <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-white/5">
                    <i className="fa-solid fa-radar text-slate-700 text-xl animate-spin-slow"></i>
                  </div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Scanning for trade links...</p>
               </div>
            )}

            {isOnline && pendingLeads.map(lead => (
              <div key={lead.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-xl animate-slide-up group">
                 <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center text-lg shadow-inner">
                             <i className="fa-solid fa-location-crosshairs"></i>
                          </div>
                          <div>
                             <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest italic leading-none">{lead.category}</p>
                             <h4 className="text-lg font-black text-slate-900 dark:text-white italic tracking-tighter mt-1">{lead.id}</h4>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xl font-black text-emerald-600 italic leading-none">ZMW {lead.price}</p>
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">Mission Budget</p>
                       </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-3xl mb-6 border border-slate-100 dark:border-white/5">
                       <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic line-clamp-2">"{lead.description}"</p>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                       <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black text-white italic">
                             {lead.customerPhone.slice(-2)}
                          </div>
                          <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600 flex items-center justify-center text-[10px] text-white">
                             <i className="fa-solid fa-star text-[7px]"></i>
                          </div>
                       </div>
                       <button 
                        onClick={() => onUpdateStatus(lead.id, BookingStatus.ACCEPTED, user.id)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-black px-10 py-5 rounded-[24px] text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all italic"
                       >
                         Accept Mission
                       </button>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'active' && (
           <div className="space-y-6 animate-fade-in">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Active Protocol Ops</h3>
              {activeJobs.length === 0 && (
                <div className="py-20 text-center opacity-20">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em]">No Live Engagements</p>
                </div>
              )}
              {activeJobs.map(job => (
                <div key={job.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-xl">
                   <Map center={job.location} markers={[
                     { loc: job.location, color: '#059669', label: 'Start' },
                     { loc: job.destination || job.location, color: '#3b82f6', label: 'Goal' }
                   ]} />
                   <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                         <h4 className="text-base font-black italic text-slate-900 dark:text-white uppercase">{job.category}</h4>
                         <span className="text-[8px] font-black bg-blue-600/10 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">{job.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-6">
                         <button className="bg-emerald-600 text-white font-black py-4 rounded-2xl text-[9px] uppercase italic">Update Status</button>
                         <button onClick={() => onConfirmCompletion(job.id)} className="bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white font-black py-4 rounded-2xl text-[9px] uppercase italic">Close Mission</button>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        )}

        {activeTab === 'account' && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-white/5 shadow-xl text-center">
              <div className="w-24 h-24 mx-auto bg-indigo-700 rounded-full flex items-center justify-center text-white text-3xl font-black italic shadow-2xl mb-6 overflow-hidden">
                {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.name.charAt(0)}
              </div>
              <h2 className="text-2xl font-black text-secondary dark:text-white italic uppercase tracking-tighter leading-none">{user.name}</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 italic leading-none">{user.phone}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-white/5 shadow-xl space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 italic ml-2">Terminal Configuration</h3>
              
              <button 
                onClick={onToggleTheme}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10"
              >
                <div className="flex items-center gap-3">
                  <i className={`fa-solid ${isDarkMode ? 'fa-moon text-blue-500' : 'fa-sun text-amber-500'} text-lg`}></i>
                  <span className="text-[10px] font-black uppercase tracking-widest dark:text-white italic">Interface Theme</span>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${isDarkMode ? 'right-1' : 'left-1'}`}></div>
                </div>
              </button>

              <div className="pt-4 border-t border-slate-100 dark:border-white/5 grid grid-cols-1 gap-3">
                 <button onClick={logout} className="bg-red-500/10 text-red-500 font-black py-5 rounded-[28px] text-[10px] uppercase border border-red-500/20 italic">Disconnect Terminal</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="absolute bottom-6 left-6 right-6 h-20 glass-nav rounded-[32px] border border-white/10 flex justify-around items-center px-4 shadow-2xl z-50">
        <button onClick={() => setActiveTab('leads')} className={`flex-1 flex flex-col items-center relative ${activeTab === 'leads' ? 'text-blue-500 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-satellite text-lg"></i>
          {pendingLeads.length > 0 && (
            <span className="absolute top-0 right-1/3 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          )}
          <span className="text-[8px] font-black uppercase mt-1.5 italic">Radar</span>
        </button>
        <button onClick={() => setActiveTab('active')} className={`flex-1 flex flex-col items-center ${activeTab === 'active' ? 'text-blue-500 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-route text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1.5 italic">Ops</span>
        </button>
        <button onClick={() => setActiveTab('account')} className={`flex-1 flex flex-col items-center ${activeTab === 'account' ? 'text-blue-500 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-fingerprint text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1.5 italic">Access</span>
        </button>
      </nav>
    </div>
  );
};

export default ProviderDashboard;
