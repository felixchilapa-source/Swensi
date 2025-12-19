
import React, { useState, useMemo } from 'react';
import { User, Booking, BookingStatus, Role } from '../types';
import { TRUSTED_COMMISSION_BONUS, COLORS } from '../constants';
import Map from './Map';
import NewsTicker from './NewsTicker';

interface ProviderDashboardProps {
  user: User;
  logout: () => void;
  bookings: Booking[];
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

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ user, logout, bookings, onUpdateStatus, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'active' | 'account'>('leads');
  const isTrusted = user.trustScore >= 95;
  const pendingLeads = useMemo(() => bookings.filter(b => b.status === BookingStatus.PENDING && (!b.isTrustedTransportOnly || isTrusted)), [bookings, isTrusted]);
  const activeJobs = useMemo(() => bookings.filter(b => b.providerId === user.id && b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CANCELLED), [bookings, user.id]);
  const hospitalityEarnings = (user.hospitalityCashflow || 0) * TRUSTED_COMMISSION_BONUS;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <header className="px-5 py-4 bg-secondary text-white sticky top-0 z-40 shadow-xl border-b border-white/5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-green-600 p-2 rounded-lg shadow-inner">
               <i className="fas fa-paper-plane text-white text-sm"></i>
             </div>
             <div>
               <h2 className="text-lg font-bold leading-none text-white">Swensi</h2>
               <span className="text-[10px] font-bold text-green-600 tracking-widest uppercase">Nakonde</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right">
                <p className="text-[9px] font-black uppercase text-green-500 tracking-tighter italic">Partner Terminal</p>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Border Link Active</p>
             </div>
             <button onClick={logout} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/50 border border-white/10">
               <i className="fa-solid fa-power-off text-xs"></i>
             </button>
          </div>
        </div>
      </header>

      {/* NEW TRADE TICKER */}
      <NewsTicker />

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {activeTab === 'leads' && (
          <div className="space-y-4 animate-fade-in">
            {isTrusted && (
               <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-[32px] text-white shadow-xl border border-white/10 relative overflow-hidden">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-100 opacity-80">Trade Incentive Pool (0.05%)</p>
                  <h4 className="text-3xl font-black italic mt-1">ZMW {hospitalityEarnings.toFixed(2)}</h4>
                  <i className="fa-solid fa-shield-halved absolute -bottom-4 -right-2 text-6xl opacity-10"></i>
               </div>
            )}
            <h3 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tighter italic px-1">Market Pipeline</h3>
            {pendingLeads.map(lead => (
              <div key={lead.id} className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-slate-100 dark:border-white/5 p-5 shadow-xl transition-all hover:border-green-600">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                        <h4 className="text-xl font-black text-secondary dark:text-white italic">ZMW {lead.price}</h4>
                        {lead.isTrustedTransportOnly && <span className="text-[8px] font-black uppercase text-green-600 tracking-widest">Trade-Verified Lead</span>}
                    </div>
                    <span className="text-[8px] font-black bg-green-600 text-white px-2.5 py-1 rounded-lg uppercase tracking-tighter">{lead.category}</span>
                 </div>
                 <button onClick={() => onUpdateStatus(lead.id, BookingStatus.ACCEPTED, user.id)} className="w-full bg-green-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase shadow-lg active:scale-95 transition-all italic">Claim Mission</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tighter px-1 italic">Active Operations</h3>
            {activeJobs.map(job => (
              <div key={job.id} className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border-l-[6px] border-green-600 shadow-lg relative overflow-hidden group">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest italic">{job.category}</p>
                  <p className="text-[9px] font-black uppercase text-green-600 animate-pulse">{job.status}</p>
                </div>
                <p className="text-xs font-bold text-secondary dark:text-white mb-4 line-clamp-1 italic">{job.description}</p>
                <button onClick={() => onUpdateStatus(job.id, BookingStatus.DELIVERED, user.id)} className="w-full bg-secondary text-white font-black py-4 rounded-2xl text-[10px] uppercase shadow-xl active:scale-95 transition-all italic">Complete Link</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <nav className="absolute bottom-4 left-4 right-4 h-16 glass-nav rounded-3xl border border-white/10 flex justify-around items-center px-2 shadow-2xl z-50">
        <button onClick={() => setActiveTab('leads')} className={`flex-1 transition-all flex flex-col items-center ${activeTab === 'leads' ? 'text-green-600 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-satellite-dish"></i>
          <span className="text-[7px] font-black uppercase mt-1 tracking-tighter italic">Market</span>
        </button>
        <button onClick={() => setActiveTab('active')} className={`flex-1 transition-all flex flex-col items-center ${activeTab === 'active' ? 'text-green-600 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-road"></i>
          <span className="text-[7px] font-black uppercase mt-1 tracking-tighter italic">Missions</span>
        </button>
      </nav>
    </div>
  );
};

export default ProviderDashboard;
