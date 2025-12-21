import React, { useState, useMemo, useRef } from 'react';
import { User, Booking, BookingStatus, Role, Location } from '../types';
import { PAYMENT_NUMBERS, SUBSCRIPTION_PLANS } from '../constants';
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
  onToggleViewMode?: () => void;
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ 
  user, logout, bookings, allUsers, onUpdateStatus, onUpdateBooking, onUpdateUser, onUpdateSubscription, onToggleViewMode, location 
}) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'active' | 'account'>('leads');
  const [isOnline, setIsOnline] = useState(true);
  const [showKYCModal, setShowKYCModal] = useState(false);
  
  // KYC Form State
  const [kycLicense, setKycLicense] = useState(user.licenseNumber || '');
  const [kycAddress, setKycAddress] = useState(user.homeAddress || '');
  const [kycPhoto, setKycPhoto] = useState(user.avatarUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAuthorized = user.isVerified;
  
  // Subscription Check
  const isSubscribed = useMemo(() => {
    if (!user.subscriptionExpiry) return false;
    return user.subscriptionExpiry > Date.now();
  }, [user.subscriptionExpiry]);

  const pendingLeads = useMemo(() => {
    if (!isOnline || !isAuthorized || !isSubscribed) return [];
    return bookings.filter(b => b.status === BookingStatus.PENDING);
  }, [bookings, isOnline, isAuthorized, isSubscribed]);

  const activeJobs = useMemo(() => bookings.filter(b => b.providerId === user.id && b.status !== BookingStatus.COMPLETED), [bookings, user.id]);

  const daysLeft = user.subscriptionExpiry ? Math.max(0, Math.ceil((user.subscriptionExpiry - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setKycPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitKYC = () => {
    if (!kycLicense.trim() || !kycAddress.trim() || !kycPhoto) {
      return alert("Please complete all verification fields (ID, Address, and Photo).");
    }
    onUpdateUser({
      licenseNumber: kycLicense,
      homeAddress: kycAddress,
      avatarUrl: kycPhoto,
      kycSubmittedAt: Date.now()
    });
    setShowKYCModal(false);
    alert("Verification submitted. Admins will review your documents shortly.");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <header className="px-5 py-5 bg-secondary text-white sticky top-0 z-50 shadow-2xl border-b border-white/5 safe-pt">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="bg-blue-600 w-11 h-11 rounded-[18px] shadow-lg flex items-center justify-center transform rotate-2">
               <i className="fas fa-satellite text-white text-lg"></i>
             </div>
             <div>
               <h2 className="text-xl font-bold italic tracking-tighter uppercase leading-none">Swensi</h2>
               <span className="text-[10px] font-bold text-blue-500 tracking-[0.2em] uppercase mt-1 inline-block">Partner Terminal</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={onToggleViewMode} className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center border border-emerald-600/20"><i className="fa-solid fa-cart-plus"></i></button>
             <div className="flex flex-col items-end">
                <span className={`text-[8px] font-black uppercase tracking-widest ${isOnline && isAuthorized && isSubscribed ? 'text-emerald-500' : 'text-red-500'}`}>
                  {!isSubscribed ? 'Subs Expired' : (!isAuthorized ? 'Pending KYC' : (isOnline ? 'Online' : 'Offline'))}
                </span>
                <button 
                  onClick={() => isAuthorized && isSubscribed && setIsOnline(!isOnline)}
                  disabled={!isAuthorized || !isSubscribed}
                  className={`w-10 h-5 rounded-full mt-1 relative transition-colors ${isOnline && isAuthorized && isSubscribed ? 'bg-emerald-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isOnline ? 'right-1' : 'left-1'}`}></div>
                </button>
             </div>
          </div>
        </div>
      </header>

      <NewsTicker />

      {/* KYC / VERIFICATION MODAL */}
      {showKYCModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
           <div className="w-full max-w-[380px] bg-white dark:bg-slate-900 rounded-[45px] p-8 shadow-2xl animate-zoom-in border border-blue-500/20">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black italic uppercase text-secondary dark:text-white tracking-tighter">Verification Hub</h3>
                <button onClick={() => setShowKYCModal(false)} className="text-slate-400"><i className="fa-solid fa-circle-xmark text-xl"></i></button>
              </div>
              
              <div className="space-y-5">
                <div className="flex flex-col items-center gap-2">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-[30px] bg-slate-100 dark:bg-white/5 border-2 border-dashed border-blue-500/30 flex items-center justify-center overflow-hidden cursor-pointer group shadow-inner"
                  >
                    {kycPhoto ? (
                      <img src={kycPhoto} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2">
                        <i className="fa-solid fa-camera text-xl text-blue-500/40"></i>
                        <p className="text-[7px] font-black uppercase text-slate-500 mt-1">ID Photo</p>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 ml-3 italic">License / ID Number</label>
                  <input 
                    value={kycLicense} 
                    onChange={e => setKycLicense(e.target.value)} 
                    placeholder="NRC or Passport #" 
                    className="w-full bg-slate-100 dark:bg-white/5 border dark:border-white/10 rounded-2xl p-4 text-xs font-black outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 ml-3 italic">Business / Home Address</label>
                  <textarea 
                    value={kycAddress} 
                    onChange={e => setKycAddress(e.target.value)} 
                    placeholder="Full location in Nakonde..." 
                    className="w-full bg-slate-100 dark:bg-white/5 border dark:border-white/10 rounded-2xl p-4 text-xs font-black outline-none h-24 resize-none"
                  />
                </div>

                <button onClick={submitKYC} className="w-full bg-blue-700 text-white font-black py-5 rounded-[28px] text-[10px] uppercase italic tracking-widest shadow-xl mt-2 active:scale-95 transition-all">Submit for Review</button>
              </div>
           </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-32 px-5 pt-6 space-y-8 no-scrollbar">
        {activeTab === 'leads' && (
          <div className="space-y-6 animate-fade-in">
            {/* NOT VERIFIED WARNING */}
            {!isAuthorized && (
               <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-7 rounded-[35px] text-white shadow-xl flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl flex-shrink-0 animate-pulse">
                     <i className="fa-solid fa-user-shield"></i>
                  </div>
                  <div className="flex-1">
                     <h4 className="text-[13px] font-black uppercase italic leading-none">Identity Check Required</h4>
                     <p className="text-[9px] font-bold uppercase opacity-80 mt-1.5 leading-tight">Submit your trade license and ID to begin accepting corridor missions.</p>
                     <button 
                        onClick={() => setShowKYCModal(true)}
                        className="mt-4 bg-white text-orange-600 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg"
                      >
                        {user.kycSubmittedAt ? 'Update Documents' : 'Submit KYC'}
                      </button>
                  </div>
               </div>
            )}

            {/* SUBSCRIPTION NOTICE */}
            {!isSubscribed && (
              <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-8 rounded-[40px] text-white shadow-2xl space-y-5">
                <h4 className="text-xl font-black italic uppercase leading-none">Activate Terminal</h4>
                <p className="text-[10px] font-bold uppercase opacity-80 leading-relaxed">Choose a plan to see corridor missions. Manual credit via Mobile Money also supported.</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => onUpdateSubscription('BASIC')}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 p-4 rounded-2xl transition-all text-center"
                  >
                    <p className="text-[14px] font-black">ZMW {SUBSCRIPTION_PLANS.BASIC}</p>
                    <p className="text-[8px] uppercase tracking-widest mt-1">Basic Access</p>
                  </button>
                  <button 
                    onClick={() => onUpdateSubscription('PREMIUM')}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 p-4 rounded-2xl transition-all text-center"
                  >
                    <p className="text-[14px] font-black">ZMW {SUBSCRIPTION_PLANS.PREMIUM}</p>
                    <p className="text-[8px] uppercase tracking-widest mt-1">Premium Hub</p>
                  </button>
                </div>

                <div className="pt-4 border-t border-white/10">
                   <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-3">Manual Recharge Numbers</p>
                   <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px] font-bold"><span className="opacity-70">MTN:</span> <span>{PAYMENT_NUMBERS.MTN}</span></div>
                      <div className="flex justify-between text-[9px] font-bold"><span className="opacity-70">Airtel:</span> <span>{PAYMENT_NUMBERS.Airtel}</span></div>
                      <div className="flex justify-between text-[9px] font-bold"><span className="opacity-70">Zamtel:</span> <span>{PAYMENT_NUMBERS.Zamtel}</span></div>
                   </div>
                </div>
              </div>
            )}

            {isSubscribed && daysLeft < 5 && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl flex justify-between items-center">
                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest italic">{daysLeft} Days Access Remaining</p>
                <button onClick={() => onUpdateSubscription('BASIC')} className="text-[9px] font-black uppercase text-amber-700 underline">Extend</button>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-[35px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-lg">
              <Map center={location} markers={[{ loc: location, color: '#1E40AF', label: 'Home Node' }]} />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Earnings</p>
                  <p className="text-xl font-black text-secondary dark:text-white tracking-tighter leading-none">ZMW {user.balance.toFixed(0)}</p>
               </div>
               <div className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Jobs</p>
                  <p className="text-xl font-black text-secondary dark:text-white tracking-tighter leading-none">{user.completedMissions || 0}</p>
               </div>
            </div>

            {isOnline && isSubscribed && isAuthorized && pendingLeads.length === 0 && (
              <div className="py-20 text-center opacity-20">
                 <i className="fa-solid fa-radar text-4xl animate-pulse"></i>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-4">Scanning Corridor...</p>
              </div>
            )}
            
            {pendingLeads.map(lead => (
              <div key={lead.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 p-7 shadow-xl hover:border-blue-500 transition-all group overflow-hidden relative">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] italic">{lead.category}</p>
                        <h4 className="text-3xl font-black text-secondary dark:text-white italic tracking-tighter">ZMW {lead.price}</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Comm (0.24%): ZMW {lead.commission.toFixed(2)}</p>
                    </div>
                 </div>
                 <button onClick={() => onUpdateStatus(lead.id, BookingStatus.ACCEPTED, user.id)} className="w-full bg-blue-700 text-white font-black py-5 rounded-[28px] text-[10px] uppercase tracking-[0.2em] shadow-xl italic">Accept Mission</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-6 animate-fade-in">
            {activeJobs.map(job => (
              <div key={job.id} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-2xl relative overflow-hidden mb-8">
                <Map center={job.location} markers={[{ loc: job.location, color: '#1E40AF', label: 'Node' }]} />
                <div className="p-7">
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">{job.category} Node</p>
                    <p className="text-[10px] font-black uppercase text-blue-500 animate-pulse italic tracking-widest">{job.status}</p>
                  </div>
                  <button onClick={() => onUpdateStatus(job.id, BookingStatus.COMPLETED, user.id)} className="flex-1 w-full bg-blue-700 text-white font-black py-5 rounded-[24px] text-[10px] uppercase shadow-xl italic tracking-[0.1em]">Complete Mission</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-white/5 shadow-xl text-center">
              <div className="w-24 h-24 mx-auto bg-indigo-700 rounded-full flex items-center justify-center text-white text-3xl font-black italic shadow-2xl mb-6 overflow-hidden">
                {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.name.charAt(0)}
              </div>
              <h2 className="text-2xl font-black text-secondary dark:text-white italic uppercase tracking-tighter leading-none">{user.name}</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 italic leading-none">{user.phone}</p>
              
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 gap-3">
                 <button onClick={() => setShowKYCModal(true)} className="col-span-2 bg-blue-600/10 text-blue-600 font-black py-5 rounded-[28px] text-[10px] uppercase border border-blue-600/20 italic mb-2">Manage Verification</button>
                 <button onClick={logout} className="col-span-2 bg-red-500/10 text-red-500 font-black py-5 rounded-[28px] text-[10px] uppercase border border-red-500/20 italic">Disconnect</button>
              </div>
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