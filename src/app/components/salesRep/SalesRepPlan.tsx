import React, { useState, useEffect } from 'react';
import { Calendar, Package, Target, Loader2, FolderTree } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface PlanItem {
  id: string;
  salesRepresentativeId: string;
  distributorId: string;
  targetAmount: number;
  targetQuantity: number;
  period: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface CategoryPlanItem {
  id: string;
  salesRepresentativeId: string;
  distributorId: string;
  categoryId: string;
  categoryName?: string;
  targetAmount: number;
  targetQuantity: number;
  period: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  parentId?: string;
}

export function SalesRepPlan() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [categoryPlans, setCategoryPlans] = useState<CategoryPlanItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoryPlansLoading, setIsCategoryPlansLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await loadCategories();
    };
    loadData();
    loadPlans();
  }, []);

  useEffect(() => {
    // Загружаем планы по категориям после загрузки категорий
    if (categories.length > 0) {
      loadCategoryPlans();
    }
  }, [categories]);

  const loadCategories = async () => {
    try {
      const response = await api.get<{ items?: Category[] }>('/categories');
      const items = response.data?.items || response.data || [];
      setCategories(Array.isArray(items) ? items : []);
    } catch (error: any) {
      console.error('Ошибка загрузки категорий', error);
    }
  };

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ items: PlanItem[]; total?: number }>('/plans/me');
      setPlans(response.data?.items || []);
    } catch (error: any) {
      console.error('Ошибка загрузки планов', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить планы';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategoryPlans = async () => {
    setIsCategoryPlansLoading(true);
    try {
      const response = await api.get<{ items?: CategoryPlanItem[] }>('/plans/categories/me');
      const items = response.data?.items || response.data || [];
      // Обновляем названия категорий после загрузки планов
      const plansWithCategories = (Array.isArray(items) ? items : []).map((plan) => {
        const category = categories.find((cat) => cat.id === plan.categoryId);
        return {
          ...plan,
          categoryName: category?.name || '—',
        };
      });
      setCategoryPlans(plansWithCategories);
    } catch (error: any) {
      console.error('Ошибка загрузки планов по категориям', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить планы по категориям';
      toast.error(errorMessage);
    } finally {
      setIsCategoryPlansLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPeriod = (period: string) => {
    // Формат может быть "2024-01", "2024-Q1", "2024"
    if (period.match(/^\d{4}-\d{2}$/)) {
      // Месяц: "2024-01"
      const [year, month] = period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' });
    } else if (period.match(/^\d{4}-Q\d$/)) {
      // Квартал: "2024-Q1"
      return period.replace('-Q', ' Q');
    } else {
      // Год: "2024"
      return period;
    }
  };

  const handleRefresh = () => {
    loadPlans();
    loadCategoryPlans();
  };

  if (isLoading || isCategoryPlansLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 md:w-6 md:h-6" />
            Планы продаж
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Общие планы: {plans.length} | Планы по категориям: {categoryPlans.length}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm font-medium self-start sm:self-auto"
        >
          Обновить
        </button>
      </div>

      {/* Общие планы */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Общие планы
        </h2>
        {plans.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Нет общих планов</p>
            <p className="text-sm text-muted-foreground mt-2">
              Планы будут отображаться здесь после их назначения дистрибьютором
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-card border border-border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-lg">{formatPeriod(plan.period)}</span>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">План по сумме:</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(plan.targetAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">План по количеству:</span>
                    </div>
                    <span className="font-semibold">{plan.targetQuantity} шт.</span>
                  </div>
                </div>

                {(plan.startDate || plan.endDate) && (
                  <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                    {plan.startDate && (
                      <div>Начало: {new Date(plan.startDate).toLocaleDateString('ru-RU')}</div>
                    )}
                    {plan.endDate && (
                      <div>Окончание: {new Date(plan.endDate).toLocaleDateString('ru-RU')}</div>
                    )}
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                  <div>Создан: {new Date(plan.createdAt).toLocaleDateString('ru-RU')}</div>
                  {plan.updatedAt !== plan.createdAt && (
                    <div>Обновлен: {new Date(plan.updatedAt).toLocaleDateString('ru-RU')}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Планы по категориям */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FolderTree className="w-5 h-5" />
          Планы по категориям
        </h2>
        {categoryPlans.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <FolderTree className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Нет планов по категориям</p>
            <p className="text-sm text-muted-foreground mt-2">
              Планы по категориям будут отображаться здесь после их назначения дистрибьютором
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {categoryPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-card border border-border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FolderTree className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-lg">{plan.categoryName || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{formatPeriod(plan.period)}</span>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">План по сумме:</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(plan.targetAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">План по количеству:</span>
                    </div>
                    <span className="font-semibold">{plan.targetQuantity} шт.</span>
                  </div>
                </div>

                {(plan.startDate || plan.endDate) && (
                  <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                    {plan.startDate && (
                      <div>Начало: {new Date(plan.startDate).toLocaleDateString('ru-RU')}</div>
                    )}
                    {plan.endDate && (
                      <div>Окончание: {new Date(plan.endDate).toLocaleDateString('ru-RU')}</div>
                    )}
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                  <div>Создан: {new Date(plan.createdAt).toLocaleDateString('ru-RU')}</div>
                  {plan.updatedAt !== plan.createdAt && (
                    <div>Обновлен: {new Date(plan.updatedAt).toLocaleDateString('ru-RU')}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
