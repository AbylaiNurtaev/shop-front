import React, { useState, useEffect } from 'react';
import { X, Store, Calendar, DollarSign, Package, Loader2, TrendingUp, BarChart3 } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface Sale {
  saleId: string;
  saleDate: string;
  quantity: number;
  price: number;
  revenue: number;
  totalAmount: number;
  currency: string;
}

interface StoreSales {
  storeId: string;
  storeName: string;
  storeAddress: string;
  sales: Sale[];
  totalSales: number;
  totalQuantity: number;
  totalRevenue: number;
}

interface ProductSalesData {
  productId?: string;
  product: {
    id: string;
    name: string;
    sku: string;
    brandId?: string;
    brandName: string;
  };
  period?: {
    startDate: string;
    endDate: string;
  };
  salesRepresentative?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  stores: StoreSales[];
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalQuantity: number;
  };
  statistics?: {
    totalSales: number;
    totalRevenue: number;
    totalQuantity: number;
  };
}

interface ProductSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  salesRepresentativeId?: string; // Для Дс (когда смотрит продажи конкретного ТП)
  useDistributorEndpoint?: boolean; // Для Дс (когда смотрит свои товары)
}

export function ProductSalesModal({ isOpen, onClose, productId, salesRepresentativeId, useDistributorEndpoint }: ProductSalesModalProps) {
  const [data, setData] = useState<ProductSalesData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    if (isOpen && productId) {
      // Устанавливаем даты по умолчанию (последние 30 дней)
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      
      const defaultStartDate = start.toISOString().split('T')[0];
      const defaultEndDate = end.toISOString().split('T')[0];
      
      setEndDate(defaultEndDate);
      setStartDate(defaultStartDate);
      
      // Загружаем данные с датами по умолчанию
      loadProductSales(defaultStartDate, defaultEndDate);
    } else {
      setData(null);
    }
  }, [isOpen, productId, salesRepresentativeId]);

  const loadProductSales = async (start?: string, end?: string) => {
    if (!productId) return;

    const startDateParam = start || startDate;
    const endDateParam = end || endDate;

    setIsLoading(true);
    try {
      let url: string;
      const params: Record<string, string> = {};
      if (startDateParam) params.startDate = startDateParam;
      if (endDateParam) params.endDate = endDateParam;
      
      if (salesRepresentativeId) {
        // Для Дс (когда смотрит продажи конкретного ТП)
        url = `/distributors/sales-representatives/${salesRepresentativeId}/products/${productId}/sales-by-stores`;
      } else if (useDistributorEndpoint) {
        // Для Дс (когда смотрит свои товары)
        url = `/distributors/me/products/${productId}/sales-by-stores`;
      } else {
        // Для ТП
        url = `/sales-representatives/products/${productId}/sales-by-stores`;
      }
      
      console.log('Загрузка продаж товара:', { url, params, productId, salesRepresentativeId });
      
      const response = await api.get<any>(url, { params });
      
      console.log('Ответ от сервера:', response.data);
      
      // Преобразуем данные из формата API в формат компонента
      const apiData = response.data;
      const transformedData: ProductSalesData = {
        product: apiData.product,
        stores: apiData.stores || [],
        summary: apiData.summary || {
          totalSales: 0,
          totalRevenue: 0,
          totalQuantity: 0,
        },
        // Поддержка обратной совместимости
        statistics: apiData.summary || apiData.statistics,
      };
      
      setData(transformedData);
    } catch (error: any) {
      console.error('Ошибка загрузки продаж товара', error);
      console.error('Детали ошибки:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        params: error.config?.params
      });
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить продажи товара';
      toast.error(errorMessage);
      setData(null);
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

  const handleApplyFilters = () => {
    loadProductSales(startDate, endDate);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Продажи товара
          </DialogTitle>
          <DialogDescription>
            Детальная информация о продажах товара в магазинах
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Информация о товаре */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{data.product.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="font-mono">SKU: {data.product.sku}</span>
                    <span>•</span>
                    <span>Бренд: {data.product.brandName}</span>
                  </div>
                </div>
              </div>
              
              {data.salesRepresentative && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    ТП: {data.salesRepresentative.firstName} {data.salesRepresentative.lastName}
                  </p>
                </div>
              )}
            </div>

            {/* Фильтры по датам */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Фильтр по датам
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="startDate">Начальная дата</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Конечная дата</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleApplyFilters} className="w-full">
                    Применить фильтр
                  </Button>
                </div>
              </div>
            </div>

            {/* Общая статистика */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Общая статистика
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Всего продаж</div>
                  <div className="text-2xl font-semibold">{(data.summary || data.statistics)?.totalSales || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Проданных единиц</div>
                  <div className="text-2xl font-semibold">{(data.summary || data.statistics)?.totalQuantity || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Общая выручка</div>
                  <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(
                      (data.summary || data.statistics)?.totalRevenue || 0,
                      data.stores[0]?.sales[0]?.currency || 'KZT'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Продажи по магазинам */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Store className="w-4 h-4" />
                Продажи по магазинам ({data.stores.length})
              </h4>
              
              {data.stores.length === 0 ? (
                <div className="bg-muted/50 border border-border rounded-lg p-8 text-center">
                  <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Нет продаж в выбранном периоде</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.stores.map((store) => (
                    <div key={store.storeId} className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h5 className="font-semibold flex items-center gap-2">
                            <Store className="w-4 h-4 text-primary" />
                            {store.storeName}
                          </h5>
                          <p className="text-sm text-muted-foreground mt-1">{store.storeAddress}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Продаж: {store.totalSales || store.sales.length}</div>
                          <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(store.totalRevenue, store.sales[0]?.currency || 'KZT')}
                          </div>
                        </div>
                      </div>

                      {/* Детали продаж */}
                      {store.sales.length > 0 && (
                        <div className="mt-4 border-t border-border pt-4">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left py-2 px-2 text-muted-foreground">Дата</th>
                                  <th className="text-right py-2 px-2 text-muted-foreground">Количество</th>
                                  <th className="text-right py-2 px-2 text-muted-foreground">Цена</th>
                                  <th className="text-right py-2 px-2 text-muted-foreground">Выручка</th>
                                </tr>
                              </thead>
                              <tbody>
                                {store.sales.map((sale) => (
                                  <tr key={sale.saleId || sale.id} className="border-b border-border/50">
                                    <td className="py-2 px-2">{formatDate(sale.saleDate || sale.date)}</td>
                                    <td className="py-2 px-2 text-right">{sale.quantity}</td>
                                    <td className="py-2 px-2 text-right">
                                      {formatCurrency(sale.price, sale.currency)}
                                    </td>
                                    <td className="py-2 px-2 text-right font-semibold text-green-600 dark:text-green-400">
                                      {formatCurrency(sale.revenue || sale.totalAmount, sale.currency)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="font-semibold">
                                  <td className="py-2 px-2">Итого:</td>
                                  <td className="py-2 px-2 text-right">{store.totalQuantity}</td>
                                  <td className="py-2 px-2 text-right">—</td>
                                  <td className="py-2 px-2 text-right text-green-600 dark:text-green-400">
                                    {formatCurrency(store.totalRevenue, store.sales[0]?.currency || 'KZT')}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Нет данных для отображения
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
