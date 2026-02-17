import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Upload, Trash2, HelpCircle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Product, Category } from '../../types';
import api from '../../api/axios';
import { uploadPhoto } from '../../api/upload';
import { toast } from 'sonner';
import { Slider } from '../ui/slider';

const DEFAULT_STORAGE_LIFE_DAYS = 14;
const DEFAULT_AGE_RESTRICTION = 0;
const DEFAULT_PACKAGE_UNIT = 'шт';
const PACKAGE_UNITS = ['шт', 'мл', 'л', 'кг'];

const parseNumberFromText = (value?: string) => {
  if (!value) return null;
  const match = value.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const parsed = Number(match[1].replace(',', '.'));
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
};

const parsePackageInfo = (info?: string) => {
  if (!info) {
    return { amount: '1', unit: DEFAULT_PACKAGE_UNIT };
  }
  const match = info.trim().match(/^(\d+(?:[.,]\d+)?)\s*([^\s]+)?/);
  const amount = match?.[1] ?? '1';
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

interface ImageValidationResult {
  isValid: boolean;
  message: string;
  issues: string[];
}

interface BrandProductFormProps {
  product?: Product;
  categories: Category[];
  onSave: (product: Partial<Product>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function BrandProductForm({ product, categories, onSave, onCancel, onDelete }: BrandProductFormProps) {
  const initialStorageLifeDays = parseNumberFromText(product?.storageLife) ?? DEFAULT_STORAGE_LIFE_DAYS;
  const initialAgeRestriction = parseNumberFromText(product?.ageRestrictions) ?? DEFAULT_AGE_RESTRICTION;
  const initialPackageInfo = parsePackageInfo(product?.packageInfo);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: product?.name || '',
    categoryId: product?.categoryId || '',
    sku: product?.sku || '',
    weight: product?.weight || '',
    volume: product?.volume || '',
    unitsPerBox: product?.unitsPerBox || 1,
    images: product?.images || [],
    unit: product?.unit || 'ml',
    packageInfo: product?.packageInfo || '1 шт',
    storageLife: product?.storageLife || `${initialStorageLifeDays} дней`,
    productionDate: product?.productionDate || '',
    allergens: product?.allergens || '',
    ageRestrictions: product?.ageRestrictions || `${initialAgeRestriction}+`,
  });

  const [packageAmount, setPackageAmount] = useState(initialPackageInfo.amount);
  const [packageUnit, setPackageUnit] = useState(initialPackageInfo.unit);
  const [storageLifeDays, setStorageLifeDays] = useState(initialStorageLifeDays);
  const [storageLifeInput, setStorageLifeInput] = useState(String(initialStorageLifeDays));
  const [ageRestrictionValue, setAgeRestrictionValue] = useState(initialAgeRestriction);
  const [autoGenerateSku, setAutoGenerateSku] = useState(!product);
  const [isSkuLoading, setIsSkuLoading] = useState(false);
  const [isImagesUploading, setIsImagesUploading] = useState(false);
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [imageValidation, setImageValidation] = useState<ImageValidationResult | null>(null);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(product?.images?.[0] || null);
  const [showCategoryRequest, setShowCategoryRequest] = useState(false);
  const [categoryRequestData, setCategoryRequestData] = useState({
    categoryName: '',
    parentCategoryId: '',
    parentCategoryName: '',
    useExistingParent: true,
  });
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedParentCategory, setSelectedParentCategory] = useState<string | null>(null);
  const [processedCategories, setProcessedCategories] = useState<Category[]>([]);

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

    // Проверяем, что изображение загружено и прошло валидацию
    if (!formData.images || formData.images.length === 0) {
      toast.error('Необходимо загрузить изображение товара.');
      return;
    }

    // Если изображение было загружено (новое или измененное), проверяем валидацию
    const isNewImage = uploadedImageFile !== null;
    const imageChanged = formData.images?.[0] !== originalImageUrl;

    if (isNewImage || imageChanged || !product) {
      // Для новых товаров или при изменении изображения требуется валидация
      if (isValidatingImage) {
        toast.error('Пожалуйста, дождитесь завершения проверки изображения.');
        return;
      }
      if (!imageValidation) {
        toast.error('Пожалуйста, дождитесь завершения проверки изображения.');
        return;
      }
      if (!imageValidation.isValid) {
        toast.error('Изображение не прошло проверку. Загрузите другое изображение.');
        return;
      }
    }

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

  const updateField = (field: keyof Product, value: string | number | string[] | undefined) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Если изменилось название товара и есть загруженное изображение, сбрасываем валидацию
      // Пользователю нужно будет перезагрузить изображение для повторной проверки
      if (field === 'name' && uploadedImageFile && prev.images && prev.images.length > 0) {
        const oldName = prev.name || '';
        const newName = (typeof value === 'string' ? value : '') || '';
        // Сбрасываем валидацию только если название действительно изменилось
        if (oldName.trim() !== newName.trim()) {
          setImageValidation(null);
        }
      }

      return newData;
    });
  };

  const handlePackageAmountChange = (value: string) => {
    setPackageAmount(value);
    updateField('packageInfo', buildPackageInfo(value, packageUnit));
  };

  const handlePackageUnitChange = (value: string) => {
    setPackageUnit(value);
    updateField('packageInfo', buildPackageInfo(packageAmount, value));
  };

  const handleStorageLifeChange = (value: string) => {
    setStorageLifeInput(value);
    if (!value) return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    const days = Math.max(1, Math.round(parsed));
    setStorageLifeDays(days);
    updateField('storageLife', `${days} дней`);
  };

  const handleStorageLifeBlur = () => {
    const parsed = Number(storageLifeInput);
    const days = Number.isFinite(parsed) ? Math.max(1, Math.round(parsed)) : DEFAULT_STORAGE_LIFE_DAYS;
    setStorageLifeDays(days);
    setStorageLifeInput(String(days));
    updateField('storageLife', `${days} дней`);
  };

  const handleAgeRestrictionChange = (value: number[]) => {
    const restriction = value[0] ?? DEFAULT_AGE_RESTRICTION;
    setAgeRestrictionValue(restriction);
    updateField('ageRestrictions', `${restriction}+`);
  };

  const validateImage = async (file: File, productName: string): Promise<ImageValidationResult | null> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', productName);

      const response = await api.post<ImageValidationResult>('/brands/products/validate-image', formData);
      return response.data;
    } catch (error: any) {
      console.error('Ошибка валидации изображения', error);
      const errorMessage = error.response?.data?.message || 'Не удалось проверить изображение';
      toast.error(errorMessage);
      return null;
    }
  };

  const handleImagesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    // Проверяем, что есть название товара
    const productName = formData.name?.trim();
    if (!productName) {
      toast.error('Сначала введите название товара');
      event.target.value = '';
      return;
    }

    // Проверяем, что уже нет изображений
    if (formData.images && formData.images.length > 0) {
      toast.error('Можно загрузить только одно изображение. Удалите существующее изображение перед загрузкой нового.');
      event.target.value = '';
      return;
    }

    // Берем только первый файл
    const file = files[0];
    if (!file) return;

    // Сразу показываем лоадинг
    setIsImagesUploading(true);
    setIsValidatingImage(true);
    setImageValidation(null);
    setUploadedImageFile(null);

    try {
      // Сначала загружаем изображение
      const uploadedUrl = await uploadPhoto(file);
      if (!uploadedUrl) {
        toast.error('Не удалось загрузить изображение.');
        setIsImagesUploading(false);
        setIsValidatingImage(false);
        return;
      }

      // Сохраняем файл для валидации
      setUploadedImageFile(file);
      setFormData((prev) => ({
        ...prev,
        images: [uploadedUrl],
      }));

      // Отправляем на ИИ валидацию с названием товара
      const validationResult = await validateImage(file, productName);

      if (validationResult) {
        if (validationResult.isValid) {
          setImageValidation(validationResult);
          toast.success(validationResult.message || 'Изображение успешно проверено и одобрено.');
        } else {
          // Если изображение не прошло проверку, удаляем его
          setFormData((prev) => ({
            ...prev,
            images: [],
          }));
          setUploadedImageFile(null);
          setImageValidation(null);
          toast.error(validationResult.message || 'Изображение не прошло проверку. Пожалуйста, загрузите другое изображение.');
        }
      } else {
        // Если валидация не удалась, но изображение загружено, разрешаем продолжить
        toast.warning('Изображение загружено, но проверка не выполнена. Вы можете продолжить.');
      }
    } catch (error) {
      console.error('Ошибка загрузки изображений', error);
      toast.error('Не удалось загрузить изображение.');
      // Очищаем данные при ошибке
      setFormData((prev) => ({
        ...prev,
        images: [],
      }));
      setUploadedImageFile(null);
      setImageValidation(null);
    } finally {
      setIsImagesUploading(false);
      setIsValidatingImage(false);
      event.target.value = '';
    }
  };

  // Загружаем категории напрямую с правильной обработкой вложенной структуры
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get<{ items: any[] }>('/categories');
        const items = response.data.items || [];
        const flatCategories: Category[] = [];

        const processCategory = (cat: any, parentId?: string) => {
          // Добавляем категорию в плоский список
          flatCategories.push({
            id: cat.id,
            name: cat.name,
            parentId: parentId || cat.parentId || cat.parentCategoryId || undefined,
          });

          // Обрабатываем подкатегории
          if (cat.subCategories && Array.isArray(cat.subCategories)) {
            cat.subCategories.forEach((sub: any) => {
              processCategory(sub, cat.id);
            });
          } else if (cat.subcategories && Array.isArray(cat.subcategories)) {
            cat.subcategories.forEach((sub: any) => {
              processCategory(sub, cat.id);
            });
          }
        };

        // Обрабатываем все категории верхнего уровня
        items.forEach((cat) => {
          // Обрабатываем только категории верхнего уровня (без parentId/parentCategoryId)
          if (!cat.parentId && !cat.parentCategoryId) {
            processCategory(cat);
          }
        });

        setProcessedCategories(flatCategories);
      } catch (error) {
        console.error('Ошибка загрузки категорий', error);
        // В случае ошибки используем категории из пропсов
        setProcessedCategories(categories);
      }
    };

    loadCategories();
  }, []); // Загружаем только один раз при монтировании

  useEffect(() => {
    // Загружаем все категории для формы заявки
    const loadAllCategories = async () => {
      try {
        const response = await api.get<{ items: any[] }>('/categories');
        const items = response.data.items || [];
        const flatCategories: Category[] = [];

        const processCategory = (cat: any, parentId?: string) => {
          flatCategories.push({
            id: cat.id,
            name: cat.name,
            parentId: parentId || cat.parentId || cat.parentCategoryId || undefined,
          });
          if (cat.subCategories || cat.subcategories) {
            const subs = cat.subCategories || cat.subcategories;
            subs.forEach((sub: any) => processCategory(sub, cat.id));
          }
        };

        items.forEach((cat) => processCategory(cat));
        setAllCategories(flatCategories);
      } catch (error) {
        console.error('Ошибка загрузки категорий', error);
      }
    };
    loadAllCategories();
  }, []);

  const topLevelCategories = processedCategories.filter((c) => !c.parentId);
  const getChildCategories = (parentId: string) =>
    processedCategories.filter((c) => c.parentId === parentId);

  // Определяем выбранную родительскую категорию из текущего categoryId
  useEffect(() => {
    if (formData.categoryId) {
      const selectedCategory = processedCategories.find((c) => c.id === formData.categoryId);
      if (selectedCategory) {
        if (selectedCategory.parentId) {
          // Если выбрана подкатегория, устанавливаем родительскую
          setSelectedParentCategory(selectedCategory.parentId);
        } else {
          // Если выбрана категория верхнего уровня
          const hasChildren = getChildCategories(selectedCategory.id).length > 0;
          if (hasChildren) {
            setSelectedParentCategory(selectedCategory.id);
          } else {
            // Категория без подкатегорий - устанавливаем selectedParentCategory для отображения в select
            setSelectedParentCategory(selectedCategory.id);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.categoryId, processedCategories]);

  const handleParentCategorySelect = (categoryId: string) => {
    if (!categoryId) {
      setSelectedParentCategory(null);
      updateField('categoryId', '');
      return;
    }

    setSelectedParentCategory(categoryId);
    const children = getChildCategories(categoryId);
    // Если нет подкатегорий, сразу выбираем саму категорию
    if (children.length === 0) {
      updateField('categoryId', categoryId);
    } else {
      // Сбрасываем выбор, чтобы пользователь выбрал подкатегорию
      updateField('categoryId', '');
    }
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    // Если выбрана сама категория (selectedParentCategory) или подкатегория
    updateField('categoryId', subcategoryId);
  };

  const handleSubmitCategoryRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация
    if (!categoryRequestData.categoryName || categoryRequestData.categoryName.trim() === '') {
      toast.error('Введите название категории');
      return;
    }

    try {
      // Проверяем, что название категории не пустое
      const categoryName = categoryRequestData.categoryName.trim();
      if (!categoryName) {
        toast.error('Введите название категории');
        return;
      }

      const payload: any = {
        categoryName: categoryName,
        name: categoryName, // На случай, если бэкенд ожидает поле name
      };

      if (categoryRequestData.useExistingParent && categoryRequestData.parentCategoryId) {
        payload.parentCategoryId = categoryRequestData.parentCategoryId;
      } else if (!categoryRequestData.useExistingParent && categoryRequestData.parentCategoryName && categoryRequestData.parentCategoryName.trim() !== '') {
        payload.parentCategoryName = categoryRequestData.parentCategoryName.trim();
      }

      console.log('Отправка заявки на категорию:', JSON.stringify(payload, null, 2));
      console.log('categoryName значение:', categoryName, 'длина:', categoryName.length);

      const response = await api.post('/categories/requests', payload);
      console.log('Ответ сервера:', response.data);
      toast.success('Заявка успешно отправлена. После одобрения категория будет доступна для выбора.');
      setShowCategoryRequest(false);
      setCategoryRequestData({
        categoryName: '',
        parentCategoryId: '',
        parentCategoryName: '',
        useExistingParent: true,
      });
    } catch (error: any) {
      console.error('Ошибка отправки заявки', error);
      console.error('Ответ сервера:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось отправить заявку';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-card rounded-t-2xl md:rounded-lg w-full md:max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10 rounded-t-2xl md:rounded-t-lg">
          <h2 className="text-lg md:text-xl font-semibold">{product ? 'Редактирование товара' : 'Создание товара'}</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-accent rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">
              Название товара <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-base"
              placeholder="Введите название товара"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium">
                Категория <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCategoryRequest(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                title="Нет подходящей категории?"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Нет подходящей категории?</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Выбор категории */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2">
                  Выберите категорию
                </label>
                <select
                  value={(() => {
                    // Если выбрана подкатегория, показываем родительскую категорию
                    if (formData.categoryId) {
                      const selected = processedCategories.find((c) => c.id === formData.categoryId);
                      if (selected?.parentId) {
                        return selected.parentId;
                      }
                      // Если выбрана категория верхнего уровня, показываем её
                      return selected?.id || selectedParentCategory || '';
                    }
                    return selectedParentCategory || '';
                  })()}
                  onChange={(e) => handleParentCategorySelect(e.target.value)}
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-base transition-all"
                  required={!formData.categoryId}
                >
                  <option value="">Выберите категорию</option>
                  {topLevelCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Выбор подкатегории - показывается только если выбрана категория с подкатегориями */}
              {selectedParentCategory && getChildCategories(selectedParentCategory).length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs text-muted-foreground mb-2">
                    Выберите подкатегорию (опционально)
                  </label>
                  <select
                    value={formData.categoryId || ''}
                    onChange={(e) => handleSubcategorySelect(e.target.value)}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-base transition-all"
                  >
                    <option value={selectedParentCategory}>
                      Использовать категорию "{topLevelCategories.find((c) => c.id === selectedParentCategory)?.name ||
                        processedCategories.find((c) => c.id === selectedParentCategory)?.name}" без подкатегории
                    </option>
                    {getChildCategories(selectedParentCategory).map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Показываем выбранную категорию, если она выбрана и у неё нет подкатегорий */}
              {formData.categoryId &&
                selectedParentCategory &&
                getChildCategories(selectedParentCategory).length === 0 && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs text-muted-foreground mb-1">Выбранная категория</p>
                    <p className="text-sm font-medium text-primary">
                      {processedCategories.find((c) => c.id === formData.categoryId)?.name}
                    </p>
                  </div>
                )}
            </div>

            {/* Скрытое поле для валидации формы */}
            <input
              type="hidden"
              value={formData.categoryId || ''}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Артикул <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => {
                  updateField('sku', e.target.value);
                  setAutoGenerateSku(false);
                }}
                className="flex-1 px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-base"
                placeholder="BRD-0001"
                required
                disabled={autoGenerateSku}
              />
              <button
                type="button"
                onClick={() => {
                  if (autoGenerateSku) {
                    handleAutoGenerateSku();
                    return;
                  }
                  setAutoGenerateSku(true);
                  handleAutoGenerateSku();
                }}
                disabled={isSkuLoading}
                className={`px-4 py-3 border rounded-lg transition-colors flex items-center gap-2 min-h-[48px] ${autoGenerateSku
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-accent'
                  } ${isSkuLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <RefreshCw className={`w-5 h-5 ${isSkuLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Авто</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Упаковка <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={packageAmount}
                  onChange={(e) => handlePackageAmountChange(e.target.value)}
                  className="flex-1 px-1 w-35 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-base"
                  placeholder="например, 200"
                  min="0"
                  step="0.01"
                  required
                />
                <select
                  value={packageUnit}
                  onChange={(e) => handlePackageUnitChange(e.target.value)}
                  className="w-20 px-3 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-base"
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

            <div className="sm:pl-4">
              <label className="block text-sm font-medium mb-2">
                Срок хранения <span className="text-destructive">*</span>
              </label>
              <div className="relative max-w-[250px]">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={storageLifeInput}
                  onChange={(e) => handleStorageLifeChange(e.target.value.replace(/[^\d]/g, ''))}
                  onBlur={handleStorageLifeBlur}
                  className="w-full px-4 py-3 pr-14 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-base"
                  placeholder="например, 14"
                  required
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  дней
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Дата изготовления <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                value={formData.productionDate ? String(formData.productionDate).slice(0, 10) : ''}
                onChange={(e) => updateField('productionDate', e.target.value)}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-base"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Аллергены</label>
              <textarea
                value={typeof formData.allergens === 'string' ? formData.allergens : (formData.allergens ?? '').toString()}
                onChange={(e) => updateField('allergens', e.target.value)}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                placeholder="например, молоко, лактоза, орехи"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Возрастные ограничения</label>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>0+</span>
                <span>{ageRestrictionValue}+</span>
                <span>21+</span>
              </div>
              <Slider
                value={[ageRestrictionValue]}
                onValueChange={handleAgeRestrictionChange}
                min={0}
                max={21}
                step={1}
                className="py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Изображение товара</label>
            <div className="space-y-2">
              {formData.images && formData.images.length > 0 && (
                <div className="space-y-3">
                  <div className="max-w-xs">
                    <div className="relative group aspect-square bg-muted rounded-lg border border-border overflow-hidden">
                      <img src={formData.images[0]} alt="Товар" className="w-full h-full object-cover" />
                      {isValidatingImage && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          updateField('images', []);
                          setImageValidation(null);
                          setUploadedImageFile(null);
                          setOriginalImageUrl(null);
                        }}
                        disabled={isValidatingImage}
                        className="absolute top-1 right-1 p-2 bg-destructive text-destructive-foreground rounded-lg opacity-0 group-hover:opacity-100 transition-opacity min-h-[36px] min-w-[36px] disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Статус валидации */}
                  {isValidatingImage && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Проверка изображения ИИ...</span>
                    </div>
                  )}

                  {imageValidation && !isValidatingImage && (
                    <div className={`p-3 rounded-lg border ${imageValidation.isValid
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                      : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                      }`}>
                      <div className="flex items-start gap-2 mb-2">
                        {imageValidation.isValid ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${imageValidation.isValid
                            ? 'text-green-900 dark:text-green-100'
                            : 'text-yellow-900 dark:text-yellow-100'
                            }`}>
                            {imageValidation.message || (imageValidation.isValid
                              ? 'Изображение одобрено'
                              : 'Изображение требует внимания')}
                          </p>
                        </div>
                      </div>

                      {imageValidation.issues && imageValidation.issues.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Проблемы:</p>
                          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                            {imageValidation.issues.map((issue, idx) => (
                              <li key={idx}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {(!formData.images || formData.images.length === 0) && (
                <div className="space-y-2">
                  <label className={`border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors cursor-pointer block ${isImagesUploading || isValidatingImage || !formData.name?.trim()
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:border-primary/50'
                    }`}>
                    <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">
                      {isImagesUploading || isValidatingImage
                        ? 'Проверка проходит, подождите...'
                        : 'Нажмите для загрузки изображения товара'}
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG до 5 МБ, квадратное изображение (1:1)</p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleImagesChange}
                      disabled={isImagesUploading || isValidatingImage || !formData.name?.trim()}
                    />
                  </label>
                  {!formData.name?.trim() && (
                    <p className="text-xs text-muted-foreground text-center">
                      Сначала введите название товара для загрузки изображения
                    </p>
                  )}
                  {isValidatingImage && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Проверка изображения ИИ...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 bg-card pt-4 pb-2 -mx-4 md:-mx-6 px-4 md:px-6 border-t border-border mt-6">
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-accent transition-colors min-h-[48px] font-medium"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={(() => {
                  // Если нет изображения - блокируем
                  const hasNoImage = !formData.images || formData.images.length === 0;
                  if (hasNoImage) return true;

                  // Если идет загрузка или валидация - блокируем
                  if (isValidatingImage || isImagesUploading) return true;

                  // Если изображение новое или измененное, проверяем валидацию
                  const isNewImage = uploadedImageFile !== null;
                  const imageChanged = formData.images && formData.images[0] !== originalImageUrl;
                  const isNewProduct = !product;

                  if (isNewImage || imageChanged || isNewProduct) {
                    // Для новых товаров или при изменении изображения требуется валидация
                    if (!imageValidation || !imageValidation.isValid) {
                      return true;
                    }
                  }

                  return false;
                })()}
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 transition-opacity font-medium min-h-[48px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  !formData.images || formData.images.length === 0
                    ? 'Необходимо загрузить изображение товара'
                    : isValidatingImage || isImagesUploading
                      ? 'Идет проверка изображения...'
                      : (uploadedImageFile || !product) && (!imageValidation || !imageValidation.isValid)
                        ? 'Изображение должно пройти валидацию'
                        : undefined
                }
              >
                {product ? 'Сохранить изменения' : 'Создать товар'}
              </button>
              {product && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex-1 border border-destructive text-destructive py-3 rounded-lg hover:bg-destructive/10 transition-colors min-h-[48px] font-medium sm:order-first"
                >
                  Удалить
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Модальное окно заявки на категорию */}
      {showCategoryRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-card rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold">Заявка на создание категории</h3>
              <button
                onClick={() => setShowCategoryRequest(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitCategoryRequest} className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Название категории <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={categoryRequestData.categoryName}
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log('Ввод названия категории:', value);
                    setCategoryRequestData({ ...categoryRequestData, categoryName: value });
                  }}
                  className="w-full px-4 py-2 border border-border rounded-lg"
                  placeholder="Введите название категории"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Родительская категория</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={categoryRequestData.useExistingParent}
                      onChange={() => setCategoryRequestData({ ...categoryRequestData, useExistingParent: true, parentCategoryName: '' })}
                      className="w-4 h-4"
                    />
                    <span>Выбрать существующую категорию</span>
                  </label>
                  {categoryRequestData.useExistingParent && (
                    <select
                      value={categoryRequestData.parentCategoryId}
                      onChange={(e) => setCategoryRequestData({ ...categoryRequestData, parentCategoryId: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg"
                    >
                      <option value="">Нет (верхний уровень)</option>
                      {allCategories
                        .filter((cat) => !cat.parentId)
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                  )}

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!categoryRequestData.useExistingParent}
                      onChange={() => setCategoryRequestData({ ...categoryRequestData, useExistingParent: false, parentCategoryId: '' })}
                      className="w-4 h-4"
                    />
                    <span>Создать новую родительскую категорию</span>
                  </label>
                  {!categoryRequestData.useExistingParent && (
                    <input
                      type="text"
                      value={categoryRequestData.parentCategoryName}
                      onChange={(e) => setCategoryRequestData({ ...categoryRequestData, parentCategoryName: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg"
                      placeholder="Введите название родительской категории"
                    />
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryRequest(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                  Отправить заявку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}