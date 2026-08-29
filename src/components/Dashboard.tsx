/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Account, Transaction, Goal, CryptoAsset, FixedTermInvestment, Category } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import FinancialReportModal from './FinancialReportModal';

interface DashboardProps {
  accounts: Account[];
  transactions: Transaction[];
  goals: Goal[];
  cryptoAssets?: CryptoAsset[];
  fixedTermInvestments?: FixedTermInvestment[];
  categories?: Category[];
  onOpenTransactionModal: (type: 'income' | 'expense' | 'transfer') => void;
  onNavigateToTab: (tabId: string) => void;
  currencySymbol: string;
  formatAmount: (amount: number) => string;
}

export default function Dashboard({
  accounts,
  transactions,
  goals,
  cryptoAssets = [],
  fixedTermInvestments = [],
  categories = [],
  onOpenTransactionModal,
  onNavigateToTab,
  currencySymbol,
  formatAmount,
}: DashboardProps) {
  const [chartView, setChartView] = useState<'monthly' | 'weekly'>('monthly');
  const [hoveredBar, setHoveredBar] = useState<{ index: number; type: 'income' | 'expense' } | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [expenseMonthFilter, setExpenseMonthFilter] = useState<string>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch("https://api.coincap.io/v2/assets?limit=100");
        if (response.ok) {
          const json = await response.json();
          if (json && Array.isArray(json.data)) {
            const tempPrices: Record<string, number> = {};
            json.data.forEach((item: any) => {
              if (item.symbol && item.priceUsd) {
                tempPrices[item.symbol.toUpperCase()] = parseFloat(item.priceUsd);
              }
            });
            setLivePrices(tempPrices);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch prices on dashboard", e);
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  // Carousel layout states and variables
  const [activeSlide, setActiveSlide] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward (right), -1 = backward (left)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('Para instalar, abre el menú de opciones de tu navegador (los tres puntos en Chrome o el botón Compartir en Safari) y selecciona "Agregar a la pantalla de inicio" o "Instalar aplicación".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handlePrev = () => {
    setDirection(-1);
    setActiveSlide((prev) => (prev === 0 ? 4 : prev - 1));
  };

  const handleNext = () => {
    setDirection(1);
    setActiveSlide((prev) => (prev === 4 ? 0 : prev + 1));
  };

  // 1. Filter expense transactions dynamically based on selected month filter
  const expenseTransactions = transactions.filter(tx => {
    if (tx.type !== 'expense') return false;
    if (expenseMonthFilter === 'all') return true;
    return tx.date.startsWith(`2026-${expenseMonthFilter}`);
  });

  // 2. Aggregate expenses by category
  const categoryTotalsMap: { [key: string]: number } = {};
  expenseTransactions.forEach(tx => {
    categoryTotalsMap[tx.category] = (categoryTotalsMap[tx.category] || 0) + tx.amount;
  });

  // 3. Map to array format for Recharts
  const expenseCategoryData = Object.entries(categoryTotalsMap)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  // Use real-time system expense data with no mock fallbacks
  const displayCategoryData = expenseCategoryData;

  const totalExpenseSum = displayCategoryData.reduce((sum, item) => sum + item.value, 0);

  // Color mapping matching Tailwind-ish or premium financial theme dynamically looking up the categories array
  const getCategoryTheme = (name: string) => {
    const cat = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    
    let icon = 'receipt_long';
    let color = '#95a5a6'; // Gray default
    let bgClass = 'bg-slate-100 text-slate-700';

    if (cat) {
      icon = cat.icon || 'receipt_long';
      bgClass = cat.color || 'bg-slate-100 text-slate-700';
      
      const colorStr = cat.color.toLowerCase();
      if (colorStr.includes('amber')) color = '#e59866';
      else if (colorStr.includes('blue')) color = '#5dade2';
      else if (colorStr.includes('purple')) color = '#9b59b6';
      else if (colorStr.includes('rose')) color = '#f36a8a';
      else if (colorStr.includes('teal')) color = '#16a085';
      else if (colorStr.includes('emerald')) color = '#2ecc71';
      else if (colorStr.includes('green')) color = '#2ecc71';
      else if (colorStr.includes('indigo')) color = '#5b5ea6';
      else if (colorStr.includes('cyan')) color = '#15b097';
      else if (colorStr.includes('pink')) color = '#df73ff';
      else if (colorStr.includes('orange')) color = '#ff9f43';
      else if (colorStr.includes('red')) color = '#ee5253';
      else if (colorStr.includes('violet')) color = '#8c7ae6';
      else if (colorStr.includes('yellow')) color = '#fbc531';
    } else {
      switch (name) {
        case 'Alimentación':
          color = '#e59866'; icon = 'restaurant'; break;
        case 'Transporte':
          color = '#5dade2'; icon = 'directions_car'; break;
        case 'Vivienda':
          color = '#9b59b6'; icon = 'home'; break;
        case 'Ocio':
          color = '#f36a8a'; icon = 'sports_esports'; break;
        case 'Salud':
          color = '#16a085'; icon = 'health_and_safety'; break;
        case 'Salario':
          color = '#2ecc71'; icon = 'payments'; break;
        case 'Inversiones':
          color = '#5b5ea6'; icon = 'trending_up'; break;
        case 'Venta / Negocio':
          color = '#15b097'; icon = 'storefront'; break;
        case 'Otros Ingresos':
          color = '#df73ff'; icon = 'add_card'; break;
      }
    }

    return { color, icon, bgClass };
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 120 : -120,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 120 : -120,
      opacity: 0,
    }),
  };

  // Calculate Net Worth: sum checking + savings + cash - credit debts
  const totalAssets = accounts
    .filter(acc => acc.type !== 'credit')
    .reduce((sum, acc) => sum + acc.balance, 0);
  
  const totalDebts = accounts
    .filter(acc => acc.type === 'credit')
    .reduce((sum, acc) => sum + acc.balance, 0);

  const netBalance = totalAssets - totalDebts;

  // Calculate current month's flow (August 2026)
  const currentMonthIncome = transactions
    .filter(tx => tx.type === 'income' && tx.date.startsWith('2026-08'))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const currentMonthExpense = transactions
    .filter(tx => tx.type === 'expense' && tx.date.startsWith('2026-08'))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const currentMonthNetFlow = currentMonthIncome - currentMonthExpense;
  const hasCurrentMonthData = transactions.some(tx => tx.date.startsWith('2026-08') && (tx.type === 'income' || tx.type === 'expense'));

  // Calculate percentage of change relative to the starting balance of the month
  const startingBalance = netBalance - currentMonthNetFlow;
  let netWorthPctChange = 0;
  if (hasCurrentMonthData) {
    if (startingBalance !== 0) {
      netWorthPctChange = (currentMonthNetFlow / Math.abs(startingBalance)) * 100;
    } else {
      netWorthPctChange = netBalance !== 0 ? (currentMonthNetFlow / Math.abs(netBalance)) * 100 : 0;
    }
  }

  let nwBadgeBg = "bg-slate-500/25 text-slate-300";
  let nwBadgeIcon = "remove";
  let nwBadgeLabel = "Sin datos este mes";

  if (hasCurrentMonthData) {
    if (currentMonthNetFlow > 0) {
      nwBadgeBg = "bg-[#006a62]/30 text-[#84f5e8]";
      nwBadgeIcon = "trending_up";
      nwBadgeLabel = `+${netWorthPctChange.toFixed(1)}% este mes`;
    } else if (currentMonthNetFlow < 0) {
      nwBadgeBg = "bg-[#ba1a1a]/30 text-[#ffb4ab]";
      nwBadgeIcon = "trending_down";
      nwBadgeLabel = `${netWorthPctChange.toFixed(1)}% este mes`;
    } else {
      nwBadgeBg = "bg-slate-500/25 text-slate-300";
      nwBadgeIcon = "trending_flat";
      nwBadgeLabel = "Sin variaciones";
    }
  } else {
    nwBadgeBg = "bg-slate-500/25 text-slate-300";
    nwBadgeIcon = "remove";
    nwBadgeLabel = "Sin datos";
  }

  // Credit card limit metrics
  const creditCards = accounts.filter(acc => acc.type === 'credit');
  const totalCreditLimit = creditCards.reduce((sum, cc) => sum + (cc.limit || 0), 0);
  const totalCreditUsed = creditCards.reduce((sum, cc) => sum + cc.balance, 0);
  const totalCreditAvailable = totalCreditLimit - totalCreditUsed;
  const currentMonthCreditSpending = transactions
    .filter(tx => tx.type === 'expense' && tx.accountId === 'acc-2' && tx.date.startsWith('2026-08'))
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Dynamic Charting calculations:
  // Let's map Apr, May, Jun, Jul, Aug dynamically!
  const monthsToSummarize = ['04', '05', '06', '07', '08']; // Apr, May, Jun, Jul, Aug
  const monthNames = ['Abr', 'May', 'Jun', 'Jul', 'Ago'];
  
  const dynamicMonthlyData = monthsToSummarize.map((mCode, idx) => {
    const monthPrefix = `2026-${mCode}`;
    const income = transactions
      .filter(tx => tx.type === 'income' && tx.date.startsWith(monthPrefix))
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = transactions
      .filter(tx => tx.type === 'expense' && tx.date.startsWith(monthPrefix))
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      name: monthNames[idx],
      income,
      expense,
    };
  });

  const getDayOfWeek = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDay(); // 0 = Sun, 1 = Mon, etc.
  };

  const daysMapping = [1, 2, 3, 4, 5, 6, 0]; // Monday to Sunday
  const daysLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const dynamicWeeklyData = daysMapping.map((dayNum, idx) => {
    const income = transactions
      .filter(tx => {
        const txDay = getDayOfWeek(tx.date);
        // Current week of August 2026: 2026-08-03 to 2026-08-09
        return tx.type === 'income' && txDay === dayNum && tx.date >= '2026-08-03' && tx.date <= '2026-08-09';
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expense = transactions
      .filter(tx => {
        const txDay = getDayOfWeek(tx.date);
        return tx.type === 'expense' && txDay === dayNum && tx.date >= '2026-08-03' && tx.date <= '2026-08-09';
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      name: daysLabels[idx],
      income,
      expense,
    };
  });

  const activeChartData = chartView === 'monthly' ? dynamicMonthlyData : dynamicWeeklyData;

  // Max value in chart data to scale heights (percentage)
  const maxVal = Math.max(...activeChartData.map(d => Math.max(d.income, d.expense)), 1000);

  const hasChartData = activeChartData.some(d => d.income > 0 || d.expense > 0);

  // Real-time Investment calculations from system database
  const totalCryptoValue = cryptoAssets.reduce((sum, asset) => {
    const currentPrice = livePrices[asset.symbol.toUpperCase()] || asset.purchasePrice || (asset.valueUsd / asset.amount) || 0;
    return sum + (asset.amount * currentPrice);
  }, 0);

  const totalFixedTermValue = fixedTermInvestments.reduce((sum, inv) => sum + inv.amount, 0);

  const investmentAccounts = accounts.filter(acc => 
    acc.type === 'savings' && 
    (acc.name.toLowerCase().includes('inversión') || acc.name.toLowerCase().includes('acciones') || acc.name.toLowerCase().includes('inversiones'))
  );
  const totalStocksValue = investmentAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  const totalInvestments = totalCryptoValue + totalFixedTermValue + totalStocksValue;
  
  const totalCryptoInvested = cryptoAssets.reduce((sum, asset) => sum + (asset.amount * (asset.purchasePrice || 0)), 0);
  const totalInvested = totalCryptoInvested + totalFixedTermValue + totalStocksValue;
  
  const diffInvestments = totalInvestments - totalInvested;
  const percentageChange = totalInvested > 0 ? (diffInvestments / totalInvested) * 100 : 0;

  // Render content of specific Carousel Slides
  const renderSlideContent = (slideIndex: number) => {
    switch (slideIndex) {
      case 0:
        return (
          <div className="flex flex-col justify-between h-full min-h-[380px]">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#031935] tracking-tight">Ingresos vs Gastos</h3>
                  <p className="text-xs text-[#44474d]">Análisis visual de balances</p>
                </div>
                <div className="flex bg-[#f1f4f6] rounded-lg p-1 text-xs">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setChartView('monthly'); }}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all ${chartView === 'monthly' ? 'bg-white text-[#031935] shadow-sm' : 'text-[#44474d] hover:bg-[#e5e9eb]'}`}
                  >
                    Mensual
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setChartView('weekly'); }}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all ${chartView === 'weekly' ? 'bg-white text-[#031935] shadow-sm' : 'text-[#44474d] hover:bg-[#e5e9eb]'}`}
                  >
                    Semanal
                  </button>
                </div>
              </div>

              {/* Área de gráfico SVG/Tailwind interactivo o Estado Vacío */}
              {!hasChartData ? (
                <div className="flex flex-col items-center justify-center py-12 text-center w-full min-h-[208px]">
                  <span className="material-symbols-outlined text-[#75777e] text-4xl mb-2">bar_chart</span>
                  <p className="text-sm font-semibold text-[#031935]">No hay registros para graficar</p>
                  <p className="text-xs text-[#75777e] mt-1 max-w-sm px-4">
                    Registra transacciones de ingresos o gastos para ver la distribución en la gráfica de balance.
                  </p>
                </div>
              ) : (
                <div className="h-52 relative border-b border-l border-[#c4c6ce] flex items-end justify-between px-2 pb-2 chart-area rounded-lg overflow-visible">
                  {activeChartData.map((data, idx) => {
                    const incPct = (data.income / maxVal) * 100;
                    const expPct = (data.expense / maxVal) * 100;

                    return (
                      <div key={idx} className="flex-1 flex flex-col justify-end items-center h-full relative group">
                        {/* Barras de datos */}
                        <div className="flex items-end gap-1 sm:gap-2 h-[85%] w-full justify-center">
                          {/* Barra de Ingreso */}
                          <div className="relative w-3.5 sm:w-5 group/bar flex flex-col justify-end h-full">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${incPct}%` }}
                              transition={{ duration: 0.5, delay: idx * 0.05 }}
                              onMouseEnter={() => setHoveredBar({ index: idx, type: 'income' })}
                              onMouseLeave={() => setHoveredBar(null)}
                              className={`w-full bg-[#006a62] rounded-t-sm transition-all duration-150 cursor-pointer ${hoveredBar?.index === idx && hoveredBar?.type === 'income' ? 'brightness-125 saturate-110 shadow-sm' : 'brightness-100'}`}
                            />
                            {/* Tooltip flotante */}
                            {hoveredBar?.index === idx && hoveredBar?.type === 'income' && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-30 bg-[#031935] text-white text-[10px] py-1 px-1.5 rounded shadow-lg whitespace-nowrap font-mono pointer-events-none">
                                +{formatAmount(data.income)}
                              </div>
                            )}
                          </div>

                          {/* Barra de Gasto */}
                          <div className="relative w-3.5 sm:w-5 group/bar flex flex-col justify-end h-full">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${expPct}%` }}
                              transition={{ duration: 0.5, delay: idx * 0.05 + 0.02 }}
                              onMouseEnter={() => setHoveredBar({ index: idx, type: 'expense' })}
                              onMouseLeave={() => setHoveredBar(null)}
                              className={`w-full bg-[#e0e3e5] dark:bg-[#c4c6ce] rounded-t-sm transition-all duration-150 cursor-pointer ${hoveredBar?.index === idx && hoveredBar?.type === 'expense' ? 'bg-[#75777e] brightness-90 shadow-sm' : ''}`}
                            />
                            {/* Tooltip flotante */}
                            {hoveredBar?.index === idx && hoveredBar?.type === 'expense' && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-30 bg-[#031935] text-white text-[10px] py-1 px-1.5 rounded shadow-lg whitespace-nowrap font-mono pointer-events-none">
                                -{formatAmount(data.expense)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Etiqueta del Eje X */}
                        <span className="text-[10px] font-bold text-[#44474d] mt-2 absolute -bottom-5">
                          {data.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Leyendas */}
            <div className="flex justify-between items-center mt-8 pt-4 border-t border-[#ebeef0]">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-xs text-[#44474d]">
                  <div className="w-3 h-3 rounded-full bg-[#006a62]"></div>
                  <span>Ingresos</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#44474d]">
                  <div className="w-3 h-3 rounded-full bg-[#e0e3e5] border border-[#c4c6ce]"></div>
                  <span>Gastos</span>
                </div>
              </div>
              <p className="text-[10px] font-semibold text-[#75777e] italic hidden sm:block">Vista interactiva</p>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col justify-between h-full min-h-[380px]">
            <div>
              <div className="flex justify-between items-start sm:items-center gap-2 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#031935] tracking-tight">Distribución de Gastos</h3>
                  <p className="text-xs text-[#44474d]">Análisis de gastos distribuidos por categorías</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={expenseMonthFilter}
                    onChange={(e) => { e.stopPropagation(); setExpenseMonthFilter(e.target.value); }}
                    className="bg-[#f1f4f6] text-xs font-bold text-[#031935] border border-[#c4c6ce] rounded-lg py-1.5 px-2.5 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Todos los meses</option>
                    <option value="08">Agosto 2026</option>
                    <option value="07">Julio 2026</option>
                    <option value="06">Junio 2026</option>
                    <option value="05">Mayo 2026</option>
                    <option value="04">Abril 2026</option>
                  </select>
                  <span className="material-symbols-outlined text-[#75777e] bg-[#f1f4f6] p-2 rounded-xl hidden sm:inline-block">pie_chart</span>
                </div>
              </div>

              {displayCategoryData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center w-full">
                  <span className="material-symbols-outlined text-[#75777e] text-4xl mb-2">info</span>
                  <p className="text-sm font-semibold text-[#031935]">No hay gastos registrados</p>
                  <p className="text-xs text-[#75777e] mt-1">No hay gastos para el período seleccionado.</p>
                </div>
              ) : (
                /* Grid split-view on larger screens, stacks on mobile */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* Left Side: Pie Donut Chart */}
                  <div className="relative w-full h-52 flex items-center justify-center bg-white rounded-xl">
                    <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none z-10">
                      <span className="text-[10px] uppercase font-bold text-[#75777e] tracking-wider leading-none font-sans">Total Gastos</span>
                      <span className="text-lg font-extrabold text-[#031935] font-mono mt-1">{formatAmount(totalExpenseSum)}</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={displayCategoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {displayCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getCategoryTheme(entry.name).color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatAmount(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Right Side: Legend & Details List */}
                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                    {displayCategoryData.map((entry, index) => {
                      const theme = getCategoryTheme(entry.name);
                      const percentage = Math.round((entry.value / totalExpenseSum) * 100);
                      return (
                        <div 
                          key={index} 
                          className="flex justify-between items-center py-2 px-3 border border-[#ebeef0] rounded-xl bg-white"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: theme.color }}
                            />
                            <span className="material-symbols-outlined text-[16px] text-[#75777e]">
                              {theme.icon}
                            </span>
                            <span className="text-xs font-bold text-[#031935] truncate">
                              {entry.name}
                            </span>
                          </div>
                          <div className="text-right font-mono text-xs flex-shrink-0 pl-2">
                            <span className="font-bold text-[#031935]">{formatAmount(entry.value)}</span>
                            <span className="text-[10px] text-[#75777e] font-semibold ml-2">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col justify-between h-full min-h-[380px]">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#031935] tracking-tight">Disponibilidad de Crédito</h3>
                  <p className="text-xs text-[#44474d]">Límites y saldos en tus tarjetas</p>
                </div>
                <span className="material-symbols-outlined text-[#75777e] bg-[#f1f4f6] p-2 rounded-xl">credit_card</span>
              </div>
              <div className="bg-[#f1f4f6] p-4 rounded-xl mb-5">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-[#031935]">Disponible Total</span>
                  <span className="text-xs font-bold text-[#031935] font-mono">{formatAmount(totalCreditAvailable)}</span>
                </div>
                <div className="w-full bg-[#e5e9eb] rounded-full h-2">
                  <div 
                    className="bg-[#006a62] h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${totalCreditLimit > 0 ? (totalCreditAvailable / totalCreditLimit) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-[#c4c6ce]/30">
                  <span className="text-[10px] text-[#44474d] font-sans">Gastos del mes (TDC)</span>
                  <span className="text-xs font-bold text-[#031935] font-mono">{formatAmount(currentMonthCreditSpending)}</span>
                </div>
              </div>

              <div className="space-y-3">
                {creditCards.map(cc => {
                  const limit = cc.limit || 1;
                  const usedPct = Math.round((cc.balance / limit) * 100);

                  return (
                    <div key={cc.id} className="flex justify-between items-center py-1.5 border-b border-[#ebeef0] last:border-0">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[#031935]">{cc.name.split(' (')[0]}</span>
                        <span className="text-[10px] text-[#75777e] font-mono">...{cc.cardNumber?.slice(-4)}</span>
                      </div>
                      <div className="text-right font-mono text-xs">
                        <span className="font-bold text-[#031935]">{formatAmount(cc.balance)}</span>
                        <span className="block text-[10px] text-amber-700 font-semibold">{usedPct}% usado</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case 3:
        const activeInvestmentsList = [
          ...investmentAccounts.map(acc => ({
            id: acc.id,
            name: acc.name,
            type: 'Acciones y Fondos',
            subtext: `Cuenta • ${acc.bankName || 'Inversión'}`,
            icon: 'monitoring',
            iconColor: 'text-[#006a62] bg-[#006a62]/10',
            value: acc.balance,
            changeText: '+12%',
            changeColor: 'text-[#006a62]',
          })),
          ...fixedTermInvestments.map(inv => ({
            id: inv.id,
            name: inv.name || 'Plazo Fijo',
            type: 'Plazo Fijo',
            subtext: `Banco • ${inv.bank || 'Plazo Fijo'} (Vence ${inv.dueDate})`,
            icon: 'account_balance',
            iconColor: 'text-[#cca830] bg-[#cca830]/10',
            value: inv.amount,
            changeText: `${inv.annualRate}% TNA`,
            changeColor: 'text-[#006a62]',
          })),
          ...cryptoAssets.filter(asset => asset.amount > 0).map(asset => {
            const currentPrice = livePrices[asset.symbol.toUpperCase()] || asset.purchasePrice || (asset.valueUsd / asset.amount) || 0;
            const currentValue = asset.amount * currentPrice;
            const purchasePriceVal = asset.purchasePrice || 0;
            const totalCost = asset.amount * purchasePriceVal;
            const cryptoDiff = currentValue - totalCost;
            const cryptoPct = totalCost > 0 ? (cryptoDiff / totalCost) * 100 : 0;
            return {
              id: asset.id,
              name: `${asset.name} (${asset.symbol})`,
              type: 'Criptomoneda',
              subtext: `Crypto • ${asset.amount} ${asset.symbol} a ${formatAmount(currentPrice)}`,
              icon: 'currency_bitcoin',
              iconColor: 'text-[#ba1a1a] bg-[#ba1a1a]/10',
              value: currentValue,
              changeText: `${cryptoPct >= 0 ? '+' : ''}${cryptoPct.toFixed(1)}%`,
              changeColor: cryptoDiff >= 0 ? 'text-[#006a62]' : 'text-[#ba1a1a]',
            };
          })
        ].sort((a, b) => b.value - a.value);

        return (
          <div className="flex flex-col justify-between h-full min-h-[380px]">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#031935] tracking-tight">Inversiones</h3>
                  <p className="text-xs text-[#44474d]">Distribución de activos y rendimiento acumulado</p>
                </div>
                <span className="material-symbols-outlined text-[#75777e] bg-[#f1f4f6] p-2 rounded-xl">show_chart</span>
              </div>
              <div className="mb-6">
                <p className="text-3xl font-extrabold text-[#031935] font-mono">{formatAmount(totalInvestments)}</p>
                {totalInvested === 0 ? (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg mt-1.5 bg-[#75777e]/10 text-[#75777e]">
                    <span className="material-symbols-outlined text-[14px]">remove</span>
                    <span className="text-[10px] font-bold font-mono">
                      No calculable (Sin datos)
                    </span>
                  </div>
                ) : diffInvestments >= 0 ? (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg mt-1.5 bg-[#006a62]/10 text-[#006a62]">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                    <span className="text-[10px] font-bold font-mono">
                      +{percentageChange.toFixed(1)}% total
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg mt-1.5 bg-[#ba1a1a]/10 text-[#ba1a1a]">
                    <span className="material-symbols-outlined text-[14px]">trending_down</span>
                    <span className="text-[10px] font-bold font-mono">
                      {percentageChange.toFixed(1)}% total
                    </span>
                  </div>
                )}
              </div>

              {activeInvestmentsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 border border-dashed border-[#ebeef0] rounded-xl">
                  <span className="material-symbols-outlined text-[#75777e] text-4xl mb-2">trending_flat</span>
                  <p className="text-sm font-semibold text-[#031935]">No tienes inversiones activas</p>
                  <p className="text-xs text-[#75777e] mt-1">Registra nuevos plazos fijos o criptoactivos en el menú de Inversiones.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1 scrollbar-thin">
                  {activeInvestmentsList.map((item, index) => (
                    <div key={item.id || index} className="flex justify-between items-center py-1.5 border-b border-[#ebeef0] last:border-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.iconColor}`}>
                          <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-[#031935] truncate">{item.name}</span>
                          <span className="block text-[9px] text-[#75777e] truncate font-semibold">{item.subtext}</span>
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs flex-shrink-0 pl-2">
                        <span className="block font-bold text-[#031935]">{formatAmount(item.value)}</span>
                        <span className={`block text-[9px] font-bold ${item.changeColor}`}>{item.changeText}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col justify-between h-full min-h-[380px]">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#031935] tracking-tight">Progreso Metas</h3>
                  <p className="text-xs text-[#44474d]">Tus objetivos de ahorro y su nivel de avance</p>
                </div>
                <span className="material-symbols-outlined text-[#75777e] bg-[#f1f4f6] p-2 rounded-xl">track_changes</span>
              </div>
              <div className="space-y-5">
                {goals.map((goal) => {
                  const percentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
                  const colorClass = goal.id === 'goal-2' ? 'bg-[#cca830]' : 'bg-[#006a62]';

                  return (
                    <div key={goal.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-[#031935]">
                          {goal.name}
                        </span>
                        <span className="text-xs font-bold text-[#031935] font-mono">{percentage}%</span>
                      </div>
                      <div className="w-full bg-[#f1f4f6] rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${colorClass}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-[#44474d] mt-1 font-mono">
                        {formatAmount(goal.currentAmount)} / {formatAmount(goal.targetAmount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div id="dashboard_tab" className="space-y-6 pt-4">
      
      {/* Sección Balance Principal */}
      <section id="net_worth_card" className="gradient-card rounded-xl p-6 text-white shadow-[0_4px_12px_rgba(27,46,75,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <p className="text-xs font-medium text-white/80 tracking-wide uppercase font-sans">
          Balance Neto Total
        </p>
        <h1 id="net_worth_value" className="text-3xl md:text-4xl font-bold mt-2 font-mono tracking-tight">
          {formatAmount(netBalance)}
        </h1>
        <div className="flex items-center gap-3 mt-4">
          <div className={`${nwBadgeBg} px-3 py-1 rounded-full flex items-center gap-1`}>
            <span className="material-symbols-outlined text-[16px] fill">{nwBadgeIcon}</span>
            <span className="text-xs font-bold font-mono">{nwBadgeLabel}</span>
          </div>
          <span className="text-xs text-white/75 font-sans">Actualizado en tiempo real</span>
        </div>
      </section>

      {/* Botones de Acción Rápida */}
      <section id="quick_actions" className="grid grid-cols-2 gap-4">
        {/* Botón Único de Registro (Gasto, Ingreso o Transferencia) */}
        <button 
          onClick={() => onOpenTransactionModal('expense')}
          className="w-full flex flex-col sm:flex-row items-center justify-center bg-white border border-[#c4c6ce] rounded-xl p-4 sm:p-5 shadow-sm hover:bg-[#006a62]/5 active:scale-[0.98] transition-all group text-center sm:text-left focus:outline-none"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#006a62]/10 flex items-center justify-center text-[#006a62] sm:mr-4 mb-2 sm:mb-0 group-hover:scale-105 transition-transform flex-shrink-0">
            <span className="material-symbols-outlined font-bold text-[20px] sm:text-[24px]">payments</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="block text-xs sm:text-sm font-bold text-[#031935] truncate">Registrar Movimiento</span>
            <span className="hidden sm:block text-[11px] text-[#75777e] font-medium mt-0.5 line-clamp-2">Ingresos, gastos o transferencias</span>
          </div>
        </button>

        {/* Botón de Informes */}
        <button 
          onClick={() => setIsReportModalOpen(true)}
          className="w-full flex flex-col sm:flex-row items-center justify-center bg-white border border-[#c4c6ce] rounded-xl p-4 sm:p-5 shadow-sm hover:bg-[#cca830]/5 active:scale-[0.98] transition-all group text-center sm:text-left focus:outline-none"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#cca830]/10 flex items-center justify-center text-[#cca830] sm:mr-4 mb-2 sm:mb-0 group-hover:scale-105 transition-transform flex-shrink-0">
            <span className="material-symbols-outlined font-bold text-[20px] sm:text-[24px]">bar_chart</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="block text-xs sm:text-sm font-bold text-[#031935] truncate">Ver Informes</span>
            <span className="hidden sm:block text-[11px] text-[#75777e] font-medium mt-0.5 line-clamp-2">Métricas, gráficos y balances</span>
          </div>
        </button>
      </section>

      {/* Carrusel Unificado de Reportes y Analíticas */}
      <section id="bento_reports_carousel" className="relative w-full max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 px-1">
          <div>
            <h2 className="text-lg font-bold text-[#031935] tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006a62] font-semibold">analytics</span>
              Métricas e Informes
            </h2>
            <p className="text-xs text-[#75777e]">Desplázate hacia los lados para explorar todos tus módulos</p>
          </div>
        </div>

        {/* Carousel slide box with navigation buttons */}
        <div className="relative flex items-center justify-between group/carousel">
          {/* Navigation Control - Prev Button */}
          <button
            onClick={handlePrev}
            className="absolute left-[-16px] md:left-[-24px] z-20 w-10 h-10 rounded-full bg-white border border-[#c4c6ce] shadow-md flex items-center justify-center text-[#031935] hover:bg-[#f1f4f6] active:scale-90 transition-all focus:outline-none opacity-0 group-hover/carousel:opacity-100 md:opacity-100 cursor-pointer"
            aria-label="Slide anterior"
          >
            <span className="material-symbols-outlined font-bold text-[20px]">chevron_left</span>
          </button>

          {/* Interactive Slide Viewer Window */}
          <div className="w-full overflow-hidden bg-white border border-[#c4c6ce] rounded-2xl shadow-sm min-h-[460px] p-6 flex flex-col justify-between">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={activeSlide}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 320, damping: 28 },
                  opacity: { duration: 0.18 }
                }}
                className="w-full h-full flex-1 flex flex-col justify-between"
              >
                {renderSlideContent(activeSlide)}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Control - Next Button */}
          <button
            onClick={handleNext}
            className="absolute right-[-16px] md:right-[-24px] z-20 w-10 h-10 rounded-full bg-white border border-[#c4c6ce] shadow-md flex items-center justify-center text-[#031935] hover:bg-[#f1f4f6] active:scale-90 transition-all focus:outline-none opacity-0 group-hover/carousel:opacity-100 md:opacity-100 cursor-pointer"
            aria-label="Siguiente slide"
          >
            <span className="material-symbols-outlined font-bold text-[20px]">chevron_right</span>
          </button>
        </div>

        {/* Dot indicators beneath the slide frame */}
        <div className="flex justify-center items-center gap-3.5 mt-5">
          {[0, 1, 2, 3, 4].map((idx) => {
            const isActive = activeSlide === idx;
            return (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > activeSlide ? 1 : -1);
                  setActiveSlide(idx);
                }}
                className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none cursor-pointer ${
                  isActive ? 'w-8 bg-[#1b2e4b]' : 'w-2.5 bg-[#c4c6ce] hover:bg-[#75777e]'
                }`}
                aria-label={`Ir al panel ${idx + 1}`}
                title={['Flujo de Caja', 'Distribución por Categorías', 'Disponibilidad de Crédito', 'Inversiones', 'Progreso de Metas'][idx]}
              />
            );
          })}
        </div>
      </section>

      <FinancialReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        accounts={accounts}
        transactions={transactions}
        goals={goals}
        cryptoAssets={cryptoAssets}
        fixedTermInvestments={fixedTermInvestments}
        categories={categories}
        currencySymbol={currencySymbol}
        formatAmount={formatAmount}
      />

    </div>
  );
}
