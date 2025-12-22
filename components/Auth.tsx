
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
  onNotification: (title: string, message: string, type: 'INFO' | 'ALERT' | 'SUCCESS') => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onRegister, onToggleTheme, isDarkMode, language, onLanguageChange, t, adminNumbers, existingUsers, onNotification }) => {
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
    if (phone.length < 9) {
      onNotification('INVALID INPUT', 'Please enter a valid phone number (at least 9 digits)', 'ALERT');
      return;
    }
    if (!termsAccepted) {
      onNotification('PROTOCOL CHECK', 'You must accept the Trade Protocols to continue', 'ALERT');
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      onNotification('OTP SENT', `Code sent to +260 ${phone}`, 'SUCCESS');
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
      onNotification('SECURITY ALERT', 'Invalid Security Code. Use 123456 for demo.', 'ALERT');
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
      onNotification('ACCESS DENIED', 'Admin override code incorrect.', 'ALERT');
    }
  };

  const handleCompleteRegistration = () => {
    if (!regName.trim()) {
      onNotification('MISSING INFO', 'Please enter your full name or business alias', 'ALERT');
      return;
    }
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
            className="px-4 py-2 rounded-2xl flex items-center gap-2 bg-white/10 text-slate-300 backdrop-blur-xl border border-white/10 shadow-lg hover:bg-white/20 active:scale-95 transition-all"
          >
            <span className="text-base leading-none">{selectedLanguage.flag}</span>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{selectedLanguage.name}</span>
            <i className={`fa-solid fa-chevron-down text-[8px] transition-transform ${showLangPicker ? 'rotate-180' : ''}`}></i>
          </button>

          {showLangPicker && (
            <div className="absolute top-12 left-0 w-48 bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden z-[110] animate-zoom-in">
              {LANGUAGES.map(lang => (
                <button 
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange(lang.code);
                    setShowLangPicker(false);
                  }}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-white/10 transition-colors border-b border-white/5 last:border-none text-left"
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${language === lang.code ? 'text-blue-500' : 'text-slate-400'}`}>
                    {lang.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={onToggleTheme} className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/10 text-slate-300 backdrop-blur-xl border border-white/10 shadow-lg hover:bg-white/20 active:scale-95 transition-all">
          <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-500' : 'fa-moon text-blue-500'}`}></i>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        {step === 1 && (
          <div className="w-full max-w-[380px] space-y-10 animate-fade-in">
            {/* Branding Hero */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[32px] shadow-[0_20px_60px_-10px_rgba(37,99,235,0.5)] transform -rotate-6 mb-4 border border-white/10">
                <i className="fa-solid fa-link text-white text-4xl"></i>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-lg">
                Swensi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Nakonde</span>
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] px-4">
                {t('slogan')}
              </p>
            </div>

            {/* Service Badges */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1 justify-center">
              {[
                { icon: 'fa-cart-shopping', label: 'Traders' },
                { icon: 'fa-truck-moving', label: 'Transport' },
                { icon: 'fa-file-signature', label: 'Clearing' },
                { icon: 'fa-bed', label: 'Lodges' }
              ].map(item => (
                <div key={item.label} className="flex-shrink-0 bg-white/5 border border-white/10 p-4 rounded-3xl flex flex-col items-center gap-2 min-w-[80px] backdrop-blur-sm">
                  <i className={`fa-solid ${item.icon} text-blue-400 text-lg`}></i>
                  <span className="text-[7px] font-black uppercase text-slate-300 tracking-widest">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Input Section */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-blue-400 ml-4 tracking-widest italic">{t('login_phone')}</label>
                <div className="flex items-center bg-slate-900/50 border-2 border-slate-700/50 rounded-[24px] px-6 py-5 focus-within:border-blue-500 focus-within:bg-slate-900 transition-all">
                  <span className="text-slate-500 font-black mr-4 text-lg italic border-r pr-4 border-white/10">+260</span>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09XXXXXXXX"
                    className="flex-1 outline-none text-xl font-black text-white bg-transparent placeholder:text-slate-700"
                  />
                  {phone.length > 0 && <button onClick={() => setPhone('')} className="text-slate-600 hover:text-white"><i className="fa-solid fa-circle-xmark"></i></button>}
                </div>
              </div>

              <div className="px-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${termsAccepted ? 'bg-blue-600 border-blue-600' : 'border-slate-600 bg-slate-800/50'}`}>
                    {termsAccepted && <i className="fa-solid fa-check text-white text-[10px]"></i>}
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide leading-tight group-hover:text-blue-400 transition-colors">
                    I agree to the <button onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="text-blue-500 underline decoration-blue-500/30">Swensi Trade Protocol</button> & KYC Policy.
                  </span>
                </label>
              </div>

              <button 
                onClick={requestOtp}
                disabled={loading || !termsAccepted}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black py-6 rounded-[24px] text-xs tracking-[0.2em] shadow-lg shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 uppercase italic flex items-center justify-center gap-3"
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
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Secure Terminal</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Code sent to +260 {phone}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 shadow-2xl space-y-8">
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className="w-full border-2 rounded-[24px] py-6 text-center text-5xl font-black tracking-[0.2em] outline-none border-slate-700/50 bg-slate-900/50 text-white focus:border-blue-500 shadow-inner"
              />
              <div className="space-y-4">
                <button onClick={verifyOtp} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[24px] shadow-lg uppercase italic tracking-widest active:scale-95 transition-all">{t('verify_phone')}</button>
                <button onClick={() => setStep(1)} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Change Phone Number</button>
              </div>
            </div>
            <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest italic opacity-50 animate-pulse">Demo Bypass: 123456</p>
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
                  className="w-32 h-32 rounded-[45px] bg-slate-900/50 border-2 border-dashed border-blue-600/30 flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-lg hover:border-blue-500 transition-all"
                >
                  {regAvatar ? (
                    <img src={regAvatar} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <i className="fa-solid fa-camera text-3xl text-blue-500/40 mb-2 group-hover:scale-110 transition-transform"></i>
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
                    className="w-full bg-slate-900/50 border-2 border-slate-700/50 rounded-[24px] p-6 text-base font-black text-white outline-none focus:border-blue-600 shadow-inner placeholder:text-slate-600"
                  />
                </div>
                <button 
                  onClick={handleCompleteRegistration}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[24px] text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all italic"
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
              <button onClick={verifyExtraOtp} className="w-full bg-slate-100 text-slate-900 font-black py-6 rounded-[24px] uppercase italic tracking-widest active:scale-95 transition-all">Authorize Admin</button>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-center opacity-40 pointer-events-none">
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Nakonde Secure Protocol • v2.1.2</p>
      </div>
    </div>
  );
};

export default Auth;
