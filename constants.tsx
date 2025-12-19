
import React from 'react';

export const COLORS = {
  PRIMARY: '#1E40AF', // Royal Blue
  ACCENT: '#B87333',  // Burnished Copper
  SECONDARY: '#0F172A', // Deep Slate
  NEUTRAL: '#F8FAFC',
  HOSPITALITY: '#7C3AED', // Violet
  DANGER: '#DC2626',
  SUCCESS: '#059669', // Emerald Green (Zambia)
  WARNING: '#D97706'
};

// Fix: Define the missing bonus multiplier for trusted partners
export const TRUSTED_COMMISSION_BONUS = 0.05;

export const CATEGORIES = [
  { id: 'transport', name: 'Taxi & Bike', icon: <i className="fa-solid fa-car-side"></i>, requiresLicense: true, basePrice: 65, hint: "Fast movement in Nakonde" },
  { id: 'customs', name: 'Customs Clearing', icon: <i className="fa-solid fa-file-contract"></i>, trustThreshold: 50, basePrice: 200, hint: "Help with border paperwork" },
  { id: 'lodging', name: 'Lodges & Rooms', icon: <i className="fa-solid fa-bed"></i>, subscriptionFee: 250, basePrice: 350, hint: "Safe stays near the border" },
  { id: 'errands', name: 'Shopping/Errands', icon: <i className="fa-solid fa-cart-shopping"></i>, trustThreshold: 20, basePrice: 50, hint: "Get groceries or goods" },
  { id: 'trades', name: 'Skilled Workers', icon: <i className="fa-solid fa-wrench"></i>, basePrice: 150, hint: "Mechanics, plumbers, etc." },
];

export const SUPER_ADMIN = '0961179384';

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
