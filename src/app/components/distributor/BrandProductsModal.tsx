import React, { useState, useEffect } from 'react';
import { X, Package, Loader2, Image } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface BrandProduct {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  brandId: string;
  brandName?: string;
  images?: string[];
  sku?: string;
  packageInfo?: string;
  storageLife?: string;
  productionDate?: string;
  allergens?: string | string[];
  ageRestrictions?: string;
}

interface BrandProductsModalProps {
  brandId: string;
  brandName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BrandProductsModal({ brandId, brandName, isOpen, onClose }: BrandProductsModalProps) {
  const [products, setProducts] = useState<BrandProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && brandId) {
      loadProducts();
    }
  }, [isOpen, brandId]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ items: BrandProduct[] }>(`/brands/${brandId}/products`);
      setProducts(response.data?.items || []);
    } catch (error) {
      console.error('Ошибка загрузки товаров бренда', error);
      toast.error('Не удалось загрузить товары бренда');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold">Товары бренда: {brandName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Всего товаров: {products.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Товары не найдены</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-muted border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Изображение товара */}
                  {product.images && product.images.length > 0 ? (
                    <div className="w-full aspect-square mb-3 rounded-md overflow-hidden bg-muted">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-square mb-3 rounded-md bg-muted flex items-center justify-center">
                      <Image className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Название и SKU */}
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  {product.sku && (
                    <p className="text-sm text-muted-foreground mb-2">
                      SKU: {product.sku}
                    </p>
                  )}

                  {/* Описание */}
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Дополнительная информация */}
                  <div className="space-y-1 text-sm">
                    {product.packageInfo && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">Упаковка:</span> {product.packageInfo}
                      </div>
                    )}
                    {product.storageLife && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">Срок хранения:</span> {product.storageLife}
                      </div>
                    )}
                    {product.productionDate && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">Дата производства:</span>{' '}
                        {new Date(product.productionDate).toLocaleDateString('ru-RU')}
                      </div>
                    )}
                    {product.allergens && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">Аллергены:</span>{' '}
                        {Array.isArray(product.allergens)
                          ? product.allergens.join(', ')
                          : product.allergens}
                      </div>
                    )}
                    {product.ageRestrictions && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">Возрастные ограничения:</span>{' '}
                        {product.ageRestrictions}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
