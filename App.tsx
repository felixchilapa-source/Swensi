
import React, { useState, useEffect, useCallback } from 'react';
import { Role, User, Booking, BookingStatus, Location, CouncilOrder } from './types';
import { SUPER_ADMIN, VERIFIED_ADMINS, TRANSLATIONS, CATEGORIES, PLATFORM_COMMISSION_RATE, SUBSCRIPTION_PLANS } from './constants';
import Auth from './components/Auth';
import CustomerDashboard from './components/CustomerDashboard';
import ProviderDashboard from './components/ProviderDashboard';
import AdminDashboard from './components/AdminDashboard';
import LodgeDashboard from './components/LodgeDashboard';

interface SwensiNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'ALERT' | 'SUCCESS' | 'SMS';
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'MANAGEMENT' | 'CUSTOMER'>('CUSTOMER');
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('swensi-users-v3');
    return saved ? JSON.parse(saved) : [];
  });
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('swensi-bookings-v3');
    return saved ? JSON.parse(saved) : [];
  });
  const [councilOrders, setCouncilOrders] = useState<CouncilOrder[]>(() => {
    const saved = localStorage.getItem('swensi-council-v3');
    return saved ? JSON.parse(saved) : [];
  });
  const [notifications, setNotifications] = useState<SwensiNotification[]>([]);
  const [currentLocation] = useState<Location>({ lat: -9.3283, lng: 32.7569 });
  const [adminNumbers, setAdminNumbers] = useState<string[]>(() => {
    const saved = localStorage.getItem('swensi-admins-v3');
    return saved ? JSON.parse(saved) : VERIFIED_ADMINS;
  });
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('swensi-theme') === 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('swensi-lang') || 'en');
  const [pendingPayment, setPendingPayment] = useState<{ amount: number; desc: string; onComplete: () => void } | null>(null);
  const [backendMessage, setBackendMessage] = useState<string>("Syncing with Nakonde Hub...");

  // Sync with backend API (Branding request)
  useEffect(() => {
    fetch("https://swensi.onrender.com/api/hello")
      .then((res) => res.json())
      .then((data) => setBackendMessage(data.message))
      .catch(() => setBackendMessage("Hub Online"));
  }, []);

  useEffect(() => {
    localStorage.setItem('swensi-users-v3', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('swensi-bookings-v3', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('swensi-council-v3', JSON.stringify(councilOrders));
  }, [councilOrders]);

  useEffect(() => {
    localStorage.setItem('swensi-admins-v3', JSON.stringify(adminNumbers));
  }, [adminNumbers]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const addNotification = useCallback((title: string, message: string, type: 'INFO' | 'ALERT' | 'SUCCESS' | 'SMS' = 'INFO') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [{ id, title, message, type }, ...prev]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const sendMockSMS = useCallback((phone: string, message: string) => {
    console.log(`%c[SMS SENT TO ${phone}]: ${message}`, "color: #3b82f6; font-weight: bold; border: 1px solid #3b82f6; padding: 4px; border-radius: 4px;");
    addNotification('SMS GATEWAY', `Message to ${phone}`, 'SMS');
  }, [addNotification]);

  const handleSOS = useCallback(() => {
    if (!user) return;
    const msg = `🚨 EMERGENCY SOS: ${user.name} (${user.phone}) triggered distress at Lat: ${currentLocation.lat}, Lng: ${currentLocation.lng}.`;
    sendMockSMS(SUPER_ADMIN, msg);
    addNotification('SOS TRIGGERED', 'Emergency services alerted.', 'ALERT');
  }, [user, currentLocation, sendMockSMS, addNotification]);

  const handleDeposit = useCallback((amount: number) => {
    if (!user) return;
    const updatedUsers = allUsers.map(u => u.id === user.id ? { ...u, balance: u.balance + amount } : u);
    setAllUsers(updatedUsers);
    setUser({ ...user, balance: user.balance + amount });
    addNotification('DEPOSIT SUCCESS', `ZMW ${amount.toFixed(2)} added to Escrow.`, 'SUCCESS');
    sendMockSMS(user.phone, `Swensi: ZMW ${amount.toFixed(2)} deposit confirmed. Balance: ZMW ${(user.balance + amount).toFixed(2)}.`);
  }, [user, allUsers, addNotification, sendMockSMS]);

  const handleLogin = (phone: string, lang: string) => {
    const existingUser = allUsers.find(u => u.phone === phone);
    if (existingUser) {
      setUser(existingUser);
      setLanguage(lang);
      localStorage.setItem('swensi-lang', lang);
      addNotification('ACCESS GRANTED', `Terminal linked to ${existingUser.name}`, 'SUCCESS');
    }
  };

  const handleRegister = (phone: string, name: string, avatar: string, lang: string) => {
    const newUser: User = {
      id: 'USR-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      phone,
      name,
      role: Role.CUSTOMER, // Always register as customer first
      isActive: true,
      balance: 100, // Initial corridor credit
      memberSince: Date.now(),
      rating: 5.0,
      language: lang,
      trustScore: 90,
      isVerified: true,
      avatarUrl: avatar,
      completedMissions: 0
    };
    
    setAllUsers(prev => [...prev, newUser]);
    setUser(newUser);
    setLanguage(lang);
    localStorage.setItem('swensi-lang', lang);
    addNotification('NODE ESTABLISHED', `Welcome to the Hub, ${name}`, 'SUCCESS');
  };

  const upgradeToProvider = (kyc: { license: string, address: string, photo: string }) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      role: Role.PROVIDER,
      licenseNumber: kyc.license,
      homeAddress: kyc.address,
      isVerified: false, // Pending admin approval
      trustScore: 50,
      kycSubmittedAt: Date.now()
    };
    setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    setUser(updatedUser);
    addNotification('UPGRADE SUBMITTED', 'Your Partner application is pending review.', 'INFO');
  };

  const addBooking = (bookingData: Partial<Booking>) => {
    const price = bookingData.price || 50;
    if (user && user.balance < price) return alert("Insufficient Escrow Balance");

    setPendingPayment({
      amount: price,
      desc: `Commit Funds: ${bookingData.category}`,
      onComplete: () => {
        const bookingId = 'SW-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        const councilOrderId = 'CNC-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        
        const newBooking: Booking = {
          id: bookingId,
          customerId: user?.id || '',
          customerPhone: user?.phone || '',
          status: BookingStatus.PENDING,
          createdAt: Date.now(),
          location: currentLocation,
          category: bookingData.category || 'transport',
          description: bookingData.description || '',
          price: price,
          commission: price * PLATFORM_COMMISSION_RATE,
          isPaid: false,
          trackingHistory: [currentLocation],
          customerTrustSnapshot: user?.trustScore || 90,
          councilOrderId: councilOrderId,
          ...bookingData
        } as Booking;

        const newCouncilOrder: CouncilOrder = {
          id: councilOrderId,
          bookingId: bookingId,
          customerPhone: user?.phone || '',
          levyAmount: price * 0.05,
          type: 'TRANSPORT_LEVY',
          status: 'ISSUED',
          issuedAt: Date.now()
        };

        setBookings(prev => [newBooking, ...prev]);
        setCouncilOrders(prev => [newCouncilOrder, ...prev]);
        
        const newBalance = (user?.balance || 0) - price;
        setUser(u => u ? { ...u, balance: newBalance } : null);
        setAllUsers(prev => prev.map(u => u.id === user?.id ? { ...u, balance: newBalance } : u));
        setPendingPayment(null);
        addNotification('MISSION LOGGED', 'Escrow secured.', 'SUCCESS');
      }
    });
  };

  const renderDashboard = () => {
    if (!user) return null;

    if (viewMode === 'CUSTOMER' || user.role === Role.CUSTOMER) {
      return (
        <CustomerDashboard 
          user={user} 
          logout={() => setUser(null)} 
          bookings={bookings.filter(b => b.customerId === user.id)} 
          councilOrders={councilOrders} 
          onAddBooking={addBooking} 
          location={currentLocation} 
          onConfirmCompletion={() => {}} 
          onUpdateBooking={() => {}} 
          onRate={() => {}} 
          onUploadFacePhoto={() => {}} 
          onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
          isDarkMode={isDarkMode} 
          onLanguageChange={setLanguage} 
          onBecomeProvider={upgradeToProvider} 
          onUpdateUser={(updates) => {
            setUser(u => u ? { ...u, ...updates } : null);
            setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updates } : u));
          }} 
          t={(k) => TRANSLATIONS[language]?.[k] || k} 
          onToggleViewMode={() => setViewMode('MANAGEMENT')}
          onSOS={handleSOS}
          onDeposit={handleDeposit}
        />
      );
    }

    switch (user.role) {
      case Role.ADMIN:
        return (
          <AdminDashboard 
            user={user} logout={() => setUser(null)} bookings={bookings} allUsers={allUsers} councilOrders={councilOrders}
            systemLogs={[]} onToggleBlock={() => {}} onDeleteUser={() => {}} 
            onToggleVerification={(userId) => {
              setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: !u.isVerified } : u));
            }} 
            onUpdateUserRole={(userId, role) => {
              setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
            }}
            adminNumbers={adminNumbers} 
            onAddAdmin={(p) => setAdminNumbers(prev => [...prev, p])} 
            onRemoveAdmin={(p) => setAdminNumbers(prev => prev.filter(x => x !== p))} 
            onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
            isDarkMode={isDarkMode} onLanguageChange={setLanguage} sysDefaultLang={language} onUpdateSysDefaultLang={setLanguage} 
            t={(k) => TRANSLATIONS[language]?.[k] || k} onToggleViewMode={() => setViewMode('CUSTOMER')}
          />
        );
      case Role.PROVIDER:
        return (
          <ProviderDashboard 
            user={user} logout={() => setUser(null)} bookings={bookings} allUsers={allUsers} 
            onUpdateStatus={() => {}} 
            onConfirmCompletion={() => {}} 
            onUpdateBooking={() => {}} 
            onUpdateSubscription={() => {}} 
            location={currentLocation} onToggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} 
            onLanguageChange={setLanguage} onUpdateUser={() => {}} t={(k) => TRANSLATIONS[language]?.[k] || k} 
            onToggleViewMode={() => setViewMode('CUSTOMER')}
          />
        );
      default: return null;
    }
  };

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : ''} safe-pb`}>
      <div className="fixed top-6 left-6 right-6 z-[2000] pointer-events-none flex flex-col gap-3">
         {notifications.map(n => (
           <div key={n.id} className={`p-4 rounded-[24px] shadow-2xl backdrop-blur-xl border border-white/10 ${n.type === 'SMS' ? 'bg-blue-600/90' : (n.type === 'ALERT' ? 'bg-red-600/95' : 'bg-slate-900/95')} text-white animate-slide-up pointer-events-auto`}>
             <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${n.type === 'SUCCESS' ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`}></div>
               <div>
                 <p className="text-[9px] font-black uppercase italic tracking-widest opacity-80">{n.title}</p>
                 <p className="text-[11px] font-bold mt-1 leading-tight">{n.message}</p>
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
          t={(k) => TRANSLATIONS[language]?.[k] || k} 
          adminNumbers={adminNumbers} 
          existingUsers={allUsers} 
        />
      ) : renderDashboard()}

      {pendingPayment && (
        <div className="fixed inset-0 z-[1500] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl border-2 border-blue-600 text-center animate-zoom-in">
              <i className="fa-solid fa-fingerprint text-blue-600 text-4xl mb-6"></i>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 italic uppercase">Authorization</h3>
              <p className="text-4xl font-black text-blue-700 mb-8 italic tracking-tight">ZMW {pendingPayment.amount.toFixed(2)}</p>
              <div className="space-y-3">
                <button onClick={pendingPayment.onComplete} className="w-full py-5 bg-blue-700 text-white font-black rounded-[24px] text-[11px] uppercase tracking-widest italic">Confirm Mission</button>
                <button onClick={() => setPendingPayment(null)} className="w-full py-3 text-slate-400 font-black text-[9px] uppercase tracking-widest">Abort</button>
              </div>
           </div>
        </div>
      )}
      
      <div className="fixed bottom-2 left-0 right-0 text-center pointer-events-none">
        <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em] opacity-40">{backendMessage}</span>
      </div>
    </div>
  );
};

export default App;
