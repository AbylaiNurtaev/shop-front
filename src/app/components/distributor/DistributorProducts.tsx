import React, { useState, useEffect } from 'react';
import { Package, Loader2, Search, Save } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { Button } from '../ui/button';

interface DistributorProduct {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  brandName?: string;
  categoryName?: string;
  costPrice?: number;
  costCurrency?: string;
  hasCostPrice: boolean;
}

type ApiDistributorProduct = {
  _id?: string;
  id?: string;
  name?: string;
  sku?: string;
  categoryId?: string;
  category?: {
    id?: string;
    name?: string;
  };
  brandName?: string;
  productId?: string;
  product?: {
    id?: string;
    name?: string;
    sku?: string;
    categoryId?: string;
    category?: {
      id?: string;
      name?: string;
    };
    brandName?: string;
  };
  costPrice?: number | null;
  costCurrency?: string | null;
  hasCostPrice?: boolean;
};

type ApiCategory = {
  id: string;
  name: string;
};

export function DistributorProducts() {
  const [products, setProducts] = useState<DistributorProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<DistributorProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCategoriesLoaded, setIsCategoriesLoaded] = useState(false);
  
  // Состояние для редактирования прямо в таблице
  const [editingValues, setEditingValues] = useState<Record<string, { costPrice: string; costCurrency: string }>>({});
  
  // Оригинальные значения для отслеживания изменений
  const [originalValues, setOriginalValues] = useState<Record<string, { costPrice?: number; costCurrency?: string }>>({});

  useEffect(() => {
    const loadData = async () => {
      await loadCategories();
    };
    loadData();
  }, []);

  useEffect(() => {
    // Загружаем продукты после загрузки категорий
    if (isCategoriesLoaded) {
      loadProducts();
    }
  }, [isCategoriesLoaded]);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery]);

  const loadCategories = async () => {
    try {
      const response = await api.get<{ items?: ApiCategory[] }>('/categories');
      const items = response.data?.items || response.data || [];
      setCategories(Array.isArray(items) ? items : []);
      setIsCategoriesLoaded(true);
    } catch (error) {
      console.error('Ошибка загрузки категорий', error);
      setIsCategoriesLoaded(true);
    }
  };

  const getCategoryName = (categoryId?: string): string => {
    if (!categoryId) return '—';
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || '—';
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ items?: ApiDistributorProduct[] }>('/distributors/me/products');
      const items = response.data?.items || response.data || [];
      const mappedProducts = (Array.isArray(items) ? items : []).map((item) => {
        // API возвращает данные напрямую, не вложенные в product
        const productId = item.id ?? item.productId ?? item.product?.id ?? '';
        const productName = item.name ?? item.product?.name ?? '—';
        const sku = item.sku ?? item.product?.sku;
        const brandName = item.brandName ?? item.product?.brandName;
        const categoryId = item.categoryId ?? item.product?.categoryId ?? item.product?.category?.id;
        const categoryName = item.category?.name ?? item.product?.category?.name ?? getCategoryName(categoryId);
        const costPrice = item.costPrice;
        const costCurrency = item.costCurrency;
        const hasCostPrice = item.hasCostPrice ?? (costPrice !== undefined && costPrice !== null);

        const product: DistributorProduct = {
          id: item.id ?? item._id ?? productId,
          productId,
          productName,
          sku,
          brandName,
          categoryName,
          costPrice: costPrice ?? undefined,
          costCurrency: costCurrency ?? undefined,
          hasCostPrice,
        };

        // Сохраняем оригинальные значения
        setOriginalValues((prev) => ({
          ...prev,
          [productId]: {
            costPrice: product.costPrice,
            costCurrency: product.costCurrency,
          },
        }));

        // Инициализируем значения редактирования
        setEditingValues((prev) => ({
          ...prev,
          [productId]: {
            costPrice: product.costPrice?.toString() || '',
            costCurrency: product.costCurrency || 'KZT',
          },
        }));

        return product;
      });
      setProducts(mappedProducts);
    } catch (error: any) {
      console.error('Ошибка загрузки товаров', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить товары';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.productName.toLowerCase().includes(query) ||
          product.sku?.toLowerCase().includes(query) ||
          product.brandName?.toLowerCase().includes(query) ||
          product.categoryName?.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  };

  const handlePriceChange = (productId: string, value: string) => {
    setEditingValues((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        costPrice: value,
      },
    }));
  };

  const handleCurrencyChange = (productId: string, value: string) => {
    setEditingValues((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        costCurrency: value,
      },
    }));
  };

  const hasChanges = () => {
    return Object.keys(editingValues).some((productId) => {
      const edited = editingValues[productId];
      const original = originalValues[productId];
      
      if (!edited) return false;
      
      const editedPrice = edited.costPrice.trim() === '' ? null : parseFloat(edited.costPrice);
      const originalPrice = original?.costPrice ?? null;
      
      const editedCurrency = edited.costCurrency || 'KZT';
      const originalCurrency = original?.costCurrency || 'KZT';
      
      return editedPrice !== originalPrice || editedCurrency !== originalCurrency;
    });
  };

  const handleSaveAll = async () => {
    if (!hasChanges()) return;

    setIsSaving(true);
    const savePromises: Promise<void>[] = [];

    Object.keys(editingValues).forEach((productId) => {
      const edited = editingValues[productId];
      const original = originalValues[productId];
      
      if (!edited) return;
      
      const editedPrice = edited.costPrice.trim() === '' ? null : parseFloat(edited.costPrice);
      const originalPrice = original?.costPrice ?? null;
      
      const editedCurrency = edited.costCurrency || 'KZT';
      const originalCurrency = original?.costCurrency || 'KZT';
      
      // Проверяем, есть ли изменения
      if (editedPrice !== originalPrice || editedCurrency !== originalCurrency) {
        if (editedPrice === null || isNaN(editedPrice)) {
          // Удаляем себестоимость
          savePromises.push(
            api.delete(`/distributors/me/products/${productId}/cost-price`).catch((error) => {
              console.error(`Ошибка удаления себестоимости для ${productId}`, error);
              throw error;
            })
          );
        } else {
          // Сохраняем/обновляем себестоимость
          savePromises.push(
            api.put(`/distributors/me/products/${productId}/cost-price`, {
              costPrice: editedPrice,
              costCurrency: editedCurrency,
            }).catch((error) => {
              console.error(`Ошибка сохранения себестоимости для ${productId}`, error);
              throw error;
            })
          );
        }
      }
    });

    try {
      await Promise.all(savePromises);
      toast.success('Изменения сохранены');
      await loadProducts();
    } catch (error: any) {
      console.error('Ошибка сохранения изменений', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось сохранить изменения';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 md:w-6 md:h-6" />
            Товары
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего товаров: {filteredProducts.length}
          </p>
        </div>
      </div>

      {/* Поиск */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по товару, SKU, бренду или категории..."
          className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {products.length === 0 ? 'Нет товаров' : 'Ничего не найдено'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 md:px-4 py-3 md:py-3 text-xs md:text-sm font-medium">Товар</th>
                  <th className="text-left px-4 md:px-4 py-3 md:py-3 text-xs md:text-sm font-medium">SKU</th>
                  <th className="text-left px-4 md:px-4 py-3 md:py-3 text-xs md:text-sm font-medium">Бренд</th>
                  <th className="text-left px-4 md:px-4 py-3 md:py-3 text-xs md:text-sm font-medium">Категория</th>
                  <th className="text-left px-4 md:px-4 py-3 md:py-3 text-xs md:text-sm font-medium">Себестоимость</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => {
                  const editingValue = editingValues[product.productId] || {
                    costPrice: product.costPrice?.toString() || '',
                    costCurrency: product.costCurrency || 'KZT',
                  };

                  return (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 md:px-4 py-3 md:py-3 text-xs md:text-sm lg:text-base font-medium break-words">{product.productName}</td>
                      <td className="px-4 md:px-4 py-3 md:py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">{product.sku || '—'}</td>
                      <td className="px-4 md:px-4 py-3 md:py-3 text-xs md:text-sm text-muted-foreground break-words">{product.brandName || '—'}</td>
                      <td className="px-4 md:px-4 py-3 md:py-3 text-xs md:text-sm text-muted-foreground break-words">{product.categoryName || '—'}</td>
                      <td className="px-4 md:px-4 py-3 md:py-3">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingValue.costPrice}
                            onChange={(e) => handlePriceChange(product.productId, e.target.value)}
                            placeholder="0.00"
                            className="w-full sm:w-28 md:w-32 px-2 md:px-3 py-1.5 md:py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-xs md:text-sm"
                          />
                          <select
                            value={editingValue.costCurrency}
                            onChange={(e) => handleCurrencyChange(product.productId, e.target.value)}
                            className="w-full sm:w-auto px-2 md:px-3 py-1.5 md:py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-xs md:text-sm"
                          >
                            <option value="RUB">RUB (₽)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="KZT">KZT (₸)</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Кнопка сохранения - появляется только при изменениях */}
      {hasChanges() && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleSaveAll}
            disabled={isSaving}
            size="lg"
            className="shadow-lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Сохранить изменения
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
