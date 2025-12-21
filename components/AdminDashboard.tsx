
import React, { useState, useMemo } from 'react';
import { User, Booking, Role, SystemLog, CouncilOrder, BookingStatus, Feedback } from '../types';
import { SUPER_ADMIN, LANGUAGES, CATEGORIES } from '../constants';
import Map from './Map';

interface AdminDashboardProps {
  user: User;
  logout: () => void;
  bookings: Booking[];
  allUsers: User[];
  councilOrders: CouncilOrder[];
  feedbacks: Feedback[];
  systemLogs: SystemLog[];
  onToggleBlock: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onToggleVerification: (userId: string) => void;
  onUpdateUserRole: (userId: string, role: Role) => void;
  onMarkFeedbackRead: (id: string) => void;
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

type AdminView = 'stats' | 'missions' | 'approvals' | 'feedback' | 'registry' | 'security';

interface NavItem {
  id: AdminView;
  icon: string;
  label: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user, logout, allUsers, bookings, councilOrders, feedbacks, onToggleVerification, onMarkFeedbackRead, adminNumbers, onAddAdmin, onRemoveAdmin, t, onToggleViewMode, onToggleTheme, isDarkMode, onLanguageChange, sysDefaultLang, onUpdateUserRole, onToggleBlock
}) => {
  const [view, setView] = useState<AdminView>('stats');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const stats = useMemo(() => {
    const commissions = bookings.filter(b => b.isPaid).reduce((acc, b) => acc + b.commission, 0);
    const subscriptions = allUsers.filter(u => u.role === Role.PROVIDER && u.subscriptionExpiry && u.subscriptionExpiry > Date.now()).length * 20;
    const pendingApprovals = allUsers.filter(u => u.role === Role.PROVIDER && !u.isVerified).length;
    const unreadFeedback = feedbacks.filter(f => !f.isRead).length;
    return { commissions, subscriptions, pendingApprovals, unreadFeedback, activeUsers: allUsers.length };
  }, [bookings, allUsers, feedbacks]);

  const navItems: NavItem[] = [
    { id: 'stats', icon: 'fa-chart-pie', label: 'ROI' },
    { id: 'approvals', icon: 'fa-user-check', label: 'Auth' },
    { id: 'feedback', icon: 'fa-comments', label: 'Buzz' },
    { id: 'missions', icon: 'fa-route', label: 'Ops' },
    { id: 'registry', icon: 'fa-users', label: 'Nodes' }
  ];

  const pendingProviders = useMemo(() => 
    allUsers.filter(u => u.role === Role.PROVIDER && !u.isVerified), 
  [allUsers]);

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING: return 'text-amber-500 bg-amber-500/10';
      case BookingStatus.COMPLETED: return 'text-emerald-500 bg-emerald-500/10';
      case BookingStatus.CANCELLED: return 'text-red-500 bg-red-500/10';
      default: return 'text-blue-500 bg-blue-500/10';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white relative overflow-hidden">
      <header className="px-5 py-6 border-b border-white/5 flex justify-between items-center bg-slate-950/90 backdrop-blur-xl z-50 safe-pt">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center border-2 border-red-400/20">
            <i className="fa-solid fa-tower-broadcast text-xs animate-pulse"></i>
          </div>
          <div>
            <h2 className="text-base font-black uppercase italic leading-none">Admin Console</h2>
            <p className="text-[7px] text-slate-500 uppercase font-black tracking-[0.2em] mt-1">Corridor Oversight</p>
          </div>
        </div>
        <div className="flex gap-2">
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
              {v.id === 'feedback' && stats.unreadFeedback > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
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
                
                <div className="mt-8 grid grid-cols-2 gap-4">
                   <div className="bg-black/40 p-4 rounded-3xl border border-white/5">
                      <p className="text-[7px] font-black uppercase text-white/50 mb-1 italic">Trade Tax</p>
                      <p className="text-base font-black">ZMW {stats.commissions.toFixed(2)}</p>
                   </div>
                   <div className="bg-black/40 p-4 rounded-3xl border border-white/5">
                      <p className="text-[7px] font-black uppercase text-white/50 mb-1 italic">Partner Fees</p>
                      <p className="text-base font-black">ZMW {stats.subscriptions.toFixed(2)}</p>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 p-6 rounded-[32px] border border-white/5">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Active Nodes</p>
                 <p className="text-2xl font-black italic text-white">{stats.activeUsers}</p>
               </div>
               <div className="bg-white/5 p-6 rounded-[32px] border border-white/5">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Unread Buzz</p>
                 <p className={`text-2xl font-black italic ${stats.unreadFeedback > 0 ? 'text-blue-500' : 'text-slate-500'}`}>{stats.unreadFeedback}</p>
               </div>
             </div>
          </div>
        )}

        {view === 'approvals' && (
          <div className="space-y-6 animate-fade-in">
             <div className="px-2">
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Partner Admission</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">KYC Review Mandatory</p>
             </div>
             
             <div className="space-y-4">
                {pendingProviders.length === 0 && (
                   <div className="py-20 text-center opacity-30">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Pending Admissions</p>
                   </div>
                )}
                {pendingProviders.map(p => (
                   <div key={p.id} className="bg-white/5 border border-white/10 rounded-[35px] overflow-hidden shadow-2xl">
                      <div className="p-6">
                         <div className="flex items-center gap-5 mb-6">
                            <div className="w-16 h-16 rounded-[24px] bg-slate-900 border-2 border-blue-600/30 overflow-hidden flex-shrink-0">
                               {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl font-black bg-slate-800">{p.name.charAt(0)}</div>}
                            </div>
                            <div className="flex-1">
                               <h4 className="text-base font-black italic text-white uppercase">{p.name}</h4>
                               <p className="text-[9px] font-bold text-slate-500 uppercase mt-2">{p.phone}</p>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 gap-3 mb-6">
                            <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                               <p className="text-[7px] font-black uppercase text-slate-500 tracking-widest mb-1 italic">License ID</p>
                               <p className="text-[10px] font-bold">{p.licenseNumber || 'PENDING'}</p>
                            </div>
                            <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                               <p className="text-[7px] font-black uppercase text-slate-500 tracking-widest mb-1 italic">Home Node</p>
                               <p className="text-[10px] font-bold">{p.homeAddress || 'PENDING'}</p>
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => onUpdateUserRole(p.id, Role.CUSTOMER)} className="py-4 bg-white/5 text-red-500 border border-white/5 rounded-2xl text-[9px] font-black uppercase italic">Reject</button>
                            <button onClick={() => onToggleVerification(p.id)} className="py-4 bg-emerald-600 text-white rounded-2xl text-[9px] font-black uppercase italic shadow-lg shadow-emerald-600/20">Authorize</button>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {view === 'feedback' && (
           <div className="space-y-6 animate-fade-in">
              <div className="px-2">
                 <h3 className="text-xl font-black italic uppercase tracking-tighter">Customer Buzz</h3>
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Pulse of the Corridor</p>
              </div>
              
              <div className="space-y-4">
                 {feedbacks.length === 0 && (
                    <div className="py-20 text-center opacity-30">
                       <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Feedback Recorded</p>
                    </div>
                 )}
                 {feedbacks.map(f => (
                    <div key={f.id} onClick={() => onMarkFeedbackRead(f.id)} className={`bg-white/5 p-6 rounded-[35px] border ${f.isRead ? 'border-white/5 opacity-60' : 'border-blue-500/30'} transition-all`}>
                       <div className="flex justify-between items-start mb-4">
                          <div>
                             <p className="text-[8px] font-black text-slate-500 uppercase italic mb-1">{new Date(f.timestamp).toLocaleDateString()}</p>
                             <h4 className="text-xs font-black text-white italic">{f.userPhone}</h4>
                          </div>
                          <div className="flex gap-0.5">
                             {[1,2,3,4,5].map(star => (
                                <i key={star} className={`fa-solid fa-star text-[7px] ${star <= f.rating ? 'text-amber-500' : 'text-slate-800'}`}></i>
                             ))}
                          </div>
                       </div>
                       <p className="text-[11px] text-slate-400 italic leading-relaxed">"{f.comment}"</p>
                       {f.bookingId && <p className="mt-3 text-[7px] font-black text-blue-500 uppercase tracking-widest">Linked Mission: {f.bookingId}</p>}
                    </div>
                 ))}
              </div>
           </div>
        )}

        {view === 'missions' && (
           <div className="space-y-4">
              {bookings.map(b => (
                <div key={b.id} className="bg-white/5 p-6 rounded-[35px] border border-white/5">
                   <div className="flex justify-between items-start mb-4">
                      <h4 className="text-xs font-black text-blue-500 italic uppercase">{b.category} • {b.id}</h4>
                      <span className={`text-[7px] font-black px-3 py-1 rounded-full uppercase ${getStatusColor(b.status)}`}>{b.status}</span>
                   </div>
                   <p className="text-[10px] text-slate-400 font-medium">From: {b.customerPhone}</p>
                   {b.providerId && <p className="text-[10px] text-blue-400 font-black mt-1">Assigned to Node: {b.providerId}</p>}
                </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
