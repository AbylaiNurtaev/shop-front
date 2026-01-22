import React, { useState, useEffect } from 'react';
import { Store, MapPin, Package, TrendingUp, AlertCircle, Clock, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface Store {
  id: string;
  name: string;
  address?: string;
  city?: string;
  productCount?: number;
  lowStockCount?: number;
  expiringCount?: number;
}

export function SalesRepHome() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ items: Store[] }>('/sales-reps/stores');
      setStores(response.data?.items || []);
    } catch (error) {
      console.error('Ошибка загрузки магазинов', error);
      toast.error('Не удалось загрузить магазины');
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Закрепленные магазины</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего магазинов: {stores.length}
          </p>
        </div>
        <button
          onClick={loadStores}
          className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm font-medium"
        >
          Обновить
        </button>
      </div>

      {stores.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет закрепленных магазинов</p>
          <p className="text-sm text-muted-foreground mt-2">
            Обратитесь к дистрибьютору для назначения магазинов
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => (
            <div
              key={store.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Store className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1">{store.name}</h3>
                  {store.address && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{store.address}</span>
                    </div>
                  )}
                  {store.city && (
                    <p className="text-xs text-muted-foreground mt-1">{store.city}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-border">
                {store.productCount !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Package className="w-4 h-4" />
                      <span>Товаров</span>
                    </div>
                    <span className="font-medium">{store.productCount}</span>
                  </div>
                )}
                {store.lowStockCount !== undefined && store.lowStockCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>Дефицит</span>
                    </div>
                    <span className="font-medium text-amber-600">{store.lowStockCount}</span>
                  </div>
                )}
                {store.expiringCount !== undefined && store.expiringCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-orange-600">
                      <Clock className="w-4 h-4" />
                      <span>Истекает срок</span>
                    </div>
                    <span className="font-medium text-orange-600">{store.expiringCount}</span>
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
