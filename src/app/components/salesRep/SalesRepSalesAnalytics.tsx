import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Store, Package, Target, Loader2, DollarSign, ShoppingCart } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { Separator } from '../ui/separator';
import { useIsMobile } from '../ui/use-mobile';
import { Button } from '../ui/button';

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
  const isMobile = useIsMobile();

  // Загружаем данные один раз при монтировании компонента (для большого периода)
  useEffect(() => {
    const end = new Date();
    end.setDate(end.getDate() + 1); // Завтра
    const start = new Date();
    start.setDate(start.getDate() - 90); // Загружаем данные за последние 90 дней (покрывает все виды графиков)

    const newStartDate = start.toISOString().split('T')[0];
    const newEndDate = end.toISOString().split('T')[0];

    setEndDate(newEndDate);
    setStartDate(newStartDate);

    // Загружаем данные один раз
    loadAnalytics(newStartDate, newEndDate);
  }, []); // Загружаем только при монтировании

  const loadAnalytics = async (start?: string, end?: string) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      const startDateParam = start || startDate;
      const endDateParam = end || endDate;

      if (startDateParam) {
        // Устанавливаем начало дня (00:00:00.000Z)
        const startDateObj = new Date(startDateParam);
        startDateObj.setHours(0, 0, 0, 0);
        params.startDate = startDateObj.toISOString();
      }
      if (endDateParam) {
        // Устанавливаем конец дня (23:59:59.999Z), чтобы включить все продажи за этот день
        const endDateObj = new Date(endDateParam);
        endDateObj.setHours(23, 59, 59, 999);
        params.endDate = endDateObj.toISOString();
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

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    if (isMobile) {
      return date.toLocaleDateString('ru-RU', { month: 'short' });
    }
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
      <div className="bg-card border border-foreground/30 rounded-lg p-8 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Нет данных для отображения</p>
      </div>
    );
  }

  const periodData = analytics.byPeriod?.[periodView] || [];

  // Обработка данных для графика
  let chartData: Array<{ name: string; revenue: number; sales: number; quantity: number }> = [];

  if (periodView === 'daily') {
    // Для дневного графика заполняем все дни в периоде
    const start = new Date(analytics.period.startDate);
    const end = new Date(analytics.period.endDate);
    const dataMap = new Map<string, typeof periodData[0]>();

    // Создаем карту данных по датам
    periodData.forEach((item) => {
      const dateKey = item.date ? item.date.split('T')[0] : ''; // Берем только дату без времени
      if (dateKey) {
        dataMap.set(dateKey, item);
      }
    });

    // Заполняем все дни в периоде
    const currentDate = new Date(start);
    currentDate.setHours(0, 0, 0, 0); // Устанавливаем начало дня
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999); // Устанавливаем конец дня

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const existingData = dataMap.get(dateKey);

      chartData.push({
        name: formatDateShort(dateKey + 'T00:00:00'), // Без года для всех устройств
        revenue: existingData?.totalRevenue || 0,
        sales: existingData?.totalSales || 0,
        quantity: existingData?.totalQuantity || 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Показываем последние 7 дней на мобильных, 14 дней на десктопах
    const daysToShow = isMobile ? 7 : 14;
    if (chartData.length > daysToShow) {
      chartData = chartData.slice(-daysToShow);
    }
  } else if (periodView === 'weekly') {
    const weeksToShow = isMobile ? 5 : 10;

    // Создаем карту данных по неделям (используем дату начала недели как ключ)
    const weekDataMap = new Map<string, typeof periodData[0]>();
    periodData.forEach((item) => {
      if (item.weekStart) {
        // Нормализуем дату - берем только дату без времени
        let weekKey: string;
        try {
          const weekStartDate = new Date(item.weekStart);
          weekStartDate.setHours(0, 0, 0, 0);
          weekKey = weekStartDate.toISOString().split('T')[0];
        } catch {
          weekKey = item.weekStart.split('T')[0];
        }
        weekDataMap.set(weekKey, item);
      }
    });

    // Логирование для отладки
    console.log('Weekly period data from API:', periodData);
    console.log('Week data map keys:', Array.from(weekDataMap.keys()));

    // Генерируем последние N недель (от старых к новым)
    chartData = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Находим понедельник текущей недели
    const currentMonday = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Понедельник = 1
    currentMonday.setDate(today.getDate() + diff);
    currentMonday.setHours(0, 0, 0, 0);

    for (let i = weeksToShow - 1; i >= 0; i--) {
      const weekStart = new Date(currentMonday);
      weekStart.setDate(currentMonday.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);

      const weekKey = weekStart.toISOString().split('T')[0];
      let existingData = weekDataMap.get(weekKey);

      // Если не нашли по точному ключу, пробуем найти ближайшую неделю (в пределах 3 дней)
      if (!existingData) {
        for (const [key, data] of weekDataMap.entries()) {
          try {
            const keyDate = new Date(key);
            keyDate.setHours(0, 0, 0, 0);
            const diffDays = Math.abs((weekStart.getTime() - keyDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays <= 3) {
              existingData = data;
              console.log(`Matched week ${weekKey} with API data ${key} (diff: ${diffDays} days)`);
              break;
            }
          } catch (e) {
            // Игнорируем ошибки парсинга
          }
        }
      } else {
        console.log(`Found exact match for week ${weekKey}`);
      }

      const weekStartDate = isMobile
        ? formatDateShort(weekStart.toISOString())
        : formatDate(weekStart.toISOString());

      chartData.push({
        name: isMobile ? weekStartDate : `Неделя ${weekStartDate}`,
        revenue: existingData?.totalRevenue ?? 0,
        sales: existingData?.totalSales ?? 0,
        quantity: existingData?.totalQuantity ?? 0,
      });
    }

    console.log('Weekly chart data:', chartData);
  } else {
    const monthsToShow = isMobile ? 3 : 7;

    // Создаем карту данных по месяцам
    const monthDataMap = new Map<string, typeof periodData[0]>();
    periodData.forEach((item) => {
      if (item.month) {
        monthDataMap.set(item.month, item);
      }
    });

    // Генерируем последние N месяцев
    chartData = [];
    const today = new Date();

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      const existingData = monthDataMap.get(monthKey);

      chartData.push({
        name: formatMonth(monthKey),
        revenue: existingData?.totalRevenue || 0,
        sales: existingData?.totalSales || 0,
        quantity: existingData?.totalQuantity || 0,
      });
    }
  }

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
      </div>

      {/* Фильтры дат */}
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="w-full sm:w-1/2">
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Дата начала</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors text-sm shadow-sm hover:border-primary/50"
            />
          </div>
          <div className="w-full sm:w-1/2">
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Дата окончания</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors text-sm shadow-sm hover:border-primary/50"
            />
          </div>
        </div>
        <div className="flex justify-end sm:justify-start">
          <Button
            onClick={() => {
              if (!startDate || !endDate) {
                toast.error('Пожалуйста, выберите обе даты');
                return;
              }
              if (new Date(startDate) > new Date(endDate)) {
                toast.error('Дата начала не может быть позже даты окончания');
                return;
              }
              loadAnalytics(startDate, endDate);
            }}
            className="w-full sm:w-auto"
          >
            <Calendar className="w-4 h-4" />
            Применить фильтр
          </Button>
        </div>
      </div>

      <Separator className="my-4 md:my-6 bg-foreground/60" />

      {/* Основные метрики */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-700 border border-gray-700 dark:border-gray-600 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-5 h-5 text-white" />
            <span className="text-xs text-gray-300 dark:text-gray-200">Продаж</span>
          </div>
          <div className="text-2xl font-semibold text-white">{analytics.summary.totalSales}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 border border-green-400 dark:border-green-500 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-white" />
            <span className="text-xs text-green-50 dark:text-green-100">Выручка</span>
          </div>
          <div className="text-xl font-semibold text-white">{formatCurrency(analytics.summary.totalRevenue)}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border border-blue-400 dark:border-blue-500 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-white" />
            <span className="text-xs text-blue-50 dark:text-blue-100">Товаров</span>
          </div>
          <div className="text-2xl font-semibold text-white">{analytics.summary.totalQuantity}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 border border-purple-400 dark:border-purple-500 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-white" />
            <span className="text-xs text-purple-50 dark:text-purple-100">Средний чек</span>
          </div>
          <div className="text-xl font-semibold text-white">{formatCurrency(analytics.summary.averageSale)}</div>
        </div>
      </div>

      <Separator className="my-4 md:my-6 bg-foreground/60" />

      {/* График продаж по периодам */}
      <div className="bg-card border border-foreground/30 rounded-lg p-3 md:p-6">
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
        {chartData && chartData.length > 0 ? (
          <div className={`${isMobile ? 'w-[90%] mx-auto' : 'w-full'}`}>
            <ChartContainer config={chartConfig} className={`${isMobile ? 'h-[320px]' : 'h-[380px]'} w-full [&>div]:!aspect-auto`}>
              <BarChart
                data={chartData}
                margin={{
                  top: 10,
                  right: isMobile ? 10 : 30,
                  left: isMobile ? 0 : 20,
                  bottom: periodView === 'daily' ? (isMobile ? 20 : 30) : (isMobile ? 30 : 20)
                }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--muted-foreground))"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="name"
                  angle={0}
                  textAnchor="middle"
                  height={periodView === 'daily' ? (isMobile ? 30 : 40) : (isMobile ? 40 : 25)}
                  interval={periodView === 'daily' && chartData.length > 14 && !isMobile ? Math.floor(chartData.length / 14) : 0}
                  tick={{ 
                    fontSize: isMobile ? 9 : 12,
                    fill: 'hsl(var(--muted-foreground))'
                  }}
                  stroke="hsl(var(--muted-foreground))"
                  minTickGap={isMobile ? 3 : 10}
                />
                <YAxis 
                  tick={{ 
                    fontSize: isMobile ? 9 : 12,
                    fill: 'hsl(var(--muted-foreground))'
                  }} 
                  stroke="hsl(var(--muted-foreground))"
                  width={isMobile ? 40 : 60} 
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  name="Выручка"
                  radius={[4, 4, 0, 0]}
                  minPointSize={2}
                />
              </BarChart>
            </ChartContainer>
          </div>
        ) : (
          <div className={`${isMobile ? 'h-[320px]' : 'h-[380px]'} flex items-center justify-center text-muted-foreground`}>
            Нет данных за выбранный период
          </div>
        )}
      </div>

      <Separator className="my-4 md:my-6 bg-foreground/60" />

      {/* Планы с прогрессом */}
      {analytics.plans && analytics.plans.length > 0 && (
        <div className="bg-card border border-foreground/30 rounded-lg p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Планы продаж
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.plans.map((plan) => (
              <div key={plan.id} className="border border-foreground/30 rounded-lg p-4 space-y-3">
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

      {analytics.plans && analytics.plans.length > 0 && <Separator className="my-4 md:my-6 bg-foreground/60" />}

      {/* Продажи по магазинам */}
      {analytics.byStore && analytics.byStore.length > 0 && (
        <div className="bg-card border border-foreground/30 rounded-lg p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Store className="w-5 h-5" />
            Продажи по магазинам
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-muted/50 border-b border-foreground/30">
                <tr>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Магазин</th>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Адрес</th>
                  <th className="text-right px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Продаж</th>
                  <th className="text-right px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Выручка</th>
                  <th className="text-right px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Товаров</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/30">
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

      {analytics.byStore && analytics.byStore.length > 0 && <Separator className="my-4 md:my-6 bg-foreground/60" />}

      {/* Топ товаров */}
      {analytics.byProduct && analytics.byProduct.length > 0 && (
        <div className="bg-card border border-foreground/30 rounded-lg p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Топ товаров
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-muted/50 border-b border-foreground/30">
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
              <tbody className="divide-y divide-foreground/30">
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

      {analytics.byProduct && analytics.byProduct.length > 0 && <Separator className="my-4 md:my-6 bg-foreground/60" />}

      {/* Продажи по брендам */}
      {analytics.byBrand && analytics.byBrand.length > 0 && (
        <div className="bg-card border border-foreground/30 rounded-lg p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Продажи по брендам
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.byBrand.map((brand) => (
              <div key={brand.brandId} className="border border-foreground/30 rounded-lg p-4 space-y-2">
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
                  <div className="flex justify-between pt-2 border-t border-foreground/30">
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
