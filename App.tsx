
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Role, User, Booking, BookingStatus, Location, CouncilOrder, SavedNode, Feedback, SystemLog, ChatMessage } from './types';
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
    const users: User[] = saved ? JSON.parse(saved) : [];
    return users.map(u => ({
      ...u,
      location: u.location || { lat: -9.3283 + (Math.random() - 0.5) * 0.01, lng: 32.7569 + (Math.random() - 0.5) * 0.01 }
    }));
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
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(() => {
    const saved = localStorage.getItem('swensi-logs-v3');
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

  // Ringing State
  const [incomingJob, setIncomingJob] = useState<Booking | null>(null);
  const previousBookingsLength = useRef(bookings.length);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<any>(null);
  const ringTimeoutRef = useRef<any>(null);

  useEffect(() => { localStorage.setItem('swensi-users-v3', JSON.stringify(allUsers)); }, [allUsers]);
  useEffect(() => { localStorage.setItem('swensi-bookings-v3', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('swensi-feedback-v3', JSON.stringify(feedbacks)); }, [feedbacks]);
  useEffect(() => { localStorage.setItem('swensi-council-v3', JSON.stringify(councilOrders)); }, [councilOrders]);
  useEffect(() => { localStorage.setItem('swensi-logs-v3', JSON.stringify(systemLogs)); }, [systemLogs]);
  useEffect(() => { localStorage.setItem('swensi-admins-v3', JSON.stringify(adminNumbers)); }, [adminNumbers]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Connection Check
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('/api/hello');
        if (res.ok) {
          addNotification('SYSTEM ONLINE', 'Backend Uplink Established', 'SUCCESS');
        }
      } catch (e) {
        // Silent failure in dev if proxy not set yet
        console.log("Backend link pending...");
      }
    };
    checkBackend();
  }, []);

  useEffect(() => {
    const trackingInterval = setInterval(() => {
      setAllUsers(prev => prev.map(u => {
        if (u.role === Role.PROVIDER && (u.isOnline !== false) && u.location) {
          const activeBooking = bookings.find(b => b.providerId === u.id && [BookingStatus.ACCEPTED, BookingStatus.ON_TRIP].includes(b.status));
          let deltaLat = (Math.random() - 0.5) * 0.0002;
          let deltaLng = (Math.random() - 0.5) * 0.0002;
          if (activeBooking) {
            deltaLat = (activeBooking.location.lat - u.location.lat) * 0.05;
            deltaLng = (activeBooking.location.lng - u.location.lng) * 0.05;
          }
          const updated = {
            ...u,
            location: {
              lat: u.location.lat + deltaLat,
              lng: u.location.lng + deltaLng
            },
            lastActive: Date.now()
          };
          if (user && u.id === user.id) setUser(updated);
          return updated;
        }
        return u;
      }));
    }, 5000);
    return () => clearInterval(trackingInterval);
  }, [bookings, user?.id]);

  // Provider Ringing Logic
  useEffect(() => {
    if (bookings.length > previousBookingsLength.current) {
      // New booking detected
      const newBookings = bookings.slice(0, bookings.length - previousBookingsLength.current);
      
      // Check if provider is explicitly offline (isOnline === false). Undefined is treated as Online.
      if (user && user.role === Role.PROVIDER && (user.isOnline !== false)) {
        // Check eligibility
        const relevantJob = newBookings.find(b => 
          (b.status === BookingStatus.PENDING || b.status === BookingStatus.NEGOTIATING) &&
          (!b.providerId) && // Not yet taken
          (user.serviceCategories?.includes(b.category)) // Matches category
        );

        if (relevantJob) {
          setIncomingJob(relevantJob);
          startRinging();
          
          // Auto-reject after 30 seconds
          if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
          ringTimeoutRef.current = setTimeout(() => {
            stopRinging();
            setIncomingJob(null);
            addNotification("MISSED OPPORTUNITY", "Job offer expired.", "INFO");
          }, 30000); // 30 seconds
        }
      }
    }
    previousBookingsLength.current = bookings.length;
  }, [bookings, user]);

  const startRinging = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Play immediately
      playBeepSequence();

      // Loop every 2 seconds
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = setInterval(playBeepSequence, 2000);

    } catch (e) {
      console.error("Audio start failed", e);
    }
  };

  const stopRinging = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
    }
  };

  const playBeepSequence = () => {
      const ctx = audioContextRef.current;
      if (!ctx || ctx.state === 'closed') return;
      if (ctx.state === 'suspended') ctx.resume();

      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.linearRampToValueAtTime(1200, t + 0.1);
      osc.frequency.setValueAtTime(800, t + 0.2);
      osc.frequency.linearRampToValueAtTime(1200, t + 0.3);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
      gain.gain.linearRampToValueAtTime(0, t + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
  };

  // Stop ringing if incomingJob is cleared manually or accepted
  useEffect(() => {
    if (!incomingJob) {
      stopRinging();
    }
  }, [incomingJob]);

  const addNotification = useCallback((title: string, message: string, type: 'INFO' | 'ALERT' | 'SUCCESS' | 'SMS' = 'INFO') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [{ id, title, message, type }, ...prev]);
    setTimeout(() => { setNotifications(prev => prev.filter(n => n.id !== id)); }, 5000);
  }, []);

  const handleSendMessage = useCallback((bookingId: string, text: string) => {
    if (!user) return;
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        const newMessage: ChatMessage = {
          id: 'msg-' + Math.random().toString(36).substr(2, 9),
          senderId: user.id,
          text,
          timestamp: Date.now(),
          isRead: false
        };
        return { ...b, chatHistory: [...(b.chatHistory || []), newMessage] };
      }
      return b;
    }));
  }, [user]);

  const handleAddLog = useCallback((action: string, targetId?: string, severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO') => {
    if (!user) return;
    const newLog: SystemLog = {
        id: 'LOG-' + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        action,
        actorId: user.id,
        actorPhone: user.phone,
        targetId,
        severity
    };
    setSystemLogs(prev => [newLog, ...prev]);
  }, [user]);

  const handleUpdateSubscription = useCallback((plan: 'BASIC' | 'PREMIUM') => {
    if (!user) return;
    
    // Admin Override Logic
    if (user.role === Role.ADMIN || VERIFIED_ADMINS.includes(user.phone)) {
        addNotification('ADMIN OVERRIDE', 'Admins have free lifetime access.', 'SUCCESS');
        return;
    }

    if (user.role !== Role.PROVIDER) {
      addNotification('ACCESS DENIED', 'Subscriptions are reserved for Service Partners.', 'ALERT');
      return;
    }
    
    const planDetails = SUBSCRIPTION_PLANS[plan];
    if (user.balance < planDetails.price) {
      addNotification('INSUFFICIENT FUNDS', `Subscription for ${planDetails.name} requires ZMW ${planDetails.price}`, 'ALERT');
      return;
    }

    const expiry = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
    const updatedUser = { 
      ...user, 
      balance: user.balance - planDetails.price,
      isPremium: plan === 'PREMIUM',
      subscriptionExpiry: expiry
    };

    setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    setUser(updatedUser);
    addNotification('PLAN ACTIVATED', `${planDetails.name} is now live on your terminal node.`, 'SUCCESS');
  }, [user, addNotification]);

  const handleCancelBooking = useCallback((bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking || booking.status === BookingStatus.CANCELLED) return;

    const refundAmount = booking.negotiatedPrice || booking.price;

    setAllUsers(prevUsers => prevUsers.map(u => {
      if (u.id === booking.customerId) {
        return { ...u, balance: u.balance + refundAmount };
      }
      return u;
    }));

    if (user && user.id === booking.customerId) {
      setUser(prev => prev ? { ...prev, balance: prev.balance + refundAmount } : null);
    }

    setBookings(prev => prev.map(b => 
      b.id === bookingId ? { ...b, status: BookingStatus.CANCELLED } : b
    ));

    addNotification('MISSION ABORTED', 'Booking cancelled. Funds returned to wallet.', 'ALERT');
  }, [bookings, user, addNotification]);

  const handleUpdateBooking = useCallback((id: string, updates: Partial<Booking>) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const handleNegotiateBooking = useCallback((bookingId: string, newPrice: number, by: Role.CUSTOMER | Role.PROVIDER, providerId?: string) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        // Validation: Ensure customer has funds if provider is asking for more
        if (by === Role.PROVIDER) {
          const cust = allUsers.find(u => u.id === b.customerId);
          const currentPrice = b.negotiatedPrice || b.price;
          if (cust && newPrice > currentPrice && cust.balance < (newPrice - currentPrice)) {
             addNotification('NEGOTIATION ERROR', 'Customer has insufficient funds for this counter-offer.', 'ALERT');
             return b;
          }
        }

        const history = b.negotiationHistory || [];
        return { 
          ...b, 
          negotiatedPrice: newPrice, 
          lastOfferBy: by, 
          status: BookingStatus.NEGOTIATING,
          providerId: providerId || b.providerId, // Lock provider if this is a bid
          negotiationHistory: [...history, { price: newPrice, by, timestamp: Date.now() }] 
        };
      }
      return b;
    }));
  }, [allUsers, addNotification]);

  const handleRejectNegotiation = useCallback((bookingId: string, by: Role.CUSTOMER | Role.PROVIDER) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        if (by === Role.CUSTOMER) {
          return {
            ...b,
            status: BookingStatus.PENDING,
            providerId: undefined, // Unlock booking
            negotiatedPrice: undefined,
            lastOfferBy: undefined
          };
        }
        if (by === Role.PROVIDER) {
           return {
            ...b,
            status: BookingStatus.PENDING,
            providerId: undefined,
            negotiatedPrice: undefined,
            lastOfferBy: undefined
          };
        }
      }
      return b;
    }));
    addNotification('NEGOTIATION ENDED', 'Offer rejected. Booking returned to open pool.', 'INFO');
  }, [addNotification]);

  const handleAcceptNegotiation = useCallback((bookingId: string, by: Role.CUSTOMER | Role.PROVIDER, providerId?: string) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        const agreedPrice = b.negotiatedPrice || b.price;
        const originalPrice = b.price;
        const difference = agreedPrice - originalPrice;
        
        // Adjust customer balance if final price is different from initial deposit
        setAllUsers(users => users.map(u => {
          if (u.id === b.customerId) {
            const updated = { ...u, balance: u.balance - difference };
            if (user && u.id === user.id) setUser(updated);
            return updated;
          }
          return u;
        }));

        return { 
          ...b, 
          status: BookingStatus.ACCEPTED, 
          providerId: providerId || b.providerId, 
          commission: agreedPrice * PLATFORM_COMMISSION_RATE 
        };
      }
      return b;
    }));
    stopRinging();
    addNotification('HANDSHAKE AGREED', 'Negotiation successful. Mission commencing.', 'SUCCESS');
  }, [user, addNotification]);

  const handleSOS = useCallback(() => {
    addNotification('SOS ALERT', 'Emergency signal sent to nearby responders and admins.', 'ALERT');
  }, [addNotification]);

  const handleAddBooking = useCallback((data: Partial<Booking>) => {
    if (!user) return;
    const initialPrice = data.negotiatedPrice || data.price || 0;
    
    if (user.balance < initialPrice) {
      addNotification('INSUFFICIENT FUNDS', 'Please top up your wallet.', 'ALERT');
      return;
    }

    const newBooking: Booking = {
      id: 'BK-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      customerId: user.id,
      customerPhone: user.phone,
      status: data.negotiatedPrice ? BookingStatus.NEGOTIATING : BookingStatus.PENDING,
      createdAt: Date.now(),
      trackingHistory: [currentLocation],
      commission: initialPrice * PLATFORM_COMMISSION_RATE,
      isPaid: true,
      category: data.category || 'general',
      description: data.description || '',
      price: data.price || 0,
      negotiatedPrice: data.negotiatedPrice,
      lastOfferBy: data.negotiatedPrice ? Role.CUSTOMER : undefined,
      location: data.location || currentLocation,
      ...data
    } as Booking;

    setBookings(prev => [newBooking, ...prev]);
    setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, balance: u.balance - initialPrice } : u));
    setUser(prev => prev ? { ...prev, balance: prev.balance - initialPrice } : null);
    addNotification('MISSION LAUNCHED', data.negotiatedPrice ? 'Bargaining protocol active.' : 'Waiting for a partner.', 'SUCCESS');
  }, [user, currentLocation, addNotification]);

  const handleLogin = (phone: string, lang: string) => {
    const existingUser = allUsers.find(u => u.phone === phone);
    if (existingUser) {
      if (!existingUser.isActive) {
        addNotification('ACCESS DENIED', 'This terminal node has been suspended.', 'ALERT');
        return;
      }
      
      let role = existingUser.role;
      let isPremium = existingUser.isPremium;
      let subscriptionExpiry = existingUser.subscriptionExpiry;

      if (VERIFIED_ADMINS.includes(phone)) {
        if (role === Role.CUSTOMER) role = Role.ADMIN;
        // Admins don't need a formal subscription object, access is free via logic check
      }

      const updatedUser = { ...existingUser, role, isPremium, subscriptionExpiry, lastActive: Date.now() };
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

    const isAdmin = VERIFIED_ADMINS.includes(phone);

    const newUser: User = {
      id: 'USR-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      phone, name, 
      role: isAdmin ? Role.ADMIN : Role.CUSTOMER, 
      isActive: true, 
      isOnline: true, // Default to online so they receive bookings immediately
      lastActive: Date.now(), 
      balance: 500, 
      memberSince: Date.now(), 
      rating: 5.0, 
      language: lang, 
      trustScore: 90, 
      isVerified: true, 
      avatarUrl: avatar, 
      completedMissions: 0, 
      savedNodes: [],
      // Admins: No subscription property needed
      isPremium: false,
      subscriptionExpiry: undefined
    };
    
    setAllUsers(prev => [...prev, newUser]);
    setUser(newUser);
    setLanguage(lang);
    setViewMode(isAdmin ? 'MANAGEMENT' : 'CUSTOMER');
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
          onAddBooking={handleAddBooking} 
          location={currentLocation} 
          onSendFeedback={() => {}}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
          isDarkMode={isDarkMode} 
          onLanguageChange={setLanguage} 
          onCancelBooking={handleCancelBooking}
          onAcceptNegotiation={(id) => handleAcceptNegotiation(id, Role.CUSTOMER)}
          onCounterNegotiation={(id, price) => handleNegotiateBooking(id, price, Role.CUSTOMER)}
          onRejectNegotiation={(id) => handleRejectNegotiation(id, Role.CUSTOMER)}
          onBecomeProvider={(kyc) => {
            const updatedUser: User = { 
              ...user, 
              role: Role.PROVIDER, 
              licenseNumber: kyc.license, 
              licenseDocumentUrl: kyc.licenseUrl,
              homeAddress: kyc.address, 
              isVerified: false, 
              trustScore: 50, 
              kycSubmittedAt: Date.now(), 
              lastActive: Date.now(), 
              avatarUrl: kyc.photo || user.avatarUrl,
              serviceCategories: kyc.categories
            };
            setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
            setUser(updatedUser);
            addNotification('UPGRADE SUBMITTED', 'Partner application pending review. Subscription required for leads.', 'INFO');
          }} 
          onUpdateUser={(updates) => {
             const updated = { ...user, ...updates, lastActive: Date.now() };
             setUser(updated);
             setAllUsers(prev => prev.map(u => u.id === user.id ? updated : u));
          }}
          t={(k) => TRANSLATIONS[language]?.[k] || k} 
          onToggleViewMode={() => setViewMode('MANAGEMENT')}
          onSOS={handleSOS}
          onNotification={addNotification}
          onSendMessage={handleSendMessage}
        />
      );
    }

    switch (user.role) {
      case Role.ADMIN:
      case Role.WORKFLOW:
      case Role.FINANCE:
      case Role.MODERATOR:
        return (
          <AdminDashboard 
            user={user} logout={() => setUser(null)} bookings={bookings} allUsers={allUsers} councilOrders={councilOrders} feedbacks={feedbacks}
            systemLogs={systemLogs} onToggleBlock={(userId) => {
              setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive, lastActive: Date.now() } : u));
            }} 
            onDeleteUser={() => {}} 
            onToggleVerification={(userId) => {
              setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: !u.isVerified, lastActive: Date.now() } : u));
            }} 
            onUpdateUserRole={(userId, role) => {
              setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role, lastActive: Date.now() } : u));
            }}
            onMarkFeedbackRead={() => {}}
            adminNumbers={adminNumbers} onAddAdmin={() => {}} onRemoveAdmin={() => {}} 
            onToggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} onLanguageChange={setLanguage} sysDefaultLang={language} onUpdateSysDefaultLang={setLanguage} 
            t={(k) => TRANSLATIONS[language]?.[k] || k} onToggleViewMode={() => setViewMode('CUSTOMER')}
            onUpdateBooking={handleUpdateBooking} 
            onAddLog={handleAddLog}
          />
        );
      case Role.PROVIDER:
        return (
          <ProviderDashboard 
            user={user} logout={() => setUser(null)} bookings={bookings} allUsers={allUsers} 
            incomingJob={incomingJob} // Pass ringing job
            onUpdateStatus={(id, status, pId) => {
              setBookings(prev => prev.map(b => b.id === id ? { ...b, status, providerId: pId } : b));
              if (incomingJob?.id === id) setIncomingJob(null); // Clear ringing
            }} 
            onAcceptNegotiation={(id) => {
              handleAcceptNegotiation(id, Role.PROVIDER, user.id);
              if (incomingJob?.id === id) setIncomingJob(null);
            }}
            onCounterNegotiation={(id, price) => handleNegotiateBooking(id, price, Role.PROVIDER, user.id)}
            onRejectNegotiation={(id) => handleRejectNegotiation(id, Role.PROVIDER)}
            onConfirmCompletion={(id) => {
              setBookings(prev => prev.map(b => b.id === id ? { ...b, status: BookingStatus.COMPLETED } : b));
              addNotification('MISSION SUCCESS', 'Operation finalized.', 'SUCCESS');
            }} 
            onUpdateBooking={() => {}} 
            onUpdateSubscription={handleUpdateSubscription} 
            location={user.location || currentLocation} onToggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} 
            onLanguageChange={setLanguage} onUpdateUser={(u) => {
              const updated = { ...user, ...u, lastActive: Date.now() };
              setUser(updated);
              setAllUsers(prev => prev.map(usr => usr.id === user.id ? updated : usr));
            }} t={(k) => TRANSLATIONS[language]?.[k] || k} 
            onToggleViewMode={() => setViewMode('CUSTOMER')}
            onSendMessage={handleSendMessage}
          />
        );
      case Role.LODGE:
        return (
          <LodgeDashboard 
             user={user} logout={() => setUser(null)} bookings={bookings.filter(b => b.category === 'lodging')} 
             onUpdateBooking={handleUpdateBooking} 
             onUpdateUser={(u) => {
                const updated = { ...user, ...u };
                setUser(updated);
                setAllUsers(prev => prev.map(usr => usr.id === user.id ? updated : usr));
             }}
             onToggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} onLanguageChange={setLanguage} t={(k) => TRANSLATIONS[language]?.[k] || k}
             location={currentLocation}
          />
        );
      default: return null;
    }
  };

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : ''} safe-pb`}>
      <div className="fixed top-6 left-6 right-6 z-[3000] pointer-events-none flex flex-col gap-3">
         {notifications.map(n => (
           <div key={n.id} className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/10 dark:border-white/5 flex items-start gap-4 pointer-events-auto animate-slide-down transform transition-all hover:scale-105 cursor-pointer">
             <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg">
                <i className={`fa-brands fa-whatsapp text-2xl`}></i>
             </div>
             <div className="flex-1 min-w-0">
               <div className="flex justify-between items-center mb-0.5">
                 <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{n.title}</h4>
                 <span className="text-[10px] text-slate-400">now</span>
               </div>
               <p className="text-xs text-slate-600 dark:text-slate-300 leading-tight line-clamp-2">{n.message}</p>
             </div>
           </div>
         ))}
      </div>
      {!user ? <Auth onLogin={handleLogin} onRegister={handleRegister} onToggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} language={language} onLanguageChange={setLanguage} t={(k) => TRANSLATIONS[language]?.[k] || k} adminNumbers={adminNumbers} existingUsers={allUsers} onNotification={addNotification} /> : renderDashboard()}
      <SpeedInsights />
    </div>
  );
};

export default App;
