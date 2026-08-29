import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Subscription, Account, Transaction } from '../types';

interface PagosProps {
  subscriptions: Subscription[];
  accounts: Account[];
  onAddSubscription: (sub: Omit<Subscription, 'id'>) => void;
  onDeleteSubscription: (id: string) => void;
  onUpdateSubscription: (sub: Subscription) => void;
  onUpdateAccount: (acc: Account) => void;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  currencySymbol: string;
  formatAmount: (amount: number) => string;
}

export default function Pagos({
  subscriptions,
  accounts,
  onAddSubscription,
  onDeleteSubscription,
  onUpdateSubscription,
  onUpdateAccount,
  onAddTransaction,
  currencySymbol,
  formatAmount,
}: PagosProps) {
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [subToDelete, setSubToDelete] = useState<Subscription | null>(null);

  // Form states for Add/Edit
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subCycle, setSubCycle] = useState<string>('Mensual');
  const [customCycleText, setCustomCycleText] = useState('');
  const [subDate, setSubDate] = useState('');
  const [subCategory, setSubCategory] = useState('Ocio');
  const [subIcon, setSubIcon] = useState('credit_card');
  const [subAccountId, setSubAccountId] = useState('');

  // AI loading state
  const [isDeducing, setIsDeducing] = useState(false);

  // Search and filter subscriptions
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCycle, setFilterCycle] = useState('all');

  // Available source accounts (Checking/Savings/Cash) for making payments
  const paymentSources = accounts.filter(a => a.type === 'checking' || a.type === 'savings' || a.type === 'cash');
  const defaultSourceAccount = paymentSources[0];

  // Credit Card confirmation modal states
  const [minPayConfirm, setMinPayConfirm] = useState<{
    card: Account;
    minPay: number;
    remainingDebt: number;
    projectedInterest: number;
    projectedDebt: number;
    selectedSourceId: string;
  } | null>(null);

  const [fullPayConfirm, setFullPayConfirm] = useState<{
    card: Account;
    amountToPay: number;
    selectedSourceId: string;
  } | null>(null);

  // Dynamically get credit cards
  const creditCards = accounts.filter(a => a.type === 'credit');

  // Trigger AI to deduce icon based on name
  const handleDeduceIcon = async (nameToDeduce: string) => {
    if (!nameToDeduce.trim()) return;
    setIsDeducing(true);
    try {
      const response = await fetch('/api/deduce-icon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceName: nameToDeduce }),
      });
      const data = await response.json();
      if (data.icon) {
        setSubIcon(data.icon);
      }
    } catch (err) {
      console.error('Error deducing icon:', err);
    } finally {
      setIsDeducing(false);
    }
  };

  // Open modals with prefilled values
  const handleOpenAddModal = () => {
    setSubName('');
    setSubAmount('');
    setSubCycle('Mensual');
    setCustomCycleText('');
    setSubDate(new Date().toISOString().split('T')[0]);
    setSubCategory('Ocio');
    setSubIcon('credit_card');
    setSubAccountId(accounts[0]?.id || '');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (sub: Subscription) => {
    setEditingSub(sub);
    setSubName(sub.name);
    setSubAmount(sub.amount.toString());
    
    const standardCycles = ['Diario', 'Semanal', 'Mensual', 'Anual'];
    if (standardCycles.includes(sub.billingCycle)) {
      setSubCycle(sub.billingCycle);
      setCustomCycleText('');
    } else {
      setSubCycle('Otros');
      setCustomCycleText(sub.billingCycle);
    }

    setSubDate(sub.nextBillingDate);
    setSubCategory(sub.category || 'Ocio');
    setSubIcon(sub.icon || 'credit_card');
    setSubAccountId(sub.accountId || accounts[0]?.id || '');
  };

  // Submit handlers
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim() || !subAmount) return;

    const finalCycle = subCycle === 'Otros' ? (customCycleText || 'Otros') : subCycle;

    onAddSubscription({
      name: subName.trim(),
      amount: parseFloat(subAmount),
      billingCycle: finalCycle,
      nextBillingDate: subDate || new Date().toISOString().split('T')[0],
      category: subCategory,
      icon: subIcon,
      accountId: subAccountId,
    });

    setShowAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub || !subName.trim() || !subAmount) return;

    const finalCycle = subCycle === 'Otros' ? (customCycleText || 'Otros') : subCycle;

    onUpdateSubscription({
      id: editingSub.id,
      name: subName.trim(),
      amount: parseFloat(subAmount),
      billingCycle: finalCycle,
      nextBillingDate: subDate || new Date().toISOString().split('T')[0],
      category: subCategory,
      icon: subIcon,
      accountId: subAccountId,
    });

    setEditingSub(null);
  };

  // Helper to advance a date based on billing cycle
  const getNextBillingDate = (currentDateStr: string, cycle: string): string => {
    const date = new Date(currentDateStr + 'T00:00:00');
    const c = cycle.toLowerCase();
    if (c.includes('diario') || c === 'daily') {
      date.setDate(date.getDate() + 1);
    } else if (c.includes('semanal') || c === 'weekly') {
      date.setDate(date.getDate() + 7);
    } else if (c.includes('mensual') || c === 'monthly') {
      date.setMonth(date.getMonth() + 1);
    } else if (c.includes('anual') || c === 'yearly' || c === 'annual') {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      // Default / "Otros" advances monthly as fallback
      date.setMonth(date.getMonth() + 1);
    }
    return date.toISOString().split('T')[0];
  };

  // Trigger payments
  const handlePaySubscription = (sub: Subscription) => {
    const sourceAcc = accounts.find(a => a.id === sub.accountId) || accounts[0];
    if (!sourceAcc) {
      alert('Por favor vincula una cuenta o tarjeta válida a este pago recurrente.');
      return;
    }

    if (sourceAcc.type !== 'credit' && sourceAcc.balance < sub.amount) {
      alert(`Saldo insuficiente en ${sourceAcc.name} (${formatAmount(sourceAcc.balance)}) para pagar ${formatAmount(sub.amount)}.`);
      return;
    }

    // 1. Add Transaction (expense)
    onAddTransaction({
      description: `Pago Recurrente: ${sub.name}`,
      amount: sub.amount,
      type: 'expense',
      category: sub.category || 'Vivienda',
      accountId: sourceAcc.id,
      date: new Date().toISOString().split('T')[0],
      notes: `Pago de ciclo ${sub.billingCycle} efectuado desde ${sourceAcc.name}.`,
    });

    // 2. Advance Subscription Next Billing Date
    const nextDate = getNextBillingDate(sub.nextBillingDate, sub.billingCycle);
    onUpdateSubscription({
      ...sub,
      nextBillingDate: nextDate,
    });

    alert(`¡Pago de ${formatAmount(sub.amount)} registrado con éxito! El próximo vencimiento se ha actualizado al ${nextDate}.`);
  };

  const handleConfirmMinPay = () => {
    if (!minPayConfirm) return;
    const { card, minPay, selectedSourceId } = minPayConfirm;
    const sourceAcc = accounts.find(a => a.id === selectedSourceId);
    if (!sourceAcc) {
      alert('Por favor selecciona una cuenta de origen válida para efectuar el pago.');
      return;
    }

    if (sourceAcc.balance < minPay) {
      alert(`Saldo insuficiente en ${sourceAcc.name} (${formatAmount(sourceAcc.balance)}) para realizar el pago de ${formatAmount(minPay)}.`);
      return;
    }

    // 1. Register transaction
    onAddTransaction({
      description: `Pago Mínimo Tarjeta ${card.name}`,
      amount: minPay,
      type: 'expense',
      category: 'Vivienda',
      accountId: sourceAcc.id,
      date: new Date().toISOString().split('T')[0],
      notes: `Pago mínimo a tarjeta ${card.cardNumber || ''}. Advertencia de interés proyectado: ${formatAmount(minPayConfirm.projectedInterest)}.`,
    });

    // 2. Adjust credit card debt (balance decreases, since balance represents the active debt on credit accounts)
    const updatedCard: Account = {
      ...card,
      balance: Math.max(0, card.balance - minPay),
    };
    onUpdateAccount(updatedCard);

    alert(`¡Se ha procesado exitosamente el pago mínimo de ${formatAmount(minPay)} para tu tarjeta ${card.name}!`);
    setMinPayConfirm(null);
  };

  const handleConfirmFullPay = () => {
    if (!fullPayConfirm) return;
    const { card, amountToPay, selectedSourceId } = fullPayConfirm;
    const sourceAcc = accounts.find(a => a.id === selectedSourceId);
    if (!sourceAcc) {
      alert('Por favor selecciona una cuenta de origen válida para efectuar el pago.');
      return;
    }

    if (sourceAcc.balance < amountToPay) {
      alert(`Saldo insuficiente en ${sourceAcc.name} (${formatAmount(sourceAcc.balance)}) para realizar el pago de ${formatAmount(amountToPay)}.`);
      return;
    }

    // 1. Register transaction
    onAddTransaction({
      description: `Pago Completo Tarjeta ${card.name}`,
      amount: amountToPay,
      type: 'expense',
      category: 'Vivienda',
      accountId: sourceAcc.id,
      date: new Date().toISOString().split('T')[0],
      notes: `Pago completo a tarjeta ${card.cardNumber || ''}.`,
    });

    // 2. Adjust credit card debt (balance decreases, since balance represents the active debt on credit accounts)
    const updatedCard: Account = {
      ...card,
      balance: 0,
    };
    onUpdateAccount(updatedCard);

    alert(`¡Se ha procesado exitosamente el pago completo de ${formatAmount(amountToPay)} para saldar tu tarjeta ${card.name}!`);
    setFullPayConfirm(null);
  };

  // Robust helper to parse different obligation date formats
  const parseObligationDate = (dateStr: string): Date => {
    if (!dateStr || dateStr === 'Pronto') {
      return new Date(); // Treat as due today
    }
    
    // 1. Check if format is YYYY-MM-DD
    const yyyymmddMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (yyyymmddMatch) {
      const [_, y, m, d] = yyyymmddMatch.map(Number);
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    }

    // 2. Check if format is DD MMM (e.g. "15 Oct", "5 Ago", "18 Aug")
    const ddMmmMatch = dateStr.match(/^(\d+)\s+([A-Za-zÁáÉéÍíÓóÚúÑñ]+)$/);
    if (ddMmmMatch) {
      const day = parseInt(ddMmmMatch[1], 10);
      const monthStr = ddMmmMatch[2].toLowerCase();
      
      const monthsMap: Record<string, number> = {
        jan: 0, ene: 0,
        feb: 1,
        mar: 2,
        apr: 3, abr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7, ago: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11, dic: 11
      };
      
      let month = 0;
      for (const key in monthsMap) {
        if (monthStr.startsWith(key)) {
          month = monthsMap[key];
          break;
        }
      }
      
      const currentYear = new Date().getFullYear();
      return new Date(currentYear, month, day, 0, 0, 0, 0);
    }
    
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }
    
    return new Date();
  };

  // Helper to calculate diff in days relative to system date
  const getDaysDifference = (dueDateStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = parseObligationDate(dueDateStr);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  // Unified Upcoming Obligations (Credit cards debt + Subscriptions due in the next 5 days or overdue)
  const upcomingObligations = [
    ...creditCards
      .filter(card => card.balance > 0)
      .map(card => {
        const minPay = Math.min(card.balance, Math.max(50, Math.round(card.balance * 0.08 * 100) / 100));
        const dueDateStr = card.dueDate || 'Pronto';
        const diffDays = getDaysDifference(dueDateStr);
        return {
          id: `cc-pay-${card.id}`,
          name: `Tarjeta: ${card.name}`,
          amount: card.balance,
          minAmount: minPay,
          dueDate: dueDateStr,
          diffDays,
          type: 'credit' as const,
          icon: 'credit_card',
          colorClass: 'bg-red-50 text-red-700 border-red-100',
          originalCard: card,
        };
      }),
    ...subscriptions.map(sub => {
      const dueDateStr = sub.nextBillingDate;
      const diffDays = getDaysDifference(dueDateStr);
      return {
        id: `sub-pay-${sub.id}`,
        name: `Suscripción: ${sub.name}`,
        amount: sub.amount,
        minAmount: sub.amount,
        dueDate: dueDateStr,
        diffDays,
        type: 'subscription' as const,
        icon: sub.icon || 'autorenew',
        colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        originalSub: sub,
      };
    })
  ]
    .filter(ob => ob.diffDays <= 5) // Only show if due in the next 5 days or overdue
    .sort((a, b) => a.diffDays - b.diffDays); // Sort by days remaining (earliest first)

  // Filter subscriptions for display
  const filteredSubs = subscriptions.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (sub.category && sub.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterCycle === 'all') return matchesSearch;
    return matchesSearch && sub.billingCycle.toLowerCase() === filterCycle.toLowerCase();
  });

  return (
    <div id="pagos_tab" className="space-y-6 pt-4">
      
      {/* Cabecera */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-[#031935] tracking-tight">Pagos Recurrentes</h2>
          <p className="text-xs text-[#44474d]">Gestiona tus suscripciones y controla los pagos de tus tarjetas de crédito de forma inteligente.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-[#006a62] hover:bg-[#005049] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Añadir Pago
        </button>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Próximos Vencimientos */}
        <section className="bg-white border border-[#c4c6ce] rounded-xl p-5 shadow-sm lg:col-span-1 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#ebeef0] pb-2">
            <div className="flex items-center gap-2 text-[#ba1a1a]">
              <span className="material-symbols-outlined fill text-[20px]">warning</span>
              <h3 className="text-sm font-bold text-[#031935]">Próximos Vencimientos</h3>
            </div>
            <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-bold font-sans">
              {upcomingObligations.length} pendientes
            </span>
          </div>

          <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
            {upcomingObligations.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#75777e]">
                <span className="material-symbols-outlined text-[32px] text-[#c4c6ce] block mb-1">check_circle</span>
                No tienes vencimientos pendientes. ¡Buen trabajo!
              </div>
            ) : (
              upcomingObligations.map((ob) => {
                const diffDays = ob.diffDays;
                let bgBorderClass = 'border-[#c4c6ce] bg-white hover:border-[#a8aab2]';
                let iconWrapperColorClass = ob.colorClass;
                let statusBadge = null;

                if (diffDays <= 0) {
                  // Overdue / Due today: Red shading
                  bgBorderClass = 'border-red-300 bg-red-50/50 hover:bg-red-50 hover:border-red-400';
                  iconWrapperColorClass = 'bg-red-100 text-red-700 border-red-200';
                  statusBadge = (
                    <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                      {diffDays === 0 ? 'Vence Hoy' : 'Vencido'}
                    </span>
                  );
                } else if (diffDays <= 2) {
                  // Due in next 2 days: Yellow shading
                  bgBorderClass = 'border-amber-300 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-400';
                  iconWrapperColorClass = 'bg-amber-100 text-amber-700 border-amber-200';
                  statusBadge = (
                    <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                      {diffDays === 1 ? 'Vence Mañana' : 'Vence en 2d'}
                    </span>
                  );
                } else {
                  // 3 to 5 days: Normal styling
                  bgBorderClass = 'border-[#c4c6ce] bg-white hover:border-[#a8aab2]';
                  iconWrapperColorClass = ob.colorClass;
                  statusBadge = (
                    <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                      En {diffDays} días
                    </span>
                  );
                }

                return (
                  <div 
                    key={ob.id} 
                    className={`border rounded-xl p-3.5 flex justify-between items-center transition-all shadow-sm ${bgBorderClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm border shrink-0 ${iconWrapperColorClass}`}>
                        <span className="material-symbols-outlined text-[18px]">{ob.icon}</span>
                      </div>
                      <div>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs font-bold text-[#031935] line-clamp-1">{ob.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {statusBadge}
                          </div>
                        </div>
                        <p className="text-[10px] text-[#44474d] font-semibold flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                          Vence: {ob.dueDate}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1.5 ml-2">
                      <p className="text-xs font-bold text-[#031935] font-mono">{formatAmount(ob.amount)}</p>
                      {ob.type === 'subscription' && ob.originalSub && (
                        <button 
                          onClick={() => handlePaySubscription(ob.originalSub)}
                          className="px-2.5 py-1 bg-[#1b2e4b] hover:bg-[#031935] text-white text-[10px] font-bold rounded-lg transition-all active:scale-95 animate-fade-in"
                        >
                          Pagar
                        </button>
                      )}
                      {ob.type === 'credit' && ob.originalCard && (
                        <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                          Tarjeta
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Tarjetas de Crédito */}
        <section className="bg-white border border-[#c4c6ce] rounded-xl p-5 shadow-sm lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#ebeef0] pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#031935] text-[20px]">credit_card</span>
              <h3 className="text-sm font-bold text-[#031935]">Gestión de Tarjetas de Crédito</h3>
            </div>
            <span className="text-[10px] text-[#75777e] font-semibold">Total Tarjetas: {creditCards.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {creditCards.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-xs text-[#75777e] border border-dashed border-[#c4c6ce] rounded-xl">
                <span className="material-symbols-outlined text-[36px] text-[#c4c6ce] block mb-2">add_card</span>
                No has agregado tarjetas de crédito aún.
                <p className="text-[11px] mt-1 text-[#75777e]">Puedes crear tarjetas de crédito desde el menú de <strong>Cuentas y tarjetas</strong>.</p>
              </div>
            ) : (
              creditCards.map((card) => {
                const minPay = Math.min(card.balance, Math.max(50, Math.round(card.balance * 0.08 * 100) / 100));
                const apr = card.apr || 18.9;
                const remainingDebt = Math.max(0, card.balance - minPay);
                const projectedInterest = Math.round(remainingDebt * (apr / 100 / 12) * 100) / 100;
                const projectedDebt = remainingDebt + projectedInterest;

                return (
                  <div key={card.id} className="border border-[#c4c6ce] rounded-xl p-4 flex flex-col justify-between bg-[#f8fafc] hover:border-[#006a62]/30 transition-all shadow-sm">
                    <div>
                      {/* Card Header visual representation */}
                      <div className="bg-gradient-to-r from-[#0d213a] to-[#1a3a60] text-white p-3 rounded-lg mb-3 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold leading-tight">{card.name}</p>
                            <p className="text-[9px] text-slate-300 font-mono mt-0.5">{card.bankName || 'Global Bank'}</p>
                          </div>
                          <span className="material-symbols-outlined text-[20px] text-slate-300">credit_card</span>
                        </div>
                        <div className="mt-4 flex justify-between items-end">
                          <p className="text-[10px] font-mono tracking-wider">{card.cardNumber || '**** **** **** 0000'}</p>
                          <div className="text-right">
                            <p className="text-[8px] text-slate-300 uppercase leading-none">Deuda</p>
                            <p className="text-xs font-bold font-mono">{formatAmount(card.balance)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Card specs */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] border-b border-[#ebeef0] pb-3 mb-3">
                        <div>
                          <span className="text-[#75777e]">Límite de crédito:</span>
                          <p className="font-bold font-mono text-[#031935]">{formatAmount(card.limit || 5000)}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[#75777e]">Tasa de Interés:</span>
                          <p className="font-bold text-[#031935]">{apr}% anual</p>
                        </div>
                      </div>

                      {/* Payment options */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center bg-white border border-[#c4c6ce] rounded-lg p-2.5 text-xs">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-[#75777e]">Pago Mínimo</span>
                            <span className="font-bold text-[#006a62] font-mono">{formatAmount(minPay)}</span>
                          </div>
                          <button
                            onClick={() => {
                              setMinPayConfirm({
                                card,
                                minPay,
                                remainingDebt,
                                projectedInterest,
                                projectedDebt,
                                selectedSourceId: defaultSourceAccount?.id || '',
                              });
                            }}
                            disabled={card.balance <= 0}
                            className="bg-white hover:bg-[#f1f4f6] text-[#031935] border border-[#c4c6ce] px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all disabled:opacity-50 active:scale-95"
                          >
                            Pagar Mínimo
                          </button>
                        </div>

                        <div className="flex justify-between items-center bg-white border border-[#c4c6ce] rounded-lg p-2.5 text-xs">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-[#75777e]">Pago Completo</span>
                            <span className="font-bold text-[#031935] font-mono">{formatAmount(card.balance)}</span>
                          </div>
                          <button
                            onClick={() => {
                              setFullPayConfirm({
                                card,
                                amountToPay: card.balance,
                                selectedSourceId: defaultSourceAccount?.id || '',
                              });
                            }}
                            disabled={card.balance <= 0}
                            className="bg-[#1b2e4b] hover:bg-[#031935] text-white px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all disabled:opacity-50 active:scale-95"
                          >
                            Pago Completo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>

      {/* List of Subscriptions and recurrent payments */}
      <section className="bg-white border border-[#c4c6ce] rounded-xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ebeef0] pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#031935] text-[22px]">autorenew</span>
            <h3 className="text-base font-bold text-[#031935]">Mis Suscripciones y Servicios</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 max-w-lg w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#75777e]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar servicio..."
                className="w-full h-9 pl-9 pr-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-xs outline-none focus:bg-white focus:border-[#006a62]"
              />
            </div>

            {/* Cycle Filter */}
            <select
              value={filterCycle}
              onChange={(e) => setFilterCycle(e.target.value)}
              className="h-9 px-2 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-xs outline-none focus:border-[#006a62] font-semibold text-[#031935]"
            >
              <option value="all">Frecuencia: Todas</option>
              <option value="Diario">Diario</option>
              <option value="Semanal">Semanal</option>
              <option value="Mensual">Mensual</option>
              <option value="Anual">Anual</option>
            </select>
          </div>
        </div>

        {/* Subscriptions Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredSubs.length === 0 ? (
            <div className="col-span-full text-center py-12 text-xs text-[#75777e]">
              <span className="material-symbols-outlined text-[36px] text-[#c4c6ce] block mb-1">sentiment_dissatisfied</span>
              No se encontraron suscripciones con los filtros actuales.
            </div>
          ) : (
            filteredSubs.map((sub) => (
              <div 
                key={sub.id}
                className="border border-[#c4c6ce] rounded-xl p-4 bg-white hover:border-[#006a62]/30 hover:shadow-md transition-all flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#f1f4f6] border border-[#ebeef0] flex items-center justify-center text-[#031935] shadow-sm font-bold text-sm">
                        <span className="material-symbols-outlined text-[22px]">{sub.icon || 'autorenew'}</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#031935] leading-snug">{sub.name}</h4>
                        <span className="text-[9px] bg-slate-100 text-[#44474d] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          {sub.category || 'Ocio'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-[#006a62] font-mono">{formatAmount(sub.amount)}</p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#ebeef0] grid grid-cols-2 gap-2 text-[10px] font-sans">
                    <div>
                      <span className="text-[#75777e] block">Frecuencia</span>
                      <strong className="text-[#031935] font-semibold">{sub.billingCycle}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[#75777e] block">Próximo cobro</span>
                      <strong className="text-[#031935] font-mono font-bold">{sub.nextBillingDate}</strong>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] text-[#44474d] flex items-center gap-1.5 bg-[#f8fafc] border border-[#ebeef0] rounded-lg p-2 mt-2">
                    <span className="material-symbols-outlined text-[15px] text-[#006a62]">account_balance_wallet</span>
                    <span className="font-semibold text-[#44474d]">Pago desde:</span>
                    <span className="text-[#031935] font-bold truncate">
                      {accounts.find(a => a.id === sub.accountId)?.name || 'Sin vincular'}
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 flex gap-2 justify-end pt-2 border-t border-[#f1f4f6]">
                  <button
                    onClick={() => handlePaySubscription(sub)}
                    className="flex-1 bg-[#f1f4f6] hover:bg-[#006a62]/10 text-[#006a62] text-[10px] font-bold py-1.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1"
                    title="Registrar pago manual hoy"
                  >
                    <span className="material-symbols-outlined text-[14px]">price_check</span>
                    Pagar Cuota
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(sub)}
                    className="p-1.5 text-[#031935] hover:bg-[#f1f4f6] rounded-lg transition-colors flex items-center justify-center border border-[#c4c6ce]"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    onClick={() => setSubToDelete(sub)}
                    className="p-1.5 text-[#ba1a1a] hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center border border-red-100"
                    title="Dar de baja / Eliminar"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Creation and Edit Modal (AnimatePresence Overlay) */}
      <AnimatePresence>
        {(showAddModal || editingSub) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#ebeef0] overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center border-b border-[#ebeef0] pb-3 mb-4">
                <h3 className="text-base font-extrabold text-[#031935]">
                  {editingSub ? 'Editar Pago Recurrente' : 'Nuevo Pago Recurrente'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingSub(null);
                  }}
                  className="p-1.5 hover:bg-[#f1f4f6] rounded-full text-[#75777e] transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={editingSub ? handleEditSubmit : handleAddSubmit} className="space-y-4">
                {/* Name & AI Deduce */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Nombre del Servicio</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={subName} 
                      onChange={(e) => setSubName(e.target.value)} 
                      onBlur={() => handleDeduceIcon(subName)}
                      placeholder="ej. Netflix, Disney+, Gimnasio, Gas Natural"
                      required
                      className="w-full h-10 pl-3 pr-10 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none transition-colors"
                    />
                    {isDeducing && (
                      <div className="absolute right-3 top-3 w-4 h-4 border-2 border-[#006a62] border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Monto / Cuota</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={subAmount} 
                    onChange={(e) => setSubAmount(e.target.value)} 
                    placeholder="ej. 12.50"
                    required
                    className="h-10 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs font-mono focus:bg-white focus:border-[#006a62] outline-none transition-colors"
                  />
                </div>

                {/* Billing Cycle Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Ciclo de Cobro</label>
                    <select 
                      value={subCycle} 
                      onChange={(e) => setSubCycle(e.target.value)}
                      className="h-10 px-2 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none"
                    >
                      <option value="Diario">Diario</option>
                      <option value="Semanal">Semanal</option>
                      <option value="Mensual">Mensual</option>
                      <option value="Anual">Anual</option>
                      <option value="Otros">Otros (especificar)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Próximo Vencimiento</label>
                    <input 
                      type="date" 
                      value={subDate} 
                      onChange={(e) => setSubDate(e.target.value)} 
                      required
                      className="h-10 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs font-mono focus:bg-white focus:border-[#006a62] outline-none"
                    />
                  </div>
                </div>

                {/* Custom billing cycle conditional input */}
                {subCycle === 'Otros' && (
                  <div className="flex flex-col gap-1 animate-fade-in">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Especificar Frecuencia</label>
                    <input
                      type="text"
                      value={customCycleText}
                      onChange={(e) => setCustomCycleText(e.target.value)}
                      placeholder="ej. Semestral, Cada 15 días, Trimestral"
                      required={subCycle === 'Otros'}
                      className="h-10 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none transition-colors"
                    />
                  </div>
                )}

                {/* Category & Associated Account/Card Selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Categoría</label>
                    <select 
                      value={subCategory} 
                      onChange={(e) => setSubCategory(e.target.value)}
                      className="h-10 px-2 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none"
                    >
                      <option value="Alimentación">Alimentación</option>
                      <option value="Transporte">Transporte</option>
                      <option value="Vivienda">Vivienda</option>
                      <option value="Ocio">Ocio</option>
                      <option value="Salud">Salud</option>
                      <option value="Otros Gastos">Otros Gastos</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Cuenta o Tarjeta</label>
                    <select 
                      value={subAccountId} 
                      onChange={(e) => setSubAccountId(e.target.value)}
                      required
                      className="h-10 px-2 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none font-semibold text-[#031935]"
                    >
                      <option value="" disabled>Selecciona cuenta</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({formatAmount(acc.balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-[#ebeef0] mt-4 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingSub(null);
                    }}
                    className="px-4 py-2 border border-[#c4c6ce] text-xs font-bold rounded-xl text-[#031935] hover:bg-[#f1f4f6]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#006a62] hover:bg-[#005049] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {subToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
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
                  <h3 className="text-base font-bold text-[#031935]">¿Confirmar baja del servicio?</h3>
                  <p className="text-xs text-[#44474d] mt-2 font-sans leading-relaxed">
                    Estás a punto de dar de baja la suscripción a <strong className="text-[#031935]">"{subToDelete.name}"</strong> de <strong className="text-[#031935]">{formatAmount(subToDelete.amount)}</strong>.
                  </p>
                  <p className="text-xs text-[#75777e] mt-2 leading-relaxed font-sans">
                    Esta acción detendrá el seguimiento de este pago recurrente y lo eliminará de tu listado definitivamente.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6 justify-end">
                <button
                  onClick={() => setSubToDelete(null)}
                  className="px-4 py-2 border border-[#c4c6ce] text-xs font-bold rounded-xl text-[#031935] hover:bg-[#f1f4f6] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDeleteSubscription(subToDelete.id);
                    setSubToDelete(null);
                  }}
                  className="px-4 py-2 bg-[#ba1a1a] text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all shadow-sm active:scale-95"
                >
                  Confirmar baja
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmación de Pago Mínimo (Efecto del Pago Mínimo) */}
      <AnimatePresence>
        {minPayConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#ebeef0]"
            >
              <div className="flex items-start gap-4 border-b border-[#ebeef0] pb-3 mb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl flex-shrink-0">
                  <span className="material-symbols-outlined text-[24px]">info</span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#031935]">Efecto del Pago Mínimo</h3>
                  <p className="text-xs text-[#75777e] mt-1">{minPayConfirm.card.name}</p>
                </div>
              </div>

              <div className="space-y-4 font-sans text-xs">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-800 space-y-2">
                  <p className="font-bold text-amber-950">Advertencia sobre intereses:</p>
                  <p className="leading-relaxed">
                    Al pagar solo el mínimo de <strong className="font-mono text-sm font-bold text-[#031935]">{formatAmount(minPayConfirm.minPay)}</strong>, mantendrás un saldo pendiente de <strong className="font-mono">{formatAmount(minPayConfirm.remainingDebt)}</strong>.
                  </p>
                  <p className="leading-relaxed border-t border-amber-200/55 pt-2 mt-2">
                    Esto generará aproximadamente <strong className="font-mono text-red-700 font-bold">+{formatAmount(minPayConfirm.projectedInterest)}</strong> en intereses cargados para el siguiente mes, proyectando un saldo deudor de <strong className="font-mono text-red-700 font-bold">{formatAmount(minPayConfirm.projectedDebt)}</strong>.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                  <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Pagar desde la Cuenta</label>
                  <select
                    value={minPayConfirm.selectedSourceId}
                    onChange={(e) => setMinPayConfirm(prev => prev ? { ...prev, selectedSourceId: e.target.value } : null)}
                    className="w-full h-10 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs font-bold text-[#031935]"
                  >
                    {paymentSources.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatAmount(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6 justify-end pt-3 border-t border-[#ebeef0]">
                <button
                  onClick={() => setMinPayConfirm(null)}
                  className="px-4 py-2 border border-[#c4c6ce] text-xs font-bold rounded-xl text-[#031935] hover:bg-[#f1f4f6] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmMinPay}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
                >
                  Confirmar Pago
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmación de Pago Completo */}
      <AnimatePresence>
        {fullPayConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#ebeef0]"
            >
              <div className="flex items-start gap-4 border-b border-[#ebeef0] pb-3 mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl flex-shrink-0">
                  <span className="material-symbols-outlined text-[24px]">task_alt</span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#031935]">Confirmar Pago Completo</h3>
                  <p className="text-xs text-[#75777e] mt-1">{fullPayConfirm.card.name}</p>
                </div>
              </div>

              <div className="space-y-4 font-sans text-xs">
                <p className="leading-relaxed text-[#44474d]">
                  Vas a realizar el pago total de <strong className="font-mono text-sm text-[#006a62] font-bold">{formatAmount(fullPayConfirm.amountToPay)}</strong> para saldar completamente la deuda de tu tarjeta. Esto evitará cargos por intereses.
                </p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Pagar desde la Cuenta</label>
                  <select
                    value={fullPayConfirm.selectedSourceId}
                    onChange={(e) => setFullPayConfirm(prev => prev ? { ...prev, selectedSourceId: e.target.value } : null)}
                    className="w-full h-10 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs font-bold text-[#031935]"
                  >
                    {paymentSources.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatAmount(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6 justify-end pt-3 border-t border-[#ebeef0]">
                <button
                  onClick={() => setFullPayConfirm(null)}
                  className="px-4 py-2 border border-[#c4c6ce] text-xs font-bold rounded-xl text-[#031935] hover:bg-[#f1f4f6] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmFullPay}
                  className="px-5 py-2 bg-[#006a62] hover:bg-[#005049] text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
                >
                  Confirmar Pago Completo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
