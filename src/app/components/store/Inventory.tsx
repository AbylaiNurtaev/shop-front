import { useState, useRef } from 'react';
import { Search, Minus, Plus, Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Product, Category } from '../../types';
import api from '../../api/axios';
import { toast } from 'sonner';

interface InventoryProps {
  products: Product[];
  categories: Category[];
  onUpdateQuantity: (product: Product, newQuantity: number) => void;
}

type InvoiceProcessingResult = {
  invoiceNumber?: string;
  invoiceDate?: string;
  supplier?: string;
  summary: {
    processed: number;
    notFound: number;
    errors: number;
  };
  processedItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    sku?: string;
  }>;
  notFoundItems: Array<{
    name: string;
    quantity: number;
    sku?: string;
  }>;
  errors: Array<{
    message: string;
    item?: string;
  }>;
};

export function Inventory({ products, categories, onUpdateQuantity }: InventoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [isProcessingInvoice, setIsProcessingInvoice] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState<InvoiceProcessingResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || '—';
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditValue(product.quantity);
  };

  const handleSave = (product: Product) => {
    onUpdateQuantity(product, editValue);
    setEditingId(null);
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
      setShowResultModal(true);

      if (result.summary.processed > 0) {
        toast.success(`Обработано ${result.summary.processed} товар(ов)`);
        // Обновляем страницу или перезагружаем товары
        window.location.reload();
      } else {
        toast.warning('Товары не были обработаны');
      }
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleInvoiceUpload(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== MOBILE LAYOUT ========== */}
      <div className="md:hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Управление складом</h1>
                <p className="text-sm text-gray-600">Быстрое изменение остатков</p>
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
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="space-y-3">
            {/* Total Stock */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Всего единиц</p>
                  <p className="text-4xl font-black text-green-900">{totalStock.toLocaleString()}</p>
                </div>
                <div className="w-16 h-16 bg-green-200 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">📦</span>
                </div>
              </div>
            </div>

            {/* Low Stock + Out of Stock in row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">Мало</p>
                <p className="text-3xl font-black text-orange-900">{lowStockCount}</p>
                <span className="text-lg mt-1 block">⚡</span>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">Нет</p>
                <p className="text-3xl font-black text-red-900">{outOfStockCount}</p>
                <span className="text-lg mt-1 block">⚠️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Поиск товаров"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-300 rounded-xl text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Inventory Cards */}
        <div className="p-4 pb-24 space-y-4">
          {filteredProducts.map((product) => {
            const isEditing = editingId === product.id;
            const statusColor = 
              product.quantity === 0 ? 'border-red-300 bg-red-50' : 
              product.quantity < 20 ? 'border-orange-300 bg-orange-50' : 
              'border-green-300 bg-green-50';

            return (
              <div
                key={product.id}
                className={`border-2 rounded-2xl p-5 shadow-sm ${statusColor}`}
              >
                {/* Product Info */}
                <div className="mb-5">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 leading-tight">{product.name}</h3>
                  <p className="text-sm text-gray-600 font-mono mb-1">Артикул: {product.sku}</p>
                  <p className="text-xs text-gray-500">{getCategoryName(product.categoryId)}</p>
                </div>

                {isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl p-4 border-2 border-blue-500 shadow-md">
                      <p className="text-xs font-bold text-blue-600 uppercase text-center mb-3">Новое количество</p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditValue(Math.max(0, editValue - 1))}
                          className="w-14 h-14 flex items-center justify-center bg-gray-100 rounded-xl active:scale-95 active:bg-gray-200 transition-all font-bold text-xl"
                        >
                          <Minus className="w-6 h-6" />
                        </button>
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(Math.max(0, parseInt(e.target.value) || 0))}
                          className="flex-1 h-14 text-center text-3xl font-black bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                        />
                        <button
                          type="button"
                          onClick={() => setEditValue(editValue + 1)}
                          className="w-14 h-14 flex items-center justify-center bg-gray-100 rounded-xl active:scale-95 active:bg-gray-200 transition-all font-bold text-xl"
                        >
                          <Plus className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleCancel}
                        className="h-14 border-2 border-gray-300 bg-white rounded-xl font-bold text-gray-700 active:scale-98 transition-transform"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={() => handleSave(product)}
                        className="h-14 bg-blue-600 text-white rounded-xl font-bold active:scale-98 transition-transform shadow-sm"
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl p-5 border-2 border-gray-200 shadow-sm">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Текущий остаток</p>
                      <p className="text-4xl font-black text-gray-900">{product.quantity} <span className="text-xl text-gray-500">шт</span></p>
                      <p className="text-xs text-gray-500 mt-2">Упаковка: {product.unitsPerBox} шт</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleQuickAdjust(product, product.quantity, -product.unitsPerBox)}
                        className="h-14 bg-white border-2 border-gray-300 rounded-xl font-bold text-base active:scale-95 transition-transform"
                      >
                        −{product.unitsPerBox}
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="h-14 bg-blue-600 text-white rounded-xl font-bold active:scale-95 transition-transform shadow-sm"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleQuickAdjust(product, product.quantity, product.unitsPerBox)}
                        className="h-14 bg-white border-2 border-gray-300 rounded-xl font-bold text-base active:scale-95 transition-transform"
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
            <h2 className="text-2xl font-semibold">Управление складом</h2>
            <p className="text-sm text-gray-500 mt-1">
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
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-700 font-medium mb-1">Всего единиц</p>
                  <p className="text-3xl font-bold text-green-900">{totalStock.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-700 font-medium mb-1">Мало</p>
                  <p className="text-3xl font-bold text-orange-900">{lowStockCount}</p>
                </div>
                <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-700 font-medium mb-1">Нет в наличии</p>
                  <p className="text-3xl font-bold text-red-900">{outOfStockCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-200 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Поиск товаров..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium">Название</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Артикул</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Категория</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Остаток</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Ед/упак</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const isEditing = editingId === product.id;
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{product.sku}</td>
                      <td className="px-4 py-3 text-sm">{getCategoryName(product.categoryId)}</td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                            className="w-24 px-2 py-1 bg-gray-50 border border-gray-300 rounded"
                            min="0"
                          />
                        ) : (
                          <span className="font-medium">{product.quantity}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">{product.unitsPerBox}</td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleSave(product)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded">
                              Сохранить
                            </button>
                            <button onClick={handleCancel} className="px-3 py-1 text-sm border border-gray-300 rounded">
                              Отмена
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => handleEdit(product)} className="px-3 py-1 text-sm border border-gray-300 rounded">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Результаты обработки накладной
              </h3>
              <button
                onClick={() => setShowResultModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Информация о накладной */}
              {(invoiceResult.invoiceNumber || invoiceResult.invoiceDate || invoiceResult.supplier) && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {invoiceResult.invoiceNumber && (
                    <div className="text-sm">
                      <span className="font-medium">Номер накладной:</span> {invoiceResult.invoiceNumber}
                    </div>
                  )}
                  {invoiceResult.invoiceDate && (
                    <div className="text-sm">
                      <span className="font-medium">Дата:</span> {invoiceResult.invoiceDate}
                    </div>
                  )}
                  {invoiceResult.supplier && (
                    <div className="text-sm">
                      <span className="font-medium">Поставщик:</span> {invoiceResult.supplier}
                    </div>
                  )}
                </div>
              )}

              {/* Сводка */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Обработано</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{invoiceResult.summary.processed}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">Не найдено</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">{invoiceResult.summary.notFound}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <X className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-700">Ошибки</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900">{invoiceResult.summary.errors}</p>
                </div>
              </div>

              {/* Обработанные товары */}
              {invoiceResult.processedItems.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Обработанные товары ({invoiceResult.processedItems.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {invoiceResult.processedItems.map((item, idx) => (
                      <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-gray-600 mt-1">
                          Количество: <span className="font-semibold">{item.quantity}</span>
                          {item.sku && <span className="ml-2">Артикул: {item.sku}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Не найденные товары */}
              {invoiceResult.notFoundItems.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    Товары не найдены в базе ({invoiceResult.notFoundItems.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {invoiceResult.notFoundItems.map((item, idx) => (
                      <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-gray-600 mt-1">
                          Количество: <span className="font-semibold">{item.quantity}</span>
                          {item.sku && <span className="ml-2">Артикул: {item.sku}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ошибки */}
              {invoiceResult.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <X className="w-4 h-4 text-red-600" />
                    Ошибки ({invoiceResult.errors.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {invoiceResult.errors.map((error, idx) => (
                      <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                        <div className="font-medium text-red-700">{error.message}</div>
                        {error.item && <div className="text-gray-600 mt-1">Товар: {error.item}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowResultModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}