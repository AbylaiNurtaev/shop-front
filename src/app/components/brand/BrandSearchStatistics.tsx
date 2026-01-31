import React, { useState, useEffect } from 'react';
import { 
  Search, 
  TrendingUp, 
  Loader2,
  CheckCircle2,
  XCircle,
  Filter
} from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

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
    foundCount: number;
    notFoundCount: number;
    popularQueries: Array<{
      query: string;
      count: number;
    }>;
  }>;
  recentSearches: Array<{
    query: string;
    productId?: string;
    productName?: string;
    found: boolean;
    timestamp: string;
  }>;
}

export function BrandSearchStatistics() {
  const [statistics, setStatistics] = useState<SearchStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState(20);

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

      const response = await api.get<SearchStatistics>(`/brands/me/search-statistics?${params}`);
      // Обеспечиваем, что все необходимые поля существуют
      const data = response.data || {};
      setStatistics({
        summary: data.summary || {
          totalSearches: 0,
          found: 0,
          notFound: 0,
        },
        topProducts: data.topProducts || [],
        recentSearches: data.recentSearches || [],
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
        recentSearches: [],
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
      <div className="md:hidden bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold">Статистика поиска</h1>
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
      <div className="px-4 md:px-0 mb-4 md:mb-6">
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Filter className="w-4 h-4 md:w-5 md:h-5" />
              Фильтры
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
              <div>
                <Label htmlFor="startDate" className="text-xs md:text-sm">Начальная дата</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1.5 h-10 md:h-9 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-xs md:text-sm">Конечная дата</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1.5 h-10 md:h-9 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="limit" className="text-xs md:text-sm">Лимит товаров</Label>
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
                <Button onClick={fetchStatistics} className="w-full h-10 md:h-9 text-sm font-medium">
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
          <div className="px-4 md:px-0 mb-4 md:mb-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 md:px-6 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium">Всего поисков</CardTitle>
                  <Search className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                  <div className="text-xl md:text-2xl font-bold">{statistics.summary?.totalSearches ?? 0}</div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    За выбранный период
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 md:px-6 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium">Найдено</CardTitle>
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                </CardHeader>
                <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                  <div className="text-xl md:text-2xl font-bold text-green-600">
                    {statistics.summary?.found ?? 0}
                  </div>
                  {statistics.summary?.totalSearches && statistics.summary.totalSearches > 0 && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {Math.round((statistics.summary.found / statistics.summary.totalSearches) * 100)}% успешных поисков
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 md:px-6 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium">Не найдено</CardTitle>
                  <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                </CardHeader>
                <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                  <div className="text-xl md:text-2xl font-bold text-red-600">
                    {statistics.summary?.notFound ?? 0}
                  </div>
                  {statistics.summary?.totalSearches && statistics.summary.totalSearches > 0 && (
                    <p className="text-xs text-muted-foreground mt-1.5">
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
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                  Топ товаров по поискам
                </CardTitle>
                <CardDescription className="text-xs md:text-sm mt-1">
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
                        className="border border-border rounded-xl p-3 md:p-4 hover:bg-muted/50 transition-colors shadow-sm"
                      >
                        <div className="flex items-start gap-2.5 md:gap-3 mb-2.5 md:mb-3">
                          <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs md:text-sm font-semibold text-primary">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm md:text-base mb-2 leading-tight">{product.productName}</h3>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 md:gap-4 text-xs md:text-sm">
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Search className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                                <span className="font-medium">{product.searchCount}</span> поисков
                              </span>
                              <span className="flex items-center gap-1.5 text-green-600">
                                <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                                <span className="font-medium">{product.foundCount}</span> найдено
                              </span>
                              <span className="flex items-center gap-1.5 text-red-600">
                                <XCircle className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                                <span className="font-medium">{product.notFoundCount}</span> не найдено
                              </span>
                            </div>
                          </div>
                        </div>

                        {product.popularQueries && product.popularQueries.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs md:text-sm font-medium mb-2 text-muted-foreground">
                              Популярные запросы:
                            </p>
                            <div className="flex flex-wrap gap-1.5 md:gap-2">
                              {product.popularQueries.map((query, qIndex) => (
                                <span
                                  key={qIndex}
                                  className="inline-flex items-center gap-1 px-2 md:px-2.5 py-1 bg-muted rounded-md text-xs"
                                >
                                  <Search className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate max-w-[150px] md:max-w-none">{query.query}</span>
                                  <span className="text-muted-foreground flex-shrink-0">({query.count})</span>
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
