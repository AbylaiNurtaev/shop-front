import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Store, Package, TrendingUp, Users, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

interface SummaryStats {
  storesCount: number;
  salesRepresentativesCount: number;
  totalProducts: number;
}

interface StockItem {
  offerId: string;
  productId: string;
  productName: string;
  sku: string;
  brandName: string;
  quantity: number;
  price: number;
  currency: string;
  value: number;
  isAvailable: boolean;
}

interface SalesRepresentative {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
}

interface StockByStore {
  storeId: string;
  storeName: string;
  storeAddress: string;
  salesRepresentatives: SalesRepresentative[];
  salesRepresentativesCount: number;
  items: StockItem[];
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
}

interface StockBySalesRep {
  salesRepId: string;
  salesRepName: string;
  salesRepEmail: string;
  stores: StockByStore[];
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
}

interface TurnoverStoreItem {
  storeId: string;
  storeName: string;
  storeAddress: string;
  totalRevenue: number;
  totalSales: number;
  totalQuantity: number;
}

interface TurnoverBrandItem {
  brandId: string;
  brandName: string;
  totalRevenue: number;
  totalSales: number;
  totalQuantity: number;
}

interface TurnoverProductItem {
  productId: string;
  productName: string;
  sku: string;
  brandName: string;
  totalRevenue: number;
  totalSales: number;
  totalQuantity: number;
}

interface TurnoverData {
  type: 'store' | 'brand' | 'product';
  period: {
    startDate: string;
    endDate: string;
  };
  items: TurnoverStoreItem[] | TurnoverBrandItem[] | TurnoverProductItem[];
  total: number;
  summary: {
    totalRevenue: number;
    totalSales: number;
    totalQuantity: number;
  };
}

interface SalesRepPlan {
  id: string;
  targetAmount: number;
  targetQuantity: number;
  period: string;
}

interface SalesRepKPI {
  salesRepresentativeId: string;
  salesRepresentativeName: string;
  email: string;
  storesCount: number;
  totalRevenue: number;
  totalSales: number;
  totalQuantity: number;
  plan: SalesRepPlan | null;
  planCompletionPercent: number | null;
}

interface KPIData {
  period: {
    startDate: string;
    endDate: string;
  };
  items: SalesRepKPI[];
  total: number;
}

export function Analytics() {
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  const [stockData, setStockData] = useState<StockByStore[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  // Группировка данных по торговым представителям
  const stockBySalesRep = useMemo(() => {
    const salesRepMap = new Map<string, StockBySalesRep>();

    stockData.forEach((store) => {
      if (store.salesRepresentatives && store.salesRepresentatives.length > 0) {
        store.salesRepresentatives.forEach((salesRep) => {
          const repId = salesRep.id;
          if (!salesRepMap.has(repId)) {
            salesRepMap.set(repId, {
              salesRepId: repId,
              salesRepName: `${salesRep.firstName}${salesRep.lastName ? ' ' + salesRep.lastName : ''}`,
              salesRepEmail: salesRep.email,
              stores: [],
              totalItems: 0,
              totalQuantity: 0,
              totalValue: 0,
            });
          }

          const repData = salesRepMap.get(repId)!;
          repData.stores.push(store);
          repData.totalItems += store.totalItems;
          repData.totalQuantity += store.totalQuantity;
          repData.totalValue += store.totalValue;
        });
      }
    });

    return Array.from(salesRepMap.values());
  }, [stockData]);

  const [turnoverData, setTurnoverData] = useState<TurnoverData | null>(null);
  const [isLoadingTurnover, setIsLoadingTurnover] = useState(false);
  const [turnoverType, setTurnoverType] = useState<'store' | 'brand' | 'product'>('store');
  const [turnoverStartDate, setTurnoverStartDate] = useState<string>('');
  const [turnoverEndDate, setTurnoverEndDate] = useState<string>('');

  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [isLoadingKPI, setIsLoadingKPI] = useState(false);
  const [kpiPeriod, setKpiPeriod] = useState<'month' | 'quarter' | 'year' | 'custom'>('month');
  const [kpiStartDate, setKpiStartDate] = useState<string>('');
  const [kpiEndDate, setKpiEndDate] = useState<string>('');

  useEffect(() => {
    loadSummary();
    loadStockByStores();
    loadTurnover();
    loadKPI();
  }, []);

  // Устанавливаем даты по умолчанию для периода
  useEffect(() => {
    if (kpiPeriod === 'month') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setKpiStartDate(firstDay.toISOString().split('T')[0]);
      setKpiEndDate(now.toISOString().split('T')[0]);
    } else if (kpiPeriod === 'quarter') {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      const firstDay = new Date(now.getFullYear(), quarter * 3, 1);
      setKpiStartDate(firstDay.toISOString().split('T')[0]);
      setKpiEndDate(now.toISOString().split('T')[0]);
    } else if (kpiPeriod === 'year') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), 0, 1);
      setKpiStartDate(firstDay.toISOString().split('T')[0]);
      setKpiEndDate(now.toISOString().split('T')[0]);
    }
  }, [kpiPeriod]);

  const loadSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const response = await api.get<SummaryStats>('/distributors/me/analytics/summary');
      setSummaryStats(response.data);
    } catch (error: any) {
      console.error('Ошибка загрузки статистики', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить статистику';
      toast.error(errorMessage);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const loadStockByStores = async () => {
    setIsLoadingStock(true);
    try {
      const response = await api.get<{ items?: StockByStore[]; total?: number }>('/distributors/me/analytics/stock-by-stores');
      const items = response.data?.items || [];
      setStockData(Array.isArray(items) ? items : []);
    } catch (error: any) {
      console.error('Ошибка загрузки остатков', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить остатки по магазинам';
      toast.error(errorMessage);
    } finally {
      setIsLoadingStock(false);
    }
  };

  const loadTurnover = async () => {
    setIsLoadingTurnover(true);
    try {
      const params: Record<string, string> = {
        type: turnoverType,
      };
      if (turnoverStartDate) {
        const start = new Date(turnoverStartDate);
        start.setHours(0, 0, 0, 0);
        params.startDate = start.toISOString();
      }
      if (turnoverEndDate) {
        const end = new Date(turnoverEndDate);
        end.setHours(23, 59, 59, 999);
        params.endDate = end.toISOString();
      }
      const response = await api.get<TurnoverData>('/distributors/me/analytics/turnover', { params });
      setTurnoverData(response.data);
    } catch (error: any) {
      console.error('Ошибка загрузки оборота', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить данные оборота';
      toast.error(errorMessage);
    } finally {
      setIsLoadingTurnover(false);
    }
  };

  const loadKPI = async () => {
    setIsLoadingKPI(true);
    try {
      const params: Record<string, string> = {};
      if (kpiPeriod === 'custom') {
        if (kpiStartDate) {
          const start = new Date(kpiStartDate);
          start.setHours(0, 0, 0, 0);
          params.startDate = start.toISOString();
        }
        if (kpiEndDate) {
          const end = new Date(kpiEndDate);
          end.setHours(23, 59, 59, 999);
          params.endDate = end.toISOString();
        }
      } else {
        params.period = kpiPeriod;
      }
      const response = await api.get<KPIData>('/distributors/me/analytics/sales-rep-kpi', { params });
      setKpiData(response.data);
    } catch (error: any) {
      console.error('Ошибка загрузки KPI', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить KPI торговых представителей';
      toast.error(errorMessage);
    } finally {
      setIsLoadingKPI(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'KZT') => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getItemName = (item: TurnoverStoreItem | TurnoverBrandItem | TurnoverProductItem): string => {
    if ('storeName' in item) return (item as TurnoverStoreItem).storeName;
    if ('brandName' in item && !('productName' in item)) return (item as TurnoverBrandItem).brandName;
    if ('productName' in item) return (item as TurnoverProductItem).productName;
    return '';
  };

  const getItemId = (item: TurnoverStoreItem | TurnoverBrandItem | TurnoverProductItem): string => {
    if ('storeId' in item) return (item as TurnoverStoreItem).storeId;
    if ('brandId' in item) return (item as TurnoverBrandItem).brandId;
    if ('productId' in item) return (item as TurnoverProductItem).productId;
    return '';
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <h1 className="text-xl md:text-2xl font-semibold">Аналитика</h1>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-card border border-border rounded-lg p-4 md:p-4">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <Store className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-sm md:text-base">Количество магазинов</h3>
          </div>
          {isLoadingSummary ? (
            <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-2xl md:text-3xl font-bold">{summaryStats?.storesCount ?? 0}</p>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-4 md:p-4">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-sm md:text-base">Торговые представители</h3>
          </div>
          {isLoadingSummary ? (
            <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-2xl md:text-3xl font-bold">{summaryStats?.salesRepresentativesCount ?? 0}</p>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-4 md:p-4 sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <Package className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-sm md:text-base">Всего товаров</h3>
          </div>
          {isLoadingSummary ? (
            <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-2xl md:text-3xl font-bold">{summaryStats?.totalProducts ?? 0}</p>
          )}
        </div>
      </div>

      {/* Остатки по торговым представителям */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-6">
        <h3 className="font-semibold text-base md:text-lg mb-3 md:mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span>Остатки по торговым представителям</span>
        </h3>
        {isLoadingStock ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stockBySalesRep.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 md:py-12 text-sm md:text-base">Нет данных об остатках</p>
        ) : (
          <Accordion type="single" collapsible className="space-y-3 md:space-y-4">
            {stockBySalesRep.map((salesRep) => (
              <AccordionItem key={salesRep.salesRepId} value={salesRep.salesRepId} className="border rounded-lg px-3 md:px-4">
                <AccordionTrigger className="hover:no-underline py-3 md:py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full pr-2 md:pr-4 gap-2 sm:gap-0">
                    <div className="flex items-start sm:items-center gap-2 md:gap-3 flex-1 min-w-0">
                      <Users className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
                      <div className="text-left min-w-0 flex-1">
                        <h4 className="font-semibold text-base md:text-lg truncate">{salesRep.salesRepName}</h4>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">{salesRep.salesRepEmail}</p>
                        <p className="text-xs text-muted-foreground mt-1">Магазинов: {salesRep.stores.length}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="text-xs md:text-sm text-muted-foreground">Позиций: {salesRep.totalItems}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Всего товаров: {salesRep.totalQuantity}</p>
                      <p className="text-base md:text-lg font-semibold mt-1">Стоимость: {formatCurrency(salesRep.totalValue)}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 md:space-y-6 pt-3 md:pt-4">
                    {salesRep.stores.map((store) => (
                      <div key={store.storeId} className="border rounded-lg p-3 md:p-4 bg-muted/30">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-0 mb-3 md:mb-4">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-sm md:text-base mb-1">{store.storeName}</h5>
                            <p className="text-xs md:text-sm text-muted-foreground break-words">{store.storeAddress}</p>
                          </div>
                          <div className="text-left sm:text-right flex-shrink-0">
                            <p className="text-xs md:text-sm text-muted-foreground">Позиций: {store.totalItems}</p>
                            <p className="text-xs md:text-sm text-muted-foreground">Всего товаров: {store.totalQuantity}</p>
                            <p className="text-sm md:text-base font-semibold mt-1">Стоимость: {formatCurrency(store.totalValue)}</p>
                          </div>
                        </div>
                        <div className="overflow-x-auto -mx-3 md:mx-0">
                          <table className="w-full text-xs md:text-sm min-w-[600px]">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Товар</th>
                                <th className="text-left p-2">Бренд</th>
                                <th className="text-left p-2">Артикул</th>
                                <th className="text-right p-2">Количество</th>
                                <th className="text-right p-2">Цена</th>
                                <th className="text-right p-2">Стоимость</th>
                              </tr>
                            </thead>
                            <tbody>
                              {store.items && Array.isArray(store.items) ? (
                                store.items.map((item) => (
                                  <tr key={item.offerId} className="border-b">
                                    <td className="p-2 break-words">{item.productName}</td>
                                    <td className="p-2">{item.brandName}</td>
                                    <td className="p-2 font-mono text-xs">{item.sku}</td>
                                    <td className="text-right p-2">{item.quantity}</td>
                                    <td className="text-right p-2 whitespace-nowrap">{formatCurrency(item.price, item.currency)}</td>
                                    <td className="text-right p-2 font-semibold whitespace-nowrap">{formatCurrency(item.value, item.currency)}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={6} className="p-2 text-center text-muted-foreground text-xs md:text-sm">Нет товаров</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Оборот */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-6">
        <h3 className="font-semibold text-base md:text-lg mb-3 md:mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span>Оборот</span>
        </h3>
        <div className="mb-4 space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Тип</label>
              <select
                value={turnoverType}
                onChange={(e) => {
                  setTurnoverType(e.target.value as 'store' | 'brand' | 'product');
                }}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="store">По магазину</option>
                <option value="brand">По бренду</option>
                <option value="product">По товару</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Дата начала</label>
              <input
                type="date"
                value={turnoverStartDate}
                onChange={(e) => setTurnoverStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Дата окончания</label>
              <input
                type="date"
                value={turnoverEndDate}
                onChange={(e) => setTurnoverEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={loadTurnover}
                disabled={isLoadingTurnover}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoadingTurnover ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Применить'}
              </button>
            </div>
          </div>
        </div>
        {isLoadingTurnover ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !turnoverData ? (
          <p className="text-center text-muted-foreground py-12">Нет данных об обороте</p>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Выручка</p>
                <p className="text-2xl font-bold">{formatCurrency(turnoverData.summary.totalRevenue)}</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Количество продаж</p>
                <p className="text-2xl font-bold">{turnoverData.summary.totalSales}</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Количество товаров</p>
                <p className="text-2xl font-bold">{turnoverData.summary.totalQuantity}</p>
              </div>
            </div>
            {turnoverData.items && Array.isArray(turnoverData.items) && turnoverData.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Название</th>
                      {turnoverType === 'product' && <th className="text-left p-2">Бренд</th>}
                      {turnoverType === 'product' && <th className="text-left p-2">Артикул</th>}
                      {turnoverType === 'store' && <th className="text-left p-2">Адрес</th>}
                      <th className="text-right p-2">Выручка</th>
                      <th className="text-right p-2">Продажи</th>
                      <th className="text-right p-2">Товары</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turnoverData.items.map((item) => (
                      <tr key={getItemId(item)} className="border-b">
                        <td className="p-2">{getItemName(item)}</td>
                        {turnoverType === 'product' && 'brandName' in item && (
                          <>
                            <td className="p-2">{item.brandName}</td>
                            <td className="p-2">{item.sku}</td>
                          </>
                        )}
                        {turnoverType === 'store' && 'storeAddress' in item && (
                          <td className="p-2">{item.storeAddress}</td>
                        )}
                        <td className="text-right p-2 font-semibold">{formatCurrency(item.totalRevenue)}</td>
                        <td className="text-right p-2">{item.totalSales}</td>
                        <td className="text-right p-2">{item.totalQuantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI торговых представителей */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          KPI торговых представителей
        </h3>
        <div className="mb-4 space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Период</label>
              <select
                value={kpiPeriod}
                onChange={(e) => {
                  setKpiPeriod(e.target.value as 'month' | 'quarter' | 'year' | 'custom');
                }}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="month">Месяц</option>
                <option value="quarter">Квартал</option>
                <option value="year">Год</option>
                <option value="custom">Произвольный период</option>
              </select>
            </div>
            {kpiPeriod === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Дата начала</label>
                  <input
                    type="date"
                    value={kpiStartDate}
                    onChange={(e) => setKpiStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Дата окончания</label>
                  <input
                    type="date"
                    value={kpiEndDate}
                    onChange={(e) => setKpiEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </>
            )}
            <div className="flex items-end">
              <button
                onClick={loadKPI}
                disabled={isLoadingKPI}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoadingKPI ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Применить'}
              </button>
            </div>
          </div>
        </div>
        {isLoadingKPI ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !kpiData || kpiData.items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Нет данных о KPI</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Торговый представитель</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-right p-2">Выручка</th>
                  <th className="text-right p-2">Продажи</th>
                  <th className="text-right p-2">Товары продано</th>
                  <th className="text-right p-2">Магазинов</th>
                  {kpiData.items.some(item => item.planCompletionPercent !== undefined && item.planCompletionPercent !== null) && (
                    <th className="text-right p-2">Выполнение плана</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {kpiData.items.map((rep) => (
                  <tr key={rep.salesRepresentativeId} className="border-b">
                    <td className="p-2 font-medium">{rep.salesRepresentativeName}</td>
                    <td className="p-2 text-muted-foreground">{rep.email}</td>
                    <td className="text-right p-2 font-semibold">{formatCurrency(rep.totalRevenue)}</td>
                    <td className="text-right p-2">{rep.totalSales}</td>
                    <td className="text-right p-2">{rep.totalQuantity}</td>
                    <td className="text-right p-2">{rep.storesCount}</td>
                    {rep.planCompletionPercent !== undefined && rep.planCompletionPercent !== null && (
                      <td className="text-right p-2">
                        <span className={`font-semibold ${rep.planCompletionPercent >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                          {rep.planCompletionPercent.toFixed(1)}%
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
