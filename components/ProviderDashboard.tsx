import React, { useState, useMemo } from 'react';
import { User, Booking, BookingStatus, Role } from '../types';
import { TRUSTED_COMMISSION_BONUS } from '../constants';
import Map from './Map';

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
      <header className="px-5 py-6 bg-secondary text-white sticky top-0 z-40 shadow-xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-lg rotate-3 border-2 border-white/20">
               <i className="fa-solid fa-truck-fast text-lg"></i>
             </div>
             <div>
               <h2 className="text-xl font-black italic">Swensi Ops</h2>
               <div className="flex items-center gap-1.5 mt-1">
                  {isTrusted && <span className="text-[7px] font-black uppercase bg-indigo-500 text-white px-1.5 py-0.5 rounded">Trusted Partner</span>}
                  <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
               </div>
             </div>
          </div>
          <button onClick={logout} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/50 border border-white/10">
            <i className="fa-solid fa-power-off text-xs"></i>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {activeTab === 'leads' && (
          <div className="space-y-4 animate-fade-in">
            {isTrusted && (
               <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[32px] text-white shadow-xl">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-200">Hospitality Bonus (0.05%)</p>
                  <h4 className="text-3xl font-black italic mt-1">ZMW {hospitalityEarnings.toFixed(2)}</h4>
               </div>
            )}
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase">Market Queue</h3>
            {pendingLeads.map(lead => (
              <div key={lead.id} className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-slate-100 dark:border-white/5 p-5 shadow-xl">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                        <h4 className="text-xl font-black text-secondary dark:text-white">ZMW {lead.price}</h4>
                        {lead.isTrustedTransportOnly && <span className="text-[7px] font-black uppercase text-indigo-500">Elite Hospitality lead</span>}
                    </div>
                    <span className="text-[8px] font-black bg-indigo-600 text-white px-2.5 py-1 rounded-lg uppercase">{lead.category}</span>
                 </div>
                 <button onClick={() => onUpdateStatus(lead.id, BookingStatus.ACCEPTED, user.id)} className="w-full bg-primary text-white font-black py-4 rounded-2xl text-[10px] uppercase shadow-lg">Accept Operation</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-5 animate-fade-in">
            {activeJobs.map(job => (
              <div key={job.id} className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border-l-[6px] border-primary shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[8px] font-black uppercase text-slate-400">{job.category}</p>
                  <p className="text-[9px] font-black uppercase text-primary">{job.status}</p>
                </div>
                <button onClick={() => onUpdateStatus(job.id, BookingStatus.DELIVERED, user.id)} className="w-full bg-primary text-white font-black py-4 rounded-2xl text-[10px] uppercase shadow-xl">Mark Arrived</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <nav className="absolute bottom-4 left-4 right-4 h-16 glass-nav rounded-3xl border border-white/10 flex justify-around items-center px-2 shadow-2xl z-50">
        <button onClick={() => setActiveTab('leads')} className={`flex-1 ${activeTab === 'leads' ? 'text-primary' : 'text-slate-400'}`}>
          <i className="fa-solid fa-satellite-dish"></i>
        </button>
        <button onClick={() => setActiveTab('active')} className={`flex-1 ${activeTab === 'active' ? 'text-primary' : 'text-slate-400'}`}>
          <i className="fa-solid fa-road"></i>
        </button>
      </nav>
    </div>
  );
};

export default ProviderDashboard;