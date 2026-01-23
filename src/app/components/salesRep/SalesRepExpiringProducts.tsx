import React, { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Store, Package, Loader2, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface ExpiringProduct {
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
  expiryDate: string;
  daysLeft: number;
}

interface ExpiringProductsResponse {
  items: ExpiringProduct[];
  total: number;
}

export function SalesRepExpiringProducts() {
  const [products, setProducts] = useState<ExpiringProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [warningDays, setWarningDays] = useState<string>('14');
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    loadExpiringProducts();
  }, [warningDays]);

  const loadExpiringProducts = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (warningDays.trim()) {
        const parsedDays = Number(warningDays);
        if (!Number.isNaN(parsedDays) && parsedDays > 0) {
          params.warningDays = parsedDays;
        }
      }
      const response = await api.get<ExpiringProductsResponse>('/sales-reps/expiring-products', { params });
      setProducts(response.data?.items || []);
      setTotal(response.data?.total || 0);
    } catch (error: any) {
      console.error('Ошибка загрузки товаров с истекающим сроком', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить товары с истекающим сроком';
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

  const getDaysLeftColor = (daysLeft: number) => {
    if (daysLeft <= 0) return 'text-red-600 bg-red-50 border-red-200';
    if (daysLeft <= 3) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (daysLeft <= 7) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getDaysLeftLabel = (daysLeft: number) => {
    if (daysLeft < 0) return `Просрочено на ${Math.abs(daysLeft)} дн.`;
    if (daysLeft === 0) return 'Истекает сегодня';
    if (daysLeft === 1) return '1 день';
    if (daysLeft <= 4) return `${daysLeft} дня`;
    return `${daysLeft} дней`;
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
      {/* Заголовок и фильтры */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
            Товары с истекающим сроком
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего товаров: {total}
          </p>
        </div>
        <button
          onClick={loadExpiringProducts}
          className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm font-medium self-start sm:self-auto flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Обновить
        </button>
      </div>

      {/* Фильтр по дням */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">
            Предупреждение за (дней до истечения)
          </label>
          <input
            type="number"
            min={1}
            value={warningDays}
            onChange={(e) => setWarningDays(e.target.value)}
            placeholder="14"
            className="w-full px-3 md:px-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет товаров с истекающим сроком</p>
          <p className="text-sm text-muted-foreground mt-2">
            Товары, срок годности которых истекает в течение {warningDays} дней, будут отображаться здесь
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Список товаров */}
          <div className="grid grid-cols-1 gap-4">
            {products.map((product) => (
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
                      <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium whitespace-nowrap ${getDaysLeftColor(product.daysLeft)}`}>
                        {getDaysLeftLabel(product.daysLeft)}
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
                  </div>

                  {/* Правая часть - метрики */}
                  <div className="flex flex-col md:items-end gap-3 md:min-w-[200px]">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between md:justify-end gap-4">
                        <span className="text-sm text-muted-foreground md:hidden">Количество:</span>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{product.quantity}</div>
                          <div className="text-xs text-muted-foreground">шт.</div>
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
                          <div className="text-xl font-bold text-green-600">
                            {formatCurrency(product.price * product.quantity, product.currency)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Дата истечения */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border w-full md:w-auto">
                      <Calendar className="w-4 h-4" />
                      <span>Истекает: {formatDate(product.expiryDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                <div className="text-xs text-muted-foreground mb-1">Просрочено</div>
                <div className="text-2xl font-semibold text-red-600">
                  {products.filter(p => p.daysLeft < 0).length}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Истекает сегодня</div>
                <div className="text-2xl font-semibold text-orange-600">
                  {products.filter(p => p.daysLeft === 0).length}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Общая стоимость</div>
                <div className="text-lg font-semibold text-green-600">
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
    </div>
  );
}
