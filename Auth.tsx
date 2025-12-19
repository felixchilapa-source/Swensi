import React, { useState } from 'react';
import { COLORS, LANGUAGES } from '../constants';

interface AuthProps {
  onLogin: (phone: string, lang: string) => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  language: string;
  onLanguageChange: (lang: string) => void;
  t: (key: string) => string;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onToggleTheme, isDarkMode, language, onLanguageChange, t }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  const requestOtp = () => {
    if (phone.length < 9) return alert('Enter a valid phone number');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      alert('Your Swensi Security Code is: 123456');
    }, 800);
  };

  const verifyOtp = () => {
    if (otp === '123456') {
      onLogin(phone, language);
    } else {
      alert('Wrong code. Check the SMS and try again.');
    }
  };

  const selectedLanguage = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <div className="flex flex-col justify-center items-center px-6 h-full relative overflow-hidden bg-white dark:bg-slate-950">
      {/* Abstract Background Orbs */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl"></div>

      {/* Top Controls */}
      <div className="absolute top-6 left-6 z-20">
        <button 
          onClick={() => setShowLangPicker(!showLangPicker)}
          className="px-3 py-2 rounded-xl flex items-center gap-2 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 hover:text-orange-500 transition-all border border-slate-200 dark:border-white/10"
        >
          <span className="text-sm">{selectedLanguage.flag}</span>
          <span className="text-[10px] font-black uppercase tracking-widest">{selectedLanguage.name}</span>
          <i className="fa-solid fa-chevron-down text-[8px]"></i>
        </button>
        
        {showLangPicker && (
          <div className="absolute top-12 left-0 w-48 max-h-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 overflow-y-auto z-50 animate-zoom-in">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { onLanguageChange(lang.code); setShowLangPicker(false); }}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${language === lang.code ? 'bg-orange-500/10' : ''}`}
              >
                <span className="text-base">{lang.flag}</span>
                <span className={`text-xs font-bold ${language === lang.code ? 'text-orange-500' : 'text-slate-600 dark:text-slate-300'}`}>{lang.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={onToggleTheme}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 hover:text-orange-500 transition-all border border-slate-200 dark:border-white/10"
        >
          <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
      </div>

      {/* ENHANCED LOGO SECTION */}
      <div className="text-center mb-10 w-full animate-fade-in relative z-10">
        <div className="relative mx-auto w-24 h-24 mb-6">
          {/* Outer Pulse Ring */}
          <div className="absolute inset-0 bg-orange-500/20 rounded-[32px] animate-ping opacity-20"></div>
          {/* Icon Container */}
          <div 
            className="relative w-full h-full rounded-[32px] flex items-center justify-center shadow-2xl shadow-orange-500/40 rotate-3 border-4 border-white dark:border-slate-800"
            style={{ 
              background: `linear-gradient(135deg, ${COLORS.SECONDARY} 0%, #1a365d 100%)` 
            }}
          >
            <i className="fa-solid fa-truck-fast text-white text-4xl"></i>
            {/* Corner Accent */}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center">
              <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <h1 className="text-5xl font-black tracking-tighter text-secondary dark:text-white italic drop-shadow-sm">
          Swensi
        </h1>
        <div className="flex flex-col items-center justify-center mt-3">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">Nakonde Trade Link</p>
          <div className="flex gap-1 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800"></span>
            <span className="w-6 h-1.5 rounded-full bg-orange-500"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800"></span>
          </div>
        </div>
      </div>

      <div className="w-full space-y-5 relative z-10 max-w-[320px]">
        {step === 1 ? (
          <div className="animate-fade-in space-y-5">
            <div className="text-center space-y-1">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{t('welcome')}</p>
              <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">{t('login_phone')}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <div className="flex items-center border-2 rounded-[24px] px-5 py-4 focus-within:border-orange-500 transition-all border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 shadow-inner">
                  <span className="text-slate-400 dark:text-slate-500 font-black mr-3 text-base border-r border-slate-200 dark:border-white/10 pr-3">+260</span>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9XXXXXXXX"
                    className="flex-1 outline-none text-lg font-black text-slate-800 dark:text-white bg-transparent placeholder:text-slate-200 dark:placeholder:text-slate-700"
                  />
                </div>
              </div>
              <button 
                onClick={requestOtp}
                disabled={loading}
                className="btn-primary w-full text-white font-black py-4.5 rounded-[24px] text-base tracking-tight flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : t('verify_phone')}
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-slide-up space-y-6">
            <div className="text-center">
              <p className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Check SMS Code</p>
              <p className="text-lg font-black text-slate-800 dark:text-white tracking-tight">+260 {phone}</p>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className="w-full border-2 border-slate-100 dark:border-white/10 rounded-[24px] py-4 text-center text-3xl font-black tracking-[0.1em] focus:border-orange-500 outline-none transition-all text-slate-800 dark:text-white bg-slate-50/30 dark:bg-white/5 placeholder:text-slate-100 dark:placeholder:text-slate-800 shadow-inner"
              />
              <button 
                onClick={verifyOtp}
                className="w-full text-white font-black py-4.5 rounded-[24px] shadow-2xl active:scale-95 transition-all text-base tracking-tight"
                style={{ backgroundColor: COLORS.SECONDARY }}
              >
                Continue
              </button>
              <button onClick={() => setStep(1)} className="w-full text-slate-400 dark:text-slate-600 font-black text-[9px] uppercase tracking-[0.2em] hover:text-orange-500 transition-colors">
                Change Number
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 w-full px-10 text-center z-10">
        <p className="text-[7px] text-slate-400 dark:text-slate-600 font-bold leading-relaxed uppercase tracking-widest">
          Secured by <span className="text-indigo-600">Zambian Protocols</span><br/>
          <span className="font-black text-slate-800 dark:text-slate-500">Swensi - Nakonde Local Trade Link</span>
        </p>
      </div>
    </div>
  );
};

export default Auth;