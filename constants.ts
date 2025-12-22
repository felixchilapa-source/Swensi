
export const COLORS = {
  PRIMARY: '#1E40AF',
  ACCENT: '#B87333',
  SECONDARY: '#0F172A',
  NEUTRAL: '#F8FAFC',
  HOSPITALITY: '#7C3AED',
  DANGER: '#DC2626',
  SUCCESS: '#059669',
  WARNING: '#D97706'
};

export const TRUSTED_COMMISSION_BONUS = 0.05;
export const PLATFORM_COMMISSION_RATE = 0.0024; // 0.24% commission

export interface Category {
  id: string;
  name: string;
  icon: string;
  requiresLicense?: boolean;
  basePrice: number;
  hint: string;
  trustThreshold?: number;
  subscriptionFee?: number;
  color?: string; // Added for UI styling
}

export const CATEGORIES: Category[] = [
  { id: 'beauty', name: 'Beauty', icon: 'fa-solid fa-scissors', basePrice: 50, hint: "Salons, barbers, and beauty services", color: 'text-pink-500' },
  { id: 'labor', name: 'Casual Labor', icon: 'fa-solid fa-person-digging', basePrice: 80, hint: "General labor and assistance services", color: 'text-amber-500' },
  { id: 'trades', name: 'Skilled Trades', icon: 'fa-solid fa-wrench', basePrice: 150, hint: "Plumbers, carpenters, mechanics, and other skilled professionals", color: 'text-slate-500' },
  { id: 'transport', name: 'Transport', icon: 'fa-solid fa-taxi', requiresLicense: true, basePrice: 65, hint: "Taxi services, bikers, and other transportation", color: 'text-yellow-500' },
  { id: 'trucking', name: 'Heavy Trucking', icon: 'fa-solid fa-truck-front', requiresLicense: true, basePrice: 1500, hint: "Cross-border cargo transport", color: 'text-blue-600' },
  { id: 'customs', name: 'Customs Clearing', icon: 'fa-solid fa-file-contract', trustThreshold: 50, basePrice: 200, hint: "Help with border paperwork", color: 'text-emerald-600' },
  { id: 'lodging', name: 'Lodges & Rooms', icon: 'fa-solid fa-bed', subscriptionFee: 250, basePrice: 350, hint: "Safe stays near the border", color: 'text-purple-600' },
  { id: 'shop_for_me', name: 'Shop For Me', icon: 'fa-solid fa-basket-shopping', trustThreshold: 80, basePrice: 100, hint: "Procurement by Trusted Agents", color: 'text-orange-500' },
];

export const SUPER_ADMIN = '0961179384';
export const VERIFIED_ADMINS = ['0961179384', '0965722947'];

export const PAYMENT_NUMBERS = {
  MTN: '0961179384',
  Airtel: '0973310250',
  Zamtel: '0954318848', // Updated from user prompt
};

export const SUBSCRIPTION_PLANS = {
  BASIC: { name: 'Basic Plan', price: 10, features: ['Standard Visibility', 'Basic Analytics'] },
  PREMIUM: { name: 'Premium Plan', price: 20, features: ['Featured Listing', 'Priority Placement', 'Trusted Badge'] }
};

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇿🇲' },
  { code: 'bem', name: 'Bemba', flag: '🇿🇲' },
  { code: 'nya', name: 'Nyanja', flag: '🇿🇲' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    welcome: "Mwapoleni! Welcome to Swensi",
    slogan: "Border Trade Made Simple",
    login_phone: "Enter Phone Number",
    verify_phone: "Secure Sign In",
    home: "Home",
    active: "Trips",
    account: "Profile",
    book_now: "Book Service",
    wallet: "Mobile Money Wallet",
    landmark_placeholder: "e.g. Near Nakonde Market or Total Station"
  },
  bem: {
    welcome: "Mwapoleni! Karibu kuli Swensi",
    slogan: "Ubusuma ku mupaka wa Nakonde",
    login_phone: "Ingileni na foni yenu",
    verify_phone: "Ishibeni foni",
    home: "Pa Ng'anda",
    active: "Imilimo",
    account: "Ipepala",
    book_now: "Order Nomba",
    wallet: "Indalama sha foni",
    landmark_placeholder: "Papi na marketi nangu ku stationi"
  },
  nya: {
    welcome: "Takulandirani ku Swensi",
    slogan: "Zamalonda pa mpaka wa Nakonde",
    login_phone: "Lembani nambala yafoni",
    verify_phone: "Lowani mu app",
    home: "Pakhomo",
    active: "Ntchito",
    account: "Mbiri yanu",
    book_now: "Pangani Order",
    wallet: "Ndalama za pafoni",
    landmark_placeholder: "Pafupi na marketi kapena ku stationi"
  }
};
