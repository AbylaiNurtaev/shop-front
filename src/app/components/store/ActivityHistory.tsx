import React, { useState, useEffect } from 'react';
import { Activity, Calendar, Package, Plus, Minus, DollarSign, FileText, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

type ActionType = 'ADD_STOCK' | 'REMOVE_STOCK' | 'UPDATE_PRICE' | 'UPDATE_QUANTITY' | 'CONFIRM_INVOICE';

interface ActivityItem {
  actionType: ActionType;
  description: string;
  metadata: {
    productId?: string;
    productName?: string;
    sku?: string;
    brandName?: string;
    quantity?: number;
    totalQuantity?: number;
    oldQuantity?: number;
    newQuantity?: number;
    price?: number;
    currency?: string;
    oldPrice?: number;
    newPrice?: number;
    oldCurrency?: string;
    newCurrency?: string;
    invoiceId?: string;
    invoiceNumber?: string;
    offerId?: string;
  };
  timestamp: string;
}

interface ActivityHistoryResponse {
  actions: ActivityItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const actionTypeLabels: Record<ActionType, string> = {
  ADD_STOCK: 'Добавление на склад',
  REMOVE_STOCK: 'Списание со склада',
  UPDATE_PRICE: 'Изменение цены',
  UPDATE_QUANTITY: 'Изменение количества',
  CONFIRM_INVOICE: 'Подтверждение накладной',
};

const actionTypeIcons: Record<ActionType, React.ComponentType<{ className?: string }>> = {
  ADD_STOCK: Plus,
  REMOVE_STOCK: Minus,
  UPDATE_PRICE: DollarSign,
  UPDATE_QUANTITY: Package,
  CONFIRM_INVOICE: FileText,
};

const actionTypeColors: Record<ActionType, string> = {
  ADD_STOCK: 'bg-green-100 text-green-700 border-green-200',
  REMOVE_STOCK: 'bg-red-100 text-red-700 border-red-200',
  UPDATE_PRICE: 'bg-blue-100 text-blue-700 border-blue-200',
  UPDATE_QUANTITY: 'bg-orange-100 text-orange-700 border-orange-200',
  CONFIRM_INVOICE: 'bg-purple-100 text-purple-700 border-purple-200',
};

export function ActivityHistory() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchActivities = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const response = await api.get<ActivityHistoryResponse>('/warehouse/activity/history', {
        params: { page: pageNum, limit: 20 }
      });
      setActivities(response.data?.actions || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
      setPage(response.data?.pagination?.page || 1);
    } catch (error: any) {
      console.error('Ошибка загрузки истории действий', error);
      toast.error(error?.response?.data?.message || 'Не удалось загрузить историю действий');
      setActivities([]);
      setTotalPages(1);
      setPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(page);
  }, [page]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionDescription = (activity: ActivityItem) => {
    if (activity.description) {
      return activity.description;
    }

    const { metadata } = activity;
    switch (activity.actionType) {
      case 'ADD_STOCK':
        return `Добавлено ${metadata.quantity || 0} шт. товара "${metadata.productName || 'Неизвестный товар'}"`;
      case 'REMOVE_STOCK':
        return `Списано ${metadata.quantity || 0} шт. товара "${metadata.productName || 'Неизвестный товар'}"`;
      case 'UPDATE_PRICE':
        return `Изменена цена товара "${metadata.productName || 'Неизвестный товар'}" с ${metadata.oldPrice || 0} ₽ на ${metadata.newPrice || 0} ₽`;
      case 'UPDATE_QUANTITY':
        return `Изменено количество товара "${metadata.productName || 'Неизвестный товар'}" с ${metadata.oldQuantity || 0} на ${metadata.newQuantity || 0} шт.`;
      case 'CONFIRM_INVOICE':
        return `Подтверждена накладная ${metadata.invoiceNumber || metadata.invoiceId || 'без номера'}`;
      default:
        return 'Действие выполнено';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="p-4">
            <h1 className="text-2xl font-bold text-gray-900">История действий</h1>
            <p className="text-sm text-gray-600 mt-1">Все действия с товарами и складом</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="p-4 text-center py-20">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Нет действий в истории</p>
          </div>
        ) : (
          <>
            <div className="p-4 space-y-4 pb-24">
              {(activities || []).map((activity, idx) => {
                const Icon = actionTypeIcons[activity.actionType] || Activity;
                const colorClass = actionTypeColors[activity.actionType] || 'bg-gray-100 text-gray-700 border-gray-200';

                return (
                  <div
                    key={`${activity.actionType}-${activity.timestamp}-${idx}`}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${colorClass}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base text-gray-900">
                              {actionTypeLabels[activity.actionType] || 'Неизвестное действие'}
                            </h3>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">
                          {getActionDescription(activity)}
                        </p>

                        {activity.metadata.productName && (
                          <div className="text-xs text-gray-500 mb-2 space-y-1">
                            <div>
                              Товар: <span className="font-medium">{activity.metadata.productName}</span>
                            </div>
                            {activity.metadata.sku && (
                              <div>
                                Артикул: <span className="font-medium">{activity.metadata.sku}</span>
                              </div>
                            )}
                            {activity.metadata.brandName && (
                              <div>
                                Бренд: <span className="font-medium">{activity.metadata.brandName}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(activity.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Назад</span>
                </button>
                <span className="text-sm text-gray-600">
                  Страница {page} из {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Вперед</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">История действий</h2>
          <p className="text-sm text-gray-500 mt-1">Все действия с товарами и складом</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="text-center py-20">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Нет действий в истории</p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium">Тип действия</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Описание</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Товар</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Детали</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Время</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(activities || []).map((activity, idx) => {
                      const Icon = actionTypeIcons[activity.actionType] || Activity;
                      const colorClass = actionTypeColors[activity.actionType] || 'bg-gray-100 text-gray-700 border-gray-200';

                      return (
                        <tr key={`${activity.actionType}-${activity.timestamp}-${idx}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${colorClass}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="font-medium">{actionTypeLabels[activity.actionType] || 'Неизвестное действие'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{getActionDescription(activity)}</td>
                          <td className="px-4 py-3 text-sm">
                            {activity.metadata.productName || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {activity.actionType === 'UPDATE_QUANTITY' && (
                              <span>
                                {activity.metadata.oldQuantity || 0} → {activity.metadata.newQuantity || 0} шт.
                              </span>
                            )}
                            {activity.actionType === 'UPDATE_PRICE' && (
                              <span>
                                {activity.metadata.oldPrice || 0} {activity.metadata.oldCurrency || 'RUB'} → {activity.metadata.newPrice || 0} {activity.metadata.newCurrency || 'RUB'}
                              </span>
                            )}
                            {activity.actionType === 'ADD_STOCK' && (
                              <span className="text-green-700">
                                +{activity.metadata.quantity || 0} шт.
                                {activity.metadata.totalQuantity !== undefined && ` (итого: ${activity.metadata.totalQuantity})`}
                              </span>
                            )}
                            {activity.actionType === 'REMOVE_STOCK' && (
                              <span className="text-red-700">-{activity.metadata.quantity || 0} шт.</span>
                            )}
                            {activity.actionType === 'CONFIRM_INVOICE' && (
                              <span>{activity.metadata.invoiceNumber || activity.metadata.invoiceId || '—'}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDate(activity.timestamp)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Назад
                </button>
                <span className="text-sm text-gray-600">
                  Страница {page} из {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперед
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
