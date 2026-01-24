import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Store, Package, Target, Loader2, DollarSign, ShoppingCart } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

interface SalesAnalyticsData {
  period: {
    startDate: string;
    endDate: string;
  };
  stores: {
    total: number;
    ids: string[];
  };
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalQuantity: number;
    averageSale: number;
  };
  byPeriod: {
    daily: Array<{
      date: string;
      totalSales: number;
      totalRevenue: number;
      totalQuantity: number;
    }>;
    weekly: Array<{
      weekStart: string;
      totalSales: number;
      totalRevenue: number;
      totalQuantity: number;
    }>;
    monthly: Array<{
      month: string;
      totalSales: number;
      totalRevenue: number;
      totalQuantity: number;
    }>;
  };
  byStore: Array<{
    storeId: string;
    storeName: string;
    storeAddress: string;
    totalSales: number;
    totalRevenue: number;
    totalQuantity: number;
  }>;
  byProduct: Array<{
    productId: string;
    productName: string;
    sku: string;
    brandId: string;
    brandName: string;
    totalQuantity: number;
    totalRevenue: number;
    salesCount: number;
    topStore?: {
      storeId: string;
      storeName: string;
      storeAddress: string;
      quantity: number;
      revenue: number;
    };
  }>;
  byBrand: Array<{
    brandId: string;
    brandName: string;
    totalQuantity: number;
    totalRevenue: number;
    salesCount: number;
    productsCount: number;
  }>;
  plans: Array<{
    id: string;
    salesRepresentativeId: string;
    distributorId: string;
    targetAmount: number;
    targetQuantity: number;
    period: string;
    description?: string;
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
    actualRevenue: number;
    actualQuantity: number;
    revenueProgress: number;
    quantityProgress: number;
    revenueRemaining: number;
    quantityRemaining: number;
  }>;
}

const chartConfig = {
  revenue: {
    label: 'Выручка',
    color: 'hsl(var(--chart-1))',
  },
  sales: {
    label: 'Продажи',
    color: 'hsl(var(--chart-2))',
  },
  quantity: {
    label: 'Количество',
    color: 'hsl(var(--chart-3))',
  },
};

export function SalesRepSalesAnalytics() {
  const [analytics, setAnalytics] = useState<SalesAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [periodView, setPeriodView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    // Устанавливаем значения по умолчанию: 30 дней назад и сегодня
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadAnalytics();
    }
  }, [startDate, endDate]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) {
        // Устанавливаем начало дня (00:00:00.000Z)
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        params.startDate = start.toISOString();
      }
      if (endDate) {
        // Устанавливаем конец дня (23:59:59.999Z), чтобы включить все продажи за этот день
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        params.endDate = end.toISOString();
      }
      const response = await api.get<SalesAnalyticsData>('/sales-reps/sales-analytics', { params });
      setAnalytics(response.data);
    } catch (error: any) {
      console.error('Ошибка загрузки аналитики продаж', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить аналитику продаж';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Нет данных для отображения</p>
      </div>
    );
  }

  const periodData = analytics.byPeriod[periodView];
  const chartData = periodData.map((item) => {
    if (periodView === 'daily') {
      return {
        name: formatDate(item.date),
        revenue: item.totalRevenue,
        sales: item.totalSales,
        quantity: item.totalQuantity,
      };
    } else if (periodView === 'weekly') {
      return {
        name: `Неделя ${formatDate(item.weekStart)}`,
        revenue: item.totalRevenue,
        sales: item.totalSales,
        quantity: item.totalQuantity,
      };
    } else {
      return {
        name: formatMonth(item.month),
        revenue: item.totalRevenue,
        sales: item.totalSales,
        quantity: item.totalQuantity,
      };
    }
  });

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Заголовок и фильтры */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />
            Аналитика продаж
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Период: {formatDate(analytics.period.startDate)} - {formatDate(analytics.period.endDate)}
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm font-medium self-start sm:self-auto"
        >
          Обновить
        </button>
      </div>

      {/* Фильтры дат */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Дата начала</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 md:px-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Дата окончания</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 md:px-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground">Продаж</span>
          </div>
          <div className="text-2xl font-semibold">{analytics.summary.totalSales}</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-xs text-muted-foreground">Выручка</span>
          </div>
          <div className="text-xl font-semibold">{formatCurrency(analytics.summary.totalRevenue)}</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-muted-foreground">Товаров</span>
          </div>
          <div className="text-2xl font-semibold">{analytics.summary.totalQuantity}</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-xs text-muted-foreground">Средний чек</span>
          </div>
          <div className="text-xl font-semibold">{formatCurrency(analytics.summary.averageSale)}</div>
        </div>
      </div>

      {/* График продаж по периодам */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Продажи по периодам
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriodView('daily')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${periodView === 'daily'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
            >
              По дням
            </button>
            <button
              onClick={() => setPeriodView('weekly')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${periodView === 'weekly'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
            >
              По неделям
            </button>
            <button
              onClick={() => setPeriodView('monthly')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${periodView === 'monthly'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
            >
              По месяцам
            </button>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" name="Выручка" />
          </BarChart>
        </ChartContainer>
      </div>

      {/* Планы с прогрессом */}
      {analytics.plans && analytics.plans.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Планы продаж
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.plans.map((plan) => (
              <div key={plan.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{plan.description || `План ${plan.period}`}</h3>
                    <p className="text-sm text-muted-foreground">{plan.period}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${plan.revenueProgress >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                      {plan.revenueProgress.toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">выполнения</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">По сумме</span>
                      <span className="font-medium">
                        {formatCurrency(plan.actualRevenue)} / {formatCurrency(plan.targetAmount)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${plan.revenueProgress >= 100 ? 'bg-green-600' : 'bg-primary'}`}
                        style={{ width: `${Math.min(plan.revenueProgress, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">По количеству</span>
                      <span className="font-medium">
                        {plan.actualQuantity} / {plan.targetQuantity} шт.
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${plan.quantityProgress >= 100 ? 'bg-green-600' : 'bg-primary'}`}
                        style={{ width: `${Math.min(plan.quantityProgress, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Продажи по магазинам */}
      {analytics.byStore && analytics.byStore.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Store className="w-5 h-5" />
            Продажи по магазинам
          </h2>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[600px]">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Магазин</th>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Адрес</th>
                  <th className="text-right px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Продаж</th>
                  <th className="text-right px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Выручка</th>
                  <th className="text-right px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Товаров</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {analytics.byStore.map((store) => (
                  <tr key={store.storeId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 md:px-4 py-2 md:py-3 font-medium text-sm md:text-base">{store.storeName}</td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-muted-foreground">{store.storeAddress}</td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-right text-sm md:text-base">{store.totalSales}</td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-right text-sm md:text-base font-medium">{formatCurrency(store.totalRevenue)}</td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-right text-sm md:text-base">{store.totalQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Топ товаров */}
      {analytics.byProduct && analytics.byProduct.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Топ товаров
          </h2>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[600px]">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Товар</th>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">SKU</th>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Бренд</th>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Магазин</th>
                  <th className="text-right px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Количество</th>
                  <th className="text-right px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Выручка</th>
                  <th className="text-right px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Продаж</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {analytics.byProduct.map((product, index) => (
                  <tr key={product.productId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 md:px-4 py-2 md:py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </div>
                        <span className="font-medium text-sm md:text-base">{product.productName}</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-muted-foreground font-mono">{product.sku}</td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-muted-foreground">{product.brandName}</td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                      {product.topStore ? (
                        <div className="flex items-center gap-1">
                          <Store className="w-3 h-3 text-muted-foreground" />
                          <span>{product.topStore.storeName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-right text-sm md:text-base">{product.totalQuantity}</td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-right text-sm md:text-base font-medium">{formatCurrency(product.totalRevenue)}</td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-right text-sm md:text-base">{product.salesCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Продажи по брендам */}
      {analytics.byBrand && analytics.byBrand.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Продажи по брендам
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.byBrand.map((brand) => (
              <div key={brand.brandId} className="border border-border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-lg">{brand.brandName}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Товаров:</span>
                    <span className="font-medium">{brand.productsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Продаж:</span>
                    <span className="font-medium">{brand.salesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Количество:</span>
                    <span className="font-medium">{brand.totalQuantity} шт.</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground">Выручка:</span>
                    <span className="font-semibold text-primary">{formatCurrency(brand.totalRevenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
