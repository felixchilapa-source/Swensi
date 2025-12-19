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
        alert('Swensi Link Code: 123456');
      }
    }, 800);
  };

  const handleRoleSelection = (role: Role) => {
    setSelectedRole(role);
    setStep(2);
    alert(`Node Auth Protocol ${role === Role.ADMIN ? 'A-SEC' : 'C-STD'} active. Code: 123456`);
  };

  const verifyOtp = () => {
    if (otp === '123456') {
      if (selectedRole === Role.ADMIN) {
        setStep(3);
        alert('Layer 2 Challenge: 999888');
      } else {
        onLogin(phone, language, selectedRole);
      }
    } else {
      alert('Verification failed. Use 123456 for testing.');
    }
  };

  const verifyExtraOtp = () => {
    if (extraOtp === '999888') {
      onLogin(phone, language, Role.ADMIN);
    } else {
      alert('Override failed. Use 999888 for testing.');
    }
  };

  const selectedLanguage = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <div className="flex flex-col justify-center items-center px-6 h-full relative overflow-hidden bg-white dark:bg-slate-950">
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      
      {/* Premium Background Orbs */}
      <div className="absolute -top-40 -right-40 w-[400px] h-[400px] rounded-full blur-[100px] bg-blue-600/10 transition-colors"></div>
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full blur-[100px] bg-amber-600/10 transition-colors"></div>

      <div className="absolute top-8 left-6 right-6 flex justify-between items-center z-20">
        <button 
          onClick={() => setShowLangPicker(!showLangPicker)}
          className="px-4 py-2 rounded-2xl flex items-center gap-2 bg-slate-50 dark:bg-white/5 text-slate-500 border border-slate-100 dark:border-white/10"
        >
          <span className="text-base">{selectedLanguage.flag}</span>
          <span className="text-[10px] font-black uppercase tracking-widest">{selectedLanguage.name}</span>
          <i className="fa-solid fa-chevron-down text-[8px] opacity-40"></i>
        </button>

        <button onClick={onToggleTheme} className="w-11 h-11 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-white/5 text-slate-400 border border-slate-100 dark:border-white/10">
          <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>

        {showLangPicker && (
          <div className="absolute top-14 left-0 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 z-50 animate-zoom-in">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { onLanguageChange(lang.code); setShowLangPicker(false); }}
                className={`w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-white/5 ${language === lang.code ? 'bg-blue-500/5' : ''}`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className={`text-[11px] font-black uppercase ${language === lang.code ? 'text-blue-600' : 'text-slate-500'}`}>{lang.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="text-center mb-10 w-full animate-fade-in relative z-10">
        <div className="relative mx-auto w-24 h-24 mb-6 group">
           <div className="absolute inset-0 rounded-[32px] animate-pulse blur-xl opacity-20 bg-blue-600"></div>
           <div className="relative w-full h-full bg-white dark:bg-slate-900 rounded-[32px] flex items-center justify-center shadow-2xl border-2 border-slate-100 dark:border-slate-800 rotate-3 group-hover:rotate-0 transition-transform duration-700">
             <div className="bg-gradient-to-br from-blue-700 to-amber-600 w-full h-full rounded-[28px] flex items-center justify-center">
                <i className={`fas ${selectedRole === Role.ADMIN && step !== 1 ? 'fa-shield-halved' : 'fa-route'} text-white text-4xl -rotate-3`}></i>
             </div>
           </div>
        </div>
        
        <h1 className="text-4xl font-black tracking-tighter text-secondary dark:text-white leading-none italic uppercase">
          SWENSI <span className="text-blue-600">NAKONDE</span>
        </h1>
        <p className="text-slate-400 font-black tracking-[0.3em] uppercase text-[8px] mt-2 opacity-80">
          Trusted Border Town Logistics Link
        </p>
      </div>

      <div className="w-full space-y-6 relative z-10 max-w-[340px]">
        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <div className="space-y-4">
              <div className="flex items-center border-2 rounded-[28px] px-6 py-5 focus-within:border-blue-600 transition-all border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 shadow-inner">
                <span className="text-slate-400 font-black mr-4 text-lg border-r border-slate-200 dark:border-white/10 pr-4">+260</span>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9XXXXXXXX"
                  className="flex-1 outline-none text-xl font-black text-slate-800 dark:text-white bg-transparent"
                />
              </div>

              <div className="px-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-5 h-5 rounded-lg accent-blue-600"
                  />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">
                    Agree to <button onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="text-blue-600 underline font-black">Trade Protocols</button>
                  </span>
                </label>
              </div>

              <button 
                onClick={requestOtp}
                disabled={loading || !termsAccepted}
                className="w-full bg-blue-700 text-white font-black py-5 rounded-[28px] text-base tracking-tight shadow-xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-40"
              >
                {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : t('verify_phone')}
              </button>
            </div>
          </div>
        )}

        {step === 'role_select' && (
          <div className="animate-fade-in space-y-6">
             <div className="text-center">
               <h2 className="text-xl font-black text-blue-600 italic uppercase">Access Level Detected</h2>
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Select authorization path</p>
             </div>
             <div className="grid gap-3">
                <button 
                  onClick={() => handleRoleSelection(Role.CUSTOMER)}
                  className="p-8 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-[40px] text-left hover:border-blue-600 transition-all shadow-sm"
                >
                   <i className="fa-solid fa-user text-blue-600 text-3xl mb-4"></i>
                   <p className="text-[11px] font-black text-secondary dark:text-white uppercase tracking-tighter">Market User</p>
                   <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Standard Node</p>
                </button>
                <button 
                  onClick={() => handleRoleSelection(Role.ADMIN)}
                  className="p-8 bg-slate-900 border-2 border-blue-600/30 rounded-[40px] text-left hover:border-blue-600 transition-all shadow-2xl"
                >
                   <i className="fa-solid fa-shield-halved text-amber-500 text-3xl mb-4"></i>
                   <p className="text-[11px] font-black text-white uppercase tracking-tighter">Command Node</p>
                   <p className="text-[8px] font-bold text-blue-400/50 uppercase mt-1">Admin Center</p>
                </button>
             </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up space-y-6">
            <div className="text-center">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-60 italic">Level 1 Encryption</p>
              <p className="text-lg font-black text-secondary dark:text-white tracking-tight italic">+260 {phone}</p>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className={`w-full border-2 rounded-[28px] py-5 text-center text-4xl font-black tracking-[0.15em] outline-none transition-all border-slate-100 focus:border-blue-600 bg-slate-50/30 dark:bg-white/5 text-slate-800 dark:text-white shadow-inner`}
              />
              <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Code for Demo: 123456</p>
              <button 
                onClick={verifyOtp}
                className="w-full bg-secondary text-white font-black py-5 rounded-[28px] shadow-2xl active:scale-95 transition-all text-base tracking-tight"
              >
                Establish Link
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20 animate-pulse">
                <i className="fa-solid fa-fingerprint text-amber-500 text-2xl"></i>
              </div>
              <h2 className="text-2xl font-black text-secondary dark:text-white tracking-tight italic uppercase">Override Required</h2>
              <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mt-1">Level 2 Security Clearance</p>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                maxLength={6}
                value={extraOtp}
                onChange={(e) => setExtraOtp(e.target.value)}
                placeholder="000000"
                className="w-full border-2 border-amber-500 rounded-[28px] py-5 text-center text-4xl font-black tracking-[0.15em] outline-none transition-all text-slate-800 dark:text-white bg-amber-50/5 dark:bg-amber-500/5"
              />
              <p className="text-center text-[9px] font-black text-amber-600/70 uppercase tracking-widest">L2 Bypass: 999888</p>
              <button 
                onClick={verifyExtraOtp}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-[28px] shadow-2xl active:scale-95 transition-all text-base tracking-tight border-2 border-amber-500/30 uppercase italic"
              >
                Access Command Hub
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-10 w-full px-10 text-center z-10">
        <p className="text-[8px] text-slate-400 font-bold leading-relaxed uppercase tracking-[0.3em]">
          Powered by <span className="text-blue-600 font-black italic">Swensi Protocols</span>
        </p>
      </div>
    </div>
  );
};

export default Auth;