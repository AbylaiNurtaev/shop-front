import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, Folder, X, Check, XCircle, Building2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  name?: string; // Бэкенд возвращает name, а не categoryName
  categoryName?: string;
  parentCategoryId?: string | null;
  parentCategoryName?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'PENDING' | 'APPROVED' | 'REJECTED';
  brandId: string;
  brandName?: string;
  brand?: {
    name: string;
  };
  createdAt: string;
  updatedAt?: string;
  rejectionReason?: string | null;
}

export function AdminCategoryManagement() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [requests, setRequests] = useState<CategoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', parentId: '' });
  const [parentCategoryName, setParentCategoryName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'categories' | 'requests'>('categories');
  const [showCreateFromRequest, setShowCreateFromRequest] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CategoryRequest | null>(null);
  const [createCategoryData, setCreateCategoryData] = useState({ name: '', parentId: '' });
  const [editingParentCategoryName, setEditingParentCategoryName] = useState(false);
  const [editedParentCategoryName, setEditedParentCategoryName] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'requests') {
      loadRequests();
    }
  }, [activeTab]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ items: any[] }>('/categories');
      const items = response.data.items || [];
      const topLevel: Category[] = [];

      // Рекурсивная функция для обработки подкатегорий
      const processSubcategories = (subcats: any[]): Category[] => {
        return subcats.map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          parentId: sub.parentId || sub.parentCategoryId,
          subcategories: sub.subCategories || sub.subcategories ? processSubcategories(sub.subCategories || sub.subcategories) : [],
        }));
      };

      // Обрабатываем основные категории
      items.forEach((cat: any) => {
        // Проверяем, является ли это верхнеуровневой категорией (нет parentId/parentCategoryId)
        const parentId = cat.parentId || cat.parentCategoryId;
        if (!parentId) {
          const category: Category = {
            id: cat.id,
            name: cat.name,
            parentId: undefined,
            subcategories: cat.subCategories || cat.subcategories ? processSubcategories(cat.subCategories || cat.subcategories) : [],
          };
          topLevel.push(category);
        }
      });

      setCategories(topLevel);
      console.log('Загруженные категории:', topLevel);
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
      const response = await api.get<{ items: any[] }>('/categories/requests/all');
      // Маппим данные с бэкенда
      const mappedRequests: CategoryRequest[] = (response.data.items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        categoryName: item.name || item.categoryName,
        parentCategoryId: item.parentCategoryId,
        parentCategoryName: item.parentCategoryName,
        status: item.status?.toLowerCase() as 'pending' | 'approved' | 'rejected',
        brandId: item.brandId,
        brandName: item.brand?.name || item.brandName,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        rejectionReason: item.rejectedReason || item.rejectionReason,
      }));
      setRequests(mappedRequests);
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
      if (editingId) {
        await api.put(`/categories/${editingId}`, {
          name: formData.name,
        });
        toast.success('Категория обновлена');
      } else {
        await api.post('/categories', {
          name: formData.name,
          parentCategoryId: formData.parentId || undefined,
        });
        toast.success('Категория создана');
      }
      handleCloseForm();
      loadCategories();
    } catch (error: any) {
      console.error('Ошибка сохранения категории', error);
      toast.error(error.response?.data?.message || 'Не удалось сохранить категорию');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({ name: category.name, parentId: category.parentId || '' });
    setShowForm(true);
  };

  const handleAddSubcategory = (parentCategory: Category) => {
    setEditingId(null);
    setFormData({ name: '', parentId: parentCategory.id });
    setParentCategoryName(parentCategory.name);
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию? Все подкатегории также будут удалены.')) {
      return;
    }
    try {
      await api.delete(`/categories/${categoryId}`);
      toast.success('Категория удалена');
      loadCategories();
    } catch (error: any) {
      console.error('Ошибка удаления категории', error);
      toast.error(error.response?.data?.message || 'Не удалось удалить категорию');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await api.post(`/categories/requests/${requestId}/approve`);
      toast.success('Заявка одобрена');
      loadRequests();
      loadCategories();
    } catch (error: any) {
      console.error('Ошибка одобрения заявки', error);
      toast.error(error.response?.data?.message || 'Не удалось одобрить заявку');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt('Укажите причину отклонения:');
    if (!reason) return;
    try {
      await api.post(`/categories/requests/${requestId}/reject`, { reason });
      toast.success('Заявка отклонена');
      loadRequests();
    } catch (error: any) {
      console.error('Ошибка отклонения заявки', error);
      toast.error(error.response?.data?.message || 'Не удалось отклонить заявку');
    }
  };

  const handleCreateFromRequest = (request: CategoryRequest) => {
    setSelectedRequest(request);
    const categoryName = request.name || request.categoryName || '';
    const parentId = request.parentCategoryId || '';
    const parentName = request.parentCategoryName || '';
    setCreateCategoryData({
      name: categoryName,
      parentId: parentId || '',
    });
    setEditedParentCategoryName(parentName);
    setEditingParentCategoryName(false);
    setShowCreateFromRequest(true);
  };

  const handleSubmitCreateFromRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      let parentCategoryId = createCategoryData.parentId || undefined;

      // Если нужно создать новую родительскую категорию (пользователь не выбрал существующую)
      if (selectedRequest.parentCategoryName && !createCategoryData.parentId) {
        // Используем отредактированное название или оригинальное
        const parentName = editedParentCategoryName || selectedRequest.parentCategoryName;
        // Сначала создаем родительскую категорию
        const parentResponse = await api.post('/categories', {
          name: parentName,
        });
        parentCategoryId = parentResponse.data.id || parentResponse.data._id;
        toast.success('Родительская категория создана');
      } else if (selectedRequest.parentCategoryName && createCategoryData.parentId) {
        // Пользователь выбрал существующую категорию вместо создания новой
        parentCategoryId = createCategoryData.parentId;
      }

      // Создаем основную категорию
      await api.post('/categories', {
        name: createCategoryData.name,
        parentCategoryId: parentCategoryId,
      });

      // Удаляем заявку (одобряем её)
      try {
        await api.post(`/categories/requests/${selectedRequest.id}/approve`);
      } catch (approveError) {
        // Если одобрение не удалось, просто удаляем заявку
        console.warn('Не удалось одобрить заявку, но категория создана', approveError);
      }

      // Закрываем модальное окно сразу
      setShowCreateFromRequest(false);
      setSelectedRequest(null);
      setCreateCategoryData({ name: '', parentId: '' });
      setEditedParentCategoryName('');
      setEditingParentCategoryName(false);

      toast.success('Категория создана, заявка обработана');

      // Обновляем данные в фоне
      loadRequests();
      loadCategories();
    } catch (error: any) {
      console.error('Ошибка создания категории из заявки', error);
      toast.error(error.response?.data?.message || 'Не удалось создать категорию');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту заявку?')) return;
    try {
      await api.post(`/categories/requests/${requestId}/reject`, { reason: 'Удалено администратором' });
      toast.success('Заявка удалена');
      loadRequests();
    } catch (error: any) {
      console.error('Ошибка удаления заявки', error);
      toast.error(error.response?.data?.message || 'Не удалось удалить заявку');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', parentId: '' });
    setParentCategoryName('');
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryTree = (category: Category, level = 0) => {
    const hasChildren = category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id} className="mb-1">
        {/* Основная категория */}
        <div
          className={`flex items-center justify-between p-3 rounded-lg transition-all ${level === 0
            ? 'bg-white border-2 border-gray-200 hover:border-blue-300 shadow-sm'
            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
            }`}
        >
          <div
            className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
            onClick={() => hasChildren && toggleCategory(category.id)}
          >
            {hasChildren ? (
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
              </div>
            ) : (
              <div className="w-5" />
            )}
            <Folder className={`w-5 h-5 flex-shrink-0 ${level === 0 ? 'text-blue-600' : 'text-gray-500'}`} />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={`font-medium truncate ${level === 0 ? 'text-gray-900 text-base' : 'text-gray-700 text-sm'}`}>
                {category.name}
              </span>
              {hasChildren && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {category.subcategories!.length} {category.subcategories!.length === 1 ? 'подкатегория' : 'подкатегорий'}
                </span>
              )}
              {level > 0 && (
                <span className="text-xs text-gray-400 italic">(подкатегория)</span>
              )}
            </div>
            {hasChildren && (
              <span className="text-xs text-gray-400 ml-2">
                {isExpanded ? 'Нажмите, чтобы свернуть' : 'Нажмите, чтобы развернуть'}
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
            {level === 0 && (
              <button
                onClick={() => handleAddSubcategory(category)}
                className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                title="Добавить подкатегорию"
              >
                <Plus className="w-4 h-4 text-green-600" />
              </button>
            )}
            <button
              onClick={() => handleEdit(category)}
              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
              title="Редактировать"
            >
              <Edit className="w-4 h-4 text-blue-600" />
            </button>
            <button
              onClick={() => handleDelete(category.id)}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Удалить"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>

        {/* Развернутые подкатегории */}
        {isExpanded && hasChildren && (
          <div className="mt-2 ml-6 space-y-1 border-l-2 border-blue-200 pl-4">
            {category.subcategories!.map((sub) => (
              <div key={sub.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Folder className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-sm text-gray-700 truncate">{sub.name}</span>
                    <span className="text-xs text-gray-400 italic">(подкатегория)</span>
                    {sub.subcategories && sub.subcategories.length > 0 && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {sub.subcategories.length} {sub.subcategories.length === 1 ? 'подкатегория' : 'подкатегорий'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-3">
                    {sub.subcategories && sub.subcategories.length > 0 && (
                      <button
                        onClick={() => toggleCategory(sub.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={expandedCategories.has(sub.id) ? 'Свернуть' : 'Развернуть'}
                      >
                        {expandedCategories.has(sub.id) ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(sub)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
                {/* Вложенные подкатегории (если есть) */}
                {expandedCategories.has(sub.id) && sub.subcategories && sub.subcategories.length > 0 && (
                  <div className="mt-2 ml-4 space-y-1 border-l-2 border-gray-200 pl-3">
                    {sub.subcategories.map((nested) => (
                      <div key={nested.id} className="bg-gray-50 border border-gray-200 rounded p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Folder className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="text-xs font-medium text-gray-600 truncate">{nested.name}</span>
                            <span className="text-xs text-gray-400 italic">(подкатегория)</span>
                          </div>
                          <div className="flex gap-1 flex-shrink-0 ml-2">
                            <button
                              onClick={() => handleEdit(nested)}
                              className="p-1 hover:bg-blue-50 rounded transition-colors"
                              title="Редактировать"
                            >
                              <Edit className="w-3 h-3 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(nested.id)}
                              className="p-1 hover:bg-red-50 rounded transition-colors"
                              title="Удалить"
                            >
                              <Trash2 className="w-3 h-3 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const allCategoriesFlat = getAllCategoriesFlat(categories);

  if (loading && activeTab === 'categories') {
    return <div className="p-4 text-sm text-gray-500">Загрузка категорий...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Управление категориями</h2>
          <p className="text-sm text-gray-500 mt-1">Создание, редактирование и удаление категорий товаров</p>
        </div>
        <button
          onClick={() => navigate('/admin/brands')}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Building2 className="w-4 h-4" />
          Бренды
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-3 px-1 font-medium border-b-2 transition-colors ${activeTab === 'categories'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Категории
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 px-1 font-medium border-b-2 transition-colors ${activeTab === 'requests'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Заявки от брендов
          </button>
        </div>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Дерево категорий</h3>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Добавить категорию
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Категории отсутствуют</p>
              </div>
            ) : (
              <div className="space-y-1">
                {categories.map((category) => renderCategoryTree(category, 0))}
              </div>
            )}
          </div>

          {/* Form Modal */}
          {showForm && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {editingId ? 'Редактирование' : formData.parentId ? 'Создание подкатегории' : 'Создание'} категории
                  </h3>
                  {formData.parentId && !editingId && parentCategoryName && (
                    <p className="text-sm text-gray-500 mt-1">
                      Родительская категория: <span className="font-medium">{parentCategoryName}</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={handleCloseForm}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Название <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                {!editingId && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Родительская категория</label>
                    <select
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Нет (верхний уровень)</option>
                      {allCategoriesFlat
                        .filter((cat) => !editingId || cat.id !== editingId) // Исключаем редактируемую категорию из списка родителей
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                    {formData.parentId && (
                      <p className="text-xs text-gray-500 mt-1">
                        Будет создана подкатегория для выбранной родительской категории
                      </p>
                    )}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingId ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Заявки на создание категорий</h3>
          {requestsLoading ? (
            <div className="text-center py-8 text-gray-500">Загрузка заявок...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Заявки отсутствуют</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{request.name || request.categoryName || 'Без названия'}</h4>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${request.status === 'pending' || request.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'approved' || request.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {request.status === 'pending' || request.status === 'PENDING'
                            ? 'Ожидает'
                            : request.status === 'approved' || request.status === 'APPROVED'
                              ? 'Одобрена'
                              : 'Отклонена'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Бренд:</span> {request.brandName || request.brandId}
                        </p>
                        {request.parentCategoryId ? (
                          <p>
                            <span className="font-medium">Родительская категория:</span>{' '}
                            {allCategoriesFlat.find((c) => c.id === request.parentCategoryId)?.name || request.parentCategoryId}
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
                    {(request.status === 'pending' || request.status === 'PENDING') && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleCreateFromRequest(request)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                          title="Создать категорию"
                        >
                          <Plus className="w-4 h-4" />
                          Создать
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(request.id)}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors flex items-center gap-2"
                          title="Удалить заявку"
                        >
                          <Trash2 className="w-4 h-4" />
                          Удалить
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Модальное окно создания категории из заявки */}
      {showCreateFromRequest && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Создание категории из заявки</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Бренд: <span className="font-medium">{selectedRequest.brandName || selectedRequest.brand?.name || 'Неизвестен'}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateFromRequest(false);
                  setSelectedRequest(null);
                  setCreateCategoryData({ name: '', parentId: '' });
                  setEditedParentCategoryName('');
                  setEditingParentCategoryName(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitCreateFromRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Название категории <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createCategoryData.name}
                  onChange={(e) => setCreateCategoryData({ ...createCategoryData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Введите название категории"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Предложено брендом: <span className="font-medium">{selectedRequest.name || selectedRequest.categoryName}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Родительская категория</label>
                {selectedRequest.parentCategoryName ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        {editingParentCategoryName ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editedParentCategoryName}
                              onChange={(e) => setEditedParentCategoryName(e.target.value)}
                              className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg text-sm bg-white"
                              placeholder="Введите название"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setEditingParentCategoryName(false)}
                              className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Сохранить"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditedParentCategoryName(selectedRequest.parentCategoryName || '');
                                setEditingParentCategoryName(false);
                              }}
                              className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Отмена"
                            >
                              <X className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-blue-800 flex-1">
                              <span className="font-medium">Новая родительская категория:</span>{' '}
                              <span>{editedParentCategoryName || selectedRequest.parentCategoryName}</span>
                            </p>
                            <button
                              type="button"
                              onClick={() => setEditingParentCategoryName(true)}
                              className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Редактировать название"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Бренд также запросил создание этой родительской категории
                      </p>
                    </div>
                    <select
                      value={createCategoryData.parentId}
                      onChange={(e) => setCreateCategoryData({ ...createCategoryData, parentId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">
                        Создать новую родительскую категорию: {editedParentCategoryName || selectedRequest.parentCategoryName}
                      </option>
                      {allCategoriesFlat
                        .filter((cat) => !cat.parentId)
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            Использовать существующую: {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : selectedRequest.parentCategoryId ? (
                  <select
                    value={createCategoryData.parentId}
                    onChange={(e) => setCreateCategoryData({ ...createCategoryData, parentId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value={selectedRequest.parentCategoryId}>
                      {allCategoriesFlat.find((c) => c.id === selectedRequest.parentCategoryId)?.name || selectedRequest.parentCategoryId}
                    </option>
                    <option value="">Нет (верхний уровень)</option>
                    {allCategoriesFlat
                      .filter((cat) => !cat.parentId && cat.id !== selectedRequest.parentCategoryId)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <select
                    value={createCategoryData.parentId}
                    onChange={(e) => setCreateCategoryData({ ...createCategoryData, parentId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Нет (верхний уровень)</option>
                    {allCategoriesFlat
                      .filter((cat) => !cat.parentId)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateFromRequest(false);
                    setSelectedRequest(null);
                    setCreateCategoryData({ name: '', parentId: '' });
                    setEditedParentCategoryName('');
                    setEditingParentCategoryName(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Создать категорию
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
