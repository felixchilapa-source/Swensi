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

export interface Category {
  id: string;
  name: string;
  icon: string;
  requiresLicense?: boolean;
  basePrice: number;
  hint: string;
  trustThreshold?: number;
  subscriptionFee?: number;
}

export const CATEGORIES: Category[] = [
  { id: 'transport', name: 'Taxi & Bike', icon: 'fa-solid fa-car-side', requiresLicense: true, basePrice: 65, hint: "Fast movement in Nakonde" },
  { id: 'customs', name: 'Customs Clearing', icon: 'fa-solid fa-file-contract', trustThreshold: 50, basePrice: 200, hint: "Help with border paperwork" },
  { id: 'lodging', name: 'Lodges & Rooms', icon: 'fa-solid fa-bed', subscriptionFee: 250, basePrice: 350, hint: "Safe stays near the border" },
  { id: 'errands', name: 'Shopping/Errands', icon: 'fa-solid fa-cart-shopping', trustThreshold: 20, basePrice: 50, hint: "Get groceries or goods" },
  { id: 'trades', name: 'Skilled Workers', icon: 'fa-solid fa-wrench', basePrice: 150, hint: "Mechanics, plumbers, etc." },
];

export const SUPER_ADMIN = '0961179384';
export const VERIFIED_ADMINS = ['0961179384', '0965722947'];

export const PAYMENT_NUMBERS = {
  MTN: '0961179384',
  Airtel: '0973310250',
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