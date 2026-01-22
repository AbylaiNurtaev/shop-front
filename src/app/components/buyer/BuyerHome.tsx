import React, { useEffect, useMemo, useState } from 'react';
import { Navigation, MapPin, Search, Mic, Paperclip, StopCircle, Store } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';

type GeoState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'granted'; lat: number; lng: number }
  | { status: 'blocked' }
  | { status: 'error'; message: string };

type StoreResult = {
  storeName: string;
  distance: string;
  address: string;
  updatedAgo: string;
  deeplink: string;
  items: Array<{ name: string; price?: string; availability?: string }>;
};

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  quickReplies?: string[];
  results?: StoreResult[];
};

export function BuyerHome() {
  const [geoState, setGeoState] = useState<GeoState>({ status: 'idle' });
  const [radiusKm, setRadiusKm] = useState(1);
  const [locationLink, setLocationLink] = useState('');
  const [linkGeo, setLinkGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [input, setInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'sys-geo',
      role: 'system',
      text: 'Разрешите геолокацию или укажите ссылку 2ГИС — так мы найдём магазины рядом.',
    },
  ]);

  const sampleResults = useMemo<StoreResult[]>(
    () => [
      {
        storeName: 'Магазин у дома',
        distance: '320 м',
        address: 'Кабанбай батыр проспект, 29',
        updatedAgo: '5 мин назад',
        deeplink: 'https://2gis.kz/astana/geo/9570784901748102/71.411775,51.123502',
        items: [
          { name: 'Молоко 2.5% 1 л', price: '520 ₸', availability: 'в наличии' },
          { name: 'Хлеб ржаной', price: '260 ₸', availability: 'мало' },
        ],
      },
    ],
    []
  );

  const requestGeo = () => {
    if (!navigator.geolocation) {
      setGeoState({ status: 'error', message: 'Геолокация не поддерживается в этом браузере.' });
      return;
    }
    setGeoState({ status: 'requesting' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoState({
          status: 'granted',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeoState({ status: 'blocked' });
          return;
        }
        setGeoState({ status: 'error', message: 'Не удалось получить геолокацию.' });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const ensureSessionAndConversation = async () => {
    if (sessionId && conversationId) return { sessionId, conversationId };
    try {
      const sessionResponse = await api.post('/customer/sessions');
      const createdSessionId = sessionResponse.data?.id ?? sessionResponse.data?.sessionId;
      if (!createdSessionId) {
        toast.error('Не удалось создать сессию покупателя.');
        return null;
      }
      setSessionId(createdSessionId);
      const convoResponse = await api.post('/customer/conversations', { sessionId: createdSessionId });
      const createdConversationId = convoResponse.data?.id ?? convoResponse.data?.conversationId;
      if (!createdConversationId) {
        toast.error('Не удалось создать чат.');
        return null;
      }
      setConversationId(createdConversationId);
      return { sessionId: createdSessionId, conversationId: createdConversationId };
    } catch (error) {
      console.error('Ошибка инициализации покупателя', error);
      toast.error('Не удалось инициализировать поиск.');
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      const initData = await ensureSessionAndConversation();
      if (!initData) return;
      try {
        const convo = await api.get(`/customer/conversations/${initData.conversationId}`);
        const history = convo.data?.messages;
        if (Array.isArray(history) && history.length > 0) {
          setMessages((prev) => [
            ...prev,
            ...history.map((item: any) => ({
              id: item.id ?? `history-${Math.random()}`,
              role: item.role ?? 'assistant',
              text: item.text ?? item.message ?? '',
            })),
          ]);
        }
      } catch (error) {
        console.error('Ошибка загрузки истории', error);
      }
    };
    init();
  }, []);

  const parse2GisLink = (value: string) => {
    const match = value.match(/\/geo\/\d+\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (!match) return null;
    const lng = Number(match[1]);
    const lat = Number(match[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  };

  const formatDistance = (value: number | string | undefined) => {
    if (value == null) return '—';
    if (typeof value === 'string') return value;
    if (value < 1000) return `${Math.round(value)} м`;
    return `${(value / 1000).toFixed(1)} км`;
  };

  const formatUpdated = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const normalizeResults = (data: any): StoreResult[] => {
    if (Array.isArray(data?.items)) {
      const storesMap = new Map<string, StoreResult>();
      data.items.forEach((entry: any) => {
        const product = entry?.product ?? {};
        const offers = Array.isArray(entry?.offers) ? entry.offers : [];
        offers.forEach((offer: any) => {
          const store = offer?.store ?? {};
          const storeId = store.id ?? store.name ?? `store-${Math.random()}`;
          const existing = storesMap.get(storeId);
          const item = {
            name: product.name ?? 'Товар',
            price: offer.price != null ? `${offer.price} ${offer.currency ?? ''}`.trim() : undefined,
            availability: offer.isAvailable ? 'в наличии' : 'нет',
          };
          if (existing) {
            existing.items.push(item);
          } else {
            storesMap.set(storeId, {
              storeName: store.name ?? 'Магазин',
              distance: formatDistance(store.distanceMeters ?? store.distance),
              address: store.address ?? '—',
              updatedAgo: formatUpdated(data.updatedAt),
              deeplink: store.location ?? 'https://2gis.kz',
              items: [item],
            });
          }
        });
      });
      return Array.from(storesMap.values());
    }
    return [];
  };

  const startSearch = async (text: string) => {
    const initData = await ensureSessionAndConversation();
    if (!initData) return;
    const geoFromLink = locationLink ? parse2GisLink(locationLink) : null;
    if (locationLink && !geoFromLink) {
      toast.error('Ссылка 2ГИС имеет неверный формат.');
      return;
    }
    const geoValue =
      geoState.status === 'granted'
        ? { lat: geoState.lat, lng: geoState.lng }
        : geoFromLink ?? undefined;
    const payload = {
      conversationId: initData.conversationId,
      text,
      geo: geoValue,
      radiusMeters: Math.round(radiusKm * 1000),
    };
    console.log('Buyer message payload', payload);
    try {
      await api.post(`/customer/conversations/${initData.conversationId}/messages`, payload);
    } catch (error) {
      console.error('Ошибка отправки сообщения', error);
    }

    setSearching(true);
    const assistantMessageId = `assistant-search-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: 'assistant', text: 'Ищем ближайшие магазины…' },
    ]);
    try {
      const searchResponse = await api.post('/customer/search', payload);
      const requestId = searchResponse.data?.requestId ?? searchResponse.data?.id;
      if (!requestId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, text: 'Не удалось запустить поиск.' } : msg
          )
        );
        setSearching(false);
        return;
      }

      let attempts = 0;
      const poll = async () => {
        attempts += 1;
        try {
          const response = await api.get(`/customer/search/${requestId}`);
          console.log('Buyer search response', response.data);
          const results = normalizeResults(response.data);
          if (results.length > 0 || response.data?.status === 'done') {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                ? {
                      ...msg,
                      text: results.length ? 'Нашли варианты рядом:' : 'Пока нет результатов.',
                    results: results.length ? results : undefined,
                    }
                  : msg
              )
            );
            setSearching(false);
            return;
          }
        } catch (error) {
          console.error('Ошибка получения результатов', error);
        }
        if (attempts < 10) {
          setTimeout(poll, 1000);
        } else {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, text: 'Ответ занимает больше времени. Попробуйте повторить.' }
                : msg
            )
          );
          setSearching(false);
        }
      };
      poll();
    } catch (error) {
      console.error('Ошибка запуска поиска', error);
      toast.error('Не удалось запустить поиск.');
      setSearching(false);
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || searching) return;
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    startSearch(trimmed);
  };

  const handleQuickReply = (reply: string) => {
    if (searching) return;
    const userMessage: Message = {
      id: `user-reply-${Date.now()}`,
      role: 'user',
      text: reply,
    };
    setMessages((prev) => [...prev, userMessage]);
    startSearch(reply);
  };

  const handleStopSearch = () => {
    if (!searching) return;
    setSearching(false);
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-stop-${Date.now()}`,
        role: 'assistant',
        text: 'Поиск остановлен. Можно уточнить запрос.',
      },
    ]);
  };

  const handleLocationChange = (value: string) => {
    setLocationLink(value);
    const trimmed = value.trim();
    const coords = parse2GisLink(trimmed);
    if (!coords) {
      setLinkGeo(null);
      return;
    }
    setLinkGeo(coords);
    setMessages((prev) => [
      ...prev,
      {
        id: `system-location-${Date.now()}`,
        role: 'system',
        text: `Локация из 2ГИС сохранена (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}).`,
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-card border border-border rounded-lg shadow-sm p-4 flex flex-col gap-4 min-h-[80vh]">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
            <Search className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Покупатель</h1>
            <p className="text-xs text-muted-foreground">
              Чат‑поиск продуктов рядом
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground">Радиус</label>
          <div className="flex gap-2">
            {[0.5, 1, 2, 3].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRadiusKm(value)}
                className={`px-3 py-1.5 rounded-full border text-xs ${
                  radiusKm === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                {value} км
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={requestGeo}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
            disabled={geoState.status === 'requesting'}
          >
            <Navigation className="w-4 h-4" />
            {geoState.status === 'requesting' ? 'Запрашиваем…' : 'Геолокация'}
          </button>
          <input
            type="text"
            value={locationLink}
            onChange={(e) => handleLocationChange(e.target.value)}
            placeholder="Ссылка 2ГИС"
            className="flex-1 px-3 py-2 bg-input-background border border-border rounded-md text-sm"
            pattern="https://2gis\\.kz/[a-z-]+/geo/\\d+/-?\\d+(?:\\.\\d+)?,-?\\d+(?:\\.\\d+)?"
            title="Ссылка должна быть в формате https://2gis.kz/astana/geo/9570784901748102/71.411775,51.123502"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.role === 'system'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-accent/60 text-foreground'
                }`}
              >
                <div>{message.text}</div>
                {message.quickReplies && message.quickReplies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.quickReplies.map((reply) => (
                      <button
                        key={reply}
                        type="button"
                        onClick={() => handleQuickReply(reply)}
                        className="px-3 py-1.5 rounded-full bg-background border border-border text-xs hover:bg-muted"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
                {message.results && message.results.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {message.results.map((store) => (
                      <div key={store.storeName} className="border border-border rounded-xl p-3 bg-background/80">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Store className="w-4 h-4 text-primary" />
                          {store.storeName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {store.distance} · {store.address}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Обновлено {store.updatedAgo}
                        </div>
                        <div className="mt-2 space-y-1">
                          {store.items.map((item) => (
                            <div key={item.name} className="flex justify-between text-xs">
                              <span>{item.name}</span>
                              <span className="text-muted-foreground">
                                {item.price} {item.availability ? `· ${item.availability}` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <a
                            href={store.deeplink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 text-center text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted"
                          >
                            Открыть в 2ГИС
                          </a>
                          <button
                            type="button"
                            className="flex-1 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted"
                          >
                            Товары в магазине
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-10 h-10 flex items-center justify-center rounded-full border border-border hover:bg-muted"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="w-10 h-10 flex items-center justify-center rounded-full border border-border hover:bg-muted"
            >
              <Mic className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишите, что ищете..."
              className="flex-1 px-3 py-2 bg-input-background border border-border rounded-md text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
            />
            {searching ? (
              <button
                type="button"
                onClick={handleStopSearch}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground"
              >
                <StopCircle className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

