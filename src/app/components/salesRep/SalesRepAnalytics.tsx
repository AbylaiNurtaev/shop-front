import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Package, Store, Loader2, Brain } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface AnalyticsData {
  totalStores: number;
  totalProducts: number;
  lowStockProducts: number;
  expiringProducts: number;
  salesGrowth?: number;
  topProducts?: Array<{
    id: string;
    name: string;
    sales: number;
  }>;
  recommendations?: Array<{
    type: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export function SalesRepAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [threshold, setThreshold] = useState<string>('');
  const [expiringDays, setExpiringDays] = useState<string>('');
  const [targetStock, setTargetStock] = useState<string>('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (threshold.trim()) {
        const parsedThreshold = Number(threshold);
        if (!Number.isNaN(parsedThreshold)) {
          params.threshold = parsedThreshold;
        }
      }
      if (expiringDays.trim()) {
        const parsedExpiring = Number(expiringDays);
        if (!Number.isNaN(parsedExpiring)) {
          params.expiringDays = parsedExpiring;
        }
      }
      if (targetStock.trim()) {
        const parsedTarget = Number(targetStock);
        if (!Number.isNaN(parsedTarget)) {
          params.targetStock = parsedTarget;
        }
      }
      const response = await api.get<AnalyticsData>('/sales-reps/ai-analytics', { params });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Ошибка загрузки аналитики', error);
      toast.error('Не удалось загрузить аналитику');
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Brain className="w-6 h-6" />
            AI-аналитика
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Анализ данных по вашим магазинам и товарам
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm font-medium"
        >
          Обновить
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="number"
          min={0}
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          placeholder="Порог"
          className="px-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="number"
          min={0}
          value={expiringDays}
          onChange={(e) => setExpiringDays(e.target.value)}
          placeholder="Дней до истечения"
          className="px-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="number"
          min={0}
          value={targetStock}
          onChange={(e) => setTargetStock(e.target.value)}
          placeholder="Целевой остаток"
          className="px-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Основные метрики */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Store className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground">Магазины</span>
          </div>
          <div className="text-2xl font-semibold">{analytics.totalStores}</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground">Товары</span>
          </div>
          <div className="text-2xl font-semibold">{analytics.totalProducts}</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-5 h-5 text-amber-600" />
            <span className="text-xs text-muted-foreground">Дефицит</span>
          </div>
          <div className="text-2xl font-semibold text-amber-600">{analytics.lowStockProducts}</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <span className="text-xs text-muted-foreground">Истекает срок</span>
          </div>
          <div className="text-2xl font-semibold text-orange-600">{analytics.expiringProducts}</div>
        </div>
      </div>

      {/* Рост продаж */}
      {analytics.salesGrowth !== undefined && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Рост продаж
          </h2>
          <div className="text-3xl font-bold text-primary">
            {analytics.salesGrowth > 0 ? '+' : ''}
            {analytics.salesGrowth.toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            По сравнению с предыдущим периодом
          </p>
        </div>
      )}

      {/* Топ товары */}
      {analytics.topProducts && analytics.topProducts.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Топ товары</h2>
          <div className="space-y-3">
            {analytics.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <span className="font-medium">{product.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Продаж: {product.sales}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI-рекомендации */}
      {analytics.recommendations && analytics.recommendations.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI-рекомендации
          </h2>
          <div className="space-y-3">
            {analytics.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  rec.priority === 'high'
                    ? 'bg-red-50 border-red-200'
                    : rec.priority === 'medium'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium uppercase">
                    {rec.type}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      rec.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : rec.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {rec.priority === 'high' ? 'Высокий' : rec.priority === 'medium' ? 'Средний' : 'Низкий'}
                  </span>
                </div>
                <p className="text-sm">{rec.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
