import React, { useState, useMemo } from 'react';
import { Role } from '../types';
import { COLORS, LANGUAGES } from '../constants';
import TermsModal from './TermsModal';

interface AuthProps {
  onLogin: (phone: string, lang: string, forcedRole?: Role) => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  language: string;
  onLanguageChange: (lang: string) => void;
  t: (key: string) => string;
  adminNumbers: string[];
}

const Auth: React.FC<AuthProps> = ({ onLogin, onToggleTheme, isDarkMode, language, onLanguageChange, t, adminNumbers }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [extraOtp, setExtraOtp] = useState('');
  const [step, setStep] = useState<1 | 2 | 3 | 'role_select'>(1);
  const [loading, setLoading] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(Role.CUSTOMER);

  const isAdmin = useMemo(() => adminNumbers.includes(phone), [phone, adminNumbers]);

  const requestOtp = () => {
    if (phone.length < 9) return alert('Enter a valid phone number');
    if (!termsAccepted) return alert('Please accept the Terms & Conditions');
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (isAdmin) {
        setStep('role_select');
      } else {
        setStep(2);
        alert('Your Swensi Security Code is: 123456');
      }
    }, 800);
  };

  const handleRoleSelection = (role: Role) => {
    setSelectedRole(role);
    setStep(2);
    alert(`Protocol ${role === Role.ADMIN ? 'A-1' : 'C-1'} Initialized. Code: 123456`);
  };

  const verifyOtp = () => {
    if (otp === '123456') {
      if (selectedRole === Role.ADMIN) {
        setStep(3); // Go to extra OTP step for Admins
        alert('Security Level 1 Verified. Secondary Code Required: 999888');
      } else {
        onLogin(phone, language, selectedRole);
      }
    } else {
      alert('Wrong code. Check the SMS and try again.');
    }
  };

  const verifyExtraOtp = () => {
    if (extraOtp === '999888') {
      onLogin(phone, language, Role.ADMIN);
    } else {
      alert('Command override failed. Invalid secondary code.');
    }
  };

  const selectedLanguage = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <div className="flex flex-col justify-center items-center px-6 h-full relative overflow-hidden bg-white dark:bg-slate-950">
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      
      {/* Background Orbs */}
      <div className={`absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl transition-colors duration-700 ${selectedRole === Role.ADMIN && step !== 1 ? 'bg-indigo-500/10' : 'bg-orange-500/10'}`}></div>
      <div className={`absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl transition-colors duration-700 ${selectedRole === Role.ADMIN && step !== 1 ? 'bg-slate-500/10' : 'bg-indigo-600/10'}`}></div>

      {/* Top Controls */}
      <div className="absolute top-6 left-6 z-20">
        <button 
          onClick={() => setShowLangPicker(!showLangPicker)}
          className="px-3 py-2 rounded-xl flex items-center gap-2 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/10"
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
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/10"
        >
          <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
      </div>

      {/* Header Logo */}
      <div className="text-center mb-10 mt-4 w-full animate-fade-in relative z-10">
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className={`absolute inset-0 rounded-[32px] animate-ping opacity-20 transition-colors duration-500 ${selectedRole === Role.ADMIN && step !== 1 ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>
          <div 
            className="relative w-full h-full rounded-[32px] flex items-center justify-center shadow-2xl transition-all duration-500 rotate-3 border-4 border-white dark:border-slate-800"
            style={{ 
              background: selectedRole === Role.ADMIN && step !== 1 
                ? `linear-gradient(135deg, #1e293b 0%, #020617 100%)`
                : `linear-gradient(135deg, ${COLORS.SECONDARY} 0%, #1a365d 100%)` 
            }}
          >
            <i className={`fa-solid ${selectedRole === Role.ADMIN && step !== 1 ? 'fa-fingerprint' : 'fa-truck-fast'} text-white text-4xl transition-all duration-500`}></i>
          </div>
        </div>
        
        <h1 className="text-5xl font-black tracking-tighter text-secondary dark:text-white italic">
          {selectedRole === Role.ADMIN && step !== 1 ? 'Strategic' : 'Swensi'}
        </h1>
        <p className={`text-[11px] font-black uppercase tracking-[0.2em] mt-2 transition-colors duration-500 ${selectedRole === Role.ADMIN && step !== 1 ? 'text-indigo-400' : 'text-orange-500'}`}>
          {selectedRole === Role.ADMIN && step !== 1 ? 'Secure Command' : 'Nakonde Trade Link'}
        </p>
      </div>

      <div className="w-full space-y-5 relative z-10 max-w-[320px]">
        {step === 1 && (
          <div className="animate-fade-in space-y-5">
            <div className="text-center space-y-1">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{t('welcome')}</p>
              <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">{t('login_phone')}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center border-2 rounded-[24px] px-5 py-4 focus-within:border-orange-500 transition-all border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 shadow-inner">
                <span className="text-slate-400 dark:text-slate-500 font-black mr-3 text-base border-r border-slate-200 dark:border-white/10 pr-3">+260</span>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9XXXXXXXX"
                  className="flex-1 outline-none text-lg font-black text-slate-800 dark:text-white bg-transparent"
                />
              </div>

              <label className="flex items-center gap-3 px-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 rounded-lg accent-orange-500 cursor-pointer"
                />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                  I agree to the <button onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="text-orange-500 underline font-black">Terms & Conditions</button>
                </span>
              </label>

              <button 
                onClick={requestOtp}
                disabled={loading || !termsAccepted}
                className="btn-primary w-full text-white font-black py-4.5 rounded-[24px] text-base tracking-tight flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              >
                {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : t('verify_phone')}
              </button>
            </div>
          </div>
        )}

        {step === 'role_select' && (
          <div className="animate-fade-in space-y-6">
             <div className="text-center">
               <h2 className="text-xl font-black text-indigo-500 italic">Privileged Number Detected</h2>
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Select login destination</p>
             </div>
             <div className="grid gap-3">
                <button 
                  onClick={() => handleRoleSelection(Role.CUSTOMER)}
                  className="p-6 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-[32px] text-left hover:border-orange-500 transition-all group"
                >
                   <i className="fa-solid fa-user text-orange-500 text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
                   <p className="text-xs font-black text-secondary dark:text-white">Customer Account</p>
                   <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Personal services & tracking</p>
                </button>
                <button 
                  onClick={() => handleRoleSelection(Role.ADMIN)}
                  className="p-6 bg-slate-900 dark:bg-indigo-950/30 border-2 border-indigo-500/20 rounded-[32px] text-left hover:border-indigo-500 transition-all group"
                >
                   <i className="fa-solid fa-shield-halved text-indigo-500 text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
                   <p className="text-xs font-black text-white">Administrator Access</p>
                   <p className="text-[8px] font-bold text-indigo-300/60 uppercase mt-1">Command center & analytics</p>
                </button>
             </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up space-y-6">
            <div className="text-center">
              <p className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Standard SMS Protocol</p>
              <p className="text-lg font-black text-slate-800 dark:text-white tracking-tight">+260 {phone}</p>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className={`w-full border-2 rounded-[24px] py-4 text-center text-3xl font-black tracking-[0.1em] outline-none transition-all ${selectedRole === Role.ADMIN ? 'border-indigo-500 focus:border-indigo-600 bg-indigo-50/10' : 'border-slate-100 focus:border-orange-500 bg-slate-50/30'}`}
              />
              <button 
                onClick={verifyOtp}
                className="w-full text-white font-black py-4.5 rounded-[24px] shadow-2xl active:scale-95 transition-all text-base tracking-tight"
                style={{ backgroundColor: selectedRole === Role.ADMIN ? '#4f46e5' : COLORS.SECONDARY }}
              >
                {selectedRole === Role.ADMIN ? 'Verify Level 1' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 animate-pulse">
                <i className="fa-solid fa-lock text-red-500"></i>
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Secondary Authorization</h2>
              <p className="text-[9px] font-black uppercase text-red-500 tracking-widest mt-1">Command Overide OTP required</p>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                maxLength={6}
                value={extraOtp}
                onChange={(e) => setExtraOtp(e.target.value)}
                placeholder="XXXXXX"
                className="w-full border-2 border-red-500 rounded-[24px] py-4 text-center text-3xl font-black tracking-[0.1em] outline-none transition-all text-slate-800 dark:text-white bg-red-50/5 dark:bg-red-500/5"
              />
              <button 
                onClick={verifyExtraOtp}
                className="w-full bg-red-600 text-white font-black py-4.5 rounded-[24px] shadow-2xl active:scale-95 transition-all text-base tracking-tight"
              >
                Unlock Administrator Console
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 w-full px-10 text-center z-10">
        <p className="text-[7px] text-slate-400 dark:text-slate-600 font-bold leading-relaxed uppercase tracking-widest">
          {step === 3 ? 'Bypassing Standard Protocols...' : 'Secured by Zambian Protocols'}<br/>
          <span className="font-black text-slate-800 dark:text-slate-500">Swensi - Nakonde Local Trade Link</span>
        </p>
      </div>
    </div>
  );
};

export default Auth;
