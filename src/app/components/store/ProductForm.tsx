import React, { useState } from 'react';
import { X, RefreshCw, Trash2 } from 'lucide-react';
import { Product, Category } from '../../types';
import api from '../../api/axios';
import { uploadPhoto } from '../../api/upload';
import { toast } from 'sonner';

const DEFAULT_PACKAGE_UNIT = 'шт';
const PACKAGE_UNITS = ['шт', 'л', 'кг'];

const parsePackageInfo = (info?: string) => {
  if (!info) {
    return { amount: '', unit: DEFAULT_PACKAGE_UNIT };
  }
  const match = info.trim().match(/^(\d+(?:[.,]\d+)?)\s*([^\s]+)?/);
  const amount = match?.[1] ?? '';
  const unit = match?.[2] ?? DEFAULT_PACKAGE_UNIT;
  return {
    amount,
    unit: PACKAGE_UNITS.includes(unit) ? unit : DEFAULT_PACKAGE_UNIT,
  };
};

const buildPackageInfo = (amount: string, unit: string) => {
  const normalizedAmount = amount.trim();
  if (!normalizedAmount) return '';
  return `${normalizedAmount} ${unit}`.trim();
};

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  onSave: (product: Partial<Product>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function ProductForm({ product, categories, onSave, onCancel, onDelete }: ProductFormProps) {
  const initialPackageInfo = parsePackageInfo(product?.packageInfo);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: product?.name || '',
    categoryId: product?.categoryId || '',
    sku: product?.sku || '',
    quantity: product?.quantity || 0,
    packageInfo: product?.packageInfo || '',
    images: product?.images || [],
  });

  const [packageAmount, setPackageAmount] = useState(initialPackageInfo.amount);
  const [packageUnit, setPackageUnit] = useState(initialPackageInfo.unit);
  const [autoGenerateSku, setAutoGenerateSku] = useState(!product);
  const [isSkuLoading, setIsSkuLoading] = useState(false);
  const [isImagesUploading, setIsImagesUploading] = useState(false);

  const fetchSku = async () => {
    const response = await api.get('/products/sku');
    const data = response.data;
    if (typeof data === 'string') return data;
    return data?.sku ?? data?.value ?? data?.code ?? '';
  };

  const handleAutoGenerateSku = async () => {
    try {
      setIsSkuLoading(true);
      const sku = await fetchSku();
      if (sku) {
        setFormData((prev) => ({ ...prev, sku }));
      }
    } catch (error) {
      console.error('Ошибка генерации артикула', error);
      toast.error('Не удалось сгенерировать артикул.');
    } finally {
      setIsSkuLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (autoGenerateSku && !formData.sku) {
      try {
        setIsSkuLoading(true);
        const sku = await fetchSku();
        const newData = { ...formData, sku };
        setFormData(newData);
        onSave(newData);
        return;
      } catch (error) {
        console.error('Ошибка генерации артикула', error);
        toast.error('Не удалось сгенерировать артикул.');
        return;
      } finally {
        setIsSkuLoading(false);
      }
    }
    onSave(formData);
  };

  const updateField = (field: keyof Product, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePackageAmountChange = (value: string) => {
    setPackageAmount(value);
    updateField('packageInfo', buildPackageInfo(value, packageUnit));
  };

  const handlePackageUnitChange = (value: string) => {
    setPackageUnit(value);
    updateField('packageInfo', buildPackageInfo(packageAmount, value));
  };

  const handleImagesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setIsImagesUploading(true);
    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file) => uploadPhoto(file))
      );
      const newImages = uploadedUrls.filter(Boolean) as string[];
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images ?? []), ...newImages],
      }));
    } catch (error) {
      console.error('Ошибка загрузки изображений', error);
      toast.error('Не удалось загрузить изображение.');
    } finally {
      setIsImagesUploading(false);
      event.target.value = '';
    }
  };

  const topLevelCategories = categories.filter((c) => !c.parentId);
  const getChildCategories = (parentId: string) =>
    categories.filter((c) => c.parentId === parentId);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center md:justify-center">
      <div className="bg-card w-full md:max-w-2xl md:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex-shrink-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-lg font-semibold">{product ? 'Редактирование товара' : 'Создание товара'}</h2>
          <button
            onClick={onCancel}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted active:bg-accent transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Название товара <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full h-12 px-4 bg-input-background border-2 border-border rounded-xl text-base focus:outline-none focus:border-primary transition-colors"
                placeholder="Введите название"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Категория <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => updateField('categoryId', e.target.value)}
                className="w-full h-12 px-4 bg-input-background border-2 border-border rounded-xl text-base focus:outline-none focus:border-primary transition-colors"
                required
              >
                <option value="">Выберите категорию</option>
                {topLevelCategories.map((category) => {
                  const children = getChildCategories(category.id);
                  return (
                    <optgroup key={category.id} label={category.name}>
                      <option value={category.id}>{category.name}</option>
                      {children.map((child) => (
                        <option key={child.id} value={child.id}>
                          {category.name} → {child.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Артикул <span className="text-red-600">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => {
                    updateField('sku', e.target.value);
                    setAutoGenerateSku(false);
                  }}
                  className="flex-1 h-12 px-4 bg-input-background border-2 border-border rounded-xl text-base font-mono focus:outline-none focus:border-primary transition-colors"
                  placeholder="PRD-0001"
                  required
                  disabled={autoGenerateSku}
                />
                <button
                  type="button"
                  onClick={() => {
                    setAutoGenerateSku(!autoGenerateSku);
                    if (!autoGenerateSku) {
                      handleAutoGenerateSku();
                    }
                  }}
                  disabled={isSkuLoading}
                  className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${
                    autoGenerateSku
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  } ${isSkuLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <RefreshCw className={`w-5 h-5 ${isSkuLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {autoGenerateSku ? '✓ Автоматическая генерация' : 'Ручной ввод артикула'}
              </p>
            </div>

            {/* Quantity */}
            <div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Количество <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => updateField('quantity', parseInt(e.target.value) || 0)}
                  className="w-full h-12 px-4 bg-input-background border-2 border-border rounded-xl text-base focus:outline-none focus:border-primary transition-colors"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Package Info */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Упаковка <span className="text-red-600">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={packageAmount}
                  onChange={(e) => handlePackageAmountChange(e.target.value)}
                  className="flex-1 h-12 px-4 bg-input-background border-2 border-border rounded-xl text-base focus:outline-none focus:border-primary transition-colors"
                  placeholder="например, 200"
                  min="0"
                  step="0.01"
                  required
                />
                <select
                  value={packageUnit}
                  onChange={(e) => handlePackageUnitChange(e.target.value)}
                  className="w-24 h-12 px-3 bg-input-background border-2 border-border rounded-xl text-base focus:outline-none focus:border-primary transition-colors"
                  required
                >
                  {PACKAGE_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Изображения товара</label>
              <div className="space-y-2">
                {formData.images && formData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group aspect-square bg-muted rounded-lg border border-border overflow-hidden">
                        <img src={image} alt={`Товар ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = formData.images?.filter((_, i) => i !== index) || [];
                            setFormData((prev) => ({ ...prev, images: newImages }));
                          }}
                          className="absolute top-1 right-1 p-2 bg-destructive text-destructive-foreground rounded-lg opacity-0 group-hover:opacity-100 transition-opacity min-h-[36px] min-w-[36px]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className={`border-2 border-dashed border-border rounded-lg p-6 text-center transition-colors cursor-pointer block ${
                  isImagesUploading ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary/50'
                }`}>
                  <p className="text-sm text-muted-foreground mb-1">
                    {isImagesUploading ? 'Загрузка изображений...' : 'Нажмите для загрузки изображений товара'}
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG до 5 МБ (можно несколько)</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={handleImagesChange}
                    disabled={isImagesUploading}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Actions */}
          <div className="flex-shrink-0 sticky bottom-0 bg-card border-t-2 border-border px-5 py-4 safe-area-inset-bottom">
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              {product && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex-1 h-12 border-2 border-destructive text-destructive rounded-xl font-semibold active:scale-98 transition-transform sm:order-first"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Удалить
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 h-12 border-2 border-border rounded-xl font-semibold active:scale-98 transition-transform"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 h-12 bg-primary text-primary-foreground rounded-xl font-semibold shadow-md active:scale-98 transition-transform"
              >
                {product ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
