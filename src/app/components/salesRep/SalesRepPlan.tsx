import React, { useState, useEffect } from 'react';
import { Calendar, Package, Building2, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface PlanItem {
  id: string;
  type: 'product' | 'brand';
  name: string;
  description?: string;
  target?: string;
  progress?: number;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  dueDate?: string;
  storeName?: string;
}

export function SalesRepPlan() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadPlans();
  }, [filter]);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get<{ items: PlanItem[] }>('/sales-reps/plans', { params });
      setPlans(response.data?.items || []);
    } catch (error) {
      console.error('Ошибка загрузки планов', error);
      toast.error('Не удалось загрузить планы');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlanStatus = async (id: string, status: PlanItem['status']) => {
    try {
      await api.patch(`/sales-reps/plans/${id}`, { status });
      setPlans((prev) => prev.map((plan) => (plan.id === id ? { ...plan, status } : plan)));
      toast.success('Статус обновлен');
    } catch (error) {
      console.error('Ошибка обновления статуса', error);
      toast.error('Не удалось обновить статус');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle2;
      case 'in-progress':
        return Clock;
      case 'overdue':
        return Clock;
      default:
        return Calendar;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Ожидает',
      'in-progress': 'В работе',
      completed: 'Завершено',
      overdue: 'Просрочено',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            План по товарам / брендам
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего задач: {plans.length}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидает</option>
            <option value="in-progress">В работе</option>
            <option value="completed">Завершено</option>
            <option value="overdue">Просрочено</option>
          </select>
          <button
            onClick={loadPlans}
            className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm font-medium"
          >
            Обновить
          </button>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет планов</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const StatusIcon = getStatusIcon(plan.status);
            return (
              <div
                key={plan.id}
                className={`bg-card border-2 rounded-lg p-4 ${getStatusColor(plan.status)}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    {plan.type === 'product' ? (
                      <Package className="w-5 h-5 text-primary" />
                    ) : (
                      <Building2 className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <span className="text-xs px-2 py-1 rounded bg-white/50">
                        {plan.type === 'product' ? 'Товар' : 'Бренд'}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-sm opacity-90 mb-2">{plan.description}</p>
                    )}
                    {plan.storeName && (
                      <p className="text-xs opacity-75 mb-1">
                        Магазин: <span className="font-medium">{plan.storeName}</span>
                      </p>
                    )}
                    {plan.target && (
                      <p className="text-xs opacity-75 mb-1">
                        Цель: <span className="font-medium">{plan.target}</span>
                      </p>
                    )}
                  </div>
                </div>

                {plan.progress !== undefined && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Прогресс</span>
                      <span>{plan.progress}%</span>
                    </div>
                    <div className="w-full bg-white/50 rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${plan.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-current/20">
                  <div className="flex items-center gap-2">
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">{getStatusLabel(plan.status)}</span>
                  </div>
                  {plan.dueDate && (
                    <div className="text-xs opacity-75">
                      {new Date(plan.dueDate).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>

                {plan.status !== 'completed' && (
                  <div className="mt-3 flex gap-2">
                    {plan.status === 'pending' && (
                      <button
                        onClick={() => updatePlanStatus(plan.id, 'in-progress')}
                        className="flex-1 px-3 py-1.5 bg-white/50 rounded text-xs font-medium hover:bg-white/70 transition-colors"
                      >
                        Начать
                      </button>
                    )}
                    {plan.status === 'in-progress' && (
                      <button
                        onClick={() => updatePlanStatus(plan.id, 'completed')}
                        className="flex-1 px-3 py-1.5 bg-white/50 rounded text-xs font-medium hover:bg-white/70 transition-colors"
                      >
                        Завершить
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
