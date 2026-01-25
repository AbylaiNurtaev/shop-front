import React, { useState } from 'react';
import { MapPin, Navigation, Store, ExternalLink } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

type SearchOffer = {
  offerId: string;
  price: number;
  currency: string;
  isAvailable?: boolean;
  store: {
    id: string;
    name: string;
    address: string;
    location?: string | {
      lat: number;
      lng: number;
      link?: string;
    };
    distanceMeters?: number;
    distanceFormatted?: string;
  };
};

type SearchItem = {
  product: {
    id: string;
    name: string;
    description?: string;
    images?: string[];
    categoryId: string;
  };
  offers: SearchOffer[];
};

type SearchResponse = {
  items: SearchItem[];
  total?: number;
};

interface StoreSearchProps {
  storesCount?: number;
}

export function StoreSearch({ storesCount }: StoreSearchProps) {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('10000');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post<SearchResponse>('/products/search', {
        location: {
          lat: Number(lat),
          lng: Number(lng),
        },
        radiusMeters: radius ? Number(radius) : undefined,
        search: query || undefined,
      });
      setResults(response.data?.items ?? []);
    } catch (error) {
      console.error('Ошибка поиска товаров', error);
      toast.error('Не удалось выполнить поиск.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-0">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Поиск товаров рядом</h2>
        <p className="text-sm text-gray-500 mt-1">
          Найдите товары с доступными офферами в радиусе
        </p>
        {storesCount !== undefined && (
          <p className="text-xs text-gray-400 mt-1">Доступно магазинов: {storesCount}</p>
        )}
      </div>

      <form onSubmit={handleSearch} className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Широта</label>
            <input
              type="number"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full h-11 px-3 bg-gray-50 border border-gray-300 rounded-lg"
              placeholder="55.7558"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Долгота</label>
            <input
              type="number"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="w-full h-11 px-3 bg-gray-50 border border-gray-300 rounded-lg"
              placeholder="37.6173"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Радиус (м)</label>
            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-full h-11 px-3 bg-gray-50 border border-gray-300 rounded-lg"
              placeholder="10000"
              min="1"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Поисковый запрос</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-11 px-3 bg-gray-50 border border-gray-300 rounded-lg"
              placeholder="например, наушники"
            />
          </div>
          <button
            type="submit"
            className="h-11 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Ищем...' : 'Искать'}
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {results.length === 0 && (
          <div className="text-sm text-gray-500">
            Нет результатов. Попробуйте изменить параметры поиска.
          </div>
        )}

        {results.map((item) => (
          <div key={item.product.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div>
              <h3 className="text-lg font-semibold">{item.product.name}</h3>
              {item.product.description && (
                <p className="text-sm text-gray-600">{item.product.description}</p>
              )}
            </div>
            <div className="space-y-3">
              {item.offers.map((offer) => {
                const distance = offer.store.distanceFormatted ?? 
                  (offer.store.distanceMeters !== undefined 
                    ? offer.store.distanceMeters < 1000 
                      ? `${Math.round(offer.store.distanceMeters)} м`
                      : `${(offer.store.distanceMeters / 1000).toFixed(1)} км`
                    : null);
                
                const locationLink = typeof offer.store.location === 'string'
                  ? offer.store.location
                  : offer.store.location?.link ?? null;
                
                return (
                  <div key={offer.offerId} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Store className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">
                            {offer.store.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{offer.store.address}</span>
                          </div>
                          {distance && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Navigation className="w-3.5 h-3.5" />
                              <span>{distance}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-gray-900 mb-1">
                          {offer.price} {offer.currency}
                        </p>
                        <span className={`inline-block text-xs px-2 py-1 rounded ${
                          offer.isAvailable === false
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {offer.isAvailable === false ? 'Нет в наличии' : 'В наличии'}
                        </span>
                      </div>
                    </div>
                    {locationLink && (
                      <a
                        href={locationLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full text-xs px-3 py-2 rounded-md border border-gray-300 hover:bg-white hover:border-blue-500 transition-colors text-gray-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Открыть в 2ГИС
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

