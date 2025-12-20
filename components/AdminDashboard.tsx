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
  id: 'stats' | 'registry' | 'security' | 'hospitality';
  icon: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user, logout, allUsers, bookings, onToggleVerification, adminNumbers, onAddAdmin, onRemoveAdmin, t
}) => {
  const [view, setView] = useState<'stats' | 'registry' | 'security' | 'hospitality'>('stats');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  
  const stats = useMemo(() => {
    const totalVolume = bookings.reduce((acc, b) => acc + b.price, 0);
    const lodgeSubscriptions = allUsers.filter(u => u.role === Role.LODGE).length * 250;
    const totalCommissions = bookings.filter(b => b.isPaid).reduce((acc, b) => acc + b.commission, 0) + lodgeSubscriptions;
    return { totalVolume, totalCommissions, lodgeSubscriptions, activeUsers: allUsers.length };
  }, [bookings, allUsers]);

  const navItems: NavItem[] = [
    { id: 'stats', icon: 'fa-chart-pie' },
    { id: 'registry', icon: 'fa-users' },
    { id: 'security', icon: 'fa-shield-halved' },
    { id: 'hospitality', icon: 'fa-hotel' }
  ];

  const handleAddAdminClick = () => {
    if (!newAdminPhone.trim()) return;
    onAddAdmin(newAdminPhone);
    setNewAdminPhone('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white no-scrollbar relative overflow-hidden">
      <header className="px-5 py-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-slate-950/90 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg border-2 border-red-400/20">
            <i className="fa-solid fa-shield-halved text-xs"></i>
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-black tracking-tighter uppercase italic leading-none">Swensi Command</h2>
            <p className="text-[7px] text-slate-500 uppercase font-black tracking-[0.2em] mt-1">Strategic Operations</p>
          </div>
        </div>
        <button onClick={logout} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
          <i className="fa-solid fa-power-off text-xs"></i>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-24 no-scrollbar">
        <nav className="flex bg-white/5 p-1 rounded-2xl border border-white/5 sticky top-0 z-40 backdrop-blur-md">
          {navItems.map((v) => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1 ${view === v.id ? 'bg-red-600 text-white shadow-xl' : 'text-slate-500'}`}>
              <i className={`fa-solid ${v.icon} text-[10px]`}></i>
              {v.id}
            </button>
          ))}
        </nav>

        {view === 'stats' && (
          <div className="space-y-4 animate-fade-in">
             <div className="bg-gradient-to-br from-red-600 to-slate-900 p-8 rounded-[40px] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>
                <p className="text-white/60 text-[9px] font-black uppercase mb-1 tracking-widest italic">Total Corridor Treasury</p>
                <p className="text-5xl font-black italic tracking-tighter">ZMW {stats.totalCommissions.toFixed(2)}</p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                   <div className="bg-black/20 p-4 rounded-2xl">
                      <p className="text-[7px] font-black uppercase text-white/50 mb-1 italic">Total Volume</p>
                      <p className="text-sm font-black tracking-tight">ZMW {stats.totalVolume.toFixed(0)}</p>
                   </div>
                   <div className="bg-black/20 p-4 rounded-2xl">
                      <p className="text-[7px] font-black uppercase text-white/50 mb-1 italic">Active Nodes</p>
                      <p className="text-sm font-black tracking-tight">{stats.activeUsers}</p>
                   </div>
                </div>
             </div>
             
             <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-500 mb-1 italic">Lodge Subscriptions</p>
                   <p className="text-2xl font-black text-white">ZMW {stats.lodgeSubscriptions}</p>
                </div>
                <div className="w-12 h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-500 border border-purple-500/10">
                   <i className="fa-solid fa-hotel"></i>
                </div>
             </div>
          </div>
        )}

        {view === 'registry' && (
           <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-black italic tracking-tighter uppercase px-2">Node Registry</h3>
              <div className="space-y-3">
                 {allUsers.map(u => (
                    <div key={u.id} className="bg-white/5 p-5 rounded-3xl border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black italic shadow-lg border-2 ${u.role === Role.PROVIDER ? 'bg-blue-600 border-blue-400/20' : u.role === Role.LODGE ? 'bg-purple-600 border-purple-400/20' : 'bg-slate-800 border-slate-700'}`}>
                             {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover rounded-[14px]" /> : u.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                             <p className="text-xs font-black uppercase italic tracking-tight truncate max-w-[120px]">{u.name}</p>
                             <p className="text-[8px] text-slate-500 font-bold tracking-widest">{u.phone}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase ${u.role === Role.PROVIDER ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-slate-500'}`}>{u.role}</span>
                                {u.isVerified && <i className="fa-solid fa-circle-check text-blue-500 text-[8px]"></i>}
                             </div>
                          </div>
                       </div>
                       <button 
                        onClick={() => onToggleVerification(u.id)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${u.isVerified ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white/5 text-slate-500 border border-white/10'}`}
                       >
                          <i className="fa-solid fa-certificate"></i>
                       </button>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {view === 'security' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-black italic tracking-tighter uppercase px-2">Admin Clearance</h3>
            
            <div className="bg-white/5 p-6 rounded-[35px] border border-white/10 space-y-4">
               <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic px-2">Authorize New Node</p>
               <div className="flex gap-2">
                 <input 
                   type="tel"
                   value={newAdminPhone}
                   onChange={(e) => setNewAdminPhone(e.target.value)}
                   placeholder="Enter phone number..."
                   className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-5 py-3 text-sm font-black text-white outline-none focus:border-red-600"
                 />
                 <button 
                   onClick={handleAddAdminClick}
                   className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                 >
                   <i className="fa-solid fa-plus"></i>
                 </button>
               </div>
            </div>

            <div className="space-y-3">
               <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic px-2">Authorized Administrators</p>
               {adminNumbers.map(admin => (
                 <div key={admin} className="bg-white/5 p-5 rounded-3xl border border-white/10 flex justify-between items-center group">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center text-red-600 border border-red-600/20">
                        <i className="fa-solid fa-shield-halved"></i>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-tight italic text-white">{admin}</p>
                        {admin === SUPER_ADMIN && <span className="text-[7px] font-black text-red-500 uppercase tracking-widest">System Root</span>}
                      </div>
                   </div>
                   {admin !== SUPER_ADMIN && (
                     <button 
                       onClick={() => onRemoveAdmin(admin)}
                       className="w-9 h-9 rounded-xl bg-white/5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all border border-white/10"
                     >
                       <i className="fa-solid fa-user-minus"></i>
                     </button>
                   )}
                 </div>
               ))}
            </div>
          </div>
        )}

        {view === 'hospitality' && (
           <div className="space-y-4 animate-fade-in">
              <h3 className="text-xl font-black italic tracking-tighter uppercase px-2">Stay Hubs</h3>
              <div className="space-y-3 mt-6">
                 {allUsers.filter(u => u.role === Role.LODGE).map(lodge => (
                    <div key={lodge.id} className="bg-white/5 p-6 rounded-[35px] border border-white/10 flex justify-between items-center">
                       <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-purple-600 rounded-3xl flex items-center justify-center text-white shadow-xl border-2 border-purple-400/30">
                             <i className="fa-solid fa-bed"></i>
                          </div>
                          <div className="min-w-0">
                             <p className="text-sm font-black uppercase italic tracking-tighter truncate max-w-[150px]">{lodge.name}</p>
                             <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Station Phone: {lodge.phone}</p>
                          </div>
                       </div>
                       <div className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-4 py-1.5 rounded-full uppercase border border-emerald-500/20 italic">Verified Station</div>
                    </div>
                 ))}
                 {allUsers.filter(u => u.role === Role.LODGE).length === 0 && (
                   <div className="py-20 text-center opacity-10">
                      <i className="fa-solid fa-hotel text-6xl mb-4"></i>
                      <p className="text-[10px] font-black uppercase tracking-[0.5em]">No Stay Nodes Synced</p>
                   </div>
                 )}
              </div>
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