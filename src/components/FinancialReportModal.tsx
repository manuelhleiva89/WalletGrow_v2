import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { Account, Transaction, Goal, CryptoAsset, FixedTermInvestment, Category } from '../types';

interface FinancialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  transactions: Transaction[];
  goals: Goal[];
  cryptoAssets: CryptoAsset[];
  fixedTermInvestments: FixedTermInvestment[];
  categories: Category[];
  currencySymbol: string;
  formatAmount: (amount: number) => string;
}

interface AIReportResponse {
  healthScore: number;
  executiveSummary: string;
  accountStatusInsight: string;
  performanceInsight: string;
  expenseInsight: string;
  recommendations: string[];
}

export default function FinancialReportModal({
  isOpen,
  onClose,
  accounts,
  transactions,
  goals,
  cryptoAssets = [],
  fixedTermInvestments = [],
  categories = [],
  currencySymbol,
  formatAmount,
}: FinancialReportModalProps) {
  const [period, setPeriod] = useState<'semana' | 'mes' | 'año'>('mes');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AIReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter transactions based on selected period (week, month, year)
  const getFilteredTransactions = (selectedPeriod: 'semana' | 'mes' | 'año') => {
    const anchorDate = new Date("2026-08-09"); // Current app context local time
    const cutoff = new Date(anchorDate);
    
    if (selectedPeriod === 'semana') {
      cutoff.setDate(anchorDate.getDate() - 7);
    } else if (selectedPeriod === 'mes') {
      cutoff.setDate(anchorDate.getDate() - 30);
    } else {
      cutoff.setDate(anchorDate.getDate() - 365);
    }

    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= cutoff && tDate <= anchorDate;
    });
  };

  const filteredTxs = getFilteredTransactions(period);

  // Fetch report from our server-side API
  useEffect(() => {
    if (!isOpen) return;

    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/financial-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            period,
            accounts,
            transactions: filteredTxs,
            goals,
            investments: [...fixedTermInvestments, ...cryptoAssets],
          }),
        });

        if (!response.ok) {
          throw new Error('No se pudo generar el análisis financiero.');
        }

        const data: AIReportResponse = await response.json();
        setReport(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error de conexión con el servicio de análisis.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [isOpen, period, accounts, transactions, goals, cryptoAssets, fixedTermInvestments]);

  if (!isOpen) return null;

  // 1. Calculations for the charts & metrics
  const assetsAccounts = accounts.filter(a => a.type !== 'credit');
  const creditAccounts = accounts.filter(a => a.type === 'credit');

  const totalAssets = assetsAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalDebts = creditAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const netBalance = totalAssets - totalDebts;

  const totalIncome = filteredTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpense;

  // Investment values
  const cryptoVal = cryptoAssets.reduce((sum, c) => sum + (c.valueUsd || 0), 0);
  const fixedTermVal = fixedTermInvestments.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalInvestments = cryptoVal + fixedTermVal;

  // Balance Chart Data (Assets vs Debts)
  const balanceChartData = [
    { name: 'Efectivo/Ahorros', valor: totalAssets, fill: '#006a62' },
    { name: 'Deuda Tarjetas', valor: totalDebts, fill: '#ba1a1a' },
    { name: 'Inversiones', valor: totalInvestments, fill: '#cca830' },
  ];

  // Category Expenses Pie Chart Data
  const expensesByCategory: Record<string, number> = {};
  filteredTxs
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

  const categoryPieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  })).sort((a, b) => b.value - a.value);

  // Expense colors mapping
  const CHART_COLORS = ['#006a62', '#cca830', '#1b2e4b', '#ba1a1a', '#e06666', '#a4c2f4', '#b6d7a8', '#ffe599'];

  // Trend Chart Data (Chronological progression of income & expense)
  const sortedFilteredTxs = [...filteredTxs].sort((a, b) => a.date.localeCompare(b.date));
  const trendMap: Record<string, { ingresos: number; gastos: number }> = {};
  
  sortedFilteredTxs.forEach(t => {
    // Label depending on range
    let label = t.date;
    if (period === 'semana') {
      const dateObj = new Date(t.date);
      label = dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    } else if (period === 'año') {
      const dateObj = new Date(t.date);
      label = dateObj.toLocaleDateString('es-ES', { month: 'short' });
    } else {
      const dateObj = new Date(t.date);
      label = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }

    if (!trendMap[label]) {
      trendMap[label] = { ingresos: 0, gastos: 0 };
    }
    if (t.type === 'income') {
      trendMap[label].ingresos += t.amount;
    } else if (t.type === 'expense') {
      trendMap[label].gastos += t.amount;
    }
  });

  const trendChartData = Object.entries(trendMap).map(([name, val]) => ({
    name,
    Ingresos: val.ingresos,
    Gastos: val.gastos,
  }));

  // Score health indicator color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 border-emerald-200 bg-emerald-50';
    if (score >= 60) return 'text-[#cca830] border-amber-200 bg-amber-50';
    return 'text-red-600 border-red-200 bg-red-50';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Header de Reportes */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#1b2e4b] text-white">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-400 text-3xl">analytics</span>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Informe de Finanzas Inteligente</h2>
              <p className="text-xs text-white/70">Análisis interactivo potenciado por Inteligencia Artificial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 active:scale-95 rounded-lg transition-all focus:outline-none"
            aria-label="Cerrar informe"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Toolbar de Periodo */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl">
            {(['semana', 'mes', 'año'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all focus:outline-none ${
                  period === p
                    ? 'bg-[#1b2e4b] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#1b2e4b] hover:bg-white/50'
                }`}
              >
                {p === 'semana' ? 'Esta Semana' : p === 'mes' ? 'Este Mes' : 'Este Año'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Ingresos: <strong className="text-slate-700">{formatAmount(totalIncome)}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]"></span>
              Gastos: <strong className="text-slate-700">{formatAmount(totalExpense)}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#cca830]"></span>
              Balance Neto: <strong className={netSavings >= 0 ? 'text-[#006a62]' : 'text-red-600'}>{formatAmount(netSavings)}</strong>
            </span>
          </div>
        </div>

        {/* Workspace del Modal (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          
          {/* Fila 1: Puntuación de Salud y Resumen Ejecutivo */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Health Score Circular Dial */}
            <div className="md:col-span-4 bg-white border border-slate-150 p-5 rounded-xl shadow-xs flex flex-col items-center justify-center text-center">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Salud Financiera</h3>
              
              {loading ? (
                <div className="w-28 h-28 rounded-full border-4 border-slate-100 border-t-teal-500 animate-spin flex items-center justify-center"></div>
              ) : (
                <div className="relative flex items-center justify-center">
                  {/* SVG circular track */}
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      stroke="#f1f5f9"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      stroke={report?.healthScore && report.healthScore >= 80 ? '#10b981' : report?.healthScore && report.healthScore >= 60 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={339.292}
                      strokeDashoffset={339.292 - (339.292 * (report?.healthScore || 50)) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-slate-800 font-mono">
                      {report?.healthScore || '--'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">PUNTOS</span>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getScoreColor(report?.healthScore || 0)}`}>
                  {report?.healthScore && report.healthScore >= 80 
                    ? 'Excelente Control' 
                    : report?.healthScore && report.healthScore >= 60 
                      ? 'Salud Estable' 
                      : report?.healthScore 
                        ? 'Atención Requerida' 
                        : 'Calculando...'}
                </span>
              </div>
            </div>

            {/* AI Executive Summary Box */}
            <div className="md:col-span-8 bg-[#1b2e4b]/5 border border-[#1b2e4b]/15 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[#006a62]">insights</span>
                  <h3 className="text-sm font-extrabold text-[#1b2e4b] uppercase tracking-wider">
                    Análisis de IA en Tiempo Real
                  </h3>
                </div>
                
                {loading ? (
                  <div className="space-y-2.5 py-2">
                    <div className="h-4 bg-slate-200 rounded-sm animate-pulse w-full"></div>
                    <div className="h-4 bg-slate-200 rounded-sm animate-pulse w-[95%]"></div>
                    <div className="h-4 bg-slate-200 rounded-sm animate-pulse w-[88%]"></div>
                    <div className="h-4 bg-slate-200 rounded-sm animate-pulse w-[90%]"></div>
                  </div>
                ) : error ? (
                  <p className="text-xs text-red-600 font-semibold p-2 bg-red-50 rounded-lg">{error}</p>
                ) : (
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {report?.executiveSummary}
                  </p>
                )}
              </div>

              <div className="mt-4 text-[10px] font-semibold text-slate-400 flex items-center gap-1 select-none">
                <span className="material-symbols-outlined text-[12px] text-emerald-500 fill">verified</span>
                <span>Procesado utilizando gemini-3.6-flash sobre transacciones reales de {period === 'semana' ? 'esta semana' : period === 'mes' ? 'este mes' : 'este año'}</span>
              </div>
            </div>

          </div>

          {/* Fila 2: Gráficas de Estado de Cuentas y Rendimiento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Balance Card status chart */}
            <div className="bg-white border border-slate-150 p-5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Distribución de Saldos</h4>
                  <p className="text-[10px] text-slate-400">Relación de liquidez, deudas e inversiones</p>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-xl">account_balance_wallet</span>
              </div>
              
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={balanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(value: number) => [formatAmount(value), 'Valor']} 
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                    />
                    <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                      {balanceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                <p className="text-[11px] text-slate-600 italic">
                  <strong>Estado de Cuentas:</strong> {loading ? 'Cargando análisis...' : report?.accountStatusInsight}
                </p>
              </div>
            </div>

            {/* Expenses breakdown chart */}
            <div className="bg-white border border-slate-150 p-5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Estructura de Gastos</h4>
                  <p className="text-[10px] text-slate-400">Distribución porcentual por categorías</p>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-xl">pie_chart</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center h-56">
                {categoryPieData.length === 0 ? (
                  <div className="sm:col-span-12 flex flex-col items-center justify-center text-center h-full text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-1">payments</span>
                    <p className="text-xs font-semibold">Sin gastos en este período</p>
                  </div>
                ) : (
                  <>
                    <div className="sm:col-span-6 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {categoryPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [formatAmount(value), 'Gastos']}
                            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="sm:col-span-6 space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                      {categoryPieData.slice(0, 5).map((item, index) => {
                        const percent = ((item.value / totalExpense) * 100).toFixed(0);
                        return (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 font-medium text-slate-600 truncate max-w-[110px]">
                              <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                              {item.name}
                            </span>
                            <span className="font-mono font-bold text-slate-800">
                              {percent}% ({formatAmount(item.value)})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                <p className="text-[11px] text-slate-600 italic">
                  <strong>Análisis de Gastos:</strong> {loading ? 'Cargando análisis...' : report?.expenseInsight}
                </p>
              </div>
            </div>

          </div>

          {/* Fila 3: Evolución Temporal y Rendimiento */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Trend Area Chart (Income vs Expense) */}
            <div className="lg:col-span-8 bg-white border border-slate-150 p-5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Evolución de Flujos</h4>
                  <p className="text-[10px] text-slate-400">Ingresos vs Gastos en el eje temporal del periodo</p>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-xl">timeline</span>
              </div>

              <div className="h-64">
                {trendChartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center h-full text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-1">show_chart</span>
                    <p className="text-xs font-semibold">Sin registros cronológicos suficientes</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 500, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        formatter={(value: number) => [formatAmount(value), '']}
                        contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                      <Area type="monotone" dataKey="Ingresos" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIngresos)" />
                      <Area type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGastos)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Performance and Investments Box */}
            <div className="lg:col-span-4 bg-white border border-slate-150 p-5 rounded-xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-800">Rendimiento de Activos</h4>
                  <span className="material-symbols-outlined text-[#cca830] text-xl">trending_up</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Plazos Fijos</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{formatAmount(fixedTermVal)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Criptoactivos</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{formatAmount(cryptoVal)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Inversión Total</span>
                    <span className="text-xs font-mono font-bold text-[#cca830]">{formatAmount(totalInvestments)}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-[#cca830]/5 border border-[#cca830]/15 rounded-xl">
                  <p className="text-[11px] text-amber-900 leading-relaxed italic">
                    {loading ? 'Analizando carteras...' : report?.performanceInsight}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Total Metas Activas</span>
                <span className="font-mono font-bold text-[#1b2e4b] bg-slate-100 px-2 py-0.5 rounded-md">{goals.length} objetivos</span>
              </div>
            </div>

          </div>

          {/* Fila 4: Recomendaciones Concretas de la IA */}
          <div className="bg-[#1b2e4b] text-white p-5 rounded-2xl shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#84f5e8] text-2xl">magic_button</span>
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#84f5e8]">
                Recomendaciones Clave de la IA
              </h4>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-9 bg-white/5 rounded-xl animate-pulse"></div>
                <div className="h-9 bg-white/5 rounded-xl animate-pulse"></div>
                <div className="h-9 bg-white/5 rounded-xl animate-pulse"></div>
              </div>
            ) : report?.recommendations && report.recommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex gap-3 items-start hover:bg-white/10 transition-colors">
                    <span className="text-xs font-extrabold w-5 h-5 shrink-0 rounded-full bg-[#84f5e8] text-[#1b2e4b] flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <p className="text-xs font-medium text-slate-100 leading-relaxed">
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/70 italic">Sigue agregando movimientos y metas para recibir consejos accionables automatizados.</p>
            )}
          </div>

        </div>

        {/* Footer del Modal */}
        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1b2e4b] text-white hover:bg-[#2b3e5b] transition-all focus:outline-none shadow-xs cursor-pointer"
          >
            Entendido, cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
