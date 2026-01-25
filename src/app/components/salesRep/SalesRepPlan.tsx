import React, { useState, useEffect } from 'react';
import { Calendar, Package, Target, Loader2, FolderTree } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

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
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [selectedCategoryPlan, setSelectedCategoryPlan] = useState<CategoryPlanItem | null>(null);

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
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Период</TableHead>
                  <TableHead>План по сумме</TableHead>
                  <TableHead>План по количеству</TableHead>
                  <TableHead>Дата начала</TableHead>
                  <TableHead>Дата окончания</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow
                    key={plan.id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <TableCell className="font-medium">{formatPeriod(plan.period)}</TableCell>
                    <TableCell>{formatCurrency(plan.targetAmount)}</TableCell>
                    <TableCell>{plan.targetQuantity} шт.</TableCell>
                    <TableCell>
                      {plan.startDate ? new Date(plan.startDate).toLocaleDateString('ru-RU') : '—'}
                    </TableCell>
                    <TableCell>
                      {plan.endDate ? new Date(plan.endDate).toLocaleDateString('ru-RU') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Категория</TableHead>
                  <TableHead>Период</TableHead>
                  <TableHead>План по сумме</TableHead>
                  <TableHead>План по количеству</TableHead>
                  <TableHead>Дата начала</TableHead>
                  <TableHead>Дата окончания</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryPlans.map((plan) => (
                  <TableRow
                    key={plan.id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => setSelectedCategoryPlan(plan)}
                  >
                    <TableCell className="font-medium">{plan.categoryName || '—'}</TableCell>
                    <TableCell>{formatPeriod(plan.period)}</TableCell>
                    <TableCell>{formatCurrency(plan.targetAmount)}</TableCell>
                    <TableCell>{plan.targetQuantity} шт.</TableCell>
                    <TableCell>
                      {plan.startDate ? new Date(plan.startDate).toLocaleDateString('ru-RU') : '—'}
                    </TableCell>
                    <TableCell>
                      {plan.endDate ? new Date(plan.endDate).toLocaleDateString('ru-RU') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Попап для общего плана */}
      <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Target className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span>Общий план</span>
            </DialogTitle>
            <DialogDescription className="text-sm">Детальная информация о плане</DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-3 md:space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-semibold">Период:</span>
                  <span>{formatPeriod(selectedPlan.period)}</span>
                </div>
                {selectedPlan.description && (
                  <div className="pt-2">
                    <span className="font-semibold">Описание:</span>
                    <p className="text-sm text-muted-foreground mt-1">{selectedPlan.description}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">План по сумме:</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(selectedPlan.targetAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">План по количеству:</span>
                  </div>
                  <span className="font-semibold">{selectedPlan.targetQuantity} шт.</span>
                </div>
              </div>

              {(selectedPlan.startDate || selectedPlan.endDate) && (
                <div className="text-sm pt-2 border-t border-border space-y-1">
                  {selectedPlan.startDate && (
                    <div>
                      <span className="font-semibold">Дата начала:</span>{' '}
                      {new Date(selectedPlan.startDate).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  )}
                  {selectedPlan.endDate && (
                    <div>
                      <span className="font-semibold">Дата окончания:</span>{' '}
                      {new Date(selectedPlan.endDate).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs text-muted-foreground pt-2 border-t border-border space-y-1">
                <div>
                  <span className="font-semibold">Создан:</span>{' '}
                  {new Date(selectedPlan.createdAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                {selectedPlan.updatedAt !== selectedPlan.createdAt && (
                  <div>
                    <span className="font-semibold">Обновлен:</span>{' '}
                    {new Date(selectedPlan.updatedAt).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Попап для плана по категории */}
      <Dialog open={!!selectedCategoryPlan} onOpenChange={(open) => !open && setSelectedCategoryPlan(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
              <FolderTree className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span>План по категории</span>
            </DialogTitle>
            <DialogDescription className="text-sm">Детальная информация о плане по категории</DialogDescription>
          </DialogHeader>
          {selectedCategoryPlan && (
            <div className="space-y-3 md:space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-primary" />
                  <span className="font-semibold">Категория:</span>
                  <span>{selectedCategoryPlan.categoryName || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-semibold">Период:</span>
                  <span>{formatPeriod(selectedCategoryPlan.period)}</span>
                </div>
                {selectedCategoryPlan.description && (
                  <div className="pt-2">
                    <span className="font-semibold">Описание:</span>
                    <p className="text-sm text-muted-foreground mt-1">{selectedCategoryPlan.description}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">План по сумме:</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(selectedCategoryPlan.targetAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">План по количеству:</span>
                  </div>
                  <span className="font-semibold">{selectedCategoryPlan.targetQuantity} шт.</span>
                </div>
              </div>

              {(selectedCategoryPlan.startDate || selectedCategoryPlan.endDate) && (
                <div className="text-sm pt-2 border-t border-border space-y-1">
                  {selectedCategoryPlan.startDate && (
                    <div>
                      <span className="font-semibold">Дата начала:</span>{' '}
                      {new Date(selectedCategoryPlan.startDate).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  )}
                  {selectedCategoryPlan.endDate && (
                    <div>
                      <span className="font-semibold">Дата окончания:</span>{' '}
                      {new Date(selectedCategoryPlan.endDate).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs text-muted-foreground pt-2 border-t border-border space-y-1">
                <div>
                  <span className="font-semibold">Создан:</span>{' '}
                  {new Date(selectedCategoryPlan.createdAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                {selectedCategoryPlan.updatedAt !== selectedCategoryPlan.createdAt && (
                  <div>
                    <span className="font-semibold">Обновлен:</span>{' '}
                    {new Date(selectedCategoryPlan.updatedAt).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
