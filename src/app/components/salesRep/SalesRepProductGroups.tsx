import React, { useState, useEffect } from 'react';
import { Package, FolderTree, Loader2, TrendingUp } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface ProductGroup {
  id: string;
  name: string;
  description?: string;
  productCount: number;
  totalValue?: number;
  category?: string;
}

export function SalesRepProductGroups() {
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ items?: ProductGroup[] }>('/sales-reps/product-groups');
      console.log('GET /sales-reps/product-groups response', response.data);
      const items = response.data?.items || response.data || [];
      setGroups(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Ошибка загрузки групп товаров', error);
      toast.error('Не удалось загрузить группы товаров');
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
            <FolderTree className="w-6 h-6" />
            Мои группы товаров
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего групп: {groups.length}
          </p>
        </div>
        <button
          onClick={loadGroups}
          className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm font-medium"
        >
          Обновить
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <FolderTree className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет групп товаров</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1">{group.name}</h3>
                  {group.category && (
                    <p className="text-xs text-muted-foreground mb-2">{group.category}</p>
                  )}
                  {group.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="w-4 h-4" />
                    <span>Товаров</span>
                  </div>
                  <span className="font-medium">{group.productCount}</span>
                </div>
                {group.totalValue !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      <span>Общая стоимость</span>
                    </div>
                    <span className="font-medium">
                      {new Intl.NumberFormat('ru-RU', {
                        style: 'currency',
                        currency: 'KZT',
                        minimumFractionDigits: 0,
                      }).format(group.totalValue)}
                    </span>
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
