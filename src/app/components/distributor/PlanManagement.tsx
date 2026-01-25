import React, { useState, useEffect } from 'react';
import { Calendar, Target, Package, Loader2, Plus, Edit2, Trash2, X } from 'lucide-react';
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

interface Plan {
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

interface PlanManagementProps {
  salesRepresentativeId: string;
  salesRepName: string;
  onClose: () => void;
}

export function PlanManagement({ salesRepresentativeId, salesRepName, onClose }: PlanManagementProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const currentYear = new Date().getFullYear().toString();

  // Форма создания/редактирования
  const [formData, setFormData] = useState({
    targetAmount: '',
    targetQuantity: '',
    periodType: 'month' as 'month' | 'quarter' | 'year',
    periodMonth: '',
    periodQuarter: '',
    periodYear: currentYear,
    description: '',
  });

  useEffect(() => {
    loadPlans();
  }, [salesRepresentativeId]);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ items: Plan[]; total?: number }>(
        `/plans/sales-representatives/${salesRepresentativeId}`
      );
      setPlans(response.data?.items || []);
    } catch (error: any) {
      console.error('Ошибка загрузки планов', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить планы';
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

  const handleCreatePlan = async () => {
    if (!formData.targetAmount || !formData.targetQuantity || !formData.periodYear) {
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
        targetAmount,
        targetQuantity,
        period: periodData.period,
      };

      if (formData.description) payload.description = formData.description;
      if (periodData.startDate) payload.startDate = periodData.startDate;
      if (periodData.endDate) payload.endDate = periodData.endDate;

      await api.post('/plans', payload);
      toast.success('План успешно создан');
      setIsCreateDialogOpen(false);
      resetForm();
      await loadPlans();
    } catch (error: any) {
      console.error('Ошибка создания плана', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось создать план';
      
      if (error.response?.status === 409) {
        toast.error('План на этот период уже существует');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
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

      await api.put(`/plans/${selectedPlan.id}`, payload);
      toast.success('План успешно обновлен');
      setIsEditDialogOpen(false);
      setSelectedPlan(null);
      resetForm();
      await loadPlans();
    } catch (error: any) {
      console.error('Ошибка обновления плана', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось обновить план';
      
      if (error.response?.status === 409) {
        toast.error('План на новый период уже существует');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот план?')) {
      return;
    }

    setIsDeleting(planId);
    try {
      await api.delete(`/plans/${planId}`);
      toast.success('План успешно удален');
      await loadPlans();
    } catch (error: any) {
      console.error('Ошибка удаления плана', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось удалить план';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(null);
    }
  };

  const parsePeriod = (period: string) => {
    if (period.match(/^\d{4}-\d{2}$/)) {
      // Месяц: "2024-01"
      const [year, month] = period.split('-');
      return { type: 'month' as const, year, month, quarter: '' };
    } else if (period.match(/^\d{4}-Q\d$/)) {
      // Квартал: "2024-Q1"
      const [year, quarter] = period.split('-');
      return { type: 'quarter' as const, year, month: '', quarter };
    } else {
      // Год: "2024"
      return { type: 'year' as const, year: period, month: '', quarter: '' };
    }
  };

  const openEditDialog = (plan: Plan) => {
    setSelectedPlan(plan);
    const parsed = parsePeriod(plan.period);
    setFormData({
      targetAmount: plan.targetAmount.toString(),
      targetQuantity: plan.targetQuantity.toString(),
      periodType: parsed.type,
      periodMonth: parsed.month,
      periodQuarter: parsed.quarter,
      periodYear: parsed.year,
      description: plan.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      targetAmount: '',
      targetQuantity: '',
      periodType: 'month',
      periodMonth: '',
      periodQuarter: '',
      periodYear: currentYear,
      description: '',
    });
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Управление планами</h2>
          <p className="text-sm text-muted-foreground">
            Торговый представитель: {salesRepName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Создать план
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет планов</p>
          <p className="text-sm text-muted-foreground mt-2">Создайте первый план для этого торгового представителя</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-card border border-border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{formatPeriod(plan.period)}</span>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(plan)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePlan(plan.id)}
                    disabled={isDeleting === plan.id}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    {isDeleting === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
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
            </div>
          ))}
        </div>
      )}

      {/* Диалог создания плана */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать план</DialogTitle>
            <DialogDescription>
              Установите план по сумме и количеству для торгового представителя
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="targetAmount">План по сумме (₸) *</Label>
              <Input
                id="targetAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                placeholder="100000"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetQuantity">План по количеству (шт.) *</Label>
              <Input
                id="targetQuantity"
                type="number"
                min="0"
                value={formData.targetQuantity}
                onChange={(e) => setFormData({ ...formData, targetQuantity: e.target.value })}
                placeholder="500"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label>Период *</Label>
              <div className="space-y-3">
                <Select
                  value={formData.periodType}
                  onValueChange={(value: 'month' | 'quarter' | 'year') => {
                    setFormData({ ...formData, periodType: value, periodMonth: '', periodQuarter: '' });
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип периода" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Месяц</SelectItem>
                    <SelectItem value="quarter">Квартал</SelectItem>
                    <SelectItem value="year">Год</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="periodYear">Год *</Label>
                    <Input
                      id="periodYear"
                      type="number"
                      min="2020"
                      max="2100"
                      value={formData.periodYear}
                      onChange={(e) => setFormData({ ...formData, periodYear: e.target.value })}
                      placeholder="2024"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  {formData.periodType === 'month' && (
                    <div className="space-y-2">
                      <Label htmlFor="periodMonth">Месяц *</Label>
                      <Select
                        value={formData.periodMonth}
                        onValueChange={(value) => setFormData({ ...formData, periodMonth: value })}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите месяц" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => {
                            const monthNum = (i + 1).toString().padStart(2, '0');
                            const date = new Date(2000, i, 1);
                            const monthName = date.toLocaleDateString('ru-RU', { month: 'long' });
                            return (
                              <SelectItem key={monthNum} value={monthNum}>
                                {monthName}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {formData.periodType === 'quarter' && (
                    <div className="space-y-2">
                      <Label htmlFor="periodQuarter">Квартал *</Label>
                      <Select
                        value={formData.periodQuarter}
                        onValueChange={(value) => setFormData({ ...formData, periodQuarter: value })}
                        disabled={isSubmitting}
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
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="План на январь"
                disabled={isSubmitting}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleCreatePlan} disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Создание...
                </>
              ) : (
                'Создать'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
              className="w-full"
            >
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования плана */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать план</DialogTitle>
            <DialogDescription>
              Обновите план по сумме и количеству
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editTargetAmount">План по сумме (₸)</Label>
              <Input
                id="editTargetAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                placeholder="100000"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTargetQuantity">План по количеству (шт.)</Label>
              <Input
                id="editTargetQuantity"
                type="number"
                min="0"
                value={formData.targetQuantity}
                onChange={(e) => setFormData({ ...formData, targetQuantity: e.target.value })}
                placeholder="500"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label>Период</Label>
              <div className="space-y-3">
                <Select
                  value={formData.periodType}
                  onValueChange={(value: 'month' | 'quarter' | 'year') => {
                    setFormData({ ...formData, periodType: value, periodMonth: '', periodQuarter: '' });
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип периода" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Месяц</SelectItem>
                    <SelectItem value="quarter">Квартал</SelectItem>
                    <SelectItem value="year">Год</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="editPeriodYear">Год</Label>
                    <Input
                      id="editPeriodYear"
                      type="number"
                      min="2020"
                      max="2100"
                      value={formData.periodYear}
                      onChange={(e) => setFormData({ ...formData, periodYear: e.target.value })}
                      placeholder="2024"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  {formData.periodType === 'month' && (
                    <div className="space-y-2">
                      <Label htmlFor="editPeriodMonth">Месяц</Label>
                      <Select
                        value={formData.periodMonth}
                        onValueChange={(value) => setFormData({ ...formData, periodMonth: value })}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите месяц" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => {
                            const monthNum = (i + 1).toString().padStart(2, '0');
                            const date = new Date(2000, i, 1);
                            const monthName = date.toLocaleDateString('ru-RU', { month: 'long' });
                            return (
                              <SelectItem key={monthNum} value={monthNum}>
                                {monthName}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {formData.periodType === 'quarter' && (
                    <div className="space-y-2">
                      <Label htmlFor="editPeriodQuarter">Квартал</Label>
                      <Select
                        value={formData.periodQuarter}
                        onValueChange={(value) => setFormData({ ...formData, periodQuarter: value })}
                        disabled={isSubmitting}
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
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Описание</Label>
              <Textarea
                id="editDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="План на январь"
                disabled={isSubmitting}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleUpdatePlan} disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Обновление...
                </>
              ) : (
                'Сохранить'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedPlan(null);
                resetForm();
              }}
              disabled={isSubmitting}
              className="w-full"
            >
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
