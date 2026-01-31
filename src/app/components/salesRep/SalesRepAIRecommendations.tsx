import React, { useState, useEffect } from 'react';
import { Brain, AlertCircle, Clock, TrendingUp, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface Recommendation {
  id: string;
  type: 'deficit' | 'expiring' | 'reorder' | 'other';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  storeName?: string;
  productName?: string;
  action?: string;
  createdAt: string;
  isRead?: boolean;
}

export function SalesRepAIRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadRecommendations();
  }, [filter]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const params = filter !== 'all' ? { type: filter } : {};
      const response = await api.get<{ items: Recommendation[] }>('/sales-reps/recommendations', { params });
      setRecommendations(response.data?.items || []);
    } catch (error) {
      console.error('Ошибка загрузки рекомендаций', error);
      toast.error('Не удалось загрузить рекомендации');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/sales-reps/recommendations/${id}/read`);
      setRecommendations((prev) =>
        prev.map((rec) => (rec.id === id ? { ...rec, isRead: true } : rec))
      );
    } catch (error) {
      console.error('Ошибка отметки рекомендации', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deficit':
        return AlertCircle;
      case 'expiring':
        return Clock;
      case 'reorder':
        return TrendingUp;
      default:
        return Brain;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deficit: 'Дефицит',
      expiring: 'Истекающий срок',
      reorder: 'Рекомендация по дозаказу',
      other: 'Другое',
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'medium':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-muted border-border';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const unreadCount = recommendations.filter((r) => !r.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Brain className="w-6 h-6" />
            AI-рекомендации
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего рекомендаций: {recommendations.length}
            {unreadCount > 0 && (
              <span className="ml-2 text-primary font-medium">({unreadCount} новых)</span>
            )}
          </p>
        </div>
        <div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          >
            <option value="all">Все типы</option>
            <option value="deficit">Дефицит</option>
            <option value="expiring">Истекающий срок</option>
            <option value="reorder">Рекомендации по дозаказу</option>
          </select>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет рекомендаций</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => {
            const Icon = getTypeIcon(rec.type);
            return (
              <div
                key={rec.id}
                className={`bg-card border-2 rounded-lg p-4 hover:shadow-md transition-all ${
                  !rec.isRead ? 'border-primary/50 shadow-sm' : 'border-border'
                } ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{rec.title}</h3>
                          {!rec.isRead && (
                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                          )}
                          <span className="text-xs px-2 py-0.5 bg-primary/10 rounded">
                            {getTypeLabel(rec.type)}
                          </span>
                        </div>
                        <p className="text-sm opacity-90 mb-2">{rec.description}</p>
                        {rec.storeName && (
                          <p className="text-xs opacity-75 mb-1">
                            Магазин: <span className="font-medium">{rec.storeName}</span>
                          </p>
                        )}
                        {rec.productName && (
                          <p className="text-xs opacity-75 mb-1">
                            Товар: <span className="font-medium">{rec.productName}</span>
                          </p>
                        )}
                        {rec.action && (
                          <p className="text-xs opacity-75">
                            Действие: <span className="font-medium">{rec.action}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium ${
                            rec.priority === 'high'
                              ? 'bg-red-200 text-red-800'
                              : rec.priority === 'medium'
                              ? 'bg-amber-200 text-amber-800'
                              : 'bg-blue-200 text-blue-800'
                          }`}
                        >
                          {rec.priority === 'high' ? 'Высокий' : rec.priority === 'medium' ? 'Средний' : 'Низкий'}
                        </span>
                        {!rec.isRead && (
                          <button
                            onClick={() => markAsRead(rec.id)}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Отметить прочитанным
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs opacity-60 mt-2">
                      {new Date(rec.createdAt).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
