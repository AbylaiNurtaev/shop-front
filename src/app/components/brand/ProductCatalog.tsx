import React, { useState } from 'react';
import { Search, Plus, Package, CreditCard, ChevronRight, Loader2 } from 'lucide-react';
import { Product, Category } from '../../types';
import { PaymentModal } from './PaymentModal';
import { ScrollToTopButton } from '../ui/scroll-to-top-button';

interface ProductCatalogProps {
  products: Product[];
  categories: Category[];
  onCreateProduct: () => void;
  onEditProduct: (product: Product) => void;
  isLoading?: boolean;
}

export function ProductCatalog({
  products,
  categories,
  onCreateProduct,
  onEditProduct,
  isLoading = false,
}: ProductCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [productsList, setProductsList] = useState<Product[]>(products);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Обновляем список продуктов при изменении пропсов
  React.useEffect(() => {
    setProductsList(products);
  }, [products]);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || '—';
  };

  // Проверка статуса оплаты
  const isPaymentActive = (product: Product): boolean => {
    return (
      product.isPayed === true &&
      product.paymentExpiresAt !== undefined &&
      new Date() < new Date(product.paymentExpiresAt)
    );
  };

  // Получение срока до истечения оплаты (в днях или месяцах)
  const getDaysUntilExpiry = (product: Product): string | null => {
    if (!product.paymentExpiresAt) return null;
    const expiryDate = new Date(product.paymentExpiresAt);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return '0 дн.';
    
    // Если больше 30 дней, показываем в месяцах
    if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      return `${months} мес.`;
    }
    
    return `${diffDays} дн.`;
  };

  const handlePaymentClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (updatedProduct: Product) => {
    setProductsList((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    // Также обновляем в родительском компоненте, если нужно
  };

  const handleMultiplePaymentSuccess = (updatedProducts: Product[]) => {
    setProductsList((prev) => {
      const updatedMap = new Map(updatedProducts.map(p => [p.id, p]));
      return prev.map((p) => updatedMap.get(p.id) || p);
    });
    setSelectedProducts(new Set());
  };

  const toggleProductSelection = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleMultiplePaymentClick = () => {
    const productsToPay = productsList.filter(p => selectedProducts.has(p.id));
    if (productsToPay.length > 0) {
      setSelectedProduct(productsToPay[0]); // Для обратной совместимости, но модалка будет обрабатывать несколько
      setIsPaymentModalOpen(true);
    }
  };

  const getSelectedProducts = (): Product[] => {
    return productsList.filter(p => selectedProducts.has(p.id));
  };

  const filteredProducts = productsList.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Mobile Header and Search - Fixed */}
      <div className="md:hidden bg-card border-b border-border fixed top-0 left-0 right-0 z-20">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold mb-3">Каталог товаров</h1>
          <button
            onClick={onCreateProduct}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3.5 font-medium shadow-sm active:scale-98 transition-transform"
          >
            <Plus className="w-5 h-5" />
            Создать товар
          </button>
        </div>
        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Поиск товаров в каталоге..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-card border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Каталог товаров</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Создание и управление товарами для магазинов
          </p>
        </div>
        <button
          onClick={onCreateProduct}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          <Plus className="w-5 h-5" />
          Создать товар
        </button>
      </div>

      {/* Search - Desktop */}
      <div className="hidden md:block md:mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Поиск товаров в каталоге..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-card border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Spacer for fixed elements on mobile */}
      <div className="md:hidden h-[200px]"></div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Загрузка товаров...</p>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-2xl flex items-center justify-center">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Товары в каталоге отсутствуют</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Создайте первый товар для выбора магазинами'}
          </p>
          {!searchTerm && (
            <button
              onClick={onCreateProduct}
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Создать первый товар
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Product Cards */}
          <div className="md:hidden px-4 space-y-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                role="button"
                tabIndex={0}
                onClick={() => onEditProduct(product)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onEditProduct(product);
                  }
                }}
                className="bg-card border border-border rounded-2xl p-4 shadow-sm transition-shadow cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <div className="flex items-start gap-3 mb-4">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => {}}
                    onClick={(e) => toggleProductSelection(product.id, e)}
                    className="w-5 h-5 mt-1 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1.5 leading-snug">{product.name}</h3>
                    <p className="text-sm text-muted-foreground font-mono">Арт: {product.sku}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground mt-1" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Категория</p>
                    <p className="text-sm font-medium">{getCategoryName(product.categoryId)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Оплата</p>
                    {isPaymentActive(product) ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {getDaysUntilExpiry(product)}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handlePaymentClick(e, product)}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Оплатить
                      </button>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Упаковка</p>
                    <p className="text-sm font-medium">{product.packageInfo || '—'}</p>
                  </div>
                  
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium w-12">
                    <input
                      type="checkbox"
                      checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedProducts.has(p.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
                        } else {
                          setSelectedProducts(new Set());
                        }
                      }}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Товар</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Артикул</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Категория</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Упаковка</th>
                  
                  <th className="text-left px-4 py-3 text-sm font-medium">Оплата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => onEditProduct(product)}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => {}}
                        onClick={(e) => toggleProductSelection(product.id, e)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{product.sku}</td>
                    <td className="px-4 py-3 text-sm">{getCategoryName(product.categoryId)}</td>
                    <td className="px-4 py-3 text-sm">{product.packageInfo || '—'}</td>
                    
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {isPaymentActive(product) ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {getDaysUntilExpiry(product)}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handlePaymentClick(e, product)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm font-medium"
                        >
                          <CreditCard className="w-4 h-4" />
                          Оплатить
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Payment Modal */}
      {selectedProduct && (
        <PaymentModal
          product={selectedProduct}
          products={getSelectedProducts()}
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedProduct(null);
          }}
          onPaymentSuccess={handlePaymentSuccess}
          onMultiplePaymentSuccess={handleMultiplePaymentSuccess}
        />
      )}

      {/* Fixed Payment Button - Mobile */}
      {selectedProducts.size > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border p-4 shadow-lg">
          <button
            onClick={handleMultiplePaymentClick}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3.5 font-medium shadow-sm active:scale-98 transition-transform"
          >
            <CreditCard className="w-5 h-5" />
            Оплатить ({selectedProducts.size})
          </button>
        </div>
      )}

      {/* Fixed Payment Button - Desktop */}
      {selectedProducts.size > 0 && (
        <div className="hidden md:flex fixed bottom-6 right-6 z-30">
          <button
            onClick={handleMultiplePaymentClick}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-6 py-3.5 font-medium shadow-lg hover:opacity-90 transition-opacity"
          >
            <CreditCard className="w-5 h-5" />
            Оплатить выбранные ({selectedProducts.size})
          </button>
        </div>
      )}
      <ScrollToTopButton />
    </div>
  );
}