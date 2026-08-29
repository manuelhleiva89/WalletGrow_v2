/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Account, Category, Transaction } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'income' | 'expense' | 'transfer';
  accounts: Account[];
  categories: Category[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  currencySymbol: string;
}

export default function TransactionModal({
  isOpen,
  onClose,
  defaultType = 'expense',
  accounts,
  categories,
  onAddTransaction,
  currencySymbol,
}: TransactionModalProps) {
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(defaultType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  // Update default states when open triggers
  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setDescription('');
      setAmount('');
      setNotes('');
      
      // Defaults
      setDate(new Date().toISOString().split('T')[0]);
      
      // Default accounts
      const checkAcc = accounts.find(a => a.type === 'checking');
      const creditAcc = accounts.find(a => a.type === 'credit');
      
      if (defaultType === 'income') {
        setAccountId(checkAcc?.id || accounts[0]?.id || '');
        const filteredCats = categories.filter(cat => cat.type === 'income' || cat.type === 'both');
        const defaultCat = filteredCats[0]?.name || 'Salario';
        setCategory(defaultCat);
      } else if (defaultType === 'expense') {
        setAccountId(creditAcc?.id || checkAcc?.id || accounts[0]?.id || '');
        const filteredCats = categories.filter(cat => cat.type === 'expense' || cat.type === 'both' || cat.type === undefined);
        const defaultCat = filteredCats[0]?.name || 'Alimentación';
        setCategory(defaultCat);
      } else {
        setAccountId(checkAcc?.id || accounts[0]?.id || '');
        setToAccountId(creditAcc?.id || accounts[1]?.id || '');
        setCategory('Vivienda');
      }
    }
  }, [isOpen, defaultType, accounts, categories]);

  // Handle changing types dynamically inside modal
  const handleTypeChange = (newType: 'income' | 'expense' | 'transfer') => {
    setType(newType);
    if (newType === 'income') {
      const filteredCats = categories.filter(cat => cat.type === 'income' || cat.type === 'both');
      const defaultCat = filteredCats[0]?.name || 'Salario';
      setCategory(defaultCat);
    } else if (newType === 'expense') {
      const filteredCats = categories.filter(cat => cat.type === 'expense' || cat.type === 'both' || cat.type === undefined);
      const defaultCat = filteredCats[0]?.name || 'Alimentación';
      setCategory(defaultCat);
    } else {
      setCategory('Vivienda');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    
    if (!description.trim()) {
      alert('Por favor escribe una descripción.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Introduce un monto mayor a cero.');
      return;
    }
    if (!accountId) {
      alert('Por favor selecciona una cuenta.');
      return;
    }
    if (type === 'transfer' && accountId === toAccountId) {
      alert('La cuenta de origen y destino no pueden ser la misma.');
      return;
    }

    onAddTransaction({
      description,
      amount: amountNum,
      type,
      category,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      date: date || new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="tx_modal_overlay" className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-[#c4c6ce] rounded-xl p-6 shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Cabecera */}
            <div className="flex justify-between items-center pb-3 border-b border-[#ebeef0] mb-4">
              <h3 className="text-base font-bold text-[#031935] uppercase tracking-wide">
                Registrar Movimiento
              </h3>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f1f4f6] text-[#75777e]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Selector de Tipo (Income/Expense/Transfer) */}
            <div className="flex bg-[#f1f4f6] rounded-lg p-1 text-xs mb-5 font-semibold">
              <button 
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex-1 py-2 rounded-md transition-all ${type === 'expense' ? 'bg-[#ba1a1a] text-white shadow-sm' : 'text-[#44474d] hover:bg-[#e5e9eb]'}`}
              >
                Gasto (-)
              </button>
              <button 
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex-1 py-2 rounded-md transition-all ${type === 'income' ? 'bg-[#006a62] text-white shadow-sm' : 'text-[#44474d] hover:bg-[#e5e9eb]'}`}
              >
                Ingreso (+)
              </button>
              <button 
                type="button"
                onClick={() => handleTypeChange('transfer')}
                className={`flex-1 py-2 rounded-md transition-all ${type === 'transfer' ? 'bg-[#1b2e4b] text-white shadow-sm' : 'text-[#44474d] hover:bg-[#e5e9eb]'}`}
              >
                Transferir ⇅
              </button>
            </div>

            {accounts.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs flex items-start gap-3 mb-4">
                <span className="material-symbols-outlined text-amber-700 text-lg">warning</span>
                <div>
                  <p className="font-bold">No tienes cuentas vinculadas</p>
                  <p className="mt-1 text-amber-800">
                    Debes tener al menos una cuenta corriente, de ahorro, tarjeta o efectivo en el sistema para poder registrar movimientos. Por favor ve a la pestaña de <strong>Cuentas</strong> para agregar una.
                  </p>
                </div>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 hide-scrollbar">
              
              {/* Descripción */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Concepto / Descripción</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ej. Compra semanal, Transferencia, Pago Luz"
                  required
                  className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none transition-colors"
                />
              </div>

              {/* Monto y Fecha */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Monto ({currencySymbol})</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] font-mono outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Fecha</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] font-mono outline-none"
                  />
                </div>
              </div>

              {/* Cuenta de Origen y Cuenta de Destino (Solo si es transferencia) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">
                    {type === 'transfer' ? 'Cuenta de Origen' : 'Cuenta vinculada'}
                  </label>
                  <select 
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none cursor-pointer"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name.split(' (')[0]} ({currencySymbol}{acc.balance})
                      </option>
                    ))}
                  </select>
                </div>

                {type === 'transfer' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Cuenta de Destino</label>
                    <select 
                      value={toAccountId}
                      onChange={(e) => setToAccountId(e.target.value)}
                      className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none cursor-pointer"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name.split(' (')[0]} ({currencySymbol}{acc.balance})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Categoría (Oculto si es transferencia) */}
                {type !== 'transfer' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">
                      {type === 'income' ? 'Categoría de ingreso' : 'Categoría de gasto'}
                    </label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="h-11 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none cursor-pointer"
                    >
                      {categories
                        .filter(cat => {
                          if (type === 'income') {
                            return cat.type === 'income' || cat.type === 'both';
                          } else {
                            return cat.type === 'expense' || cat.type === 'both' || cat.type === undefined;
                          }
                        })
                        .map(cat => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Notas Adicionales */}
              <div className="flex flex-col gap-1.5 pt-1">
                <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Notas / Comentario (Opcional)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Añade detalles sobre la compra..."
                  rows={2}
                  className="p-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none resize-none"
                />
              </div>

              {/* Botonera */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#ebeef0] mt-6">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="px-4 py-2 border border-[#c4c6ce] text-xs font-bold rounded-lg text-[#031935] hover:bg-[#f1f4f6]"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={accounts.length === 0}
                  className={`px-5 py-2 text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all ${
                    accounts.length === 0 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : type === 'income' ? 'bg-[#006a62] hover:bg-[#005049]' : type === 'expense' ? 'bg-[#ba1a1a] hover:bg-red-800' : 'bg-[#1b2e4b] hover:bg-[#031935]'
                  }`}
                >
                  Guardar Movimiento
                </button>
              </div>

            </form>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
