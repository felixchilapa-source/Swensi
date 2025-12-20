
import React, { useState, useMemo } from 'react';
import { User, Booking, BookingStatus, Role, Location } from '../types';
import { TRUSTED_COMMISSION_BONUS } from '../constants';
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
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ user, logout, bookings, allUsers, onUpdateStatus, onUpdateBooking, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'market' | 'active' | 'account'>('leads');
  const isTrusted = user.trustScore >= 95;

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone);

  const isEligibleForShopping = useMemo(() => {
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    const isMemberForAYear = (Date.now() - user.memberSince) >= oneYearInMs;
    const hasMinRating = user.rating >= 4.5;
    return !!(user.isPremium && hasMinRating && isMemberForAYear);
  }, [user.isPremium, user.rating, user.memberSince]);
  
  const pendingLeads = useMemo(() => bookings.filter(b => {
    if (b.status !== BookingStatus.PENDING) return false;
    if (b.isTrustedTransportOnly && !isTrusted) return false;
    if (b.category === 'errands' && !isEligibleForShopping) return false;
    return true;
  }), [bookings, isTrusted, isEligibleForShopping]);

  const activeJobs = useMemo(() => bookings.filter(b => b.providerId === user.id && b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CANCELLED), [bookings, user.id]);
  const hospitalityEarnings = (user.hospitalityCashflow || 0) * TRUSTED_COMMISSION_BONUS;

  const handleSaveProfile = () => {
    onUpdateUser({ name: editName, phone: editPhone });
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <header className="px-5 py-5 bg-secondary text-white sticky top-0 z-50 shadow-2xl border-b border-white/5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="bg-blue-600 w-11 h-11 rounded-[18px] shadow-lg flex items-center justify-center transform rotate-2">
               <i className="fas fa-satellite text-white text-lg"></i>
             </div>
             <div>
               <h2 className="text-xl font-bold italic tracking-tighter uppercase">Swensi</h2>
               <span className="text-[10px] font-bold text-blue-500 tracking-[0.2em] uppercase mt-2 inline-block">Partner Terminal</span>
             </div>
          </div>
          <button onClick={logout} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 border border-white/10"><i className="fa-solid fa-power-off text-xs"></i></button>
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
               </div>
            )}
            
            {pendingLeads.map(lead => (
              <div key={lead.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 p-7 shadow-xl hover:border-blue-500 transition-all">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] italic">{lead.category}</p>
                        <h4 className="text-3xl font-black text-secondary dark:text-white italic tracking-tighter">ZMW {lead.price}</h4>
                    </div>
                 </div>
                 <button 
                  onClick={() => onUpdateStatus(lead.id, BookingStatus.ACCEPTED, user.id)} 
                  className="w-full bg-blue-700 text-white font-black py-5 rounded-[28px] text-[10px] uppercase tracking-[0.2em] italic"
                 >
                   Establish Mission Link
                 </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-6 animate-fade-in">
            {activeJobs.map(job => (
              <div key={job.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-2xl relative overflow-hidden mb-8">
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
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">{job.category} Node</p>
                    <p className="text-[10px] font-black uppercase text-blue-500 animate-pulse italic tracking-widest">{job.status}</p>
                  </div>
                  <button 
                    onClick={() => onUpdateStatus(job.id, BookingStatus.DELIVERED, user.id)} 
                    className="w-full bg-blue-700 text-white font-black py-5 rounded-[24px] text-[10px] uppercase shadow-xl italic"
                  >
                    Broadcast Reach
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-white/5 shadow-xl text-center">
              <div className="w-24 h-24 mx-auto bg-indigo-700 rounded-full flex items-center justify-center text-white text-3xl font-black italic border-4 border-white dark:border-slate-800 shadow-2xl mb-6">
                {user.name.charAt(0)}
              </div>
              
              {!isEditing ? (
                <>
                  <h2 className="text-2xl font-black text-secondary dark:text-white italic uppercase tracking-tighter">{user.name}</h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 italic">{user.phone}</p>
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 space-y-3">
                    <button onClick={() => setIsEditing(true)} className="w-full bg-white dark:bg-white/5 text-blue-600 border border-blue-600/20 font-black py-4 rounded-3xl text-[9px] uppercase tracking-widest active:scale-95 transition-all italic">Edit Profile</button>
                    <button onClick={logout} className="w-full bg-red-500/10 text-red-500 font-black py-5 rounded-[28px] text-[10px] uppercase border border-red-500/20 italic">Disconnect</button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="text-left space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-2">Partner Alias</label>
                    <input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-black text-slate-800 dark:text-white outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="text-left space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 ml-2">Contact Line</label>
                    <input 
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-black text-slate-800 dark:text-white outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-100 dark:bg-white/5 text-slate-500 font-black py-4 rounded-2xl text-[9px] uppercase tracking-widest">Cancel</button>
                    <button onClick={handleSaveProfile} className="flex-1 bg-blue-700 text-white font-black py-4 rounded-2xl text-[9px] uppercase tracking-widest shadow-lg">Confirm Changes</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <nav className="absolute bottom-6 left-6 right-6 h-20 glass-nav rounded-[32px] border border-white/10 flex justify-around items-center px-4 shadow-2xl z-50">
        <button onClick={() => setActiveTab('leads')} className={`flex-1 flex flex-col items-center ${activeTab === 'leads' ? 'text-blue-500 scale-110' : 'text-slate-400'}`}>
          <i className="fa-solid fa-satellite text-lg"></i>
          <span className="text-[8px] font-black uppercase mt-1.5 italic">Signal</span>
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
