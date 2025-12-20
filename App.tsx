
import React, { useState, useEffect, useCallback } from 'react';
import { Role, User, Booking, BookingStatus, Location, SystemLog, CouncilOrder } from './types';
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
    addNotification('SMS GATEWAY', `Message sent to ${phone}`, 'SMS');
  }, [addNotification]);

  const handleSubscribe = (userId: string, fee: number) => {
    if (user && user.balance < fee) return alert("Insufficient Balance for Subscription");

    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const newExpiry = Date.now() + thirtyDays;

    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) return { ...u, balance: u.balance - fee, subscriptionExpiry: newExpiry };
      if (u.phone === SUPER_ADMIN) return { ...u, balance: u.balance + fee }; // Revenue routed to Admin
      return u;
    }));

    if (user?.id === userId) {
      setUser(prev => prev ? { ...prev, balance: prev.balance - fee, subscriptionExpiry: newExpiry } : null);
    }

    addNotification('REVENUE LOGGED', `Subscription active until ${new Date(newExpiry).toLocaleDateString()}`, 'SUCCESS');
    sendMockSMS(user?.phone || '', `Swensi Billing: Subscription renewed. ZMW ${fee.toFixed(2)} deducted. Active until ${new Date(newExpiry).toLocaleDateString()}.`);
  };

  const addBooking = (bookingData: Partial<Booking>) => {
    const price = bookingData.price || 50;
    if (user && user.balance < price) return alert("Insufficient Escrow Balance");

    setPendingPayment({
      amount: price,
      desc: `Initiate Mission: ${bookingData.category}`,
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
          commission: price * PLATFORM_COMMISSION_RATE, // 0.24% Platform Slice
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
          type: bookingData.category === 'transport' ? 'TRANSPORT_LEVY' : 'TRADE_PERMIT',
          status: 'ISSUED',
          issuedAt: Date.now()
        };

        setBookings(prev => [newBooking, ...prev]);
        setCouncilOrders(prev => [newCouncilOrder, ...prev]);
        
        const newBalance = (user?.balance || 0) - price;
        setUser(u => u ? { ...u, balance: newBalance } : null);
        setAllUsers(prev => prev.map(u => u.id === user?.id ? { ...u, balance: newBalance } : u));
        setPendingPayment(null);
        addNotification('MISSION LOGGED', 'Mission & Council Compliance established.', 'SUCCESS');
        sendMockSMS(user?.phone || '', `Swensi Booking: Your mission ${bookingId} has been logged. Escrow ZMW ${price.toFixed(2)} secured.`);
      }
    });
  };

  const updateBooking = (id: string, updates: Partial<Booking>) => {
    setBookings(prev => prev.map(b => {
      if (b.id === id) {
        const updated = { ...b, ...updates };
        if (updates.status === BookingStatus.COMPLETED && !b.isPaid) {
          const providerPay = b.price - b.commission;
          setAllUsers(uPrev => uPrev.map(u => {
            // Pay Provider
            if (u.id === b.providerId) {
              sendMockSMS(u.phone, `Swensi Payout: Mission ${b.id} completed. ZMW ${providerPay.toFixed(2)} added to your node balance.`);
              return { ...u, balance: u.balance + providerPay, completedMissions: (u.completedMissions || 0) + 1 };
            }
            // Pay Platform Admin (Commission Slice)
            if (u.phone === SUPER_ADMIN) {
              return { ...u, balance: u.balance + b.commission };
            }
            return u;
          }));
          return { ...updated, isPaid: true };
        }
        return updated;
      }
      return b;
    }));
  };

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
      role: Role.CUSTOMER,
      isActive: true,
      balance: 500, // Starting balance for demo
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
    addNotification('NODE ESTABLISHED', `Welcome to the Nakonde Hub, ${name}`, 'SUCCESS');
    sendMockSMS(phone, `Swensi: Welcome ${name}! Your node is active. Initial balance: ZMW 500.00.`);
  };

  const renderDashboard = () => {
    if (!user) return null;

    if (viewMode === 'CUSTOMER') {
      return (
        <CustomerDashboard 
          user={user} logout={() => setUser(null)} bookings={bookings.filter(b => b.customerId === user.id)} 
          councilOrders={councilOrders} onAddBooking={addBooking} location={currentLocation} 
          onConfirmCompletion={(id) => updateBooking(id, { status: BookingStatus.COMPLETED })} 
          onUpdateBooking={updateBooking} onRate={() => {}} onUploadFacePhoto={() => {}} 
          onToggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} onLanguageChange={setLanguage} 
          onBecomeProvider={(kyc) => {
            const updatedUser: User = { 
              ...user, role: Role.PROVIDER, isVerified: false, trustScore: 50,
              licenseNumber: kyc.license, homeAddress: kyc.address, avatarUrl: kyc.photo, kycSubmittedAt: Date.now(),
              subscriptionExpiry: 0 // New providers start with no subscription
            };
            setUser(updatedUser);
            setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
            setViewMode('MANAGEMENT');
            addNotification('KYC SUBMITTED', 'Dossier received for clearance.', 'SUCCESS');
          }} 
          onUpdateUser={(updates) => {
            setUser(u => u ? { ...u, ...updates } : null);
            setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updates } : u));
          }} 
          t={(k) => TRANSLATIONS[language]?.[k] || k} onToggleViewMode={() => setViewMode('MANAGEMENT')}
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
              setAllUsers(prev => prev.map(u => {
                if (u.id === userId) {
                  const newVerified = !u.isVerified;
                  if (newVerified) sendMockSMS(u.phone, `Swensi Alert: Your node has been VERIFIED.`);
                  return { ...u, isVerified: newVerified };
                }
                return u;
              }));
            }} 
            adminNumbers={adminNumbers} onAddAdmin={() => {}} onRemoveAdmin={() => {}} onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
            isDarkMode={isDarkMode} onLanguageChange={setLanguage} sysDefaultLang={language} onUpdateSysDefaultLang={() => {}} 
            t={(k) => TRANSLATIONS[language]?.[k] || k} onToggleViewMode={() => setViewMode('CUSTOMER')}
          />
        );
      case Role.PROVIDER:
        return (
          <ProviderDashboard 
            user={user} logout={() => setUser(null)} bookings={bookings} allUsers={allUsers} 
            onUpdateStatus={(id, status, pid) => updateBooking(id, { status, providerId: pid })} 
            onConfirmCompletion={(id) => updateBooking(id, { status: BookingStatus.COMPLETED })} 
            onUpdateBooking={updateBooking} 
            onUpdateSubscription={(plan) => handleSubscribe(user.id, plan === 'PREMIUM' ? SUBSCRIPTION_PLANS.PREMIUM : SUBSCRIPTION_PLANS.BASIC)} 
            location={currentLocation} onToggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} 
            onLanguageChange={setLanguage} onUpdateUser={(updates) => {
              setUser(u => u ? { ...u, ...updates } : null);
              setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updates } : u));
            }} t={(k) => TRANSLATIONS[language]?.[k] || k} onToggleViewMode={() => setViewMode('CUSTOMER')}
          />
        );
      default: return null;
    }
  };

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : ''} safe-pb`}>
      <div className="fixed top-6 left-6 right-6 z-[2000] pointer-events-none flex flex-col gap-3">
         {notifications.map(n => (
           <div key={n.id} className={`p-4 rounded-[24px] shadow-2xl backdrop-blur-xl border border-white/10 ${n.type === 'SMS' ? 'bg-blue-600/90' : 'bg-slate-900/95'} text-white animate-slide-up pointer-events-auto`}>
             <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${n.type === 'SUCCESS' ? 'bg-emerald-500' : n.type === 'SMS' ? 'bg-white' : 'bg-blue-500'} animate-pulse`}></div>
               <div>
                 <p className="text-[9px] font-black uppercase italic tracking-widest opacity-80">{n.title}</p>
                 <p className="text-[11px] font-bold mt-1.5 leading-tight">{n.message}</p>
               </div>
             </div>
           </div>
         ))}
      </div>
      {!user ? <Auth onLogin={handleLogin} onRegister={handleRegister} onToggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} language={language} onLanguageChange={setLanguage} t={(k) => TRANSLATIONS[language]?.[k] || k} adminNumbers={adminNumbers} existingUsers={allUsers} /> : renderDashboard()}
      {pendingPayment && (
        <div className="fixed inset-0 z-[1500] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl border-2 border-blue-600 text-center animate-zoom-in">
              <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-fingerprint text-blue-600 text-3xl"></i>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 italic uppercase tracking-tighter">Authorize Payment</h3>
              <p className="text-4xl font-black text-blue-700 mb-8 italic tracking-tight">ZMW {pendingPayment.amount.toFixed(2)}</p>
              <div className="space-y-3">
                <button onClick={pendingPayment.onComplete} className="w-full py-5 bg-blue-700 text-white font-black rounded-[24px] text-[11px] uppercase tracking-[0.2em] italic">Commit Funds</button>
                <button onClick={() => setPendingPayment(null)} className="w-full py-3 text-slate-400 font-black text-[9px] uppercase tracking-widest">Abort</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
