import React, { useState, useEffect } from 'react';
import { Store, MapPin, Phone, Mail, Package, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface Store {
  id: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  productCount?: number;
}

export function SalesRepStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ items?: Store[] }>('/sales-reps/stores');
      const items = response.data?.items || response.data || [];
      setStores(Array.isArray(items) ? items : []);
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
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Store className="w-6 h-6" />
            Магазины
          </h1>
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
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => (
            <div
              key={store.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedStore(store)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Store className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1">{store.name}</h3>
                  {store.address && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{store.address}</span>
                    </div>
                  )}
                  {store.city && (
                    <p className="text-xs text-muted-foreground">{store.city}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-border">
                {store.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{store.phone}</span>
                  </div>
                )}
                {store.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{store.email}</span>
                  </div>
                )}
                {store.productCount !== undefined && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="w-4 h-4" />
                    <span>Товаров: {store.productCount}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно с деталями магазина */}
      {selectedStore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-semibold">{selectedStore.name}</h2>
              <button
                onClick={() => setSelectedStore(null)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedStore.address && (
                <div>
                  <div className="text-sm font-medium mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Адрес
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedStore.address}</p>
                </div>
              )}
              {selectedStore.city && (
                <div>
                  <div className="text-sm font-medium mb-1">Город</div>
                  <p className="text-sm text-muted-foreground">{selectedStore.city}</p>
                </div>
              )}
              {selectedStore.phone && (
                <div>
                  <div className="text-sm font-medium mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Телефон
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedStore.phone}</p>
                </div>
              )}
              {selectedStore.email && (
                <div>
                  <div className="text-sm font-medium mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedStore.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
