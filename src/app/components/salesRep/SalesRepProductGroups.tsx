import React, { useState, useEffect } from 'react';
import { Package, Loader2, Image as ImageIcon } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
  images?: string[];
  sku?: string;
  brandName?: string;
  brandId?: string;
  packageInfo?: string;
  storageLife?: string;
  productionDate?: string;
  allergens?: string | string[];
  ageRestrictions?: string;
}

export function SalesRepProductGroups() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ items?: Product[] }>('/sales-reps/products');
      console.log('GET /sales-reps/products response', response.data);
      const items = response.data?.items || response.data || [];
      setProducts(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Ошибка загрузки товаров', error);
      toast.error('Не удалось загрузить товары');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 md:w-6 md:h-6" />
            Мои закрепленные товары
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего товаров: {products.length}
          </p>
        </div>
        <button
          onClick={loadProducts}
          className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm font-medium self-start sm:self-auto"
        >
          Обновить
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет закрепленных товаров</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                        }
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-2">{product.name}</h3>
                  {product.category && (
                    <p className="text-xs text-muted-foreground mb-2">{product.category.name}</p>
                  )}
                  {product.brandName && (
                    <p className="text-xs text-muted-foreground mb-2">Бренд: {product.brandName}</p>
                  )}
                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-border">
                {product.sku && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Артикул</span>
                    <span className="font-medium">{product.sku}</span>
                  </div>
                )}
                {product.packageInfo && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Упаковка</span>
                    <span className="font-medium">{product.packageInfo}</span>
                  </div>
                )}
                {product.storageLife && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Срок хранения</span>
                    <span className="font-medium">{product.storageLife}</span>
                  </div>
                )}
                {product.allergens && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Аллергены: </span>
                    {Array.isArray(product.allergens) 
                      ? product.allergens.join(', ')
                      : product.allergens
                    }
                  </div>
                )}
                {product.ageRestrictions && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Возрастные ограничения: </span>
                    {product.ageRestrictions}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
