import React, { useState, useEffect } from 'react';
import { Calendar, Target, Package, Loader2, Plus, Edit2, Trash2, X, FolderTree } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface CategoryPlan {
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

interface CategoryPlansManagementProps {
  salesRepresentativeId: string;
  salesRepName: string;
  onClose: () => void;
}

export function CategoryPlansManagement({ salesRepresentativeId, salesRepName, onClose }: CategoryPlansManagementProps) {
  const [plans, setPlans] = useState<CategoryPlan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CategoryPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const currentYear = new Date().getFullYear().toString();

  // Форма создания/редактирования
  const [formData, setFormData] = useState({
    categoryId: '',
    targetAmount: '',
    targetQuantity: '',
    periodType: 'month' as 'month' | 'quarter' | 'year',
    periodMonth: '',
    periodQuarter: '',
    periodYear: currentYear,
    description: '',
  });

  useEffect(() => {
    const loadData = async () => {
      await loadCategories();
    };
    loadData();
  }, []);

  useEffect(() => {
    // Загружаем планы после загрузки категорий
    if (categories.length > 0) {
      loadPlans();
    }
  }, [categories, salesRepresentativeId]);

  const loadCategories = async () => {
    setIsCategoriesLoading(true);
    try {
      const response = await api.get<{ items?: Category[] }>('/categories');
      const items = response.data?.items || response.data || [];
      setCategories(Array.isArray(items) ? items : []);
    } catch (error: any) {
      console.error('Ошибка загрузки категорий', error);
      toast.error('Не удалось загрузить категории');
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ items?: CategoryPlan[] }>(
        `/plans/categories/sales-representatives/${salesRepresentativeId}`
      );
      const items = response.data?.items || response.data || [];
      const plansWithCategories = (Array.isArray(items) ? items : []).map((plan) => {
        const category = categories.find((cat) => cat.id === plan.categoryId);
        return {
          ...plan,
          categoryName: category?.name || '—',
        };
      });
      setPlans(plansWithCategories);
    } catch (error: any) {
      console.error('Ошибка загрузки планов по категориям', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить планы по категориям';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePeriod = (): { period: string; startDate?: string; endDate?: string } => {
    const year = formData.periodYear || new Date().getFullYear().toString();
    
    if (formData.periodType === 'month') {
      if (!formData.periodMonth) {
        throw new Error('Выберите месяц');
      }
      const month = formData.periodMonth.padStart(2, '0');
      const period = `${year}-${month}`;
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = new Date(parseInt(year), parseInt(month) - 1, lastDay).toISOString().split('T')[0];
      return { period, startDate, endDate };
    } else if (formData.periodType === 'quarter') {
      if (!formData.periodQuarter) {
        throw new Error('Выберите квартал');
      }
      const quarter = formData.periodQuarter;
      const period = `${year}-${quarter}`;
      const quarterNum = parseInt(quarter.replace('Q', ''));
      const startMonth = (quarterNum - 1) * 3;
      const startDate = new Date(parseInt(year), startMonth, 1).toISOString().split('T')[0];
      const endMonth = startMonth + 3;
      const lastDay = new Date(parseInt(year), endMonth, 0).getDate();
      const endDate = new Date(parseInt(year), endMonth - 1, lastDay).toISOString().split('T')[0];
      return { period, startDate, endDate };
    } else {
      const period = year;
      const startDate = new Date(parseInt(year), 0, 1).toISOString().split('T')[0];
      const endDate = new Date(parseInt(year), 11, 31).toISOString().split('T')[0];
      return { period, startDate, endDate };
    }
  };

  const resetForm = () => {
    setFormData({
      categoryId: '',
      targetAmount: '',
      targetQuantity: '',
      periodType: 'month',
      periodMonth: '',
      periodQuarter: '',
      periodYear: currentYear,
      description: '',
    });
  };

  const handleCreatePlan = async () => {
    if (!formData.categoryId || !formData.targetAmount || !formData.targetQuantity || !formData.periodYear) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const targetAmount = parseFloat(formData.targetAmount);
    const targetQuantity = parseInt(formData.targetQuantity);

    if (isNaN(targetAmount) || targetAmount < 0) {
      toast.error('План по сумме должен быть числом >= 0');
      return;
    }

    if (isNaN(targetQuantity) || targetQuantity < 0) {
      toast.error('План по количеству должен быть числом >= 0');
      return;
    }

    let periodData;
    try {
      periodData = generatePeriod();
    } catch (error: any) {
      toast.error(error.message);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        salesRepresentativeId,
        categoryId: formData.categoryId,
        targetAmount,
        targetQuantity,
        period: periodData.period,
      };

      if (formData.description) payload.description = formData.description;
      if (periodData.startDate) payload.startDate = periodData.startDate;
      if (periodData.endDate) payload.endDate = periodData.endDate;

      await api.post('/plans/categories', payload);
      toast.success('План по категории успешно создан');
      setIsCreateDialogOpen(false);
      resetForm();
      await loadPlans();
    } catch (error: any) {
      console.error('Ошибка создания плана по категории', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось создать план по категории';
      
      if (error.response?.status === 409) {
        toast.error('План на этот период для этой категории уже существует');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (plan: CategoryPlan) => {
    setSelectedPlan(plan);
    const period = plan.period;
    let periodType: 'month' | 'quarter' | 'year' = 'year';
    let periodMonth = '';
    let periodQuarter = '';
    let periodYear = currentYear;

    if (period.includes('-')) {
      const parts = period.split('-');
      if (parts.length === 2) {
        periodYear = parts[0];
        const secondPart = parts[1];
        if (secondPart.startsWith('Q')) {
          periodType = 'quarter';
          periodQuarter = secondPart;
        } else {
          periodType = 'month';
          periodMonth = secondPart;
        }
      }
    } else {
      periodType = 'year';
      periodYear = period;
    }

    setFormData({
      categoryId: plan.categoryId,
      targetAmount: plan.targetAmount.toString(),
      targetQuantity: plan.targetQuantity.toString(),
      periodType,
      periodMonth,
      periodQuarter,
      periodYear,
      description: plan.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;

    const targetAmount = formData.targetAmount ? parseFloat(formData.targetAmount) : undefined;
    const targetQuantity = formData.targetQuantity ? parseInt(formData.targetQuantity) : undefined;

    if (targetAmount !== undefined && (isNaN(targetAmount) || targetAmount < 0)) {
      toast.error('План по сумме должен быть числом >= 0');
      return;
    }

    if (targetQuantity !== undefined && (isNaN(targetQuantity) || targetQuantity < 0)) {
      toast.error('План по количеству должен быть числом >= 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {};
      if (formData.categoryId) payload.categoryId = formData.categoryId;
      if (formData.targetAmount) payload.targetAmount = targetAmount;
      if (formData.targetQuantity) payload.targetQuantity = targetQuantity;
      
      // Если изменен период, генерируем новый
      if (formData.periodYear) {
        try {
          const periodData = generatePeriod();
          payload.period = periodData.period;
          if (periodData.startDate) payload.startDate = periodData.startDate;
          if (periodData.endDate) payload.endDate = periodData.endDate;
        } catch (error: any) {
          toast.error(error.message);
          setIsSubmitting(false);
          return;
        }
      }
      
      if (formData.description !== undefined) payload.description = formData.description;

      await api.put(`/plans/categories/${selectedPlan.id}`, payload);
      toast.success('План по категории успешно обновлен');
      setIsEditDialogOpen(false);
      setSelectedPlan(null);
      resetForm();
      await loadPlans();
    } catch (error: any) {
      console.error('Ошибка обновления плана по категории', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось обновить план по категории';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот план по категории?')) {
      return;
    }

    setIsDeleting(planId);
    try {
      await api.delete(`/plans/categories/${planId}`);
      toast.success('План по категории удален');
      await loadPlans();
    } catch (error: any) {
      console.error('Ошибка удаления плана по категории', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось удалить план по категории';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(null);
    }
  };

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || '—';
  };

  const formatPeriod = (period: string): string => {
    if (period.includes('-')) {
      const parts = period.split('-');
      if (parts.length === 2) {
        const year = parts[0];
        const secondPart = parts[1];
        if (secondPart.startsWith('Q')) {
          return `${secondPart} ${year}`;
        } else {
          const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
          const monthNum = parseInt(secondPart);
          return `${monthNames[monthNum - 1]} ${year}`;
        }
      }
    }
    return period;
  };

  if (isLoading || isCategoriesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FolderTree className="w-6 h-6" />
            Планы по категориям
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            ТП: {salesRepName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Создать план
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Закрыть
          </Button>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <FolderTree className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет планов по категориям</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium">Категория</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Период</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">План по сумме</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">План по количеству</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Описание</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{getCategoryName(plan.categoryId)}</td>
                    <td className="px-4 py-3 text-sm">{formatPeriod(plan.period)}</td>
                    <td className="px-4 py-3 text-sm">
                      {plan.targetAmount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₸
                    </td>
                    <td className="px-4 py-3 text-sm">{plan.targetQuantity}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{plan.description || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(plan)}
                          className="p-1.5 hover:bg-accent rounded-md transition-colors"
                          title="Редактировать"
                        >
                          <Edit2 className="w-4 h-4 text-primary" />
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          disabled={isDeleting === plan.id}
                          className="p-1.5 hover:bg-accent rounded-md transition-colors disabled:opacity-50"
                          title="Удалить"
                        >
                          {isDeleting === plan.id ? (
                            <Loader2 className="w-4 h-4 text-destructive animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-destructive" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Диалог создания плана */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать план по категории</DialogTitle>
            <DialogDescription>
              Установите план по категории для ТП {salesRepName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Категория *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetAmount">План по сумме (₸) *</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetQuantity">План по количеству *</Label>
                <Input
                  id="targetQuantity"
                  type="number"
                  min="0"
                  value={formData.targetQuantity}
                  onChange={(e) => setFormData({ ...formData, targetQuantity: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Период *</Label>
              <Select
                value={formData.periodType}
                onValueChange={(value: 'month' | 'quarter' | 'year') => setFormData({ ...formData, periodType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Месяц</SelectItem>
                  <SelectItem value="quarter">Квартал</SelectItem>
                  <SelectItem value="year">Год</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.periodType === 'month' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periodMonth">Месяц *</Label>
                  <Select
                    value={formData.periodMonth}
                    onValueChange={(value) => setFormData({ ...formData, periodMonth: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите месяц" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
                        return (
                          <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                            {monthNames[month - 1]}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodYear">Год *</Label>
                  <Input
                    id="periodYear"
                    type="number"
                    min="2020"
                    max="2100"
                    value={formData.periodYear}
                    onChange={(e) => setFormData({ ...formData, periodYear: e.target.value })}
                  />
                </div>
              </div>
            )}

            {formData.periodType === 'quarter' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periodQuarter">Квартал *</Label>
                  <Select
                    value={formData.periodQuarter}
                    onValueChange={(value) => setFormData({ ...formData, periodQuarter: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите квартал" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1">Q1 (Январь-Март)</SelectItem>
                      <SelectItem value="Q2">Q2 (Апрель-Июнь)</SelectItem>
                      <SelectItem value="Q3">Q3 (Июль-Сентябрь)</SelectItem>
                      <SelectItem value="Q4">Q4 (Октябрь-Декабрь)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodYear">Год *</Label>
                  <Input
                    id="periodYear"
                    type="number"
                    min="2020"
                    max="2100"
                    value={formData.periodYear}
                    onChange={(e) => setFormData({ ...formData, periodYear: e.target.value })}
                  />
                </div>
              </div>
            )}

            {formData.periodType === 'year' && (
              <div className="space-y-2">
                <Label htmlFor="periodYear">Год *</Label>
                <Input
                  id="periodYear"
                  type="number"
                  min="2020"
                  max="2100"
                  value={formData.periodYear}
                  onChange={(e) => setFormData({ ...formData, periodYear: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Дополнительная информация о плане..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button onClick={handleCreatePlan} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Создание...
                </>
              ) : (
                'Создать'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования плана */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать план по категории</DialogTitle>
            <DialogDescription>
              Обновите план по категории для ТП {salesRepName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editCategoryId">Категория *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editTargetAmount">План по сумме (₸) *</Label>
                <Input
                  id="editTargetAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTargetQuantity">План по количеству *</Label>
                <Input
                  id="editTargetQuantity"
                  type="number"
                  min="0"
                  value={formData.targetQuantity}
                  onChange={(e) => setFormData({ ...formData, targetQuantity: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Период *</Label>
              <Select
                value={formData.periodType}
                onValueChange={(value: 'month' | 'quarter' | 'year') => setFormData({ ...formData, periodType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Месяц</SelectItem>
                  <SelectItem value="quarter">Квартал</SelectItem>
                  <SelectItem value="year">Год</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.periodType === 'month' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editPeriodMonth">Месяц *</Label>
                  <Select
                    value={formData.periodMonth}
                    onValueChange={(value) => setFormData({ ...formData, periodMonth: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите месяц" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
                        return (
                          <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                            {monthNames[month - 1]}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPeriodYear">Год *</Label>
                  <Input
                    id="editPeriodYear"
                    type="number"
                    min="2020"
                    max="2100"
                    value={formData.periodYear}
                    onChange={(e) => setFormData({ ...formData, periodYear: e.target.value })}
                  />
                </div>
              </div>
            )}

            {formData.periodType === 'quarter' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editPeriodQuarter">Квартал *</Label>
                  <Select
                    value={formData.periodQuarter}
                    onValueChange={(value) => setFormData({ ...formData, periodQuarter: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите квартал" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1">Q1 (Январь-Март)</SelectItem>
                      <SelectItem value="Q2">Q2 (Апрель-Июнь)</SelectItem>
                      <SelectItem value="Q3">Q3 (Июль-Сентябрь)</SelectItem>
                      <SelectItem value="Q4">Q4 (Октябрь-Декабрь)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPeriodYear">Год *</Label>
                  <Input
                    id="editPeriodYear"
                    type="number"
                    min="2020"
                    max="2100"
                    value={formData.periodYear}
                    onChange={(e) => setFormData({ ...formData, periodYear: e.target.value })}
                  />
                </div>
              </div>
            )}

            {formData.periodType === 'year' && (
              <div className="space-y-2">
                <Label htmlFor="editPeriodYear">Год *</Label>
                <Input
                  id="editPeriodYear"
                  type="number"
                  min="2020"
                  max="2100"
                  value={formData.periodYear}
                  onChange={(e) => setFormData({ ...formData, periodYear: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="editDescription">Описание</Label>
              <Textarea
                id="editDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Дополнительная информация о плане..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedPlan(null); resetForm(); }} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button onClick={handleUpdatePlan} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Сохранить'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
