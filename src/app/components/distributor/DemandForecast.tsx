import React from 'react';
import { TrendingUp, BarChart3, Calendar } from 'lucide-react';

export function DemandForecast() {
  // TODO: Заменить на реальные данные из AI API
  const forecasts: Array<{ product: string; currentStock: number; predictedDemand: number; recommendation: string }> = [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Прогноз спроса (AI)</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Обновить прогноз
        </button>
      </div>

      {forecasts.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Прогнозы спроса будут доступны после настройки</p>
          <p className="text-sm text-muted-foreground mt-2">
            AI анализирует исторические данные и предсказывает спрос на товары
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {forecasts.map((forecast, idx) => (
            <div key={idx} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{forecast.product}</h3>
                <span className="text-sm text-muted-foreground">
                  Остаток: {forecast.currentStock}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span>Прогнозируемый спрос: {forecast.predictedDemand}</span>
                </div>
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <p className="text-sm font-medium">Рекомендация:</p>
                  <p className="text-sm text-muted-foreground">{forecast.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
