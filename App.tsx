import React, { useState, useEffect } from 'react';
import { Role, User, Booking, BookingStatus, Location, SystemLog } from './types';
import { SUPER_ADMIN, VERIFIED_ADMINS, TRANSLATIONS } from './constants';
import Auth from './components/Auth';
import CustomerDashboard from './components/CustomerDashboard';
import ProviderDashboard from './components/ProviderDashboard';
import AdminDashboard from './components/AdminDashboard';
import LodgeDashboard from './components/LodgeDashboard';

interface SwensiNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'ALERT' | 'SUCCESS';
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'MANAGEMENT' | 'CUSTOMER'>('CUSTOMER');
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('swensi-users-v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('swensi-bookings-v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [notifications, setNotifications] = useState<SwensiNotification[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [currentLocation] = useState<Location>({ lat: -9.3283, lng: 32.7569 });
  const [adminNumbers, setAdminNumbers] = useState<string[]>(() => {
    const saved = localStorage.getItem('swensi-admins-v2');
    return saved ? JSON.parse(saved) : VERIFIED_ADMINS;
  });
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('swensi-theme') === 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('swensi-lang') || 'en');
  const [pendingPayment, setPendingPayment] = useState<{ amount: number; desc: string; onComplete: () => void } | null>(null);

  useEffect(() => {
    localStorage.setItem('swensi-users-v2', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('swensi-bookings-v2', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('swensi-admins-v2', JSON.stringify(adminNumbers));
  }, [adminNumbers]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBookings(prev => prev.map(b => {
        if (b.status === BookingStatus.ON_TRIP || b.status === BookingStatus.GOODS_IN_TRANSIT) {
          const lastLoc = b.location;
          const newLoc = {
            lat: lastLoc.lat + (Math.random() - 0.5) * 0.001,
            lng: lastLoc.lng + (Math.random() - 0.5) * 0.001
          };
          return {
            ...b,
            location: newLoc,
            trackingHistory: [...(b.trackingHistory || []), newLoc].slice(-50)
          };
        }
        return b;
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const addNotification = (title: string, message: string, type: 'INFO' | 'ALERT' | 'SUCCESS' = 'INFO') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [{ id, title, message, type }, ...prev]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const t = (key: string) => TRANSLATIONS[language]?.[key] || TRANSLATIONS['en'][key] || key;

  const handleLogin = (phone: string, selectedLang: string) => {
    const existingUser = allUsers.find(u => u.phone === phone);
    if (existingUser) {
      setLanguage(selectedLang);
      setUser(existingUser);
      // Auto-switch to management if applicable
      if (existingUser.role !== Role.CUSTOMER) setViewMode('MANAGEMENT');
      else setViewMode('CUSTOMER');
      addNotification('TERMINAL AUTH', `Welcome back, ${existingUser.name}`, 'SUCCESS');
    }
  };

  const handleRegister = (phone: string, name: string, avatar: string, lang: string) => {
    const isAdmin = adminNumbers.includes(phone);
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      phone,
      role: isAdmin ? Role.ADMIN : Role.CUSTOMER,
      name,
      avatarUrl: avatar,
      isActive: true,
      balance: 1500.00,
      rating: 5.0,
      memberSince: Date.now(),
      trustScore: 85,
      isVerified: isAdmin,
      language: lang,
      completedMissions: 0,
      isPremium: false
    };

    setAllUsers(prev => [...prev, newUser]);
    setLanguage(lang);
    setUser(newUser);
    setViewMode(isAdmin ? 'MANAGEMENT' : 'CUSTOMER');
    addNotification('NODE REGISTERED', `Welcome to the Corridor, ${name}`, 'SUCCESS');
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
  };

  const handleAddAdmin = (phone: string) => {
    if (adminNumbers.includes(phone)) return alert("Node already holds admin clearance.");
    setAdminNumbers(prev => [...prev, phone]);
    addNotification('SECURITY UPDATE', `Admin node ${phone} authorized.`, 'SUCCESS');
  };

  const handleRemoveAdmin = (phone: string) => {
    if (phone === SUPER_ADMIN) return alert("System Root (Super Admin) cannot be deauthorized.");
    setAdminNumbers(prev => prev.filter(p => p !== phone));
    addNotification('SECURITY UPDATE', `Admin node ${phone} deauthorized.`, 'ALERT');
  };

  const handleToggleVerification = (userId: string) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const newStatus = !u.isVerified;
        addNotification('VERIFICATION', `${u.name} verification status: ${newStatus ? 'AUTHORIZED' : 'REVOKED'}`, 'INFO');
        return { ...u, isVerified: newStatus };
      }
      return u;
    }));
    if (user && user.id === userId) {
      setUser(prev => prev ? { ...prev, isVerified: !prev.isVerified } : null);
    }
  };

  const handleBecomeProviderWithKYC = (kycData: { license: string, address: string, photo: string }) => {
    if (!user) return;
    const updatedUser: User = { 
      ...user, 
      role: Role.PROVIDER, 
      isVerified: false, 
      trustScore: 50,
      licenseNumber: kycData.license,
      homeAddress: kycData.address,
      avatarUrl: kycData.photo,
      kycSubmittedAt: Date.now()
    };
    setUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    setViewMode('MANAGEMENT');
    addNotification('KYC SUBMITTED', 'Dossier received. Admin approval required for signal access.', 'SUCCESS');
  };

  const addBooking = (bookingData: Partial<Booking>) => {
    const price = bookingData.price || 50;
    if (user && user.balance < price) return alert("Insufficient Escrow Balance");

    setPendingPayment({
      amount: price,
      desc: `Initiate Mission: ${bookingData.category}`,
      onComplete: () => {
        const newBooking: Booking = {
          id: 'SW-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
          customerId: user?.id || '',
          customerPhone: user?.phone || '',
          status: BookingStatus.PENDING,
          createdAt: Date.now(),
          location: currentLocation,
          category: bookingData.category || 'transport',
          description: bookingData.description || '',
          price: price,
          commission: price * 0.10,
          isPaid: false,
          trackingHistory: [currentLocation],
          customerTrustSnapshot: user?.trustScore || 90,
          ...bookingData
        } as Booking;
        setBookings(prev => [newBooking, ...prev]);
        const newBalance = (user?.balance || 0) - price;
        setUser(u => u ? { ...u, balance: newBalance } : null);
        setAllUsers(prev => prev.map(u => u.id === user?.id ? { ...u, balance: newBalance } : u));
        setPendingPayment(null);
        addNotification('MISSION LOGGED', 'Mission successfully synchronized with the corridor.', 'SUCCESS');
      }
    });
  };

  const updateBooking = (id: string, updates: Partial<Booking>) => {
    setBookings(prev => prev.map(b => {
      if (b.id === id) {
        let finalUpdates = { ...updates };
        const updated = { ...b, ...finalUpdates };
        
        if (updates.status === BookingStatus.COMPLETED && !b.isPaid) {
          const providerPay = b.price - b.commission;
          setAllUsers(uPrev => uPrev.map(u => {
            if (u.id === b.providerId) return { ...u, balance: u.balance + providerPay, completedMissions: (u.completedMissions || 0) + 1 };
            if (u.phone === SUPER_ADMIN) return { ...u, balance: u.balance + b.commission };
            return u;
          }));
          return { ...updated, isPaid: true };
        }
        return updated;
      }
      return b;
    }));
  };

  // Helper to determine what dashboard to show
  const renderDashboard = () => {
    if (!user) return null;

    if (viewMode === 'CUSTOMER') {
      return (
        <CustomerDashboard 
          user={user} 
          logout={() => setUser(null)} 
          bookings={bookings.filter(b => b.customerId === user.id)} 
          onAddBooking={addBooking} 
          location={currentLocation} 
          onConfirmCompletion={(id) => updateBooking(id, { status: BookingStatus.COMPLETED })} 
          onUpdateBooking={updateBooking} 
          onRate={() => {}} 
          onUploadFacePhoto={() => {}} 
          onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
          isDarkMode={isDarkMode} 
          onLanguageChange={setLanguage} 
          onBecomeProvider={handleBecomeProviderWithKYC} 
          onUpdateUser={handleUpdateUser} 
          t={t} 
          onToggleViewMode={() => setViewMode('MANAGEMENT')}
        />
      );
    }

    switch (user.role) {
      case Role.ADMIN:
        return (
          <AdminDashboard 
            user={user} 
            logout={() => setUser(null)} 
            bookings={bookings} 
            allUsers={allUsers} 
            systemLogs={systemLogs} 
            onToggleBlock={() => {}} 
            onDeleteUser={() => {}} 
            onToggleVerification={handleToggleVerification} 
            onUpdateUserRole={() => {}} 
            adminNumbers={adminNumbers} 
            onAddAdmin={handleAddAdmin} 
            onRemoveAdmin={handleRemoveAdmin} 
            onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
            isDarkMode={isDarkMode} 
            onLanguageChange={setLanguage} 
            sysDefaultLang={language} 
            onUpdateSysDefaultLang={() => {}} 
            t={t}
            onToggleViewMode={() => setViewMode('CUSTOMER')}
          />
        );
      case Role.PROVIDER:
        return (
          <ProviderDashboard 
            user={user} 
            logout={() => setUser(null)} 
            bookings={bookings} 
            allUsers={allUsers} 
            onUpdateStatus={(id, status, pid) => updateBooking(id, { status, providerId: pid })} 
            onConfirmCompletion={(id) => updateBooking(id, { status: BookingStatus.COMPLETED })} 
            onUpdateBooking={updateBooking} 
            onUpdateSubscription={() => {}} 
            location={currentLocation} 
            onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
            isDarkMode={isDarkMode} 
            onLanguageChange={setLanguage} 
            onUpdateUser={handleUpdateUser} 
            t={t}
            onToggleViewMode={() => setViewMode('CUSTOMER')}
          />
        );
      case Role.LODGE:
        return (
          <LodgeDashboard 
            user={user} 
            logout={() => setUser(null)} 
            bookings={bookings.filter(b => b.lodgeId === user.id || b.category === 'lodging')} 
            onUpdateBooking={updateBooking} 
            onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
            isDarkMode={isDarkMode} 
            onLanguageChange={setLanguage} 
            onUpdateUser={handleUpdateUser} 
            t={t} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
      <div className="absolute top-20 left-6 right-6 z-[400] pointer-events-none flex flex-col gap-3">
         {notifications.map(n => (
           <div key={n.id} className="p-4 rounded-[20px] shadow-2xl backdrop-blur-xl border border-white/10 bg-slate-900/90 text-white animate-slide-up pointer-events-auto">
             <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${n.type === 'SUCCESS' ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`}></div>
               <div>
                 <p className="text-[9px] font-black uppercase italic tracking-widest">{n.title}</p>
                 <p className="text-[11px] font-bold mt-0.5">{n.message}</p>
               </div>
             </div>
           </div>
         ))}
      </div>

      {!user ? (
        <Auth 
          onLogin={handleLogin} 
          onRegister={handleRegister}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
          isDarkMode={isDarkMode} 
          language={language} 
          onLanguageChange={setLanguage} 
          t={t} 
          adminNumbers={adminNumbers} 
          existingUsers={allUsers}
        />
      ) : renderDashboard()}

      {pendingPayment && (
        <div className="fixed inset-0 z-[600] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl border-2 border-blue-600 text-center animate-zoom-in">
              <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-fingerprint text-blue-600 text-3xl"></i>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 italic uppercase tracking-tighter">Authorize Escrow</h3>
              <p className="text-4xl font-black text-blue-700 mb-8 italic tracking-tight">ZMW {pendingPayment.amount.toFixed(2)}</p>
              <div className="space-y-3">
                <button onClick={pendingPayment.onComplete} className="w-full py-5 bg-blue-700 text-white font-black rounded-[24px] text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 italic">Commit Funds</button>
                <button onClick={() => setPendingPayment(null)} className="w-full py-3 text-slate-400 font-black text-[9px] uppercase tracking-widest">Abort Transaction</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;