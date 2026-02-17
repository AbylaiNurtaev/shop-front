import { useState, useRef, React } from 'react';
import { Search, Minus, Plus, Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Product, Category } from '../../types';
import api from '../../api/axios';
import { toast } from 'sonner';
import { ScrollToTopButton } from '../ui/scroll-to-top-button';

interface InventoryProps {
  products: Product[];
  categories: Category[];
  onUpdateQuantity: (product: Product, newQuantity: number) => void;
}

type InvoiceProcessingResult = {
  message: string;
  invoiceInfo?: {
    invoiceNumber: string;
    date: string;
    supplier: string;
  };
  summary: {
    total: number;
    found: number;
    notFound: number;
    errors: number;
  };
  found: Array<{
    originalItem: {
      productName: string;
      quantity: number;
      sku?: string | null;
      brand?: string;
      unit?: string;
      notes?: string | null;
    };
    product: {
      id: string;
      name: string;
      sku: string;
      brandName: string;
      brandId: string;
    };
    quantity: number;
    currentQuantity: number;
    newQuantity: number;
    error?: string | null;
    canAdd: boolean;
  }>;
  notFound: Array<{
    productName: string;
    sku?: string | null;
    brand?: string;
    quantity: number;
    unit?: string;
    notes?: string | null;
  }>;
  errors: Array<{
    item: {
      productName: string;
      quantity: number;
    };
    error: string;
  }>;
};

export function Inventory({ products, categories, onUpdateQuantity }: InventoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [editUnitsPerBoxValue, setEditUnitsPerBoxValue] = useState<number>(1);
  const [isProcessingInvoice, setIsProcessingInvoice] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState<InvoiceProcessingResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [editedQuantities, setEditedQuantities] = useState<Record<string, number>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [expiryView, setExpiryView] = useState<'soon' | 'expired'>('soon');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || '—';
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditValue(product.quantity);
    setEditUnitsPerBoxValue(product.unitsPerBox);
  };

  const handleSave = (product: Product) => {
    if (editUnitsPerBoxValue < 1) {
      toast.error('Единиц в упаковке должно быть не менее 1');
      return;
    }
    // Обновляем UI сразу
    onUpdateQuantity(product, editValue);
    setEditingId(null);
    toast.success('Изменения сохранены');

    // Выполняем запросы в фоне без ожидания
    api.put(`/products/${product.id}`, {
      unitsPerPack: editUnitsPerBoxValue,
    }).catch((error: any) => {
      console.error('Ошибка обновления единиц в упаковке', error);
      toast.error(error?.response?.data?.message || 'Не удалось обновить единицы в упаковке');
    });
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleQuickAdjust = (product: Product, currentQty: number, change: number) => {
    const newQty = Math.max(0, currentQty + change);
    onUpdateQuantity(product, newQty);
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockCount = products.filter((p) => p.quantity < 20 && p.quantity > 0).length;
  const outOfStockCount = products.filter((p) => p.quantity === 0).length;

  // Подсчет товаров с истекающим сроком годности
  const getDaysUntilExpiry = (product: Product): number | null => {
    if (!product.productionDate || !product.storageLife) return null;

    try {
      const productionDate = new Date(product.productionDate);
      const storageLifeMatch = product.storageLife.match(/(\d+)/);
      if (!storageLifeMatch) return null;

      const storageLifeDays = parseInt(storageLifeMatch[1], 10);
      const expiryDate = new Date(productionDate);
      expiryDate.setDate(expiryDate.getDate() + storageLifeDays);

      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays;
    } catch {
      return null;
    }
  };

  // Товары с истекшим сроком годности (отрицательные дни)
  const expiredCount = products.filter((p) => {
    const daysLeft = getDaysUntilExpiry(p);
    return daysLeft !== null && daysLeft < 0;
  }).length;

  // Товары с истекающим сроком годности (0-7 дней)
  const expiringSoonCount = products.filter((p) => {
    const daysLeft = getDaysUntilExpiry(p);
    return daysLeft !== null && daysLeft >= 0 && daysLeft < 7;
  }).length;

  const handleInvoiceUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Размер изображения не должен превышать 10MB');
      return;
    }

    setIsProcessingInvoice(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/warehouse/invoice/process', formData);
      const result: InvoiceProcessingResult = response.data;

      setInvoiceResult(result);
      // Инициализируем выбранные товары (только те, которые можно добавить)
      const selectableItems = result.found.filter(item => item.canAdd).map(item => item.product.id);
      setSelectedItems(new Set(selectableItems));
      // Инициализируем отредактированные количества
      const initialQuantities: Record<string, number> = {};
      result.found.forEach(item => {
        initialQuantities[item.product.id] = item.quantity;
      });
      setEditedQuantities(initialQuantities);
      setShowResultModal(true);
      toast.success('Накладная проанализирована. Проверьте найденные товары.');
    } catch (error: any) {
      console.error('Ошибка обработки накладной', error);
      toast.error(error?.response?.data?.message || 'Не удалось обработать накладную');
    } finally {
      setIsProcessingInvoice(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmInvoice = async () => {
    if (!invoiceResult) return;

    // Собираем только выбранные товары
    const itemsToConfirm = invoiceResult.found
      .filter(item => selectedItems.has(item.product.id) && item.canAdd)
      .map(item => ({
        productId: item.product.id,
        quantity: editedQuantities[item.product.id] || item.quantity,
      }));

    if (itemsToConfirm.length === 0) {
      toast.warning('Выберите хотя бы один товар для добавления');
      return;
    }

    setIsConfirming(true);
    try {
      const response = await api.post('/warehouse/invoice/confirm', { items: itemsToConfirm });
      toast.success(response.data.message || 'Товары успешно добавлены на склад');
      setShowResultModal(false);
      setInvoiceResult(null);
      setSelectedItems(new Set());
      setEditedQuantities({});
      // Обновляем страницу для отображения новых товаров
      window.location.reload();
    } catch (error: any) {
      console.error('Ошибка подтверждения накладной', error);
      toast.error(error?.response?.data?.message || 'Не удалось добавить товары на склад');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    setEditedQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, newQuantity),
    }));
  };

  const handleToggleItem = (productId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleInvoiceUpload(file);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ========== MOBILE LAYOUT ========== */}
      <div className="md:hidden">
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-20 shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Управление складом</h1>
                <p className="text-sm text-muted-foreground">Быстрое изменение остатков</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingInvoice}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessingInvoice ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Обработка...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Загрузить накладную</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="p-4 bg-card border-b border-border">
          <div className="space-y-3">
            {/* Total Stock */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-2 border-green-200 dark:border-green-700 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wide mb-1">Всего единиц</p>
                  <p className="text-4xl font-black text-green-900 dark:text-green-100">{totalStock.toLocaleString()}</p>
                </div>
                <div className="w-16 h-16 bg-green-200 dark:bg-green-700 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">📦</span>
                </div>
              </div>
            </div>

            {/* Low Stock + Out of Stock + Expiring in row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-2 border-orange-200 dark:border-orange-700 rounded-2xl p-4">
                <p className="text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wide mb-1">Мало</p>
                <p className="text-3xl font-black text-orange-900 dark:text-orange-100">{lowStockCount}</p>
                <span className="text-lg mt-1 block">⚡</span>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-2 border-red-200 dark:border-red-700 rounded-2xl p-4">
                <p className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wide mb-1">Нет</p>
                <p className="text-3xl font-black text-red-900 dark:text-red-100">{outOfStockCount}</p>
                <span className="text-lg mt-1 block">⚠️</span>
              </div>
            </div>

            {/* Expiring Products */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-2 border-purple-200 dark:border-purple-700 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-1">
                    Срок годности
                  </p>
                  <p className="text-3xl font-black text-purple-900 dark:text-purple-100">
                    {expiryView === 'soon' ? expiringSoonCount : expiredCount}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-200 dark:bg-purple-700 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <button
                  onClick={() => setExpiryView('soon')}
                  className={`text-xs px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                    expiryView === 'soon'
                      ? 'bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-purple-100 font-medium'
                      : 'text-purple-600 dark:text-purple-400'
                  }`}
                >
                  Скоро
                </button>
                <button
                  onClick={() => setExpiryView('expired')}
                  className={`text-xs px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                    expiryView === 'expired'
                      ? 'bg-red-200 dark:bg-red-700 text-red-900 dark:text-red-100 font-medium'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  Просрочено
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 bg-card border-b border-border">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Поиск товаров"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-input-background border border-border rounded-xl text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        {/* Inventory Cards */}
        <div className="p-4 pb-24 space-y-4">
          {filteredProducts.map((product) => {
            const isEditing = editingId === product.id;
            const statusColor =
              product.quantity === 0 ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30' :
                product.quantity < 20 ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/30' :
                  'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30';

            return (
              <div
                key={product.id}
                className={`border-2 rounded-2xl p-5 shadow-sm ${statusColor}`}
              >
                {/* Product Info */}
                <div className="mb-5">
                  <h3 className="font-bold text-lg text-foreground mb-2 leading-tight">{product.name}</h3>
                  <p className="text-sm text-muted-foreground font-mono mb-1">Артикул: {product.sku}</p>
                  <p className="text-xs text-muted-foreground">{getCategoryName(product.categoryId)}</p>
                </div>

                {isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <div className="bg-card rounded-2xl p-4 border-2 border-primary shadow-md">
                      <p className="text-xs font-bold text-primary uppercase text-center mb-3">Новое количество</p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditValue(Math.max(0, editValue - 1))}
                          className="w-14 h-14 flex items-center justify-center bg-muted rounded-xl active:scale-95 active:bg-accent transition-all font-bold text-xl"
                        >
                          <Minus className="w-6 h-6" />
                        </button>
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(Math.max(0, parseInt(e.target.value) || 0))}
                          className="flex-1 h-14 text-center text-3xl font-black bg-input-background border-2 border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent max-w-[120px]"
                          min="0"
                          style={{ maxWidth: '120px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setEditValue(editValue + 1)}
                          className="w-14 h-14 flex items-center justify-center bg-muted rounded-xl active:scale-95 active:bg-accent transition-all font-bold text-xl"
                        >
                          <Plus className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-card rounded-2xl p-4 border-2 border-primary shadow-md">
                      <p className="text-xs font-bold text-primary uppercase text-center mb-3">Единиц в упаковке</p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditUnitsPerBoxValue(Math.max(1, editUnitsPerBoxValue - 1))}
                          className="w-14 h-14 flex items-center justify-center bg-muted rounded-xl active:scale-95 active:bg-accent transition-all font-bold text-xl"
                        >
                          <Minus className="w-6 h-6" />
                        </button>
                        <input
                          type="number"
                          value={editUnitsPerBoxValue}
                          onChange={(e) => setEditUnitsPerBoxValue(Math.max(1, parseInt(e.target.value) || 1))}
                          className="flex-1 h-14 text-center text-3xl font-black bg-input-background border-2 border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent max-w-[120px]"
                          min="1"
                          style={{ maxWidth: '120px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setEditUnitsPerBoxValue(editUnitsPerBoxValue + 1)}
                          className="w-14 h-14 flex items-center justify-center bg-muted rounded-xl active:scale-95 active:bg-accent transition-all font-bold text-xl"
                        >
                          <Plus className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleCancel}
                        className="h-14 border-2 border-border bg-card rounded-xl font-bold text-foreground active:scale-98 transition-transform"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={() => handleSave(product)}
                        className="h-14 bg-primary text-primary-foreground rounded-xl font-bold active:scale-98 transition-transform shadow-sm"
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="space-y-4">
                    <div className="bg-card rounded-2xl p-5 border-2 border-border shadow-sm">
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Текущий остаток</p>
                      <p className="text-4xl font-black text-foreground">{product.quantity} <span className="text-xl text-muted-foreground">шт</span></p>
                      <p className="text-xs text-muted-foreground mt-2">Упаковка: {product.unitsPerBox} шт</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleQuickAdjust(product, product.quantity, -product.unitsPerBox)}
                        className="h-14 bg-card border-2 border-border rounded-xl font-bold text-base text-foreground active:scale-95 transition-transform"
                      >
                        −{product.unitsPerBox}
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="h-14 bg-primary text-primary-foreground rounded-xl font-bold active:scale-95 transition-transform shadow-sm"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleQuickAdjust(product, product.quantity, product.unitsPerBox)}
                        className="h-14 bg-card border-2 border-border rounded-xl font-bold text-base text-foreground active:scale-95 transition-transform"
                      >
                        +{product.unitsPerBox}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========== DESKTOP LAYOUT ========== */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Управление складом</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Быстрое редактирование остатков и контроль запасов
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessingInvoice ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Обработка...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Загрузить накладную</span>
              </>
            )}
          </button>
        </div>

        {/* Stats Cards - Desktop */}
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border border-green-200 dark:border-green-700 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-700 dark:text-green-300 font-medium mb-1">Всего единиц</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{totalStock.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-200 dark:bg-green-700 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border border-orange-200 dark:border-orange-700 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-700 dark:text-orange-300 font-medium mb-1">Мало</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{lowStockCount}</p>
                </div>
                <div className="w-12 h-12 bg-orange-200 dark:bg-orange-700 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border border-red-200 dark:border-red-700 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-700 dark:text-red-300 font-medium mb-1">Нет в наличии</p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100">{outOfStockCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-200 dark:bg-red-700 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-200 dark:border-purple-700 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-700 dark:text-purple-300 font-medium mb-1">
                    Срок годности
                  </p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                    {expiryView === 'soon' ? expiringSoonCount : expiredCount}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-200 dark:bg-purple-700 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setExpiryView('soon')}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors whitespace-nowrap ${
                    expiryView === 'soon'
                      ? 'bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-purple-100 font-medium'
                      : 'text-purple-600 dark:text-purple-400'
                  }`}
                >
                  Скоро
                </button>
                <button
                  onClick={() => setExpiryView('expired')}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors whitespace-nowrap ${
                    expiryView === 'expired'
                      ? 'bg-red-200 dark:bg-red-700 text-red-900 dark:text-red-100 font-medium'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  Просрочено
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Поиск товаров..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-input-background border border-border rounded-xl text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Название</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Артикул</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Категория</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Ед/упак</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Остаток</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => {
                  const isEditing = editingId === product.id;
                  return (
                    <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{product.sku}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{getCategoryName(product.categoryId)}</td>
                      <td className="px-4 py-3 w-32">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editUnitsPerBoxValue}
                            onChange={(e) => setEditUnitsPerBoxValue(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 px-2 py-1 bg-input-background border border-border rounded text-sm text-foreground"
                            min="1"
                          />
                        ) : (
                          <span className="text-sm text-foreground">{product.unitsPerBox}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 w-32">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                            className="w-24 max-w-24 px-2 py-1 bg-input-background border border-border rounded text-foreground"
                            min="0"
                            style={{ maxWidth: '96px', boxSizing: 'border-box' }}
                          />
                        ) : (
                          <span className="font-medium text-foreground">{product.quantity}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleSave(product)} className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded">
                              Сохранить
                            </button>
                            <button onClick={handleCancel} className="px-3 py-1 text-sm border border-border bg-card text-foreground rounded">
                              Отмена
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => handleEdit(product)} className="px-3 py-1 text-sm border border-border bg-card text-foreground rounded">
                            Изменить
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal для результатов обработки накладной */}
      {showResultModal && invoiceResult && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-card rounded-t-2xl md:rounded-xl max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-card border-b border-border px-4 md:px-6 py-3 md:py-4 flex items-center justify-between z-10">
              <h3 className="text-lg md:text-xl font-semibold flex items-center gap-2 text-foreground">
                <FileText className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Результаты обработки накладной</span>
                <span className="sm:hidden">Накладная</span>
              </h3>
              <button
                onClick={() => {
                  setShowResultModal(false);
                  setInvoiceResult(null);
                  setSelectedItems(new Set());
                  setEditedQuantities({});
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4 md:space-y-6 flex-1 overflow-y-auto pb-20 md:pb-6">
              {/* Информация о накладной */}
              {invoiceResult.invoiceInfo && (
                <div className="bg-muted rounded-lg p-3 md:p-4 space-y-2">
                  {invoiceResult.invoiceInfo.invoiceNumber && (
                    <div className="text-xs md:text-sm text-foreground">
                      <span className="font-medium">Номер накладной:</span> {invoiceResult.invoiceInfo.invoiceNumber}
                    </div>
                  )}
                  {invoiceResult.invoiceInfo.date && (
                    <div className="text-xs md:text-sm text-foreground">
                      <span className="font-medium">Дата:</span> {invoiceResult.invoiceInfo.date}
                    </div>
                  )}
                  {invoiceResult.invoiceInfo.supplier && (
                    <div className="text-xs md:text-sm text-foreground">
                      <span className="font-medium">Поставщик:</span> {invoiceResult.invoiceInfo.supplier}
                    </div>
                  )}
                </div>
              )}

              {/* Сводка */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-1 md:gap-2 mb-1">
                    <FileText className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs md:text-sm font-medium text-blue-700 dark:text-blue-300">Всего</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-blue-900 dark:text-blue-100">{invoiceResult.summary.total}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-1 md:gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
                    <span className="text-xs md:text-sm font-medium text-green-700 dark:text-green-300">Найдено</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-green-900 dark:text-green-100">{invoiceResult.summary.found}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-1 md:gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs md:text-sm font-medium text-orange-700 dark:text-orange-300">Не найдено</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-orange-900 dark:text-orange-100">{invoiceResult.summary.notFound}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-1 md:gap-2 mb-1">
                    <X className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400" />
                    <span className="text-xs md:text-sm font-medium text-red-700 dark:text-red-300">Ошибки</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-red-900 dark:text-red-100">{invoiceResult.summary.errors}</p>
                </div>
              </div>

              {/* Найденные товары с возможностью редактирования */}
              {invoiceResult.found.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base text-foreground">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    Найденные товары ({invoiceResult.found.length})
                  </h4>
                  <div className="space-y-3 max-h-[50vh] md:max-h-96 overflow-y-auto">
                    {invoiceResult.found.map((item, idx) => {
                      const isSelected = selectedItems.has(item.product.id);
                      const editedQty = editedQuantities[item.product.id] ?? item.quantity;
                      const canSelect = item.canAdd;

                      return (
                        <div
                          key={idx}
                          className={`border-2 rounded-lg p-3 md:p-4 ${item.error
                            ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'
                            : canSelect && isSelected
                              ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                              : 'bg-muted border-border'
                            }`}
                        >
                          <div className="flex items-start gap-2 md:gap-3">
                            {canSelect && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleItem(item.product.id)}
                                className="mt-1 w-5 h-5 text-primary rounded focus:ring-ring flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="mb-2">
                                <div className="font-medium text-foreground text-sm md:text-base break-words">{item.product.name}</div>
                                <div className="text-xs md:text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-2">
                                  <span>Артикул: {item.product.sku}</span>
                                  {item.product.brandName && (
                                    <span>Бренд: {item.product.brandName}</span>
                                  )}
                                </div>
                                {item.originalItem.productName !== item.product.name && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Найдено как: "{item.originalItem.productName}"
                                  </div>
                                )}
                              </div>
                              {item.error && (
                                <div className="text-xs md:text-sm text-red-700 dark:text-red-300 mb-2 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded">
                                  ⚠️ {item.error}
                                </div>
                              )}
                              <div className="space-y-2 md:space-y-0 md:flex md:flex-wrap md:items-center md:gap-3 md:gap-y-2 mt-3">
                                <div className="text-xs md:text-sm text-muted-foreground">
                                  <span className="font-medium hidden md:inline">Текущий: </span>{item.currentQuantity} шт
                                </div>
                                <div className="text-xs md:text-sm text-muted-foreground">
                                  <span className="font-medium hidden md:inline">В накладной: </span>
                                  {item.originalItem.quantity} {item.originalItem.unit || 'шт'}
                                </div>
                                {canSelect && (
                                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                                    <span className="text-xs md:text-sm font-medium text-foreground hidden md:inline">Добавить: </span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleQuantityChange(item.product.id, editedQty - 1)}
                                        className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded hover:bg-muted active:scale-95 transition-transform"
                                      >
                                        <Minus className="w-4 h-4 text-foreground" />
                                      </button>
                                      <input
                                        type="number"
                                        value={editedQty}
                                        onChange={(e) =>
                                          handleQuantityChange(item.product.id, parseInt(e.target.value) || 0)
                                        }
                                        className="w-16 md:w-20 px-2 py-1 text-center text-sm border border-border bg-input-background text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring"
                                        min="0"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleQuantityChange(item.product.id, editedQty + 1)}
                                        className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded hover:bg-muted active:scale-95 transition-transform"
                                      >
                                        <Plus className="w-4 h-4 text-foreground" />
                                      </button>
                                    </div>
                                    <span className="text-xs md:text-sm text-muted-foreground">
                                      → Будет: <span className="font-semibold">{item.currentQuantity + editedQty}</span> шт
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Не найденные товары */}
              {invoiceResult.notFound.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base text-foreground">
                    <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    Товары не найдены в базе ({invoiceResult.notFound.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {invoiceResult.notFound.map((item, idx) => (
                      <div key={idx} className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-3 text-xs md:text-sm">
                        <div className="font-medium break-words text-foreground">{item.productName || 'Не указано название'}</div>
                        <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-2">
                          <span>Количество: <span className="font-semibold">{item.quantity}</span> {item.unit || 'шт'}</span>
                          {item.sku && <span>Артикул: {item.sku}</span>}
                          {item.brand && <span>Бренд: {item.brand}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ошибки */}
              {invoiceResult.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base text-foreground">
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                    Ошибки обработки ({invoiceResult.errors.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {invoiceResult.errors.map((error, idx) => (
                      <div key={idx} className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3 text-xs md:text-sm">
                        <div className="font-medium text-red-700 dark:text-red-300 break-words">{error.error}</div>
                        {error.item.productName && (
                          <div className="text-muted-foreground mt-1">Товар: {error.item.productName}</div>
                        )}
                        {error.item.quantity && (
                          <div className="text-muted-foreground">Количество: {error.item.quantity}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Кнопки действий */}
              <div className="sticky bottom-0 bg-card border-t border-border p-4 md:p-0 md:relative md:bg-transparent md:border-t md:pt-4 -mx-4 md:mx-0 -mb-4 md:mb-0 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 shadow-lg md:shadow-none">
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    setInvoiceResult(null);
                    setSelectedItems(new Set());
                    setEditedQuantities({});
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 border border-border bg-card text-foreground rounded-lg hover:bg-muted active:scale-98 transition-all text-sm md:text-base"
                  disabled={isConfirming}
                >
                  Отмена
                </button>
                <button
                  onClick={handleConfirmInvoice}
                  disabled={isConfirming || selectedItems.size === 0}
                  className="w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm md:text-base active:scale-98"
                >
                  {isConfirming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Добавление...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Добавить на склад ({selectedItems.size})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ScrollToTopButton />
    </div>
  );
}