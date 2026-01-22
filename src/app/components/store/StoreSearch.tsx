import React, { useState } from 'react';
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
    location: {
      lat: number;
      lng: number;
    };
    distanceMeters?: number;
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
            <div className="space-y-2">
              {item.offers.map((offer) => (
                <div key={offer.offerId} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{offer.store.name}</p>
                      <p className="text-xs text-gray-500">{offer.store.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold">
                        {offer.price} {offer.currency}
                      </p>
                      {offer.store.distanceMeters !== undefined && (
                        <p className="text-xs text-gray-500">{offer.store.distanceMeters} м</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {offer.isAvailable === false ? 'Нет в наличии' : 'Доступно'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

