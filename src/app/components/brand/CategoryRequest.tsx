import React, { useEffect, useState } from 'react';
import { Plus, Send, CheckCircle, XCircle, Clock, X } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  parentId?: string;
  subcategories?: Category[];
}

interface CategoryRequest {
  id: string;
  categoryName: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
  status: 'pending' | 'approved' | 'rejected';
  brandId: string;
  createdAt: string;
  updatedAt?: string;
  rejectionReason?: string;
}

export function CategoryRequest() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [requests, setRequests] = useState<CategoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    categoryName: '',
    parentCategoryId: '',
    parentCategoryName: '',
    useExistingParent: true,
  });

  useEffect(() => {
    loadCategories();
    loadRequests();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ items: Category[] }>('/categories');
      const flatCategories = response.data.items || [];
      const categoryMap = new Map<string, Category>();
      const topLevel: Category[] = [];

      flatCategories.forEach((cat) => {
        categoryMap.set(cat.id, { ...cat, subcategories: [] });
      });

      flatCategories.forEach((cat) => {
        if (cat.parentId && categoryMap.has(cat.parentId)) {
          const parent = categoryMap.get(cat.parentId)!;
          if (!parent.subcategories) {
            parent.subcategories = [];
          }
          parent.subcategories.push(categoryMap.get(cat.id)!);
        } else {
          topLevel.push(categoryMap.get(cat.id)!);
        }
      });

      setCategories(topLevel);
    } catch (error) {
      console.error('Ошибка загрузки категорий', error);
      toast.error('Не удалось загрузить категории');
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      setRequestsLoading(true);
      const response = await api.get<{ items: CategoryRequest[] }>('/categories/requests');
      setRequests(response.data.items || []);
    } catch (error) {
      console.error('Ошибка загрузки заявок', error);
      toast.error('Не удалось загрузить заявки');
    } finally {
      setRequestsLoading(false);
    }
  };

  const getAllCategoriesFlat = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    cats.forEach((cat) => {
      result.push(cat);
      if (cat.subcategories) {
        result.push(...getAllCategoriesFlat(cat.subcategories));
      }
    });
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        categoryName: formData.categoryName,
      };

      if (formData.useExistingParent && formData.parentCategoryId) {
        payload.parentCategoryId = formData.parentCategoryId;
      } else if (!formData.useExistingParent && formData.parentCategoryName) {
        payload.parentCategoryName = formData.parentCategoryName;
      }

      await api.post('/categories/requests', payload);
      toast.success('Заявка успешно отправлена');
      setShowForm(false);
      setFormData({
        categoryName: '',
        parentCategoryId: '',
        parentCategoryName: '',
        useExistingParent: true,
      });
      loadRequests();
    } catch (error: any) {
      console.error('Ошибка отправки заявки', error);
      toast.error(error.response?.data?.message || 'Не удалось отправить заявку');
    }
  };

  const allCategoriesFlat = getAllCategoriesFlat(categories);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Одобрена';
      case 'rejected':
        return 'Отклонена';
      default:
        return 'Ожидает рассмотрения';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Заявки на создание категорий</h2>
        <p className="text-sm text-gray-500 mt-1">
          Подайте заявку на создание новой категории или подкатегории
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Подать заявку
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Новая заявка на категорию</h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Название категории <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.categoryName}
                  onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Введите название категории"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Родительская категория</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formData.useExistingParent}
                      onChange={() => setFormData({ ...formData, useExistingParent: true, parentCategoryName: '' })}
                      className="w-4 h-4"
                    />
                    <span>Выбрать существующую категорию</span>
                  </label>
                  {formData.useExistingParent && (
                    <select
                      value={formData.parentCategoryId}
                      onChange={(e) => setFormData({ ...formData, parentCategoryId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Нет (верхний уровень)</option>
                      {allCategoriesFlat.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!formData.useExistingParent}
                      onChange={() => setFormData({ ...formData, useExistingParent: false, parentCategoryId: '' })}
                      className="w-4 h-4"
                    />
                    <span>Создать новую родительскую категорию</span>
                  </label>
                  {!formData.useExistingParent && (
                    <input
                      type="text"
                      value={formData.parentCategoryName}
                      onChange={(e) => setFormData({ ...formData, parentCategoryName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Введите название родительской категории"
                    />
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Отправить заявку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requests List */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">Мои заявки</h3>
        {requestsLoading ? (
          <div className="text-center py-8 text-gray-500">Загрузка заявок...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">У вас пока нет заявок</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(request.status)}
                      <h4 className="font-semibold text-lg">{request.categoryName}</h4>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          request.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {getStatusText(request.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {request.parentCategoryId ? (
                        <p>
                          <span className="font-medium">Родительская категория:</span> {request.parentCategoryId}
                        </p>
                      ) : request.parentCategoryName ? (
                        <p>
                          <span className="font-medium">Новая родительская категория:</span> {request.parentCategoryName}
                        </p>
                      ) : (
                        <p className="text-gray-500">Верхний уровень</p>
                      )}
                      <p>
                        <span className="font-medium">Дата создания:</span>{' '}
                        {new Date(request.createdAt).toLocaleString('ru-RU')}
                      </p>
                      {request.rejectionReason && (
                        <p className="text-red-600">
                          <span className="font-medium">Причина отклонения:</span> {request.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
