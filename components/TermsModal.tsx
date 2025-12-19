
import React from 'react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border-2 border-orange-500 overflow-hidden animate-zoom-in flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-orange-500/5 to-transparent">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-secondary dark:text-white italic tracking-tighter">Swensi Protocol</h2>
              <p className="text-[9px] font-black uppercase text-orange-500 tracking-[0.2em] mt-1">Speed • Trust • Community</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-600 dark:text-slate-400">
          <section>
            <h3 className="text-xs font-black text-secondary dark:text-slate-200 uppercase tracking-widest mb-3 flex items-center gap-2">
              <i className="fa-solid fa-handshake text-orange-500"></i>
              1. The Swensi Mission
            </h3>
            <p className="text-[11px] leading-relaxed">
              Swensi is Nakonde’s premier "Quick Connector." By using our platform, you join a community-driven ecosystem designed to link trade, transport, and local services instantly across the T1 border corridor.
            </p>
          </section>

          <section>
            <h3 className="text-xs font-black text-secondary dark:text-slate-200 uppercase tracking-widest mb-3 flex items-center gap-2">
              <i className="fa-solid fa-shield-halved text-orange-500"></i>
              2. Trust & Verification
            </h3>
            <p className="text-[11px] leading-relaxed">
              Your <span className="text-orange-500 font-bold">Trust Score</span> is your currency. Reliability is mandatory. Frequent cancellations or low ratings will result in account suspension to protect the Nakonde trade community.
            </p>
          </section>

          <section>
            <h3 className="text-xs font-black text-secondary dark:text-slate-200 uppercase tracking-widest mb-3 flex items-center gap-2">
              <i className="fa-solid fa-wallet text-orange-500"></i>
              3. Payments & Commission
            </h3>
            <ul className="space-y-2 text-[11px]">
              <li className="flex gap-2">
                <span className="text-orange-500">•</span>
                <span>Swensi charges a standard 10% commission on all completed transactions.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500">•</span>
                <span>Payments are processed through verified local mobile money channels.</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-xs font-black text-secondary dark:text-slate-200 uppercase tracking-widest mb-3 flex items-center gap-2">
              <i className="fa-solid fa-location-crosshairs text-orange-500"></i>
              4. Service Standards
            </h3>
            <p className="text-[11px] leading-relaxed">
              Providers must maintain valid licenses and meet Swensi's safety benchmarks. Customers must provide accurate descriptions and honor their bookings. Speed is our promise—don't keep your community waiting!
            </p>
          </section>

          <section className="pt-4 border-t border-slate-100 dark:border-white/5">
            <p className="text-[10px] italic font-medium text-slate-400">
              By ticking the agreement box, you confirm that you are at least 18 years old and agree to uphold the integrity of the Swensi Nakonde Trade Link.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-white/5 flex justify-center">
          <button 
            onClick={onClose}
            className="px-10 py-4 bg-secondary dark:bg-orange-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
