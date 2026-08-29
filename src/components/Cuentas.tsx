/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Account, Transaction } from '../types';

interface CuentasProps {
  accounts: Account[];
  transactions: Transaction[];
  onAddAccount: (acc: Omit<Account, 'id'>) => void;
  onDeleteAccount: (id: string) => void;
  onUpdateAccount: (acc: Account) => void;
  currencySymbol: string;
  formatAmount: (amount: number) => string;
}

const COLOR_PRESETS = [
  { value: '#006a62', label: 'Verde Azulado' },
  { value: '#1b2e4b', label: 'Azul Medianoche' },
  { value: '#15803d', label: 'Verde Esmeralda' },
  { value: '#ba1a1a', label: 'Rojo Carmesí' },
  { value: '#6b21a8', label: 'Púrpura Real' },
  { value: '#cca830', label: 'Dorado Cálido' },
  { value: '#031935', label: 'Azul Marino' },
  { value: '#374151', label: 'Gris Oscuro' },
];

const ICON_PRESETS = [
  { value: 'credit_card', label: 'Tarjeta' },
  { value: 'account_balance', label: 'Banco' },
  { value: 'account_balance_wallet', label: 'Cartera' },
  { value: 'payments', label: 'Efectivo' },
  { value: 'savings', label: 'Ahorro' },
  { value: 'star', label: 'Favorito' },
  { value: 'trending_up', label: 'Inversión' },
  { value: 'shopping_cart', label: 'Compras' },
];

const formatDateDisplay = (dateStr?: string) => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [_, month, day] = dateStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const mIdx = parseInt(month, 10) - 1;
    return `${parseInt(day, 10)} ${months[mIdx] || ''}`;
  }
  return dateStr;
};

export default function Cuentas({
  accounts,
  transactions,
  onAddAccount,
  onDeleteAccount,
  onUpdateAccount,
  currencySymbol,
  formatAmount,
}: CuentasProps) {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  useEffect(() => {
    if (accounts.length > 0) {
      const exists = accounts.some(a => a.id === selectedAccountId);
      if (!exists) {
        setSelectedAccountId(accounts[0].id);
      }
    } else {
      setSelectedAccountId('');
    }
  }, [accounts, selectedAccountId]);

  // Form states
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<'credit' | 'checking' | 'savings' | 'cash'>('checking');
  const [accBalance, setAccBalance] = useState('');
  const [accCardNumber, setAccCardNumber] = useState('');
  const [accBankName, setAccBankName] = useState('');
  const [accOwner, setAccOwner] = useState('John Doe');
  const [accLimit, setAccLimit] = useState('10000');
  
  // Setup HTML5 date inputs
  const todayStr = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 15);
  const futureStr = futureDate.toISOString().split('T')[0];

  const [accDueDate, setAccDueDate] = useState(futureStr);
  const [accCutoff, setAccCutoff] = useState(todayStr);
  const [accApr, setAccApr] = useState('18.9');
  const [accColor, setAccColor] = useState('#1b2e4b');
  const [accIcon, setAccIcon] = useState('credit_card');

  const handleStartEdit = (acc: Account) => {
    setEditingAccountId(acc.id);
    setAccName(acc.name);
    setAccType(acc.type);
    setAccBalance(acc.balance.toString());
    setAccCardNumber(acc.cardNumber ? acc.cardNumber.replace(/\*/g, '').trim() : '');
    setAccBankName(acc.bankName || '');
    setAccOwner(acc.ownerName);
    setAccLimit(acc.limit ? acc.limit.toString() : '10000');
    setAccDueDate(acc.dueDate || futureStr);
    setAccCutoff(acc.cutoffDate || todayStr);
    setAccApr(acc.apr ? acc.apr.toString() : '18.9');
    setAccColor(acc.color || '#1b2e4b');
    setAccIcon(acc.icon || (acc.type === 'credit' ? 'credit_card' : acc.type === 'checking' ? 'account_balance' : 'account_balance_wallet'));
    setShowAddForm(true);
    
    // Scroll smoothly to top form
    const container = document.getElementById('cuentas_tab');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelForm = () => {
    setAccName('');
    setAccBalance('');
    setAccCardNumber('');
    setAccBankName('');
    setAccOwner('John Doe');
    setAccLimit('10000');
    setAccDueDate(futureStr);
    setAccCutoff(todayStr);
    setAccApr('18.9');
    setAccColor('#1b2e4b');
    setAccIcon('credit_card');
    setEditingAccountId(null);
    setShowAddForm(false);
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  // Filter transactions for selected account
  const accountTransactions = transactions
    .filter(tx => tx.accountId === selectedAccountId || tx.toAccountId === selectedAccountId)
    .slice(0, 5); // show last 5 transactions for cleaner UI

  const carouselRef = useRef<HTMLDivElement>(null);
  const activeIndex = accounts.findIndex(a => a.id === selectedAccountId);

  const getScrollOffset = () => {
    if (carouselRef.current) {
      const firstChild = carouselRef.current.firstElementChild as HTMLElement;
      if (firstChild) {
        return firstChild.offsetWidth + 16; // width + gap-4
      }
    }
    return 291;
  };

  const handlePrevCard = () => {
    const prevIdx = activeIndex > 0 ? activeIndex - 1 : accounts.length - 1;
    if (prevIdx >= 0 && prevIdx < accounts.length) {
      setSelectedAccountId(accounts[prevIdx].id);
      if (carouselRef.current) {
        carouselRef.current.scrollTo({
          left: prevIdx * getScrollOffset(),
          behavior: 'smooth'
        });
      }
    }
  };

  const handleNextCard = () => {
    const nextIdx = activeIndex < accounts.length - 1 ? activeIndex + 1 : 0;
    if (nextIdx >= 0 && nextIdx < accounts.length) {
      setSelectedAccountId(accounts[nextIdx].id);
      if (carouselRef.current) {
        carouselRef.current.scrollTo({
          left: nextIdx * getScrollOffset(),
          behavior: 'smooth'
        });
      }
    }
  };

  const handleDotClick = (idx: number) => {
    if (idx >= 0 && idx < accounts.length) {
      setSelectedAccountId(accounts[idx].id);
      if (carouselRef.current) {
        carouselRef.current.scrollTo({
          left: idx * getScrollOffset(),
          behavior: 'smooth'
        });
      }
    }
  };

  const handleCardClick = (id: string, idx: number) => {
    setSelectedAccountId(id);
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: idx * getScrollOffset(),
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const index = Math.round(scrollLeft / getScrollOffset());
      if (index >= 0 && index < accounts.length) {
        const targetAccount = accounts[index];
        if (targetAccount && targetAccount.id !== selectedAccountId) {
          setSelectedAccountId(targetAccount.id);
        }
      }
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim() || !accBalance) return;

    if (editingAccountId) {
      onUpdateAccount({
        id: editingAccountId,
        name: accName,
        type: accType,
        balance: parseFloat(accBalance),
        cardNumber: accCardNumber ? (accCardNumber.startsWith('****') ? accCardNumber : `**** **** **** ${accCardNumber.slice(-4)}`) : undefined,
        bankName: accBankName || undefined,
        ownerName: accOwner,
        limit: accType === 'credit' ? parseFloat(accLimit) : undefined,
        dueDate: accType === 'credit' ? accDueDate : undefined,
        cutoffDate: accType === 'credit' ? accCutoff : undefined,
        apr: accType === 'credit' ? parseFloat(accApr) : undefined,
        color: accColor,
        icon: accIcon,
      });
    } else {
      onAddAccount({
        name: accName,
        type: accType,
        balance: parseFloat(accBalance),
        cardNumber: accCardNumber ? `**** **** **** ${accCardNumber.slice(-4)}` : undefined,
        bankName: accBankName || undefined,
        ownerName: accOwner,
        limit: accType === 'credit' ? parseFloat(accLimit) : undefined,
        dueDate: accType === 'credit' ? accDueDate : undefined,
        cutoffDate: accType === 'credit' ? accCutoff : undefined,
        apr: accType === 'credit' ? parseFloat(accApr) : undefined,
        color: accColor,
        icon: accIcon,
      });
    }

    handleCancelForm();
  };

  return (
    <div id="cuentas_tab" className="space-y-6 pt-4">
      
      {/* Cabecera */}
      <section className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-[#031935] tracking-tight">Cuentas y Tarjetas</h2>
          <p className="text-xs text-[#44474d] mt-1">Administre y vincule sus cuentas bancarias, tarjetas de crédito y efectivo.</p>
        </div>
        <button 
          onClick={() => {
            if (showAddForm) {
              handleCancelForm();
            } else {
              setShowAddForm(true);
            }
          }}
          className="bg-[#1b2e4b] hover:bg-[#031935] text-white flex items-center justify-center h-11 w-11 rounded-xl shadow-sm active:scale-95 transition-all focus:outline-none"
          title={editingAccountId ? "Cancelar Edición" : "Vincular Cuenta Nueva"}
        >
          <span className="material-symbols-outlined text-[20px] font-bold">
            {showAddForm ? 'close' : 'add'}
          </span>
        </button>
      </section>

      {/* Formulario de Adición/Edición Expandible */}
      <AnimatePresence>
        {showAddForm && (
          <motion.section 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-[#c4c6ce] rounded-xl p-6 shadow-sm overflow-hidden"
          >
            <h3 className="text-sm font-bold text-[#031935] uppercase tracking-wide mb-4">
              {editingAccountId ? "Editar Cuenta o Tarjeta" : "Vincular Cuenta o Tarjeta"}
            </h3>
            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#44474d] uppercase">Nombre de Cuenta</label>
                <input 
                  type="text" 
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  placeholder="ej. Cuenta Ahorro, Visa Gold"
                  required
                  className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#44474d] uppercase">Tipo de Cuenta</label>
                <select 
                  value={accType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setAccType(val);
                    if (val === 'credit') setAccIcon('credit_card');
                    else if (val === 'checking') setAccIcon('account_balance');
                    else if (val === 'savings') setAccIcon('savings');
                    else if (val === 'cash') setAccIcon('payments');
                  }}
                  className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none"
                >
                  <option value="checking">Cuenta Corriente</option>
                  <option value="savings">Cuenta de Ahorro</option>
                  <option value="credit">Tarjeta de Crédito</option>
                  <option value="cash">Efectivo / Cartera</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#44474d] uppercase">Saldo Inicial ($)</label>
                <input 
                  type="number" 
                  value={accBalance}
                  onChange={(e) => setAccBalance(e.target.value)}
                  placeholder="ej. 1250.00"
                  required
                  className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none font-mono transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#44474d] uppercase">Banco Emisor (Opcional)</label>
                <input 
                  type="text" 
                  value={accBankName}
                  onChange={(e) => setAccBankName(e.target.value)}
                  placeholder="ej. BBVA, Santander"
                  className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#44474d] uppercase">Dígitos de Tarjeta (Opcional)</label>
                <input 
                  type="text" 
                  maxLength={4}
                  value={accCardNumber}
                  onChange={(e) => setAccCardNumber(e.target.value)}
                  placeholder="ej. 4920"
                  className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none font-mono transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#44474d] uppercase">Titular</label>
                <input 
                  type="text" 
                  value={accOwner}
                  onChange={(e) => setAccOwner(e.target.value)}
                  required
                  className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none transition-colors"
                />
              </div>

              {accType === 'credit' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#44474d] uppercase">Límite de Crédito ($)</label>
                    <input 
                      type="number" 
                      value={accLimit}
                      onChange={(e) => setAccLimit(e.target.value)}
                      className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#44474d] uppercase">Fecha de Pago (Due Date)</label>
                    <input 
                      type="date" 
                      value={accDueDate}
                      onChange={(e) => setAccDueDate(e.target.value)}
                      required={accType === 'credit'}
                      className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#44474d] uppercase">Fecha de Corte (Cutoff Date)</label>
                    <input 
                      type="date" 
                      value={accCutoff}
                      onChange={(e) => setAccCutoff(e.target.value)}
                      required={accType === 'credit'}
                      className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#44474d] uppercase">Tasa de Interés Anual (%)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={accApr}
                      onChange={(e) => setAccApr(e.target.value)}
                      placeholder="ej. 18.9"
                      required={accType === 'credit'}
                      className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none font-mono"
                    />
                  </div>
                </>
              )}

              {/* Personalizar Color de Tarjeta */}
              <div className="col-span-1 sm:col-span-2 md:col-span-3 flex flex-col gap-1.5 mt-2">
                <label className="text-xs font-semibold text-[#44474d] uppercase">Personalizar Color de Tarjeta</label>
                <div className="flex flex-wrap gap-2.5 items-center bg-[#f1f4f6] p-3 rounded-xl border border-[#c4c6ce]">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setAccColor(preset.value)}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm relative focus:outline-none"
                      style={{ backgroundColor: preset.value }}
                      title={preset.label}
                    >
                      {accColor === preset.value && (
                        <span className="material-symbols-outlined text-white text-xs font-bold">check</span>
                      )}
                    </button>
                  ))}
                  {/* Custom color picker */}
                  <div className="flex items-center gap-1.5 ml-2 border-l border-[#c4c6ce] pl-3.5">
                    <input 
                      type="color" 
                      value={accColor}
                      onChange={(e) => setAccColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent outline-none p-0"
                      title="Color Personalizado"
                    />
                    <span className="text-xs font-semibold text-[#44474d] hidden sm:inline">Personalizado</span>
                  </div>
                </div>
              </div>

              {/* Personalizar Icono */}
              <div className="col-span-1 sm:col-span-2 md:col-span-3 flex flex-col gap-1.5 mt-2">
                <label className="text-xs font-semibold text-[#44474d] uppercase">Personalizar Icono</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 bg-[#f1f4f6] p-3 rounded-xl border border-[#c4c6ce]">
                  {ICON_PRESETS.map((preset) => {
                    const isActive = accIcon === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setAccIcon(preset.value)}
                        className={`py-2 px-1 rounded-lg flex flex-col items-center justify-center gap-1 transition-all text-center focus:outline-none ${
                          isActive 
                            ? 'bg-[#1b2e4b] text-white shadow-sm' 
                            : 'bg-white hover:bg-[#e5e9eb] text-[#44474d] border border-[#c4c6ce]/40'
                        }`}
                        title={preset.label}
                      >
                        <span className="material-symbols-outlined text-[18px]">{preset.value}</span>
                        <span className="text-[9px] font-semibold truncate max-w-full">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="sm:col-span-2 md:col-span-3 flex justify-end gap-3 mt-4 border-t border-[#ebeef0] pt-4">
                <button 
                  type="button" 
                  onClick={handleCancelForm}
                  className="px-4 py-2 border border-[#c4c6ce] hover:bg-[#f1f4f6] text-xs font-bold rounded-lg text-[#031935]"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#1b2e4b] hover:bg-[#031935] text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  {editingAccountId ? "Guardar Cambios" : "Guardar Cuenta"}
                </button>
              </div>

            </form>
          </motion.section>
        )}
      </AnimatePresence>
      {accounts.length === 0 ? (
        <section id="empty_accounts_placeholder" className="bg-[#f1f4f6] border border-dashed border-[#c4c6ce] rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#1b2e4b]/10 flex items-center justify-center text-[#1b2e4b]">
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#031935]">No hay cuentas o tarjetas vinculadas</h3>
            <p className="text-xs text-[#44474d] max-w-sm mx-auto mt-1 leading-relaxed">
              Para comenzar a administrar tus finanzas, vincula tu primera cuenta corriente, de ahorro, tarjeta de crédito o efectivo.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-2 h-9 px-4 bg-[#1b2e4b] hover:bg-[#031935] text-white text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Vincular Primera Cuenta</span>
          </button>
        </section>
      ) : (
        <section id="carousel_section" className="w-full relative group/carousel">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[11px] font-bold text-[#75777e] uppercase tracking-wide">Tus Tarjetas y Cuentas Activas</h3>
            <p className="text-[10px] text-[#75777e] sm:block hidden">Desliza o usa las flechas para explorar</p>
          </div>
          
          {/* Carousel slide box with navigation buttons */}
          <div className="relative flex items-center justify-between">
            {/* Navigation Control - Prev Button */}
            <button
              type="button"
              onClick={handlePrevCard}
              className="absolute left-[-16px] z-20 w-10 h-10 rounded-full bg-white border border-[#c4c6ce] shadow-md flex items-center justify-center text-[#031935] hover:bg-[#f1f4f6] active:scale-90 transition-all focus:outline-none opacity-0 group-hover/carousel:opacity-100 sm:opacity-100 cursor-pointer"
              aria-label="Tarjeta anterior"
            >
              <span className="material-symbols-outlined font-bold text-[20px]">chevron_left</span>
            </button>

            {/* Interactive Scrollable Area */}
            <div 
              ref={carouselRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto gap-4 pb-3 snap-x snap-mandatory w-full scroll-smooth hide-scrollbar px-1"
            >
              {accounts.map((acc, idx) => {
                const isSelected = acc.id === selectedAccountId;
                const isCredit = acc.type === 'credit';
                
                const hasCustomColor = !!acc.color;
                const cardBgStyle = hasCustomColor ? { backgroundColor: acc.color, color: '#ffffff', borderColor: 'transparent' } : undefined;
                const isCardDark = hasCustomColor || isCredit;

                return (
                  <div 
                    key={acc.id}
                    onClick={() => handleCardClick(acc.id, idx)}
                    style={cardBgStyle}
                    className={`snap-start shrink-0 rounded-xl p-5 border relative overflow-hidden flex flex-col justify-between min-h-[175px] w-[calc(100vw-48px)] sm:w-[290px] md:w-[310px] cursor-pointer shadow-sm transition-all duration-200 select-none ${
                      isSelected ? 'ring-2 ring-[#006a62] scale-[0.98]' : ''
                    } ${
                      hasCustomColor 
                        ? '' 
                        : isCredit 
                          ? 'gradient-card text-white border-[#1b2e4b]' 
                          : 'bg-white text-[#181c1e] border-[#c4c6ce] hover:bg-[#f1f4f6]/50'
                    }`}
                  >
                    {/* Fondo decorativo sutil para tarjetas */}
                    <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-white/5 pointer-events-none"></div>

                    <div className="flex justify-between items-start z-10">
                      <span className={`text-xs font-semibold ${isCardDark ? 'text-white/80' : 'text-[#44474d]'}`}>
                        {acc.bankName || 'Personal Wallet'}
                      </span>
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(acc);
                        }}
                        className={`material-symbols-outlined p-1 rounded hover:bg-black/10 active:scale-95 transition-all cursor-pointer ${isCardDark ? 'text-white hover:bg-white/10' : 'text-[#031935] hover:bg-[#031935]/5'}`}
                        title="Editar cuenta / tarjeta"
                      >
                        {acc.icon || (isCredit ? 'credit_card' : acc.type === 'checking' ? 'account_balance' : 'account_balance_wallet')}
                      </span>
                    </div>

                    <div className="z-10 mt-2">
                      <span className={`text-[10px] uppercase font-bold tracking-wider block ${isCardDark ? 'text-white/80' : 'text-[#75777e]'}`}>
                        {acc.name.split(' (')[0]}
                      </span>
                      <div className="text-xl font-bold font-mono tracking-tight mt-1">
                        {formatAmount(acc.balance)}
                      </div>
                      {acc.cardNumber && (
                        <div className={`text-[10px] font-mono tracking-widest mt-1.5 ${isCardDark ? 'text-white/70' : 'text-[#75777e]'}`}>
                          {acc.cardNumber}
                        </div>
                      )}
                    </div>

                    <div className={`flex justify-between items-end z-10 mt-3 border-t pt-2.5 ${isCardDark ? 'border-white/10' : 'border-[#ebeef0]'}`}>
                      <span className={`text-[10px] font-bold ${isCardDark ? 'text-white/85' : 'text-[#75777e]'}`}>
                        {acc.ownerName.toUpperCase()}
                      </span>
                      {isCredit && (
                        <div className="text-right">
                          <span className={`text-[9px] font-bold block uppercase ${isCardDark ? 'text-white/80' : 'text-[#75777e]'}`}>Vence</span>
                          <span className="text-xs font-bold font-mono">{formatDateDisplay(acc.dueDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Botón de Añadir en el carrusel */}
              <div 
                onClick={() => setShowAddForm(true)}
                className="snap-start shrink-0 rounded-xl bg-[#f1f4f6]/60 text-[#44474d] border border-dashed border-[#c4c6ce] flex flex-col items-center justify-center min-h-[175px] w-[calc(100vw-48px)] sm:w-[290px] md:w-[310px] cursor-pointer hover:bg-[#f1f4f6] hover:border-[#006a62] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm">
                  <span className="material-symbols-outlined text-[#1b2e4b]">add_card</span>
                </div>
                <span className="text-xs font-bold">Vincular otra cuenta</span>
              </div>
            </div>

            {/* Navigation Control - Next Button */}
            <button
              type="button"
              onClick={handleNextCard}
              className="absolute right-[-16px] z-20 w-10 h-10 rounded-full bg-white border border-[#c4c6ce] shadow-md flex items-center justify-center text-[#031935] hover:bg-[#f1f4f6] active:scale-90 transition-all focus:outline-none opacity-0 group-hover/carousel:opacity-100 sm:opacity-100 cursor-pointer"
              aria-label="Siguiente tarjeta"
            >
              <span className="material-symbols-outlined font-bold text-[20px]">chevron_right</span>
            </button>
          </div>

          {/* Indicadores de Carrusel */}
          <div className="flex justify-center gap-1.5 mt-3">
            {accounts.map((acc, idx) => (
              <div 
                key={acc.id}
                onClick={() => handleDotClick(idx)}
                className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${acc.id === selectedAccountId ? 'w-5 bg-[#006a62]' : 'w-2 bg-[#c4c6ce] hover:bg-[#75777e]'}`}
              ></div>
            ))}
          </div>
        </section>
      )}

      {/* Detailed List Area / Panel de Detalles de la Cuenta seleccionada */}
      {selectedAccount && (() => {
        const totalLiquidBalance = accounts
          .filter(a => a.type !== 'credit')
          .reduce((sum, a) => sum + a.balance, 0);

        return (
          <section id="account_details_panel" className="bg-white border border-[#c4c6ce] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#ebeef0]">
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => handleStartEdit(selectedAccount)}
                  className="w-10 h-10 rounded flex items-center justify-center text-white cursor-pointer hover:scale-105 active:scale-95 hover:shadow-md transition-all"
                  style={{ backgroundColor: selectedAccount.color || '#1b2e4b' }}
                  title="Editar cuenta / tarjeta"
                >
                  <span className="material-symbols-outlined">
                    {selectedAccount.icon || (selectedAccount.type === 'credit' ? 'credit_card' : selectedAccount.type === 'checking' ? 'account_balance' : 'account_balance_wallet')}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#031935]">{selectedAccount.name}</h3>
                  <p className="text-xs text-[#75777e] font-sans">
                    {selectedAccount.bankName || 'Fondos'} • {selectedAccount.ownerName}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => {
                  setAccountToDelete(selectedAccount);
                }}
                className="p-2 text-[#ba1a1a] hover:bg-red-50 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                <span>Borrar</span>
              </button>
            </div>

            {/* Información Técnica de la cuenta (cutoff dates / aprs) */}
            {selectedAccount.type === 'credit' ? (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-[#f1f4f6] p-3 rounded-lg text-center sm:text-left">
                    <div className="text-[9px] font-bold text-[#75777e] uppercase tracking-wide">Fecha de Corte</div>
                    <div className="text-xs font-bold text-[#031935] mt-0.5">{formatDateDisplay(selectedAccount.cutoffDate)}</div>
                  </div>
                  <div className="bg-[#f1f4f6] p-3 rounded-lg text-center sm:text-left">
                    <div className="text-[9px] font-bold text-[#75777e] uppercase tracking-wide">Fecha de Pago</div>
                    <div className="text-xs font-bold text-[#031935] mt-0.5">{formatDateDisplay(selectedAccount.dueDate)}</div>
                  </div>
                  <div className="bg-[#f1f4f6] p-3 rounded-lg text-center sm:text-left">
                    <div className="text-[9px] font-bold text-[#75777e] uppercase tracking-wide">Tasa de Interés</div>
                    <div className="text-xs font-bold text-[#031935] mt-0.5">{selectedAccount.apr}%</div>
                  </div>
                </div>

                {/* Límite de Crédito Utilizado vs Disponible */}
                <div className="bg-[#f1f4f6] p-4 rounded-xl border border-[#c4c6ce]/30">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-[#44474d]">Uso del Límite de Crédito</span>
                    <span className="font-bold text-[#031935] font-mono">
                      {Math.round((selectedAccount.balance / (selectedAccount.limit || 1)) * 100)}% Usado
                    </span>
                  </div>
                  <div className="w-full bg-[#e5e9eb] rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-[#006a62] h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (selectedAccount.balance / (selectedAccount.limit || 1)) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[#75777e] mt-2 font-mono">
                    <span>Deuda Actual: {formatAmount(selectedAccount.balance)}</span>
                    <span>Límite de Crédito Total: {formatAmount(selectedAccount.limit || 0)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                <div className="bg-[#f1f4f6] p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-[#44474d] flex-1">
                    Esta es una cuenta líquida de tipo <strong>{selectedAccount.type === 'checking' ? 'Cuenta Corriente' : selectedAccount.type === 'savings' ? 'Cuenta de Ahorro' : 'Efectivo / Cartera'}</strong>. El saldo total se refleja directamente en tu patrimonio neto.
                  </div>
                  {totalLiquidBalance > 0 && (
                    <div className="bg-white px-3.5 py-2 rounded-lg border border-[#c4c6ce]/30 flex flex-col items-center justify-center text-center shrink-0 min-w-[120px]">
                      <span className="text-[9px] font-bold text-[#75777e] uppercase tracking-wide">Participación</span>
                      <span className="text-sm font-bold text-[#006a62] font-mono mt-0.5">
                        {Math.round((selectedAccount.balance / totalLiquidBalance) * 100)}%
                      </span>
                      <span className="text-[8px] text-[#75777e] mt-0.5 font-sans">de liquidez total</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Últimas Transacciones en esta cuenta */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-[#031935] uppercase tracking-wider mb-3">Últimas Transacciones vinculadas</h4>
              {accountTransactions.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#75777e] border border-[#ebeef0] rounded-lg">
                  No hay transacciones registradas para esta cuenta.
                </div>
              ) : (
                <div className="border border-[#ebeef0] rounded-lg divide-y divide-[#ebeef0] overflow-hidden">
                  {accountTransactions.map(tx => {
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';
                    return (
                      <div key={tx.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[#75777e]">
                            {isTransfer ? 'sync_alt' : isIncome ? 'add_circle' : 'remove_circle'}
                          </span>
                          <div>
                            <p className="font-bold text-[#031935]">{tx.description}</p>
                            <p className="text-[10px] text-[#75777e] mt-0.5">{tx.date} • {tx.category}</p>
                          </div>
                        </div>
                        <span className={`font-bold font-mono ${isIncome ? 'text-[#006a62]' : 'text-[#031935]'}`}>
                          {isIncome ? '+' : '-'} {formatAmount(tx.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        );
      })()}

      <AnimatePresence>
        {accountToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-[#ebeef0]"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-50 text-[#ba1a1a] rounded-xl flex-shrink-0">
                  <span className="material-symbols-outlined text-[24px]">warning</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#031935]">¿Confirmar eliminación?</h3>
                  <p className="text-xs text-[#44474d] mt-2 font-sans leading-relaxed">
                    Estás a punto de eliminar la cuenta <strong className="text-[#031935]">"{accountToDelete.name}"</strong>.
                  </p>
                  <p className="text-xs text-[#75777e] mt-2 leading-relaxed font-sans">
                    <strong>¡Advertencia importante!</strong> Al borrar esta cuenta, todas las transacciones históricas asociadas a ella también podrían verse afectadas o perder su vinculación. Esta acción es irreversible.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6 justify-end">
                <button
                  onClick={() => setAccountToDelete(null)}
                  className="px-4 py-2 border border-[#c4c6ce] text-xs font-bold rounded-xl text-[#031935] hover:bg-[#f1f4f6] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const nextActiveId = accounts.find(a => a.id !== accountToDelete.id)?.id || '';
                    onDeleteAccount(accountToDelete.id);
                    setSelectedAccountId(nextActiveId);
                    setAccountToDelete(null);
                  }}
                  className="px-4 py-2 bg-[#ba1a1a] text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all shadow-sm active:scale-95"
                >
                  Eliminar definitivamente
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
