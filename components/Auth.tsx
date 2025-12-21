import React, { useState, useMemo, useRef } from 'react';
import { Role, User } from '../types';
import { LANGUAGES } from '../constants';
import TermsModal from './TermsModal';

interface AuthProps {
  onLogin: (phone: string, lang: string) => void;
  onRegister: (phone: string, name: string, avatar: string, lang: string) => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  language: string;
  onLanguageChange: (lang: string) => void;
  t: (key: string) => string;
  adminNumbers: string[];
  existingUsers: User[];
}

const Auth: React.FC<AuthProps> = ({ onLogin, onRegister, onToggleTheme, isDarkMode, language, onLanguageChange, t, adminNumbers, existingUsers }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [extraOtp, setExtraOtp] = useState('');
  const [step, setStep] = useState<1 | 2 | 3 | 'profile_setup'>(1);
  const [loading, setLoading] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  const [regName, setRegName] = useState('');
  const [regAvatar, setRegAvatar] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isTargetAdmin = useMemo(() => adminNumbers.includes(phone), [phone, adminNumbers]);
  const userExists = useMemo(() => existingUsers.some(u => u.phone === phone), [phone, existingUsers]);

  const requestOtp = () => {
    if (phone.length < 9) return alert('Please enter a valid phone number (at least 9 digits)');
    if (!termsAccepted) return alert('You must accept the Trade Protocols to continue');
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1200);
  };

  const verifyOtp = () => {
    if (otp === '123456') {
      if (isTargetAdmin) {
        setStep(3);
      } else {
        if (userExists) {
          onLogin(phone, language);
        } else {
          setStep('profile_setup');
        }
      }
    } else {
      alert('Security Code mismatch. Please use 123456 for this demo.');
    }
  };

  const verifyExtraOtp = () => {
    if (extraOtp === '999888') {
      if (userExists) {
        onLogin(phone, language);
      } else {
        setStep('profile_setup');
      }
    } else {
      alert('Override code incorrect.');
    }
  };

  const handleCompleteRegistration = () => {
    if (!regName.trim()) return alert('Please enter your full name or business alias');
    onRegister(phone, regName, regAvatar, language);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setRegAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const selectedLanguage = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <div className="flex flex-col w-full min-h-screen relative overflow-hidden bg-slate-950 transition-colors duration-500 mesh-gradient safe-pt safe-pb">
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      
      {/* Top Controls */}
      <div className="absolute top-12 left-6 right-6 flex justify-between items-center z-[100]">
        <div className="relative">
          <button 
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="px-4 py-2 rounded-2xl flex items-center gap-2 bg-white/5 text-slate-300 backdrop-blur-xl border border-white/10 shadow-xl active:scale-95 transition-all"
          >
            <span className="text-base leading-none">{selectedLanguage.flag}</span>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{selectedLanguage.name}</span>
            <i className={`fa-solid fa-chevron-down text-[8px] transition-transform ${showLangPicker ? 'rotate-180' : ''}`}></i>
          </button>

          {showLangPicker && (
            <div className="absolute top-12 left-0 w-48 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden z-[110] animate-zoom-in">
              {LANGUAGES.map(lang => (
                <button 
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange(lang.code);
                    setShowLangPicker(false);
                  }}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-100 dark:border-white/5 last:border-none text-left"
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${language === lang.code ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'}`}>
                    {lang.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={onToggleTheme} className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/5 text-slate-300 backdrop-blur-xl border border-white/10 shadow-xl active:scale-95 transition-all">
          <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-500' : 'fa-moon text-blue-500'}`}></i>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        {step === 1 && (
          <div className="w-full max-w-[380px] space-y-10 animate-fade-in">
            {/* Branding Hero */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-[28px] shadow-[0_20px_40px_rgba(37,99,235,0.4)] transform -rotate-12 mb-4">
                <i className="fa-solid fa-link text-white text-3xl"></i>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
                Swensi <span className="text-blue-500">Nakonde</span>
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] px-4">
                {t('slogan')}
              </p>
            </div>

            {/* Service Badges */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
              {[
                { icon: 'fa-cart-shopping', label: 'Traders' },
                { icon: 'fa-truck-moving', label: 'Transport' },
                { icon: 'fa-file-signature', label: 'Clearing' },
                { icon: 'fa-bed', label: 'Lodges' }
              ].map(item => (
                <div key={item.label} className="flex-shrink-0 bg-white/5 border border-white/10 p-4 rounded-3xl flex flex-col items-center gap-2 min-w-[90px]">
                  <i className={`fa-solid ${item.icon} text-blue-500 text-lg`}></i>
                  <span className="text-[8px] font-black uppercase text-slate-300 tracking-widest">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Input Section */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 shadow-2xl space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-blue-500 ml-4 tracking-widest italic">{t('login_phone')}</label>
                <div className="flex items-center bg-slate-900 border-2 border-slate-800 rounded-[24px] px-6 py-5 focus-within:border-blue-600 transition-all">
                  <span className="text-slate-500 font-black mr-4 text-lg italic border-r pr-4 border-white/10">+260</span>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09XXXXXXXX"
                    className="flex-1 outline-none text-xl font-black text-white bg-transparent"
                  />
                </div>
              </div>

              <div className="px-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${termsAccepted ? 'bg-blue-600 border-blue-600' : 'border-slate-700 bg-slate-800'}`}>
                    {termsAccepted && <i className="fa-solid fa-check text-white text-[10px]"></i>}
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide leading-tight group-hover:text-blue-500">
                    I agree to the <button onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="text-blue-500 underline">Swensi Trade Protocol</button> & KYC Policy.
                  </span>
                </label>
              </div>

              <button 
                onClick={requestOtp}
                disabled={loading || !termsAccepted}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[24px] text-base tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-40 uppercase italic flex items-center justify-center gap-3"
              >
                {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : (
                  <>Connect <i className="fa-solid fa-arrow-right"></i></>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-[360px] animate-slide-up space-y-8 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Secure Terminal</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Code sent to +260 {phone}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 shadow-2xl space-y-8">
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className="w-full border-2 rounded-[24px] py-6 text-center text-5xl font-black tracking-[0.2em] outline-none border-slate-800 bg-slate-900 text-white focus:border-blue-600 shadow-inner"
              />
              <div className="space-y-4">
                <button onClick={verifyOtp} className="w-full bg-blue-600 text-white font-black py-6 rounded-[24px] shadow-2xl uppercase italic tracking-widest">{t('verify_phone')}</button>
                <button onClick={() => setStep(1)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Change Phone Number</button>
              </div>
            </div>
            <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest italic opacity-50">Demo Bypass: 123456</p>
          </div>
        )}

        {step === 'profile_setup' && (
          <div className="w-full max-w-[380px] animate-fade-in space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Identify Node</h2>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Establish your trade profile</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 shadow-2xl space-y-8">
              <div className="flex flex-col items-center gap-4">
                <div 
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-32 h-32 rounded-[45px] bg-slate-900 border-2 border-dashed border-blue-600/30 flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-2xl"
                >
                  {regAvatar ? (
                    <img src={regAvatar} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <i className="fa-solid fa-camera text-3xl text-blue-500/40 mb-2"></i>
                      <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Add Photo</p>
                    </div>
                  )}
                </div>
                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-500 ml-4 italic">Your Alias / Business Name</label>
                  <input 
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. John Trading Co."
                    className="w-full bg-slate-900 border-2 border-slate-800 rounded-[24px] p-6 text-base font-black text-white outline-none focus:border-blue-600 shadow-inner"
                  />
                </div>
                <button 
                  onClick={handleCompleteRegistration}
                  className="w-full bg-blue-600 text-white font-black py-6 rounded-[24px] text-xs uppercase tracking-widest shadow-2xl italic"
                >
                  Activate My Hub
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="w-full max-w-[360px] animate-fade-in space-y-8 text-center">
            <h2 className="text-2xl font-black text-white italic uppercase">Override Challenge</h2>
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 shadow-2xl space-y-8">
              <input 
                type="text" 
                maxLength={6}
                value={extraOtp}
                onChange={(e) => setExtraOtp(e.target.value)}
                placeholder="000000"
                className="w-full border-2 border-amber-600 bg-slate-900 rounded-[24px] py-6 text-center text-5xl font-black tracking-[0.2em] outline-none text-white shadow-inner"
              />
              <button onClick={verifyExtraOtp} className="w-full bg-slate-100 text-slate-900 font-black py-6 rounded-[24px] uppercase italic tracking-widest">Authorize Admin</button>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-center opacity-40">
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Nakonde Secure Protocol • v2.1.2</p>
      </div>
    </div>
  );
};

export default Auth;
