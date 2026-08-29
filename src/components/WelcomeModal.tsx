import React from 'react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
}

export default function WelcomeModal({ isOpen, onClose, userName, userEmail }: WelcomeModalProps) {
  if (!isOpen) return null;

  // Derive a dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  const isDemo = userEmail === 'demo@profin.com' || userEmail === 'demo@walletgrow.com';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      id="welcome_modal_container"
    >
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-[#031935]/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        id="welcome_modal_backdrop"
      />

      {/* Modal Card Content */}
      <div 
        className="relative bg-white w-full max-w-lg rounded-2xl border border-[#c4c6ce] shadow-2xl overflow-hidden z-10 p-6 sm:p-8 flex flex-col gap-6 transform transition-all duration-300 scale-in animate-in fade-in zoom-in-95 duration-200"
        id="welcome_modal_card"
      >
        {/* Decorative Top Accent Leaf */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#006a62]" />

        {/* Header Visual Icon & Greeting */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-[#006a62]/10 text-[#006a62] flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[36px] animate-pulse">celebration</span>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#031935] tracking-tight">
              {getGreeting()}, {userName}!
            </h2>
            <p className="text-xs sm:text-sm font-medium text-[#44474d]">
              Te damos la bienvenida a <strong className="text-[#006a62]">WalletGrow</strong>, tu centro de control financiero inteligente.
            </p>
          </div>
        </div>

        {/* App Key Highlights Container */}
        <div className="flex flex-col gap-3.5 my-1" id="welcome_modal_features">
          <h3 className="text-[10px] font-extrabold text-[#44474d] uppercase tracking-wider">Todo listo para despegar</h3>
          
          {/* Card 1: Local Secure Data */}
          <div className="flex gap-4 p-3.5 border border-[#e0e3e5] bg-slate-50 rounded-xl hover:bg-[#f1f4f6]/50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </div>
            <div className="flex flex-col gap-0.5 justify-center">
              <h4 className="text-xs font-bold text-[#031935]">Privacidad y Seguridad Local</h4>
              <p className="text-[10.5px] text-[#44474d] leading-normal">
                Tus datos se guardan de forma encriptada en el almacenamiento local de tu navegador. Sin servidores externos.
              </p>
            </div>
          </div>

          {/* Card 2: Financial Monitoring */}
          <div className="flex gap-4 p-3.5 border border-[#e0e3e5] bg-slate-50 rounded-xl hover:bg-[#f1f4f6]/50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#006a62]/10 text-[#006a62] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">donut_large</span>
            </div>
            <div className="flex flex-col gap-0.5 justify-center">
              <h4 className="text-xs font-bold text-[#031935]">Monitoreo de Flujo de Caja</h4>
              <p className="text-[10.5px] text-[#44474d] leading-normal">
                Controla tus tarjetas, cuentas bancarias e inversiones en tiempo real mediante reportes automatizados.
              </p>
            </div>
          </div>

          {/* Card 3: Goals tracking */}
          <div className="flex gap-4 p-3.5 border border-[#e0e3e5] bg-slate-50 rounded-xl hover:bg-[#f1f4f6]/50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">insights</span>
            </div>
            <div className="flex flex-col gap-0.5 justify-center">
              <h4 className="text-xs font-bold text-[#031935]">Metas e Inversiones Inteligentes</h4>
              <p className="text-[10.5px] text-[#44474d] leading-normal">
                Visualiza el cumplimiento de tus objetivos de ahorro y mantén un registro de tus plazos fijos y portafolio cripto.
              </p>
            </div>
          </div>
        </div>

        {/* Demo notification badge if active */}
        {isDemo && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5">
            <span className="material-symbols-outlined text-blue-600 text-[18px]">info</span>
            <p className="text-[10px] text-blue-800 leading-normal font-semibold">
              Estás navegando en modo de Demostración con datos de prueba cargados automáticamente.
            </p>
          </div>
        )}

        {/* Action Button CTA */}
        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 bg-[#006a62] hover:bg-[#005049] text-white text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#006a62]/10 active:scale-[0.98]"
          id="welcome_modal_close_btn"
        >
          <span>Comenzar a Administrar</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
