import React, { useState, useEffect } from 'react';
import { History, Calendar, Loader2, RefreshCw, Filter } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface ActivityHistoryItem {
  actionType: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

interface ActivityHistoryResponse {
  distributorId: string;
  items: ActivityHistoryItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export function DistributorHistory() {
  const [history, setHistory] = useState<ActivityHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [limit] = useState<number>(50);
  const [offset, setOffset] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [availableActionTypes, setAvailableActionTypes] = useState<string[]>([]);

  useEffect(() => {
    loadHistory();
  }, [actionTypeFilter, offset]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        limit,
        offset,
      };
      
      if (actionTypeFilter !== 'all') {
        params.actionType = actionTypeFilter;
      }

      const response = await api.get<ActivityHistoryResponse>('/distributors/me/activity-history', { params });
      
      if (offset === 0) {
        // Первая загрузка - заменяем данные
        setHistory(response.data.items || []);
      } else {
        // Пагинация - добавляем данные
        setHistory(prev => [...prev, ...(response.data.items || [])]);
      }
      
      setTotal(response.data.total || 0);
      setHasMore(response.data.hasMore || false);

      // Собираем уникальные типы действий для фильтра
      if (offset === 0) {
        const types = new Set<string>();
        response.data.items?.forEach(item => {
          if (item.actionType) {
            types.add(item.actionType);
          }
        });
        setAvailableActionTypes(Array.from(types).sort());
      }
    } catch (error: any) {
      console.error('Ошибка загрузки истории', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить историю';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      setOffset(prev => prev + limit);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setActionTypeFilter(newFilter);
    setOffset(0); // Сбрасываем offset при смене фильтра
  };

  const handleRefresh = () => {
    setOffset(0);
    loadHistory();
  };

  const formatActionType = (actionType: string): string => {
    // Преобразуем ACTION_TYPE в читаемый формат
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionTypeColor = (actionType: string): string => {
    // Цвета для разных типов действий
    if (actionType.includes('UPDATE')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (actionType.includes('CREATE')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (actionType.includes('DELETE')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (actionType.includes('ADD')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="w-full">
          <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
            <History className="w-5 h-5 md:w-6 md:h-6" />
            История действий
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего записей: {total}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={actionTypeFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="pl-10 pr-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            >
              <option value="all">Все действия</option>
              {availableActionTypes.map((type) => (
                <option key={type} value={type}>
                  {formatActionType(type)}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 md:px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>
      </div>

      {isLoading && offset === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">История действий пуста</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item, index) => (
            <div
              key={`${item.timestamp}-${index}`}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <History className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <h3 className="font-semibold text-base">{item.description}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${getActionTypeColor(item.actionType)}`}>
                      {formatActionType(item.actionType)}
                    </span>
                  </div>
                  
                  {item.metadata && Object.keys(item.metadata).length > 0 && (
                    <div className="mb-2 p-2 bg-muted/50 rounded text-sm">
                      <details className="cursor-pointer">
                        <summary className="text-muted-foreground font-medium text-xs">
                          Детали действия
                        </summary>
                        <div className="mt-2 space-y-1">
                          {Object.entries(item.metadata).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="font-medium">{key}:</span>{' '}
                              <span className="text-muted-foreground">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatTimestamp(item.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  'Загрузить еще'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
