import React, { useState } from 'react';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, Folder, X } from 'lucide-react';
import { Category } from '../../types';

interface CategoryManagementProps {
  categories: Category[];
  onCreateCategory: (category: Omit<Category, 'id'>) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  readOnly?: boolean;
}

export function CategoryManagement({
  categories,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
  readOnly = false,
}: CategoryManagementProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', parentId: '' });

  const topLevelCategories = categories.filter((c) => !c.parentId);
  const getChildCategories = (parentId: string) =>
    categories.filter((c) => c.parentId === parentId);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) {
      return;
    }
    if (editingId) {
      const category = categories.find((c) => c.id === editingId);
      if (category) {
        onEditCategory({ ...category, name: formData.name });
      }
    } else {
      onCreateCategory({
        name: formData.name,
        parentId: formData.parentId || undefined,
      });
    }
    handleCloseForm();
  };

  const handleEdit = (category: Category) => {
    if (readOnly) return;
    setEditingId(category.id);
    setFormData({ name: category.name, parentId: category.parentId || '' });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', parentId: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== MOBILE LAYOUT ========== */}
      <div className="md:hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="p-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Категории</h1>
            {!readOnly && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl h-14 font-semibold shadow-sm active:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Добавить категорию
              </button>
            )}
          </div>
        </div>

        {/* Category List */}
        <div className="p-4 pb-24">
          {topLevelCategories.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-3xl flex items-center justify-center">
                <Folder className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Категории отсутствуют</h3>
              <p className="text-base text-gray-600">Создайте первую категорию</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topLevelCategories.map((category) => {
                const children = getChildCategories(category.id);
                const isExpanded = expandedCategories.has(category.id);
                const hasChildren = children.length > 0;

                return (
                  <div key={category.id} className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    {/* Parent Category */}
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Folder className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 truncate">{category.name}</h3>
                          {hasChildren && (
                            <p className="text-sm text-gray-500 mt-0.5">
                              {children.length} {children.length === 1 ? 'подкатегория' : 'подкатегорий'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {hasChildren && (
                          <button
                            onClick={() => toggleCategory(category.id)}
                            className="flex-1 h-12 flex items-center justify-center gap-2 bg-gray-100 rounded-xl font-semibold text-gray-700 active:bg-gray-200 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronDown className="w-5 h-5" />
                                Скрыть
                              </>
                            ) : (
                              <>
                                <ChevronRight className="w-5 h-5" />
                                Показать
                              </>
                            )}
                          </button>
                        )}
                        {!readOnly && (
                          <>
                            <button
                              onClick={() => handleEdit(category)}
                              className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200 transition-colors"
                            >
                              <Edit className="w-5 h-5 text-gray-700" />
                            </button>
                            <button
                              onClick={() => onDeleteCategory(category.id)}
                              className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-50 active:bg-red-100 transition-colors"
                            >
                              <Trash2 className="w-5 h-5 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Child Categories */}
                    {isExpanded && hasChildren && (
                      <div className="border-t-2 border-gray-200 bg-gray-50">
                        {children.map((child, index) => (
                          <div
                            key={child.id}
                            className={`p-4 pl-5 flex items-center gap-3 ${
                              index !== children.length - 1 ? 'border-b border-gray-200' : ''
                            }`}
                          >
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Folder className="w-5 h-5 text-gray-600" />
                            </div>
                            <span className="text-base font-semibold text-gray-900 flex-1 min-w-0 truncate">{child.name}</span>
                            <div className="flex gap-2 flex-shrink-0">
                              {!readOnly && (
                                <>
                                  <button
                                    onClick={() => handleEdit(child)}
                                    className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-gray-300 active:bg-gray-100 transition-colors"
                                  >
                                    <Edit className="w-5 h-5 text-gray-700" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteCategory(child.id)}
                                    className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-red-300 active:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-5 h-5 text-red-600" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========== DESKTOP LAYOUT ========== */}
      <div className="hidden md:flex md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Управление категориями</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Организация товаров по категориям
          </p>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            <Plus className="w-5 h-5" />
            Добавить категорию
          </button>
        )}
      </div>

      {/* Desktop Grid */}
      <div className="hidden md:grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-medium mb-4">Дерево категорий</h3>
          {topLevelCategories.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">Категории отсутствуют</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topLevelCategories.map((category) => {
                const children = getChildCategories(category.id);
                return (
                  <div key={category.id}>
                    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4" />
                        <span className="font-medium">{category.name}</span>
                        {children.length > 0 && <span className="text-xs text-muted-foreground">({children.length})</span>}
                      </div>
                      <div className="flex gap-1">
                        {!readOnly && (
                          <>
                            <button onClick={() => handleEdit(category)} className="p-1 hover:bg-accent rounded">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => onDeleteCategory(category.id)} className="p-1 hover:bg-red-50 rounded">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between p-2 pl-8 rounded hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <ChevronRight className="w-3 h-3" />
                          <Folder className="w-4 h-4" />
                          <span className="text-sm">{child.name}</span>
                        </div>
                        <div className="flex gap-1">
                          {!readOnly && (
                            <>
                              <button onClick={() => handleEdit(child)} className="p-1 hover:bg-accent rounded">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => onDeleteCategory(child.id)} className="p-1 hover:bg-red-50 rounded">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-medium mb-4">{editingId ? 'Редактирование' : 'Создание'} категории</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Название <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                  required
                />
              </div>
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium mb-2">Родительская категория</label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg"
                  >
                    <option value="">Нет (верхний уровень)</option>
                    {topLevelCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={handleCloseForm} className="flex-1 px-4 py-2 border border-border rounded-lg">
                  Отмена
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                  {editingId ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Form Modal */}
      {showForm && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-card w-full rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-4 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingId ? 'Редактирование' : 'Создание'} категории</h2>
              <button onClick={handleCloseForm} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Название категории <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-12 px-4 bg-input-background border border-border rounded-xl text-base"
                  placeholder="Введите название"
                  required
                  autoFocus
                />
              </div>
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium mb-2">Родительская категория</label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full h-12 px-4 bg-input-background border border-border rounded-xl text-base"
                  >
                    <option value="">Нет (верхний уровень)</option>
                    {topLevelCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="sticky bottom-0 bg-card pt-4 pb-2 -mx-4 px-4 border-t border-border">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 h-12 border-2 border-border rounded-xl font-medium"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-12 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm"
                  >
                    {editingId ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}