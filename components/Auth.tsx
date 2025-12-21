
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

  // Auto-detect Admin status based on input phone
  const isTargetAdmin = useMemo(() => adminNumbers.includes(phone), [phone, adminNumbers]);
  const userExists = useMemo(() => existingUsers.some(u => u.phone === phone), [phone, existingUsers]);

  const requestOtp = () => {
    if (phone.length < 9) return alert('Enter a valid phone number');
    if (!termsAccepted) return alert('Please accept the Terms & Conditions');
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      alert(`Terminal Security Code: 123456`);
    }, 800);
  };

  const verifyOtp = () => {
    if (otp === '123456') {
      if (isTargetAdmin) {
        setStep(3);
        alert('Layer 2 Challenge: 999888');
      } else {
        if (userExists) {
          onLogin(phone, language);
        } else {
          setStep('profile_setup');
        }
      }
    } else {
      alert('Verification failed. Use 123456 for testing.');
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
      alert('Override failed. Use 999888 for testing.');
    }
  };

  const handleCompleteRegistration = () => {
    if (!regName.trim()) return alert('Please provide an alias (Name)');
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
    <div className="flex flex-col justify-center items-center px-6 h-full relative overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-500 mesh-gradient safe-pt safe-pb">
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      
      <div className="absolute top-12 left-6 right-6 flex justify-between items-center z-20">
        <button 
          onClick={() => setShowLangPicker(!showLangPicker)}
          className="px-4 py-2 rounded-2xl flex items-center gap-2 bg-slate-50/80 dark:bg-white/5 text-slate-500 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-sm"
        >
          <span className="text-base leading-none">{selectedLanguage.flag}</span>
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">{selectedLanguage.name}</span>
          <i className="fa-solid fa-chevron-down text-[8px] opacity-40"></i>
        </button>

        <button onClick={onToggleTheme} className="w-11 h-11 rounded-2xl flex items-center justify-center bg-slate-50/80 dark:bg-white/5 text-slate-400 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-sm">
          <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-500' : 'fa-moon text-blue-600'}`}></i>
        </button>
      </div>

      <div className="text-center mb-12 w-full animate-fade-in relative z-10">
        <div className="relative mx-auto w-24 h-24 mb-6 group animate-float">
           <div className="absolute inset-[-10px] rounded-[32px] blur-2xl opacity-40 bg-gradient-to-tr from-blue-600 to-indigo-600"></div>
           <div className="relative w-full h-full bg-white dark:bg-slate-900 rounded-[30px] flex items-center justify-center shadow-2xl border-2 border-slate-100 dark:border-slate-800">
             <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 w-[85%] h-[85%] rounded-[24px] flex items-center justify-center">
                <i className="fas fa-link text-white text-4xl transform -rotate-12"></i>
             </div>
           </div>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-secondary dark:text-white uppercase italic">
          SWENSI <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">LINK</span>
        </h1>
        <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 tracking-[0.3em] uppercase mt-2">Nakonde Trade Hub</p>
      </div>

      <div className="w-full space-y-6 relative z-10 max-w-[340px]">
        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <div className="space-y-4">
              <div className="flex items-center border-2 rounded-[28px] px-6 py-4.5 focus-within:border-blue-600 transition-all border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 shadow-inner backdrop-blur-sm">
                <span className="text-slate-400 font-black mr-4 text-lg italic border-r pr-4 border-slate-200 dark:border-white/10">ZM</span>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09XXXXXXXX"
                  className="flex-1 outline-none text-xl font-black text-slate-800 dark:text-white bg-transparent"
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
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide group-hover:text-blue-600">
                    Accept <button onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="text-blue-600 underline">Trade Protocols</button>
                  </span>
                </label>
              </div>

              <button 
                onClick={requestOtp}
                disabled={loading || !termsAccepted}
                className="w-full bg-blue-700 text-white font-black py-5 rounded-[28px] text-base tracking-tight shadow-2xl active:scale-95 transition-all disabled:opacity-40 uppercase italic"
              >
                {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : "Establish Connection"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up space-y-6 text-center">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2 italic leading-none">Phone Auth: +260 {phone}</p>
            <input 
              type="text" 
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
              className="w-full border-2 rounded-[28px] py-6 text-center text-5xl font-black tracking-[0.2em] outline-none border-slate-100 dark:border-white/5 focus:border-blue-600 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-white shadow-inner"
            />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Verification: 123456</p>
            <button onClick={verifyOtp} className="w-full bg-blue-700 text-white font-black py-5 rounded-[28px] shadow-2xl uppercase italic">Link Account</button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in space-y-6 text-center">
            <h2 className="text-2xl font-black text-secondary dark:text-white italic uppercase">Command Challenge</h2>
            <input 
              type="text" 
              maxLength={6}
              value={extraOtp}
              onChange={(e) => setExtraOtp(e.target.value)}
              placeholder="000000"
              className="w-full border-2 border-amber-500/50 rounded-[28px] py-6 text-center text-5xl font-black tracking-[0.2em] outline-none text-slate-800 dark:text-white bg-amber-50/10 shadow-inner"
            />
            <p className="text-[9px] font-black text-amber-600/70 uppercase tracking-widest italic">Challenge: 999888</p>
            <button onClick={verifyExtraOtp} className="w-full bg-slate-900 text-white font-black py-5 rounded-[28px] border-2 border-amber-500/30 uppercase italic">Authorize</button>
          </div>
        )}

        {step === 'profile_setup' && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-secondary dark:text-white italic uppercase tracking-tighter">Enter Corridor</h2>
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-2">New Customer Registration</p>
            </div>
            
            <div className="flex flex-col items-center gap-4 mb-4">
              <div 
                onClick={() => avatarInputRef.current?.click()}
                className="w-28 h-28 rounded-[35px] bg-slate-100 dark:bg-white/5 border-2 border-dashed border-blue-600/30 flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-xl"
              >
                {regAvatar ? (
                  <img src={regAvatar} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <i className="fa-solid fa-camera text-2xl text-blue-600/40 mb-2"></i>
                    <p className="text-[7px] font-black uppercase text-slate-500">Scan Profile</p>
                  </div>
                )}
              </div>
              <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-3 italic">Alias (Name)</label>
                <input 
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. John B."
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-sm font-black outline-none focus:border-blue-600 shadow-inner"
                />
              </div>
              <button 
                onClick={handleCompleteRegistration}
                className="w-full bg-blue-700 text-white font-black py-5 rounded-[28px] text-[10px] uppercase tracking-widest shadow-xl italic"
              >
                Establish Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
