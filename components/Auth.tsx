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
      setStep('role_select');
    }, 800);
  };

  const handleRoleSelection = (role: Role) => {
    setSelectedRole(role);
    setStep(2);
    alert(`Node Auth Protocol ${role === Role.ADMIN ? 'A-SEC' : 'C-STD'} active. Code: 123456`);
  };

  const verifyOtp = () => {
    if (otp === '123456') {
      if (selectedRole === Role.ADMIN && isAdmin) {
        setStep(3);
        alert('Layer 2 Challenge: 999888');
      } else if (selectedRole === Role.ADMIN && !isAdmin) {
        alert('Unauthorized Phone for Command Node access.');
        setStep('role_select');
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
    <div className="flex flex-col justify-center items-center px-6 h-full relative overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-500 mesh-gradient">
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-600 blur-[120px] animate-pulse-slow delay-1000"></div>
      </div>

      <div className="absolute top-8 left-6 right-6 flex justify-between items-center z-20">
        <button 
          onClick={() => setShowLangPicker(!showLangPicker)}
          className="px-4 py-2 rounded-2xl flex items-center gap-2 bg-slate-50/80 dark:bg-white/5 text-slate-500 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-sm"
        >
          <span className="text-base">{selectedLanguage.flag}</span>
          <span className="text-[10px] font-black uppercase tracking-widest">{selectedLanguage.name}</span>
          <i className="fa-solid fa-chevron-down text-[8px] opacity-40"></i>
        </button>

        <button onClick={onToggleTheme} className="w-11 h-11 rounded-2xl flex items-center justify-center bg-slate-50/80 dark:bg-white/5 text-slate-400 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-sm">
          <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-500' : 'fa-moon text-blue-600'}`}></i>
        </button>
      </div>

      <div className="text-center mb-10 w-full animate-fade-in relative z-10">
        <div className="relative mx-auto w-24 h-24 mb-8 group animate-float">
           <div className="absolute inset-[-10px] rounded-[32px] blur-2xl opacity-40 bg-gradient-to-tr from-blue-600 to-indigo-600 group-hover:opacity-60 transition-opacity"></div>
           <div className="relative w-full h-full bg-white dark:bg-slate-900 rounded-[30px] flex items-center justify-center shadow-2xl border-2 border-slate-100 dark:border-slate-800 transform group-hover:scale-105 transition-transform duration-500">
             <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 w-[85%] h-[85%] rounded-[24px] flex items-center justify-center shadow-inner">
                <i className="fas fa-link text-white text-4xl transform -rotate-12 drop-shadow-lg"></i>
             </div>
           </div>
           {/* Decorative corner accents */}
           <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-4 border-white dark:border-slate-950 shadow-lg"></div>
        </div>
        
        <div className="inline-block px-3 py-1 bg-blue-600/10 dark:bg-blue-500/10 rounded-full border border-blue-600/20 mb-4">
           <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-[0.2em] italic">Nakonde Corridor Hub</span>
        </div>

        <h1 className="text-5xl font-black tracking-tighter text-secondary dark:text-white leading-none italic uppercase">
          SWENSI <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">LINK</span>
        </h1>
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="h-[1px] w-8 bg-slate-200 dark:bg-slate-800"></div>
          <p className="text-slate-400 dark:text-slate-500 font-black tracking-[0.25em] uppercase text-[9px] italic opacity-90">
            Trade & Transport Terminal
          </p>
          <div className="h-[1px] w-8 bg-slate-200 dark:bg-slate-800"></div>
        </div>
      </div>

      <div className="w-full space-y-6 relative z-10 max-w-[340px]">
        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <div className="space-y-4">
              <div className="flex items-center border-2 rounded-[28px] px-6 py-5 focus-within:border-blue-600 transition-all border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 shadow-inner backdrop-blur-sm">
                <span className="text-slate-400 font-black mr-4 text-lg border-r border-slate-200 dark:border-white/10 pr-4 italic">ZM</span>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09XXXXXXXX"
                  className="flex-1 outline-none text-xl font-black text-slate-800 dark:text-white bg-transparent placeholder:opacity-30"
                />
              </div>

              <div className="px-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${termsAccepted ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-700'}`}>
                    {termsAccepted && <i className="fa-solid fa-check text-white text-[10px]"></i>}
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide group-hover:text-blue-600 transition-colors">
                    Accept <button onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="text-blue-600 underline font-black decoration-blue-600/30 underline-offset-2">Trade Protocols</button>
                  </span>
                </label>
              </div>

              <button 
                onClick={requestOtp}
                disabled={loading || !termsAccepted}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-5 rounded-[28px] text-base tracking-tight shadow-2xl shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase italic flex items-center justify-center gap-3"
              >
                {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : (
                  <>
                    Establish Signal
                    <i className="fa-solid fa-bolt-lightning text-xs"></i>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'role_select' && (
          <div className="animate-fade-in space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pb-4 px-2">
             <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 italic">Identification Required</p>
             <div className="grid gap-3">
                <button 
                  onClick={() => handleRoleSelection(Role.CUSTOMER)}
                  className="p-5 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-[32px] text-left hover:border-blue-600 transition-all shadow-lg hover:shadow-blue-500/10 flex items-center gap-5 group"
                >
                   <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                     <i className="fa-solid fa-user-tag text-xl"></i>
                   </div>
                   <div>
                     <p className="text-[11px] font-black text-secondary dark:text-white uppercase tracking-tighter">Market Client</p>
                     <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Logistics & Services</p>
                   </div>
                </button>

                <button 
                  onClick={() => handleRoleSelection(Role.PROVIDER)}
                  className="p-5 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-[32px] text-left hover:border-amber-600 transition-all shadow-lg hover:shadow-amber-500/10 flex items-center gap-5 group"
                >
                   <div className="w-12 h-12 bg-amber-600/10 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                     <i className="fa-solid fa-shuttle-van text-xl"></i>
                   </div>
                   <div>
                     <p className="text-[11px] font-black text-secondary dark:text-white uppercase tracking-tighter">Corridor Partner</p>
                     <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Verified Service Node</p>
                   </div>
                </button>

                <button 
                  onClick={() => handleRoleSelection(Role.LODGE)}
                  className="p-5 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-[32px] text-left hover:border-purple-600 transition-all shadow-lg hover:shadow-purple-500/10 flex items-center gap-5 group"
                >
                   <div className="w-12 h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                     <i className="fa-solid fa-hotel text-xl"></i>
                   </div>
                   <div>
                     <p className="text-[11px] font-black text-secondary dark:text-white uppercase tracking-tighter">Station Manager</p>
                     <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Stay & Hospitality Hub</p>
                   </div>
                </button>

                {isAdmin && (
                  <button 
                    onClick={() => handleRoleSelection(Role.ADMIN)}
                    className="p-5 bg-slate-900 border-2 border-red-600/30 rounded-[32px] text-left hover:border-red-600 transition-all shadow-2xl flex items-center gap-5 group"
                  >
                     <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                       <i className="fa-solid fa-shield-halved text-xl"></i>
                     </div>
                     <div>
                       <p className="text-[11px] font-black text-white uppercase tracking-tighter">Command Node</p>
                       <p className="text-[8px] font-bold text-red-400/50 uppercase mt-0.5">System Administration</p>
                     </div>
                  </button>
                )}
             </div>
             <button onClick={() => setStep(1)} className="w-full text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] pt-4 italic hover:text-blue-500 transition-colors">
               <i className="fa-solid fa-arrow-left-long mr-2"></i>
               Switch Number
             </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up space-y-6">
            <div className="text-center">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-60 italic">Authentication Protocol</p>
              <p className="text-lg font-black text-secondary dark:text-white tracking-tight italic">+260 {phone}</p>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className="w-full border-2 rounded-[28px] py-5 text-center text-5xl font-black tracking-[0.2em] outline-none transition-all border-slate-100 dark:border-white/5 focus:border-blue-600 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-white shadow-inner backdrop-blur-sm"
              />
              <div className="flex justify-center items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
                 <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Verification code: 123456</p>
              </div>
              <button 
                onClick={verifyOtp}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-5 rounded-[28px] shadow-2xl shadow-blue-600/20 active:scale-95 transition-all text-base tracking-tight uppercase italic"
              >
                Establish Link
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20 animate-pulse shadow-lg shadow-amber-500/10">
                <i className="fa-solid fa-fingerprint text-amber-500 text-3xl"></i>
              </div>
              <h2 className="text-2xl font-black text-secondary dark:text-white tracking-tight italic uppercase">Override Required</h2>
              <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] mt-1 italic">Level 2 Clearances Only</p>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                maxLength={6}
                value={extraOtp}
                onChange={(e) => setExtraOtp(e.target.value)}
                placeholder="000000"
                className="w-full border-2 border-amber-500/50 rounded-[28px] py-5 text-center text-5xl font-black tracking-[0.2em] outline-none transition-all text-slate-800 dark:text-white bg-amber-50/10 dark:bg-amber-500/5 shadow-inner"
              />
              <p className="text-center text-[9px] font-black text-amber-600/70 uppercase tracking-widest italic">Bypass Challenge: 999888</p>
              <button 
                onClick={verifyExtraOtp}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-[28px] shadow-2xl active:scale-95 transition-all text-base tracking-tight border-2 border-amber-500/30 uppercase italic"
              >
                Unlock Command Hub
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-10 w-full px-10 text-center z-10">
        <div className="flex items-center justify-center gap-2 opacity-40 grayscale mb-2">
           <i className="fa-brands fa-nfc-symbol text-xs"></i>
           <i className="fa-solid fa-shield-halved text-[10px]"></i>
           <i className="fa-solid fa-wifi text-xs"></i>
        </div>
        <p className="text-[8px] text-slate-400 dark:text-slate-600 font-black leading-relaxed uppercase tracking-[0.4em] italic">
          Synchronized by <span className="text-blue-600 font-black italic">Swensi Protocols</span>
        </p>
      </div>
    </div>
  );
};

export default Auth;