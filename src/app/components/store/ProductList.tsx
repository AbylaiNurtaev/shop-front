import React, { useState, useEffect } from 'react';
import { Search, Plus, Package, Save, Loader2, ArrowUp } from 'lucide-react';
import { Product, Category } from '../../types';
import api from '../../api/axios';
import { toast } from 'sonner';

interface ProductListProps {
  products: Product[];
  categories: Category[];
  onCreateProduct: () => void;
  isLoading?: boolean;
}

export function ProductList({ products, categories, onCreateProduct, isLoading = false }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Состояние для редактирования наценок
  const [editingMarkups, setEditingMarkups] = useState<Record<string, { markup: string; currency: string }>>({});

  // Оригинальные значения для отслеживания изменений
  const [originalMarkups, setOriginalMarkups] = useState<Record<string, { markup?: number; currency?: string }>>({});

  useEffect(() => {
    // Инициализируем значения при загрузке продуктов
    const initialMarkups: Record<string, { markup: string; currency: string }> = {};
    const initialOriginal: Record<string, { markup?: number; currency?: string }> = {};

    products.forEach((product) => {
      // Инициализируем для всех товаров, у которых есть offerId или storePrice
      // Если есть storePrice, значит должен быть и offerId
      if (product.offerId || (product.storePrice !== undefined && product.storePrice !== null)) {
        const offerId = product.offerId || `temp-${product.id}`;

        // Вычисляем наценку из цены и себестоимости
        let markup: number | null = null;
        if (product.storePrice !== undefined && product.storePrice !== null &&
          product.costPrice !== undefined && product.costPrice !== null) {
          markup = product.storePrice - product.costPrice;
        }

        initialMarkups[offerId] = {
          markup: markup !== null && markup >= 0 ? markup.toString() : '',
          currency: product.storeCurrency || 'KZT',
        };
        initialOriginal[offerId] = {
          markup: markup !== null && markup >= 0 ? markup : undefined,
          currency: product.storeCurrency,
        };
      }
    });

    setEditingMarkups(initialMarkups);
    setOriginalMarkups(initialOriginal);
  }, [products]);

  // Отслеживание прокрутки для показа кнопки "наверх"
  useEffect(() => {
    const handleScroll = () => {
      // Показываем кнопку только на мобильной версии и когда прокрутка больше 300px
      if (window.innerWidth < 768) {
        setShowScrollTop(window.scrollY > 300);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Проверяем при загрузке
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || '—';
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Нет в наличии', color: 'bg-red-100 text-red-800', icon: '⚠️' };
    if (quantity < 20) return { label: 'Мало', color: 'bg-orange-100 text-orange-800', icon: '⚡' };
    return { label: 'В наличии', color: 'bg-green-100 text-green-800', icon: '✓' };
  };

  const handleMarkupChange = (offerId: string, value: string) => {
    setEditingMarkups((prev) => ({
      ...prev,
      [offerId]: {
        ...prev[offerId],
        markup: value,
      },
    }));
  };

  const handleCurrencyChange = (offerId: string, value: string) => {
    setEditingMarkups((prev) => ({
      ...prev,
      [offerId]: {
        ...prev[offerId],
        currency: value,
      },
    }));
  };

  const hasChanges = () => {
    return Object.keys(editingMarkups).some((offerId) => {
      const edited = editingMarkups[offerId];
      const original = originalMarkups[offerId];

      if (!edited) return false;

      const editedMarkup = edited.markup.trim() === '' ? null : parseFloat(edited.markup);
      const originalMarkup = original?.markup ?? null;

      const editedCurrency = edited.currency || 'KZT';
      const originalCurrency = original?.currency || 'KZT';

      return editedMarkup !== originalMarkup || editedCurrency !== originalCurrency;
    });
  };

  const handleSaveAll = async () => {
    if (!hasChanges()) return;

    setIsSaving(true);
    const savePromises: Promise<void>[] = [];

    // Получаем storeId из localStorage
    const storeId = localStorage.getItem('storeId');
    if (!storeId) {
      toast.error('Не удалось определить магазин');
      setIsSaving(false);
      return;
    }

    Object.keys(editingMarkups).forEach((offerId) => {
      const edited = editingMarkups[offerId];
      const original = originalMarkups[offerId];

      if (!edited) return;

      const editedMarkup = edited.markup.trim() === '' ? null : parseFloat(edited.markup);
      const originalMarkup = original?.markup ?? null;

      const editedCurrency = edited.currency || 'KZT';
      const originalCurrency = original?.currency || 'KZT';

      // Проверяем, есть ли изменения
      if (editedMarkup !== originalMarkup || editedCurrency !== originalCurrency) {
        if (editedMarkup === null || isNaN(editedMarkup) || editedMarkup < 0) {
          toast.error(`Некорректная наценка для товара`);
          return;
        }

        // Находим продукт
        let product: Product | undefined;
        if (offerId.startsWith('temp-')) {
          // Для временных ID извлекаем product.id
          const productId = offerId.replace('temp-', '');
          product = products.find((p) => p.id === productId);
        } else {
          // Для реальных offerId ищем продукт по offerId
          product = products.find((p) => p.offerId === offerId);
        }

        if (!product) {
          console.error(`Продукт не найден для offerId: ${offerId}`);
          toast.error(`Продукт не найден`);
          return;
        }

        if (product.costPrice === undefined || product.costPrice === null) {
          console.error(`Себестоимость не найдена для продукта: ${product.name} (ID: ${product.id})`);
          toast.error(`Не найдена себестоимость для товара "${product.name}"`);
          return;
        }

        // Вычисляем цену: цена = себестоимость + наценка
        const calculatedPrice = product.costPrice + editedMarkup;

        if (offerId.startsWith('temp-')) {
          // Создаем новый Offer
          console.log(`Создание нового Offer для продукта ${product.id}:`, {
            productId: product.id,
            storeId: storeId,
            price: calculatedPrice,
            currency: editedCurrency,
            costPrice: product.costPrice,
            markup: editedMarkup,
          });
          savePromises.push(
            api.post('/offers', {
              productId: product.id,
              storeId: storeId,
              price: calculatedPrice,
              currency: editedCurrency,
            }).then((response) => {
              console.log(`Offer создан успешно:`, response.data);
            }).catch((error) => {
              console.error(`Ошибка создания оффера для продукта ${product.id}`, error);
              console.error('Детали ошибки:', error.response?.data);
              throw error;
            })
          );
        } else {
          // Обновляем существующий Offer
          console.log(`Обновление Offer ${offerId}:`, {
            price: calculatedPrice,
            currency: editedCurrency,
            costPrice: product.costPrice,
            markup: editedMarkup,
          });
          savePromises.push(
            api.put(`/offers/${offerId}`, {
              price: calculatedPrice,
              currency: editedCurrency,
            }).then((response) => {
              console.log(`Offer обновлен успешно:`, response.data);
            }).catch((error) => {
              console.error(`Ошибка сохранения цены для ${offerId}`, error);
              console.error('Детали ошибки:', error.response?.data);
              throw error;
            })
          );
        }
      }
    });

    try {
      await Promise.all(savePromises);
      toast.success('Цены сохранены');
      // Обновляем оригинальные значения
      setOriginalMarkups((prev) => {
        const updated = { ...prev };
        Object.keys(editingMarkups).forEach((offerId) => {
          const edited = editingMarkups[offerId];
          updated[offerId] = {
            markup: edited.markup.trim() === '' ? undefined : parseFloat(edited.markup),
            currency: edited.currency,
          };
        });
        return updated;
      });
      // Перезагружаем страницу для обновления данных
      window.location.reload();
    } catch (error: any) {
      console.error('Ошибка сохранения цен', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось сохранить цены';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка товаров...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== MOBILE LAYOUT ========== */}
      <div className="md:hidden">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="p-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Товары</h1>
            <button
              onClick={onCreateProduct}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl h-14 font-semibold shadow-sm active:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Добавить товар
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Поиск по названию или артикулу"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-300 rounded-xl text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="pb-24">
          {filteredProducts.length === 0 ? (
            <div className="px-4 py-20 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-3xl flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Товары не найдены</h3>
              <p className="text-base text-gray-600 max-w-xs mx-auto">
                {searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Добавьте товары из каталога брендов для начала работы'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.quantity);
                return (
                  <div
                    key={product.id}
                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 mb-2 leading-tight">{product.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">Артикул: {product.sku}</p>
                      </div>
                    </div>

                    {/* Stock Badge */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold mb-5 ${stockStatus.color}`}>
                      <span className="text-lg">{stockStatus.icon}</span>
                      <span>{stockStatus.label}</span>
                      <span className="ml-1">{product.quantity} шт</span>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-4"></div>

                    {/* Details Grid */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-500">Категория</span>
                        <span className="text-sm font-bold text-gray-900">{getCategoryName(product.categoryId)}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-500">Упаковка</span>
                        <span className="text-sm font-bold text-gray-900">{product.packageInfo || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-500">Вес</span>
                        <span className="text-sm font-bold text-gray-900">{product.weight}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-500">Объем</span>
                        <span className="text-sm font-bold text-gray-900">{product.volume}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-500">В упаковке</span>
                        <span className="text-sm font-bold text-gray-900">{product.unitsPerBox} шт</span>
                      </div>
                      {product.costPrice !== undefined && product.costPrice !== null && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm font-medium text-gray-500">Себестоимость</span>
                          <span className="text-sm font-bold text-gray-900">
                            {product.costPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {product.costCurrency || 'KZT'}
                          </span>
                        </div>
                      )}
                      {(product.offerId || product.storePrice !== undefined) && product.costPrice !== undefined && product.costPrice !== null && (
                        <>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium text-gray-500">Наценка</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingMarkups[product.offerId || `temp-${product.id}`]?.markup || ''}
                                onChange={(e) => handleMarkupChange(product.offerId || `temp-${product.id}`, e.target.value)}
                                placeholder="0.00"
                                className="w-24 px-2 py-1 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                              <select
                                value={editingMarkups[product.offerId || `temp-${product.id}`]?.currency || 'KZT'}
                                onChange={(e) => handleCurrencyChange(product.offerId || `temp-${product.id}`, e.target.value)}
                                className="px-2 py-1 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              >
                                <option value="KZT">KZT (₸)</option>
                                <option value="RUB">RUB (₽)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium text-gray-500">Цена</span>
                            <span className="text-sm font-bold text-gray-900">
                              {(() => {
                                const markup = parseFloat(editingMarkups[product.offerId || `temp-${product.id}`]?.markup || '0') || 0;
                                const calculatedPrice = product.costPrice + markup;
                                return calculatedPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                              })()} {editingMarkups[product.offerId || `temp-${product.id}`]?.currency || 'KZT'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Source */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${product.createdBy === 'brand'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700'
                        }`}>
                        {product.brandName
                          ? `Источник: ${product.brandName || 'Брендs'}`
                          : 'Источник: Магазин'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========== DESKTOP LAYOUT ========== */}
      <div className="hidden md:block">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Товары</h2>
            <p className="text-sm text-gray-500 mt-1">
              Управление товарным ассортиментом
            </p>
          </div>
          <button
            onClick={onCreateProduct}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            <Plus className="w-5 h-5" />
            Добавить товар
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 md:px-0 md:py-0 md:mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Поиск товаров..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Товары не найдены</h3>
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Добавьте товары из каталога брендов для начала работы'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Product Cards */}
            <div className="md:hidden px-4 space-y-3">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.quantity);
                return (
                  <div
                    key={product.id}
                    className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
                  >
                    {/* Product Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1.5 leading-snug">{product.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">Арт: {product.sku}</p>
                      </div>
                    </div>

                    {/* Stock Status Badge */}
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-4 ${stockStatus.color}`}>
                      <span className="text-base">{stockStatus.icon}</span>
                      <span>{stockStatus.label}</span>
                      <span className="ml-1 font-semibold">{product.quantity} шт</span>
                    </div>

                    {/* Product Details Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Категория</p>
                        <p className="text-sm font-medium">{getCategoryName(product.categoryId)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Упаковка</p>
                        <p className="text-sm font-medium">{product.packageInfo || '—'}</p>
                      </div>
                      {product.costPrice !== undefined && product.costPrice !== null && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Себестоимость</p>
                          <p className="text-sm font-medium">
                            {product.costPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {product.costCurrency || 'KZT'}
                          </p>
                        </div>
                      )}
                      {(product.offerId || product.storePrice !== undefined) && product.costPrice !== undefined && product.costPrice !== null && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Наценка</p>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingMarkups[product.offerId || `temp-${product.id}`]?.markup || ''}
                                onChange={(e) => handleMarkupChange(product.offerId || `temp-${product.id}`, e.target.value)}
                                placeholder="0.00"
                                className="flex-1 px-2 py-1 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                              <select
                                value={editingMarkups[product.offerId || `temp-${product.id}`]?.currency || 'KZT'}
                                onChange={(e) => handleCurrencyChange(product.offerId || `temp-${product.id}`, e.target.value)}
                                className="px-2 py-1 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              >
                                <option value="KZT">KZT</option>
                                <option value="RUB">RUB</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Цена</p>
                            <p className="text-sm font-medium">
                              {(() => {
                                const markup = parseFloat(editingMarkups[product.offerId || `temp-${product.id}`]?.markup || '0') || 0;
                                const calculatedPrice = product.costPrice + markup;
                                return `${calculatedPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${editingMarkups[product.offerId || `temp-${product.id}`]?.currency || 'KZT'}`;
                              })()}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Source Badge */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${product.createdBy === 'brand'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                        }`}>
                        Источник: {product.brandName ? product.brandName : 'Бренд'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium">Название</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Артикул</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Категория</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Остаток</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Упаковка</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Себестоимость</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Наценка</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Цена</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Источник</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.quantity);
                      return (
                        <tr
                          key={product.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium">{product.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 font-mono">{product.sku}</td>
                          <td className="px-4 py-3 text-sm">{getCategoryName(product.categoryId)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{product.quantity}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${stockStatus.color}`}>
                                {stockStatus.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{product.packageInfo || '—'}</td>
                          <td className="px-4 py-3 text-sm">
                            {product.costPrice !== undefined && product.costPrice !== null ? (
                              <span className="text-gray-700">
                                {product.costPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {product.costCurrency || 'KZT'}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {(product.offerId || product.storePrice !== undefined) && product.costPrice !== undefined && product.costPrice !== null ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editingMarkups[product.offerId || `temp-${product.id}`]?.markup || ''}
                                  onChange={(e) => handleMarkupChange(product.offerId || `temp-${product.id}`, e.target.value)}
                                  placeholder="0.00"
                                  className="w-28 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                                <select
                                  value={editingMarkups[product.offerId || `temp-${product.id}`]?.currency || 'KZT'}
                                  onChange={(e) => handleCurrencyChange(product.offerId || `temp-${product.id}`, e.target.value)}
                                  className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                  <option value="KZT">KZT (₸)</option>
                                  <option value="RUB">RUB (₽)</option>
                                  <option value="USD">USD ($)</option>
                                  <option value="EUR">EUR (€)</option>
                                </select>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {(product.offerId || product.storePrice !== undefined) && product.costPrice !== undefined && product.costPrice !== null ? (
                              <span className="text-gray-700">
                                {(() => {
                                  const markup = parseFloat(editingMarkups[product.offerId || `temp-${product.id}`]?.markup || '0') || 0;
                                  const calculatedPrice = product.costPrice + markup;
                                  return `${calculatedPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${editingMarkups[product.offerId || `temp-${product.id}`]?.currency || 'KZT'}`;
                                })()}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded ${product.createdBy === 'brand' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                              {product.brandName ? product.brandName : 'Бренд'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Кнопка сохранения - появляется только при изменениях */}
      {hasChanges() && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Сохранить изменения
              </>
            )}
          </button>
        </div>
      )}

      {/* Кнопка "наверх" для мобильной версии */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="md:hidden fixed bottom-30 right-4 z-40 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition-all duration-200"
          aria-label="Наверх"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}