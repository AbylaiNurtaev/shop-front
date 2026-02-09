import React, { useState, useEffect } from 'react';
import { Search, Plus, Package, Save, Loader2 } from 'lucide-react';
import { Product, Category } from '../../types';
import api from '../../api/axios';
import { toast } from 'sonner';
import { ScrollToTopButton } from '../ui/scroll-to-top-button';

interface ProductListProps {
  products: Product[];
  categories: Category[];
  onCreateProduct: () => void;
  isLoading?: boolean;
  onMarkupUpdated?: () => void;
}

export function ProductList({ products, categories, onCreateProduct, isLoading = false, onMarkupUpdated }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Получаем валюту из настроек через API
  const [userCurrency, setUserCurrency] = useState<string>('KZT');
  
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

  // Состояние для редактирования наценок
  const [editingMarkups, setEditingMarkups] = useState<Record<string, { markup: string }>>({});

  // Оригинальные значения для отслеживания изменений
  const [originalMarkups, setOriginalMarkups] = useState<Record<string, { markup?: number }>>({});

  useEffect(() => {
    // Инициализируем значения при загрузке продуктов
    const initialMarkups: Record<string, { markup: string }> = {};
    const initialOriginal: Record<string, { markup?: number }> = {};

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
        };
        initialOriginal[offerId] = {
          markup: markup !== null && markup >= 0 ? markup : undefined,
        };
      }
    });

    setEditingMarkups(initialMarkups);
    setOriginalMarkups(initialOriginal);
  }, [products]);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || '—';
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Нет в наличии', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300', icon: '⚠️' };
    if (quantity < 20) return { label: 'Мало', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300', icon: '⚡' };
    return { label: 'В наличии', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', icon: '✓' };
  };

  // Форматирование числа без лишних нулей
  const formatPrice = (value: number): string => {
    // Если число целое, возвращаем без дробной части
    if (value % 1 === 0) {
      return value.toLocaleString('ru-RU');
    }
    // Иначе форматируем с максимум 2 знаками после запятой, но без лишних нулей
    return value.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
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


  const hasChanges = () => {
    return Object.keys(editingMarkups).some((offerId) => {
      const edited = editingMarkups[offerId];
      const original = originalMarkups[offerId];

      if (!edited) return false;

      const editedMarkup = edited.markup.trim() === '' ? null : parseFloat(edited.markup);
      const originalMarkup = original?.markup ?? null;

      return editedMarkup !== originalMarkup;
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

      // Проверяем, есть ли изменения
      if (editedMarkup !== originalMarkup) {
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
            currency: userCurrency,
            costPrice: product.costPrice,
            markup: editedMarkup,
          });
          savePromises.push(
            api.post('/offers', {
              productId: product.id,
              storeId: storeId,
              price: calculatedPrice,
              currency: userCurrency,
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
            currency: userCurrency,
            costPrice: product.costPrice,
            markup: editedMarkup,
          });
          savePromises.push(
            api.put(`/offers/${offerId}`, {
              price: calculatedPrice,
              currency: userCurrency,
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
      const responses = await Promise.all(savePromises);
      toast.success('Цены сохранены');
      // Обновляем оригинальные значения
      setOriginalMarkups((prev) => {
        const updated = { ...prev };
        Object.keys(editingMarkups).forEach((offerId) => {
          const edited = editingMarkups[offerId];
          updated[offerId] = {
            markup: edited.markup.trim() === '' ? undefined : parseFloat(edited.markup),
          };
        });
        return updated;
      });
      // Очищаем редактируемые значения
      setEditingMarkups({});
      // Вызываем callback для обновления данных в родительском компоненте
      if (onMarkupUpdated) {
        onMarkupUpdated();
      }
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
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка товаров...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ========== MOBILE LAYOUT ========== */}
      <div className="md:hidden">
        {/* Header - Fixed */}
        <div className="bg-card border-b border-border sticky top-0 z-20 shadow-sm">
          <div className="p-4">
            <h1 className="text-2xl font-bold text-foreground mb-4">Товары</h1>
            <button
              onClick={onCreateProduct}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl h-14 font-semibold shadow-sm active:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Добавить товар
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 bg-card border-b border-border">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Поиск по названию или артикулу"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-input-background border border-border rounded-xl text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="pb-24">
          {filteredProducts.length === 0 ? (
            <div className="px-4 py-20 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-3xl flex items-center justify-center">
                <Package className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Товары не найдены</h3>
              <p className="text-base text-muted-foreground max-w-xs mx-auto">
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
                    className="bg-card border border-border rounded-2xl p-5 shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-foreground mb-2 leading-tight">{product.name}</h3>
                        <p className="text-sm text-muted-foreground font-mono">Артикул: {product.sku}</p>
                      </div>
                    </div>

                    {/* Stock Badge */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold mb-5 ${stockStatus.color}`}>
                      <span className="text-lg">{stockStatus.icon}</span>
                      <span>{stockStatus.label}</span>
                      <span className="ml-1">{product.quantity} шт</span>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border my-4"></div>

                    {/* Details Grid */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-muted-foreground">Категория</span>
                        <span className="text-sm font-bold text-foreground">{getCategoryName(product.categoryId)}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-muted-foreground">Упаковка</span>
                        <span className="text-sm font-bold text-foreground">{product.packageInfo || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-muted-foreground">Вес</span>
                        <span className="text-sm font-bold text-foreground">{product.weight}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-muted-foreground">Объем</span>
                        <span className="text-sm font-bold text-foreground">{product.volume}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-muted-foreground">В упаковке</span>
                        <span className="text-sm font-bold text-foreground">{product.unitsPerBox} шт</span>
                      </div>
                      {product.costPrice !== undefined && product.costPrice !== null && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm font-medium text-muted-foreground">Себестоимость</span>
                          <span className="text-xs font-bold text-foreground whitespace-nowrap">
                            {formatPrice(product.costPrice)} {product.costCurrency || 'KZT'}
                          </span>
                        </div>
                      )}
                      {(product.offerId || product.storePrice !== undefined) && product.costPrice !== undefined && product.costPrice !== null && (
                        <>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium text-muted-foreground">Наценка</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingMarkups[product.offerId || `temp-${product.id}`]?.markup || ''}
                                onChange={(e) => handleMarkupChange(product.offerId || `temp-${product.id}`, e.target.value)}
                                placeholder="0.00"
                                className="w-24 px-2 py-1 bg-input-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                              />
                              <span className="text-sm text-muted-foreground">{userCurrency}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium text-muted-foreground">Цена</span>
                            <span className="text-xs font-bold text-foreground whitespace-nowrap">
                              {(() => {
                                const markup = parseFloat(editingMarkups[product.offerId || `temp-${product.id}`]?.markup || '0') || 0;
                                const calculatedPrice = product.costPrice + markup;
                                return formatPrice(calculatedPrice);
                              })()} {userCurrency}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Source */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${product.createdBy === 'brand'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                        : 'bg-muted text-muted-foreground'
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
            <h2 className="text-2xl font-semibold text-foreground">Товары</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Управление товарным ассортиментом
            </p>
          </div>
          <button
            onClick={onCreateProduct}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            <Plus className="w-5 h-5" />
            Добавить товар
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 md:px-0 md:py-0 md:mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Поиск товаров..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-input-background border border-border rounded-xl text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-2xl flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-foreground">Товары не найдены</h3>
            <p className="text-sm text-muted-foreground">
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
                    className="bg-card border border-border rounded-2xl p-4 shadow-sm"
                  >
                    {/* Product Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1.5 leading-snug text-foreground">{product.name}</h3>
                        <p className="text-sm text-muted-foreground font-mono">Арт: {product.sku}</p>
                      </div>
                    </div>

                    {/* Stock Status Badge */}
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-4 ${stockStatus.color}`}>
                      <span className="text-base">{stockStatus.icon}</span>
                      <span>{stockStatus.label}</span>
                      <span className="ml-1 font-semibold">{product.quantity} шт</span>
                    </div>

                    {/* Product Details Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Категория</p>
                        <p className="text-sm font-medium text-foreground">{getCategoryName(product.categoryId)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Упаковка</p>
                        <p className="text-sm font-medium text-foreground">{product.packageInfo || '—'}</p>
                      </div>
                      {product.costPrice !== undefined && product.costPrice !== null && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Себестоимость</p>
                          <p className="text-xs font-medium text-foreground whitespace-nowrap">
                            {formatPrice(product.costPrice)} {product.costCurrency || 'KZT'}
                          </p>
                        </div>
                      )}
                      {(product.offerId || product.storePrice !== undefined) && product.costPrice !== undefined && product.costPrice !== null && (
                        <>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Наценка</p>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingMarkups[product.offerId || `temp-${product.id}`]?.markup || ''}
                                onChange={(e) => handleMarkupChange(product.offerId || `temp-${product.id}`, e.target.value)}
                                placeholder="0.00"
                                className="flex-1 px-2 py-1 bg-input-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                              />
                              <span className="text-sm text-muted-foreground">{userCurrency}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Цена</p>
                            <p className="text-xs font-medium text-foreground whitespace-nowrap">
                              {(() => {
                                const markup = parseFloat(editingMarkups[product.offerId || `temp-${product.id}`]?.markup || '0') || 0;
                                const calculatedPrice = product.costPrice + markup;
                                return `${formatPrice(calculatedPrice)} ${userCurrency}`;
                              })()}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Source Badge */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${product.createdBy === 'brand'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-muted text-muted-foreground'
                        }`}>
                        Источник: {product.brandName ? product.brandName : 'Бренд'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-foreground">Название</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-foreground">Артикул</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-foreground">Категория</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-foreground">Остаток</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-foreground">Упаковка</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-foreground">Себестоимость</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-foreground">Наценка</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-foreground">Цена</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-foreground">Источник</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.quantity);
                      return (
                        <tr
                          key={product.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-3 py-2.5 text-xs font-medium text-foreground">{product.name}</td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono">{product.sku}</td>
                          <td className="px-3 py-2.5 text-xs text-foreground">{getCategoryName(product.categoryId)}</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-xs font-medium ${product.quantity >= 5 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {product.quantity}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-foreground">{product.packageInfo || '—'}</td>
                          <td className="px-3 py-2.5">
                            {product.costPrice !== undefined && product.costPrice !== null ? (
                              <span className="text-xs text-foreground whitespace-nowrap">
                                {formatPrice(product.costPrice)} {product.costCurrency || 'KZT'}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {(product.offerId || product.storePrice !== undefined) && product.costPrice !== undefined && product.costPrice !== null ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editingMarkups[product.offerId || `temp-${product.id}`]?.markup || ''}
                                  onChange={(e) => handleMarkupChange(product.offerId || `temp-${product.id}`, e.target.value)}
                                  placeholder="0.00"
                                  className="w-24 px-2 py-1.5 bg-input-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-xs"
                                />
                                <span className="text-xs text-muted-foreground">{userCurrency}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {(product.offerId || product.storePrice !== undefined) && product.costPrice !== undefined && product.costPrice !== null ? (
                              <span className="text-xs text-foreground whitespace-nowrap">
                                {(() => {
                                  const markup = parseFloat(editingMarkups[product.offerId || `temp-${product.id}`]?.markup || '0') || 0;
                                  const calculatedPrice = product.costPrice + markup;
                                  return `${formatPrice(calculatedPrice)} ${userCurrency}`;
                                })()}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${product.createdBy === 'brand' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-muted text-muted-foreground'
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
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
      <ScrollToTopButton bottomOffset={120} />
    </div>
  );
}