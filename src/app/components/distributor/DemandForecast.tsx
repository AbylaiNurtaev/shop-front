import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Calendar, RefreshCw, Loader2, TrendingDown, Minus, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';

interface ForecastPeriod {
  startDate: string;
  endDate: string;
  days: number;
}

interface ForecastFilters {
  productId: string | null;
  categoryId: string | null;
  brandId: string | null;
  storeId: string | null;
}

interface ForecastItem {
  productId?: string;
  productName?: string;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  forecastedQuantity: number;
  forecastedRevenue: number;
  dailyAverage: number;
  confidence: 'high' | 'medium' | 'low';
  trend: 'increasing' | 'stable' | 'decreasing';
  notes?: string;
}

interface ForecastSummary {
  totalForecastedQuantity: number;
  totalForecastedRevenue: number;
  averageDailyDemand: number;
}

interface ForecastResponse {
  success: boolean;
  forecast: {
    period: ForecastPeriod;
    history: ForecastPeriod;
    filters: ForecastFilters;
    products: ForecastItem[];
    categories: ForecastItem[];
    brands: ForecastItem[];
    summary: ForecastSummary;
  };
  timestamp: string;
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Store {
  id: string;
  name: string;
}

export function DemandForecast() {
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'brands'>('products');

  // Фильтры
  const [productId, setProductId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [brandId, setBrandId] = useState<string>('');
  const [storeId, setStoreId] = useState<string>('');
  const [periodDays, setPeriodDays] = useState<string>('30');
  const [historyDays, setHistoryDays] = useState<string>('90');

  // Списки для фильтров
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    loadFilterOptions();
    loadForecast();
  }, []);

  const loadFilterOptions = async () => {
    try {
      // Загрузка категорий
      const categoriesResponse = await api.get<{ items?: Category[] }>('/categories');
      const categoriesData = categoriesResponse.data?.items || categoriesResponse.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);

      // Загрузка брендов (если есть такой эндпоинт)
      try {
        const brandsResponse = await api.get<{ items?: Brand[] }>('/brands');
        const brandsData = brandsResponse.data?.items || brandsResponse.data || [];
        setBrands(Array.isArray(brandsData) ? brandsData : []);
      } catch (error) {
        console.log('Эндпоинт брендов недоступен');
      }

      // Загрузка магазинов
      try {
        const storesResponse = await api.get<{ items?: Store[] }>('/distributors/me/stores');
        const storesData = storesResponse.data?.items || storesResponse.data || [];
        setStores(Array.isArray(storesData) ? storesData : []);
      } catch (error) {
        console.log('Эндпоинт магазинов недоступен');
      }
    } catch (error) {
      console.error('Ошибка загрузки фильтров', error);
    }
  };

  const loadForecast = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {};

      if (productId.trim()) {
        params.productId = productId.trim();
      }
      if (categoryId.trim()) {
        params.categoryId = categoryId.trim();
      }
      if (brandId.trim()) {
        params.brandId = brandId.trim();
      }
      if (storeId.trim()) {
        params.storeId = storeId.trim();
      }
      if (periodDays.trim()) {
        const parsedPeriod = Number(periodDays);
        if (!Number.isNaN(parsedPeriod) && parsedPeriod > 0) {
          params.period = parsedPeriod;
        }
      }
      if (historyDays.trim()) {
        const parsedHistory = Number(historyDays);
        if (!Number.isNaN(parsedHistory) && parsedHistory > 0) {
          params.historyDays = parsedHistory;
        }
      }

      const response = await api.get<ForecastResponse>('/ai-assistant/demand-forecast', { params });
      setForecastData(response.data);
    } catch (error: any) {
      console.error('Ошибка загрузки прогноза', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить прогноз спроса';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setProductId('');
    setCategoryId('');
    setBrandId('');
    setStoreId('');
    setPeriodDays('30');
    setHistoryDays('90');
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getConfidenceLabel = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'Высокая';
      case 'medium':
        return 'Средняя';
      case 'low':
        return 'Низкая';
      default:
        return confidence;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'Рост';
      case 'decreasing':
        return 'Спад';
      case 'stable':
        return 'Стабильно';
      default:
        return trend;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const currentData = forecastData?.forecast
    ? activeTab === 'products'
      ? forecastData.forecast.products
      : activeTab === 'categories'
        ? forecastData.forecast.categories
        : forecastData.forecast.brands
    : [];

  return (
    <div className="space-y-4 p-4 md:p-0">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold">Прогноз спроса (AI)</h1>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Параметры прогноза
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="productId">ID товара</Label>
              <Input
                id="productId"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="product_123"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="categoryId">Категория</Label>
              <select
                id="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              >
                <option value="">Все категории</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="brandId">Бренд</Label>
              <select
                id="brandId"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              >
                <option value="">Все бренды</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="storeId">Магазин</Label>
              <select
                id="storeId"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              >
                <option value="">Все магазины</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="periodDays">Период прогноза (дней)</Label>
              <Input
                id="periodDays"
                type="number"
                min="1"
                value={periodDays}
                onChange={(e) => setPeriodDays(e.target.value)}
                placeholder="30"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="historyDays">История (дней)</Label>
              <Input
                id="historyDays"
                type="number"
                min="1"
                value={historyDays}
                onChange={(e) => setHistoryDays(e.target.value)}
                placeholder="90"
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadForecast} disabled={isLoading}>
              Применить фильтры
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              <X className="w-4 h-4 mr-2" />
              Очистить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Результаты */}
      {isLoading && !forecastData ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Загрузка прогноза...</span>
          </CardContent>
        </Card>
      ) : !forecastData ? (
        <Card>
          <CardContent className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Прогнозы спроса будут доступны после загрузки</p>
            <p className="text-sm text-muted-foreground mt-2">
              AI анализирует исторические данные и предсказывает спрос на товары
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Сводка */}
          <Card>
            <CardHeader>
              <CardTitle>Сводка прогноза</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Период прогноза</p>
                  <p className="text-lg font-semibold">
                    {formatDate(forecastData.forecast.period.startDate)} - {formatDate(forecastData.forecast.period.endDate)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {forecastData.forecast.period.days} дней
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Исторический период</p>
                  <p className="text-lg font-semibold">
                    {formatDate(forecastData.forecast.history.startDate)} - {formatDate(forecastData.forecast.history.endDate)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {forecastData.forecast.history.days} дней
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Общий прогноз</p>
                  <p className="text-lg font-semibold">
                    {formatNumber(forecastData.forecast.summary.totalForecastedQuantity)} шт.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(forecastData.forecast.summary.totalForecastedRevenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Табы с данными */}
          <Card>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <CardHeader>
                <TabsList>
                  <TabsTrigger value="products">
                    Товары ({forecastData.forecast.products.length})
                  </TabsTrigger>
                  <TabsTrigger value="categories">
                    Категории ({forecastData.forecast.categories.length})
                  </TabsTrigger>
                  <TabsTrigger value="brands">
                    Бренды ({forecastData.forecast.brands.length})
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="products" className="mt-4">
                  {currentData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Нет данных о товарах</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 text-sm font-medium">Товар</th>
                            <th className="text-right p-2 text-sm font-medium">Количество</th>
                            <th className="text-right p-2 text-sm font-medium">Выручка</th>
                            <th className="text-right p-2 text-sm font-medium">Средний/день</th>
                            <th className="text-center p-2 text-sm font-medium">Уверенность</th>
                            <th className="text-center p-2 text-sm font-medium">Тренд</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentData.map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-muted/50">
                              <td className="p-2">
                                <div>
                                  <p className="font-medium">{item.productName || '—'}</p>
                                  {item.notes && (
                                    <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                                  )}
                                </div>
                              </td>
                              <td className="p-2 text-right">
                                {formatNumber(item.forecastedQuantity)}
                              </td>
                              <td className="p-2 text-right">
                                {formatCurrency(item.forecastedRevenue)}
                              </td>
                              <td className="p-2 text-right">
                                {formatNumber(item.dailyAverage)}
                              </td>
                              <td className="p-2 text-center">
                                <Badge className={getConfidenceColor(item.confidence)}>
                                  {getConfidenceLabel(item.confidence)}
                                </Badge>
                              </td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getTrendIcon(item.trend)}
                                  <span className="text-sm">{getTrendLabel(item.trend)}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="categories" className="mt-4">
                  {currentData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Нет данных о категориях</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 text-sm font-medium">Категория</th>
                            <th className="text-right p-2 text-sm font-medium">Количество</th>
                            <th className="text-right p-2 text-sm font-medium">Выручка</th>
                            <th className="text-right p-2 text-sm font-medium">Средний/день</th>
                            <th className="text-center p-2 text-sm font-medium">Уверенность</th>
                            <th className="text-center p-2 text-sm font-medium">Тренд</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentData.map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-muted/50">
                              <td className="p-2">
                                <div>
                                  <p className="font-medium">{item.categoryName || '—'}</p>
                                  {item.notes && (
                                    <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                                  )}
                                </div>
                              </td>
                              <td className="p-2 text-right">
                                {formatNumber(item.forecastedQuantity)}
                              </td>
                              <td className="p-2 text-right">
                                {formatCurrency(item.forecastedRevenue)}
                              </td>
                              <td className="p-2 text-right">
                                {formatNumber(item.dailyAverage)}
                              </td>
                              <td className="p-2 text-center">
                                <Badge className={getConfidenceColor(item.confidence)}>
                                  {getConfidenceLabel(item.confidence)}
                                </Badge>
                              </td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getTrendIcon(item.trend)}
                                  <span className="text-sm">{getTrendLabel(item.trend)}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="brands" className="mt-4">
                  {currentData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Нет данных о брендах</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 text-sm font-medium">Бренд</th>
                            <th className="text-right p-2 text-sm font-medium">Количество</th>
                            <th className="text-right p-2 text-sm font-medium">Выручка</th>
                            <th className="text-right p-2 text-sm font-medium">Средний/день</th>
                            <th className="text-center p-2 text-sm font-medium">Уверенность</th>
                            <th className="text-center p-2 text-sm font-medium">Тренд</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentData.map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-muted/50">
                              <td className="p-2">
                                <div>
                                  <p className="font-medium">{item.brandName || '—'}</p>
                                  {item.notes && (
                                    <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                                  )}
                                </div>
                              </td>
                              <td className="p-2 text-right">
                                {formatNumber(item.forecastedQuantity)}
                              </td>
                              <td className="p-2 text-right">
                                {formatCurrency(item.forecastedRevenue)}
                              </td>
                              <td className="p-2 text-right">
                                {formatNumber(item.dailyAverage)}
                              </td>
                              <td className="p-2 text-center">
                                <Badge className={getConfidenceColor(item.confidence)}>
                                  {getConfidenceLabel(item.confidence)}
                                </Badge>
                              </td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getTrendIcon(item.trend)}
                                  <span className="text-sm">{getTrendLabel(item.trend)}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      )}
    </div>
  );
}
