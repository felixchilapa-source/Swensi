
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
  user, logout, bookings, allUsers, onUpdateStatus, onConfirmCompletion, onToggleViewMode, location, onToggleTheme, isDarkMode, onLanguageChange, t 
}) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'active' | 'account'>('leads');
  const [isOnline, setIsOnline] = useState(true);
  
  const isAuthorized = user.isVerified;
  const isSubscribed = useMemo(() => {
    if (!user.subscriptionExpiry) return false;
    return user.subscriptionExpiry > Date.now();
  }, [user.subscriptionExpiry]);

  const pendingLeads = useMemo(() => {
    if (!isOnline || !isAuthorized || !isSubscribed) return [];
    return bookings.filter(b => b.status === BookingStatus.PENDING);
  }, [bookings, isOnline, isAuthorized, isSubscribed]);

  const activeJobs = useMemo(() => bookings.filter(b => b.providerId === user.id && b.status !== BookingStatus.COMPLETED), [bookings, user.id]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <header className="px-5 py-5 bg-secondary text-white sticky top-0 z-50 shadow-2xl safe-pt">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="bg-blue-600 w-11 h-11 rounded-[18px] shadow-lg flex items-center justify-center transform rotate-2">
               <i className="fas fa-satellite text-white text-lg"></i>
             </div>
             <h2 className="text-xl font-bold italic tracking-tighter uppercase leading-none">Swensi</h2>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={onToggleViewMode} className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center border border-emerald-600/20"><i className="fa-solid fa-rotate"></i></button>
             <div className="flex flex-col items-end">
                <span className={`text-[8px] font-black uppercase tracking-widest ${isOnline && isAuthorized && isSubscribed ? 'text-emerald-500' : 'text-red-500'}`}>
                   {isOnline ? 'Online' : 'Offline'}
                </span>
                <button onClick={() => isAuthorized && setIsOnline(!isOnline)} className={`w-10 h-5 rounded-full mt-1 relative transition-colors ${isOnline ? 'bg-emerald-600' : 'bg-slate-700'}`}>
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
            {isOnline && pendingLeads.map(lead => (
              <div key={lead.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-xl p-6">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest italic">{lead.category}</p>
                       <h4 className="text-lg font-black text-slate-900 dark:text-white italic tracking-tighter mt-1">{lead.id}</h4>
                    </div>
                    <p className="text-xl font-black text-emerald-600 italic">ZMW {lead.price}</p>
                 </div>
                 <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 italic mb-6">"{lead.description}"</p>
                 <button onClick={() => onUpdateStatus(lead.id, BookingStatus.ACCEPTED, user.id)} className="w-full bg-blue-600 text-white font-black py-5 rounded-[24px] text-[10px] uppercase italic tracking-widest">Accept Mission</button>
              </div>
            ))}
            {isOnline && pendingLeads.length === 0 && <div className="py-20 text-center opacity-30 italic text-[10px] uppercase tracking-[0.3em]">No Gigs Nearby</div>}
          </div>
        )}

        {activeTab === 'active' && (
           <div className="space-y-6 animate-fade-in">
              {activeJobs.map(job => (
                <div key={job.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-xl p-6">
                   <div className="flex justify-between items-center mb-6">
                      <h4 className="text-base font-black italic text-slate-900 dark:text-white uppercase">{job.category} • {job.id}</h4>
                      <span className="text-[8px] font-black bg-blue-600/10 text-blue-600 px-3 py-1 rounded-full uppercase italic">{job.status}</span>
                   </div>
                   <div className="grid grid-cols-1 gap-2">
                      <button onClick={() => onConfirmCompletion(job.id)} className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl text-[10px] uppercase italic">Close Mission</button>
                   </div>
                </div>
              ))}
              {activeJobs.length === 0 && <div className="py-20 text-center opacity-30 italic text-[10px] uppercase tracking-[0.4em]">No Live Ops</div>}
           </div>
        )}
      </div>

      <nav className="absolute bottom-6 left-6 right-6 h-20 glass-nav rounded-[32px] border border-white/10 flex justify-around items-center px-4 shadow-2xl z-50">
        <button onClick={() => setActiveTab('leads')} className={`flex-1 flex flex-col items-center ${activeTab === 'leads' ? 'text-blue-500' : 'text-slate-400'}`}><i className="fa-solid fa-satellite"></i></button>
        <button onClick={() => setActiveTab('active')} className={`flex-1 flex flex-col items-center ${activeTab === 'active' ? 'text-blue-500' : 'text-slate-400'}`}><i className="fa-solid fa-route"></i></button>
        <button onClick={() => setActiveTab('account')} className={`flex-1 flex flex-col items-center ${activeTab === 'account' ? 'text-blue-500' : 'text-slate-400'}`}><i className="fa-solid fa-fingerprint"></i></button>
      </nav>
    </div>
  );
};

export default ProviderDashboard;
