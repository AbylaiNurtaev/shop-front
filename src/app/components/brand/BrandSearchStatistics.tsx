import React, { useState, useEffect } from 'react';
import { 
  Search, 
  TrendingUp, 
  Loader2,
  CheckCircle2,
  XCircle,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface ApiSearchStatistics {
  brand?: {
    id: string;
    name: string;
  };
  period?: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalSearches: number;
    foundSearches: number;
    notFoundSearches: number;
    clarificationNeeded?: number;
    uniqueProductsFound?: number;
    brandSearchCount?: number;
  };
  topProducts: Array<{
    productId: string;
    productName: string;
    searchCount: number;
    lastSearched: string;
    topQueries: string[];
  }>;
}

interface SearchStatistics {
  summary: {
    totalSearches: number;
    found: number;
    notFound: number;
  };
  topProducts: Array<{
    productId: string;
    productName: string;
    searchCount: number;
    lastSearched: string;
    popularQueries: Array<{
      query: string;
      count: number;
    }>;
  }>;
}

export function BrandSearchStatistics() {
  const [statistics, setStatistics] = useState<SearchStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState(20);
  const [showFilters, setShowFilters] = useState(false);

  // Устанавливаем даты по умолчанию (последние 30 дней, конечная дата - завтра)
  useEffect(() => {
    const end = new Date();
    end.setDate(end.getDate() + 1); // Завтрашний день
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Загружаем статистику при изменении фильтров
  useEffect(() => {
    if (startDate && endDate) {
      fetchStatistics();
    }
  }, [startDate, endDate, limit]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        limit: limit.toString(),
      });

      const response = await api.get<ApiSearchStatistics>(`/brands/me/search-statistics?${params}`);
      const data = response.data || {};
      
      // Преобразуем данные из формата API в формат компонента
      const summary = data.summary || {
        totalSearches: 0,
        foundSearches: 0,
        notFoundSearches: 0,
      };

      // Преобразуем topProducts: topQueries (массив строк) -> popularQueries (массив объектов)
      const topProducts = (data.topProducts || []).map((product) => {
        // Преобразуем массив строк topQueries в массив объектов с query и count
        // Для простоты считаем, что каждый запрос встречается 1 раз
        // Если нужна реальная статистика, API должно возвращать объекты
        const popularQueries = (product.topQueries || []).map((query) => ({
          query,
          count: 1, // По умолчанию 1, так как API не возвращает count для каждого запроса
        }));

        return {
          productId: product.productId,
          productName: product.productName,
          searchCount: product.searchCount,
          lastSearched: product.lastSearched,
          popularQueries,
        };
      });

      setStatistics({
        summary: {
          totalSearches: summary.totalSearches || 0,
          found: summary.foundSearches || 0,
          notFound: summary.notFoundSearches || 0,
        },
        topProducts,
      });
    } catch (error: any) {
      console.error('Ошибка загрузки статистики поиска', error);
      toast.error(error?.response?.data?.message || 'Не удалось загрузить статистику поиска');
      // Устанавливаем пустые данные при ошибке
      setStatistics({
        summary: {
          totalSearches: 0,
          found: 0,
          notFound: 0,
        },
        topProducts: [],
      });
    } finally {
      setLoading(false);
    }
  };


  if (loading && !statistics) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Mobile Header */}
      <div className="md:hidden bg-card border-b border-border sticky top-0 z-20 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Статистика поиска</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Фильтры</span>
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Статистика поиска</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Аналитика поисковых запросов по вашим товарам
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={`px-4 md:px-0 mb-4 md:mb-6 transition-all duration-300 ${showFilters ? 'block' : 'hidden md:block'}`}>
        <Card className="shadow-sm">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Filter className="w-4 h-4 md:w-5 md:h-5" />
              Фильтры
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
              <div>
                <Label htmlFor="startDate" className="text-xs md:text-sm font-medium">Начальная дата</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1.5 h-10 md:h-9 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-xs md:text-sm font-medium">Конечная дата</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1.5 h-10 md:h-9 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="limit" className="text-xs md:text-sm font-medium">Лимит товаров</Label>
                <Input
                  id="limit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="mt-1.5 h-10 md:h-9 text-sm"
                />
              </div>
              <div className="flex items-end md:items-end">
                <Button 
                  onClick={fetchStatistics} 
                  className="w-full h-10 md:h-9 text-sm font-medium"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Поиск
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!statistics ? (
        <div className="px-4 md:px-0">
          <Card>
            <CardContent className="py-12 md:py-16 text-center">
              <p className="text-sm md:text-base text-muted-foreground">Нет данных для отображения</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Summary Statistics */}
          <div className="px-4 md:px-0 mt-4 md:mt-0 mb-4 md:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 md:px-6 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium">Всего поисков</CardTitle>
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                    <Search className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                  <div className="text-2xl md:text-3xl font-bold">{statistics.summary?.totalSearches ?? 0}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    За выбранный период
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 md:px-6 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium">Найдено</CardTitle>
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
                    <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                  <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
                    {statistics.summary?.found ?? 0}
                  </div>
                  {statistics.summary?.totalSearches && statistics.summary.totalSearches > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {Math.round((statistics.summary.found / statistics.summary.totalSearches) * 100)}% успешных поисков
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 md:px-6 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium">Не найдено</CardTitle>
                  <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950">
                    <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                  <div className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">
                    {statistics.summary?.notFound ?? 0}
                  </div>
                  {statistics.summary?.totalSearches && statistics.summary.totalSearches > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {Math.round((statistics.summary.notFound / statistics.summary.totalSearches) * 100)}% неудачных поисков
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Top Products */}
          <div className="px-4 md:px-0">
            <Card className="mb-6 shadow-sm">
              <CardHeader className="px-4 pt-4 md:px-6 md:pt-6 pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  Топ товаров по поискам
                </CardTitle>
                <CardDescription className="text-xs md:text-sm mt-1.5">
                  Товары, которые ищут чаще всего
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                {!statistics.topProducts || statistics.topProducts.length === 0 ? (
                  <div className="py-8 md:py-12 text-center text-muted-foreground text-sm">
                    Нет данных о поисках товаров
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {statistics.topProducts.map((product, index) => (
                      <div
                        key={product.productId}
                        className="border border-border rounded-xl p-4 md:p-5 hover:bg-muted/50 hover:shadow-md transition-all duration-200 shadow-sm bg-card"
                      >
                        <div className="flex items-start gap-3 md:gap-4 mb-3">
                          <div className={`flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                            index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                            'bg-primary/10 text-primary'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base md:text-lg mb-2.5 leading-tight text-foreground">
                              {product.productName}
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2.5 md:gap-4 text-xs md:text-sm">
                              <span className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-md">
                                <Search className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                                <span className="font-semibold text-foreground">{product.searchCount}</span>
                                <span>поисков</span>
                              </span>
                              {product.lastSearched && (
                                <span className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-md">
                                  <span>
                                    Последний: {new Date(product.lastSearched).toLocaleDateString('ru-RU', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {product.popularQueries && product.popularQueries.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-xs md:text-sm font-semibold mb-2.5 text-foreground">
                              Популярные запросы:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {product.popularQueries.map((query, qIndex) => (
                                <span
                                  key={qIndex}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs font-medium transition-colors border border-border/50"
                                >
                                  <Search className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                                  <span className="truncate max-w-[200px] md:max-w-none">{query.query}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </>
      )}
    </div>
  );
}
