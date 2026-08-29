/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  accountId: string;
  toAccountId?: string; // used for transfers
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  accountId: string;
  category?: string;
  deadline?: string; // e.g. "OCT 2024"
}

export interface Account {
  id: string;
  name: string;
  type: 'credit' | 'checking' | 'savings' | 'cash';
  balance: number; // For credit cards, this can represent the current debt
  cardNumber?: string; // e.g. "**** **** **** 4920"
  bankName?: string; // e.g. "Global Bank"
  ownerName: string;
  dueDate?: string; // e.g. "15 Oct"
  cutoffDate?: string; // e.g. "5th of mo."
  apr?: number; // interest rate, e.g. 18.9
  limit?: number; // Total available credit (for credit cards)
  color?: string; // custom hex color or tailwind class
  icon?: string; // custom material symbol name
}

export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  valueUsd: number;
  change24h: number;
  purchasePrice?: number;
  purchaseDate?: string;
  exchange?: string;
  gasFee?: number;
  notes?: string;
}

export interface FixedTermInvestment {
  id: string;
  amount: number;
  annualRate: number;
  dueDate: string;
  accumulatedYield: number;
  name?: string;
  bank?: string;
  depositType?: string;
  termValue?: number;
  termUnit?: 'days' | 'months';
  startDate?: string;
  accountId?: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: string;
  nextBillingDate: string;
  category: string;
  icon: string;
  accountId?: string;
}

export interface UserPreferences {
  currency: string;
  showDecimals: boolean;
  biometricAuth: boolean;
  appLockEnabled?: boolean;
  appLockPassword?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type?: 'income' | 'expense' | 'both';
}
