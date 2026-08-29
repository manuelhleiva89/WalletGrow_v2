/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Movimientos from './components/Movimientos';
import Cuentas from './components/Cuentas';
import Metas from './components/Metas';
import Inversiones from './components/Inversiones';
import Pagos from './components/Pagos';
import Ajustes from './components/Ajustes';
import TransactionModal from './components/TransactionModal';
import AppLockScreen from './components/AppLockScreen';
import WelcomeModal from './components/WelcomeModal';

import {
  INITIAL_PREFERENCES,
  INITIAL_CATEGORIES,
  INITIAL_ACCOUNTS,
  INITIAL_GOALS,
  INITIAL_CRYPTO,
  INITIAL_FIXED_TERM,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_TRANSACTIONS,
} from './data';

import {
  Account,
  Transaction,
  Goal,
  CryptoAsset,
  FixedTermInvestment,
  Subscription,
  UserPreferences,
  Category,
} from './types';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  // Core App states initialized with defaults
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>(INITIAL_CRYPTO);
  const [fixedTermInvestments, setFixedTermInvestments] = useState<FixedTermInvestment[]>(INITIAL_FIXED_TERM);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);
  const [preferences, setPreferences] = useState<UserPreferences>(INITIAL_PREFERENCES);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [isAppLocked, setIsAppLocked] = useState(false);

  // Tab navigation states
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Transaction Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalDefaultType, setTxModalDefaultType] = useState<'income' | 'expense' | 'transfer'>('expense');

  // Welcome Modal state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Check login state on mount
  useEffect(() => {
    const activeEmail = localStorage.getItem('profin_active_email');
    const savedName = localStorage.getItem('profin_user_name');
    if (activeEmail && savedName) {
      setUserEmail(activeEmail);
      setUserName(savedName);
      setIsLoggedIn(true);
    }
  }, []);

  // Load and sync specific user's database from localStorage when logging in
  useEffect(() => {
    if (!isLoggedIn || !userEmail) return;

    const emailLower = userEmail.toLowerCase();
    const storedStr = localStorage.getItem(`profin_data_${emailLower}`);
    if (storedStr) {
      try {
        const stored = JSON.parse(storedStr);
        
        // Helper to check if an ID is user-created (not preloaded/mock)
        // User created IDs look like "acc-1723223..." (length >= 14)
        // Preloaded look like "acc-1", "acc-ml-1", "tx-ml-1" etc. (length < 14)
        const isUserCreated = (id: string) => {
          if (!id) return false;
          return id.length >= 14;
        };

        if (stored.accounts) {
          setAccounts(stored.accounts.filter((item: any) => isUserCreated(item.id)));
        } else {
          setAccounts(INITIAL_ACCOUNTS);
        }

        if (stored.transactions) {
          setTransactions(stored.transactions.filter((item: any) => isUserCreated(item.id)));
        } else {
          setTransactions(INITIAL_TRANSACTIONS);
        }

        if (stored.goals) {
          setGoals(stored.goals.filter((item: any) => isUserCreated(item.id)));
        } else {
          setGoals(INITIAL_GOALS);
        }

        if (stored.cryptoAssets) {
          setCryptoAssets(stored.cryptoAssets.filter((item: any) => isUserCreated(item.id)));
        } else {
          setCryptoAssets(INITIAL_CRYPTO);
        }

        if (stored.fixedTermInvestments) {
          setFixedTermInvestments(stored.fixedTermInvestments.filter((item: any) => isUserCreated(item.id)));
        } else {
          setFixedTermInvestments(INITIAL_FIXED_TERM);
        }

        if (stored.subscriptions) {
          setSubscriptions(stored.subscriptions.filter((item: any) => isUserCreated(item.id)));
        } else {
          setSubscriptions(INITIAL_SUBSCRIPTIONS);
        }

        if (stored.preferences) {
          setPreferences(stored.preferences);
          if (stored.preferences.appLockEnabled) {
            setIsAppLocked(true);
          }
        }
        if (stored.categories) setCategories(stored.categories);
      } catch (err) {
        console.error('Failed to parse stored profin data', err);
      }
    } else {
      // First time login for this specific email: Load defaults
      setAccounts(INITIAL_ACCOUNTS);
      setTransactions(INITIAL_TRANSACTIONS);
      setGoals(INITIAL_GOALS);
      setCryptoAssets(INITIAL_CRYPTO);
      setFixedTermInvestments(INITIAL_FIXED_TERM);
      setSubscriptions(INITIAL_SUBSCRIPTIONS);
      setPreferences(INITIAL_PREFERENCES);
      setCategories(INITIAL_CATEGORIES);
    }
  }, [isLoggedIn, userEmail]);

  // Persist updated data automatically when state modifications occur
  useEffect(() => {
    if (!isLoggedIn || !userEmail) return;

    const emailLower = userEmail.toLowerCase();
    const dataObj = {
      accounts,
      transactions,
      goals,
      cryptoAssets,
      fixedTermInvestments,
      subscriptions,
      preferences,
      categories,
    };
    localStorage.setItem(`profin_data_${emailLower}`, JSON.stringify(dataObj));
  }, [
    accounts,
    transactions,
    goals,
    cryptoAssets,
    fixedTermInvestments,
    subscriptions,
    preferences,
    categories,
    isLoggedIn,
    userEmail,
  ]);

  const handleLoginSuccess = (email: string) => {
    const emailLower = email.toLowerCase();
    localStorage.setItem('profin_active_email', emailLower);

    let name = 'John Doe';
    if (emailLower !== 'demo@profin.com' && emailLower !== 'demo@walletgrow.com') {
      const users = JSON.parse(localStorage.getItem('profin_users') || '{}');
      name = users[emailLower]?.name || 'Usuario';
    } else {
      localStorage.setItem('profin_user_name', 'John Doe');
    }

    setUserName(name);
    setUserEmail(emailLower);
    setIsLoggedIn(true);
    setActiveTab('dashboard');
    setShowWelcomeModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('profin_active_email');
    localStorage.removeItem('profin_user_name');
    setIsLoggedIn(false);
    setUserEmail('');
    setUserName('');
  };

  const handleClearAllData = () => {
    const emailLower = userEmail.toLowerCase();
    localStorage.removeItem(`profin_data_${emailLower}`);
    localStorage.removeItem('profin_active_email');
    localStorage.removeItem('profin_user_name');
    setIsLoggedIn(false);
    setUserEmail('');
    setUserName('');

    // Reset components to initial default state variables
    setAccounts(INITIAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setGoals(INITIAL_GOALS);
    setCryptoAssets(INITIAL_CRYPTO);
    setFixedTermInvestments(INITIAL_FIXED_TERM);
    setSubscriptions(INITIAL_SUBSCRIPTIONS);
    setPreferences(INITIAL_PREFERENCES);
    setCategories(INITIAL_CATEGORIES);
  };

  // Currency utility formatting
  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'BRL': return 'R$';
      case 'PEN': return 'S/.';
      default: return '$';
    }
  };

  const currencySymbol = getCurrencySymbol(preferences.currency);

  const formatAmount = (amount: number) => {
    const symbol = getCurrencySymbol(preferences.currency);
    const options = {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    return `${symbol}${amount.toLocaleString('en-US', options)}`;
  };

  // Modal Open Handlers
  const handleOpenTxModal = (type: 'income' | 'expense' | 'transfer') => {
    setTxModalDefaultType(type);
    setIsTxModalOpen(true);
  };

  // State mutation callbacks
  const handleAddAccount = (newAcc: Omit<Account, 'id'>) => {
    const account: Account = {
      ...newAcc,
      id: `acc-${Date.now()}`,
    };
    setAccounts((prev) => [...prev, account]);
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  const handleUpdateAccount = (updatedAcc: Account) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === updatedAcc.id ? updatedAcc : acc))
    );
  };

  const handleAddGoal = (newGoal: Omit<Goal, 'id'>) => {
    const goal: Goal = {
      ...newGoal,
      id: `goal-${Date.now()}`,
    };
    setGoals((prev) => [...prev, goal]);
  };

  const handleUpdateGoalProgress = (goalId: string, newAmount: number, sourceAccountId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const difference = newAmount - goal.currentAmount;

    // Update goals current value
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, currentAmount: newAmount } : g)));

    // Deduct funded amount from source checking account balance
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === sourceAccountId) {
          return { ...acc, balance: acc.balance - difference };
        }
        return acc;
      })
    );

    // Create tracking audit transaction
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      description: `Fondo reservado: ${goal.name}`,
      amount: difference,
      type: 'transfer',
      category: goal.category,
      accountId: sourceAccountId,
      toAccountId: goal.accountId,
      date: new Date().toISOString().split('T')[0],
      notes: `Aporte voluntario a meta de ahorro: ${goal.name}`,
    };
    setTransactions((prev) => [tx, ...prev]);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
    );
  };

  const handleAddCryptoAsset = (newAsset: Omit<CryptoAsset, 'id'>) => {
    const asset: CryptoAsset = {
      ...newAsset,
      id: `cr-${Date.now()}`,
    };
    setCryptoAssets((prev) => [...prev, asset]);
  };

  const handleUpdateCryptoAsset = (updatedAsset: CryptoAsset) => {
    setCryptoAssets((prev) =>
      prev.map((asset) => (asset.id === updatedAsset.id ? updatedAsset : asset))
    );
  };

  const handleDeleteCryptoAsset = (id: string) => {
    setCryptoAssets((prev) => prev.filter((asset) => asset.id !== id));
  };

  const handleAddFixedTermInvestment = (newInv: Omit<FixedTermInvestment, 'id'>) => {
    const inv: FixedTermInvestment = {
      ...newInv,
      id: `ft-${Date.now()}`,
    };
    setFixedTermInvestments((prev) => [...prev, inv]);

    if (newInv.accountId) {
      const tx: Transaction = {
        id: `tx-ft-${Date.now()}`,
        description: `Depósito Plazo Fijo: ${newInv.name || 'Inversión'}`,
        amount: newInv.amount,
        type: 'expense',
        category: 'Inversiones',
        accountId: newInv.accountId,
        date: newInv.startDate || new Date().toISOString().split('T')[0],
        notes: `Inversión en ${newInv.bank || 'Banco Emisor'} con tasa ${newInv.annualRate}% por ${newInv.termValue} ${newInv.termUnit === 'months' ? 'meses' : 'días'}.`,
      };
      setTransactions((prev) => [tx, ...prev]);

      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === newInv.accountId) {
            return { ...acc, balance: acc.balance - newInv.amount };
          }
          return acc;
        })
      );
    }
  };

  const handleDeleteFixedTermInvestment = (id: string) => {
    setFixedTermInvestments((prev) => prev.filter((inv) => inv.id !== id));
  };

  const handleUpdatePreferences = (updatedPrefs: Partial<UserPreferences>) => {
    setPreferences((prev) => ({
      ...prev,
      ...updatedPrefs,
    }));
  };

  const handleAddCategory = (newCat: Omit<Category, 'id'>) => {
    const cat: Category = {
      ...newCat,
      id: `cat-${Date.now()}`,
    };
    setCategories((prev) => [...prev, cat]);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateCategory = (updatedCat: Category) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
    );
  };

  const handleAddSubscription = (newSub: Omit<Subscription, 'id'>) => {
    const sub: Subscription = {
      ...newSub,
      id: `sub-${Date.now()}`,
    };
    setSubscriptions((prev) => [...prev, sub]);
  };

  const handleDeleteSubscription = (id: string) => {
    setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
  };

  const handleUpdateSubscription = (updatedSub: Subscription) => {
    setSubscriptions((prev) =>
      prev.map((sub) => (sub.id === updatedSub.id ? updatedSub : sub))
    );
  };

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const tx: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
    };

    setTransactions((prev) => [tx, ...prev]);

    // Readjust relevant accounts balance
    setAccounts((prev) =>
      prev.map((acc) => {
        // Source account modification
        if (acc.id === tx.accountId) {
          if (tx.type === 'income') {
            return { ...acc, balance: acc.balance + tx.amount };
          } else if (tx.type === 'expense' || tx.type === 'transfer') {
            return { ...acc, balance: acc.balance - tx.amount };
          }
        }
        // Destination account modification (transfers)
        if (tx.type === 'transfer' && acc.id === tx.toAccountId) {
          return { ...acc, balance: acc.balance + tx.amount };
        }
        return acc;
      })
    );
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // Reverse effects of deletion on accounts
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === tx.accountId) {
          if (tx.type === 'income') {
            return { ...acc, balance: acc.balance - tx.amount };
          } else if (tx.type === 'expense' || tx.type === 'transfer') {
            return { ...acc, balance: acc.balance + tx.amount };
          }
        }
        if (tx.type === 'transfer' && acc.id === tx.toAccountId) {
          return { ...acc, balance: acc.balance - tx.amount };
        }
        return acc;
      })
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            accounts={accounts}
            transactions={transactions}
            goals={goals}
            cryptoAssets={cryptoAssets}
            fixedTermInvestments={fixedTermInvestments}
            categories={categories}
            onOpenTransactionModal={handleOpenTxModal}
            onNavigateToTab={(tabId) => setActiveTab(tabId)}
            currencySymbol={currencySymbol}
            formatAmount={formatAmount}
          />
        );
      case 'movimientos':
        return (
          <Movimientos
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            onOpenTransactionModal={handleOpenTxModal}
            onDeleteTransaction={handleDeleteTransaction}
            currencySymbol={currencySymbol}
            formatAmount={formatAmount}
          />
        );
      case 'cuentas':
        return (
          <Cuentas
            accounts={accounts}
            transactions={transactions}
            onAddAccount={handleAddAccount}
            onDeleteAccount={handleDeleteAccount}
            onUpdateAccount={handleUpdateAccount}
            currencySymbol={currencySymbol}
            formatAmount={formatAmount}
          />
        );
      case 'metas':
        return (
          <Metas
            goals={goals}
            accounts={accounts}
            onAddGoal={handleAddGoal}
            onUpdateGoalProgress={handleUpdateGoalProgress}
            onDeleteGoal={handleDeleteGoal}
            onUpdateGoal={handleUpdateGoal}
            currencySymbol={currencySymbol}
            formatAmount={formatAmount}
          />
        );
      case 'inversiones':
        return (
          <Inversiones
            cryptoAssets={cryptoAssets}
            fixedTermInvestments={fixedTermInvestments}
            accounts={accounts}
            onAddCryptoAsset={handleAddCryptoAsset}
            onUpdateCryptoAsset={handleUpdateCryptoAsset}
            onDeleteCryptoAsset={handleDeleteCryptoAsset}
            onAddFixedTermInvestment={handleAddFixedTermInvestment}
            onDeleteFixedTermInvestment={handleDeleteFixedTermInvestment}
            currencySymbol={currencySymbol}
            formatAmount={formatAmount}
          />
        );
      case 'pagos':
        return (
          <Pagos
            subscriptions={subscriptions}
            accounts={accounts}
            onAddSubscription={handleAddSubscription}
            onDeleteSubscription={handleDeleteSubscription}
            onUpdateSubscription={handleUpdateSubscription}
            onUpdateAccount={handleUpdateAccount}
            onAddTransaction={handleAddTransaction}
            currencySymbol={currencySymbol}
            formatAmount={formatAmount}
          />
        );
      case 'ajustes':
        return (
          <Ajustes
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onUpdateCategory={handleUpdateCategory}
            onClearAllData={handleClearAllData}
          />
        );
      default:
        return null;
    }
  };

  // Render Login flow if session not present
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Render Lock screen if app is locked
  if (isAppLocked && preferences.appLockEnabled) {
    return (
      <AppLockScreen
        biometricEnabled={!!preferences.biometricAuth}
        correctPassword={preferences.appLockPassword}
        userName={userName}
        onUnlock={() => setIsAppLocked(false)}
      />
    );
  }

  const navigationTabs = [
    { id: 'dashboard', name: 'Resumen', icon: 'dashboard' },
    { id: 'movimientos', name: 'Movimiento', icon: 'receipt_long' },
    { id: 'cuentas', name: 'Cuentas y tarjetas', icon: 'credit_card' },
    { id: 'pagos', name: 'Pagos Recurrentes', icon: 'autorenew' },
    { id: 'metas', name: 'Metas', icon: 'track_changes' },
    { id: 'inversiones', name: 'Inversiones', icon: 'show_chart' },
    { id: 'ajustes', name: 'Ajustes', icon: 'settings' },
  ];

  return (
    <div id="app_root" className="min-h-screen bg-[#f7fafc] font-sans flex flex-col">
      {/* Top Header */}
      <header id="app_header" className="sticky top-0 z-40 bg-white border-b border-[#e0e3e5] pt-[env(safe-area-inset-top,0px)]">
        <div className="h-16 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-1.5 text-[#031935] hover:bg-[#f1f4f6] rounded-lg transition-colors focus:outline-none"
              aria-label="Toggle Sidebar"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <div className="flex items-center gap-2">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0s2dzudEzRhnFBfSTbJ6CtifGk5oHqwL6rvPCSTjcgx-RYzFus3nQJ_yk1UvC-aSc0Zzd-Qp7LbO1HTrhk5JQxFklUQM8AxpSaTFRNRQEZMSKuVvQZHAEAkjh9Xm7dDtmcTTWkbrfd1HUTqbiYrFSUNXlb-yX99DQ939cF0W_Biaca2_wdWnuJeam7NCuHgSBlI6kRHfwD_wh15hAyp0_YX7qgA8CgTnmc3VYB5gsYZ9noacK5O2aSSWFNo4l-TWwpb4"
                className="w-8 h-8 rounded-lg object-contain border border-[#e0e3e5]"
                alt="WalletGrow Logo"
              />
              <span className="text-lg font-extrabold text-[#031935] tracking-tight">WalletGrow</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#031935]">{userName}</p>
              <p className="text-[10px] text-[#75777e]">{userEmail}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#1b2e4b] text-[#84f5e8] font-bold flex items-center justify-center text-sm shadow-inner select-none">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-[#75777e] hover:text-[#ba1a1a] hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold focus:outline-none"
              title="Cerrar Sesión"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Persistent Navigation & Tabs container */}
      <div id="navigation_container" className="flex-1 flex relative">
        {/* Sidebar Nav */}
        <aside
          id="app_sidebar"
          className={`
            fixed md:sticky top-[calc(64px+env(safe-area-inset-top,0px))] left-0 h-[calc(100vh-(64px+env(safe-area-inset-top,0px)))] w-64 bg-white border-r border-[#e0e3e5] z-30 transition-transform duration-300 flex-shrink-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <nav className="p-4 space-y-1.5 h-full flex flex-col justify-between">
            <div className="space-y-1">
              {navigationTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsSidebarOpen(false); // auto close on mobile overlay click
                    }}
                    className={`
                      w-full h-11 px-4 rounded-xl flex items-center gap-3 text-xs font-bold transition-all duration-150 focus:outline-none select-none
                      ${
                        isActive
                          ? 'bg-[#1b2e4b] text-white shadow-sm font-bold'
                          : 'text-[#44474d] hover:bg-[#f1f4f6] hover:text-[#031935]'
                      }
                    `}
                  >
                    <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill' : ''}`}>
                      {tab.icon}
                    </span>
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-[#ebeef0] pt-4 pb-2 px-2 text-center">
              <p className="text-[10px] text-[#75777e] font-sans font-semibold">WalletGrow • Finanzas Inteligentes</p>
            </div>
          </nav>
        </aside>

        {/* Mobile Sidebar backdrop/overlay shadow */}
        {isSidebarOpen && (
          <div
            id="sidebar_backdrop"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 top-[calc(64px+env(safe-area-inset-top,0px))] bg-black/25 backdrop-blur-xs z-20 md:hidden transition-opacity"
          ></div>
        )}

        {/* Main Workspace Frame */}
        <main id="app_workspace" className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderTabContent()}
        </main>
      </div>

      {/* Global Transaction Creator Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        defaultType={txModalDefaultType}
        accounts={accounts}
        categories={categories}
        onAddTransaction={handleAddTransaction}
        currencySymbol={currencySymbol}
      />

      {/* Welcome Modal after login */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        userName={userName}
        userEmail={userEmail}
      />
    </div>
  );
}
