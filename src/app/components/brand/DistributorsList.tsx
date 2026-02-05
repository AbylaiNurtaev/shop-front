import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Store, Package, Send, Loader2, Search, Filter, Mail, X, Users, Phone, Calendar } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface SalesRepresentative {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  email: string;
  phoneNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DistributorUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  currency?: string;
}

interface DistributorStore {
  id: string;
  name: string;
  address: string;
  location?: string;
  locationCoords?: {
    lat: number;
    lng: number;
  };
  city: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  description?: string;
  photos?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface BrandConnection {
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  requestedAt?: string;
  respondedAt?: string | null;
}

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
  storesCount?: number;
  salesRepresentativesCount?: number;
  salesRepresentatives?: SalesRepresentative[];
  users?: DistributorUser[];
  stores?: DistributorStore[];
  brandConnection?: BrandConnection;
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

interface DistributorsResponse {
  attached?: {
    items: Distributor[];
    total: number;
  };
  notAttached?: {
    items: Distributor[];
    total: number;
  };
  items?: Distributor[]; // Для обратной совместимости
}

export function DistributorsList() {
  const [attachedDistributors, setAttachedDistributors] = useState<Distributor[]>([]);
  const [notAttachedDistributors, setNotAttachedDistributors] = useState<Distributor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<DistributorRequest[]>([]);
  const [requestTimers, setRequestTimers] = useState<{ [key: string]: number }>({});
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);

  // Фильтры
  const [filters, setFilters] = useState({
    country: 'Казахстан',
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

      // Получаем brandId из localStorage
      const brandId = localStorage.getItem('brandId');
      if (brandId) {
        params.append('brandId', brandId);
      }

      if (filters.country) params.append('country', filters.country);
      if (filters.city) params.append('city', filters.city);
      if (filters.hasActiveStores) params.append('hasActiveStores', 'true');

      const response = await api.get<DistributorsResponse>(`/distributors?${params.toString()}`);

      // Обрабатываем новый формат ответа с brandId
      if (brandId && response.data.attached !== undefined && response.data.notAttached !== undefined) {
        setAttachedDistributors(response.data.attached?.items || []);
        setNotAttachedDistributors(response.data.notAttached?.items || []);
      } else {
        // Обратная совместимость: если brandId не передан или формат старый
        const allDistributors = response.data?.items || [];
        setAttachedDistributors([]);
        setNotAttachedDistributors(allDistributors);
      }
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
      // Обновляем список дистрибьюторов после отправки запроса
      await loadDistributors();
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

  const renderDistributorCard = (distributor: Distributor, isAttached: boolean) => {
    const isPending = isRequestPending(distributor.id);
    const isAccepted = isRequestAccepted(distributor.id) || isAttached;
    const isOnCooldown = isRequestOnCooldown(distributor.id);
    const timeLeft = getTimeLeft(distributor.id);
    const isDisabled = isPending || isAccepted || isOnCooldown || isSendingRequest === distributor.id;

    return (
      <div
        key={distributor.id}
        onClick={() => setSelectedDistributor(distributor)}
        className={`bg-card border rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow cursor-pointer ${isAttached ? 'border-green-500/50' : 'border-border'}`}
      >
        <div className="flex items-start justify-between mb-2 md:mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Building2 className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-base md:text-lg break-words">{distributor.name}</h3>
          </div>
        </div>

        <div className="space-y-2 mb-3 md:mb-4">
          {distributor.email && (
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
              <span className="break-all">{distributor.email}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
            <span className="break-words">
              {distributor.city}, {distributor.country}
            </span>
          </div>

          {distributor.activeStoresCount !== undefined && (
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <Store className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
              <span>Активных магазинов: {distributor.activeStoresCount}</span>
            </div>
          )}

          {distributor.categories && distributor.categories.length > 0 && (
            <div className="flex items-start gap-2 text-xs md:text-sm text-muted-foreground">
              <Package className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 mt-0.5" />
              <span className="break-words">Категории: {distributor.categories.join(', ')}</span>
            </div>
          )}

          {distributor.description && (
            <p className="text-xs md:text-sm text-muted-foreground mt-2 line-clamp-2">{distributor.description}</p>
          )}
        </div>

        {isAccepted || isAttached ? (
          <div className="px-3 py-2 bg-green-500/10 text-green-600 rounded-md text-sm text-center font-medium">
            {isAttached ? 'Прикреплен к бренду' : 'Подключен'}
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
            onClick={(e) => {
              e.stopPropagation();
              handleSendRequest(distributor.id);
            }}
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
  };

  return (
    <div className="space-y-4 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-semibold">Дистрибьюторы</h1>
      </div>

      {/* Фильтры */}
      <div className="bg-card border border-border rounded-lg p-3 md:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
          <h3 className="font-semibold text-base md:text-lg">Фильтры</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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
            {filters.country && getCitiesForCountry(filters.country).length > 0 ? (
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
      ) : attachedDistributors.length === 0 && notAttachedDistributors.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Дистрибьюторы не найдены</p>
          <p className="text-sm text-muted-foreground mt-2">Попробуйте изменить фильтры поиска</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Прикрепленные дистрибьюторы */}
          {attachedDistributors.length > 0 && (
            <div>
              <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                <span>Прикрепленные к бренду ({attachedDistributors.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {attachedDistributors.map((distributor) => {
                  return renderDistributorCard(distributor, true);
                })}
              </div>
            </div>
          )}

          {/* Свободные дистрибьюторы */}
          {notAttachedDistributors.length > 0 && (
            <div>
              <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                <span>Свободные ({notAttachedDistributors.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {notAttachedDistributors.map((distributor) => {
                  return renderDistributorCard(distributor, false);
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Модальное окно с информацией о дистрибьюторе */}
      {selectedDistributor && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setSelectedDistributor(null)}>
          <div className="bg-card w-full md:max-w-4xl md:max-h-[90vh] md:rounded-2xl shadow-2xl flex flex-col overflow-hidden h-full md:h-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex-shrink-0 bg-card border-b border-border px-4 md:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                <h2 className="text-lg md:text-xl font-semibold text-foreground">{selectedDistributor.name}</h2>
              </div>
              <button
                onClick={() => setSelectedDistributor(null)}
                className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg hover:bg-muted active:bg-accent transition-colors text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="space-y-4 md:space-y-6">
                {/* Основная информация */}
                <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="text-xs md:text-sm font-medium text-muted-foreground">Email</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm md:text-base text-foreground break-all">{selectedDistributor.email || '—'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs md:text-sm font-medium text-muted-foreground">Местоположение</label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm md:text-base text-foreground">
                        {selectedDistributor.city}, {selectedDistributor.country}
                      </span>
                    </div>
                  </div>
                  {selectedDistributor.address && (
                    <div className="md:col-span-2">
                      <label className="text-xs md:text-sm font-medium text-muted-foreground">Адрес</label>
                      <p className="text-sm md:text-base text-foreground mt-1">{selectedDistributor.address}</p>
                    </div>
                  )}
                </div>

                {/* Статистика */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  <div className="bg-muted rounded-lg p-3 md:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Store className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                      <span className="text-xs md:text-sm font-medium text-muted-foreground">Магазинов</span>
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-foreground">
                      {selectedDistributor.storesCount || selectedDistributor.activeStoresCount || 0}
                    </p>
                    {selectedDistributor.activeStoresCount !== undefined && selectedDistributor.storesCount !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Активных: {selectedDistributor.activeStoresCount}
                      </p>
                    )}
                  </div>
                  <div className="bg-muted rounded-lg p-3 md:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                      <span className="text-xs md:text-sm font-medium text-muted-foreground">Торговых представителей</span>
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-foreground">
                      {selectedDistributor.salesRepresentativesCount || selectedDistributor.salesRepresentatives?.length || 0}
                    </p>
                  </div>
                  {selectedDistributor.brandConnection && (
                    <div className="bg-muted rounded-lg p-3 md:p-4 col-span-2 md:col-span-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                        <span className="text-xs md:text-sm font-medium text-muted-foreground">Статус подключения</span>
                      </div>
                      <p className="text-base md:text-lg font-bold text-foreground">
                        {selectedDistributor.brandConnection.status === 'ACCEPTED' && 'Принят'}
                        {selectedDistributor.brandConnection.status === 'PENDING' && 'Ожидает'}
                        {selectedDistributor.brandConnection.status === 'REJECTED' && 'Отклонен'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Торговые представители */}
                {selectedDistributor.salesRepresentatives && selectedDistributor.salesRepresentatives.length > 0 && (
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Торговые представители</h3>
                    <div className="space-y-2 md:space-y-3">
                      {selectedDistributor.salesRepresentatives.map((sr) => (
                        <div key={sr.id} className="bg-muted rounded-lg p-3 md:p-4">
                          <p className="font-semibold text-sm md:text-base text-foreground mb-2">{sr.name}</p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                              <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                              <span className="break-all">{sr.email}</span>
                            </div>
                            {sr.phoneNumber && (
                              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                                <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                                <span>{sr.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Магазины */}
                {selectedDistributor.stores && selectedDistributor.stores.length > 0 && (
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">
                      Магазины ({selectedDistributor.stores.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <div className="min-w-full">
                        {/* Desktop Table */}
                        <table className="hidden md:table w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Название</th>
                              <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Адрес</th>
                              <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Телефон</th>
                              <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Контакт</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {selectedDistributor.stores.map((store) => (
                              <tr key={store.id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-4 py-3 text-sm font-medium text-foreground">{store.name}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>{store.address}, {store.city}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  {store.phoneNumber ? (
                                    <div className="flex items-center gap-1.5">
                                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                      <span>{store.phoneNumber}</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  {store.firstName && store.lastName ? (
                                    [store.lastName, store.firstName, store.middleName].filter(Boolean).join(' ')
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-2">
                          {selectedDistributor.stores.map((store) => (
                            <div key={store.id} className="bg-muted rounded-lg p-3 border border-border">
                              <p className="font-semibold text-sm text-foreground mb-2">{store.name}</p>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-start gap-2 text-muted-foreground">
                                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                  <span className="break-words">{store.address}, {store.city}</span>
                                </div>
                                {store.phoneNumber && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>{store.phoneNumber}</span>
                                  </div>
                                )}
                                {store.firstName && store.lastName && (
                                  <div className="text-muted-foreground">
                                    Контакт: {[store.lastName, store.firstName, store.middleName].filter(Boolean).join(' ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-border px-4 md:px-6 py-4 safe-area-inset-bottom">
              <button
                onClick={() => setSelectedDistributor(null)}
                className="w-full px-4 py-2.5 md:py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity text-sm md:text-base"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
