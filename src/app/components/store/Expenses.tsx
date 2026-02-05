import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit2, Trash2, X, Loader2, Calendar } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { ScrollToTopButton } from '../ui/scroll-to-top-button';

interface Expense {
  id: string;
  name: string;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface ExpenseFormData {
  name: string;
  amount: string;
  currency: string;
}

// Список готовых расходов для мини-маркетов
const PREDEFINED_EXPENSES = [
  { name: 'Аренда помещения', icon: '🏢' },
  { name: 'Коммунальные услуги', icon: '💡' },
  { name: 'Электричество', icon: '⚡' },
  { name: 'Вода', icon: '💧' },
  { name: 'Отопление', icon: '🔥' },
  { name: 'Интернет', icon: '🌐' },
  { name: 'Телефон', icon: '📞' },
  { name: 'Зарплата сотрудников', icon: '👥' },
  { name: 'Охрана', icon: '🛡️' },
  { name: 'Уборка', icon: '🧹' },
  { name: 'Реклама', icon: '📢' },
  { name: 'Налоги', icon: '📋' },
  { name: 'Страховка', icon: '🛡️' },
  { name: 'Техобслуживание оборудования', icon: '🔧' },
  { name: 'Транспортные расходы', icon: '🚚' },
  { name: 'Канцелярия', icon: '📝' },
  { name: 'Упаковочные материалы', icon: '📦' },
  { name: 'Банковские услуги', icon: '🏦' },
  { name: 'Лицензии и разрешения', icon: '📄' },
  { name: 'Холодильное оборудование', icon: '❄️' },
];

export function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    name: '',
    amount: '',
    currency: 'KZT',
  });
  const [userCurrency, setUserCurrency] = useState<string>('KZT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUserCurrency();
    fetchExpenses();
  }, []);

  const loadUserCurrency = async () => {
    try {
      const response = await api.get<{ currency?: string }>('/users/me/settings');
      const currency = response.data.currency || 'KZT';
      setUserCurrency(currency);
      setFormData((prev) => ({ ...prev, currency }));
    } catch (error) {
      console.warn('Не удалось загрузить валюту пользователя, используем значение по умолчанию', error);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/store-expenses');
      // Обрабатываем разные форматы ответа: массив или объект с массивом
      let expensesData: Expense[] = [];
      if (Array.isArray(response.data)) {
        expensesData = response.data;
      } else if (response.data && Array.isArray(response.data.items)) {
        expensesData = response.data.items;
      } else if (response.data && Array.isArray(response.data.expenses)) {
        expensesData = response.data.expenses;
      }
      setExpenses(expensesData);
    } catch (error: any) {
      console.error('Ошибка загрузки расходов', error);
      toast.error(error?.response?.data?.message || 'Не удалось загрузить расходы');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = () => {
    setEditingExpense(null);
    setFormData({
      name: '',
      amount: '',
      currency: userCurrency,
    });
    setShowForm(true);
  };

  const handleSelectPredefinedExpense = (expenseName: string) => {
    setFormData((prev) => ({
      ...prev,
      name: expenseName,
    }));
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      currency: expense.currency,
    });
    setShowForm(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот расход?')) {
      return;
    }
    try {
      await api.delete(`/store-expenses/${expenseId}`);
      toast.success('Расход успешно удален');
      fetchExpenses();
    } catch (error: any) {
      console.error('Ошибка удаления расхода', error);
      toast.error(error?.response?.data?.message || 'Не удалось удалить расход');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Введите название расхода');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Введите корректную сумму');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingExpense) {
        // Обновление расхода
        await api.put(`/store-expenses/${editingExpense.id}`, {
          name: formData.name.trim(),
          amount: amount,
        });
        toast.success('Расход успешно обновлен');
      } else {
        // Создание расхода
        await api.post('/store-expenses', {
          name: formData.name.trim(),
          amount: amount,
          currency: formData.currency,
        });
        toast.success('Расход успешно создан');
      }
      setShowForm(false);
      setEditingExpense(null);
      setFormData({
        name: '',
        amount: '',
        currency: userCurrency,
      });
      fetchExpenses();
    } catch (error: any) {
      console.error('Ошибка сохранения расхода', error);
      toast.error(error?.response?.data?.message || 'Не удалось сохранить расход');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Гарантируем, что expenses всегда массив
  const expensesList = Array.isArray(expenses) ? expenses : [];
  
  const totalAmount = expensesList.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const defaultCurrency = expensesList.length > 0 
    ? expensesList[0].currency 
    : userCurrency;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="bg-card border-b border-border sticky top-0 z-20 shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-foreground">Расходы</h1>
              <button
                onClick={handleCreateExpense}
                className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Управление расходами магазина</p>
            {expensesList.length > 0 && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Общая сумма</div>
                <div className="text-xl font-bold text-foreground">
                  {formatAmount(totalAmount, defaultCurrency)}
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : expensesList.length === 0 ? (
          <div className="p-4 text-center py-20">
            <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Нет расходов</p>
            <button
              onClick={handleCreateExpense}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Добавить расход
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-4 pb-24">
            {expensesList.map((expense) => (
              <div
                key={expense.id}
                className="bg-card border-2 border-border rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-foreground mb-1">
                      {expense.name}
                    </h3>
                    <div className="text-2xl font-bold text-primary mb-2">
                      {formatAmount(expense.amount, expense.currency)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(expense.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditExpense(expense)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-foreground" />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Расходы</h2>
            <p className="text-sm text-muted-foreground mt-1">Управление расходами магазина</p>
          </div>
          <button
            onClick={handleCreateExpense}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Добавить расход</span>
          </button>
        </div>

        {expensesList.length > 0 && (
          <div className="mb-6 p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Общая сумма</div>
            <div className="text-3xl font-bold text-foreground">
              {formatAmount(totalAmount, defaultCurrency)}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : expensesList.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-lg">
            <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Нет расходов</p>
            <button
              onClick={handleCreateExpense}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Добавить расход
            </button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Название</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Сумма</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Дата создания</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expensesList.map((expense) => (
                    <tr key={expense.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{expense.name}</td>
                      <td className="px-4 py-3">
                        <span className="text-lg font-bold text-primary">
                          {formatAmount(expense.amount, expense.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(expense.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Редактировать"
                          >
                            <Edit2 className="w-4 h-4 text-foreground" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
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
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-end md:items-center md:justify-center">
          <div className="bg-card w-full md:max-w-2xl md:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex-shrink-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-lg font-semibold text-foreground">
                {editingExpense ? 'Редактирование расхода' : 'Создание расхода'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingExpense(null);
                  setFormData({
                    name: '',
                    amount: '',
                    currency: userCurrency,
                  });
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted active:bg-accent transition-colors text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">
                    Название расхода <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-12 px-4 bg-input-background border-2 border-border rounded-xl text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    placeholder="Например: Аренда, Интернет"
                    required
                  />
                  
                  {/* Готовые расходы - показываем только при создании нового расхода */}
                  {!editingExpense && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Популярные расходы:</p>
                      <div className="flex flex-wrap gap-2">
                        {PREDEFINED_EXPENSES.map((expense) => (
                          <button
                            key={expense.name}
                            type="button"
                            onClick={() => handleSelectPredefinedExpense(expense.name)}
                            className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                              formData.name === expense.name
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-accent'
                            }`}
                          >
                            <span className="mr-1.5">{expense.icon}</span>
                            {expense.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">
                    Сумма <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="flex-1 h-12 px-4 bg-input-background border-2 border-border rounded-xl text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      placeholder="0"
                      required
                    />
                    {!editingExpense && (
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-24 h-12 px-3 bg-input-background border-2 border-border rounded-xl text-base text-foreground focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="KZT" className="bg-card text-foreground">KZT</option>
                        <option value="USD" className="bg-card text-foreground">USD</option>
                        <option value="EUR" className="bg-card text-foreground">EUR</option>
                        <option value="RUB" className="bg-card text-foreground">RUB</option>
                      </select>
                    )}
                    {editingExpense && (
                      <div className="w-24 h-12 px-3 flex items-center justify-center bg-muted border-2 border-border rounded-xl text-base text-foreground">
                        {formData.currency}
                      </div>
                    )}
                  </div>
                  {!editingExpense && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Валюта по умолчанию: {userCurrency}
                    </p>
                  )}
                </div>
              </div>

              {/* Sticky Bottom Actions */}
              <div className="flex-shrink-0 sticky bottom-0 bg-card border-t-2 border-border px-5 py-4 safe-area-inset-bottom">
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingExpense(null);
                      setFormData({
                        name: '',
                        amount: '',
                        currency: userCurrency,
                      });
                    }}
                    className="flex-1 h-12 border-2 border-border rounded-xl font-semibold text-foreground active:scale-98 transition-transform"
                    disabled={isSubmitting}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-12 bg-primary text-primary-foreground rounded-xl font-semibold shadow-md active:scale-98 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Сохранение...
                      </span>
                    ) : editingExpense ? (
                      'Сохранить'
                    ) : (
                      'Создать'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      <ScrollToTopButton />
    </div>
  );
}
