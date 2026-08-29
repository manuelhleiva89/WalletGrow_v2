/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AppLockScreenProps {
  biometricEnabled: boolean;
  correctPassword?: string;
  userName: string;
  onUnlock: () => void;
}

export default function AppLockScreen({
  biometricEnabled,
  correctPassword = '',
  userName,
  onUnlock,
}: AppLockScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  const handleKeyPress = (num: string) => {
    setError(false);
    if (password.length < 8) {
      setPassword((prev) => prev + num);
    }
  };

  const handleClear = () => {
    setPassword('');
    setError(false);
  };

  const handleBackspace = () => {
    setPassword((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleVerifyPassword = (pwdToVerify: string) => {
    // If no password is set, fallback or accept '1234'
    const targetPwd = correctPassword || '1234';
    if (pwdToVerify === targetPwd) {
      onUnlock();
    } else {
      setError(true);
      // Shake effect: password gets cleared after animation
      setTimeout(() => {
        setPassword('');
      }, 500);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerifyPassword(password);
  };

  // Trigger biometric simulation
  const handleTriggerBiometric = () => {
    if (isScanning || scanSuccess) return;
    setIsScanning(true);
    setError(false);

    // Simulate scanning for 1.6s
    setTimeout(() => {
      setIsScanning(false);
      setScanSuccess(true);
      
      // Unlock after success animation
      setTimeout(() => {
        onUnlock();
      }, 600);
    }, 1600);
  };

  return (
    <div id="app_lock_overlay" className="fixed inset-0 z-50 bg-[#031935] flex items-center justify-center p-4">
      {/* Background Decorative Rings */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-[#006a62]/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-[#1b2e4b]/20 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-sm bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col items-center shadow-2xl relative">
        
        {/* Lock / Logo Header */}
        <div className="mb-6 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#006a62] to-[#008f84] flex items-center justify-center text-white mx-auto shadow-lg mb-3"
          >
            <span className="material-symbols-outlined text-3xl font-semibold">
              {isScanning ? 'fingerprint' : scanSuccess ? 'lock_open' : 'lock'}
            </span>
          </motion.div>
          <h2 className="text-xl font-bold text-white tracking-tight">Aplicación Bloqueada</h2>
          <p className="text-xs text-white/60 mt-1">Hola, {userName || 'Usuario'}. Por favor autentícate.</p>
        </div>

        {/* Biometric Scanning Overlay/Feedback */}
        <AnimatePresence>
          {isScanning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#031935]/95 rounded-2xl flex flex-col items-center justify-center z-25 p-6 text-center"
            >
              <div className="relative w-24 h-24 flex items-center justify-center mb-4">
                {/* Pulse ripples */}
                <span className="absolute inset-0 rounded-full border border-[#006a62] animate-ping opacity-75"></span>
                <span className="absolute inset-4 rounded-full border border-[#006a62]/60 animate-pulse"></span>
                <div className="w-16 h-16 rounded-full bg-[#006a62]/20 flex items-center justify-center text-[#008f84]">
                  <span className="material-symbols-outlined text-4xl animate-pulse">fingerprint</span>
                </div>
                {/* Laser scan line */}
                <motion.div 
                  initial={{ top: '10%' }}
                  animate={{ top: '80%' }}
                  transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1 }}
                  className="absolute left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-[#00ffeb] to-transparent shadow-[0_0_8px_#00ffeb]"
                ></motion.div>
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Escaneando Huella / Rostro</h3>
              <p className="text-xs text-white/50 mt-1 max-w-[200px]">Coloca tu dedo en el sensor biométrico de tu dispositivo</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PIN Input / Password Visualizers */}
        <form onSubmit={handleManualSubmit} className="w-full flex flex-col items-center mb-6">
          <motion.div 
            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex justify-center gap-3 py-3 w-full"
          >
            {/* Show dot points based on password length */}
            {Array.from({ length: 4 }).map((_, idx) => {
              const isActive = password.length > idx;
              return (
                <div 
                  key={idx} 
                  className={`w-4.5 h-4.5 rounded-full border-2 transition-all duration-150 ${
                    error 
                      ? 'bg-[#ba1a1a] border-[#ba1a1a] scale-105' 
                      : isActive 
                        ? 'bg-[#008f84] border-[#008f84] scale-110 shadow-[0_0_8px_#008f84]' 
                        : 'border-white/30 bg-transparent'
                  }`}
                />
              );
            })}
          </motion.div>
          
          {error && (
            <span className="text-xs text-[#ffb4ab] font-semibold mt-1">
              Contraseña incorrecta. Inténtalo de nuevo.
            </span>
          )}

          {/* Hidden standard input just in case user uses physical keyboard */}
          <input 
            type="password"
            value={password}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, ''); // numbers only
              setPassword(val);
              if (val.length === 4) {
                handleVerifyPassword(val);
              }
            }}
            maxLength={4}
            autoFocus
            className="sr-only"
          />
        </form>

        {/* Digital Grid Keypad */}
        <div className="grid grid-cols-3 gap-4 justify-items-center justify-center w-full max-w-[280px] mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                handleKeyPress(num);
                const nextPass = password + num;
                if (nextPass.length === 4) {
                  // Wait brief moment so dot lights up before verifying
                  setTimeout(() => {
                    handleVerifyPassword(nextPass);
                  }, 120);
                }
              }}
              className="w-16 h-16 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xl flex items-center justify-center active:bg-white/20 active:scale-95 transition-all select-none cursor-pointer"
            >
              {num}
            </button>
          ))}
          
          {/* Backspace or Clear (Uniform Circle) */}
          <button
            type="button"
            onClick={handleClear}
            className="w-16 h-16 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 font-semibold text-lg flex items-center justify-center active:bg-white/20 active:scale-95 transition-all select-none cursor-pointer"
            title="Limpiar"
          >
            C
          </button>

          <button
            type="button"
            onClick={() => {
              handleKeyPress('0');
              const nextPass = password + '0';
              if (nextPass.length === 4) {
                setTimeout(() => {
                  handleVerifyPassword(nextPass);
                }, 120);
              }
            }}
            className="w-16 h-16 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xl flex items-center justify-center active:bg-white/20 active:scale-95 transition-all select-none cursor-pointer"
          >
            0
          </button>

          {/* Biometrics button or delete button */}
          {biometricEnabled ? (
            <button
              type="button"
              onClick={handleTriggerBiometric}
              className="w-16 h-16 rounded-full bg-[#006a62]/20 border border-[#008f84]/30 text-[#00ffeb] flex items-center justify-center active:bg-[#006a62]/30 active:scale-95 hover:bg-[#006a62]/20 transition-all select-none cursor-pointer"
              title="Autenticación Biométrica"
            >
              <span className="material-symbols-outlined text-2xl">fingerprint</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBackspace}
              className="w-16 h-16 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center active:bg-white/20 active:scale-95 transition-all select-none cursor-pointer"
              title="Borrar"
            >
              <span className="material-symbols-outlined text-xl">backspace</span>
            </button>
          )}
        </div>

        {/* Quick Help Footer */}
        <div className="text-center mt-3 text-[10px] text-white/40">
          {biometricEnabled 
            ? 'Puedes desbloquear usando el sensor de huella táctil o PIN' 
            : 'Introduce el PIN de 4 dígitos configurado (por defecto: 1234)'
          }
        </div>

      </div>
    </div>
  );
}
