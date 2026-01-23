import React, { useState } from 'react';
import { Search, Plus, Package } from 'lucide-react';
import { Product, Category } from '../../types';

interface ProductListProps {
  products: Product[];
  categories: Category[];
  onCreateProduct: () => void;
}

export function ProductList({ products, categories, onCreateProduct }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || '—';
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Нет в наличии', color: 'bg-red-100 text-red-800', icon: '⚠️' };
    if (quantity < 20) return { label: 'Мало', color: 'bg-orange-100 text-orange-800', icon: '⚡' };
    return { label: 'В наличии', color: 'bg-green-100 text-green-800', icon: '✓' };
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== MOBILE LAYOUT ========== */}
      <div className="md:hidden">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="p-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Товары</h1>
            <button
              onClick={onCreateProduct}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl h-14 font-semibold shadow-sm active:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Добавить товар
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Поиск по названию или артикулу"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-300 rounded-xl text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="pb-24">
          {filteredProducts.length === 0 ? (
            <div className="px-4 py-20 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-3xl flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Товары не найдены</h3>
              <p className="text-base text-gray-600 max-w-xs mx-auto">
                {searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Добавьте товары из каталога брендов для начала работы'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.quantity);
                return (
                  <div
                    key={product.id}
                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 mb-2 leading-tight">{product.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">Артикул: {product.sku}</p>
                      </div>
                    </div>

                    {/* Stock Badge */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold mb-5 ${stockStatus.color}`}>
                      <span className="text-lg">{stockStatus.icon}</span>
                      <span>{stockStatus.label}</span>
                      <span className="ml-1">{product.quantity} шт</span>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-4"></div>

                    {/* Details Grid */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-500">Категория</span>
                        <span className="text-sm font-bold text-gray-900">{getCategoryName(product.categoryId)}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-500">Упаковка</span>
                        <span className="text-sm font-bold text-gray-900">{product.packageInfo || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-500">Вес</span>
                        <span className="text-sm font-bold text-gray-900">{product.weight}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-500">Объем</span>
                        <span className="text-sm font-bold text-gray-900">{product.volume}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-500">В упаковке</span>
                        <span className="text-sm font-bold text-gray-900">{product.unitsPerBox} шт</span>
                      </div>
                    </div>

                    {/* Source */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${
                        product.createdBy === 'brand'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {product.brandName
                          ? `Источник: ${product.brandName || 'Брендs'}`
                          : 'Источник: Магазин'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========== DESKTOP LAYOUT ========== */}
      <div className="hidden md:block">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Товары</h2>
            <p className="text-sm text-gray-500 mt-1">
              Управление товарным ассортиментом
            </p>
          </div>
          <button
            onClick={onCreateProduct}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            <Plus className="w-5 h-5" />
            Добавить товар
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 md:px-0 md:py-0 md:mb-4">
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

        {filteredProducts.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Товары не найдены</h3>
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Добавьте товары из каталога брендов для начала работы'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Product Cards */}
            <div className="md:hidden px-4 space-y-3">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.quantity);
                return (
                  <div
                    key={product.id}
                    className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
                  >
                    {/* Product Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1.5 leading-snug">{product.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">Арт: {product.sku}</p>
                      </div>
                    </div>

                    {/* Stock Status Badge */}
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-4 ${stockStatus.color}`}>
                      <span className="text-base">{stockStatus.icon}</span>
                      <span>{stockStatus.label}</span>
                      <span className="ml-1 font-semibold">{product.quantity} шт</span>
                    </div>

                    {/* Product Details Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Категория</p>
                        <p className="text-sm font-medium">{getCategoryName(product.categoryId)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Упаковка</p>
                        <p className="text-sm font-medium">{product.packageInfo || '—'}</p>
                      </div>
                    </div>

                    {/* Source Badge */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${
                        product.createdBy === 'brand'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        Источник: {product.brandName ? product.brandName : 'Бренд'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium">Название</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Артикул</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Категория</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Остаток</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Упаковка</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Источник</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.quantity);
                      return (
                        <tr
                          key={product.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium">{product.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 font-mono">{product.sku}</td>
                          <td className="px-4 py-3 text-sm">{getCategoryName(product.categoryId)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{product.quantity}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${stockStatus.color}`}>
                                {stockStatus.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{product.packageInfo || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded ${
                              product.createdBy === 'brand' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {product.brandName ? product.brandName : 'Бренд'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}