
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { User, Booking, Location, BookingStatus, Role, CouncilOrder, SavedNode, Feedback, ShoppingItem } from '../types';
import { CATEGORIES, Category, PAYMENT_NUMBERS, LANGUAGES, COLORS, TRANSPORT_RATE_PER_KM } from '../constants';
import Map from './Map';
import NewsTicker from './NewsTicker';
import AIAssistant from './AIAssistant';
import TradeFeed from './TradeFeed';
import { GoogleGenAI, Type } from "@google/genai";

interface CustomerDashboardProps {
  user: User;
  logout: () => void;
  bookings: Booking[];
  councilOrders: CouncilOrder[];
  allUsers?: User[]; 
  onAddBooking: (data: Partial<Booking>) => void;
  onCancelBooking: (id: string) => void;
  onAcceptNegotiation: (id: string) => void;
  onCounterNegotiation: (id: string, price: number) => void;
  onRejectNegotiation: (id: string) => void;
  location: Location;
  onSendFeedback: (f: Partial<Feedback>) => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  onLanguageChange: (lang: string) => void;
  onBecomeProvider: (kyc: { license: string, address: string, photo: string, licenseUrl: string, categories: string[] }) => void;
  onUpdateUser: (updates: Partial<User>) => void;
  t: (key: string) => string;
  onToggleViewMode?: () => void;
  onSOS?: () => void;
  onDeposit?: (amount: number) => void;
  onSaveNode?: (node: SavedNode) => void;
  onNotification: (title: string, message: string, type: 'INFO' | 'ALERT' | 'SUCCESS') => void;
}

// Haversine formula to calculate distance in KM
const calculateDistance = (loc1: Location, loc2: Location): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
  const dLon = (loc2.lng - loc1.lng) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * (Math.PI / 180)) * Math.cos(loc2.lat * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const d = R * c; 
  return parseFloat((d * 1.4).toFixed(1)); // Multiply by 1.4 to estimate road distance vs straight line
};

const getStatusConfig = (status: BookingStatus) => {
  switch (status) {
    case BookingStatus.PENDING:
      return { color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', icon: 'fa-hourglass-start', label: 'Searching' };
    case BookingStatus.NEGOTIATING:
      return { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: 'fa-comments-dollar', label: 'Negotiating' };
    case BookingStatus.ACCEPTED:
      return { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'fa-thumbs-up', label: 'Accepted' };
    case BookingStatus.ON_TRIP:
      return { color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: 'fa-route', label: 'On Trip' };
    case BookingStatus.GOODS_IN_TRANSIT:
      return { color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: 'fa-truck-fast', label: 'In Transit' };
    case BookingStatus.DELIVERED:
      return { color: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/20', icon: 'fa-box-open', label: 'Delivered' };
    case BookingStatus.COMPLETED:
      return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'fa-flag-checkered', label: 'Completed' };
    case BookingStatus.CANCELLED:
      return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: 'fa-ban', label: 'Cancelled' };
    case BookingStatus.ROOM_ASSIGNED:
      return { color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: 'fa-bed', label: 'Room Assigned' };
    case BookingStatus.SO_TICKING:
      return { color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20', icon: 'fa-stopwatch', label: 'Processing' };
    default:
      return { color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', icon: 'fa-circle-question', label: status };
  }
};

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ 
  user, logout, bookings, allUsers = [], onAddBooking, onCancelBooking, onAcceptNegotiation, onCounterNegotiation, onRejectNegotiation, location, onSOS, onDeposit, onBecomeProvider, onToggleViewMode, onSaveNode, onSendFeedback, t, onToggleTheme, isDarkMode, onLanguageChange, onNotification
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'active' | 'account'>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showKycForm, setShowKycForm] = useState(false);
  
  const [kycLicense, setKycLicense] = useState('');
  const [kycAddress, setKycAddress] = useState('');
  const [kycCategory, setKycCategory] = useState<string>(CATEGORIES[0].id);
  const [kycLicenseFile, setKycLicenseFile] = useState('');
  const [kycPhotoFile, setKycPhotoFile] = useState('');
  
  const [isHaggling, setIsHaggling] = useState(false);
  const [haggledPrice, setHaggledPrice] = useState<number>(0);
  const [counterInputs, setCounterInputs] = useState<{[key:string]: number}>({});

  // Transport Specifics
  const [tripDistance, setTripDistance] = useState<number>(0);
  const [tripDestination, setTripDestination] = useState('');
  
  // New: Pickup Location State
  const [pickupMode, setPickupMode] = useState<'CURRENT' | 'CUSTOM'>('CURRENT');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState<Location>(location);
  const [destinationCoords, setDestinationCoords] = useState<Location | null>(null);

  // Suggestions State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isForOther, setIsForOther] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const [missionDesc, setMissionDesc] = useState('');
  const [mapCenter, setMapCenter] = useState<Location>(location);
  
  const [shoppingItems, setShoppingItems] = useState<string[]>([]);

  const activeBookings = useMemo(() => bookings.filter(b => b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CANCELLED), [bookings]);

  const { mapMarkers, mapMissions } = useMemo(() => {
    const markers: Array<{ loc: Location; color: string; label: string; isLive?: boolean; id?: string }> = [
      { loc: location, color: '#059669', label: 'Me', isLive: true, id: user.id }
    ];
    const missions: Array<{ from: Location; to: Location; id: string }> = [];

    activeBookings.forEach(b => {
      if (b.providerId) {
        const provider = allUsers.find(u => u.id === b.providerId);
        if (provider && provider.location) {
          markers.push({
            loc: provider.location,
            color: '#3b82f6',
            label: `Agent: ${provider.name}`,
            isLive: true,
            id: provider.id
          });
          if ([BookingStatus.ACCEPTED, BookingStatus.ON_TRIP].includes(b.status)) {
            missions.push({ from: location, to: provider.location, id: b.id });
          }
        }
      }
    });

    allUsers.forEach(u => {
      if (u.id !== user.id && u.location && !markers.some(m => m.id === u.id)) {
        if (u.role === Role.LODGE) {
          markers.push({ loc: u.location, color: COLORS.HOSPITALITY, label: u.name });
        } else if (u.role === Role.SHOP_OWNER) {
          markers.push({ loc: u.location, color: COLORS.WARNING, label: u.name });
        }
      }
    });

    return { mapMarkers: markers, mapMissions: missions };
  }, [allUsers, activeBookings, location, user.id]);

  useEffect(() => {
    if (selectedCategory?.pricingModel === 'DISTANCE') {
      const price = selectedCategory.basePrice + (tripDistance * TRANSPORT_RATE_PER_KM);
      setHaggledPrice(Math.round(price));
    }
  }, [tripDistance, selectedCategory]);

  // Update pickup coords when switching modes
  useEffect(() => {
    if (pickupMode === 'CURRENT') {
      setPickupCoords(location);
    }
  }, [pickupMode, location]);

  const fetchPlaceSuggestions = async (input: string) => {
    if (input.length < 3) return;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `List 3 popular places or landmarks in Nakonde, Zambia that match the search term "${input}". Return a simple JSON array of strings only.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      const data = JSON.parse(response.text || '[]');
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (e) {
      console.error("Suggestion fetch failed", e);
    }
  };

  const handleDestinationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTripDestination(val);
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchPlaceSuggestions(val);
    }, 800);
  };

  const resolveCoordinates = async (placeName: string): Promise<Location | null> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `What are the estimated latitude and longitude coordinates for "${placeName}" in Nakonde, Zambia? Return JSON.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER }
            }
          }
        }
      });
      const data = JSON.parse(response.text || 'null');
      return data;
    } catch (e) {
      console.error("Coord resolution failed", e);
      return null;
    }
  };

  const handleSelectSuggestion = async (place: string) => {
    setTripDestination(place);
    setShowSuggestions(false);
    setIsCalculating(true);

    // 1. Resolve Pickup Coords (if custom)
    let startLoc = pickupMode === 'CURRENT' ? location : pickupCoords;
    if (pickupMode === 'CUSTOM' && pickupAddress) {
      const resolvedPickup = await resolveCoordinates(pickupAddress);
      if (resolvedPickup) {
        startLoc = resolvedPickup;
        setPickupCoords(resolvedPickup);
      }
    }

    // 2. Resolve Destination Coords
    const destLoc = await resolveCoordinates(place);
    
    // 3. Calculate
    if (startLoc && destLoc) {
      setDestinationCoords(destLoc);
      const dist = calculateDistance(startLoc, destLoc);
      setTripDistance(dist);
    }

    setIsCalculating(false);
  };

  const handleLaunchMission = () => {
    if (!selectedCategory) return;
    
    let finalDesc = missionDesc;
    let finalItems: ShoppingItem[] = [];
    let initialPrice = selectedCategory.basePrice;
    let isNegotiated = false;

    if (selectedCategory.id === 'shop_for_me') {
      finalDesc = `Shopping Mission: ${shoppingItems.join(', ')}. ${missionDesc}`;
      finalItems = shoppingItems.map(name => ({ id: Math.random().toString(36).substr(2, 5), name, isAvailable: true }));
    }

    if (selectedCategory.pricingModel === 'DISTANCE') {
      if (tripDistance <= 0 || !tripDestination) {
        onNotification('MISSING INFO', 'Please select a valid destination to calculate fare.', 'ALERT');
        return;
      }
      initialPrice = selectedCategory.basePrice + (tripDistance * TRANSPORT_RATE_PER_KM);
      const pickupText = pickupMode === 'CURRENT' ? 'My Location' : pickupAddress;
      finalDesc = `Trip: ${pickupText} -> ${tripDestination} (${tripDistance}km). ${missionDesc}`;
    }

    if (selectedCategory.pricingModel === 'QUOTE') {
      // Allow user to set a budget/offer for quote-based services
      initialPrice = haggledPrice > 0 ? haggledPrice : 0;
      isNegotiated = true; 
      if (!missionDesc.trim()) {
        onNotification('DETAILS NEEDED', 'Please describe your request so providers can send a quote.', 'ALERT');
        return;
      }
    } else {
      isNegotiated = isHaggling;
    }

    onAddBooking({ 
      category: selectedCategory.id, 
      description: finalDesc, 
      price: initialPrice, 
      negotiatedPrice: isNegotiated ? (haggledPrice > 0 ? haggledPrice : 0) : undefined,
      location: pickupMode === 'CUSTOM' ? pickupCoords : location,
      destination: selectedCategory.pricingModel === 'DISTANCE' && destinationCoords ? { ...destinationCoords, address: tripDestination } : undefined,
      isShoppingOrder: selectedCategory.id === 'shop_for_me',
      shoppingItems: finalItems,
      recipientName: isForOther ? recipientName : undefined,
      recipientPhone: isForOther ? recipientPhone : undefined
    });
    
    setSelectedCategory(null);
    setMissionDesc('');
    setShoppingItems([]);
    setIsHaggling(false);
    setHaggledPrice(0); // Reset price
    setTripDistance(0);
    setTripDestination('');
    setPickupMode('CURRENT');
    setPickupAddress('');
    setIsForOther(false);
    setRecipientName('');
    setRecipientPhone('');
    setActiveTab('active');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setter(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const handleSubmitKyc = () => {
    const isTransport = ['transport', 'trucking'].includes(kycCategory);

    if (!kycLicense || !kycAddress) {
        onNotification('KYC ERROR', 'License/ID Number and Address are mandatory.', 'ALERT');
        return;
    }

    if (isTransport) {
        if (!kycLicenseFile) {
            onNotification('KYC ERROR', 'For transport services, you must attach a photo of your Driving License.', 'ALERT');
            return;
        }
        if (!kycPhotoFile && !user.avatarUrl) {
            onNotification('KYC ERROR', 'A profile picture is mandatory for transport providers.', 'ALERT');
            return;
        }
    }

    onBecomeProvider({ 
      license: kycLicense, 
      address: kycAddress, 
      photo: kycPhotoFile || user.avatarUrl || '',
      licenseUrl: kycLicenseFile, 
      categories: [kycCategory] 
    });
    setShowKycForm(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <AIAssistant />

      <header className="px-5 py-4 flex justify-between items-center glass-nav border-b dark:border-white/5 sticky top-0 z-[50] backdrop-blur-xl safe-pt">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-700 w-10 h-10 rounded-2xl flex items-center justify-center transform -rotate-6 shadow-md">
            <i className="fas fa-link text-white text-base"></i>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Swensi</h2>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right">
             <p className="text-[11px] font-black dark:text-white uppercase italic">ZMW {user.balance.toFixed(0)}</p>
           </div>
           {user.role !== Role.CUSTOMER && (
              <button onClick={onToggleViewMode} className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-600/20 active:scale-95 transition-all"><i className="fa-solid fa-rotate"></i></button>
           )}
           <button onClick={logout} className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 active:scale-95 transition-all"><i className="fa-solid fa-power-off text-xs"></i></button>
        </div>
      </header>

      <NewsTicker />

      {/* Increased padding-bottom to pb-40 to clear nav */}
      <div className="flex-1 overflow-y-auto pb-40 px-5 pt-6 space-y-10 no-scrollbar">
        {activeTab === 'home' && (
          <div className="animate-fade-in space-y-8">
            
            {/* Welcome Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[35px] p-6 shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <i className="fa-solid fa-earth-africa text-6xl text-emerald-500"></i>
               </div>
               <div className="flex items-center gap-5 mb-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-3xl shadow-lg shadow-emerald-500/30">
                     <i className="fa-regular fa-user"></i>
                  </div>
                  <div>
                     <h2 className="text-2xl font-black italic uppercase text-slate-900 dark:text-white leading-none">Welcome to Swensi!</h2>
                     <p className="text-sm text-slate-500 font-medium mt-1">You're logged in as a <span className="text-emerald-500 font-bold">{user.role.charAt(0) + user.role.slice(1).toLowerCase()}</span></p>
                  </div>
               </div>
               <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 flex flex-col gap-3 relative z-10">
                  <div className="flex items-center gap-2">
                     <span className="text-xs font-black uppercase text-slate-400 w-16">Phone:</span>
                     <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{user.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-xs font-black uppercase text-slate-400 w-16">Status:</span>
                     <span className="text-sm font-bold text-emerald-500 flex items-center gap-2">
                        {user.isVerified ? 'Verified' : 'Active'}
                        {user.isVerified && <i className="fa-solid fa-circle-check"></i>}
                     </span>
                  </div>
               </div>
            </div>

            {/* Quick Actions - Responsive Grid */}
            <div>
               <h3 className="text-lg font-black italic uppercase text-slate-900 dark:text-white mb-4">Quick Actions</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={() => document.getElementById('services-grid')?.scrollIntoView({ behavior: 'smooth' })} className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm text-left hover:shadow-md transition-all group active:scale-95">
                     <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-magnifying-glass"></i>
                     </div>
                     <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">Browse Services</h4>
                     <p className="text-xs text-slate-500">Find transport, beauty, skilled trades, and casual labor services</p>
                  </button>

                  <button onClick={() => setActiveTab('active')} className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm text-left hover:shadow-md transition-all group active:scale-95">
                     <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-suitcase"></i>
                     </div>
                     <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">My Bookings</h4>
                     <p className="text-xs text-slate-500">View your service requests</p>
                  </button>

                  <button onClick={() => { setActiveTab('account'); setShowKycForm(true); }} className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm text-left hover:shadow-md transition-all group active:scale-95">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-briefcase"></i>
                     </div>
                     <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">Become a Provider</h4>
                     <p className="text-xs text-slate-500">Start offering your services</p>
                  </button>
               </div>
            </div>

            {/* Trade News Feed */}
            <TradeFeed />

            {/* Serving Banner */}
            <div className="bg-emerald-500 rounded-[24px] p-5 flex items-center gap-4 text-white shadow-xl shadow-emerald-500/20">
               <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <i className="fa-solid fa-map-location-dot text-lg"></i>
               </div>
               <span className="font-black italic uppercase tracking-wide text-sm">Serving Nakonde & Muchinga Province</span>
            </div>

            {/* Services Grid - Responsive (2 cols mobile, 4 cols tablet) */}
            <div id="services-grid" className="space-y-6 pt-4">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-2xl font-black text-secondary dark:text-white uppercase italic tracking-tighter">Service Categories</h1>
                  <p className="text-xs text-slate-500 font-medium">Browse services available in your area</p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[35px] border border-white/5 overflow-hidden shadow-2xl relative">
                 <Map center={mapCenter} markers={mapMarkers} activeMissions={mapMissions} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => { setSelectedCategory(cat); setHaggledPrice(0); setPickupMode('CURRENT'); setTripDistance(0); setTripDestination(''); setDestinationCoords(null); }} className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-white/5 flex flex-col items-start gap-4 text-left hover:shadow-md transition-all h-full min-h-[140px] active:scale-95">
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl bg-opacity-10 dark:bg-opacity-20 ${cat.color ? cat.color.replace('text-', 'bg-') : 'bg-slate-100 dark:bg-slate-800'}`}>
                        <i className={`${cat.icon} ${cat.color || 'text-slate-500'}`}></i>
                     </div>
                     <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 leading-tight">{cat.name}</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">{cat.hint}</p>
                     </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedCategory && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-[45px] p-8 shadow-2xl animate-zoom-in my-auto space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black italic uppercase leading-none">{selectedCategory.name}</h3>
                <button onClick={() => { setSelectedCategory(null); setIsHaggling(false); setIsForOther(false); setTripDistance(0); setTripDestination(''); setDestinationCoords(null); }} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 hover:text-white transition-colors active:scale-90"><i className="fa-solid fa-xmark"></i></button>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-[32px] space-y-4">
                 
                 {/* PRICING DISPLAY LOGIC */}
                 {selectedCategory.pricingModel === 'QUOTE' ? (
                   <div className="bg-slate-50 dark:bg-white/5 rounded-[32px] p-6 text-center space-y-4">
                      <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                         <i className="fa-solid fa-hand-holding-dollar text-2xl"></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase italic">Name Your Price</h4>
                        <p className="text-[10px] text-slate-500 font-bold mt-1 max-w-[200px] mx-auto leading-relaxed">Enter your budget or leave empty to get quotes from providers.</p>
                      </div>
                      
                      <div className="relative max-w-[200px] mx-auto">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">ZMW</span>
                        <input 
                           type="number" 
                           value={haggledPrice || ''} 
                           onChange={(e) => setHaggledPrice(Number(e.target.value))} 
                           className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/10 p-3 pl-14 rounded-xl text-lg font-black italic text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-300" 
                           placeholder="0.00" 
                        />
                      </div>
                   </div>
                 ) : (
                   <>
                      <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase italic">
                             {selectedCategory.pricingModel === 'DISTANCE' ? 'Estimated Total' : 'Standard Rate'}
                          </p>
                          {/* Price Pulse Animation */}
                          <div key={haggledPrice} className="animate-bounce-slight">
                             <p className="text-sm font-black italic">ZMW {selectedCategory.pricingModel === 'DISTANCE' ? haggledPrice.toFixed(0) : selectedCategory.basePrice}</p>
                          </div>
                      </div>

                      {selectedCategory.pricingModel === 'DISTANCE' && (
                        <div className="space-y-4 pt-2">
                           {/* Pickup Location Selection - Enhanced Toggle */}
                           <div className="bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl flex gap-1 border border-slate-200 dark:border-white/10">
                              <button 
                                onClick={() => setPickupMode('CURRENT')}
                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${pickupMode === 'CURRENT' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-md' : 'text-slate-400'}`}
                              >
                                <i className="fa-solid fa-location-crosshairs mr-1"></i> Current GPS
                              </button>
                              <button 
                                onClick={() => setPickupMode('CUSTOM')}
                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${pickupMode === 'CUSTOM' ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-md' : 'text-slate-400'}`}
                              >
                                <i className="fa-solid fa-map-pin mr-1"></i> Address
                              </button>
                           </div>

                           {pickupMode === 'CUSTOM' && (
                             <div className="relative">
                               <input 
                                  value={pickupAddress} 
                                  onChange={e => setPickupAddress(e.target.value)} 
                                  placeholder="Enter pickup place..."
                                  className="w-full bg-white dark:bg-slate-800 rounded-xl px-4 py-3 text-xs font-bold border-none outline-none focus:ring-2 ring-blue-500 pr-8"
                                />
                                {pickupAddress && (
                                  <button onClick={() => setPickupAddress('')} className="absolute right-3 top-3 text-slate-400 hover:text-white"><i className="fa-solid fa-times-circle"></i></button>
                                )}
                              </div>
                           )}

                           {/* Destination Autocomplete - Enhanced */}
                           <div className="relative">
                              <label className="text-[9px] font-black text-slate-400 uppercase italic ml-1">Destination</label>
                              <div className="relative">
                                <input 
                                  value={tripDestination} 
                                  onChange={handleDestinationInput} 
                                  placeholder="Where are you going?"
                                  className="w-full bg-white dark:bg-slate-800 rounded-xl px-4 py-3 text-xs font-bold border-none outline-none mt-1 focus:ring-2 ring-blue-500 pr-8"
                                />
                                {isCalculating ? (
                                  <i className="fa-solid fa-circle-notch animate-spin absolute right-3 top-4 text-blue-500 text-xs"></i>
                                ) : tripDestination && (
                                  <button onClick={() => { setTripDestination(''); setTripDistance(0); }} className="absolute right-3 top-4 text-slate-400 hover:text-white"><i className="fa-solid fa-times-circle"></i></button>
                                )}
                              </div>
                              
                              {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 rounded-xl shadow-xl mt-1 z-10 overflow-hidden border border-slate-100 dark:border-white/5 animate-slide-up">
                                  {suggestions.map((place, idx) => (
                                    <button 
                                      key={idx} 
                                      onClick={() => handleSelectSuggestion(place)}
                                      className="w-full text-left px-4 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border-b border-slate-50 dark:border-white/5 last:border-none flex items-center"
                                    >
                                      <i className="fa-solid fa-location-dot text-slate-400 mr-2 opacity-50"></i>{place}
                                    </button>
                                  ))}
                                </div>
                              )}
                           </div>

                           <div>
                              <div className="flex justify-between">
                                <label className="text-[9px] font-black text-slate-400 uppercase italic ml-1">Calculated Distance</label>
                                <span className="text-[8px] text-slate-500 italic">Rate: ZMW {TRANSPORT_RATE_PER_KM}/km</span>
                              </div>
                              <div className={`w-full bg-slate-100 dark:bg-white/5 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 mt-1 flex justify-between items-center transition-all ${tripDistance > 0 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : ''}`}>
                                <span>{tripDistance > 0 ? `${tripDistance} km` : 'Enter destination...'}</span>
                                {tripDistance > 0 && <i className="fa-solid fa-check-circle text-emerald-500"></i>}
                              </div>
                           </div>
                        </div>
                      )}
                      
                      {selectedCategory.pricingModel === 'FIXED' && (
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/5">
                            <label className="text-[10px] font-black text-emerald-600 uppercase italic">Negotiate Price?</label>
                            <button onClick={() => setIsHaggling(!isHaggling)} className={`w-12 h-6 rounded-full relative transition-all ${isHaggling ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isHaggling ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>
                      )}

                      {(isHaggling && selectedCategory.pricingModel !== 'DISTANCE') && (
                        <div className="pt-4 space-y-3 animate-slide-up">
                            <input type="number" value={haggledPrice} onChange={(e) => setHaggledPrice(Number(e.target.value))} className="w-full bg-white dark:bg-slate-800 p-4 rounded-2xl text-xl font-black italic border-none outline-none text-emerald-600" placeholder="Offer Amount" />
                        </div>
                      )}
                   </>
                 )}
              </div>
              
              <textarea 
                value={missionDesc} 
                onChange={(e) => setMissionDesc(e.target.value)} 
                placeholder={selectedCategory.pricingModel === 'QUOTE' ? "Describe exactly what you need so providers can give you a fair price..." : "Specific Mission Notes..."} 
                className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-[24px] p-5 text-sm font-black h-28 focus:ring-2 ring-emerald-600 outline-none placeholder:text-slate-500" 
              />
              
              <button 
                onClick={() => handleLaunchMission()} 
                className="w-full py-5 bg-emerald-600 text-white font-black rounded-[24px] text-[10px] uppercase shadow-2xl italic tracking-widest active:scale-95 transition-all hover:bg-emerald-500"
              >
                {selectedCategory.pricingModel === 'QUOTE' ? (haggledPrice > 0 ? 'Send Offer to Partners' : 'Request Price Quote') : 'Launch Mission Protocol'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-6 animate-fade-in pb-10">
             {activeBookings.length === 0 && (
                <div className="py-20 text-center opacity-40 flex flex-col items-center">
                   <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                      <i className="fa-solid fa-wind text-2xl text-slate-500"></i>
                   </div>
                   <p className="italic font-black uppercase text-xs tracking-widest">No Active Corridor Ops</p>
                </div>
             )}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {activeBookings.map(b => {
                const isNegotiating = b.status === BookingStatus.NEGOTIATING;
                const isProviderTurn = b.lastOfferBy === Role.PROVIDER;
                const hasProvider = !!b.providerId;
                const displayPrice = b.negotiatedPrice || b.price;
                const statusConfig = getStatusConfig(b.status);

                return (
                  <div key={b.id} className={`bg-white dark:bg-slate-900 rounded-[40px] border overflow-hidden shadow-xl p-6 space-y-4 ${isNegotiating ? 'border-amber-500/50' : (statusConfig.border || 'border-slate-100 dark:border-white/5')}`}>
                     <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xl font-black italic">{b.id}</h4>
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mt-2 ${statusConfig.bg} ${statusConfig.color} border border-current/10`}>
                             <i className={`fa-solid ${statusConfig.icon} text-xs`}></i>
                             <span className="text-[9px] font-black uppercase tracking-wide">{statusConfig.label}</span>
                          </div>
                        </div>
                        {displayPrice > 0 ? (
                           <p className={`text-lg font-black italic ${isNegotiating ? 'text-amber-500' : 'text-emerald-600'}`}>ZMW {displayPrice}</p>
                        ) : (
                           <p className="text-xs font-black italic text-slate-400 uppercase">Quote Requested</p>
                        )}
                     </div>
                     <p className="text-[11px] text-slate-500 italic leading-relaxed">"{b.description}"</p>
                     
                     {/* Negotiation UI for Customer */}
                     {isNegotiating && (
                       <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-3xl space-y-3">
                          {isProviderTurn && hasProvider ? (
                            <div className="space-y-3 animate-slide-up">
                              <p className="text-[10px] font-black uppercase text-blue-500 italic">Provider Quote: ZMW {displayPrice}</p>
                              <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => onAcceptNegotiation(b.id)} className="py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase italic active:scale-95 transition-all">Accept {displayPrice}</button>
                                <button onClick={() => onRejectNegotiation(b.id)} className="py-3 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase italic active:scale-95 transition-all">Reject</button>
                              </div>
                              <div className="flex gap-2">
                                <input 
                                  type="number" 
                                  placeholder="Counter..."
                                  className="w-20 px-3 py-2 rounded-xl text-xs font-black bg-white dark:bg-slate-900 border-none outline-none"
                                  onChange={(e) => setCounterInputs({...counterInputs, [b.id]: Number(e.target.value)})}
                                />
                                <button 
                                  onClick={() => counterInputs[b.id] && onCounterNegotiation(b.id, counterInputs[b.id])}
                                  className="flex-1 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase italic active:scale-95 transition-all"
                                >
                                  Counter
                                </button>
                              </div>
                            </div>
                          ) : (
                             <div className="text-center py-2 animate-pulse">
                                <p className="text-[10px] font-black uppercase text-amber-500 italic">
                                  {hasProvider ? 'Waiting for Provider Response...' : 'Broadcasting Request to Partners...'}
                                </p>
                             </div>
                          )}
                       </div>
                     )}

                     {!isNegotiating && (
                       <button onClick={() => onCancelBooking(b.id)} className="w-full py-3 bg-red-600/5 text-red-600 border border-red-600/20 rounded-2xl text-[9px] font-black uppercase italic active:scale-95 transition-all hover:bg-red-600/10">Abort Mission</button>
                     )}
                  </div>
                );
             })}
             </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="animate-fade-in space-y-8 pb-20">
             <div className="bg-slate-900 rounded-[40px] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                
                <div className="flex items-center gap-6 mb-8 relative z-10">
                   <div className="w-20 h-20 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-lg">
                      {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <i className="fa-solid fa-user text-3xl text-slate-700"></i>}
                   </div>
                   <div>
                      <h3 className="text-2xl font-black italic uppercase text-white leading-none">{user.name}</h3>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">{user.phone}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                   <div className="bg-white/5 p-6 rounded-[30px] border border-white/5 hover:bg-white/10 transition-colors">
                      <p className="text-[8px] font-black text-slate-500 uppercase italic mb-1">My Wallet</p>
                      <p className="text-xl font-black text-white italic tracking-tighter">ZMW {user.balance.toFixed(2)}</p>
                   </div>
                   <div className="bg-white/5 p-6 rounded-[30px] border border-white/5 hover:bg-white/10 transition-colors">
                      <p className="text-[8px] font-black text-slate-500 uppercase italic mb-1">Trust Score</p>
                      <p className="text-xl font-black text-emerald-500 italic tracking-tighter">{user.trustScore}%</p>
                   </div>
                </div>
             </div>

             {!showKycForm ? (
               <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-xl text-center space-y-4">
                  <div className="w-14 h-14 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                     <i className="fa-solid fa-id-card text-2xl"></i>
                  </div>
                  <h3 className="text-base font-black italic uppercase">Become a Service Partner</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold leading-relaxed px-4">Start earning by providing transport, customs, or trade services in the Nakonde corridor.</p>
                  <button onClick={() => setShowKycForm(true)} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl text-[9px] uppercase italic tracking-widest shadow-xl active:scale-95 transition-all">Apply for Partner Terminal</button>
               </div>
             ) : (
               <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border-2 border-blue-600 shadow-2xl space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black italic uppercase">Partner KYC</h3>
                    <button onClick={() => setShowKycForm(false)} className="text-slate-400 hover:text-white transition-colors"><i className="fa-solid fa-xmark"></i></button>
                  </div>
                  <div className="space-y-4">
                     <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase italic ml-2">License / ID Number</label>
                        <input value={kycLicense} onChange={e => setKycLicense(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-xl text-xs font-black italic" placeholder="e.g. NRC-XXXXX-X" />
                     </div>
                     <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase italic ml-2">Service Category</label>
                        <select 
                          value={kycCategory} 
                          onChange={e => setKycCategory(e.target.value)} 
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-xl text-xs font-black italic appearance-none outline-none text-slate-800 dark:text-white"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                     </div>

                     {['transport', 'trucking'].includes(kycCategory) && (
                        <>
                           <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase italic ml-2">Driving License Photo (Mandatory)</label>
                              <div className="relative">
                                 <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, setKycLicenseFile)} 
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3 rounded-xl text-xs font-black italic" 
                                 />
                                 {kycLicenseFile && <i className="fa-solid fa-check text-emerald-500 absolute right-3 top-3.5"></i>}
                              </div>
                           </div>
                           <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase italic ml-2">Profile Picture (Mandatory)</label>
                              <div className="relative">
                                 <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, setKycPhotoFile)} 
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3 rounded-xl text-xs font-black italic" 
                                 />
                                 {(kycPhotoFile || user.avatarUrl) && <i className="fa-solid fa-check text-emerald-500 absolute right-3 top-3.5"></i>}
                              </div>
                           </div>
                        </>
                     )}

                     <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase italic ml-2">Nakonde Home Address / Landmark</label>
                        <input value={kycAddress} onChange={e => setKycAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-xl text-xs font-black italic" placeholder="e.g. Near Market Station" />
                     </div>
                     <button onClick={handleSubmitKyc} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl text-[9px] uppercase italic active:scale-95 transition-all">Submit Verification</button>
                  </div>
               </div>
             )}

             <button onClick={logout} className="w-full py-4 bg-red-600/5 text-red-600 rounded-2xl text-[9px] font-black uppercase italic border border-red-600/10 hover:bg-red-600/10 active:scale-95 transition-all">Sign Out</button>
          </div>
        )}
      </div>

      <nav className="fixed bottom-6 left-6 right-6 h-20 glass-nav rounded-[32px] border border-white/10 flex justify-around items-center px-4 shadow-2xl z-50">
        <button onClick={() => setActiveTab('home')} className={`flex-1 flex flex-col items-center transition-transform active:scale-90 ${activeTab === 'home' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}><i className="fa-solid fa-house text-lg"></i></button>
        <button onClick={() => setActiveTab('active')} className={`flex-1 flex flex-col items-center transition-transform active:scale-90 ${activeTab === 'active' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}><i className="fa-solid fa-route text-lg"></i></button>
        <button onClick={() => setActiveTab('account')} className={`flex-1 flex flex-col items-center transition-transform active:scale-90 ${activeTab === 'account' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}><i className="fa-solid fa-user text-lg"></i></button>
      </nav>
    </div>
  );
};

export default CustomerDashboard;
