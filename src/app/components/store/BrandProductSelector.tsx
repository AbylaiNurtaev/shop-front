import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Plus, Check, ChevronDown, Package } from 'lucide-react';
import { Product, Category } from '../../types';
import api from '../../api/axios';

interface BrandProductSelectorProps {
  brandProducts: Product[];
  categories: Category[];
  existingProducts?: Product[];
  onAddProduct: (product: Product, quantity: number, price: number, currency: string, isAvailable: boolean, markup?: number) => void;
  onClose: () => void;
}

export function BrandProductSelector({ brandProducts, categories, existingProducts = [], onAddProduct, onClose }: BrandProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [initialQuantity, setInitialQuantity] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [markup, setMarkup] = useState<string>('');

  // Получаем валюту из настроек через API
  const [userCurrency, setUserCurrency] = useState<string>('KZT');

  // Проверяем, есть ли выбранный товар уже в списке
  const isProductExists = useMemo(() => {
    if (!selectedProduct) return false;
    return existingProducts.some(
      (p) => p.id === selectedProduct.id || p.sku.toLowerCase() === selectedProduct.sku.toLowerCase()
    );
  }, [selectedProduct, existingProducts]);

  // Показываем поле наценки только если товара нет в списке
  const showMarkupField = !isProductExists;

  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const settingsResponse = await api.get<{ currency?: string }>('/users/me/settings');
        setUserCurrency(settingsResponse.data.currency || 'KZT');
      } catch (error) {
        console.warn('Не удалось загрузить валюту, используем значение по умолчанию', error);
        setUserCurrency('KZT');
      }
    };
    loadCurrency();
  }, []);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || '—';
  };

  // Фильтруем товары: исключаем те, которые уже есть в списке магазина
  const availableProducts = useMemo(() => {
    return brandProducts.filter((product) => {
      // Проверяем, есть ли товар уже в списке магазина по уникальному идентификатору (ID или SKU)
      const existsInStore = existingProducts.some(
        (p) => p.id === product.id || p.sku.toLowerCase() === product.sku.toLowerCase()
      );
      return !existsInStore;
    });
  }, [brandProducts, existingProducts]);

  const filteredProducts = availableProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleConfirmAdd = () => {
    if (selectedProduct && initialQuantity > 0) {
      const markupValue = markup.trim() ? parseFloat(markup) : undefined;
      // Не передаем цену, так как она будет установлена позже через наценку
      onAddProduct(selectedProduct, initialQuantity, 0, userCurrency, isAvailable, markupValue);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedProduct(null);
        setInitialQuantity(0);
        setMarkup('');
      }, 1500);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setInitialQuantity(0);
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-card w-full h-full md:max-w-6xl md:h-[90vh] md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-card border-b-2 border-border px-4 md:px-6 py-4 md:py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Добавить товар</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden md:block">Выберите товар из каталога брендов</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted active:bg-accent transition-colors text-foreground"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Content */}
          <div className={`flex-1 flex flex-col overflow-hidden ${selectedProduct ? 'hidden md:flex' : ''}`}>
            {/* Search & Filters */}
            <div className="bg-muted border-b border-border px-4 md:px-6 py-3 md:py-4 flex-shrink-0">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    <input
                      type="search"
                      placeholder="Поиск по названию или артикулу"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="w-full md:w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-11 px-3 pr-8 bg-input-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-card text-foreground">Все категории</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-card text-foreground">{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center py-16 px-4">
                    <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-2xl flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {searchTerm || selectedCategory ? 'Товары не найдены' : 'Каталог брендов пуст'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm || selectedCategory
                        ? 'Попробуйте изменить параметры поиска'
                        : 'Бренды пока не добавили товары в каталог'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Mobile Product Cards */}
                  <div className="md:hidden p-4 space-y-3">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-card border border-border rounded-xl p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-foreground mb-1">{product.name}</h3>
                            <p className="text-xs font-mono text-muted-foreground">Арт: {product.sku}</p>
                          </div>
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 flex-shrink-0">
                            {product.brandName || 'Бренд'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">Категория:</span>
                            <span className="ml-1 font-medium text-foreground">{getCategoryName(product.categoryId)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Упаковка:</span>
                            <span className="ml-1 font-medium text-foreground">{product.packageInfo || '—'}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSelectProduct(product)}
                          className="w-full flex items-center justify-center gap-2 h-11 bg-primary text-primary-foreground text-sm font-semibold rounded-lg active:bg-primary/90 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Добавить
                        </button>
                      </div>
                    ))}
                    {/* Results Count */}
                    <div className="text-sm text-muted-foreground text-center pt-2">
                      Показано товаров: <span className="font-semibold text-foreground">{filteredProducts.length}</span>
                    </div>
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block p-6">
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                          <thead className="bg-muted border-b border-border">
                            <tr>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Товар</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Артикул</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Категория</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Упаковка</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Источник</th>
                              <th className="text-right px-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Действие</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {filteredProducts.map((product) => (
                              <tr
                                key={product.id}
                                className="hover:bg-muted/50 transition-colors"
                              >
                                <td className="px-4 py-4">
                                  <div className="font-semibold text-foreground">{product.name}</div>
                                </td>
                                <td className="px-4 py-4">
                                  <span className="text-sm font-mono text-muted-foreground">{product.sku}</span>
                                </td>
                                <td className="px-4 py-4">
                                  <span className="text-sm text-foreground">{getCategoryName(product.categoryId)}</span>
                                </td>
                                <td className="px-4 py-4">
                                  <span className="text-sm text-foreground">{product.packageInfo || '—'}</span>
                                </td>
                                <td className="px-4 py-4">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                    {product.brandName || 'Бренд'}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <button
                                    onClick={() => handleSelectProduct(product)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Добавить
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Results Count */}
                    <div className="mt-4 text-sm text-muted-foreground">
                      Показано товаров: <span className="font-semibold text-foreground">{filteredProducts.length}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Confirmation Panel */}
          {selectedProduct && (
            <>
              {/* Mobile Overlay */}
              <div
                className="md:hidden fixed inset-0 bg-black/50 z-[45]"
                onClick={() => setSelectedProduct(null)}
              />
              {/* Mobile Bottom Sheet */}
              <div className="md:hidden fixed inset-x-0 bottom-0 bg-card border-t-2 border-border rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-slideUp z-50">
                <div className="px-5 py-4 bg-card border-b-2 border-border flex items-center justify-between flex-shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Подтверждение</h3>
                    <p className="text-sm text-muted-foreground mt-1">Установите начальное количество</p>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted active:bg-accent transition-colors text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Product Details */}
                  <div className="bg-card border-2 border-primary/30 rounded-xl p-4">
                    <p className="text-xs font-bold text-primary uppercase tracking-wide mb-3">Выбранный товар</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Название</p>
                        <p className="font-bold text-sm text-foreground">{selectedProduct.name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Артикул</p>
                          <p className="font-mono text-xs font-semibold text-foreground">{selectedProduct.sku}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Категория</p>
                          <p className="text-xs font-semibold text-foreground">{getCategoryName(selectedProduct.categoryId)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Упаковка</p>
                        <p className="text-xs font-semibold text-foreground">{selectedProduct.packageInfo || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div className="bg-card border-2 border-border rounded-xl p-4">
                    <label className="block text-sm font-bold text-foreground mb-3">
                      Начальное количество <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      value={initialQuantity}
                      onChange={(e) => setInitialQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      min="0"
                      className="w-full h-14 px-4 bg-input-background border-2 border-border rounded-lg text-2xl font-bold text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Введите количество единиц для добавления в склад
                    </p>
                    {isProductExists && (
                      <p className="text-xs text-muted-foreground mt-2 text-center italic">
                        Цена будет установлена позже через наценку в списке товаров
                      </p>
                    )}
                  </div>

                  {/* Markup - только для товаров, которых еще нет в списке */}
                  {showMarkupField && (
                    <div className="bg-card border-2 border-border rounded-xl p-4">
                      <label className="block text-sm font-bold text-foreground mb-3">
                        Наценка
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={markup}
                          onChange={(e) => setMarkup(e.target.value)}
                          placeholder="0.00"
                          className="flex-1 h-14 px-4 bg-input-background border-2 border-border rounded-lg text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">{userCurrency}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Укажите наценку для установки цены продажи. Цена = себестоимость + наценка
                      </p>
                    </div>
                  )}

                  {/* Availability Checkbox */}
                  <div className="bg-card border-2 border-border rounded-xl p-4">
                    <label className="flex items-center gap-3 text-sm font-bold text-foreground">
                      <input
                        type="checkbox"
                        checked={isAvailable}
                        onChange={(e) => setIsAvailable(e.target.checked)}
                        className="h-5 w-5"
                      />
                      Доступен для продажи
                    </label>
                  </div>

                  {/* Success Message */}
                  {showSuccess && (
                    <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-green-900 dark:text-green-300">Товар добавлен!</p>
                        <p className="text-sm text-green-700 dark:text-green-400">Проверьте список товаров</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-5 py-4 bg-card border-t-2 border-border space-y-3 safe-area-inset-bottom">
                  <button
                    onClick={handleConfirmAdd}
                    disabled={initialQuantity === 0 || showSuccess}
                    className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-bold active:bg-primary/90 transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Добавить в инвентарь
                  </button>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="w-full h-12 border-2 border-border bg-card text-foreground rounded-lg font-bold active:bg-muted transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>

              {/* Desktop Right Panel */}
              <div className="hidden md:flex w-96 border-l-2 border-border bg-muted flex-col overflow-hidden animate-slideInRight">
                <div className="px-6 py-5 bg-card border-b-2 border-border">
                  <h3 className="text-lg font-bold text-foreground">Подтверждение</h3>
                  <p className="text-sm text-muted-foreground mt-1">Установите начальное количество</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Product Details - Read Only */}
                  <div className="bg-card border-2 border-primary/30 rounded-xl p-5">
                    <p className="text-xs font-bold text-primary uppercase tracking-wide mb-4">Выбранный товар</p>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Название</p>
                        <p className="font-bold text-base text-foreground">{selectedProduct.name}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Артикул</p>
                          <p className="font-mono text-sm font-semibold text-foreground">{selectedProduct.sku}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Категория</p>
                          <p className="text-sm font-semibold text-foreground">{getCategoryName(selectedProduct.categoryId)}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Упаковка</p>
                        <p className="text-sm font-semibold text-foreground">{selectedProduct.packageInfo || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div className="bg-card border-2 border-border rounded-xl p-5">
                    <label className="block text-sm font-bold text-foreground mb-3">
                      Начальное количество <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      value={initialQuantity}
                      onChange={(e) => setInitialQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      min="0"
                      className="w-full h-14 px-4 bg-input-background border-2 border-border rounded-lg text-2xl font-bold text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Введите количество единиц для добавления в склад
                    </p>
                    {isProductExists && (
                      <p className="text-xs text-muted-foreground mt-2 text-center italic">
                        Цена будет установлена позже через наценку в списке товаров
                      </p>
                    )}
                  </div>

                  {/* Markup - только для товаров, которых еще нет в списке */}
                  {showMarkupField && (
                    <div className="bg-card border-2 border-border rounded-xl p-5">
                      <label className="block text-sm font-bold text-foreground mb-3">
                        Наценка
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={markup}
                          onChange={(e) => setMarkup(e.target.value)}
                          placeholder="0.00"
                          className="flex-1 h-14 px-4 bg-input-background border-2 border-border rounded-lg text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">{userCurrency}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Укажите наценку для установки цены продажи. Цена = себестоимость + наценка
                      </p>
                    </div>
                  )}

                  <div className="bg-card border-2 border-border rounded-xl p-5">
                    <label className="flex items-center gap-3 text-sm font-bold text-foreground">
                      <input
                        type="checkbox"
                        checked={isAvailable}
                        onChange={(e) => setIsAvailable(e.target.checked)}
                        className="h-5 w-5"
                      />
                      Доступен для продажи
                    </label>
                  </div>

                  {/* Success Message */}
                  {showSuccess && (
                    <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-green-900 dark:text-green-300">Товар добавлен!</p>
                        <p className="text-sm text-green-700 dark:text-green-400">Проверьте список товаров</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-card border-t-2 border-border space-y-3">
                  <button
                    onClick={handleConfirmAdd}
                    disabled={initialQuantity === 0 || showSuccess}
                    className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 active:bg-primary/80 transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Добавить в инвентарь
                  </button>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="w-full h-12 border-2 border-border bg-card text-foreground rounded-lg font-bold hover:bg-muted active:bg-accent transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}