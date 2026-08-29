/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Category, UserPreferences } from '../types';

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($) - Dólar Estadounidense' },
  { value: 'EUR', label: 'EUR (€) - Euro' },
  { value: 'GBP', label: 'GBP (£) - Libra Esterlina' },
  { value: 'ARS', label: 'ARS ($) - Peso Argentino' },
  { value: 'MXN', label: 'MXN ($) - Peso Mexicano' },
  { value: 'COP', label: 'COP ($) - Peso Colombiano' },
  { value: 'CLP', label: 'CLP ($) - Peso Chileno' },
  { value: 'BRL', label: 'BRL (R$) - Real Brasileño' },
  { value: 'PEN', label: 'PEN (S/.) - Sol Peruano' },
  { value: 'UYU', label: 'UYU ($) - Peso Uruguayo' },
];

const getCurrencySymbol = (curr: string) => {
  switch (curr) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'BRL': return 'R$';
    case 'PEN': return 'S/.';
    default: return '$';
  }
};

const getCurrencyLabel = (val: string) => {
  return CURRENCY_OPTIONS.find(opt => opt.value === val)?.label || val;
};

interface AjustesProps {
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
  onUpdateCategory: (category: Category) => void;
  onClearAllData: () => void;
}

export default function Ajustes({
  preferences,
  onUpdatePreferences,
  categories,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
  onClearAllData,
}: AjustesProps) {
  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('category');
  const [newCatColor, setNewCatColor] = useState('bg-blue-100 text-blue-700');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [catFilter, setCatFilter] = useState<'all' | 'expense' | 'income'>('all');

  // Category editing state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('category');
  const [editCatColor, setEditCatColor] = useState('bg-blue-100 text-blue-700');
  const [editCatType, setEditCatType] = useState<'income' | 'expense'>('expense');

  // App lock PIN state
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinInput, setPinInput] = useState(preferences.appLockPassword || '');

  // Delete verification modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationWord, setDeleteConfirmationWord] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Currency selector dropdown state
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    onAddCategory({
      name: newCatName,
      icon: newCatIcon,
      color: newCatColor,
      type: newCatType,
    });

    setNewCatName('');
    setShowCatForm(false);
    alert(`¡Categoría "${newCatName}" creada con éxito!`);
  };

  const handleEditClick = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatIcon(cat.icon);
    setEditCatColor(cat.color);
    setEditCatType(cat.type === 'income' ? 'income' : 'expense');
  };

  const handleSaveEditCategory = (id: string) => {
    if (!editCatName.trim()) return;
    onUpdateCategory({
      id,
      name: editCatName,
      icon: editCatIcon,
      color: editCatColor,
      type: editCatType,
    });
    setEditingCatId(null);
  };

  const handleToggleAppLock = (enabled: boolean) => {
    if (enabled) {
      setPinInput(preferences.appLockPassword || '');
      setShowPinInput(true);
    } else {
      onUpdatePreferences({
        appLockEnabled: false,
        appLockPassword: '',
      });
    }
  };

  const handleSavePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length !== 4 || isNaN(Number(pinInput))) {
      alert('El PIN debe ser un código de exactamente 4 números.');
      return;
    }
    onUpdatePreferences({
      appLockEnabled: true,
      appLockPassword: pinInput,
    });
    setShowPinInput(false);
    alert('🔒 ¡Bloqueo por PIN activado con éxito! El sistema solicitará este PIN en su siguiente inicio.');
  };

  const handleConfirmDeleteAll = () => {
    if (deleteConfirmationWord.trim().toUpperCase() === 'ELIMINAR') {
      setShowDeleteModal(false);
      onClearAllData();
      alert('Todos los datos de su cuenta han sido eliminados de forma permanente.');
    }
  };

  return (
    <div id="ajustes_tab" className="space-y-6 pt-4 relative">
      
      {/* Cabecera */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#031935] tracking-tight">Ajustes</h1>
        <p className="text-xs text-[#44474d]">Gestione sus preferencias regionales, categorías personalizadas y seguridad.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Preferencias Regionales */}
        <section className="bg-white border border-[#c4c6ce] rounded-xl shadow-sm relative">
          <div className="p-4 border-b border-[#ebeef0] bg-[#f1f4f6]/30 rounded-t-xl">
            <h2 className="text-sm font-bold text-[#031935] uppercase tracking-wide flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006a62]">language</span>
              Preferencias Regionales
            </h2>
          </div>
          <div className="p-5 flex flex-col gap-5">
            
            {/* Moneda Principal */}
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs font-semibold text-[#44474d] uppercase tracking-wider">Moneda Principal</label>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                  className="w-full h-12 bg-[#f1f4f6] border border-[#c4c6ce] rounded-lg px-4 text-sm font-semibold text-[#031935] hover:bg-[#e4e7eb] flex items-center justify-between transition-colors outline-none cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[#006a62] font-bold text-base">{getCurrencySymbol(preferences.currency)}</span>
                    <span>{getCurrencyLabel(preferences.currency)}</span>
                  </span>
                  <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: isCurrencyDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                    keyboard_arrow_down
                  </span>
                </button>

                {isCurrencyDropdownOpen && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div 
                      className="fixed inset-0 z-20" 
                      onClick={() => setIsCurrencyDropdownOpen(false)}
                    />
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-[#c4c6ce] rounded-lg shadow-lg z-30 max-h-60 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      {CURRENCY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            onUpdatePreferences({ currency: opt.value });
                            setIsCurrencyDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-xs font-semibold flex items-center justify-between hover:bg-[#f1f4f6] transition-colors cursor-pointer ${preferences.currency === opt.value ? 'bg-[#006a62]/10 text-[#006a62]' : 'text-[#031935]'}`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-[#006a62] font-bold text-sm w-8">{getCurrencySymbol(opt.value)}</span>
                            <span>{opt.label}</span>
                          </span>
                          {preferences.currency === opt.value && (
                            <span className="material-symbols-outlined text-[16px] text-[#006a62]">check</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* Seguridad */}
        <section className="bg-white border border-[#c4c6ce] rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#ebeef0] bg-[#f1f4f6]/30">
            <h2 className="text-sm font-bold text-[#031935] uppercase tracking-wide flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1b2e4b]">shield</span>
              Seguridad de Acceso
            </h2>
          </div>
          <div className="p-5 flex flex-col gap-5">
            
            {/* Bloqueo por PIN de aplicación */}
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="block text-sm font-bold text-[#031935]">Bloqueo de Aplicación</span>
                <span className="text-xs text-[#75777e]">Exige PIN de seguridad al iniciar la aplicación</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={!!preferences.appLockEnabled}
                  onChange={(e) => handleToggleAppLock(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#e0e3e5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006a62]"></div>
              </label>
            </div>

            {/* Biometría Toggle */}
            <div className="flex items-center justify-between py-2 border-t border-[#ebeef0] pt-4">
              <div>
                <span className={`block text-sm font-bold ${preferences.appLockEnabled ? 'text-[#031935]' : 'text-gray-400'}`}>
                  Autenticación Biométrica local
                </span>
                <span className="text-xs text-[#75777e]">Habilita acceso simulado por huella o Face ID</span>
              </div>
              <label className={`relative inline-flex items-center select-none ${preferences.appLockEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                <input 
                  type="checkbox" 
                  disabled={!preferences.appLockEnabled}
                  checked={!!preferences.biometricAuth}
                  onChange={(e) => onUpdatePreferences({ biometricAuth: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#e0e3e5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006a62]"></div>
              </label>
            </div>

          </div>
        </section>

      </div>

      {/* Categorías Personalizadas */}
      <section className="bg-white border border-[#c4c6ce] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#ebeef0] bg-[#f1f4f6]/30 flex justify-between items-center">
          <h2 className="text-sm font-bold text-[#031935] uppercase tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-[#cca830]">category</span>
            Gestión de Categorías
          </h2>
          <button 
            onClick={() => setShowCatForm(!showCatForm)}
            className="h-9 px-3 bg-[#1b2e4b] hover:bg-[#031935] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">{showCatForm ? 'close' : 'add'}</span>
            {showCatForm ? 'Cancelar' : 'Nueva'}
          </button>
        </div>

        <div className="p-5 space-y-4">
          
          {/* Formulario Inline de Creación de Categorías */}
          {showCatForm && (
            <form onSubmit={handleAddCategorySubmit} className="bg-[#f1f4f6] p-4 rounded-lg grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#44474d] uppercase">Nombre</label>
                <input 
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="ej. Educación, Ventas"
                  required
                  className="h-10 px-3 bg-white border border-[#c4c6ce] rounded-lg text-xs focus:border-[#006a62] outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#44474d] uppercase">Tipo de Categoría</label>
                <select 
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as 'income' | 'expense')}
                  className="h-10 px-3 bg-white border border-[#c4c6ce] rounded-lg text-xs outline-none font-semibold text-[#031935]"
                >
                  <option value="expense">📉 Gasto (-)</option>
                  <option value="income">📈 Ingreso (+)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#44474d] uppercase">Icono</label>
                <select 
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  className="h-10 px-3 bg-white border border-[#c4c6ce] rounded-lg text-xs outline-none"
                >
                  <option value="school">🎓 Educación</option>
                  <option value="pets">🐾 Mascotas</option>
                  <option value="local_mall">👜 Compras</option>
                  <option value="casino">🎲 Juego / Apuestas</option>
                  <option value="flight">✈️ Viajes</option>
                  <option value="work">💼 Negocios / Trabajo</option>
                  <option value="payments">💵 Salario / Pagos</option>
                  <option value="trending_up">📈 Inversiones</option>
                  <option value="storefront">🏪 Ventas / Comercio</option>
                  <option value="savings">🐷 Ahorro / Depósitos</option>
                  <option value="add_card">💳 Otros Ingresos</option>
                  <option value="restaurant">🍔 Alimentación / Comida</option>
                  <option value="health_and_safety">🩺 Salud / Bienestar</option>
                  <option value="directions_car">🚗 Transporte</option>
                  <option value="category">📦 Genérico</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#44474d] uppercase">Color Visual</label>
                <select 
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="h-10 px-3 bg-white border border-[#c4c6ce] rounded-lg text-xs outline-none"
                >
                  <option value="bg-blue-100 text-blue-700">Azul</option>
                  <option value="bg-emerald-100 text-emerald-700">Verde Esmeralda</option>
                  <option value="bg-rose-100 text-rose-700">Rojo</option>
                  <option value="bg-amber-100 text-amber-700">Naranja</option>
                  <option value="bg-purple-100 text-purple-700">Púrpura</option>
                  <option value="bg-teal-100 text-teal-700">Teal / Turquesa</option>
                  <option value="bg-cyan-100 text-cyan-700">Cian</option>
                  <option value="bg-pink-100 text-pink-700">Rosa</option>
                </select>
              </div>

              <div className="sm:col-span-4 flex justify-end gap-2 pt-2">
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#006a62] hover:bg-[#005049] text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Crear Categoría
                </button>
              </div>
            </form>
          )}

          {/* Filtro de Listado de Categorías */}
          <div className="flex flex-wrap gap-2 mb-4 border-b border-[#ebeef0] pb-3">
            <button
              onClick={() => setCatFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${catFilter === 'all' ? 'bg-[#1b2e4b] text-white' : 'text-[#44474d] hover:bg-[#f1f4f6]'}`}
            >
              Todas ({categories.length})
            </button>
            <button
              onClick={() => setCatFilter('expense')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${catFilter === 'expense' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'text-[#44474d] hover:bg-[#f1f4f6]'}`}
            >
              Gastos ({categories.filter(c => c.type !== 'income').length})
            </button>
            <button
              onClick={() => setCatFilter('income')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${catFilter === 'income' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'text-[#44474d] hover:bg-[#f1f4f6]'}`}
            >
              Ingresos ({categories.filter(c => c.type === 'income').length})
            </button>
          </div>

          {/* Listado de Categorías con opción de Edición Inline */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories
              .filter(cat => {
                if (catFilter === 'all') return true;
                const type = cat.type || 'expense';
                return type === catFilter;
              })
              .map((cat) => {
                const isIncome = cat.type === 'income';
                const isEditing = editingCatId === cat.id;

                if (isEditing) {
                  return (
                    <li 
                      key={cat.id}
                      className="flex flex-col gap-2 p-3.5 border-2 border-[#006a62] bg-[#f1f4f6]/40 rounded-xl shadow-xs"
                    >
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-[#44474d] uppercase">Nombre</label>
                        <input 
                          type="text"
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          className="h-8 px-2 bg-white border border-[#c4c6ce] rounded-lg text-xs outline-none focus:border-[#006a62]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-[#44474d] uppercase">Tipo</label>
                          <select 
                            value={editCatType}
                            onChange={(e) => setEditCatType(e.target.value as 'income' | 'expense')}
                            className="h-8 px-1 bg-white border border-[#c4c6ce] rounded-lg text-xs outline-none font-semibold text-[#031935]"
                          >
                            <option value="expense">Gasto</option>
                            <option value="income">Ingreso</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-[#44474d] uppercase">Color</label>
                          <select 
                            value={editCatColor}
                            onChange={(e) => setEditCatColor(e.target.value)}
                            className="h-8 px-1 bg-white border border-[#c4c6ce] rounded-lg text-xs outline-none text-[#031935]"
                          >
                            <option value="bg-blue-100 text-blue-700">Azul</option>
                            <option value="bg-emerald-100 text-emerald-700">Verde</option>
                            <option value="bg-rose-100 text-rose-700">Rojo</option>
                            <option value="bg-amber-100 text-amber-700">Naranja</option>
                            <option value="bg-purple-100 text-purple-700">Púrpura</option>
                            <option value="bg-teal-100 text-teal-700">Turquesa</option>
                            <option value="bg-cyan-100 text-cyan-700">Cian</option>
                            <option value="bg-pink-100 text-pink-700">Rosa</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-[#44474d] uppercase">Icono</label>
                        <select 
                          value={editCatIcon}
                          onChange={(e) => setEditCatIcon(e.target.value)}
                          className="h-8 px-2 bg-white border border-[#c4c6ce] rounded-lg text-xs outline-none"
                        >
                          <option value="school">🎓 Educación</option>
                          <option value="pets">🐾 Mascotas</option>
                          <option value="local_mall">👜 Compras</option>
                          <option value="casino">🎲 Juego</option>
                          <option value="flight">✈️ Viajes</option>
                          <option value="work">💼 Negocios</option>
                          <option value="payments">💵 Salario</option>
                          <option value="trending_up">📈 Inversiones</option>
                          <option value="storefront">🏪 Ventas</option>
                          <option value="savings">🐷 Ahorros</option>
                          <option value="add_card">💳 Otros Ingresos</option>
                          <option value="restaurant">🍔 Alimentación</option>
                          <option value="health_and_safety">🩺 Salud</option>
                          <option value="directions_car">🚗 Transporte</option>
                          <option value="category">📦 Genérico</option>
                        </select>
                      </div>

                      <div className="flex justify-end gap-1.5 mt-2.5">
                        <button
                          type="button"
                          onClick={() => handleSaveEditCategory(cat.id)}
                          className="h-8 px-2.5 bg-[#006a62] hover:bg-[#005049] text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">save</span>
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCatId(null)}
                          className="h-8 px-2.5 bg-white border border-[#c4c6ce] text-[#44474d] hover:bg-[#f1f4f6] text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </li>
                  );
                }

                return (
                  <li 
                    key={cat.id} 
                    className="flex items-center justify-between gap-2.5 p-3.5 border border-[#c4c6ce] rounded-xl hover:bg-[#f1f4f6]/50 transition-colors shadow-xs group min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cat.color} shadow-xs shrink-0`}>
                        <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-[#031935] truncate" title={cat.name}>{cat.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md w-fit mt-0.5 uppercase tracking-wide ${isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {isIncome ? 'Ingreso' : 'Gasto'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Botón de Editar */}
                      <button 
                        onClick={() => handleEditClick(cat)}
                        className="text-[#1b2e4b] hover:bg-slate-100 p-1.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                        title="Editar Categoría"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>

                      {/* Botón de Borrar */}
                      {categories.length > 1 && (
                        <button 
                          onClick={() => setCategoryToDelete(cat)}
                          className="text-[#ba1a1a] hover:bg-red-50 p-1.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                          title="Borrar Categoría"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      </section>

      {/* Zona Peligrosa */}
      <section className="border border-red-200 bg-red-50/40 rounded-xl p-5 mt-6">
        <h3 className="text-sm font-bold text-[#ba1a1a] uppercase tracking-wide mb-1 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px]">warning</span>
          Zona de Peligro
        </h3>
        <p className="text-xs text-[#44474d] mb-4">
          Esta acción es irreversible y eliminará todos sus datos financieros guardados, cuentas vinculadas e historial de transacciones.
        </p>
        <button 
          onClick={() => {
            setDeleteConfirmationWord('');
            setShowDeleteModal(true);
          }}
          className="h-11 px-5 border border-[#ba1a1a] text-[#ba1a1a] bg-white hover:bg-red-50 rounded-lg text-xs font-bold transition-all active:scale-95"
        >
          Eliminar todos los datos de mi cuenta
        </button>
      </section>

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-[#031935]/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-[#c4c6ce] rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5 pb-2 border-b border-[#ebeef0]">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 className="text-base font-bold text-[#ba1a1a]">¿Eliminar permanentemente todos los datos?</h3>
                <span className="text-[11px] text-[#44474d]">Esta acción es completamente irreversible.</span>
              </div>
            </div>

            <div className="text-xs text-[#44474d] space-y-2.5">
              <p>Al confirmar la eliminación, se vaciarán de forma definitiva los siguientes registros de su cuenta:</p>
              <ul className="grid grid-cols-1 gap-1.5 font-medium pl-1 bg-[#f1f4f6] p-3 rounded-xl border border-[#c4c6ce]/40 text-[#031935]">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-red-500">check_circle</span>
                  Registro completo de movimientos (ingresos y gastos)
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-red-500">check_circle</span>
                  Cuentas bancarias y tarjetas configuradas
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-red-500">check_circle</span>
                  Metas de ahorro acumuladas
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-red-500">check_circle</span>
                  Pagos recurrentes y suscripciones registradas
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-red-500">check_circle</span>
                  Carteras de inversiones en Criptomonedas y Plazos Fijos
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-red-500">check_circle</span>
                  Históricos de rendimiento y estadísticas de gráficos
                </li>
              </ul>
              <p className="text-[#75777e] leading-relaxed">
                Por seguridad, por favor escriba la palabra <strong className="text-[#031935]">"ELIMINAR"</strong> a continuación para confirmar y desbloquear la eliminación definitiva de su cuenta.
              </p>
            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <input 
                type="text"
                value={deleteConfirmationWord}
                onChange={(e) => setDeleteConfirmationWord(e.target.value)}
                placeholder='Escriba "ELIMINAR" aquí'
                className="w-full h-11 bg-white border border-[#c4c6ce] rounded-lg px-3.5 text-sm font-bold text-center tracking-wider text-[#ba1a1a] outline-none focus:border-[#ba1a1a]"
              />
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-[#ebeef0] mt-1">
              <button
                type="button"
                disabled={deleteConfirmationWord.trim().toUpperCase() !== 'ELIMINAR'}
                onClick={handleConfirmDeleteAll}
                className={`flex-1 h-11 text-xs font-bold rounded-lg shadow-xs transition-all active:scale-95 text-white ${
                  deleteConfirmationWord.trim().toUpperCase() === 'ELIMINAR'
                    ? 'bg-[#ba1a1a] hover:bg-[#93000a] cursor-pointer'
                    : 'bg-gray-300 cursor-not-allowed opacity-60'
                }`}
              >
                Sí, Eliminar Todo Permanentemente
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationWord('');
                }}
                className="flex-1 h-11 border border-[#c4c6ce] text-[#44474d] hover:bg-[#f1f4f6] text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered beautiful PIN Setup Dialog Modal */}
      {showPinInput && (
        <div className="fixed inset-0 z-50 bg-[#031935]/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-[#c4c6ce] rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 pb-2 border-b border-[#ebeef0]">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-[#006a62] shrink-0">
                <span className="material-symbols-outlined text-[24px]">lock</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#031935]">Configurar PIN</h3>
                <p className="text-[11px] text-[#44474d]">Establezca su código de acceso de 4 dígitos.</p>
              </div>
            </div>

            <form onSubmit={handleSavePinSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 items-center">
                <label className="text-xs font-semibold text-[#44474d] uppercase tracking-wider mb-1">Nuevo PIN numérico</label>
                <input 
                  type="password" 
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  required
                  autoFocus
                  className="w-40 h-14 bg-[#f1f4f6] border-2 border-[#c4c6ce] rounded-xl text-center text-3xl font-mono font-bold tracking-[0.5em] pl-4 outline-none focus:border-[#006a62] focus:bg-white transition-all shadow-inner"
                />
                <span className="text-[10px] text-[#75777e] mt-1 text-center">Introduzca exactamente 4 números</span>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-[#ebeef0]">
                <button 
                  type="submit"
                  className="flex-1 h-11 bg-[#006a62] hover:bg-[#005049] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Guardar PIN
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowPinInput(false);
                    if (!preferences.appLockPassword) {
                      onUpdatePreferences({ appLockEnabled: false });
                    }
                  }}
                  className="flex-1 h-11 border border-[#c4c6ce] text-[#44474d] hover:bg-[#f1f4f6] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Centered beautiful Category Deletion Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-[#031935]/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-[#c4c6ce] rounded-2xl shadow-2xl p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 pb-2 border-b border-[#ebeef0]">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-[#ba1a1a] shrink-0">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#031935]">¿Eliminar categoría?</h3>
                <p className="text-[11px] text-[#75777e]">Esta acción requiere su confirmación.</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-[#44474d] leading-relaxed">
                ¿Está seguro de que desea eliminar la categoría <strong className="text-[#031935]">"{categoryToDelete.name}"</strong>? Los movimientos asociados quedarán sin categorizar o se asignarán a la categoría por defecto.
              </p>

              {/* Visual preview of the category card */}
              <div className="flex items-center gap-3 p-3 bg-[#f1f4f6] rounded-xl border border-[#c4c6ce]/40">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${categoryToDelete.color || 'bg-blue-100 text-blue-700'}`}>
                  <span className="material-symbols-outlined text-[18px]">{categoryToDelete.icon || 'category'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#031935]">{categoryToDelete.name}</span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-[#75777e]">
                    {categoryToDelete.type === 'income' ? 'Ingreso' : 'Gasto'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-[#ebeef0]">
              <button 
                type="button"
                onClick={() => {
                  onDeleteCategory(categoryToDelete.id);
                  setCategoryToDelete(null);
                }}
                className="flex-1 h-11 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Sí, eliminar
              </button>
              <button 
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 h-11 border border-[#c4c6ce] text-[#44474d] hover:bg-[#f1f4f6] text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
