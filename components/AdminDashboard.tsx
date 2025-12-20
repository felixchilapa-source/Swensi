
import React, { useState, useMemo } from 'react';
import { User, Booking, Role, SystemLog, CouncilOrder } from '../types';
import { SUPER_ADMIN, LANGUAGES } from '../constants';

interface AdminDashboardProps {
  user: User;
  logout: () => void;
  bookings: Booking[];
  allUsers: User[];
  councilOrders: CouncilOrder[];
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
  onToggleViewMode?: () => void;
}

interface NavItem {
  id: 'stats' | 'registry' | 'council' | 'security';
  icon: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user, logout, allUsers, bookings, councilOrders, onToggleVerification, adminNumbers, onAddAdmin, onRemoveAdmin, t, onToggleViewMode
}) => {
  const [view, setView] = useState<'stats' | 'registry' | 'council' | 'security'>('stats');
  
  const stats = useMemo(() => {
    const totalVolume = bookings.reduce((acc, b) => acc + b.price, 0);
    const totalCommissions = bookings.filter(b => b.isPaid).reduce((acc, b) => acc + b.commission, 0);
    const councilTreasury = councilOrders.reduce((acc, co) => acc + co.levyAmount, 0);
    return { totalVolume, totalCommissions, councilTreasury, activeUsers: allUsers.length };
  }, [bookings, allUsers, councilOrders]);

  const navItems: NavItem[] = [
    { id: 'stats', icon: 'fa-chart-pie' },
    { id: 'registry', icon: 'fa-users' },
    { id: 'council', icon: 'fa-building-columns' },
    { id: 'security', icon: 'fa-shield-halved' }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white no-scrollbar relative overflow-hidden">
      <header className="px-5 py-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-slate-950/90 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg border-2 border-red-400/20"><i className="fa-solid fa-shield-halved text-xs"></i></div>
          <div className="min-w-0">
            <h2 className="text-base font-black tracking-tighter uppercase italic leading-none">Swensi Command</h2>
            <p className="text-[7px] text-slate-500 uppercase font-black tracking-[0.2em] mt-1">Strategic Operations</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onToggleViewMode} className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center border border-emerald-600/20"><i className="fa-solid fa-cart-plus"></i></button>
          <button onClick={logout} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20"><i className="fa-solid fa-power-off text-xs"></i></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-24 no-scrollbar">
        <nav className="flex bg-white/5 p-1 rounded-2xl border border-white/5 sticky top-0 z-40 backdrop-blur-md">
          {navItems.map((v) => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1 ${view === v.id ? 'bg-red-600 text-white shadow-xl' : 'text-slate-500'}`}>
              <i className={`fa-solid ${v.icon} text-[10px]`}></i> {v.id}
            </button>
          ))}
        </nav>

        {view === 'stats' && (
          <div className="space-y-4 animate-fade-in">
             <div className="bg-gradient-to-br from-red-600 to-slate-900 p-8 rounded-[40px] shadow-xl relative overflow-hidden">
                <p className="text-white/60 text-[9px] font-black uppercase mb-1 tracking-widest italic">Total Corridor Treasury</p>
                <p className="text-5xl font-black italic tracking-tighter">ZMW {stats.totalCommissions.toFixed(2)}</p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                   <div className="bg-black/20 p-4 rounded-2xl">
                      <p className="text-[7px] font-black uppercase text-white/50 mb-1 italic">Active Nodes</p>
                      <p className="text-sm font-black tracking-tight">{stats.activeUsers}</p>
                   </div>
                   <div className="bg-purple-600/20 p-4 rounded-2xl">
                      <p className="text-[7px] font-black uppercase text-purple-200/50 mb-1 italic">Council Levies</p>
                      <p className="text-sm font-black tracking-tight">ZMW {stats.councilTreasury.toFixed(0)}</p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {view === 'council' && (
           <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-black italic tracking-tighter uppercase px-2">Council Compliance Desk</h3>
              <div className="space-y-3">
                 {councilOrders.map(co => (
                    <div key={co.id} className="bg-white/5 p-5 rounded-3xl border border-purple-500/20 flex flex-col gap-4">
                       <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest italic">{co.type}</span>
                          <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">Compliance OK</span>
                       </div>
                       <div className="flex justify-between items-end">
                          <div>
                             <p className="text-[11px] font-black text-white uppercase italic tracking-tighter">{co.id}</p>
                             <p className="text-[8px] text-slate-500 font-bold tracking-widest mt-1">Ref: {co.bookingId}</p>
                             <p className="text-[8px] text-slate-500 font-bold tracking-widest">Phone: {co.customerPhone}</p>
                          </div>
                          <p className="text-lg font-black text-white italic">ZMW {co.levyAmount.toFixed(2)}</p>
                       </div>
                    </div>
                 ))}
                 {councilOrders.length === 0 && (
                   <div className="py-20 text-center opacity-10 flex flex-col items-center gap-4">
                      <i className="fa-solid fa-building-columns text-5xl"></i>
                      <p className="text-[10px] font-black uppercase tracking-widest">No Council Orders Synced</p>
                   </div>
                 )}
              </div>
           </div>
        )}

        {view === 'registry' && (
           <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-black italic tracking-tighter uppercase px-2">Node Registry</h3>
              <div className="space-y-3">
                 {allUsers.map(u => (
                    <div key={u.id} className="bg-white/5 p-5 rounded-3xl border border-white/10 flex justify-between items-center">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black italic shadow-lg border-2 ${u.role === Role.PROVIDER ? 'bg-blue-600 border-blue-400/20' : 'bg-slate-800 border-slate-700'}`}>
                             {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover rounded-[14px]" /> : u.name.charAt(0)}
                          </div>
                          <div>
                             <p className="text-xs font-black uppercase italic tracking-tight">{u.name}</p>
                             <p className="text-[8px] text-slate-500 font-bold tracking-widest">{u.phone}</p>
                          </div>
                       </div>
                       <button onClick={() => onToggleVerification(u.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${u.isVerified ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white/5 text-slate-500 border border-white/10'}`}><i className="fa-solid fa-certificate"></i></button>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {view === 'security' && (
          <div className="space-y-6 animate-fade-in text-center py-20 opacity-30">
            <i className="fa-solid fa-user-shield text-5xl mb-4"></i>
            <p className="text-[10px] font-black uppercase tracking-widest">Protocol Override Active</p>
          </div>
        )}
      </div>

      <footer className="p-5 text-center bg-black/80 border-t border-white/5 absolute bottom-0 left-0 right-0 z-40">
        <p className="text-[7px] text-slate-700 font-black tracking-[0.4em] uppercase mb-1 italic">Swensi Strategic Node v3.0.0</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;
