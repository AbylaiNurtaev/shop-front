import React from 'react';
import { BarChart3, Store, Package, TrendingUp, Users } from 'lucide-react';

export function Analytics() {
  // TODO: Заменить на реальные данные из API
  const stats = {
    storesCount: 0,
    salesRepsCount: 0,
    totalProducts: 0,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Аналитика</h1>

      {/* Основные метрики */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Store className="w-6 h-6 text-primary" />
            <h3 className="font-semibold">Количество магазинов</h3>
          </div>
          <p className="text-3xl font-bold">{stats.storesCount}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-primary" />
            <h3 className="font-semibold">Торговые представители</h3>
          </div>
          <p className="text-3xl font-bold">{stats.salesRepsCount}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-6 h-6 text-primary" />
            <h3 className="font-semibold">Всего товаров</h3>
          </div>
          <p className="text-3xl font-bold">{stats.totalProducts}</p>
        </div>
      </div>

      {/* Разделы аналитики */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Остатки по магазинам
          </h3>
          <p className="text-sm text-muted-foreground">Детальная информация об остатках товаров в каждом магазине</p>
          <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm">
            Просмотреть
          </button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Оборот
          </h3>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">• По магазину</p>
            <p className="text-muted-foreground">• По бренду</p>
            <p className="text-muted-foreground">• По товару</p>
          </div>
          <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm">
            Просмотреть
          </button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            KPI торговых представителей
          </h3>
          <p className="text-sm text-muted-foreground">Показатели эффективности работы торговых представителей</p>
          <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm">
            Просмотреть
          </button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Store className="w-5 h-5" />
            Закрепление ТП за магазинами
          </h3>
          <p className="text-sm text-muted-foreground">Управление привязкой торговых представителей к магазинам</p>
          <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm">
            Настроить
          </button>
        </div>
      </div>
    </div>
  );
}
