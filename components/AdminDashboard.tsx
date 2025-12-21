
import React, { useState, useMemo } from 'react';
import { User, Booking, Role, SystemLog, CouncilOrder, BookingStatus } from '../types';
import { SUPER_ADMIN, LANGUAGES, CATEGORIES } from '../constants';
import Map from './Map';

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

type AdminView = 'stats' | 'missions' | 'approvals' | 'registry' | 'security';

interface NavItem {
  id: AdminView;
  icon: string;
  label: string;
}

// Fix: added missing onToggleBlock, onDeleteUser and systemLogs to props destructuring to resolve build errors
const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user, logout, allUsers, bookings, councilOrders, systemLogs, onToggleBlock, onDeleteUser, onToggleVerification, adminNumbers, onAddAdmin, onRemoveAdmin, t, onToggleViewMode, onToggleTheme, isDarkMode, onLanguageChange, sysDefaultLang, onUpdateUserRole
}) => {
  const [view, setView] = useState<AdminView>('stats');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const stats = useMemo(() => {
    const commissions = bookings.filter(b => b.isPaid).reduce((acc, b) => acc + b.commission, 0);
    const subscriptions = allUsers.filter(u => u.role === Role.PROVIDER && u.subscriptionExpiry && u.subscriptionExpiry > Date.now()).length * 20;
    const councilTreasury = councilOrders.reduce((acc, co) => acc + co.levyAmount, 0);
    const pendingApprovals = allUsers.filter(u => u.role === Role.PROVIDER && !u.isVerified).length;
    return { commissions, subscriptions, councilTreasury, activeUsers: allUsers.length, pendingApprovals };
  }, [bookings, allUsers, councilOrders]);

  const navItems: NavItem[] = [
    { id: 'stats', icon: 'fa-chart-pie', label: 'ROI' },
    { id: 'missions', icon: 'fa-route', label: 'Missions' },
    { id: 'approvals', icon: 'fa-user-check', label: 'Auth' },
    { id: 'registry', icon: 'fa-users', label: 'Nodes' },
    { id: 'security', icon: 'fa-shield-halved', label: 'Sys' }
  ];

  const pendingProviders = useMemo(() => 
    allUsers.filter(u => u.role === Role.PROVIDER && !u.isVerified), 
  [allUsers]);

  const handleAddAdmin = () => {
    if (newAdminPhone.length < 9) return alert("Enter valid phone");
    onAddAdmin(newAdminPhone);
    setNewAdminPhone('');
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING: return 'text-amber-500 bg-amber-500/10';
      case BookingStatus.ACCEPTED: return 'text-blue-500 bg-blue-500/10';
      case BookingStatus.COMPLETED: return 'text-emerald-500 bg-emerald-500/10';
      case BookingStatus.CANCELLED: return 'text-red-500 bg-red-500/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white no-scrollbar relative overflow-hidden">
      <header className="px-5 py-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-slate-950/90 backdrop-blur-xl z-50 safe-pt">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg border-2 border-red-400/20">
            <i className="fa-solid fa-tower-broadcast text-xs animate-pulse"></i>
          </div>
          <div>
            <h2 className="text-base font-black tracking-tighter uppercase italic leading-none">Command Hub</h2>
            <p className="text-[7px] text-slate-500 uppercase font-black tracking-[0.2em] mt-1">Global Trade Oversight</p>
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

      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-28 no-scrollbar">
        <nav className="flex bg-white/5 p-1 rounded-2xl border border-white/5 sticky top-0 z-40 backdrop-blur-md">
          {navItems.map((v) => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`flex-1 py-3 rounded-xl text-[7px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1 relative ${view === v.id ? 'bg-red-600 text-white shadow-xl' : 'text-slate-500'}`}>
              <i className={`fa-solid ${v.icon} text-[10px]`}></i> {v.label}
              {v.id === 'approvals' && stats.pendingApprovals > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 bg-white rounded-full animate-ping"></span>
              )}
            </button>
          ))}
        </nav>

        {view === 'stats' && (
          <div className="space-y-4 animate-fade-in">
             <div className="bg-gradient-to-br from-red-600 to-slate-900 p-8 rounded-[40px] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-12 -translate-y-12"></div>
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
                        <p className="text-[7px] font-black uppercase text-white/50 mb-1 italic">Subscription Revenue</p>
                        <p className="text-lg font-black tracking-tight">ZMW {stats.subscriptions.toFixed(2)}</p>
                      </div>
                      <i className="fa-solid fa-calendar-check text-emerald-500"></i>
                   </div>
                   <div className="bg-black/40 p-5 rounded-3xl border border-white/5 flex justify-between items-center">
                      <div>
                        <p className="text-[7px] font-black uppercase text-white/50 mb-1 italic">Council Treasury (Levies)</p>
                        <p className="text-lg font-black tracking-tight">ZMW {stats.councilTreasury.toFixed(2)}</p>
                      </div>
                      <i className="fa-solid fa-building-columns text-blue-500"></i>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 p-6 rounded-[32px] border border-white/5">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Active Nodes</p>
                 <p className="text-2xl font-black italic text-white">{stats.activeUsers}</p>
               </div>
               <div className="bg-white/5 p-6 rounded-[32px] border border-white/5">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Pending Auth</p>
                 <p className={`text-2xl font-black italic ${stats.pendingApprovals > 0 ? 'text-red-500' : 'text-slate-500'}`}>{stats.pendingApprovals}</p>
               </div>
             </div>
          </div>
        )}

        {view === 'missions' && (
          <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center px-2">
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Corridor Activity</h3>
                <span className="text-[8px] font-black bg-white/10 px-3 py-1 rounded-full text-slate-400 uppercase tracking-widest">{bookings.length} Gigs</span>
             </div>
             <div className="space-y-4">
                {bookings.length === 0 && (
                   <div className="py-20 text-center opacity-20 italic text-[10px] font-black uppercase tracking-[0.3em]">No Signal in the corridor</div>
                )}
                {bookings.map(b => (
                  <div key={b.id} className="bg-white/5 border border-white/10 rounded-[35px] overflow-hidden shadow-2xl transition-all">
                     <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest italic">{b.category}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{new Date(b.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <h4 className="text-lg font-black italic tracking-tighter text-white uppercase mt-1">{b.id}</h4>
                           </div>
                           <span className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${getStatusColor(b.status)}`}>
                             {b.status}
                           </span>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black border border-white/5">
                                 {b.customerPhone.slice(-2)}
                              </div>
                              <div className="flex-1">
                                 <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">Customer Node</p>
                                 <p className="text-[10px] font-bold text-white mt-0.5">{b.customerPhone}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">Value</p>
                                 <p className="text-[10px] font-bold text-emerald-500 mt-0.5">ZMW {b.price}</p>
                              </div>
                           </div>

                           <div className="p-4 bg-black/30 rounded-2xl border border-white/5">
                              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                                <i className="fa-solid fa-quote-left mr-2 text-blue-500 opacity-50"></i>
                                {b.description || 'No additional directives recorded.'}
                              </p>
                           </div>

                           {b.providerId && (
                             <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                               <i className="fa-solid fa-truck-fast text-blue-500 text-[10px]"></i>
                               <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest italic">
                                 Assigned to Agent: <span className="text-blue-400">{b.providerId}</span>
                               </p>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {view === 'approvals' && (
          <div className="space-y-6 animate-fade-in">
             <div className="px-2">
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Partner Approvals</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">KYC Review Queue</p>
             </div>
             
             <div className="space-y-4">
                {pendingProviders.length === 0 && (
                   <div className="py-20 text-center space-y-4 opacity-30">
                      <i className="fa-solid fa-circle-check text-4xl"></i>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">All Agents Authorized</p>
                   </div>
                )}
                {pendingProviders.map(p => (
                   <div key={p.id} className="bg-white/5 border border-white/10 rounded-[35px] overflow-hidden animate-slide-up shadow-2xl">
                      <div className="p-6">
                         <div className="flex items-center gap-5 mb-6">
                            <div className="w-16 h-16 rounded-[24px] bg-slate-900 border-2 border-blue-600/30 overflow-hidden shadow-inner flex-shrink-0">
                               {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl font-black italic bg-slate-800">{p.name.charAt(0)}</div>}
                            </div>
                            <div className="flex-1">
                               <h4 className="text-base font-black italic text-white uppercase leading-none tracking-tight">{p.name}</h4>
                               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">{p.phone}</p>
                               <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[7px] font-black bg-blue-600/10 text-blue-500 px-2 py-0.5 rounded-full uppercase italic tracking-widest">Partner Applicant</span>
                               </div>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 gap-3 mb-6">
                            <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                               <p className="text-[7px] font-black uppercase text-slate-500 tracking-widest mb-1 italic">Trade License / ID</p>
                               <p className="text-[10px] font-bold text-slate-200">{p.licenseNumber || 'NOT PROVIDED'}</p>
                            </div>
                            <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                               <p className="text-[7px] font-black uppercase text-slate-500 tracking-widest mb-1 italic">Verified Address</p>
                               <p className="text-[10px] font-bold text-slate-200">{p.homeAddress || 'NOT PROVIDED'}</p>
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-3">
                            <button 
                               onClick={() => onUpdateUserRole(p.id, Role.CUSTOMER)}
                               className="py-4 bg-white/5 hover:bg-red-500/10 text-red-500 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all italic"
                            >
                               Decline
                            </button>
                            <button 
                               onClick={() => onToggleVerification(p.id)}
                               className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all italic"
                            >
                               Authorize Node
                            </button>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {view === 'registry' && (
           <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center px-2">
                 <h3 className="text-xl font-black italic uppercase tracking-tighter">Node Registry</h3>
                 <span className="text-[8px] font-black bg-white/10 px-3 py-1 rounded-full text-slate-400 uppercase tracking-widest">{allUsers.length} Units</span>
              </div>
              <div className="space-y-3">
                 {allUsers.map(u => (
                    <div key={u.id} className="bg-white/5 p-5 rounded-3xl border border-white/10 flex flex-col gap-4 group">
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black italic shadow-lg border-2 ${u.role === Role.PROVIDER ? 'bg-blue-600 border-blue-400/20' : (u.role === Role.ADMIN ? 'bg-red-600 border-red-400/20' : 'bg-slate-800 border-slate-700')}`}>
                                {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover rounded-[14px]" /> : u.name.charAt(0)}
                             </div>
                             <div>
                                <p className="text-xs font-black uppercase italic tracking-tight">{u.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                   <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${u.role === Role.PROVIDER ? (u.isVerified ? 'bg-blue-500/20 text-blue-500' : 'bg-amber-500/20 text-amber-500') : 'bg-slate-700 text-slate-400'}`}>
                                     {u.role} {u.role === Role.PROVIDER && !u.isVerified && '• PENDING'}
                                   </span>
                                   {!u.isActive && <span className="text-[7px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">Suspended</span>}
                                </div>
                             </div>
                          </div>
                          <button onClick={() => setExpandedId(expandedId === u.id ? null : u.id)} className="w-9 h-9 rounded-xl bg-white/5 text-slate-400 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
                            <i className={`fa-solid ${expandedId === u.id ? 'fa-chevron-up' : 'fa-eye'} text-[10px]`}></i>
                          </button>
                       </div>

                       {expandedId === u.id && (
                          <div className="pt-4 border-t border-white/5 space-y-4 animate-slide-up">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/20 p-3 rounded-2xl">
                                   <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest italic mb-1">Escrow Balance</p>
                                   <p className="text-xs font-black text-emerald-500 italic">ZMW {u.balance.toFixed(2)}</p>
                                </div>
                                <div className="bg-black/20 p-3 rounded-2xl">
                                   <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest italic mb-1">ID</p>
                                   <p className="text-xs font-black text-slate-300 italic">{u.id}</p>
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <button 
                                   onClick={() => onToggleBlock(u.id)}
                                   className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest italic border ${u.isActive ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'}`}
                                >
                                   {u.isActive ? 'Suspend Unit' : 'Restore Unit'}
                                </button>
                                {u.role !== Role.ADMIN && (
                                   <button 
                                      onClick={() => onUpdateUserRole(u.id, u.role === Role.PROVIDER ? Role.CUSTOMER : Role.PROVIDER)}
                                      className="flex-1 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest italic border border-blue-500/30 text-blue-500 bg-blue-500/5"
                                   >
                                      Swap Role
                                   </button>
                                )}
                             </div>
                          </div>
                       )}
                    </div>
                 ))}
              </div>
           </div>
        )}

        {view === 'security' && (
           <div className="space-y-6 animate-fade-in">
              <div className="bg-white/5 p-6 rounded-[40px] border border-white/10 space-y-6">
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

              <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 space-y-6">
                 <h3 className="text-xs font-black uppercase tracking-widest italic ml-2">Authorize Super Admin</h3>
                 <div className="flex gap-3">
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-[20px] px-5 py-4 flex items-center">
                       <span className="text-slate-500 text-[10px] font-black mr-3 italic">+260</span>
                       <input 
                         type="tel" 
                         value={newAdminPhone} 
                         onChange={(e) => setNewAdminPhone(e.target.value)}
                         placeholder="09XXXXXXXX"
                         className="flex-1 bg-transparent text-sm font-black outline-none text-white italic" 
                       />
                    </div>
                    <button 
                       onClick={handleAddAdmin}
                       className="bg-white text-slate-900 px-6 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all italic"
                    >
                       Grant
                    </button>
                 </div>
                 
                 <div className="space-y-2 mt-4">
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] italic ml-2">Active Controllers</p>
                    <div className="flex flex-wrap gap-2">
                       {adminNumbers.map(admin => (
                          <div key={admin} className="bg-white/5 px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
                             <span className="text-[9px] font-black italic text-slate-300">{admin}</span>
                             {admin !== SUPER_ADMIN && (
                                <button onClick={() => onRemoveAdmin(admin)} className="text-red-500 text-[10px]"><i className="fa-solid fa-xmark"></i></button>
                             )}
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="p-4 text-center opacity-30">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Swensi Security Layer v2.4</p>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
