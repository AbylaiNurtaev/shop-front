import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, Clock, Loader2, Store, Search } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface InventoryItem {
  id: string;
  productName: string;
  sku: string;
  storeName: string;
  storeId: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  status: 'low' | 'normal' | 'high';
  expiryDate?: string;
  daysUntilExpiry?: number;
}

type ApiInventoryItem = {
  id?: string;
  productId?: string;
  productName?: string;
  product?: {
    name?: string;
    sku?: string;
  };
  sku?: string;
  storeName?: string;
  storeId?: string;
  store?: {
    id?: string;
    name?: string;
  };
  currentStock?: number;
  stock?: number;
  quantity?: number;
  minStock?: number;
  maxStock?: number;
  threshold?: number;
  status?: 'low' | 'normal' | 'high';
  lowStock?: boolean;
  expiryDate?: string;
  daysUntilExpiry?: number;
};

export function SalesRepInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [threshold, setThreshold] = useState<string>('');

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchQuery, statusFilter, storeFilter]);

  useEffect(() => {
    loadInventory();
  }, [storeFilter, threshold]);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (storeFilter !== 'all') {
        params.storeId = storeFilter;
      }
      if (threshold.trim()) {
        const parsedThreshold = Number(threshold);
        if (!Number.isNaN(parsedThreshold)) {
          params.threshold = parsedThreshold;
        }
      }
      const response = await api.get<{ items?: ApiInventoryItem[] }>('/sales-reps/stock-control', { params });
      console.log('GET /sales-reps/stock-control response', response.data);
      const items = response.data?.items || response.data || [];
      const mappedItems = (Array.isArray(items) ? items : []).map((item) => {
        const productName = item.productName ?? item.product?.name ?? '—';
        const sku = item.sku ?? item.product?.sku ?? '—';
        const storeId = item.storeId ?? item.store?.id ?? '—';
        const storeName = item.storeName ?? item.store?.name ?? '—';
        const currentStock = item.currentStock ?? item.stock ?? item.quantity ?? 0;
        const minStock = item.minStock ?? item.threshold ?? 0;
        const maxStock = item.maxStock ?? 0;
        let status: InventoryItem['status'] =
          item.status ?? (item.lowStock ? 'low' : 'normal');

        if (!item.status) {
          if (currentStock < minStock) {
            status = 'low';
          } else if (maxStock > 0 && currentStock > maxStock) {
            status = 'high';
          }
        }

        return {
          id: item.id ?? `${storeId}-${sku}-${productName}`,
          productName,
          sku,
          storeName,
          storeId,
          currentStock,
          minStock,
          maxStock,
          status,
          expiryDate: item.expiryDate,
          daysUntilExpiry: item.daysUntilExpiry,
        } as InventoryItem;
      });
      setInventory(mappedItems);
    } catch (error) {
      console.error('Ошибка загрузки остатков', error);
      toast.error('Не удалось загрузить остатки');
    } finally {
      setIsLoading(false);
    }
  };

  const filterInventory = () => {
    let filtered = [...inventory];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.productName.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          item.storeName.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    if (storeFilter !== 'all') {
      filtered = filtered.filter((item) => item.storeId === storeFilter);
    }

    setFilteredInventory(filtered);
  };

  const stores = Array.from(new Set(inventory.map((item) => ({ id: item.storeId, name: item.storeName }))))
    .filter((store, index, self) => self.findIndex((s) => s.id === store.id) === index);

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
            Контроль остатков
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего позиций: {filteredInventory.length}
          </p>
        </div>
        <button
          onClick={loadInventory}
          className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm font-medium self-start sm:self-auto"
        >
          Обновить
        </button>
      </div>

      {/* Фильтры */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по товару, SKU или магазину..."
            className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 md:px-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        >
          <option value="all">Все статусы</option>
          <option value="low">Дефицит</option>
          <option value="normal">Норма</option>
          <option value="high">Избыток</option>
        </select>
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="px-3 md:px-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        >
          <option value="all">Все магазины</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          placeholder="Порог"
          className="px-3 md:px-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        />
      </div>

      {filteredInventory.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {inventory.length === 0 ? 'Нет данных об остатках' : 'Ничего не найдено'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[800px]">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Товар</th>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">SKU</th>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Магазин</th>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Остаток</th>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Мин/Макс</th>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Статус</th>
                  <th className="text-left px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium">Срок годности</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 md:px-4 py-2 md:py-3 text-sm md:text-base font-medium">{item.productName}</td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-muted-foreground font-mono">{item.sku}</td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm">{item.storeName}</td>
                    <td className="px-3 md:px-4 py-2 md:py-3">
                      <span className="font-medium text-sm md:text-base">{item.currentStock}</span>
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-muted-foreground">
                      {item.minStock} / {item.maxStock}
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          item.status === 'low'
                            ? 'bg-red-100 text-red-700'
                            : item.status === 'high'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {item.status === 'low' && <AlertCircle className="w-3 h-3" />}
                        {item.status === 'low' ? 'Дефицит' : item.status === 'high' ? 'Избыток' : 'Норма'}
                      </span>
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                      {item.expiryDate ? (
                        <div className="flex items-center gap-1">
                          {item.daysUntilExpiry !== undefined && item.daysUntilExpiry < 7 && (
                            <Clock className="w-4 h-4 text-orange-600" />
                          )}
                          <span
                            className={
                              item.daysUntilExpiry !== undefined && item.daysUntilExpiry < 7
                                ? 'text-orange-600 font-medium'
                                : ''
                            }
                          >
                            {new Date(item.expiryDate).toLocaleDateString('ru-RU')}
                            {item.daysUntilExpiry !== undefined && (
                              <span className="text-muted-foreground ml-1">
                                ({item.daysUntilExpiry} дн.)
                              </span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
