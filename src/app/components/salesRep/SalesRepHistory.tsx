import React, { useState, useEffect } from 'react';
import { History, Calendar, Store, Package, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface HistoryItem {
  id: string;
  type: 'visit' | 'order' | 'recommendation' | 'inventory';
  title: string;
  description?: string;
  storeName?: string;
  timestamp: string;
  status?: string;
}

export function SalesRepHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const params = filter !== 'all' ? { type: filter } : {};
      const response = await api.get<{ items: HistoryItem[] }>('/sales-reps/history', { params });
      setHistory(response.data?.items || []);
    } catch (error) {
      console.error('Ошибка загрузки истории', error);
      toast.error('Не удалось загрузить историю');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      visit: 'Визит',
      order: 'Заказ',
      recommendation: 'Рекомендация',
      inventory: 'Инвентаризация',
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'visit':
        return Store;
      case 'order':
        return Package;
      case 'recommendation':
        return Package;
      case 'inventory':
        return Package;
      default:
        return History;
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
        <div className="w-full">
          <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
            <History className="w-5 h-5 md:w-6 md:h-6" />
            История
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего записей: {history.length}
          </p>
        </div>
        <div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 md:px-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          >
            <option value="all">Все</option>
            <option value="visit">Визиты</option>
            <option value="order">Заказы</option>
            <option value="recommendation">Рекомендации</option>
            <option value="inventory">Инвентаризация</option>
          </select>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">История пуста</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
            const Icon = getTypeIcon(item.type);
            return (
              <div
                key={item.id}
                className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {getTypeLabel(item.type)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {item.storeName && (
                        <div className="flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          <span>{item.storeName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(item.timestamp).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {item.status && (
                        <span className="px-2 py-0.5 bg-muted rounded text-xs">
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
