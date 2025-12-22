
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
  onUpdateBooking?: (id: string, updates: Partial<Booking>) => void;
  onAddLog: (action: string, targetId?: string, severity?: 'INFO' | 'WARNING' | 'CRITICAL') => void;
}

type AdminView = 'stats' | 'missions' | 'approvals' | 'feedback' | 'registry' | 'security';

interface NavItem {
  id: AdminView;
  icon: string;
  label: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user, logout, allUsers, bookings, councilOrders, feedbacks, systemLogs, onToggleVerification, onMarkFeedbackRead, onToggleBlock, onUpdateUserRole, t, onToggleViewMode, onUpdateBooking, onAddLog 
}) => {
  const isWorkflow = user.role === Role.WORKFLOW;
  const [view, setView] = useState<AdminView>(isWorkflow ? 'approvals' : 'stats');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reassign Modal State
  const [reassignBookingId, setReassignBookingId] = useState<string | null>(null);
  
  // Profile Viewer State
  const [selectedUserProfile, setSelectedUserProfile] = useState<User | null>(null);
  
  const stats = useMemo(() => {
    const commissions = bookings.filter(b => b.isPaid).reduce((acc, b) => acc + b.commission, 0);
    const subscriptions = allUsers.filter(u => u.role === Role.PROVIDER && u.subscriptionExpiry && u.subscriptionExpiry > Date.now()).length * 20;
    const pendingApprovals = allUsers.filter(u => u.role === Role.PROVIDER && !u.isVerified).length;
    const unreadFeedback = feedbacks.filter(f => !f.isRead).length;
    return { commissions, subscriptions, pendingApprovals, unreadFeedback, activeUsers: allUsers.length };
  }, [bookings, allUsers, feedbacks]);

  const navItems = useMemo((): NavItem[] => {
    const fullItems: NavItem[] = [
      { id: 'stats', icon: 'fa-chart-pie', label: 'ROI' },
      { id: 'approvals', icon: 'fa-user-check', label: 'Auth' },
      { id: 'feedback', icon: 'fa-comments', label: 'Buzz' },
      { id: 'missions', icon: 'fa-route', label: 'Ops' },
      { id: 'registry', icon: 'fa-users', label: 'Nodes' },
      { id: 'security', icon: 'fa-shield-cat', label: 'Logs' }
    ];
    
    if (isWorkflow) {
      return fullItems.filter(item => ['approvals', 'registry', 'security'].includes(item.id));
    }
    return fullItems;
  }, [isWorkflow]);

  const pendingProviders = useMemo(() => 
    allUsers.filter(u => u.role === Role.PROVIDER && !u.isVerified), 
  [allUsers]);

  const filteredRegistry = useMemo(() => {
    return allUsers.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.phone.includes(searchQuery)
    );
  }, [allUsers, searchQuery]);

  // Logic to find providers suitable for a booking being reassigned
  const eligibleProvidersForReassign = useMemo(() => {
    if (!reassignBookingId) return [];
    const booking = bookings.find(b => b.id === reassignBookingId);
    if (!booking) return [];
    return allUsers.filter(u => 
      u.role === Role.PROVIDER && 
      u.isVerified && 
      u.isActive && 
      u.serviceCategories?.includes(booking.category)
    );
  }, [reassignBookingId, bookings, allUsers]);

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING: return 'text-amber-500 bg-amber-500/10';
      case BookingStatus.COMPLETED: return 'text-emerald-500 bg-emerald-500/10';
      case BookingStatus.CANCELLED: return 'text-red-500 bg-red-500/10';
      default: return 'text-blue-500 bg-blue-500/10';
    }
  };

  const handleReassign = (providerId: string) => {
     if (reassignBookingId && onUpdateBooking) {
       const provider = allUsers.find(u => u.id === providerId);
       onUpdateBooking(reassignBookingId, { 
         providerId, 
         status: BookingStatus.ACCEPTED 
       });
       onAddLog(`Reassigned booking ${reassignBookingId} to ${provider?.name || providerId}`, reassignBookingId, 'WARNING');
       setReassignBookingId(null);
     }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white relative overflow-hidden transition-colors duration-300">
      <header className="px-5 py-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-white/80 dark:bg-slate-950/90 backdrop-blur-xl z-50 safe-pt shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${isWorkflow ? 'bg-amber-600 border-amber-400/20' : 'bg-red-600 border-red-400/20'}`}>
            <i className={`fa-solid ${isWorkflow ? 'fa-check-double' : 'fa-tower-broadcast'} text-xs animate-pulse text-white`}></i>
          </div>
          <div>
            <h2 className="text-base font-black uppercase italic leading-none">{isWorkflow ? 'Workflow Console' : 'Admin Console'}</h2>
            <p className="text-[7px] text-slate-500 uppercase font-black tracking-[0.2em] mt-1">{isWorkflow ? 'Approval Pipeline' : 'Corridor Oversight'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onToggleViewMode} className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-500 flex items-center justify-center border border-emerald-600/20 active:scale-95 transition-all"><i className="fa-solid fa-cart-plus"></i></button>
          <button onClick={logout} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 active:scale-95 transition-all"><i className="fa-solid fa-power-off text-xs"></i></button>
        </div>
      </header>

      {/* USER PROFILE MODAL */}
      {selectedUserProfile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
           <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[20px] bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
                       {selectedUserProfile.avatarUrl ? (
                          <img src={selectedUserProfile.avatarUrl} className="w-full h-full object-cover" />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl font-black text-slate-400">{selectedUserProfile.name.charAt(0)}</div>
                       )}
                    </div>
                    <div>
                       <h3 className="text-lg font-black italic uppercase text-slate-900 dark:text-white leading-none">{selectedUserProfile.name}</h3>
                       <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">{selectedUserProfile.role}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedUserProfile(null)} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors">
                    <i className="fa-solid fa-xmark"></i>
                 </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                 {/* Status Grid */}
                 <div className="grid grid-cols-3 gap-3">
                    <div className={`p-4 rounded-2xl border text-center ${selectedUserProfile.isActive ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}>
                       <i className={`fa-solid ${selectedUserProfile.isActive ? 'fa-check-circle' : 'fa-ban'} text-xl mb-1`}></i>
                       <p className="text-[8px] font-black uppercase">Status</p>
                       <p className="text-[10px] font-black uppercase">{selectedUserProfile.isActive ? 'Active' : 'Blocked'}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border text-center ${selectedUserProfile.isVerified ? 'bg-blue-500/5 border-blue-500/20 text-blue-600' : 'bg-amber-500/5 border-amber-500/20 text-amber-500'}`}>
                       <i className={`fa-solid ${selectedUserProfile.isVerified ? 'fa-shield-check' : 'fa-shield-halved'} text-xl mb-1`}></i>
                       <p className="text-[8px] font-black uppercase">KYC</p>
                       <p className="text-[10px] font-black uppercase">{selectedUserProfile.isVerified ? 'Verified' : 'Pending'}</p>
                    </div>
                    <div className="p-4 rounded-2xl border bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-center text-slate-600 dark:text-slate-300">
                       <i className="fa-solid fa-star text-xl mb-1"></i>
                       <p className="text-[8px] font-black uppercase">Trust</p>
                       <p className="text-[10px] font-black uppercase">{selectedUserProfile.trustScore}%</p>
                    </div>
                 </div>

                 {/* Financials */}
                 <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-3xl space-y-3">
                    <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Financial Overview</h4>
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-3">
                       <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Wallet Balance</span>
                       <span className="text-sm font-black text-slate-900 dark:text-white">ZMW {selectedUserProfile.balance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Member Since</span>
                       <span className="text-xs font-medium text-slate-500">{new Date(selectedUserProfile.memberSince).toLocaleDateString()}</span>
                    </div>
                 </div>

                 {/* Contact & KYC Info */}
                 <div className="space-y-4">
                    <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Identity & Location</h4>
                    
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-white/10">
                       <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500"><i className="fa-solid fa-phone"></i></div>
                       <div>
                          <p className="text-[8px] font-black uppercase text-slate-400">Phone Number</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedUserProfile.phone}</p>
                       </div>
                    </div>

                    {selectedUserProfile.homeAddress && (
                       <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-white/10">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500"><i className="fa-solid fa-map-pin"></i></div>
                          <div>
                             <p className="text-[8px] font-black uppercase text-slate-400">Address / Landmark</p>
                             <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedUserProfile.homeAddress}</p>
                          </div>
                       </div>
                    )}

                    {selectedUserProfile.licenseNumber && (
                       <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-white/10">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500"><i className="fa-solid fa-id-card"></i></div>
                          <div>
                             <p className="text-[8px] font-black uppercase text-slate-400">License ID</p>
                             <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedUserProfile.licenseNumber}</p>
                          </div>
                       </div>
                    )}
                 </div>

                 {/* Action Buttons */}
                 <div className="pt-4 grid grid-cols-2 gap-4">
                    <button 
                       onClick={() => { onToggleBlock(selectedUserProfile.id); onAddLog(`Toggled Block: ${selectedUserProfile.name}`, selectedUserProfile.id, 'WARNING'); setSelectedUserProfile(prev => prev ? {...prev, isActive: !prev.isActive} : null); }}
                       className={`py-4 rounded-2xl font-black text-[10px] uppercase italic ${selectedUserProfile.isActive ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'}`}
                    >
                       {selectedUserProfile.isActive ? 'Block Account' : 'Unblock Account'}
                    </button>
                    <button 
                       onClick={() => { onToggleVerification(selectedUserProfile.id); onAddLog(`Toggled Verification: ${selectedUserProfile.name}`, selectedUserProfile.id, 'INFO'); setSelectedUserProfile(prev => prev ? {...prev, isVerified: !prev.isVerified} : null); }}
                       className={`py-4 rounded-2xl font-black text-[10px] uppercase italic ${selectedUserProfile.isVerified ? 'bg-slate-100 dark:bg-white/10 text-slate-500' : 'bg-blue-600 text-white shadow-lg'}`}
                    >
                       {selectedUserProfile.isVerified ? 'Revoke Verify' : 'Approve KYC'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {reassignBookingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
           <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[35px] p-8 shadow-2xl relative">
              <button onClick={() => setReassignBookingId(null)} className="absolute top-6 right-6 text-slate-500"><i className="fa-solid fa-xmark"></i></button>
              <h3 className="text-xl font-black italic uppercase mb-6 text-slate-900 dark:text-white">Reassign Mission {reassignBookingId}</h3>
              <p className="text-xs text-slate-500 mb-4">Select a qualified provider to take over this order.</p>
              
              <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar">
                 {eligibleProvidersForReassign.length === 0 && <p className="text-center text-xs text-slate-500 italic py-4">No eligible providers found online.</p>}
                 {eligibleProvidersForReassign.map(p => (
                   <button key={p.id} onClick={() => handleReassign(p.id)} className="w-full bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 p-4 rounded-2xl flex items-center justify-between group transition-all text-slate-900 dark:text-white">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold text-xs">{p.name.charAt(0)}</div>
                         <div className="text-left">
                            <p className="text-sm font-bold italic">{p.name}</p>
                            <p className="text-[9px] text-slate-500">{p.phone}</p>
                         </div>
                      </div>
                      <span className="text-[9px] font-black uppercase text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">Assign</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-28 no-scrollbar">
        <nav className="flex bg-white dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/5 sticky top-0 z-40 backdrop-blur-md overflow-x-auto no-scrollbar shadow-sm">
          {navItems.map((v) => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`flex-1 min-w-[60px] py-3 rounded-xl text-[7px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1 relative ${view === v.id ? (isWorkflow ? 'bg-amber-600' : 'bg-red-600') + ' text-white shadow-xl' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
              <i className={`fa-solid ${v.icon} text-[10px]`}></i> {v.label}
              {v.id === 'approvals' && stats.pendingApprovals > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-white dark:border-slate-900"></span>
              )}
            </button>
          ))}
        </nav>

        {view === 'stats' && !isWorkflow && (
          <div className="space-y-4 animate-fade-in">
             <div className="bg-gradient-to-br from-red-600 to-slate-900 p-8 rounded-[40px] shadow-xl relative overflow-hidden text-white">
                <p className="text-white/60 text-[9px] font-black uppercase mb-1 tracking-widest italic">Consolidated Yield</p>
                <p className="text-5xl font-black italic tracking-tighter">ZMW {(stats.commissions + stats.subscriptions).toFixed(2)}</p>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white dark:bg-white/5 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Active Nodes</p>
                 <p className="text-2xl font-black italic text-slate-900 dark:text-white">{stats.activeUsers}</p>
               </div>
               <div className="bg-white dark:bg-white/5 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Unread Buzz</p>
                 <p className={`text-2xl font-black italic ${stats.unreadFeedback > 0 ? 'text-blue-500' : 'text-slate-500'}`}>{stats.unreadFeedback}</p>
               </div>
               {/* Extra stats for tablet */}
               <div className="bg-white dark:bg-white/5 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm hidden md:block">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Subscriptions</p>
                 <p className="text-2xl font-black italic text-slate-900 dark:text-white">{stats.subscriptions/20}</p>
               </div>
                <div className="bg-white dark:bg-white/5 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm hidden md:block">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Commissions</p>
                 <p className="text-2xl font-black italic text-emerald-500">ZMW {stats.commissions.toFixed(0)}</p>
               </div>
             </div>
          </div>
        )}

        {view === 'approvals' && (
          <div className="space-y-6 animate-fade-in">
             <div className="px-2">
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Partner Admission</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingProviders.length === 0 && <div className="py-20 text-center opacity-30 italic col-span-full">No Pending Admissions</div>}
                {pendingProviders.map(p => (
                   <div key={p.id} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[35px] overflow-hidden shadow-xl p-6 relative">
                      {/* Make whole card clickable for details, but keep buttons separate */}
                      <div className="flex items-center gap-5 mb-6 cursor-pointer" onClick={() => setSelectedUserProfile(p)}>
                        <div className="w-16 h-16 rounded-[24px] bg-slate-100 dark:bg-slate-900 border-2 border-blue-600/30 overflow-hidden flex-shrink-0">
                           {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl font-black bg-slate-200 dark:bg-slate-800 text-slate-500">{p.name.charAt(0)}</div>}
                        </div>
                        <div className="flex-1">
                           <h4 className="text-base font-black italic text-slate-900 dark:text-white uppercase">{p.name}</h4>
                           <p className="text-[9px] font-bold text-slate-500 uppercase mt-2">{p.phone}</p>
                           <p className="text-[8px] text-slate-600 mt-1">{p.serviceCategories?.join(', ')}</p>
                           <p className="text-[8px] text-blue-500 font-bold mt-2 underline">View Details</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => { onToggleBlock(p.id); onAddLog(`Blocked/Unblocked ${p.name}`, p.id, 'WARNING'); }} className="py-4 bg-red-500/10 text-red-500 rounded-2xl text-[9px] font-black uppercase italic hover:bg-red-500/20 transition-colors">Block</button>
                        <button onClick={() => { onToggleVerification(p.id); onAddLog(`Verified provider ${p.name}`, p.id, 'INFO'); }} className={`py-4 ${isWorkflow ? 'bg-amber-600' : 'bg-emerald-600'} text-white rounded-2xl text-[9px] font-black uppercase italic shadow-lg active:scale-95 transition-all`}>Authorize</button>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {view === 'registry' && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-white dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/10">
                <input 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search Phone or Name..." 
                  className="w-full bg-transparent border-none outline-none text-xs font-black uppercase italic tracking-widest placeholder:text-slate-400 text-slate-900 dark:text-white"
                />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredRegistry.map(u => (
                  <div key={u.id} className="bg-white dark:bg-white/5 p-5 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedUserProfile(u)}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${u.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                             {u.name.charAt(0)}
                          </div>
                          <div>
                             <p className="text-xs font-black italic text-slate-900 dark:text-white uppercase">{u.name}</p>
                             <p className="text-[8px] font-bold text-slate-500 uppercase mt-1 tracking-widest">{u.phone}</p>
                             {u.role === Role.PROVIDER && <p className="text-[7px] text-slate-500 uppercase">{u.serviceCategories?.[0]}</p>}
                          </div>
                       </div>
                       <button onClick={() => setSelectedUserProfile(u)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
                          <i className="fa-solid fa-eye text-xs"></i>
                       </button>
                     </div>
                     
                     <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                        <button onClick={() => { onToggleBlock(u.id); onAddLog(`Toggled block for ${u.name}`, u.id, 'WARNING'); }} className={`flex-1 py-2 rounded-xl text-[7px] font-black uppercase italic ${u.isActive ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                           {u.isActive ? 'Block' : 'Unblock'}
                        </button>
                        {!isWorkflow && (
                          <button onClick={() => { 
                             const newRole = u.role === Role.ADMIN ? Role.CUSTOMER : Role.ADMIN;
                             onUpdateUserRole(u.id, newRole); 
                             onAddLog(`Changed role of ${u.name} to ${newRole}`, u.id, 'CRITICAL');
                          }} className="flex-1 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-[7px] font-black uppercase italic">Toggle Role</button>
                        )}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {view === 'missions' && !isWorkflow && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookings.map(b => (
                <div key={b.id} className="bg-white dark:bg-white/5 p-6 rounded-[35px] border border-slate-100 dark:border-white/5 shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <h4 className="text-xs font-black text-blue-500 italic uppercase">{b.category} • {b.id}</h4>
                      <span className={`text-[7px] font-black px-3 py-1 rounded-full uppercase ${getStatusColor(b.status)}`}>{b.status}</span>
                   </div>
                   <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">Customer: {b.customerPhone}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Provider: {b.providerId || 'UNASSIGNED'}</p>
                      </div>
                      <button onClick={() => setReassignBookingId(b.id)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[8px] font-black uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400">Reassign</button>
                   </div>
                </div>
              ))}
           </div>
        )}

        {view === 'security' && (
          <div className="space-y-4 animate-fade-in">
             <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-lg font-black italic uppercase">System Logs</h3>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{systemLogs.length} Events</span>
             </div>
             {systemLogs.length === 0 && <p className="text-center text-slate-500 italic text-xs py-10">No logs recorded yet.</p>}
             {systemLogs.map(log => (
               <div key={log.id} className="bg-white dark:bg-white/5 p-4 rounded-[24px] border border-slate-100 dark:border-white/5 flex gap-4 items-start shadow-sm">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${log.severity === 'CRITICAL' ? 'bg-red-500 animate-pulse' : log.severity === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                  <div className="flex-1">
                     <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase italic">{log.action}</p>
                        <span className="text-[8px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                     </div>
                     <p className="text-[8px] text-slate-500 uppercase mt-1">Actor: {log.actorPhone} {log.targetId ? `• Target: ${log.targetId.substring(0,8)}...` : ''}</p>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
