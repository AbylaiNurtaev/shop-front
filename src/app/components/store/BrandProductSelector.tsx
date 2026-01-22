import React, { useState } from 'react';
import { Search, X, Plus, Check, ChevronDown, Package } from 'lucide-react';
import { Product, Category } from '../../types';

interface BrandProductSelectorProps {
  brandProducts: Product[];
  categories: Category[];
  onAddProduct: (product: Product, quantity: number, price: number, currency: string, isAvailable: boolean) => void;
  onClose: () => void;
}

export function BrandProductSelector({ brandProducts, categories, onAddProduct, onClose }: BrandProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [initialQuantity, setInitialQuantity] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState('RUB');
  const [isAvailable, setIsAvailable] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || '—';
  };

  const filteredProducts = brandProducts.filter((product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleConfirmAdd = () => {
    if (selectedProduct && initialQuantity > 0 && price > 0) {
      onAddProduct(selectedProduct, initialQuantity, price, currency, isAvailable);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedProduct(null);
        setInitialQuantity(0);
        setPrice(0);
      }, 1500);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setInitialQuantity(0);
    setPrice(0);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b-2 border-gray-200 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Добавить товар</h2>
            <p className="text-sm text-gray-600 mt-1">Выберите товар из каталога брендов</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search & Filters */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex-shrink-0">
              <div className="flex gap-3 flex-wrap">
                {/* Search */}
                <div className="flex-1 min-w-[300px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="search"
                      placeholder="Поиск по названию или артикулу"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-11 px-3 pr-8 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option value="">Все категории</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Product List - Desktop Table */}
            <div className="flex-1 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                      <Package className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {searchTerm || selectedCategory ? 'Товары не найдены' : 'Каталог брендов пуст'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {searchTerm || selectedCategory 
                        ? 'Попробуйте изменить параметры поиска'
                        : 'Бренды пока не добавили товары в каталог'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Товар</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Артикул</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Категория</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Упаковка</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Источник</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Действие</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredProducts.map((product) => (
                          <tr 
                            key={product.id} 
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-4">
                              <div className="font-semibold text-gray-900">{product.name}</div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-mono text-gray-600">{product.sku}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-gray-700">{getCategoryName(product.categoryId)}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-gray-700">{product.packageInfo || '—'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-800">
                                {product.brandName || 'Бренд'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <button
                                onClick={() => handleSelectProduct(product)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                                Добавить
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Results Count */}
                  <div className="mt-4 text-sm text-gray-600">
                    Показано товаров: <span className="font-semibold text-gray-900">{filteredProducts.length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Confirmation Panel (Right Side) */}
          {selectedProduct && (
            <div className="w-96 border-l-2 border-gray-200 bg-gray-50 flex flex-col overflow-hidden animate-slideInRight">
              <div className="px-6 py-5 bg-white border-b-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Подтверждение</h3>
                <p className="text-sm text-gray-600 mt-1">Установите начальное количество</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Product Details - Read Only */}
                <div className="bg-white border-2 border-blue-200 rounded-xl p-5">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-4">Выбранный товар</p>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Название</p>
                      <p className="font-bold text-base text-gray-900">{selectedProduct.name}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Артикул</p>
                        <p className="font-mono text-sm font-semibold text-gray-900">{selectedProduct.sku}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Категория</p>
                        <p className="text-sm font-semibold text-gray-900">{getCategoryName(selectedProduct.categoryId)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Упаковка</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedProduct.packageInfo || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Quantity Input */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    Начальное количество <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={initialQuantity}
                    onChange={(e) => setInitialQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    min="0"
                    className="w-full h-14 px-4 bg-gray-50 border-2 border-gray-300 rounded-lg text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Введите количество единиц для добавления в склад
                  </p>
                </div>

                  <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Цена <span className="text-red-600">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="0"
                        min="0"
                        className="col-span-2 h-12 px-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="h-12 px-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="RUB">RUB</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                    <label className="flex items-center gap-3 text-sm font-bold text-gray-900">
                      <input
                        type="checkbox"
                        checked={isAvailable}
                        onChange={(e) => setIsAvailable(e.target.checked)}
                        className="h-5 w-5"
                      />
                      Доступен для продажи
                    </label>
                  </div>

                {/* Success Message */}
                {showSuccess && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-green-900">Товар добавлен!</p>
                      <p className="text-sm text-green-700">Проверьте список товаров</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-white border-t-2 border-gray-200 space-y-3">
                <button
                  onClick={handleConfirmAdd}
                  disabled={initialQuantity === 0 || price === 0 || showSuccess}
                  className="w-full h-12 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Добавить в инвентарь
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-full h-12 border-2 border-gray-300 bg-white text-gray-700 rounded-lg font-bold hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}