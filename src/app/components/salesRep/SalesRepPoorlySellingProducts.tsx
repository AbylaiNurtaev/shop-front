import React, { useState, useEffect } from 'react';
import { TrendingDown, Package, Store, Loader2, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { ProductSalesModal } from './ProductSalesModal';

interface PoorlySellingProduct {
  offerId: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  productId: string;
  productName: string;
  sku: string;
  brandId: string;
  brandName: string;
  quantity: number;
  price: number;
  currency: string;
  salesCount: number;
  lastSaleDate?: string;
}

interface PoorlySellingProductsResponse {
  items: PoorlySellingProduct[];
  total: number;
}

export function SalesRepPoorlySellingProducts() {
  const [products, setProducts] = useState<PoorlySellingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [minQuantity, setMinQuantity] = useState<string>('10');
  const [maxSales, setMaxSales] = useState<string>('5');
  const [periodDays, setPeriodDays] = useState<string>('30');
  const [total, setTotal] = useState<number>(0);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);

  useEffect(() => {
    loadPoorlySellingProducts();
  }, []);

  const loadPoorlySellingProducts = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {};
      
      if (minQuantity.trim()) {
        const parsedMinQuantity = Number(minQuantity);
        if (!Number.isNaN(parsedMinQuantity) && parsedMinQuantity >= 0) {
          params.minQuantity = parsedMinQuantity;
        }
      }
      
      if (maxSales.trim()) {
        const parsedMaxSales = Number(maxSales);
        if (!Number.isNaN(parsedMaxSales) && parsedMaxSales >= 0) {
          params.maxSales = parsedMaxSales;
        }
      }
      
      if (periodDays.trim()) {
        const parsedPeriodDays = Number(periodDays);
        if (!Number.isNaN(parsedPeriodDays) && parsedPeriodDays > 0) {
          params.periodDays = parsedPeriodDays;
        }
      }
      
      const response = await api.get<PoorlySellingProductsResponse>('/sales-reps/poorly-selling-products', { params });
      setProducts(response.data?.items || []);
      setTotal(response.data?.total || 0);
    } catch (error: any) {
      console.error('Ошибка загрузки товаров с плохими продажами', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить товары с плохими продажами';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency || 'KZT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getDaysSinceLastSale = (lastSaleDate?: string) => {
    if (!lastSaleDate) return null;
    const lastSale = new Date(lastSaleDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastSale.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleViewSales = (productId: string) => {
    setSelectedProductId(productId);
    setIsSalesModalOpen(true);
  };

  const handleCloseSalesModal = () => {
    setIsSalesModalOpen(false);
    setSelectedProductId(null);
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
      {/* Заголовок и кнопка обновления */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
            <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
            Товары с плохими продажами
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего товаров: {total}
          </p>
        </div>
        <button
          onClick={loadPoorlySellingProducts}
          className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm font-medium self-start sm:self-auto flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Обновить
        </button>
      </div>

      {/* Фильтры */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Параметры фильтрации
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Минимальный остаток
            </label>
            <input
              type="number"
              min={0}
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              placeholder="10"
              className="w-full px-3 md:px-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Товары с остатком {'>='} указанного значения
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Максимальное количество продаж
            </label>
            <input
              type="number"
              min={0}
              value={maxSales}
              onChange={(e) => setMaxSales(e.target.value)}
              placeholder="5"
              className="w-full px-3 md:px-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Товары с продажами {'<='} указанного значения
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Период анализа (дней)
            </label>
            <input
              type="number"
              min={1}
              value={periodDays}
              onChange={(e) => setPeriodDays(e.target.value)}
              placeholder="30"
              className="w-full px-3 md:px-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              За какой период анализировать продажи
            </p>
          </div>
        </div>
        <button
          onClick={loadPoorlySellingProducts}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm font-medium"
        >
          Применить фильтры
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <TrendingDown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет товаров с плохими продажами</p>
          <p className="text-sm text-muted-foreground mt-2">
            Товары, соответствующие заданным критериям, будут отображаться здесь
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Список товаров */}
          <div className="grid grid-cols-1 gap-4">
            {products.map((product) => {
              const daysSinceLastSale = getDaysSinceLastSale(product.lastSaleDate);
              return (
                <div
                  key={product.offerId}
                  className="bg-card border border-border rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Левая часть - информация о товаре */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" />
                            {product.productName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="font-mono">{product.sku}</span>
                            <span>•</span>
                            <span>{product.brandName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm font-medium whitespace-nowrap">
                            {product.salesCount === 0 ? 'Нет продаж' : `${product.salesCount} продаж`}
                          </div>
                          <button
                            onClick={() => handleViewSales(product.productId)}
                            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium flex items-center gap-2"
                            title="Посмотреть продажи"
                          >
                            <Eye className="w-4 h-4" />
                            Продажи
                          </button>
                        </div>
                      </div>

                      {/* Информация о магазине */}
                      <div className="flex items-start gap-2 pt-2 border-t border-border">
                        <Store className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{product.storeName}</p>
                          <p className="text-xs text-muted-foreground">{product.storeAddress}</p>
                        </div>
                      </div>

                      {/* Информация о последней продаже */}
                      {product.lastSaleDate && daysSinceLastSale !== null && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                          <span>Последняя продажа: {formatDate(product.lastSaleDate)}</span>
                          <span className="text-orange-600 font-medium">
                            ({daysSinceLastSale} дн. назад)
                          </span>
                        </div>
                      )}
                      {!product.lastSaleDate && (
                        <div className="flex items-center gap-2 text-sm text-red-600 pt-2 border-t border-border">
                          <AlertCircle className="w-4 h-4" />
                          <span>Никогда не продавался</span>
                        </div>
                      )}
                    </div>

                    {/* Правая часть - метрики */}
                    <div className="flex flex-col md:items-end gap-3 md:min-w-[200px]">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between md:justify-end gap-4">
                          <span className="text-sm text-muted-foreground md:hidden">Остаток:</span>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-orange-600">{product.quantity}</div>
                            <div className="text-xs text-muted-foreground">шт. на складе</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-4">
                          <span className="text-sm text-muted-foreground md:hidden">Цена:</span>
                          <div className="text-right">
                            <div className="text-lg font-semibold">{formatCurrency(product.price, product.currency)}</div>
                            <div className="text-xs text-muted-foreground">за единицу</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-4 pt-2 border-t border-border">
                          <span className="text-sm text-muted-foreground md:hidden">Общая стоимость:</span>
                          <div className="text-right">
                            <div className="text-xl font-bold text-red-600">
                              {formatCurrency(product.price * product.quantity, product.currency)}
                            </div>
                            <div className="text-xs text-muted-foreground">заморожено в остатках</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Сводная статистика */}
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4">Сводная информация</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Всего товаров</div>
                <div className="text-2xl font-semibold">{total}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Без продаж</div>
                <div className="text-2xl font-semibold text-red-600">
                  {products.filter(p => p.salesCount === 0).length}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Общий остаток</div>
                <div className="text-2xl font-semibold text-orange-600">
                  {products.reduce((sum, p) => sum + p.quantity, 0)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Заморожено средств</div>
                <div className="text-lg font-semibold text-red-600">
                  {formatCurrency(
                    products.reduce((sum, p) => sum + p.price * p.quantity, 0),
                    products[0]?.currency || 'KZT'
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно продаж товара */}
      {selectedProductId && (
        <ProductSalesModal
          isOpen={isSalesModalOpen}
          onClose={handleCloseSalesModal}
          productId={selectedProductId}
        />
      )}
    </div>
  );
}
