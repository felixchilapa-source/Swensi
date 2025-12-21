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
  user, logout, allUsers, bookings, councilOrders, onToggleVerification, adminNumbers, onAddAdmin, onRemoveAdmin, t, onToggleViewMode, onToggleTheme, isDarkMode, onLanguageChange, sysDefaultLang 
}) => {
  const [view, setView] = useState<'stats' | 'registry' | 'council' | 'security'>('stats');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  
  const stats = useMemo(() => {
    const commissions = bookings.filter(b => b.isPaid).reduce((acc, b) => acc + b.commission, 0);
    const subscriptions = allUsers.filter(u => u.role === Role.PROVIDER && u.subscriptionExpiry).length * 10;
    const councilTreasury = councilOrders.reduce((acc, co) => acc + co.levyAmount, 0);
    return { commissions, subscriptions, councilTreasury, activeUsers: allUsers.length };
  }, [bookings, allUsers, councilOrders]);

  const navItems: NavItem[] = [
    { id: 'stats', icon: 'fa-chart-pie' },
    { id: 'registry', icon: 'fa-users' },
    { id: 'council', icon: 'fa-building-columns' },
    { id: 'security', icon: 'fa-shield-halved' }
  ];

  const handleAddAdmin = () => {
    if (newAdminPhone.length < 9) return alert("Enter valid phone");
    onAddAdmin(newAdminPhone);
    setNewAdminPhone('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white no-scrollbar relative overflow-hidden">
      <header className="px-5 py-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-slate-950/90 backdrop-blur-xl z-50 safe-pt">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg border-2 border-red-400/20"><i className="fa-solid fa-shield-halved text-xs"></i></div>
          <div>
            <h2 className="text-base font-black tracking-tighter uppercase italic leading-none">Swensi Command</h2>
            <p className="text-[7px] text-slate-500 uppercase font-black tracking-[0.2em] mt-1">Revenue Terminal</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onToggleTheme} className="w-10 h-10 rounded-2xl bg-white/5 text-slate-300 flex items-center justify-center border border-white/10 active:scale-95 transition-all">
             <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-500' : 'fa-moon text-blue-500'} text-xs`}></i>
          </button>
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
                <p className="text-white/60 text-[9px] font-black uppercase mb-1 tracking-widest italic">Consolidated Yield</p>
                <p className="text-5xl font-black italic tracking-tighter">ZMW {(stats.commissions + stats.subscriptions).toFixed(2)}</p>
                
                <div className="mt-8 grid grid-cols-1 gap-4">
                   <div className="bg-black/40 p-5 rounded-3xl border border-white/5 flex justify-between items-center">
                      <div>
                        <p className="text-[7px] font-black uppercase text-white/50 mb-1 italic">Trade Commissions</p>
                        <p className="text-lg font-black tracking-tight">ZMW {stats.commissions.toFixed(2)}</p>
                      </div>
                      <i className="fa-solid fa-hand-holding-dollar text-red-500"></i>
                   </div>
                   <div className="bg-black/40 p-5 rounded-3xl border border-white/5 flex justify-between items-center">
                      <div>
                        <p className="text-[7px] font-black uppercase text-white/50 mb-1 italic">Subscription Fees</p>
                        <p className="text-lg font-black tracking-tight">ZMW {stats.subscriptions.toFixed(2)}</p>
                      </div>
                      <i className="fa-solid fa-calendar-check text-emerald-500"></i>
                   </div>
                </div>
             </div>
          </div>
        )}

        {view === 'security' && (
           <div className="space-y-6 animate-fade-in">
              {/* System Global Config */}
              <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 space-y-6">
                 <h3 className="text-xs font-black uppercase tracking-widest italic ml-2">System Preferences</h3>
                 <div className="grid grid-cols-2 gap-3">
                   {LANGUAGES.map(lang => (
                     <button 
                        key={lang.code}
                        onClick={() => onLanguageChange(lang.code)}
                        className={`p-4 rounded-2xl border flex items-center justify-center gap-2 transition-all ${sysDefaultLang === lang.code ? 'bg-red-600 border-red-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-500'}`}
                      >
                       <span className="text-lg">{lang.flag}</span>
                       <span className="text-[9px] font-black uppercase italic">{lang.name}</span>
                     </button>
                   ))}
                 </div>
              </div>

              <div className="bg-white/5 p-6 rounded-[32px] border border-white/10">
                 <h3 className="text-xs font-black uppercase tracking-widest mb-4 italic">Authorize New Admin</h3>
                 <div className="flex gap-2">
                    <input 
                      type="tel" 
                      value={newAdminPhone} 
                      onChange={(e) => setNewAdminPhone(e.target.value)}
                      placeholder="09XXXXXXXX"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold outline-none focus:border-red-500" 
                    />
                    <button onClick={handleAddAdmin} className="bg-red-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Add</button>
                 </div>
              </div>
           </div>
        )}

        {view === 'registry' && (
           <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-black italic tracking-tighter uppercase px-2">Node Registry</h3>
              <div className="space-y-3">
                 {allUsers.map(u => (
                    <div key={u.id} className="bg-white/5 p-5 rounded-3xl border border-white/10 flex flex-col gap-4">
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black italic shadow-lg border-2 ${u.role === Role.PROVIDER ? 'bg-blue-600 border-blue-400/20' : 'bg-slate-800 border-slate-700'}`}>
                                {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover rounded-[14px]" /> : u.name.charAt(0)}
                             </div>
                             <div>
                                <p className="text-xs font-black uppercase italic tracking-tight">{u.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                   <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${u.subscriptionExpiry && u.subscriptionExpiry > Date.now() ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                     {u.role === Role.PROVIDER ? (u.subscriptionExpiry && u.subscriptionExpiry > Date.now() ? 'Subscribed' : 'Unpaid') : u.role}
                                   </span>
                                </div>
                             </div>
                          </div>
                          <button onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)} className="w-9 h-9 rounded-xl bg-white/5 text-slate-400 border border-white/10 flex items-center justify-center">
                            <i className="fa-solid fa-eye text-[10px]"></i>
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
