import React, { useState, useMemo } from 'react';
import { User, Booking, Role, SystemLog } from '../types';
import { SUPER_ADMIN, LANGUAGES } from '../constants';

interface AdminDashboardProps {
  user: User;
  logout: () => void;
  bookings: Booking[];
  allUsers: User[];
  systemLogs: SystemLog[];
  onToggleBlock: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onToggleVerification: (userId: string) => void;
  onUpdateUserRole: (userId: string, role: Role) => void;
  adminNumbers: string[];
  onAddAdmin: (phone: string) => void;
  onRemoveAdmin: (phone: string) => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  onLanguageChange: (lang: string) => void;
  sysDefaultLang: string;
  onUpdateSysDefaultLang: (lang: string) => void;
  t: (key: string) => string;
}

interface NavItem {
  id: 'stats' | 'finance' | 'users' | 'hospitality';
  icon: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user, logout, allUsers, bookings, systemLogs, onToggleBlock, onDeleteUser, onToggleVerification, onUpdateUserRole, 
  adminNumbers, onAddAdmin, onRemoveAdmin, onToggleTheme, isDarkMode, onLanguageChange, sysDefaultLang, onUpdateSysDefaultLang, t
}) => {
  const [view, setView] = useState<'stats' | 'finance' | 'users' | 'hospitality'>('stats');
  
  const stats = useMemo(() => {
    const totalVolume = bookings.reduce((acc, b) => acc + b.price, 0);
    const lodgeSubscriptions = allUsers.filter(u => u.role === Role.LODGE).length * 250;
    const totalCommissions = bookings.filter(b => b.isPaid).reduce((acc, b) => acc + b.commission, 0) + lodgeSubscriptions;
    return { totalVolume, totalCommissions, lodgeSubscriptions };
  }, [bookings, allUsers]);

  const navItems: NavItem[] = [
    { id: 'stats', icon: 'fa-chart-pie' },
    { id: 'finance', icon: 'fa-wallet' },
    { id: 'users', icon: 'fa-users' },
    { id: 'hospitality', icon: 'fa-hotel' }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white no-scrollbar relative overflow-hidden">
      <header className="px-5 py-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-slate-950/90 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg border-2 border-indigo-400/20">
            <i className="fa-solid fa-truck-fast text-xs"></i>
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-black tracking-tighter uppercase italic leading-none">Swensi Strategic</h2>
            <p className="text-[7px] text-slate-500 uppercase font-black tracking-[0.2em] mt-1">Nakonde Command Center</p>
          </div>
        </div>
        <button onClick={logout} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
          <i className="fa-solid fa-power-off text-xs"></i>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        <nav className="flex bg-white/5 p-1 rounded-2xl border border-white/5 sticky top-0 z-40 backdrop-blur-md">
          {navItems.map((v) => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1 ${view === v.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500'}`}>
              <i className={`fa-solid ${v.icon} text-[10px]`}></i>
              {v.id}
            </button>
          ))}
        </nav>

        {view === 'stats' && (
          <div className="space-y-4 animate-fade-in">
             <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[40px] shadow-xl">
                <p className="text-indigo-200 text-[9px] font-black uppercase mb-1 tracking-widest">Treasury (Inc. Lodge Subs)</p>
                <p className="text-5xl font-black italic">ZMW {stats.totalCommissions.toFixed(2)}</p>
             </div>
             <div className="bg-white/5 p-6 rounded-[32px] border border-white/5">
                <h4 className="text-[10px] font-black uppercase text-slate-500 mb-4">Lodge Revenue (ZMW 250 ea)</h4>
                <div className="text-2xl font-black text-indigo-400">ZMW {stats.lodgeSubscriptions}</div>
             </div>
          </div>
        )}

        {view === 'hospitality' && (
           <div className="space-y-4 animate-fade-in">
              <h3 className="text-xl font-black italic tracking-tighter">Hospitality Intelligence</h3>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed">Lodges are billed monthly. Only elite transport providers are assigned to guests to ensure maximum safety at the border.</p>
              
              <div className="space-y-3 mt-6">
                 {allUsers.filter(u => u.role === Role.LODGE).map(lodge => (
                    <div key={lodge.id} className="bg-white/5 p-5 rounded-3xl border border-white/10 flex justify-between items-center">
                       <div>
                          <p className="text-xs font-black uppercase">{lodge.name}</p>
                          <p className="text-[8px] text-slate-500 font-bold">{lodge.phone}</p>
                       </div>
                       <span className="bg-green-500/10 text-green-500 text-[8px] font-black px-3 py-1 rounded-full uppercase">Subscription Active</span>
                    </div>
                 ))}
                 {allUsers.filter(u => u.role === Role.LODGE).length === 0 && (
                   <p className="text-center text-slate-600 text-[10px] py-10 uppercase font-black">No active lodge partners recorded</p>
                 )}
              </div>
           </div>
        )}
      </div>

      <footer className="p-5 text-center bg-black/80 border-t border-white/5 absolute bottom-0 left-0 right-0 z-40">
        <p className="text-[7px] text-slate-700 font-black tracking-[0.4em] uppercase mb-1 italic">Swensi Nakonde Command v2.9.5</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;