/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (email: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  // Pre-seed the requested user in localStorage on mount
  React.useEffect(() => {
    try {
      const users = JSON.parse(localStorage.getItem('profin_users') || '{}');
      if (!users['manuel.leiva@walletgrow.com']) {
        users['manuel.leiva@walletgrow.com'] = { name: 'Manuel Leiva', password: 'pass1234' };
        localStorage.setItem('profin_users', JSON.stringify(users));
      }
    } catch (e) {
      console.error('Error pre-seeding user:', e);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Por favor, introduce un correo electrónico válido.');
      return;
    }
    if (!password || password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (isRegistering) {
      if (!name.trim()) {
        setError('Por favor, introduce tu nombre.');
        return;
      }
      // Save credentials in localStorage
      const users = JSON.parse(localStorage.getItem('profin_users') || '{}');
      users[email.toLowerCase()] = { name, password };
      localStorage.setItem('profin_users', JSON.stringify(users));
      
      // Also set the current username in localStorage
      localStorage.setItem('profin_user_name', name);
      onLoginSuccess(email);
    } else {
      // Login flow
      const emailLower = email.toLowerCase();
      if (emailLower === 'demo@walletgrow.com') {
        localStorage.setItem('profin_user_name', 'John Doe');
        onLoginSuccess(email);
        return;
      }

      if (emailLower === 'manuel.leiva@walletgrow.com') {
        if (password === 'pass1234') {
          localStorage.setItem('profin_user_name', 'Manuel Leiva');
          // Double check it exists in users
          const users = JSON.parse(localStorage.getItem('profin_users') || '{}');
          users[emailLower] = { name: 'Manuel Leiva', password: 'pass1234' };
          localStorage.setItem('profin_users', JSON.stringify(users));
          onLoginSuccess(email);
          return;
        } else {
          setError('Contraseña incorrecta para Manuel Leiva.');
          return;
        }
      }

      const users = JSON.parse(localStorage.getItem('profin_users') || '{}');
      const savedUser = users[emailLower];
      if (savedUser && savedUser.password === password) {
        localStorage.setItem('profin_user_name', savedUser.name || 'Usuario');
        onLoginSuccess(email);
      } else {
        setError('Credenciales incorrectas. Usa demo@walletgrow.com o crea una cuenta nueva.');
      }
    }
  };

  return (
    <div id="login_container" className="min-h-screen flex flex-col md:flex-row font-sans bg-[#f7fafc] text-[#181c1e] pt-[env(safe-area-inset-top,0px)]">
      
      {/* Banner decorativo - Oculto en móviles, lateral en desktop */}
      <div id="login_banner" className="hidden md:flex md:w-1/2 lg:w-3/5 bg-[#1b2e4b] flex-col items-center justify-center relative overflow-hidden p-12">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #84f5e8 0%, transparent 40%), radial-gradient(circle at 80% 70%, #84f5e8 0%, transparent 40%)' }}></div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="z-10 text-center max-w-md"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight font-sans">
            Gestión Financiera de Precisión
          </h1>
          <p className="text-[#b4c7ec] text-lg leading-relaxed">
            Tome el control de su patrimonio con herramientas analíticas de grado institucional, diseñadas para la máxima claridad y seguridad.
          </p>
        </motion.div>

        {/* Gráfico de ondas sutiles */}
        <div className="absolute bottom-0 w-full h-1/3 border-t border-[#b4c7ec]/10 bg-gradient-to-t from-[#84f5e8]/5 to-transparent">
          <svg className="w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M0,100 L0,50 C20,40 30,60 50,45 C70,30 80,70 100,20 L100,100 Z" fill="rgba(132, 245, 232, 0.1)" stroke="#84f5e8" strokeWidth="0.5"></path>
            <path d="M0,100 L0,60 C25,55 35,70 60,50 C80,35 90,60 100,40 L100,100 Z" fill="rgba(132, 245, 232, 0.05)" stroke="#66d9cc" strokeWidth="0.5"></path>
          </svg>
        </div>
      </div>

      {/* Formulario de Login/Registro */}
      <main id="login_main" className="flex-1 flex flex-col justify-center px-6 py-12 md:px-12 lg:px-24 xl:px-32 relative z-10">
        <div className="w-full max-w-md mx-auto">
          
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              id="login_logo"
              alt="WalletGrow Logo" 
              className="w-24 h-24 md:w-32 md:h-32 object-contain rounded-2xl shadow-sm border border-[#e0e3e5]" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0s2dzudEzRhnFBfSTbJ6CtifGk5oHqwL6rvPCSTjcgx-RYzFus3nQJ_yk1UvC-aSc0Zzd-Qp7LbO1HTrhk5JQxFklUQM8AxpSaTFRNRQEZMSKuVvQZHAEAkjh9Xm7dDtmcTTWkbrfd1HUTqbiYrFSUNXlb-yX99DQ939cF0W_Biaca2_wdWnuJeam7NCuHgSBlI6kRHfwD_wh15hAyp0_YX7qgA8CgTnmc3VYB5gsYZ9noacK5O2aSSWFNo4l-TWwpb4" 
            />
          </div>

          {/* Encabezado */}
          <div className="text-center mb-8">
            <h2 id="login_title" className="text-2xl font-bold text-[#031935] tracking-tight">
              {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </h2>
            <p className="text-sm text-[#44474d] mt-2">
              {isRegistering ? 'Regístrese para comenzar a gestionar sus finanzas.' : 'Acceda a su portal de gestión financiera personal.'}
            </p>
          </div>

          {/* Tarjeta de Formulario */}
          <div className="bg-white/85 backdrop-blur-md border border-[#e0e3e5] rounded-xl p-6 sm:p-8 shadow-md">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {isRegistering && (
                <div className="relative w-full">
                  <input 
                    type="text" 
                    id="name"
                    placeholder=" "
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="peer w-full h-14 pt-5 pb-1 px-4 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg focus:border-[#006a62] focus:bg-white outline-none transition-all text-sm"
                  />
                  <label 
                    htmlFor="name" 
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#75777e] transition-all pointer-events-none text-sm
                      peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm
                      peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-[#006a62]
                      peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs"
                  >
                    Nombre Completo
                  </label>
                </div>
              )}

              {/* Input Email */}
              <div className="relative w-full">
                <input 
                  type="email" 
                  id="email"
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="peer w-full h-14 pt-5 pb-1 px-4 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg focus:border-[#006a62] focus:bg-white outline-none transition-all text-sm"
                />
                <label 
                  htmlFor="email" 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#75777e] transition-all pointer-events-none text-sm
                    peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm
                    peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-[#006a62]
                    peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Correo Electrónico
                </label>
              </div>

              {/* Input Password */}
              <div className="relative w-full">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="password"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="peer w-full h-14 pt-5 pb-1 px-4 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg focus:border-[#006a62] focus:bg-white outline-none transition-all text-sm pr-12"
                />
                <label 
                  htmlFor="password" 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#75777e] transition-all pointer-events-none text-sm
                    peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm
                    peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-[#006a62]
                    peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Contraseña
                </label>
                {/* Visibility Toggle */}
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c4c6ce] hover:text-[#44474d] transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[20px] select-none">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>

              {/* Errores */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Recordarme y Olvido */}
              <div className="flex items-center justify-between mt-1 mb-2">
                <label className="flex items-center select-none cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-[#006a62] focus:ring-[#006a62] border-[#c4c6ce] rounded transition-colors"
                  />
                  <span className="ml-2 text-xs text-[#44474d]">Recordarme</span>
                </label>
                {!isRegistering && (
                  <button 
                    type="button" 
                    onClick={() => setError('La recuperación de contraseña está deshabilitada en el modo demo. Usa demo@profin.com / password.')}
                    className="text-xs text-[#006a62] hover:text-[#005049] transition-colors focus:outline-none"
                  >
                    ¿Olvidó su contraseña?
                  </button>
                )}
              </div>

              {/* Botón de envío */}
              <div className="flex flex-col gap-3 mt-1">
                <button 
                  type="submit"
                  className="w-full h-12 flex justify-center items-center px-4 rounded-lg text-white bg-[#1b2e4b] hover:bg-[#031935] font-semibold text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#006a62]/50"
                >
                  {isRegistering ? 'Crear Cuenta' : 'Acceder'}
                  <span className="material-symbols-outlined ml-2 text-[20px]">
                    {isRegistering ? 'person_add' : 'login'}
                  </span>
                </button>

                {/* Separador */}
                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-[#c4c6ce] w-full"></div>
                  <span className="bg-white px-3 text-xs text-[#75777e] absolute">O</span>
                </div>

                {/* Botón secundario */}
                <button 
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError('');
                  }}
                  className="w-full h-12 flex justify-center items-center px-4 border border-[#c4c6ce] rounded-lg text-sm font-semibold text-[#031935] bg-white hover:bg-[#f1f4f6] transition-colors shadow-sm focus:outline-none"
                >
                  {isRegistering ? 'Ya tengo una cuenta' : 'Crear Cuenta'}
                  <span className="material-symbols-outlined ml-2 text-[20px]">
                    {isRegistering ? 'login' : 'person_add'}
                  </span>
                </button>
              </div>

            </form>
          </div>



        </div>
      </main>

    </div>
  );
}
