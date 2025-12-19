import React from 'react';

export const COLORS = {
  PRIMARY: '#1E40AF', // Royal Blue
  ACCENT: '#B87333',  // Burnished Copper
  SECONDARY: '#0F172A', // Deep Slate
  NEUTRAL: '#F8FAFC',
  HOSPITALITY: '#7C3AED', // Violet
  DANGER: '#DC2626',
  SUCCESS: '#2563EB',
  WARNING: '#D97706'
};

export const CATEGORIES = [
  { id: 'transport', name: 'Transport (Taxi/Bike)', icon: <i className="fa-solid fa-car"></i>, requiresLicense: true, basePrice: 65 },
  { id: 'lodging', name: 'Lodges & Stays', icon: <i className="fa-solid fa-bed"></i>, subscriptionFee: 250, basePrice: 350 },
  { id: 'beauty', name: 'Beauty (Salons)', icon: <i className="fa-solid fa-scissors"></i>, basePrice: 100 },
  { id: 'errands', name: 'Errands/Shopping', icon: <i className="fa-solid fa-basket-shopping"></i>, trustThreshold: 20, basePrice: 50 },
  { id: 'trades', name: 'Skilled Trades', icon: <i className="fa-solid fa-hammer"></i>, basePrice: 150 },
];

export const TRUSTED_COMMISSION_BONUS = 0.0005; 

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
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    welcome: "Welcome back!",
    greeting: "Hello",
    slogan: "Border Town Trusted Logistics",
    login_phone: "Sign in with Phone",
    verify_phone: "Initiate Secure Link",
    home: "Terminal",
    active: "Operations",
    account: "Profile",
    logout: "Disconnect",
    language: "Linguistics",
    lodging: "Residency",
    book_room: "Reserve Space",
    trusted_only: "Verified Nodes Only",
    terms_agree: "Accept Trade Protocols",
    become_provider: "Partner Registration",
    provider_desc: "Join the Nakonde Trade link. Monetize your local expertise.",
    apply_now: "Register Node"
  },
  bem: {
    welcome: "Mwapoleni!",
    greeting: "Mwapoleni",
    slogan: "Ubusuma ku mupaka wa Nakonde",
    login_phone: "Ingileni na foni",
    verify_phone: "Ishibeni foni",
    home: "Ku Ng'anda",
    active: "Ilebomba",
    account: "Ipepala lyenu",
    logout: "Fumeni",
    language: "Ululimi",
    lodging: "Amayanda",
    book_room: "Iseni Mu Ng'anda",
    trusted_only: "Abantu ba Cishinka Fye",
    terms_agree: "Naisumina amalamulo",
    become_provider: "Sanguka Uwakubombela Abantu",
    provider_desc: "Ilyo ulesanguka wakubombela, ulasangula indalama mu Nakonde.",
    apply_now: "Bembuleni Nomba"
  },
};