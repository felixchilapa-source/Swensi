
import React, { useState, useEffect, useCallback } from 'react';
import { Role, User, Booking, BookingStatus, Location, CouncilOrder, SavedNode, Feedback } from './types';
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

const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

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
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(() => {
    const saved = localStorage.getItem('swensi-feedback-v3');
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

  useEffect(() => {
    fetch("https://swensi.onrender.com/api/hello")
      .then((res) => res.json())
      .then((data) => setBackendMessage(data.message))
      .catch(() => setBackendMessage("Hub Online"));
  }, []);

  useEffect(() => {
    const now = Date.now();
    let hasChanges = false;
    const checkedUsers = allUsers.map(u => {
      if (u.isActive && u.lastActive && (now - u.lastActive > SIX_MONTHS_MS)) {
        hasChanges = true;
        return { ...u, isActive: false };
      }
      return u;
    });

    if (hasChanges) {
      setAllUsers(checkedUsers);
    }
  }, []); 

  useEffect(() => { localStorage.setItem('swensi-users-v3', JSON.stringify(allUsers)); }, [allUsers]);
  useEffect(() => { localStorage.setItem('swensi-bookings-v3', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('swensi-feedback-v3', JSON.stringify(feedbacks)); }, [feedbacks]);
  useEffect(() => { localStorage.setItem('swensi-council-v3', JSON.stringify(councilOrders)); }, [councilOrders]);
  useEffect(() => { localStorage.setItem('swensi-admins-v3', JSON.stringify(adminNumbers)); }, [adminNumbers]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const addNotification = useCallback((title: string, message: string, type: 'INFO' | 'ALERT' | 'SUCCESS' | 'SMS' = 'INFO') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [{ id, title, message, type }, ...prev]);
    setTimeout(() => { setNotifications(prev => prev.filter(n => n.id !== id)); }, 5000);
  }, []);

  const sendMockSMS = useCallback((phone: string, message: string) => {
    addNotification('SMS GATEWAY', `Message to ${phone}`, 'SMS');
  }, [addNotification]);

  const handleSOS = useCallback(() => {
    if (!user) return;
    const msg = `🚨 EMERGENCY SOS: ${user.name} (${user.phone}) triggered distress.`;
    sendMockSMS(SUPER_ADMIN, msg);
    addNotification('SOS TRIGGERED', 'Emergency services alerted.', 'ALERT');
  }, [user, sendMockSMS, addNotification]);

  const handleDeposit = useCallback((amount: number) => {
    if (!user) return;
    const updatedUsers = allUsers.map(u => u.id === user.id ? { ...u, balance: u.balance + amount, lastActive: Date.now() } : u);
    setAllUsers(updatedUsers);
    const updatedUser = { ...user, balance: user.balance + amount, lastActive: Date.now() };
    setUser(updatedUser);
    addNotification('DEPOSIT SUCCESS', `ZMW ${amount.toFixed(2)} added to Escrow.`, 'SUCCESS');
  }, [user, allUsers, addNotification]);

  const handleSendFeedback = (feedbackData: Partial<Feedback>) => {
    const newFeedback: Feedback = {
      id: 'FB-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      userId: user?.id || 'anonymous',
      userPhone: user?.phone || 'unknown',
      rating: feedbackData.rating || 5,
      comment: feedbackData.comment || '',
      timestamp: Date.now(),
      isRead: false,
      ...feedbackData
    };
    setFeedbacks(prev => [newFeedback, ...prev]);
    addNotification('FEEDBACK SENT', 'Admin has been notified of your experience.', 'SUCCESS');
  };

  const handleLogin = (phone: string, lang: string) => {
    const existingUser = allUsers.find(u => u.phone === phone);
    if (existingUser) {
      if (!existingUser.isActive) {
        addNotification('ACCESS DENIED', 'This terminal node has been suspended.', 'ALERT');
        return;
      }
      const updatedUser = { ...existingUser, lastActive: Date.now() };
      setUser(updatedUser);
      setAllUsers(prev => prev.map(u => u.id === existingUser.id ? updatedUser : u));
      setLanguage(lang);
      localStorage.setItem('swensi-lang', lang);
      setViewMode(updatedUser.role !== Role.CUSTOMER ? 'MANAGEMENT' : 'CUSTOMER');
      addNotification('ACCESS GRANTED', `Terminal linked to ${updatedUser.name}`, 'SUCCESS');
    }
  };

  const handleRegister = (phone: string, name: string, avatar: string, lang: string) => {
    const existingUser = allUsers.find(u => u.phone === phone);
    if (existingUser) { handleLogin(phone, lang); return; }

    const newUser: User = {
      id: 'USR-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      phone, name, role: Role.CUSTOMER, isActive: true, lastActive: Date.now(), balance: 100, memberSince: Date.now(), rating: 5.0, language: lang, trustScore: 90, isVerified: true, avatarUrl: avatar, completedMissions: 0, savedNodes: []
    };
    
    setAllUsers(prev => [...prev, newUser]);
    setUser(newUser);
    setLanguage(lang);
    setViewMode('CUSTOMER');
    localStorage.setItem('swensi-lang', lang);
    addNotification('NODE ESTABLISHED', `Welcome to the Hub, ${name}`, 'SUCCESS');
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
          issuedAt: Date.now(),
          metadata: { category: newBooking.category, description: newBooking.description }
        };

        setBookings(prev => [newBooking, ...prev]);
        setCouncilOrders(prev => [newCouncilOrder, ...prev]);
        
        const newBalance = (user?.balance || 0) - price;
        const updatedUser = user ? { ...user, balance: newBalance, lastActive: Date.now() } : null;
        setUser(updatedUser);
        setAllUsers(prev => prev.map(u => u.id === user?.id ? { ...u, balance: newBalance, lastActive: Date.now() } : u));
        setPendingPayment(null);
        addNotification('MISSION LOGGED', 'Broadcasted to all providers.', 'SUCCESS');
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
          councilOrders={councilOrders.filter(co => co.customerPhone === user.phone)} 
          allUsers={allUsers} // Added for discovery
          onAddBooking={addBooking} 
          location={currentLocation} 
          onSendFeedback={handleSendFeedback}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
          isDarkMode={isDarkMode} 
          onLanguageChange={setLanguage} 
          onBecomeProvider={(kyc) => {
            const updatedUser: User = { ...user, role: Role.PROVIDER, licenseNumber: kyc.license, homeAddress: kyc.address, isVerified: false, trustScore: 50, kycSubmittedAt: Date.now(), lastActive: Date.now(), avatarUrl: kyc.photo || user.avatarUrl };
            setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
            setUser(updatedUser);
            addNotification('UPGRADE SUBMITTED', 'Your Partner application is pending review.', 'INFO');
          }} 
          onUpdateUser={(updates) => {
            const updated = user ? { ...user, ...updates, lastActive: Date.now() } : null;
            setUser(updated);
            setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updates, lastActive: Date.now() } : u));
          }} 
          t={(k) => TRANSLATIONS[language]?.[k] || k} 
          onToggleViewMode={() => setViewMode('MANAGEMENT')}
          onSOS={handleSOS}
          onDeposit={handleDeposit}
          onSaveNode={(node) => {
             const updatedNodes = [...(user.savedNodes || []), node];
             const updatedUser = { ...user, savedNodes: updatedNodes, lastActive: Date.now() };
             setUser(updatedUser);
             setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
             addNotification('NODE SAVED', `${node.name} added.`, 'SUCCESS');
          }}
        />
      );
    }

    switch (user.role) {
      case Role.ADMIN:
        return (
          <AdminDashboard 
            user={user} logout={() => setUser(null)} bookings={bookings} allUsers={allUsers} councilOrders={councilOrders} feedbacks={feedbacks}
            systemLogs={[]} onToggleBlock={(userId) => {
              setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive, lastActive: Date.now() } : u));
            }} 
            onDeleteUser={(userId) => setAllUsers(prev => prev.filter(u => u.id !== userId))} 
            onToggleVerification={(userId) => {
              setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: !u.isVerified, lastActive: Date.now() } : u));
              addNotification('NODE AUTHORIZED', 'Partner access granted.', 'SUCCESS');
            }} 
            onUpdateUserRole={(userId, role) => {
              setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role, lastActive: Date.now() } : u));
            }}
            onMarkFeedbackRead={(id) => setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, isRead: true } : f))}
            adminNumbers={adminNumbers} onAddAdmin={(p) => setAdminNumbers(prev => [...prev, p])} onRemoveAdmin={(p) => setAdminNumbers(prev => prev.filter(x => x !== p))} 
            onToggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} onLanguageChange={setLanguage} sysDefaultLang={language} onUpdateSysDefaultLang={setLanguage} 
            t={(k) => TRANSLATIONS[language]?.[k] || k} onToggleViewMode={() => setViewMode('CUSTOMER')}
          />
        );
      case Role.LODGE: // Added specific route for Lodge Dashboard
        return (
          <LodgeDashboard 
            user={user} 
            logout={() => setUser(null)} 
            bookings={bookings.filter(b => b.providerId === user.id || b.lodgeId === user.id)} 
            onUpdateBooking={(id, updates) => {
              setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
            }}
            onUpdateUser={(updates) => {
              const updated = { ...user, ...updates, lastActive: Date.now() };
              setUser(updated);
              setAllUsers(prev => prev.map(u => u.id === user.id ? updated : u));
            }}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
            isDarkMode={isDarkMode} 
            onLanguageChange={setLanguage} 
            t={(k) => TRANSLATIONS[language]?.[k] || k} 
          />
        );
      case Role.PROVIDER:
        return (
          <ProviderDashboard 
            user={user} logout={() => setUser(null)} bookings={bookings} allUsers={allUsers} 
            onUpdateStatus={(id, status, pId) => {
              setBookings(prev => prev.map(b => b.id === id ? { ...b, status, providerId: pId } : b));
              addNotification('MISSION UPDATE', `Mission ${id} status: ${status}`, 'INFO');
            }} 
            onConfirmCompletion={(id) => {
              setBookings(prev => prev.map(b => b.id === id ? { ...b, status: BookingStatus.COMPLETED, isPaid: true } : b));
              addNotification('MISSION COMPLETED', 'Payment released.', 'SUCCESS');
            }} 
            onUpdateBooking={() => {}} onUpdateSubscription={() => {}} 
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
      {/* Notifications and Overlays */}
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
        <Auth onLogin={handleLogin} onRegister={handleRegister} onToggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} language={language} onLanguageChange={setLanguage} t={(k) => TRANSLATIONS[language]?.[k] || k} adminNumbers={adminNumbers} existingUsers={allUsers} 
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
    </div>
  );
};

export default App;
