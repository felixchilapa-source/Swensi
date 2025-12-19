import React, { useState, useEffect, useCallback } from 'react';
import { Role, User, Booking, BookingStatus, Location, SystemLog } from './types';
import { SUPER_ADMIN, TRANSLATIONS } from './constants';
import Auth from './components/Auth';
import CustomerDashboard from './components/CustomerDashboard';
import ProviderDashboard from './components/ProviderDashboard';
import AdminDashboard from './components/AdminDashboard';
import LodgeDashboard from './components/LodgeDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('swensi-users');
    return saved ? JSON.parse(saved) : [];
  });
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('swensi-bookings');
    return saved ? JSON.parse(saved) : [];
  });
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [adminNumbers] = useState<string[]>([SUPER_ADMIN, '0965722947', '0967981910']);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('swensi-theme') === 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('swensi-lang') || 'en');
  const [pendingPayment, setPendingPayment] = useState<{ amount: number; desc: string; onComplete: () => void } | null>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      console.log('Swensi was installed');
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    localStorage.setItem('swensi-users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('swensi-bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('swensi-theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('swensi-lang', language);
  }, [language]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      });
    }
  }, []);

  const t = (key: string) => TRANSLATIONS[language]?.[key] || TRANSLATIONS['en'][key] || key;

  const addLog = useCallback((action: string, severity: SystemLog['severity'] = 'INFO', targetId?: string) => {
    if (!user) return;
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      action,
      actorId: user.id,
      actorPhone: user.phone,
      severity,
      targetId
    };
    setSystemLogs(prev => [newLog, ...prev].slice(0, 100));
  }, [user]);

  const handleLogin = (phone: string, selectedLang?: string, forcedRole?: Role) => {
    const existingUser = allUsers.find(u => u.phone === phone);
    const isAdmin = adminNumbers.includes(phone);
    const finalLang = selectedLang || language;
    
    // Use the role selected during auth if provided, otherwise auto-calculate
    let role = forcedRole || Role.CUSTOMER;
    
    if (!forcedRole) {
      if (isAdmin) role = Role.ADMIN;
      else if (phone.endsWith('1')) role = Role.PROVIDER;
      else if (phone.endsWith('2')) role = Role.LODGE;
    }

    const newUser: User = existingUser || {
      id: Math.random().toString(36).substr(2, 9),
      phone,
      role: role,
      name: isAdmin && role === Role.ADMIN ? (phone === SUPER_ADMIN ? 'System Owner' : 'Admin') : 
            role === Role.PROVIDER ? 'Provider ' + phone.slice(-4) :
            role === Role.LODGE ? 'Lodge ' + phone.slice(-4) : 'User ' + phone.slice(-4),
      isActive: true,
      balance: 1000.00,
      rating: 4.8,
      memberSince: Date.now(),
      trustScore: role === Role.PROVIDER ? 98 : 90,
      cancellationRate: 0,
      isVerified: (isAdmin && role === Role.ADMIN) || role === Role.PROVIDER,
      language: finalLang,
      hospitalityCashflow: 0
    };

    if (!existingUser) setAllUsers(prev => [...prev, newUser]);
    // Ensure existing user role is respected if forced
    else if (forcedRole && existingUser.role !== forcedRole) {
       setAllUsers(prev => prev.map(u => u.id === existingUser.id ? { ...u, role: forcedRole } : u));
       newUser.role = forcedRole;
    }

    setLanguage(newUser.language);
    setUser(newUser);
  };

  const handleBecomeProvider = () => {
    if (!user) return;
    const updatedUser = { ...user, role: Role.PROVIDER, isVerified: true, trustScore: 95 };
    setUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    addLog('User updated role to PROVIDER', 'INFO');
    alert("Congratulations! You are now a Swensi Provider.");
  };

  const processTransaction = (amount: number, description: string, callback: () => void) => {
    setPendingPayment({ amount, desc: description, onComplete: callback });
  };

  const confirmPayment = () => {
    if (!pendingPayment || !user) return;
    const newBalance = user.balance - pendingPayment.amount;
    if (newBalance < 0) return alert("Insufficient Balance.");
    setUser({ ...user, balance: newBalance });
    setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, balance: newBalance } : u));
    addLog(`Payment Authorized: ZMW ${pendingPayment.amount}`, 'INFO');
    pendingPayment.onComplete();
    setPendingPayment(null);
  };

  const settleBooking = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking || booking.isPaid) return;
    const commission = booking.price * 0.10;
    const providerPay = booking.price - commission;

    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, isPaid: true, status: BookingStatus.COMPLETED } : b));
    if (booking.providerId) {
      setAllUsers(prev => prev.map(u => {
        if (u.id === booking.providerId) {
          const isHospitality = booking.isTrustedTransportOnly || booking.category === 'lodging';
          return { 
            ...u, 
            balance: (u.balance || 0) + providerPay, 
            earnings: (u.earnings || 0) + providerPay,
            hospitalityCashflow: isHospitality ? (u.hospitalityCashflow || 0) + booking.price : (u.hospitalityCashflow || 0)
          };
        }
        if (u.phone === SUPER_ADMIN) return { ...u, balance: (u.balance || 0) + commission };
        return u;
      }));
    }
  };

  const addBooking = (bookingData: Partial<Booking>) => {
    const price = bookingData.price || 50;
    processTransaction(price, `Booking: ${bookingData.category}`, () => {
      const newBooking: Booking = {
        id: 'S' + Math.random().toString(36).substr(2, 5).toUpperCase(),
        customerId: user?.id || '',
        customerPhone: user?.phone || '',
        status: BookingStatus.PENDING,
        createdAt: Date.now(),
        location: currentLocation || { lat: -9.3283, lng: 32.7569 },
        category: bookingData.category || 'errands',
        description: bookingData.description || '',
        price: price,
        commission: price * 0.10,
        isPaid: false,
        stopHistory: [],
        ...bookingData
      } as Booking;
      setBookings(prev => [newBooking, ...prev]);
    });
  };

  const updateBooking = (id: string, updates: Partial<Booking>) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    if (updates.status === BookingStatus.COMPLETED) settleBooking(id);
  };

  const logout = () => setUser(null);

  return (
    <div className={`mobile-container ${isDarkMode ? 'dark' : ''}`}>
      {!user ? (
        <Auth 
          onLogin={handleLogin} 
          onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
          isDarkMode={isDarkMode} 
          language={language} 
          onLanguageChange={setLanguage} 
          t={t} 
          adminNumbers={adminNumbers}
        />
      ) : (
        <>
          {user.role === Role.ADMIN && (
            <AdminDashboard user={user} logout={logout} bookings={bookings} allUsers={allUsers} systemLogs={systemLogs} onToggleBlock={() => {}} onDeleteUser={() => {}} onToggleVerification={() => {}} onUpdateUserRole={() => {}} adminNumbers={adminNumbers} onAddAdmin={() => {}} onRemoveAdmin={() => {}} onToggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} onLanguageChange={setLanguage} sysDefaultLang={language} onUpdateSysDefaultLang={() => {}} t={t} />
          )}
          {user.role === Role.CUSTOMER && (
            <CustomerDashboard 
              user={user} 
              logout={logout} 
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
              onBecomeProvider={handleBecomeProvider}
              t={t} 
              installPrompt={deferredPrompt}
              onInstall={handleInstall}
            />
          )}
          {user.role === Role.PROVIDER && (
            <ProviderDashboard user={user} logout={logout} bookings={bookings} onUpdateStatus={(id, status, pid) => updateBooking(id, { status, providerId: pid })} onConfirmCompletion={(id) => updateBooking(id, { status: BookingStatus.COMPLETED })} onUpdateBooking={updateBooking} onUpdateSubscription={() => {}} location={currentLocation} onToggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} onLanguageChange={setLanguage} t={t} />
          )}
          {user.role === Role.LODGE && (
            <LodgeDashboard user={user} logout={logout} bookings={bookings.filter(b => b.lodgeId === user.id || b.category === 'lodging')} onUpdateBooking={updateBooking} onToggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} onLanguageChange={setLanguage} t={t} />
          )}
        </>
      )}

      {/* Global Modals & Indicators */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-indigo-500 to-orange-500 z-[200]"></div>
      {pendingPayment && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
           <div className="w-full max-w-[320px] bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl border-4 border-orange-500 animate-zoom-in text-center">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 italic">PAYMENT AUTHORIZATION</h3>
              <p className="text-[10px] font-black uppercase text-slate-400 mb-6">{pendingPayment.desc}</p>
              <div className="bg-slate-50 dark:bg-black/40 rounded-3xl p-5 mb-8">
                <p className="text-3xl font-black text-secondary dark:text-orange-500">ZMW {pendingPayment.amount.toFixed(2)}</p>
              </div>
              <div className="space-y-3">
                <button onClick={confirmPayment} className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-xl">Authorize</button>
                <button onClick={() => setPendingPayment(null)} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase">Cancel</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;