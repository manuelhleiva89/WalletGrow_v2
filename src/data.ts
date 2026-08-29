/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Account, Transaction, Goal, CryptoAsset, FixedTermInvestment, Subscription, UserPreferences, Category } from './types';

export const INITIAL_PREFERENCES: UserPreferences = {
  currency: 'USD',
  showDecimals: true,
  biometricAuth: false,
  appLockEnabled: false,
  appLockPassword: '',
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Alimentación', icon: 'restaurant', color: 'bg-amber-100 text-amber-700', type: 'expense' },
  { id: 'cat-2', name: 'Transporte', icon: 'directions_car', color: 'bg-blue-100 text-blue-700', type: 'expense' },
  { id: 'cat-3', name: 'Vivienda', icon: 'home', color: 'bg-purple-100 text-purple-700', type: 'expense' },
  { id: 'cat-4', name: 'Salario', icon: 'payments', color: 'bg-emerald-100 text-emerald-700', type: 'income' },
  { id: 'cat-5', name: 'Ocio', icon: 'sports_esports', color: 'bg-rose-100 text-rose-700', type: 'expense' },
  { id: 'cat-6', name: 'Salud', icon: 'health_and_safety', color: 'bg-teal-100 text-teal-700', type: 'expense' },
  { id: 'cat-7', name: 'Inversiones', icon: 'trending_up', color: 'bg-indigo-100 text-indigo-700', type: 'income' },
  { id: 'cat-8', name: 'Venta / Negocio', icon: 'storefront', color: 'bg-cyan-100 text-cyan-700', type: 'income' },
  { id: 'cat-9', name: 'Otros Ingresos', icon: 'add_card', color: 'bg-pink-100 text-pink-700', type: 'income' },
];

export const INITIAL_ACCOUNTS: Account[] = [];

export const INITIAL_GOALS: Goal[] = [];

export const INITIAL_CRYPTO: CryptoAsset[] = [];

export const INITIAL_FIXED_TERM: FixedTermInvestment[] = [];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];
