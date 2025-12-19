
import React from 'react';

export const COLORS = {
  PRIMARY: '#008751', // Zambian Emerald Green
  ACCENT: '#FFD700',  // Golden Sun (Golden Sun)
  SECONDARY: '#0A1F44', // Deep Navy
  NEUTRAL: '#F2F2F2',
  HOSPITALITY: '#8E44AD',
  NAKONDE_GREEN: '#008751',
  NAKONDE_GOLD: '#FFD700'
};

export const CATEGORIES = [
  { id: 'transport', name: 'Transport (Taxi/Bike)', icon: <i className="fa-solid fa-car"></i>, requiresLicense: true },
  { id: 'lodging', name: 'Lodges & Stays', icon: <i className="fa-solid fa-bed"></i>, subscriptionFee: 250 },
  { id: 'beauty', name: 'Beauty (Salons)', icon: <i className="fa-solid fa-scissors"></i> },
  { id: 'errands', name: 'Errands/Shopping', icon: <i className="fa-solid fa-basket-shopping"></i>, trustThreshold: 20 },
  { id: 'trades', name: 'Skilled Trades', icon: <i className="fa-solid fa-hammer"></i> },
];

export const TRUSTED_COMMISSION_BONUS = 0.0005; // 0.05%

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
    slogan: "Need a quick ride? Swensi it!",
    login_phone: "Login with Phone",
    verify_phone: "Verify Phone",
    home: "Home",
    active: "Active",
    account: "Account",
    logout: "Logout",
    language: "Language",
    lodging: "Lodging",
    book_room: "Book a Room",
    trusted_only: "Trusted Partners Only",
    terms_agree: "I agree to the Terms & Conditions",
    become_provider: "Become a Provider",
    provider_desc: "Join the Nakonde Trade Link. Turn your skills into earnings.",
    apply_now: "Apply Now"
  },
  bem: {
    welcome: "Mwapoleni!",
    greeting: "Mwapoleni",
    slogan: "Ulefwaya ubusuma? Swensi it!",
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
  nya: {
    welcome: "Takulandirani!",
    greeting: "Muli bwanji",
    slogan: "Mukufuna thandizo? Swensi it!",
    login_phone: "Lowani ndi foni",
    verify_phone: "Tsimikizani foni",
    home: "Pakhomo",
    active: "Zogwira",
    account: "Akaunti",
    logout: "Tulukani",
    language: "Chilankhulo",
    lodging: "Nyumba zogona",
    book_room: "Sungani chipinda",
    trusted_only: "Odala okha",
    terms_agree: "Ndikugwirizana ndi Malamulo",
    become_provider: "Khalani Wopereka Ntchito",
    provider_desc: "Lowani nawo mu Nakonde Trade Link ngati wopereka chithandizo.",
    apply_now: "Lemberani Tsopano"
  },
  sw: {
    welcome: "Karibu tena!",
    greeting: "Habari",
    slogan: "Unahitaji huduma haraka? Swensi it!",
    login_phone: "Ingia kwa Simu",
    verify_phone: "Thibitisha Simu",
    home: "Nyumbani",
    active: "Inayofanya kazi",
    account: "Akaunti",
    logout: "Ondoka",
    language: "Lugha",
    lodging: "Malazi",
    book_room: "Weka chumba",
    trusted_only: "Washirika wanaoaminika pekee",
    terms_agree: "Ninakubali Masharti na Vigezo",
    become_provider: "Kuwa Mtoa Huduma",
    provider_desc: "Jiunge na Nakonde Trade Link kama mtoa huduma.",
    apply_now: "Omba Sasa"
  },
  fr: {
    welcome: "Bon retour!",
    greeting: "Bonjour",
    slogan: "Besoin d'un service rapide ? Swensi it!",
    login_phone: "Connexion par téléphone",
    verify_phone: "Vérifier le téléphone",
    home: "Accueil",
    active: "Actif",
    account: "Compte",
    logout: "Déconnexion",
    language: "Langue",
    lodging: "Hébergement",
    book_room: "Réserver une chambre",
    trusted_only: "Partenaires de confiance uniquement",
    terms_agree: "J'accepte les conditions générales",
    become_provider: "Devenir Prestataire",
    provider_desc: "Rejoignez le Nakonde Trade Link en tant que prestataire de services.",
    apply_now: "Postuler maintenant"
  }
};
