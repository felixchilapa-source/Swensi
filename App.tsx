
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

  const handleSOS = useCallback(() => {
    if (!user) return;
    addNotification('SOS TRIGGERED', 'Emergency services alerted.', 'ALERT');
  }, [user, addNotification]);

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

  const renderDashboard = () => {
    if (!user) return null;

    if (viewMode === 'CUSTOMER' || user.role === Role.CUSTOMER) {
      return (
        <CustomerDashboard 
          user={user} 
          logout={() => setUser(null)} 
          bookings={bookings.filter(b => b.customerId === user.id)} 
          councilOrders={councilOrders.filter(co => co.customerPhone === user.phone)} 
          allUsers={allUsers}
          onAddBooking={() => {}} 
          location={currentLocation} 
          onSendFeedback={() => {}}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
          isDarkMode={isDarkMode} 
          onLanguageChange={setLanguage} 
          onBecomeProvider={(kyc) => {
            const updatedUser: User = { 
              ...user, 
              role: Role.PROVIDER, 
              licenseNumber: kyc.license, 
              homeAddress: kyc.address, 
              isVerified: false, 
              trustScore: 50, 
              kycSubmittedAt: Date.now(), 
              lastActive: Date.now(), 
              avatarUrl: kyc.photo || user.avatarUrl 
            };
            setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
            setUser(updatedUser);
            addNotification('UPGRADE SUBMITTED', 'Your Partner application is pending review.', 'INFO');
          }} 
          onUpdateUser={(updates) => {
            const updated = { ...user, ...updates, lastActive: Date.now() };
            setUser(updated);
            setAllUsers(prev => prev.map(u => u.id === user.id ? updated : u));
          }} 
          t={(k) => TRANSLATIONS[language]?.[k] || k} 
          onToggleViewMode={() => setViewMode('MANAGEMENT')}
          onSOS={handleSOS}
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
            onDeleteUser={() => {}} 
            onToggleVerification={(userId) => {
              setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: !u.isVerified, lastActive: Date.now() } : u));
              addNotification('NODE AUTHORIZED', 'Partner access granted.', 'SUCCESS');
            }} 
            onUpdateUserRole={(userId, role) => {
              setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role, lastActive: Date.now() } : u));
            }}
            onMarkFeedbackRead={() => {}}
            adminNumbers={adminNumbers} onAddAdmin={() => {}} onRemoveAdmin={() => {}} 
            onToggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} onLanguageChange={setLanguage} sysDefaultLang={language} onUpdateSysDefaultLang={setLanguage} 
            t={(k) => TRANSLATIONS[language]?.[k] || k} onToggleViewMode={() => setViewMode('CUSTOMER')}
          />
        );
      case Role.PROVIDER:
        return (
          <ProviderDashboard 
            user={user} logout={() => setUser(null)} bookings={bookings} allUsers={allUsers} 
            onUpdateStatus={() => {}} 
            onConfirmCompletion={() => {}} 
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
      <div className="fixed top-6 left-6 right-6 z-[2000] pointer-events-none flex flex-col gap-3">
         {notifications.map(n => (
           <div key={n.id} className="p-4 rounded-[24px] shadow-2xl backdrop-blur-xl border border-white/10 bg-slate-900/95 text-white animate-slide-up pointer-events-auto">
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
      {!user ? <Auth onLogin={handleLogin} onRegister={handleRegister} onToggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} language={language} onLanguageChange={setLanguage} t={(k) => TRANSLATIONS[language]?.[k] || k} adminNumbers={adminNumbers} existingUsers={allUsers} /> : renderDashboard()}
    </div>
  );
};

export default App;
