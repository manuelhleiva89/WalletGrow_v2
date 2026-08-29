/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Goal, Account, Transaction } from '../types';

const formatDateDisplay = (dateStr?: string) => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const mIdx = parseInt(month, 10) - 1;
    return `${parseInt(day, 10)} ${months[mIdx] || ''} ${year}`;
  }
  return dateStr;
};

interface MetasProps {
  goals: Goal[];
  accounts: Account[];
  onAddGoal: (goal: Omit<Goal, 'id'>) => void;
  onUpdateGoalProgress: (id: string, newAmount: number, sourceAccountId: string) => void;
  onDeleteGoal: (id: string) => void;
  onUpdateGoal: (goal: Goal) => void;
  currencySymbol: string;
  formatAmount: (amount: number) => string;
}

export default function Metas({
  goals,
  accounts,
  onAddGoal,
  onUpdateGoalProgress,
  onDeleteGoal,
  onUpdateGoal,
  currencySymbol,
  formatAmount,
}: MetasProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeFundingGoalId, setActiveFundingGoalId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  
  // Funding transaction states
  const [fundingAmount, setFundingAmount] = useState('');
  const [fundingSourceAccId, setFundingSourceAccId] = useState(accounts[0]?.id || '');

  // Form states
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('0');
  const [goalAccount, setGoalAccount] = useState(accounts[2]?.id || accounts[0]?.id || '');
  const [goalDeadline, setGoalDeadline] = useState('');

  const checkingAccounts = accounts.filter(acc => acc.type !== 'credit');

  const handleStartEdit = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setGoalName(goal.name);
    setGoalTarget(goal.targetAmount.toString());
    setGoalCurrent(goal.currentAmount.toString());
    setGoalAccount(goal.accountId);
    setGoalDeadline(goal.deadline || '');
    setShowAddForm(true);
    
    // Scroll smoothly to top form
    const container = document.getElementById('metas_tab');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelForm = () => {
    setGoalName('');
    setGoalTarget('');
    setGoalCurrent('0');
    setGoalDeadline('');
    setEditingGoalId(null);
    setShowAddForm(false);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim() || !goalTarget) return;

    if (editingGoalId) {
      onUpdateGoal({
        id: editingGoalId,
        name: goalName,
        targetAmount: parseFloat(goalTarget),
        currentAmount: parseFloat(goalCurrent) || 0,
        accountId: goalAccount,
        deadline: goalDeadline || undefined,
      });
    } else {
      onAddGoal({
        name: goalName,
        targetAmount: parseFloat(goalTarget),
        currentAmount: parseFloat(goalCurrent) || 0,
        accountId: goalAccount,
        deadline: goalDeadline || undefined,
      });
    }

    handleCancelForm();
  };

  const handleFundGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFundingGoalId || !fundingAmount) return;

    const amountNum = parseFloat(fundingAmount);
    if (amountNum <= 0) {
      alert('Por favor introduce un monto mayor a cero.');
      return;
    }

    const goal = goals.find(g => g.id === activeFundingGoalId);
    if (!goal) return;

    const sourceAcc = accounts.find(a => a.id === fundingSourceAccId);
    if (sourceAcc && sourceAcc.balance < amountNum) {
      alert(`No hay fondos suficientes en ${sourceAcc.name.split(' (')[0]}.`);
      return;
    }

    const newAmount = goal.currentAmount + amountNum;
    onUpdateGoalProgress(activeFundingGoalId, newAmount, fundingSourceAccId);

    setFundingAmount('');
    setActiveFundingGoalId(null);
    alert(`¡Se han aportado ${formatAmount(amountNum)} con éxito a la meta "${goal.name}"!`);
  };

  return (
    <div id="metas_tab" className="space-y-6 pt-4">
      
      {/* Cabecera */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#031935] tracking-tight">Metas Financieras</h1>
          <p className="text-xs text-[#44474d] mt-1">Sigue tu progreso de ahorro e incrementa tus objetivos paso a paso.</p>
        </div>
        <button 
          onClick={() => {
            if (showAddForm) {
              handleCancelForm();
            } else {
              setShowAddForm(true);
            }
          }}
          className="bg-[#1b2e4b] hover:bg-[#031935] text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">
            {showAddForm ? 'close' : 'add'}
          </span>
          {editingGoalId ? "Cancelar Edición" : "Nueva Meta"}
        </button>
      </header>

      {/* Formulario de Nueva Meta */}
      <AnimatePresence>
        {showAddForm && (
          <motion.section 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-[#c4c6ce] rounded-xl p-6 shadow-sm overflow-hidden"
          >
            <h3 className="text-sm font-bold text-[#031935] uppercase tracking-wide mb-4">
              {editingGoalId ? "Editar Meta de Ahorro" : "Crear Meta de Ahorro"}
            </h3>
            <form onSubmit={handleCreateGoal} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#44474d] uppercase">Nombre del Objetivo</label>
                <input 
                  type="text" 
                  value={goalName} 
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="ej. Fondo Emergencia, Laptop, Casa"
                  required
                  className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#44474d] uppercase">Monto de la Meta ($)</label>
                <input 
                  type="number" 
                  value={goalTarget} 
                  onChange={(e) => setGoalTarget(e.target.value)}
                  placeholder="ej. 10000"
                  required
                  className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] font-mono outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#44474d] uppercase">Monto Inicial Ahorrado ($)</label>
                <input 
                  type="number" 
                  value={goalCurrent} 
                  onChange={(e) => setGoalCurrent(e.target.value)}
                  placeholder="0"
                  className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] font-mono outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#44474d] uppercase">Vincular a Cuenta de Fondos</label>
                <select 
                  value={goalAccount} 
                  onChange={(e) => setGoalAccount(e.target.value)}
                  className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#44474d] uppercase">Fecha Límite (Opcional)</label>
                <input 
                  type="date" 
                  value={goalDeadline} 
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] font-mono outline-none"
                />
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
                  {editingGoalId ? "Guardar Cambios" : "Guardar Objetivo"}
                </button>
              </div>

            </form>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Grid de Metas */}
      <div id="goals_grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {goals.map((goal) => {
          const percentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
          const isCircular = goal.id === 'goal-1'; // Emergency Fund circular progressing card style
          const isDoubleSpan = goal.id === 'goal-3'; // Auto nuevo bottom card style

          const associatedAccount = accounts.find(a => a.id === goal.accountId);

          return (
            <div 
              key={goal.id} 
              className={`bg-white border border-[#c4c6ce] rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group ${isDoubleSpan ? 'md:col-span-2' : ''}`}
            >
              
              {/* Blur de fondo estético */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#84f5e8]/10 rounded-bl-full pointer-events-none filter blur-xl"></div>

              {/* Encabezado de Tarjeta */}
              <div className="flex justify-between items-start mb-4 z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined p-1 rounded-md text-[20px] text-[#006a62] bg-[#006a62]/10">
                      savings
                    </span>
                    <h3 className="text-sm font-bold text-[#031935]">{goal.name}</h3>
                  </div>
                  <p className="text-[10px] text-[#75777e] font-sans">
                    Cuenta: {associatedAccount ? associatedAccount.name.split(' (')[0] : 'Por asignar'}
                  </p>
                </div>
                
                {goal.deadline && (
                  <span className="bg-[#f1f4f6] text-[#44474d] text-[9px] font-bold px-2 py-1 rounded">
                    {formatDateDisplay(goal.deadline)}
                  </span>
                )}
              </div>

              {/* Cuerpo del progreso - Estilo Circular o Lineal */}
              {isCircular ? (
                <div className="flex items-center gap-6 mt-4 z-10">
                  {/* Circular SVG Ring */}
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle className="text-slate-100 stroke-current" cx="50" cy="50" fill="transparent" r="40" strokeWidth="8"></circle>
                      <circle 
                        className="text-[#006a62] stroke-current progress-ring__circle transition-all duration-300" 
                        cx="50" 
                        cy="50" 
                        fill="transparent" 
                        r="40" 
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * percentage) / 100}
                        strokeLinecap="round"
                      ></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-bold text-[#031935] font-mono">{percentage}%</span>
                    </div>
                  </div>

                  <div className="flex-grow">
                    <p className="text-[10px] text-[#75777e] uppercase font-bold tracking-wide mb-0.5">Monto Aportado</p>
                    <p className="text-2xl font-bold text-[#031935] font-mono leading-none mb-2">{formatAmount(goal.currentAmount)}</p>
                    <p className="text-[10px] font-semibold text-[#75777e] border-t border-[#ebeef0] pt-1.5 font-mono">
                      Meta Total: {formatAmount(goal.targetAmount)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="z-10 mt-2 space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-[#75777e] uppercase font-bold tracking-wide">Actual</p>
                      <p className="text-base font-bold text-[#031935] font-mono leading-none mt-1">{formatAmount(goal.currentAmount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#75777e] uppercase font-bold tracking-wide">Meta</p>
                      <p className="text-xs font-bold text-[#031935] font-mono leading-none mt-1">{formatAmount(goal.targetAmount)}</p>
                    </div>
                  </div>

                  {/* Barra Lineal */}
                  <div className="w-full bg-[#f1f4f6] rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-[#006a62] h-full rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[10px] font-bold text-[#006a62] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">trending_up</span>
                      En camino
                    </p>
                    <span className="text-xs font-bold text-[#006a62] font-mono">{percentage}% completado</span>
                  </div>
                </div>
              )}

              {/* Botones de acción rápidos de la Meta */}
              <div className="mt-5 pt-3 border-t border-[#ebeef0] flex justify-between items-center z-10">
                <div className="flex gap-1">
                  {/* Editar Meta */}
                  <button 
                    onClick={() => handleStartEdit(goal)}
                    className="p-1.5 text-[#006a62] hover:bg-[#006a62]/10 rounded-lg transition-colors flex items-center justify-center"
                    title="Editar Meta"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>

                  {/* Borrar Meta */}
                  <button 
                    onClick={() => {
                      setGoalToDelete(goal);
                    }}
                    className="p-1.5 text-[#ba1a1a] hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                    title="Eliminar Meta"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>

                {/* Aportar Fondos */}
                <button 
                  onClick={() => setActiveFundingGoalId(goal.id)}
                  className="px-3.5 py-1.5 bg-[#1b2e4b]/10 hover:bg-[#1b2e4b] hover:text-white text-[#1b2e4b] text-[11px] font-bold rounded-lg transition-all active:scale-95"
                >
                  Aportar Fondos
                </button>
              </div>

            </div>
          );
        })}

      </div>

      {/* Formulario Modal Inline de Aportar Fondos */}
      <AnimatePresence>
        {activeFundingGoalId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white border border-[#c4c6ce] rounded-xl p-6 shadow-xl max-w-sm w-full space-y-4"
            >
              <h3 className="text-sm font-bold text-[#031935] uppercase tracking-wide">Aportar Fondos a la Meta</h3>
              <p className="text-xs text-[#44474d]">
                Deduce fondos de tu cuenta corriente y asígnalos al saldo acumulado de esta meta.
              </p>

              <form onSubmit={handleFundGoalSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#44474d] uppercase">Monto a Aportar ($)</label>
                  <input 
                    type="number" 
                    value={fundingAmount}
                    onChange={(e) => setFundingAmount(e.target.value)}
                    required
                    placeholder="ej. 500"
                    className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none font-mono transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#44474d] uppercase">Cuenta de Origen</label>
                  <select 
                    value={fundingSourceAccId}
                    onChange={(e) => setFundingSourceAccId(e.target.value)}
                    className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none cursor-pointer"
                  >
                    {checkingAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name.split(' (')[0]} ({formatAmount(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#ebeef0]">
                  <button 
                    type="button" 
                    onClick={() => setActiveFundingGoalId(null)}
                    className="px-4 py-2 border border-[#c4c6ce] text-xs font-bold rounded-lg text-[#031935]"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-[#006a62] text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all"
                  >
                    Asignar Fondos
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {goalToDelete && (
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
                    Estás a punto de eliminar la meta de ahorro <strong className="text-[#031935]">"{goalToDelete.name}"</strong> con objetivo de <strong className="text-[#031935]">{formatAmount(goalToDelete.targetAmount)}</strong>.
                  </p>
                  <p className="text-xs text-[#75777e] mt-2 leading-relaxed font-sans">
                    Al borrar esta meta, se perderá el seguimiento de su avance acumulado. Esta acción es definitiva.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6 justify-end">
                <button
                  onClick={() => setGoalToDelete(null)}
                  className="px-4 py-2 border border-[#c4c6ce] text-xs font-bold rounded-xl text-[#031935] hover:bg-[#f1f4f6] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDeleteGoal(goalToDelete.id);
                    if (editingGoalId === goalToDelete.id) {
                      handleCancelForm();
                    }
                    setGoalToDelete(null);
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
