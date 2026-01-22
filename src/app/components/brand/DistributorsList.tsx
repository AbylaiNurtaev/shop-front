import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Store, Package, Send, Loader2, Search, Filter, Mail } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface Distributor {
  _id?: string;
  id: string;
  name: string;
  email?: string;
  country: string;
  city: string;
  address?: string;
  location?: any;
  description?: string;
  photos?: string[];
  createdAt?: string;
  updatedAt?: string;
  activeStoresCount?: number;
  categories?: string[];
}

interface DistributorRequest {
  id: string;
  brandId: string;
  distributorId: string;
  brandName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export function DistributorsList() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<DistributorRequest[]>([]);
  const [requestTimers, setRequestTimers] = useState<{ [key: string]: number }>({});

  // Фильтры
  const [filters, setFilters] = useState({
    country: '',
    city: '',
    hasActiveStores: false,
  });

  const countries = [
    'Россия',
    'Казахстан',
    'Беларусь',
    'Украина',
    'Другая',
  ];

  const kazakhstanCities = [
    'Алматы',
    'Астана',
    'Шымкент',
    'Караганда',
    'Актобе',
    'Тараз',
    'Павлодар',
    'Усть-Каменогорск',
    'Семей',
    'Уральск',
    'Костанай',
    'Петропавловск',
    'Кызылорда',
    'Атырау',
    'Актау',
  ];

  const russiaCities = [
    'Москва',
    'Санкт-Петербург',
    'Новосибирск',
    'Екатеринбург',
    'Казань',
    'Нижний Новгород',
    'Челябинск',
    'Самара',
    'Омск',
    'Ростов-на-Дону',
  ];

  const getCitiesForCountry = (country: string) => {
    if (country === 'Казахстан') return kazakhstanCities;
    if (country === 'Россия') return russiaCities;
    return [];
  };

  useEffect(() => {
    loadDistributors();
    loadPendingRequests();
    loadRequestTimers();

    // Обновление таймеров каждую секунду
    const interval = setInterval(() => {
      updateRequestTimers();
    }, 1000);

    return () => clearInterval(interval);
  }, [filters]);

  const loadRequestTimers = () => {
    try {
      const stored = localStorage.getItem('distributorRequestTimers');
      if (stored) {
        const timers = JSON.parse(stored);
        const now = Date.now();
        const validTimers: { [key: string]: number } = {};

        // Фильтруем только актуальные таймеры (меньше часа)
        Object.keys(timers).forEach((distributorId) => {
          const timeLeft = timers[distributorId] - now;
          if (timeLeft > 0) {
            validTimers[distributorId] = Math.floor(timeLeft / 1000); // в секундах
          }
        });

        setRequestTimers(validTimers);
        if (Object.keys(validTimers).length !== Object.keys(timers).length) {
          // Обновляем localStorage, удаляя истекшие таймеры
          const updatedTimers: { [key: string]: number } = {};
          Object.keys(timers).forEach((distributorId) => {
            if (validTimers[distributorId]) {
              updatedTimers[distributorId] = timers[distributorId];
            }
          });
          localStorage.setItem('distributorRequestTimers', JSON.stringify(updatedTimers));
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки таймеров', error);
    }
  };

  const updateRequestTimers = () => {
    try {
      const stored = localStorage.getItem('distributorRequestTimers');
      if (stored) {
        const timers = JSON.parse(stored);
        const now = Date.now();
        const updatedTimers: { [key: string]: number } = {};

        Object.keys(timers).forEach((distributorId) => {
          const timeLeft = timers[distributorId] - now;
          if (timeLeft > 0) {
            updatedTimers[distributorId] = Math.floor(timeLeft / 1000); // в секундах
          }
        });

        setRequestTimers(updatedTimers);

        // Удаляем истекшие таймеры из localStorage
        if (Object.keys(updatedTimers).length !== Object.keys(timers).length) {
          const validTimers: { [key: string]: number } = {};
          Object.keys(timers).forEach((distributorId) => {
            if (updatedTimers[distributorId]) {
              validTimers[distributorId] = timers[distributorId];
            }
          });
          localStorage.setItem('distributorRequestTimers', JSON.stringify(validTimers));
        }
      }
    } catch (error) {
      console.error('Ошибка обновления таймеров', error);
    }
  };

  const formatTimeLeft = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}ч ${minutes}м ${secs}с`;
    }
    return `${minutes}м ${secs}с`;
  };

  const loadDistributors = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.country) params.append('country', filters.country);
      if (filters.city) params.append('city', filters.city);
      if (filters.hasActiveStores) params.append('hasActiveStores', 'true');

      const response = await api.get<{ items: Distributor[] }>(`/distributors?${params.toString()}`);
      setDistributors(response.data?.items || []);
    } catch (error) {
      console.error('Ошибка загрузки дистрибьюторов', error);
      toast.error('Не удалось загрузить список дистрибьюторов');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      // TODO: Добавить endpoint для получения запросов от бренда
      // const response = await api.get('/brands/requests');
      // setPendingRequests(response.data?.items || []);
    } catch (error) {
      console.error('Ошибка загрузки запросов', error);
    }
  };

  const handleSendRequest = async (distributorId: string) => {
    setIsSendingRequest(distributorId);
    try {
      await api.post(`/distributors/${distributorId}/request`);
      toast.success('Запрос на подключение отправлен');

      // Сохраняем время отправки запроса (час = 3600000 мс)
      const oneHourFromNow = Date.now() + 60 * 60 * 1000;
      try {
        const stored = localStorage.getItem('distributorRequestTimers');
        const timers = stored ? JSON.parse(stored) : {};
        timers[distributorId] = oneHourFromNow;
        localStorage.setItem('distributorRequestTimers', JSON.stringify(timers));
        setRequestTimers({ ...requestTimers, [distributorId]: 3600 }); // 3600 секунд = 1 час
      } catch (error) {
        console.error('Ошибка сохранения таймера', error);
      }

      await loadPendingRequests();
    } catch (error: any) {
      console.error('Ошибка отправки запроса', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось отправить запрос';
      toast.error(errorMessage);
    } finally {
      setIsSendingRequest(null);
    }
  };

  const isRequestPending = (distributorId: string) => {
    return pendingRequests.some(req => req.distributorId === distributorId && req.status === 'pending');
  };

  const isRequestAccepted = (distributorId: string) => {
    return pendingRequests.some(req => req.distributorId === distributorId && req.status === 'accepted');
  };

  const isRequestOnCooldown = (distributorId: string) => {
    return requestTimers[distributorId] !== undefined && requestTimers[distributorId] > 0;
  };

  const getTimeLeft = (distributorId: string): string | null => {
    if (requestTimers[distributorId] !== undefined && requestTimers[distributorId] > 0) {
      return formatTimeLeft(requestTimers[distributorId]);
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Дистрибьюторы</h1>
      </div>

      {/* Фильтры */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Фильтры</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs sm:text-sm mb-1.5">Страна</label>
            <select
              value={filters.country}
              onChange={(e) => {
                setFilters({ ...filters, country: e.target.value, city: '' });
              }}
              className="w-full px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Все страны</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm mb-1.5">Город</label>
            {filters.country ? (
              <select
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="w-full px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Все города</option>
                {getCitiesForCountry(filters.country).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                placeholder="Введите город"
                className="w-full px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasActiveStores}
                onChange={(e) => setFilters({ ...filters, hasActiveStores: e.target.checked })}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm">Только с активными магазинами</span>
            </label>
          </div>
        </div>
      </div>

      {/* Список дистрибьюторов */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : distributors.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Дистрибьюторы не найдены</p>
          <p className="text-sm text-muted-foreground mt-2">Попробуйте изменить фильтры поиска</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {distributors.map((distributor) => {
            const isPending = isRequestPending(distributor.id);
            const isAccepted = isRequestAccepted(distributor.id);
            const isOnCooldown = isRequestOnCooldown(distributor.id);
            const timeLeft = getTimeLeft(distributor.id);
            const isDisabled = isPending || isAccepted || isOnCooldown || isSendingRequest === distributor.id;

            return (
              <div
                key={distributor.id}
                className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg">{distributor.name}</h3>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {distributor.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{distributor.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {distributor.city}, {distributor.country}
                    </span>
                  </div>


                  {distributor.activeStoresCount !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Store className="w-4 h-4" />
                      <span>Активных магазинов: {distributor.activeStoresCount}</span>
                    </div>
                  )}

                  {distributor.categories && distributor.categories.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="w-4 h-4" />
                      <span>Категории: {distributor.categories.join(', ')}</span>
                    </div>
                  )}

                  {distributor.description && (
                    <p className="text-sm text-muted-foreground mt-2">{distributor.description}</p>
                  )}
                </div>

                {isAccepted ? (
                  <div className="px-3 py-2 bg-green-500/10 text-green-600 rounded-md text-sm text-center font-medium">
                    Подключен
                  </div>
                ) : isPending ? (
                  <div className="px-3 py-2 bg-yellow-500/10 text-yellow-600 rounded-md text-sm text-center font-medium">
                    Запрос отправлен
                  </div>
                ) : isOnCooldown && timeLeft ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2 bg-muted rounded-md text-sm text-center">
                      <div className="text-muted-foreground mb-1">Запрос можно отправить через:</div>
                      <div className="font-semibold text-primary">{timeLeft}</div>
                    </div>
                    <button
                      disabled
                      className="w-full px-4 py-2 bg-muted text-muted-foreground rounded-md cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Send className="w-4 h-4" />
                      <span>Отправить запрос на подключение</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSendRequest(distributor.id)}
                    disabled={isDisabled}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    {isSendingRequest === distributor.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Отправка...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Отправить запрос на подключение</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
