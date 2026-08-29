/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, Account, Category } from '../types';

interface MovimientosProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onOpenTransactionModal: (type: 'income' | 'expense' | 'transfer') => void;
  onDeleteTransaction: (id: string) => void;
  currencySymbol: string;
  formatAmount: (amount: number) => string;
}

export default function Movimientos({
  transactions,
  accounts,
  categories,
  onOpenTransactionModal,
  onDeleteTransaction,
  currencySymbol,
  formatAmount,
}: MovimientosProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Helper to format date strings to beautiful Spanish text
  const formatDateHeader = (dateStr: string) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) {
      return 'Hoy, ' + formatDateFriendly(dateStr);
    } else if (dateStr === yesterdayStr) {
      return 'Ayer, ' + formatDateFriendly(dateStr);
    } else {
      return formatDateFriendly(dateStr);
    }
  };

  const formatDateFriendly = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    return `${day} de ${monthNames[monthIndex]} ${year}`;
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    // Search query filter
    const matchesSearch = 
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.notes && tx.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    // Category filter
    const matchesCategory = selectedCategory === 'all' || tx.category === selectedCategory;

    // Account filter
    const matchesAccount = 
      selectedAccount === 'all' || 
      tx.accountId === selectedAccount || 
      tx.toAccountId === selectedAccount;

    // Type filter
    const matchesType = selectedType === 'all' || tx.type === selectedType;

    return matchesSearch && matchesCategory && matchesAccount && matchesType;
  });

  // Sort: most recent first, then highest ID
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateComp = b.date.localeCompare(a.date);
    if (dateComp !== 0) return dateComp;
    return b.id.localeCompare(a.id);
  });

  // Group by date
  const groupedTransactions: { [key: string]: Transaction[] } = {};
  sortedTransactions.forEach(tx => {
    if (!groupedTransactions[tx.date]) {
      groupedTransactions[tx.date] = [];
    }
    groupedTransactions[tx.date].push(tx);
  });

  // Unique dates list
  const transactionDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  // Get Account name by ID
  const getAccountName = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    return acc ? acc.name.split(' (')[0] : 'Cuenta';
  };

  // Get Category icon and colors
  const getCategoryMeta = (catName: string) => {
    const cat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    if (cat) return cat;
    
    // Fallback configurations
    return {
      id: 'fallback',
      name: catName,
      icon: 'receipt_long',
      color: 'bg-slate-100 text-slate-700'
    };
  };

  return (
    <div id="movimientos_tab" className="space-y-6 pt-4">
      
      {/* Cabecera de Página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#031935] tracking-tight">Movimientos</h1>
          <p className="text-xs text-[#44474d] mt-1">Revisa, busca y edita tus transacciones recientes.</p>
        </div>
        <button 
          onClick={() => onOpenTransactionModal('expense')}
          className="bg-[#1b2e4b] hover:bg-[#031935] text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nuevo Movimiento
        </button>
      </div>

      {/* Buscador e Interfaces de Filtro (Bento Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Barra de Búsqueda */}
        <div className="col-span-1 lg:col-span-5 bg-white rounded-xl border border-[#c4c6ce] p-4 shadow-sm">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#75777e] select-none pointer-events-none">search</span>
            <input 
              type="text" 
              placeholder="Buscar movimientos, categorías..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-lg bg-[#f1f4f6] border border-transparent focus:border-[#006a62] focus:bg-white focus:ring-0 transition-colors text-sm text-[#031935] outline-none placeholder:text-[#75777e]"
            />
          </div>
        </div>

        {/* Panel de Filtros rápidos */}
        <div className="col-span-1 lg:col-span-7 bg-white rounded-xl border border-[#c4c6ce] p-4 flex flex-wrap sm:flex-nowrap gap-2 sm:gap-2.5 shadow-sm items-center">
          
          {/* Selector de Categoría */}
          <div className="flex-1 sm:flex-initial min-w-[105px] relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full appearance-none bg-white border border-[#c4c6ce] hover:bg-[#f1f4f6] rounded-full pl-3 pr-8 py-1.5 text-xs font-semibold text-[#031935] focus:outline-none focus:border-[#006a62] cursor-pointer"
            >
              <option value="all">📁 Categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[16px] absolute right-2.5 top-1/2 -translate-y-1/2 text-[#75777e] pointer-events-none select-none">expand_more</span>
          </div>

          {/* Selector de Cuenta */}
          <div className="flex-1 sm:flex-initial min-w-[105px] relative">
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full appearance-none bg-white border border-[#c4c6ce] hover:bg-[#f1f4f6] rounded-full pl-3 pr-8 py-1.5 text-xs font-semibold text-[#031935] focus:outline-none focus:border-[#006a62] cursor-pointer"
            >
              <option value="all">💳 Cuentas</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name.split(' (')[0]}</option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[16px] absolute right-2.5 top-1/2 -translate-y-1/2 text-[#75777e] pointer-events-none select-none">expand_more</span>
          </div>

          {/* Selector de Tipo */}
          <div className="flex-1 sm:flex-initial min-w-[105px] relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full appearance-none bg-white border border-[#c4c6ce] hover:bg-[#f1f4f6] rounded-full pl-3 pr-8 py-1.5 text-xs font-semibold text-[#031935] focus:outline-none focus:border-[#006a62] cursor-pointer"
            >
              <option value="all">📊 Tipo</option>
              <option value="income">Ingresos (+)</option>
              <option value="expense">Gastos (-)</option>
              <option value="transfer">Transferencias</option>
            </select>
            <span className="material-symbols-outlined text-[16px] absolute right-2.5 top-1/2 -translate-y-1/2 text-[#75777e] pointer-events-none select-none">expand_more</span>
          </div>

          {/* Botón Borrar Filtros */}
          {(selectedCategory !== 'all' || selectedAccount !== 'all' || selectedType !== 'all' || searchQuery) && (
            <button 
              onClick={() => {
                setSelectedCategory('all');
                setSelectedAccount('all');
                setSelectedType('all');
                setSearchQuery('');
              }}
              className="flex-shrink-0 px-2.5 py-1 text-xs font-bold text-[#ba1a1a] hover:bg-red-50 rounded-full transition-colors flex items-center gap-1 ml-auto"
              title="Borrar Filtros"
            >
              <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
              <span className="text-[10px] sm:text-[11px]">Limpiar</span>
            </button>
          )}

        </div>
      </div>

      {/* Lista de Transacciones agrupadas */}
      <div className="bg-white rounded-xl border border-[#c4c6ce] shadow-sm overflow-hidden">
        {transactionDates.length === 0 ? (
          <div className="p-12 text-center text-[#75777e]">
            <span className="material-symbols-outlined text-[48px] text-[#c4c6ce] mb-3">receipt_long</span>
            <p className="text-sm font-semibold">No se encontraron movimientos.</p>
            <p className="text-xs mt-1">Prueba a cambiar los filtros o a registrar una nueva transacción.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#ebeef0]">
            {transactionDates.map(dateStr => (
              <div key={dateStr} className="flex flex-col">
                
                {/* Cabecera de Fecha */}
                <div className="px-5 py-3 bg-[#f1f4f6] border-y border-[#c4c6ce]/30 flex justify-between items-center">
                  <span className="text-[11px] font-bold text-[#44474d] uppercase tracking-wide">
                    {formatDateHeader(dateStr)}
                  </span>
                  <span className="text-[10px] font-mono text-[#75777e]">
                    {groupedTransactions[dateStr].length} {groupedTransactions[dateStr].length === 1 ? 'transacción' : 'transacciones'}
                  </span>
                </div>

                {/* Transacciones de esta fecha */}
                <div className="divide-y divide-[#ebeef0]/60">
                  {groupedTransactions[dateStr].map(tx => {
                    const catMeta = getCategoryMeta(tx.category);
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';

                    return (
                      <div 
                        key={tx.id} 
                        className="px-5 py-4 flex items-center justify-between hover:bg-[#f1f4f6]/50 transition-colors group relative"
                      >
                        <div className="flex items-center gap-4">
                          
                          {/* Icono de Categoría */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${catMeta.color} shadow-sm flex-shrink-0`}>
                            <span className="material-symbols-outlined text-[20px]">
                              {isTransfer ? 'sync_alt' : catMeta.icon}
                            </span>
                          </div>

                          {/* Detalles del movimiento */}
                          <div>
                            <h3 className="text-sm font-bold text-[#031935] leading-none">
                              {tx.description}
                            </h3>
                            <p className="text-xs text-[#44474d] mt-1.5 flex flex-wrap gap-x-1.5 items-center">
                              <span className="font-semibold text-[#006a62]">
                                {getAccountName(tx.accountId)}
                              </span>
                              {isTransfer && (
                                <>
                                  <span className="material-symbols-outlined text-[10px] text-[#75777e]">arrow_forward</span>
                                  <span className="font-semibold text-[#1b2e4b]">
                                    {getAccountName(tx.toAccountId || '')}
                                  </span>
                                </>
                              )}
                              <span className="text-[#75777e]">•</span>
                              <span className="text-[#44474d]">{tx.category}</span>
                            </p>
                            {tx.notes && (
                              <p className="text-[10px] text-[#75777e] mt-1 italic font-sans">
                                "{tx.notes}"
                              </p>
                            )}
                          </div>

                        </div>

                        {/* Monto y Botón Eliminar */}
                        <div className="text-right flex items-center gap-4">
                          <span className={`text-sm font-bold font-mono ${isIncome ? 'text-[#006a62]' : isTransfer ? 'text-[#1b2e4b]' : 'text-[#031935]'}`}>
                            {isIncome ? '+ ' : isTransfer ? '⇅ ' : '- '}
                            {formatAmount(tx.amount)}
                          </span>

                          {/* Botón de Borrar (visible al hacer hover) */}
                          <button 
                            onClick={() => {
                              setTxToDelete(tx);
                            }}
                            className="p-1.5 text-xs text-[#ba1a1a] hover:bg-red-50 rounded-full md:opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none transition-all"
                            title="Eliminar Transacción"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {txToDelete && (
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
                    Estás a punto de eliminar el movimiento <strong className="text-[#031935]">"{txToDelete.description}"</strong> de <strong className="text-[#031935]">{formatAmount(txToDelete.amount)}</strong>.
                  </p>
                  <p className="text-xs text-[#75777e] mt-2 leading-relaxed font-sans">
                    Esta acción es irreversible y recalculará automáticamente el balance actual de tu cuenta.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6 justify-end">
                <button
                  onClick={() => setTxToDelete(null)}
                  className="px-4 py-2 border border-[#c4c6ce] text-xs font-bold rounded-xl text-[#031935] hover:bg-[#f1f4f6] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDeleteTransaction(txToDelete.id);
                    setTxToDelete(null);
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
