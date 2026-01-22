import React from 'react';
import { Package, Building2 } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  productCount?: number;
}

export function BrandsProducts() {
  // TODO: Заменить на реальные данные из API
  const brands: Brand[] = [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Бренды / Товары</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm font-medium">
          Добавить бренд
        </button>
      </div>

      {brands.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Бренды не найдены</p>
          <p className="text-sm text-muted-foreground mt-2">Добавьте первый бренд для начала работы</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => (
            <div key={brand.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-lg">{brand.name}</h3>
              </div>
              {brand.productCount !== undefined && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span>Товаров: {brand.productCount}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
