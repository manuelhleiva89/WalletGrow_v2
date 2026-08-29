/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CryptoAsset, FixedTermInvestment, Account } from '../types';

const MAJOR_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: 'currency_bitcoin', color: '#cca830' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'diamond', color: '#627eea' },
  { symbol: 'SOL', name: 'Solana', icon: 'cyclone', color: '#14f195' },
  { symbol: 'USDT', name: 'Tether', icon: 'paid', color: '#006a62' },
  { symbol: 'USDC', name: 'USD Coin', icon: 'paid', color: '#2775ca' },
  { symbol: 'BNB', name: 'BNB', icon: 'generating_tokens', color: '#f3ba2f' },
  { symbol: 'ADA', name: 'Cardano', icon: 'generating_tokens', color: '#0033ad' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'pets', color: '#c2a633' },
  { symbol: 'XRP', name: 'XRP', icon: 'token', color: '#23292f' },
];

const MAJOR_EXCHANGES = [
  'Binance',
  'Coinbase',
  'Kraken',
  'KuCoin',
  'OKX',
  'Crypto.com',
  'Uniswap',
  'PancakeSwap',
  'MetaMask',
  'Ledger Live',
  'Cold Wallet (Billetera Fría)',
];

interface InversionesProps {
  cryptoAssets: CryptoAsset[];
  fixedTermInvestments: FixedTermInvestment[];
  accounts: Account[];
  onAddCryptoAsset?: (asset: Omit<CryptoAsset, 'id'>) => void;
  onUpdateCryptoAsset?: (asset: CryptoAsset) => void;
  onDeleteCryptoAsset?: (id: string) => void;
  onAddFixedTermInvestment?: (inv: Omit<FixedTermInvestment, 'id'>) => void;
  onDeleteFixedTermInvestment?: (id: string) => void;
  currencySymbol: string;
  formatAmount: (amount: number) => string;
}

export default function Inversiones({
  cryptoAssets,
  fixedTermInvestments,
  accounts,
  onAddCryptoAsset,
  onUpdateCryptoAsset,
  onDeleteCryptoAsset,
  onAddFixedTermInvestment,
  onDeleteFixedTermInvestment,
  currencySymbol,
  formatAmount,
}: InversionesProps) {
  // Simulator states
  const [simType, setSimType] = useState<'loan' | 'investment'>('loan');
  const [simAmount, setSimAmount] = useState<number | ''>(0);
  const [simMonths, setSimTerm] = useState<number | ''>(0);
  const [simRate, setSimRate] = useState<number | ''>(0);

  // Calculation output state (derived or manual)
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalAccumulated, setTotalAccumulated] = useState(0);

  // Modal and deletion state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<CryptoAsset | null>(null);

  // Form states
  const [symbol, setSymbol] = useState('BTC');
  const [customSymbol, setCustomSymbol] = useState('');
  const [name, setName] = useState('Bitcoin');
  const [customName, setCustomName] = useState('');
  
  const [exchange, setExchange] = useState('Binance');
  const [customExchange, setCustomExchange] = useState('');
  
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [purchaseDate, setPurchaseDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [amount, setAmount] = useState<number | ''>('');
  const [gasFee, setGasFee] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Fixed-term deposit (Plazo Fijo) form and modal states
  const [isFtModalOpen, setIsFtModalOpen] = useState(false);
  const [ftName, setFtName] = useState('');
  const [ftBank, setFtBank] = useState('');
  const [ftDepositType, setFtDepositType] = useState<'Interés Simple' | 'Interés Compuesto'>('Interés Simple');
  const [ftTermValue, setFtTermValue] = useState<number | ''>('');
  const [ftTermUnit, setFtTermUnit] = useState<'days' | 'months'>('months');
  const [ftAnnualRate, setFtAnnualRate] = useState<number | ''>('');
  const [ftAmount, setFtAmount] = useState<number | ''>('');
  const [ftStartDate, setFtStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [ftAccountId, setFtAccountId] = useState('');
  const [deletingFtId, setDeletingFtId] = useState<string | null>(null);

  // Helper functions for Plazo Fijo calculation
  const calculateDueDate = (startDateStr: string, value: number, unit: 'days' | 'months') => {
    if (!startDateStr) return '';
    try {
      const date = new Date(startDateStr + 'T12:00:00');
      if (unit === 'days') {
        date.setDate(date.getDate() + value);
      } else {
        date.setMonth(date.getMonth() + value);
      }
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const getProgressPercentage = (startDateStr?: string, dueDateStr?: string) => {
    if (!startDateStr || !dueDateStr) return 0;
    try {
      const start = new Date(startDateStr).getTime();
      const end = new Date(dueDateStr).getTime();
      const now = new Date().getTime();
      if (now <= start) return 0;
      if (now >= end) return 100;
      const total = end - start;
      const elapsed = now - start;
      return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    } catch (e) {
      return 0;
    }
  };

  const handleFtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddFixedTermInvestment) return;

    const rateVal = typeof ftAnnualRate === 'number' ? ftAnnualRate : 0;
    const amountVal = typeof ftAmount === 'number' ? ftAmount : 0;
    const termVal = typeof ftTermValue === 'number' ? ftTermValue : 12;

    const finalDueDate = calculateDueDate(ftStartDate, termVal, ftTermUnit);
    const days = ftTermUnit === 'days' ? termVal : termVal * 30.417;

    let estimatedYield = 0;
    if (ftDepositType === 'Interés Compuesto') {
      // Compound interest (daily compounding simulation): A = P * (1 + r/365)^d - P
      estimatedYield = parseFloat((amountVal * (Math.pow(1 + (rateVal / 100) / 365, days) - 1)).toFixed(2));
    } else {
      // Simple interest: P * r * d / 365
      estimatedYield = parseFloat((amountVal * (rateVal / 100) * (days / 365)).toFixed(2));
    }

    onAddFixedTermInvestment({
      amount: amountVal,
      annualRate: rateVal,
      dueDate: finalDueDate,
      accumulatedYield: estimatedYield,
      name: ftName.trim() || 'Inversión Plazo Fijo',
      bank: ftBank.trim() || 'Banco Desconocido',
      depositType: ftDepositType,
      termValue: termVal,
      termUnit: ftTermUnit,
      startDate: ftStartDate,
      accountId: ftAccountId || undefined,
    });

    // Reset Form
    setIsFtModalOpen(false);
    setFtName('');
    setFtBank('');
    setFtDepositType('Interés Simple');
    setFtTermValue('');
    setFtTermUnit('months');
    setFtAnnualRate('');
    setFtAmount('');
    setFtStartDate(new Date().toISOString().split('T')[0]);
    setFtAccountId('');
  };

  // Real-time market prices state
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [pricesError, setPricesError] = useState<string | null>(null);
  const [isFetchingPrices, setIsFetchingPrices] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string | null>(null);

  const isMountedRef = React.useRef(true);
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchPrices = React.useCallback(async () => {
    setIsFetchingPrices(true);
    try {
      // Merge unique symbols from portfolio + major cryptos so form drop-downs have live prices too
      const portfolioSymbols = cryptoAssets.map(a => a.symbol.toUpperCase());
      const majorSymbols = MAJOR_CRYPTOS.map(c => c.symbol.toUpperCase());
      const uniqueSymbols = Array.from(new Set([...portfolioSymbols, ...majorSymbols]));

      let fetchedPrices: Record<string, number> = {};
      let success = false;

      // 1. Try browser direct fetch to CoinCap first (works since browser has internet)
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

            uniqueSymbols.forEach(sym => {
              const symUpper = sym.toUpperCase();
              if (symUpper === "USDT" || symUpper === "USDC" || symUpper === "USD") {
                fetchedPrices[symUpper] = 1.0;
              } else if (tempPrices[symUpper] !== undefined) {
                fetchedPrices[symUpper] = tempPrices[symUpper];
              }
            });
            success = Object.keys(fetchedPrices).length > 0;
          }
        }
      } catch (browserErr) {
        console.warn("Client direct CoinCap fetch failed, trying Binance:", browserErr);
      }

      // 2. Try browser direct fetch to Binance if CoinCap didn't succeed or missed some symbols
      const symbolsNeeded = uniqueSymbols.filter(sym => typeof fetchedPrices[sym.toUpperCase()] !== "number");
      if (symbolsNeeded.length > 0) {
        try {
          const response = await fetch("https://api.binance.com/api/v3/ticker/price");
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              const binanceMap = new Map<string, number>();
              data.forEach((item: any) => {
                if (item.symbol && item.price) {
                  binanceMap.set(item.symbol.toUpperCase(), parseFloat(item.price));
                }
              });

              symbolsNeeded.forEach(sym => {
                const symUpper = sym.toUpperCase();
                if (symUpper === "USDT" || symUpper === "USDC" || symUpper === "USD") {
                  fetchedPrices[symUpper] = 1.0;
                } else {
                  const pair = `${symUpper}USDT`;
                  if (binanceMap.has(pair)) {
                    fetchedPrices[symUpper] = binanceMap.get(pair)!;
                  } else {
                    const pairUsdc = `${symUpper}USDC`;
                    if (binanceMap.has(pairUsdc)) {
                      fetchedPrices[symUpper] = binanceMap.get(pairUsdc)!;
                    }
                  }
                }
              });
              success = true;
            }
          }
        } catch (binanceErr) {
          console.warn("Client direct Binance fetch failed:", binanceErr);
        }
      }

      // 3. Fallback to backend proxy (which has simulated/actual baseline prices)
      const finalSymbolsNeeded = uniqueSymbols.filter(sym => typeof fetchedPrices[sym.toUpperCase()] !== "number");
      if (finalSymbolsNeeded.length > 0 || !success) {
        const symbolsParam = uniqueSymbols.join(',');
        const res = await fetch(`/api/crypto-prices?symbols=${encodeURIComponent(symbolsParam)}`);
        if (res.ok) {
          const data = await res.json();
          fetchedPrices = { ...data, ...fetchedPrices };
        }
      }

      if (isMountedRef.current) {
        setLivePrices(fetchedPrices);
        setPricesError(null);
        setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err: any) {
      console.error("Prices fetch error:", err);
      if (isMountedRef.current) {
        setPricesError('No se pudieron obtener precios actualizados del mercado.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsFetchingPrices(false);
      }
    }
  }, [cryptoAssets]);

  React.useEffect(() => {
    fetchPrices();
    
    // Refresh every 5 minutes (300,000 ms)
    const interval = setInterval(fetchPrices, 300000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchPrices]);

  // Dynamic Amortization and Investment table generators
  interface AmortizationRow {
    period: number;
    payment: number;
    interestPaid: number;
    principalPaid: number;
    remainingBalance: number;
  }

  interface InvestmentProjectionRow {
    period: number;
    initialBalance: number;
    interestEarned: number;
    finalBalance: number;
  }

  const generateAmortizationTable = (): AmortizationRow[] => {
    const P = Number(simAmount) || 0;
    const months = Number(simMonths) || 0;
    const annualRate = Number(simRate) || 0;

    if (P <= 0 || months <= 0 || annualRate <= 0) return [];

    const r = (annualRate / 100) / 12;
    let payment = 0;
    if (r === 0) {
      payment = P / months;
    } else {
      payment = (P * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    }

    const table: AmortizationRow[] = [];
    let balance = P;

    for (let i = 1; i <= months; i++) {
      const interestPaid = balance * r;
      const principalPaid = payment - interestPaid;
      balance = balance - principalPaid;

      table.push({
        period: i,
        payment: payment,
        interestPaid: interestPaid,
        principalPaid: principalPaid,
        remainingBalance: Math.max(0, balance),
      });
    }
    return table;
  };

  const generateInvestmentTable = (): InvestmentProjectionRow[] => {
    const P = Number(simAmount) || 0;
    const months = Number(simMonths) || 0;
    const annualRate = Number(simRate) || 0;

    if (P <= 0 || months <= 0 || annualRate <= 0) return [];

    const r = (annualRate / 100) / 12;
    const table: InvestmentProjectionRow[] = [];
    let balance = P;

    for (let i = 1; i <= months; i++) {
      const initialBalance = balance;
      const interestEarned = balance * r;
      balance = balance + interestEarned;

      table.push({
        period: i,
        initialBalance: initialBalance,
        interestEarned: interestEarned,
        finalBalance: balance,
      });
    }
    return table;
  };

  React.useEffect(() => {
    const P = Number(simAmount) || 0;
    const months = Number(simMonths) || 0;
    const annualRate = Number(simRate) || 0;

    if (P > 0 && months > 0 && annualRate > 0) {
      if (simType === 'loan') {
        const r = (annualRate / 100) / 12;
        let payment = 0;
        if (r === 0) {
          payment = P / months;
        } else {
          payment = (P * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
        }
        const total = payment * months;
        setMonthlyPayment(parseFloat(payment.toFixed(2)));
        setTotalAccumulated(parseFloat(total.toFixed(2)));
      } else {
        const r = (annualRate / 100) / 12;
        const total = P * Math.pow(1 + r, months);
        const yieldAmount = total - P;
        const averageMonthlyGain = yieldAmount / months;
        setMonthlyPayment(parseFloat(averageMonthlyGain.toFixed(2)));
        setTotalAccumulated(parseFloat(total.toFixed(2)));
      }
    } else {
      setMonthlyPayment(0);
      setTotalAccumulated(0);
    }
  }, [simAmount, simMonths, simRate, simType]);

  const handleSelectAsset = (sym: string) => {
    setSymbol(sym);
    if (sym === 'Other') {
      setName('');
    } else {
      const crypto = MAJOR_CRYPTOS.find(c => c.symbol === sym);
      if (crypto) {
        setName(crypto.name);
      }
    }
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
    setEditingAssetId(null);
    setSymbol('BTC');
    setCustomSymbol('');
    setName('Bitcoin');
    setCustomName('');
    setExchange('Binance');
    setCustomExchange('');
    setPurchasePrice('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setGasFee('');
    setNotes('');
  };

  const openAddModal = () => {
    setModalMode('add');
    // reset first
    setEditingAssetId(null);
    setSymbol('BTC');
    setCustomSymbol('');
    setName('Bitcoin');
    setCustomName('');
    setExchange('Binance');
    setCustomExchange('');
    setPurchasePrice('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setGasFee('');
    setNotes('');
    
    setIsModalOpen(true);
  };

  const openEditModal = (asset: CryptoAsset) => {
    setModalMode('edit');
    setEditingAssetId(asset.id);
    
    const isMajor = MAJOR_CRYPTOS.some(c => c.symbol === asset.symbol);
    if (isMajor) {
      setSymbol(asset.symbol);
      setName(asset.name);
      setCustomSymbol('');
      setCustomName('');
    } else {
      setSymbol('Other');
      setName('');
      setCustomSymbol(asset.symbol);
      setCustomName(asset.name);
    }

    const isMajorExchange = MAJOR_EXCHANGES.includes(asset.exchange || '');
    if (!asset.exchange) {
      setExchange('Binance');
      setCustomExchange('');
    } else if (isMajorExchange) {
      setExchange(asset.exchange);
      setCustomExchange('');
    } else {
      setExchange('Other');
      setCustomExchange(asset.exchange);
    }

    setPurchasePrice(asset.purchasePrice || '');
    setPurchaseDate(asset.purchaseDate || new Date().toISOString().split('T')[0]);
    setAmount(asset.amount);
    setGasFee(asset.gasFee !== undefined ? asset.gasFee : '');
    setNotes(asset.notes || '');
    
    setIsModalOpen(true);
  };

  const handleDeleteClick = (asset: CryptoAsset) => {
    setDeletingAsset(asset);
  };

  const confirmDelete = () => {
    if (deletingAsset && onDeleteCryptoAsset) {
      onDeleteCryptoAsset(deletingAsset.id);
    }
    setDeletingAsset(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalSymbol = symbol === 'Other' ? customSymbol.trim().toUpperCase() : symbol;
    const finalName = symbol === 'Other' ? customName.trim() : name;
    const finalExchange = exchange === 'Other' ? customExchange.trim() : exchange;
    
    if (!finalSymbol || !finalName || amount === '' || purchasePrice === '') {
      return;
    }

    const calculatedValueUsd = Number(amount) * Number(purchasePrice);

    if (modalMode === 'add') {
      if (onAddCryptoAsset) {
        onAddCryptoAsset({
          name: finalName,
          symbol: finalSymbol,
          amount: Number(amount),
          valueUsd: calculatedValueUsd,
          change24h: Math.round((Math.random() * 10 - 4) * 10) / 10,
          purchasePrice: Number(purchasePrice),
          purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
          exchange: finalExchange,
          gasFee: gasFee !== '' ? Number(gasFee) : 0,
          notes: notes.trim(),
        });
      }
    } else {
      if (onUpdateCryptoAsset && editingAssetId) {
        const existing = cryptoAssets.find(a => a.id === editingAssetId);
        onUpdateCryptoAsset({
          id: editingAssetId,
          name: finalName,
          symbol: finalSymbol,
          amount: Number(amount),
          valueUsd: calculatedValueUsd,
          change24h: existing ? existing.change24h : 0,
          purchasePrice: Number(purchasePrice),
          purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
          exchange: finalExchange,
          gasFee: gasFee !== '' ? Number(gasFee) : 0,
          notes: notes.trim(),
        });
      }
    }

    closeFormModal();
  };

  return (
    <div id="inversiones_tab" className="space-y-6 pt-4">
      
      {/* Cripto Portafolio */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#031935] tracking-tight">Cartera Cripto</h2>
            <p className="text-xs text-[#75777e]">
              Saldos de activos digitales descentralizados con cotización de mercado en tiempo real.
            </p>
          </div>
          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <button 
              type="button"
              onClick={fetchPrices}
              disabled={isFetchingPrices}
              className="bg-[#f1f4f6] hover:bg-[#e1e4e6] text-[#006a62] border border-[#c4c6ce] px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              title="Actualizar cotizaciones de mercado ahora"
            >
              <span className={`material-symbols-outlined text-[16px] ${isFetchingPrices ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{isFetchingPrices ? 'Actualizando...' : 'Actualizar Precios'}</span>
            </button>
            <button 
              onClick={openAddModal}
              className="bg-[#1b2e4b] hover:bg-[#031935] text-[#84f5e8] px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Agregar Cripto</span>
            </button>
          </div>
        </div>

        {/* Resumen de Cartera Cripto */}
        {cryptoAssets.length > 0 && (
          <div className="bg-gradient-to-br from-[#031935] to-[#1b2e4b] text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-[#84f5e8] tracking-widest flex items-center gap-1.5 flex-wrap">
                <span className={`w-2 h-2 rounded-full ${isFetchingPrices ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                {isFetchingPrices ? 'Sincronizando...' : 'Precios en Vivo'}
                {lastUpdatedTime && (
                  <span className="text-slate-300 font-normal lowercase tracking-normal">
                    (refrescado {lastUpdatedTime})
                  </span>
                )}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black font-mono tracking-tight">
                  {formatAmount(cryptoAssets.reduce((sum, asset) => {
                    const currentPrice = livePrices[asset.symbol.toUpperCase()] || asset.purchasePrice || (asset.valueUsd / asset.amount) || 0;
                    return sum + (asset.amount * currentPrice);
                  }, 0))}
                </span>
                <span className="text-xs text-slate-300">Valor de Cartera</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-8 w-full sm:w-auto pt-3 sm:pt-0 border-t border-white/10 sm:border-none">
              <div>
                <span className="text-[10px] text-slate-300 block uppercase font-bold tracking-wider">Invertido</span>
                <span className="text-sm font-bold font-mono text-white mt-0.5 block">
                  {formatAmount(cryptoAssets.reduce((sum, asset) => sum + (asset.amount * (asset.purchasePrice || 0)), 0))}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-300 block uppercase font-bold tracking-wider">Rendimiento (G/P)</span>
                {(() => {
                  const totalInvested = cryptoAssets.reduce((sum, asset) => sum + (asset.amount * (asset.purchasePrice || 0)), 0);
                  const totalValue = cryptoAssets.reduce((sum, asset) => {
                    const currentPrice = livePrices[asset.symbol.toUpperCase()] || asset.purchasePrice || (asset.valueUsd / asset.amount) || 0;
                    return sum + (asset.amount * currentPrice);
                  }, 0);
                  const diff = totalValue - totalInvested;
                  const pct = totalInvested > 0 ? (diff / totalInvested) * 100 : 0;
                  return (
                    <span className={`text-sm font-bold font-mono mt-0.5 block flex items-center gap-1 ${
                      diff >= 0 ? 'text-[#a6ffd6]' : 'text-[#ffb4ab]'
                    }`}>
                      {diff >= 0 ? '▲' : '▼'}{' '}
                      {formatAmount(Math.abs(diff))}
                      <span className="text-[10px] font-normal text-slate-300">
                        ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
                      </span>
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {pricesError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            <span>{pricesError} Se muestran las valoraciones locales o estimadas.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cryptoAssets.map((asset) => {
            const foundCrypto = MAJOR_CRYPTOS.find(c => c.symbol === asset.symbol);
            const iconName = foundCrypto?.icon || 'token';
            const colorValue = foundCrypto?.color || '#1b2e4b';

            // Real-time calculations
            const currentPrice = livePrices[asset.symbol.toUpperCase()] || asset.purchasePrice || (asset.valueUsd / asset.amount) || 1.0;
            const currentTotalValue = asset.amount * currentPrice;
            const totalInvested = asset.amount * (asset.purchasePrice || 0);
            const profitLoss = currentTotalValue - totalInvested;
            const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

            return (
              <div 
                key={asset.id} 
                className="bg-white border border-[#c4c6ce] rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between"
              >
                {/* Background glow */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: `linear-gradient(135deg, ${colorValue}08, transparent)`
                }}></div>

                {/* Top Row: Icon, info, and balance/change */}
                <div className="flex justify-between items-start w-full relative z-10 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center border" style={{ backgroundColor: `${colorValue}12`, borderColor: `${colorValue}25`, color: colorValue }}>
                      <span className="material-symbols-outlined fill text-[20px]">
                        {iconName}
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#75777e] uppercase tracking-wider">{asset.symbol}</p>
                      <h3 className="text-sm font-extrabold text-[#031935] mt-0.5">{asset.name}</h3>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end pr-10">
                    <p className="text-[10px] font-bold text-[#75777e] uppercase tracking-wider">Monto Guardado</p>
                    <p className="text-sm font-bold text-[#031935] font-mono mt-0.5">
                      {asset.amount} {asset.symbol}
                    </p>
                    <div className="flex flex-row items-center gap-2 mt-1 justify-end flex-wrap">
                      <span className="text-xs font-bold text-[#006a62] font-mono whitespace-nowrap">
                        {formatAmount(currentTotalValue)}
                      </span>
                      <span className="text-xs text-[#006a62] bg-[#006a62]/5 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 border border-[#006a62]/15 whitespace-nowrap" title="Precio actual de mercado">
                        <span className="w-1 h-1 rounded-full bg-[#006a62] animate-pulse"></span>
                        Precio: {formatAmount(currentPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions absolute top-right - stacked vertically */}
                <div className="flex flex-col items-center gap-2 absolute top-3 right-3 z-20">
                  <button 
                    onClick={() => openEditModal(asset)}
                    className="p-1 hover:bg-[#f1f4f6] text-[#44474d] hover:text-[#006a62] rounded-lg transition-all active:scale-90 flex items-center justify-center"
                    title="Editar activo"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(asset)}
                    className="p-1 hover:bg-red-50 text-[#44474d] hover:text-[#ba1a1a] rounded-lg transition-all active:scale-90 flex items-center justify-center"
                    title="Eliminar activo"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>

                {/* Bottom Row: Additional bookkeeping details */}
                <div className="mt-3 pt-3 border-t border-[#f1f4f6] grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-[#44474d] w-full relative z-10">
                  <div>
                    <span className="font-semibold block text-[#75777e]">Inversión Inicial:</span>
                    <span className="font-bold text-[#031935] font-mono">{formatAmount(totalInvested)}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-[#75777e]">Resultado Neto (G/P):</span>
                    <span className={`font-bold font-mono flex items-center gap-1 ${
                      profitLoss >= 0 ? 'text-[#006a62]' : 'text-[#ba1a1a]'
                    }`}>
                      {profitLoss >= 0 ? '▲' : '▼'}{' '}
                      {formatAmount(Math.abs(profitLoss))}
                      <span className="font-normal text-[9px] text-[#75777e]">
                        ({profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  {asset.exchange && (
                    <div>
                      <span className="font-semibold block text-[#75777e]">Plataforma / Exchange:</span>
                      <span className="font-bold text-[#031935]">{asset.exchange}</span>
                    </div>
                  )}
                  {asset.purchasePrice && (
                    <div>
                      <span className="font-semibold block text-[#75777e]">P. Compra Unitario:</span>
                      <span className="font-bold text-[#031935] font-mono">{formatAmount(asset.purchasePrice)}</span>
                    </div>
                  )}
                  {asset.purchaseDate && (
                    <div>
                      <span className="font-semibold block text-[#75777e]">Fecha de Compra:</span>
                      <span className="font-bold text-[#031935]">{asset.purchaseDate}</span>
                    </div>
                  )}
                  {asset.gasFee !== undefined && asset.gasFee > 0 ? (
                    <div>
                      <span className="font-semibold block text-[#75777e]">Comisión / Gas Fee:</span>
                      <span className="font-bold text-[#031935] font-mono">{formatAmount(asset.gasFee)}</span>
                    </div>
                  ) : null}
                  {asset.notes && (
                    <div className="col-span-2">
                      <span className="font-semibold block text-[#75777e]">Notas / Billetera:</span>
                      <span className="font-medium text-[#44474d] truncate block" title={asset.notes}>{asset.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Add / Edit Crypto Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-[#031935]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white border border-[#c4c6ce] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-[#031935] text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#84f5e8] fill text-[20px]">
                    {modalMode === 'add' ? 'generating_tokens' : 'edit_document'}
                  </span>
                  <h3 className="font-bold text-sm tracking-tight">
                    {modalMode === 'add' ? 'Registrar Adquisición Cripto' : 'Editar Activo Cripto'}
                  </h3>
                </div>
                <button 
                  onClick={closeFormModal}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
                
                {/* Active selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Activo Cripto *</label>
                    <select
                      value={symbol}
                      onChange={(e) => handleSelectAsset(e.target.value)}
                      required
                      className="h-10 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none transition-colors cursor-pointer"
                    >
                      {MAJOR_CRYPTOS.map(c => (
                        <option key={c.symbol} value={c.symbol}>{c.name} ({c.symbol})</option>
                      ))}
                      <option value="Other">Otro activo (Personalizado)...</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Cantidad Comprada *</label>
                    <input
                      type="number"
                      step="any"
                      min="0.00000001"
                      placeholder="ej. 0.452"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value !== '' ? parseFloat(e.target.value) : '')}
                      required
                      className="h-10 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none font-mono transition-colors"
                    />
                  </div>
                </div>

                {/* Custom active fields if other is selected */}
                {symbol === 'Other' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-4 border-l-2 border-[#006a62] pl-3"
                  >
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Símbolo del Activo *</label>
                      <input
                        type="text"
                        placeholder="ej. SOL, ADA, DOT"
                        value={customSymbol}
                        onChange={(e) => setCustomSymbol(e.target.value)}
                        required={symbol === 'Other'}
                        className="h-10 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none font-bold uppercase transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Nombre del Activo *</label>
                      <input
                        type="text"
                        placeholder="ej. Solana, Cardano"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        required={symbol === 'Other'}
                        className="h-10 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none transition-colors"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Exchange & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Plataforma / Exchange *</label>
                    <select
                      value={exchange}
                      onChange={(e) => setExchange(e.target.value)}
                      required
                      className="h-10 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none transition-colors cursor-pointer"
                    >
                      {MAJOR_EXCHANGES.map(exch => (
                        <option key={exch} value={exch}>{exch}</option>
                      ))}
                      <option value="Other">Otro Exchange (Especificar)...</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Fecha de Compra *</label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      required
                      className="h-10 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Custom exchange input if other is selected */}
                {exchange === 'Other' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-1 border-l-2 border-[#006a62] pl-3"
                  >
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Nombre del Exchange Personalizado *</label>
                    <input
                      type="text"
                      placeholder="ej. Bitso, Bybit, MetaMask Wallet"
                      value={customExchange}
                      onChange={(e) => setCustomExchange(e.target.value)}
                      required={exchange === 'Other'}
                      className="h-10 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none transition-colors"
                    />
                  </motion.div>
                )}

                {/* Buy Price and Network Fee */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">P. Unitario de Compra (USD) *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2 bg-transparent text-xs font-bold text-[#75777e] select-none">$</span>
                      <input
                        type="number"
                        step="any"
                        min="0.00000001"
                        placeholder="ej. 58240"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value !== '' ? parseFloat(e.target.value) : '')}
                        required
                        className="w-full h-10 pl-7 pr-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none font-mono transition-colors"
                      />
                    </div>
                    {(() => {
                      const activeSymbol = symbol === 'Other' ? customSymbol.toUpperCase() : symbol.toUpperCase();
                      const currentMarketPrice = livePrices[activeSymbol];
                      if (currentMarketPrice) {
                        return (
                          <button
                            type="button"
                            onClick={() => setPurchasePrice(currentMarketPrice)}
                            className="text-[10px] text-left text-[#006a62] font-semibold hover:underline mt-1 flex items-center gap-1 active:scale-95 transition-all self-start"
                            title="Haz clic para usar el precio de mercado actual"
                          >
                            <span className="material-symbols-outlined text-[12px] animate-pulse">sensors</span>
                            Usar precio de mercado: {formatAmount(currentMarketPrice)}
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Comisión de Red / Fee (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2 bg-transparent text-xs font-bold text-[#75777e] select-none">$</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="ej. 2.50 (Opcional)"
                        value={gasFee}
                        onChange={(e) => setGasFee(e.target.value !== '' ? parseFloat(e.target.value) : '')}
                        className="w-full h-10 pl-7 pr-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none font-mono transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional bookkeeping notes (Network, Wallet address, custodial notes) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Notas Contables / Billetera de Destino</label>
                  <textarea
                    placeholder="ej. Red Arbitrum, Wallet de hardware Ledger, ID de Tx o Propósito contable..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="p-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none transition-colors resize-none"
                  />
                  <p className="text-[9px] text-[#75777e]">Opcional. Datos recomendados para la trazabilidad y fiscalidad de activos criptográficos.</p>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#ebeef0]">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-5 bg-[#031935] hover:bg-[#1b2e4b] text-[#84f5e8] text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">{modalMode === 'add' ? 'add' : 'check'}</span>
                    <span>{modalMode === 'add' ? 'Registrar Activo' : 'Guardar Cambios'}</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deletion confirmation dialog */}
      <AnimatePresence>
        {deletingAsset && (
          <div className="fixed inset-0 bg-[#031935]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#c4c6ce] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
            >
              <div className="bg-red-50 text-red-800 p-4 flex items-center gap-2 border-b border-red-100">
                <span className="material-symbols-outlined text-red-600 fill">warning</span>
                <h3 className="font-bold text-sm tracking-tight">Confirmar Eliminación</h3>
              </div>
              <div className="p-5 flex flex-col gap-3">
                <p className="text-xs text-[#44474d] leading-relaxed">
                  ¿Está seguro de que desea eliminar el activo <strong>{deletingAsset.name} ({deletingAsset.symbol})</strong> de su cartera cripto?
                </p>
                <p className="text-[10px] text-[#75777e] bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
                  Esta acción eliminará el registro de {deletingAsset.amount} {deletingAsset.symbol} con un valor contable de {formatAmount(deletingAsset.valueUsd)}. No se puede deshacer.
                </p>
                <div className="flex justify-end gap-3 mt-3">
                  <button
                    onClick={() => setDeletingAsset(null)}
                    className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="h-9 px-4 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inversiones a Plazo Fijo */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center sm:items-end flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#031935] tracking-tight">Depósitos a Plazo Fijo</h2>
            <p className="text-xs text-[#75777e]">Rendimientos garantizados e inversiones programadas de bajo riesgo.</p>
          </div>
          <button 
            onClick={() => setIsFtModalOpen(true)}
            className="h-9 px-4 bg-[#031935] hover:bg-[#1b2e4b] text-[#84f5e8] text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Nuevo Depósito</span>
          </button>
        </div>

        {/* Dynamic Summary Card */}
        {(() => {
          const activeFixedInvestments = fixedTermInvestments || [];
          const totalFtdAmount = activeFixedInvestments.reduce((sum, inv) => sum + inv.amount, 0);
          const totalFtdYield = activeFixedInvestments.reduce((sum, inv) => sum + inv.accumulatedYield, 0);
          
          const weightedRateSum = activeFixedInvestments.reduce((sum, inv) => sum + (inv.annualRate * inv.amount), 0);
          const avgFtdRate = totalFtdAmount > 0 ? (weightedRateSum / totalFtdAmount) : 0;
          
          const todayStr = new Date().toISOString().split('T')[0];
          const upcomingInvestments = activeFixedInvestments
            .filter(inv => inv.dueDate >= todayStr)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
          const nextDueDate = upcomingInvestments.length > 0 ? upcomingInvestments[0].dueDate : null;

          const formatDateStr = (dateStr?: string) => {
            if (!dateStr) return 'N/A';
            const parts = dateStr.split('-');
            if (parts.length !== 3) return dateStr;
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const idx = parseInt(parts[1], 10) - 1;
            return `${parts[2]} ${months[idx]} ${parts[0]}`;
          };

          return (
            <div className="bg-[#031935] border border-[#1b2e4b] rounded-xl p-6 shadow-sm text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#84f5e8]/5 rounded-bl-full pointer-events-none filter blur-xl"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs font-semibold text-[#b4c7ec] mb-1">Capital Total Activo</p>
                  <h3 className="text-3xl font-bold font-mono leading-none text-[#84f5e8]">{formatAmount(totalFtdAmount)}</h3>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#b4c7ec] mb-1">Rendimiento Acumulado</p>
                  <h3 className="text-3xl font-bold font-mono leading-none">${totalFtdYield.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-white/10 pt-4 items-center">
                <div>
                  <p className="text-[10px] font-bold text-[#b4c7ec] uppercase tracking-wide mb-1">Tasa Promedio</p>
                  <p className="text-base font-bold font-mono text-[#84f5e8]">
                    {avgFtdRate > 0 ? `${avgFtdRate.toFixed(2)}%` : '0.00%'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#b4c7ec] uppercase tracking-wide mb-1">Próximo Vencimiento</p>
                  <p className="text-sm font-bold font-mono text-white">
                    {nextDueDate ? formatDateStr(nextDueDate) : 'Sin vencimientos'}
                  </p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <button 
                    onClick={() => setIsFtModalOpen(true)}
                    className="w-full h-11 bg-[#84f5e8] hover:bg-[#66d9cc] text-[#031935] rounded-lg text-xs font-bold transition-colors active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Nueva Inversión
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* List of deposits */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-[#031935] tracking-tight flex items-center gap-1.5 mt-2">
            <span className="material-symbols-outlined text-[18px] text-[#006a62]">list_alt</span>
            Depósitos Registrados
          </h3>

          {(!fixedTermInvestments || fixedTermInvestments.length === 0) ? (
            <div className="bg-slate-50 border border-dashed border-[#c4c6ce] rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[32px] text-[#75777e]">payments</span>
              <p className="text-xs font-semibold text-[#44474d]">No tienes depósitos a plazo fijo registrados</p>
              <p className="text-[11px] text-[#75777e] max-w-sm">Registra tus plazos fijos para simular rendimientos, controlar fechas de vencimiento y realizar el seguimiento consolidado de tu cartera.</p>
              <button
                onClick={() => setIsFtModalOpen(true)}
                className="mt-2 h-9 px-4 bg-[#031935] text-[#84f5e8] text-xs font-bold rounded-lg hover:bg-[#1b2e4b] transition-all active:scale-95"
              >
                Registrar primer depósito
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fixedTermInvestments.map((inv) => {
                const progress = getProgressPercentage(inv.startDate, inv.dueDate);
                const isMatured = progress >= 100;

                const formatDateStr = (dateStr?: string) => {
                  if (!dateStr) return 'N/A';
                  const parts = dateStr.split('-');
                  if (parts.length !== 3) return dateStr;
                  return `${parts[2]}/${parts[1]}/${parts[0]}`;
                };

                return (
                  <div key={inv.id} className="bg-white border border-[#c4c6ce] rounded-xl p-4 shadow-sm relative hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                      {/* Card Header */}
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#006a62]/10 flex items-center justify-center text-[#006a62]">
                            <span className="material-symbols-outlined text-[18px]">account_balance</span>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#031935] truncate max-w-[160px]" title={inv.name || 'Inversión Plazo Fijo'}>
                              {inv.name || 'Inversión Plazo Fijo'}
                            </h4>
                            <p className="text-[10px] font-semibold text-[#75777e] truncate max-w-[160px]" title={inv.bank || 'Banco de la Nación'}>
                              {inv.bank || 'Banco de la Nación'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isMatured 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-teal-50 text-teal-700 border border-teal-100'
                          }`}>
                            {isMatured ? 'Vencido' : 'Activo'}
                          </span>
                          
                          {onDeleteFixedTermInvestment && (
                            <button
                              onClick={() => setDeletingFtId(inv.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors"
                              title="Eliminar registro"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Content Grid */}
                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] mb-3">
                        <div>
                          <span className="text-[#75777e] block text-[9px] font-semibold uppercase tracking-wider">Capital Invertido:</span>
                          <span className="font-bold text-[#031935] font-mono">{formatAmount(inv.amount)}</span>
                        </div>
                        <div>
                          <span className="text-[#75777e] block text-[9px] font-semibold uppercase tracking-wider">Interés Estimado:</span>
                          <span className="font-bold text-emerald-600 font-mono">+{formatAmount(inv.accumulatedYield)}</span>
                        </div>
                        <div>
                          <span className="text-[#75777e] block text-[9px] font-semibold uppercase tracking-wider">Tasa de Interés:</span>
                          <span className="font-bold text-[#031935] font-mono">{inv.annualRate}%</span>
                        </div>
                        <div>
                          <span className="text-[#75777e] block text-[9px] font-semibold uppercase tracking-wider">Plazo de Inversión:</span>
                          <span className="font-bold text-[#44474d]">{inv.termValue} {inv.termUnit === 'days' ? 'días' : 'meses'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Timeline */}
                    <div>
                      <div className="flex justify-between items-center text-[9px] font-semibold text-[#75777e] mb-1">
                        <span>{formatDateStr(inv.startDate)}</span>
                        <span className="font-bold text-[#006a62]">{progress}% Transcurrido</span>
                        <span>{formatDateStr(inv.dueDate)}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${isMatured ? 'bg-emerald-500' : 'bg-[#006a62]'}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[8px] text-[#75777e] mt-1">
                        <span>Fecha Inicio</span>
                        <span>Fecha Vencimiento</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Deletion confirmation dialog for Fixed Term Deposit */}
      <AnimatePresence>
        {deletingFtId && (
          <div className="fixed inset-0 bg-[#031935]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#c4c6ce] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
            >
              <div className="bg-red-50 text-red-800 p-4 flex items-center gap-2 border-b border-red-100">
                <span className="material-symbols-outlined text-red-600 fill">warning</span>
                <h3 className="font-bold text-sm tracking-tight">Confirmar Eliminación</h3>
              </div>
              <div className="p-5 flex flex-col gap-3">
                <p className="text-xs text-[#44474d] leading-relaxed">
                  ¿Está seguro de que desea eliminar este depósito a plazo fijo de su cartera?
                </p>
                <div className="flex justify-end gap-3 mt-3">
                  <button
                    onClick={() => setDeletingFtId(null)}
                    className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      if (onDeleteFixedTermInvestment && deletingFtId) {
                        onDeleteFixedTermInvestment(deletingFtId);
                      }
                      setDeletingFtId(null);
                    }}
                    className="h-9 px-4 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Fixed Term Investment Modal */}
      <AnimatePresence>
        {isFtModalOpen && (
          <div className="fixed inset-0 bg-[#031935]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white border border-[#c4c6ce] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-[#031935] text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#84f5e8] fill text-[20px]">
                    account_balance_wallet
                  </span>
                  <h3 className="font-bold text-sm tracking-tight">
                    Nuevo Depósito a Plazo Fijo
                  </h3>
                </div>
                <button 
                  onClick={() => setIsFtModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleFtSubmit} className="p-5 flex flex-col gap-3 overflow-y-auto max-h-[85vh]">
                
                {/* 2-Column Grid: Name & Bank */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Nombre de la Inversión *</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Mi Plazo Fijo"
                      value={ftName}
                      onChange={(e) => setFtName(e.target.value)}
                      className="h-9 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Banco Emisor *</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Banco de la Nación"
                      value={ftBank}
                      onChange={(e) => setFtBank(e.target.value)}
                      className="h-9 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* 2-Column Grid: Source Account & Start Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Vincular a Cuenta *</label>
                    <select
                      value={ftAccountId}
                      onChange={(e) => setFtAccountId(e.target.value)}
                      required
                      className="h-9 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none transition-colors cursor-pointer"
                    >
                      <option value="">-- Seleccionar cuenta --</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.bankName ? `${acc.bankName} - ` : ''}{acc.name} ({formatAmount(acc.balance)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Fecha de Inicio *</label>
                    <input
                      type="date"
                      required
                      value={ftStartDate}
                      onChange={(e) => setFtStartDate(e.target.value)}
                      className="h-9 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* 2-Column Grid: Deposit Type & Interest Rate */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Tipo de Depósito *</label>
                    <select
                      value={ftDepositType}
                      onChange={(e) => setFtDepositType(e.target.value as 'Interés Simple' | 'Interés Compuesto')}
                      required
                      className="h-9 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none transition-colors cursor-pointer"
                    >
                      <option value="Interés Simple">Interés Simple</option>
                      <option value="Interés Compuesto">Interés Compuesto</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Tasa (%) *</label>
                    <input
                      type="number"
                      required
                      min="0.1"
                      step="0.01"
                      placeholder="35.0"
                      value={ftAnnualRate}
                      onChange={(e) => setFtAnnualRate(e.target.value !== '' ? parseFloat(e.target.value) : '')}
                      className="h-9 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none font-mono transition-colors"
                    />
                  </div>
                </div>

                {/* 2-Column Grid: Amount & Term */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Monto a Invertir ($) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="50000"
                      value={ftAmount}
                      onChange={(e) => setFtAmount(e.target.value !== '' ? parseFloat(e.target.value) : '')}
                      className="h-9 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none font-mono transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#44474d] uppercase tracking-wider">Plazo (Meses) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="12"
                      value={ftTermValue}
                      onChange={(e) => setFtTermValue(e.target.value !== '' ? parseInt(e.target.value, 10) : '')}
                      className="h-9 px-3 bg-[#f1f4f6] border border-[#c4c6ce] rounded-xl text-xs focus:bg-white focus:border-[#006a62] outline-none font-mono transition-colors"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-3 mt-2 pt-3 border-t border-[#ebeef0]">
                  <button
                    type="button"
                    onClick={() => setIsFtModalOpen(false)}
                    className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-5 bg-[#031935] hover:bg-[#1b2e4b] text-[#84f5e8] text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                    <span>Registrar Depósito</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Simulador Financiero */}
      <section className="bg-white border border-[#c4c6ce] rounded-xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-3 border-b border-[#ebeef0] pb-4">
          <div className="w-10 h-10 rounded-full bg-[#006a62]/10 flex items-center justify-center text-[#006a62]">
            <span className="material-symbols-outlined text-[22px]">calculate</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-[#031935] tracking-tight">Simulador Financiero</h2>
            <p className="text-xs text-[#75777e]">Estime intereses, cuotas mensuales y proyecciones compuestas en tiempo real.</p>
          </div>
        </div>

        {/* Toggles del simulador */}
        <div className="flex gap-4 border-b border-[#ebeef0] pb-2 text-sm font-semibold">
          <button 
            onClick={() => { setSimType('loan'); setSimAmount(0); setSimTerm(0); setSimRate(0); }}
            className={`pb-2 transition-all relative cursor-pointer ${
              simType === 'loan' 
                ? 'text-[#006a62] font-bold border-b-2 border-[#006a62]' 
                : 'text-[#44474d] hover:text-[#031935]'
            }`}
          >
            Amortizar Préstamo
          </button>
          <button 
            onClick={() => { setSimType('investment'); setSimAmount(0); setSimTerm(0); setSimRate(0); }}
            className={`pb-2 transition-all relative cursor-pointer ${
              simType === 'investment' 
                ? 'text-[#006a62] font-bold border-b-2 border-[#006a62]' 
                : 'text-[#44474d] hover:text-[#031935]'
            }`}
          >
            Rendimiento de Inversión
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Entradas */}
          <div className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#44474d] uppercase tracking-wider">Monto Principal ($)</label>
              <input 
                type="number" 
                value={simAmount === 0 ? '' : simAmount}
                placeholder="0"
                onChange={(e) => {
                  const val = e.target.value;
                  setSimAmount(val === '' ? '' : Math.max(0, parseFloat(val) || 0));
                }}
                className="h-12 px-3.5 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none font-mono transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#44474d] uppercase tracking-wider">Plazo (Meses)</label>
              <input 
                type="number" 
                value={simMonths === 0 ? '' : simMonths}
                placeholder="0"
                onChange={(e) => {
                  const val = e.target.value;
                  setSimTerm(val === '' ? '' : Math.max(0, parseInt(val, 10) || 0));
                }}
                className="h-12 px-3.5 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none font-mono transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#44474d] uppercase tracking-wider">Tasa de interés nominal (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={simRate === 0 ? '' : simRate}
                placeholder="0"
                onChange={(e) => {
                  const val = e.target.value;
                  setSimRate(val === '' ? '' : Math.max(0, parseFloat(val) || 0));
                }}
                className="h-12 px-3.5 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg text-sm focus:bg-white focus:border-[#006a62] outline-none font-mono transition-colors"
              />
            </div>
          </div>

          {/* Salidas */}
          {Number(simAmount) > 0 && Number(simMonths) > 0 && Number(simRate) > 0 ? (
            <div className="bg-[#f1f4f6] p-6 rounded-lg flex flex-col justify-between relative border border-[#c4c6ce]/30 min-h-[175px]">
              <div>
                <p className="text-xs text-[#44474d] uppercase tracking-wider font-semibold mb-2">
                  {simType === 'loan' ? 'Cuota Mensual Estimada' : 'Ganancia Promedio Mensual'}
                </p>
                <p className="text-3xl font-bold text-[#031935] font-mono leading-none mb-6">
                  {formatAmount(monthlyPayment)}
                </p>
              </div>

              <div className="space-y-3 border-t border-[#c4c6ce]/50 pt-4 w-full">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#44474d] font-semibold">Tasa aplicada:</span>
                  <span className="font-mono font-bold text-[#031935] bg-white px-2 py-1 rounded border border-[#c4c6ce]/40">
                    {simRate}%
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#44474d] font-semibold">Interés Neto:</span>
                  <span className="font-mono font-bold text-[#ba1a1a] bg-white px-2 py-1 rounded border border-[#c4c6ce]/40">
                    {formatAmount(totalAccumulated - Number(simAmount))}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#44474d] font-semibold">Monto total a pagar:</span>
                  <span className="font-mono font-bold text-[#006a62] bg-white px-2 py-1 rounded border border-[#c4c6ce]/40 text-sm">
                    {formatAmount(totalAccumulated)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#f1f4f6] p-6 rounded-lg flex flex-col justify-center items-center text-center relative border border-[#c4c6ce]/30 min-h-[175px]">
              <span className="material-symbols-outlined text-[#75777e] text-3xl mb-2">calculate</span>
              <p className="text-xs font-bold text-[#031935] uppercase tracking-wider mb-1">Esperando datos</p>
              <p className="text-xs text-[#75777e] max-w-xs leading-relaxed">
                Ingresa un monto principal, un plazo y una tasa de interés mayores a 0 para activar los cálculos automáticamente y mostrar la simulación en tiempo real.
              </p>
            </div>
          )}

        </div>

        {/* Tabla de Amortización / Proyección */}
        {Number(simAmount) > 0 && Number(simMonths) > 0 && Number(simRate) > 0 && (
          <div className="border-t border-[#ebeef0] pt-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006a62] text-xl">table_chart</span>
              <h3 className="text-sm font-bold text-[#031935]">
                {simType === 'loan' ? 'Tabla de Amortización' : 'Proyección de Rendimiento Mensual'}
              </h3>
            </div>
            
            <div className="overflow-x-auto rounded-lg border border-[#c4c6ce] max-h-[320px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#f1f4f6] sticky top-0 z-10 border-b border-[#c4c6ce] text-[#44474d]">
                  {simType === 'loan' ? (
                    <tr>
                      <th className="p-3 font-semibold text-center w-16">Mes</th>
                      <th className="p-3 font-semibold text-right">Cuota</th>
                      <th className="p-3 font-semibold text-right">Interés</th>
                      <th className="p-3 font-semibold text-right">Amortización</th>
                      <th className="p-3 font-semibold text-right">Saldo Pendiente</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="p-3 font-semibold text-center w-16">Mes</th>
                      <th className="p-3 font-semibold text-right">Saldo Inicial</th>
                      <th className="p-3 font-semibold text-right">Interés Ganado</th>
                      <th className="p-3 font-semibold text-right">Saldo Acumulado</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-[#ebeef0] bg-white text-[#031935]">
                  {simType === 'loan' ? (
                    generateAmortizationTable().map((row) => (
                      <tr key={row.period} className="hover:bg-slate-50 font-mono">
                        <td className="p-3 text-center text-[#75777e] font-sans font-semibold">{row.period}</td>
                        <td className="p-3 text-right">{formatAmount(row.payment)}</td>
                        <td className="p-3 text-right text-[#ba1a1a]">{formatAmount(row.interestPaid)}</td>
                        <td className="p-3 text-right text-[#006a62]">{formatAmount(row.principalPaid)}</td>
                        <td className="p-3 text-right text-[#44474d]">{formatAmount(row.remainingBalance)}</td>
                      </tr>
                    ))
                  ) : (
                    generateInvestmentTable().map((row) => (
                      <tr key={row.period} className="hover:bg-slate-50 font-mono">
                        <td className="p-3 text-center text-[#75777e] font-sans font-semibold">{row.period}</td>
                        <td className="p-3 text-right text-[#44474d]">{formatAmount(row.initialBalance)}</td>
                        <td className="p-3 text-right text-[#006a62]">{formatAmount(row.interestEarned)}</td>
                        <td className="p-3 text-right font-bold text-[#1b2e4b]">{formatAmount(row.finalBalance)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <p className="text-[10px] text-[#75777e] italic">
              * Nota: Esta simulación es meramente informativa. Los valores reales pueden variar según la entidad bancaria.
            </p>
          </div>
        )}
      </section>

    </div>
  );
}
