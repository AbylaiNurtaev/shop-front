import React, { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin, Search, Mic, Paperclip, Store, Package } from 'lucide-react';
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

type SelectedProduct = {
  id: string;
  name: string;
  brandName?: string;
  packageInfo?: string;
};

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  quickReplies?: string[];
  results?: StoreResult[];
  selectedProduct?: SelectedProduct;
  remainingProducts?: number;
};

export function BuyerHome() {
  const [geoState, setGeoState] = useState<GeoState>({ status: 'idle' });
  const [radiusKm, setRadiusKm] = useState(1);
  const [locationLink, setLocationLink] = useState('');
  const [linkGeo, setLinkGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

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
        toast.success('Геолокация получена');
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeoState({ status: 'blocked' });
          toast.error('Доступ к геолокации запрещен');
          return;
        }
        setGeoState({ status: 'error', message: 'Не удалось получить геолокацию.' });
        toast.error('Не удалось получить геолокацию');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const getDeviceId = (): string => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  const ensureSessionAndConversation = async () => {
    if (sessionId && conversationId) return { sessionId, conversationId };
    try {
      const deviceId = getDeviceId();
      const userAgent = navigator.userAgent;
      
      const sessionResponse = await api.post('/customer/sessions', {
        deviceId,
        userAgent,
      });
      const createdSessionId = sessionResponse.data?.sessionId;
      if (!createdSessionId) {
        toast.error('Не удалось создать сессию покупателя.');
        return null;
      }
      setSessionId(createdSessionId);
      
      const convoResponse = await api.post('/customer/conversations', {
        sessionId: createdSessionId,
      });
      const createdConversationId = convoResponse.data?.conversationId;
      if (!createdConversationId) {
        toast.error('Не удалось создать чат.');
        return null;
      }
      setConversationId(createdConversationId);
      return { sessionId: createdSessionId, conversationId: createdConversationId };
    } catch (error: any) {
      console.error('Ошибка инициализации покупателя', error);
      toast.error(error?.response?.data?.message || 'Не удалось инициализировать поиск.');
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
          const loadedMessages: Message[] = history.map((item: any) => {
            const role = item.sender === 'CUSTOMER' ? 'user' : item.sender === 'SYSTEM' ? 'system' : 'assistant';
            return {
              id: item.id ?? `history-${Math.random()}`,
              role,
              text: item.text ?? item.message ?? '',
            };
          });
          setMessages(loadedMessages);
        } else {
          // Первое сообщение приветствия
          setMessages([
            {
              id: 'welcome',
              role: 'system',
              text: 'Здравствуйте! Напишите, какой товар вы ищете, и я помогу найти его в ближайших магазинах.',
            },
          ]);
        }
      } catch (error) {
        console.error('Ошибка загрузки истории', error);
        setMessages([
          {
            id: 'welcome',
            role: 'system',
            text: 'Здравствуйте! Напишите, какой товар вы ищете, и я помогу найти его в ближайших магазинах.',
          },
        ]);
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
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ч назад`;
    return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
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
            price: offer.price != null ? `${offer.price} ${offer.currency ?? '₸'}`.trim() : undefined,
            availability: offer.isAvailable ? 'в наличии' : 'нет',
          };
          if (existing) {
            existing.items.push(item);
          } else {
            storesMap.set(storeId, {
              storeName: store.name ?? 'Магазин',
              distance: formatDistance(store.distanceMeters ?? store.distance),
              address: store.address ?? '—',
              updatedAgo: formatUpdated(offer.updatedAt),
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

  const sendMessage = async (text: string) => {
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

    const payload: any = {
      text,
      attachments: [],
    };

    if (geoValue) {
      payload.geo = geoValue;
      payload.radiusMeters = Math.round(radiusKm * 1000);
    }

    setSending(true);
    try {
      const response = await api.post(
        `/customer/conversations/${initData.conversationId}/messages`,
        payload
      );

      const responseData = response.data;
      const state = responseData?.state;

      // Добавляем ответ системы
      const assistantMessage: Message = {
        id: responseData?.messageId ?? `assistant-${Date.now()}`,
        role: 'assistant',
        text: Array.isArray(responseData?.questions) && responseData.questions.length > 0
          ? responseData.questions.join('\n')
          : responseData?.text || 'Обрабатываю ваш запрос...',
        quickReplies: responseData?.quickReplies,
        remainingProducts: responseData?.remainingProducts,
        selectedProduct: responseData?.selectedProduct,
      };

      // Если найден товар и есть результаты поиска
      if (state === 'DONE' && responseData?.items) {
        const results = normalizeResults(responseData);
        assistantMessage.results = results;
        assistantMessage.text = results.length > 0
          ? `Найдено ${results.length} магазин(ов) с товаром "${responseData?.selectedProduct?.name || 'товар'}"`
          : 'Товар не найден в ближайших магазинах';
      }

      setMessages((prev) => [...prev, assistantMessage]);

      // Если нужно уточнение и есть selectedProduct, показываем его
      if (responseData?.selectedProduct && state !== 'DONE') {
        toast.info(`Найден товар: ${responseData.selectedProduct.name}`);
      }
    } catch (error: any) {
      console.error('Ошибка отправки сообщения', error);
      toast.error(error?.response?.data?.message || 'Не удалось отправить сообщение');
      
      // Добавляем сообщение об ошибке
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'system',
          text: 'Произошла ошибка. Попробуйте еще раз.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    sendMessage(trimmed);
  };

  const handleQuickReply = (reply: string) => {
    if (sending) return;
    const userMessage: Message = {
      id: `user-reply-${Date.now()}`,
      role: 'user',
      text: reply,
    };
    setMessages((prev) => [...prev, userMessage]);
    sendMessage(reply);
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
    toast.success('Локация из 2ГИС сохранена');
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
          <label className="text-xs font-medium text-muted-foreground">Радиус поиска</label>
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
                <div className="whitespace-pre-wrap">{message.text}</div>
                
                {message.selectedProduct && (
                  <div className="mt-3 p-2 bg-background/80 rounded-lg border border-border">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <Package className="w-4 h-4 text-primary" />
                      Найден товар:
                    </div>
                    <div className="mt-1 text-xs">
                      <div className="font-medium">{message.selectedProduct.name}</div>
                      {message.selectedProduct.brandName && (
                        <div className="text-muted-foreground">Бренд: {message.selectedProduct.brandName}</div>
                      )}
                      {message.selectedProduct.packageInfo && (
                        <div className="text-muted-foreground">Упаковка: {message.selectedProduct.packageInfo}</div>
                      )}
                    </div>
                  </div>
                )}

                {message.remainingProducts !== undefined && message.remainingProducts > 1 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Осталось вариантов: {message.remainingProducts}
                  </div>
                )}

                {message.quickReplies && message.quickReplies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.quickReplies.map((reply) => (
                      <button
                        key={reply}
                        type="button"
                        onClick={() => handleQuickReply(reply)}
                        disabled={sending}
                        className="px-3 py-1.5 rounded-full bg-background border border-border text-xs hover:bg-muted disabled:opacity-50"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
                
                {message.results && message.results.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {message.results.map((store, idx) => (
                      <div key={`${store.storeName}-${idx}`} className="border border-border rounded-xl p-3 bg-background/80">
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
                          {store.items.map((item, itemIdx) => (
                            <div key={`${item.name}-${itemIdx}`} className="flex justify-between text-xs">
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-accent/60 text-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground text-xs">Ищу товары</span>
                  <div className="flex gap-1 items-center">
                    <span 
                      className="w-2 h-2 bg-muted-foreground/70 rounded-full" 
                      style={{ 
                        animation: 'typing 1.4s infinite',
                        animationDelay: '0ms'
                      }} 
                    />
                    <span 
                      className="w-2 h-2 bg-muted-foreground/70 rounded-full" 
                      style={{ 
                        animation: 'typing 1.4s infinite',
                        animationDelay: '200ms'
                      }} 
                    />
                    <span 
                      className="w-2 h-2 bg-muted-foreground/70 rounded-full" 
                      style={{ 
                        animation: 'typing 1.4s infinite',
                        animationDelay: '400ms'
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-10 h-10 flex items-center justify-center rounded-full border border-border hover:bg-muted"
              title="Прикрепить файл"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="w-10 h-10 flex items-center justify-center rounded-full border border-border hover:bg-muted"
              title="Голосовое сообщение"
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
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={sending}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
