import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, MapPin, Search, Mic, Paperclip, Store, Package, Image as ImageIcon, X, Check, ChevronLeft, ChevronRight, ShoppingBasket } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';
import { ScrollToTopButton } from '../ui/scroll-to-top-button';

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
  items: Array<{ name: string; price?: string; availability?: string; allocatedQuantity?: number }>;
};

type SelectedProduct = {
  id: string;
  name: string;
  brandName?: string;
  packageInfo?: string;
  images?: string[] | null;
};

type MatchedProduct = {
  id: string;
  name: string;
  brandName?: string;
  categoryName?: string;
  packageInfo?: string | null;
  images?: string[] | null;
};

type BatchFoundProduct = {
  requestedName: string;
  requestedQuantity?: number;
  product: {
    id: string;
    name: string;
    images?: string[] | null;
    brandName?: string;
    packageInfo?: string | null;
  };
  offers: Array<{
    offerId: string;
    price: number;
    currency: string;
    isAvailable?: boolean;
    allocatedQuantity?: number;
    store?: {
      id: string;
      name: string;
      address: string;
      location?: string;
      distanceMeters?: number | null;
      distanceFormatted?: string | null;
    };
  }>;
  totalOffers: number;
  nearestStore: {
    name: string;
    distance: string;
    distanceMeters: number;
  };
  fulfillmentInfo?: {
    requestedQuantity: number;
    fulfilledQuantity: number;
    remainingQuantity: number;
    storesCount: number;
    isFullyFulfilled: boolean;
  };
};

type BatchNotFoundProduct = {
  productName: string;
  reason: string;
};

type BatchSearchResults = {
  found: BatchFoundProduct[];
  notFound: BatchNotFoundProduct[];
};

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  quickReplies?: string[];
  results?: StoreResult[];
  selectedProduct?: SelectedProduct;
  remainingProducts?: number;
  imageUrl?: string;
  imageAnalysis?: {
    productName?: string;
    brand?: string;
    packageType?: string;
    packageInfo?: string;
    type?: string;
    description?: string;
  };
  fulfillmentInfo?: {
    requestedQuantity: number;
    fulfilledQuantity: number;
    remainingQuantity: number;
    storesCount: number;
    isFullyFulfilled: boolean;
  };
  isVolumeSelection?: boolean;
  volumeOptions?: string[];
  needsQuantityInput?: boolean;
  defaultQuantity?: number;
  matchedProducts?: MatchedProduct[];
  batchResults?: BatchSearchResults;
  candidates?: Array<{
    id: string;
    name: string;
    brandName?: string;
    packageInfo?: string;
    description?: string;
    images?: string[];
    offers?: Array<{
      offerId: string;
      price: number;
      currency: string;
      isAvailable?: boolean;
      quantity?: number;
      allocatedQuantity?: number;
      store?: {
        id: string;
        name: string;
        address: string;
        location?: string;
        distanceMeters?: number | null;
        distanceFormatted?: string | null;
        isWithinRadius?: boolean | null;
      };
    }>;
    totalOffers?: number;
    offersInRadius?: number;
    nearestStore?: {
      name: string;
      distance?: string | null;
      distanceMeters?: number | null;
      address: string;
      location?: string;
      isWithinRadius?: boolean | null;
    } | null;
  }>;
};

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare var webkitSpeechRecognition: {
  new(): SpeechRecognition;
};

declare var SpeechRecognition: {
  new(): SpeechRecognition;
};

type QuantityInputProps = {
  messageId: string;
  defaultQuantity?: number;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
};

function QuantityInput({ messageId, defaultQuantity = 1, onQuantityChange, disabled }: QuantityInputProps) {
  const [quantity, setQuantity] = useState<number>(defaultQuantity);

  useEffect(() => {
    // Уведомляем родителя о начальном количестве
    onQuantityChange(defaultQuantity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDecrease = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      onQuantityChange(newQuantity);
    }
  };

  const handleIncrease = () => {
    if (quantity < 9999) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      onQuantityChange(newQuantity);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setQuantity(1);
      onQuantityChange(1);
      return;
    }
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0 && numValue < 10000) {
      setQuantity(numValue);
      onQuantityChange(numValue);
    }
  };

  return (
    <div className="mt-4 p-4 bg-card/90 rounded-xl border border-border shadow-sm">
      <div className="text-sm font-medium mb-4 text-foreground">Количество в штуках:</div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={disabled || quantity <= 1}
          className="w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:bg-accent hover:border-border/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
        >
          −
        </button>
        <input
          type="number"
          min="1"
          max="9999"
          value={quantity}
          onChange={handleQuantityChange}
          disabled={disabled}
          className="flex-1 px-3 py-2 bg-input-background border border-border rounded-lg text-sm text-center font-medium disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleIncrease}
          disabled={disabled || quantity >= 9999}
          className="w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:bg-accent hover:border-border/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
        >
          +
        </button>
      </div>
    </div>
  );
}

type VolumeSelectionProps = {
  messageId: string;
  volumeOptions: string[];
  getQuantity: () => number;
  onSelect: (volume: string, quantity: number) => void;
  disabled?: boolean;
  showFindButton?: boolean;
};

function VolumeSelection({ messageId, volumeOptions, getQuantity, onSelect, disabled, showFindButton = false }: VolumeSelectionProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const handlePrevious = () => {
    if (disabled) return;
    const newIndex = currentIndex > 0 ? currentIndex - 1 : volumeOptions.length - 1;
    setCurrentIndex(newIndex);
  };

  const handleNext = () => {
    if (disabled) return;
    const newIndex = currentIndex < volumeOptions.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
  };

  const handleFind = () => {
    if (disabled) return;
    const volume = volumeOptions[currentIndex];
    const quantity = getQuantity();
    onSelect(volume, quantity);
  };

  // Обработка навигации стрелками клавиатуры
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Enter' && showFindButton && currentIndex >= 0 && currentIndex < volumeOptions.length) {
        e.preventDefault();
        handleFind();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, volumeOptions, disabled, showFindButton]);

  if (volumeOptions.length === 0) {
    return null;
  }

  const currentVolume = volumeOptions[currentIndex];

  return (
    <div className="mt-4 p-4 bg-card/90 rounded-xl border border-border shadow-sm">
      <div className="text-sm font-medium mb-4 text-foreground">Какой объем вам нужен?</div>
      <div className="flex items-center gap-3">
        {/* Стрелка влево */}
        <button
          type="button"
          onClick={handlePrevious}
          disabled={disabled}
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl border border-border hover:bg-accent hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          aria-label="Предыдущий вариант"
        >
          <ChevronLeft className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
        </button>

        {/* Центральная кнопка с текущим вариантом (некликабельная, если есть showFindButton) */}
        {showFindButton ? (
          <div className="flex-1 px-6 py-4 rounded-xl border border-border bg-background/50 text-base font-semibold text-center">
            {currentVolume}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleFind}
            disabled={disabled}
            className="flex-1 px-6 py-4 rounded-xl border border-border hover:bg-accent hover:border-primary/50 hover:shadow-sm text-base font-semibold transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {currentVolume}
          </button>
        )}

        {/* Стрелка вправо */}
        <button
          type="button"
          onClick={handleNext}
          disabled={disabled}
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl border border-border hover:bg-accent hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          aria-label="Следующий вариант"
        >
          <ChevronRight className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
        </button>
      </div>
      
      {/* Индикатор текущей позиции */}
      {volumeOptions.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {volumeOptions.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-6 bg-primary'
                  : 'w-1.5 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Кнопка "Найти" */}
      {showFindButton && (
        <button
          type="button"
          onClick={handleFind}
          disabled={disabled}
          className="w-full mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          Найти
        </button>
      )}
    </div>
  );
}

export function BuyerHome() {
  const navigate = useNavigate();
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
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  // Состояние для хранения количества для каждого сообщения
  const [messageQuantities, setMessageQuantities] = useState<Record<string, number>>({});
  // Состояние для массового поиска
  const [showBatchSearch, setShowBatchSearch] = useState(false);
  const [batchProductIds, setBatchProductIds] = useState<string>('');
  const [batchSearching, setBatchSearching] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  // Очищаем URL объектов изображений при размонтировании
  useEffect(() => {
    return () => {
      messages.forEach((message) => {
        if (message.imageUrl && message.imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(message.imageUrl);
        }
      });
    };
  }, [messages]);

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

      const sessionResponse = await api.post('/customers/sessions', {
        deviceId,
        userAgent,
      });
      const createdSessionId = sessionResponse.data?.sessionId;
      if (!createdSessionId) {
        toast.error('Не удалось создать сессию покупателя.');
        return null;
      }
      setSessionId(createdSessionId);

      const convoResponse = await api.post('/customers/conversations', {
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

  // Автоматический запрос геолокации при загрузке страницы
  useEffect(() => {
    requestGeo();
  }, []);

  useEffect(() => {
    const init = async () => {
      const initData = await ensureSessionAndConversation();
      if (!initData) return;

      try {
        const convo = await api.get(`/customers/conversations/${initData.conversationId}`);
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

  // Функция для извлечения количества из текста
  const extractQuantity = (text: string): number | null => {
    // Паттерны для поиска количества в тексте
    const patterns = [
      /(\d+)\s*шт/i,           // "20 шт", "20шт"
      /(\d+)\s*штук/i,         // "20 штук"
      /нужно\s+(\d+)/i,        // "нужно 20"
      /надо\s+(\d+)/i,         // "надо 15"
      /хочу\s+(\d+)/i,         // "хочу 10"
      /купить\s+(\d+)/i,       // "купить 5"
      /возьму\s+(\d+)/i,       // "возьму 30"
      /(\d+)\s*(?:единиц|штучек|упаковок)/i, // "20 единиц", "20 упаковок"
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const quantity = parseInt(match[1], 10);
        if (quantity > 0 && quantity < 10000) { // Разумное ограничение
          return quantity;
        }
      }
    }
    return null;
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
    const storesMap = new Map<string, StoreResult>();

    // Обрабатываем items (старый формат)
    if (Array.isArray(data?.items)) {
      data.items.forEach((entry: any) => {
        const product = entry?.product ?? {};
        const offers = Array.isArray(entry?.offers) ? entry.offers : [];
        offers.forEach((offer: any) => {
          // Пропускаем товары, которых нет в наличии
          if (offer.isAvailable !== true) {
            return;
          }
          const store = offer?.store ?? {};
          const storeId = store.id ?? store.name ?? `store-${Math.random()}`;
          const existing = storesMap.get(storeId);
          const item = {
            name: product.name ?? 'Товар',
            price: offer.price != null ? `${offer.price} ${offer.currency ?? '₸'}`.trim() : undefined,
            availability: offer.isAvailable ? 'в наличии' : 'нет',
            allocatedQuantity: offer.allocatedQuantity,
          };
          if (existing) {
            existing.items.push(item);
          } else {
            const distance = store.distanceFormatted ?? formatDistance(store.distanceMeters ?? store.distance);
            const locationLink = typeof store.location === 'string'
              ? store.location
              : (store.location?.link ?? 'https://2gis.kz');

            storesMap.set(storeId, {
              storeName: store.name ?? 'Магазин',
              distance,
              address: store.address ?? '—',
              updatedAgo: formatUpdated(offer.updatedAt),
              deeplink: locationLink,
              items: [item],
            });
          }
        });
      });
    }

    // Обрабатываем candidates с offers (новый формат)
    if (Array.isArray(data?.candidates)) {
      data.candidates.forEach((candidate: any) => {
        const productName = candidate.name ?? 'Товар';
        const offers = Array.isArray(candidate?.offers) ? candidate.offers : [];

        offers.forEach((offer: any) => {
          // Пропускаем товары, которых нет в наличии
          if (offer.isAvailable !== true) {
            return;
          }
          const store = offer?.store ?? {};
          const storeId = store.id ?? store.name ?? `store-${Math.random()}`;
          const existing = storesMap.get(storeId);

          const item = {
            name: productName,
            price: offer.price != null ? `${offer.price} ${offer.currency ?? '₸'}`.trim() : undefined,
            availability: offer.isAvailable !== false ? 'в наличии' : 'нет',
            allocatedQuantity: offer.allocatedQuantity,
          };

          if (existing) {
            // Проверяем, нет ли уже такого товара в этом магазине
            const itemExists = existing.items.some(i => i.name === productName);
            if (!itemExists) {
              existing.items.push(item);
            }
          } else {
            // Используем distanceFormatted если есть, иначе форматируем distanceMeters
            const distance = store.distanceFormatted ?? (store.distanceMeters != null
              ? formatDistance(store.distanceMeters)
              : '—');

            // Используем location как ссылку на 2GIS
            const locationLink = typeof store.location === 'string'
              ? store.location
              : (store.location?.link ?? 'https://2gis.kz');

            storesMap.set(storeId, {
              storeName: store.name ?? 'Магазин',
              distance,
              address: store.address ?? '—',
              updatedAgo: formatUpdated(offer.updatedAt),
              deeplink: locationLink,
              items: [item],
            });
          }
        });
      });
    }

    // Фильтруем магазины, у которых нет товаров в наличии
    return Array.from(storesMap.values()).filter(store =>
      store.items.some(item => item.availability === 'в наличии')
    );
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

    // Извлекаем количество из текста, если указано
    const requestedQuantity = extractQuantity(text);

    const payload: any = {
      text,
      attachments: [],
    };

    if (geoValue) {
      payload.geo = geoValue;
      payload.radiusMeters = Math.round(radiusKm * 1000);
    }

    // Добавляем requestedQuantity если найдено в тексте
    if (requestedQuantity !== null) {
      payload.requestedQuantity = requestedQuantity;
    }

    setSending(true);
    try {
      const response = await api.post(
        `/customers/conversations/${initData.conversationId}/messages`,
        payload
      );

      const responseData = response.data;
      const state = responseData?.state;
      const requestId = responseData?.requestId;

      console.log('POST response data:', responseData);
      console.log('RequestId from response:', requestId);

      // Определяем, есть ли вопросы или уточнения (значит поиск еще не завершен)
      const hasQuestions = Array.isArray(responseData?.questions) && responseData.questions.length > 0;
      // Поиск в процессе, если есть вопросы ИЛИ нет requestId (новый поиск начат)
      const isSearchInProgress = hasQuestions || !requestId;
      // Поиск завершен только если есть requestId (результаты готовы)
      const isSearchCompleted = !!requestId;

      // Добавляем ответ системы
      const assistantMessage: Message = {
        id: responseData?.messageId ?? `assistant-${Date.now()}`,
        role: 'assistant',
        text: hasQuestions
          ? responseData.questions.join('\n')
          : responseData?.text || 'Обрабатываю ваш запрос...',
        quickReplies: responseData?.quickReplies,
        remainingProducts: responseData?.remainingProducts,
        // Показываем selectedProduct только если поиск завершен (есть requestId)
        // и это не новый поиск с вопросами
        selectedProduct: (isSearchCompleted && !hasQuestions) ? responseData?.selectedProduct : undefined,
        candidates: responseData?.candidates,
        fulfillmentInfo: responseData?.fulfillmentInfo,
        isVolumeSelection: responseData?.isVolumeSelection === true,
        volumeOptions: responseData?.volumeOptions || (responseData?.isVolumeSelection ? ['250 мл', '330 мл'] : undefined),
        needsQuantityInput: responseData?.needsQuantityInput === true,
        defaultQuantity: responseData?.defaultQuantity ?? 1,
        matchedProducts: responseData?.matchedProducts || undefined,
      };

      // Если есть requestId, запрашиваем полные результаты поиска
      if (requestId) {
        console.log(`Fetching search results for requestId: ${requestId}`);
        console.log(`Full URL will be: /customers/search/${requestId}`);
        try {
          const searchUrl = `/customers/search/${requestId}`;
          console.log(`Making GET request to: ${searchUrl}`);
          const searchResponse = await api.get(searchUrl);
          console.log('Search response status:', searchResponse.status);
          const searchData = searchResponse.data;
          console.log('Search results data:', searchData);

          // Нормализуем результаты из полного ответа
          const results = normalizeResults(searchData);
          console.log('Normalized results:', results);

          // Получаем информацию о товаре из результатов
          const productName = searchData?.items?.[0]?.product?.name || responseData?.selectedProduct?.name || 'товар';
          const productInfo = searchData?.items?.[0]?.product;

          // Обновляем selectedProduct только если поиск завершен (есть requestId)
          // и есть информация о товаре в результатах
          if (productInfo) {
            assistantMessage.selectedProduct = {
              id: productInfo.id,
              name: productInfo.name,
              brandName: productInfo.brandName,
              packageInfo: productInfo.packageInfo,
              images: productInfo.images || null,
            };
          } else if (responseData?.selectedProduct && results.length === 0 && isSearchCompleted) {
            // Если товар найден, но магазинов нет, показываем информацию о товаре
            // только если поиск завершен (есть requestId)
            assistantMessage.selectedProduct = responseData.selectedProduct;
          } else {
            // Если это новый поиск или поиск в процессе, не показываем selectedProduct
            assistantMessage.selectedProduct = undefined;
          }

          if (results.length > 0) {
            assistantMessage.results = results;
            assistantMessage.text = `Найдено ${results.length} магазин(ов) с товаром "${productName}"`;
          } else if (productInfo || responseData?.selectedProduct) {
            // Товар найден, но магазинов нет в радиусе
            assistantMessage.text = `Товар "${productName}" найден, но не доступен в ближайших магазинах в радиусе ${radiusKm} км. Попробуйте увеличить радиус поиска.`;
          } else {
            // Товар не найден вообще
            assistantMessage.text = 'Товар не найден в ближайших магазинах';
            assistantMessage.selectedProduct = undefined;
          }
        } catch (searchError: any) {
          console.error('Ошибка получения результатов поиска', searchError);
          console.error('Error details:', searchError?.response?.data);
          // Если не удалось получить результаты, используем данные из первоначального ответа
          const hasItems = Array.isArray(responseData?.items) && responseData.items.length > 0;
          const hasCandidates = Array.isArray(responseData?.candidates) && responseData.candidates.length > 0;

          if (hasItems || hasCandidates) {
            const results = normalizeResults(responseData);
            if (results.length > 0) {
              assistantMessage.results = results;
              assistantMessage.text = `Найдено ${results.length} магазин(ов) с товаром "${responseData?.selectedProduct?.name || 'товар'}"`;
            } else {
              assistantMessage.text = 'Товар не найден в ближайших магазинах';
            }
          } else if (state === 'DONE') {
            assistantMessage.text = 'Товар не найден в ближайших магазинах';
          }
        }
      } else {
        console.log('No requestId in response, using initial response data');
        // Если нет requestId, используем данные из первоначального ответа
        const hasItems = Array.isArray(responseData?.items) && responseData.items.length > 0;
        const hasCandidates = Array.isArray(responseData?.candidates) && responseData.candidates.length > 0;
        const hasResults = hasItems || hasCandidates;

        if (hasResults) {
          const results = normalizeResults(responseData);
          if (results.length > 0) {
            assistantMessage.results = results;
            // Показываем selectedProduct только если поиск завершен (state === 'DONE')
            if (state === 'DONE' && responseData?.selectedProduct) {
              assistantMessage.selectedProduct = responseData.selectedProduct;
            } else {
              assistantMessage.selectedProduct = undefined;
            }
            assistantMessage.text = `Найдено ${results.length} магазин(ов) с товаром "${responseData?.selectedProduct?.name || 'товар'}"`;
          } else {
            assistantMessage.text = 'Товар не найден в ближайших магазинах';
            // Не показываем selectedProduct, если результатов нет
            assistantMessage.selectedProduct = undefined;
          }
        } else if (state === 'DONE') {
          assistantMessage.text = 'Товар не найден в ближайших магазинах';
          assistantMessage.selectedProduct = undefined;
        } else {
          // Если поиск в процессе (есть вопросы или нет requestId), не показываем selectedProduct
          assistantMessage.selectedProduct = undefined;
        }
      }

      setMessages((prev) => [...prev, assistantMessage]);

      // Если нужно уточнение и есть selectedProduct, показываем его только если поиск завершен
      // и это не новый поиск с вопросами
      if (responseData?.selectedProduct && isSearchCompleted && !hasQuestions && assistantMessage.selectedProduct) {
        // Не показываем toast, так как информация уже в сообщении
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

  const startVoiceRecognition = () => {
    const SpeechRecognitionClass = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!SpeechRecognitionClass) {
      toast.error('Распознавание речи не поддерживается в вашем браузере');
      return;
    }

    const recognition = new SpeechRecognitionClass() as SpeechRecognition;

    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
      toast.info('Говорите...');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      console.error('Ошибка распознавания речи:', event.error);
      setIsRecording(false);
      recognitionRef.current = null;

      if (event.error === 'no-speech') {
        toast.error('Речь не обнаружена');
      } else if (event.error === 'audio-capture') {
        toast.error('Микрофон недоступен');
      } else if (event.error === 'not-allowed') {
        toast.error('Доступ к микрофону запрещен');
      } else {
        toast.error('Ошибка распознавания речи');
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      console.error('Ошибка запуска распознавания:', error);
      toast.error('Не удалось запустить распознавание речи');
      setIsRecording(false);
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsRecording(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение');
      return;
    }

    // Проверяем размер файла (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Размер изображения не должен превышать 10MB');
      return;
    }

    sendImage(file);

    // Сбрасываем input, чтобы можно было выбрать тот же файл снова
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendImage = async (file: File) => {
    // Создаем URL для предпросмотра изображения
    const imageUrl = URL.createObjectURL(file);

    // Добавляем сообщение пользователя с изображением
    const userMessage: Message = {
      id: `user-image-${Date.now()}`,
      role: 'user',
      text: '',
      imageUrl,
    };
    setMessages((prev) => [...prev, userMessage]);

    setUploadingImage(true);

    try {
      // Получаем геолокацию
      const geoFromLink = locationLink ? parse2GisLink(locationLink) : null;
      const geoValue =
        geoState.status === 'granted'
          ? { lat: geoState.lat, lng: geoState.lng }
          : geoFromLink ?? undefined;

      // Создаем FormData для отправки изображения
      const formData = new FormData();
      formData.append('image', file);

      if (geoValue) {
        formData.append('geo', JSON.stringify(geoValue));
      }

      if (radiusKm) {
        formData.append('radiusMeters', (radiusKm * 1000).toString());
      }

      // Пытаемся получить conversationId, но не блокируем отправку, если его нет
      const initData = await ensureSessionAndConversation();
      if (initData?.conversationId) {
        formData.append('conversationId', initData.conversationId);
      }

      // Отправляем изображение на API
      const response = await api.post('/customers/search-by-image', formData);

      const responseData = response.data;

      // Проверяем успешность операции
      if (responseData.success === false) {
        const assistantMessage: Message = {
          id: `assistant-image-${Date.now()}`,
          role: 'assistant',
          text: responseData.message || 'Товар не найден в базе данных',
          imageAnalysis: responseData.imageAnalysis,
          candidates: responseData.candidates || [],
        };
        setMessages((prev) => [...prev, assistantMessage]);
        return;
      }

      // Создаем простое сообщение со списком найденных товаров
      const candidates = responseData.candidates || [];
      const totalCandidates = candidates.length;

      let text = '';
      if (totalCandidates > 0) {
        text = `Найдено ${totalCandidates} товар(ов). Выберите товар для просмотра ближайшего магазина:`;
      } else {
        text = 'Товар не найден. Попробуйте другое изображение.';
      }

      const assistantMessage: Message = {
        id: `assistant-image-${Date.now()}`,
        role: 'assistant',
        text,
        candidates: candidates,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Ошибка отправки изображения', error);

      let errorMessage = 'Не удалось обработать изображение';
      if (error?.response?.status === 400) {
        errorMessage = error?.response?.data?.message || 'Неверный формат изображения';
      } else if (error?.response?.status === 500) {
        errorMessage = 'Ошибка при анализе изображения. Попробуйте еще раз.';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);

      // Добавляем сообщение об ошибке
      setMessages((prev) => [
        ...prev,
        {
          id: `error-image-${Date.now()}`,
          role: 'system',
          text: errorMessage,
        },
      ]);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleBatchSearch = async () => {
    const initData = await ensureSessionAndConversation();
    if (!initData) return;

    // Парсим список названий товаров из текста
    const productNames = batchProductIds
      .split(/[,\n]+/)
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (productNames.length === 0) {
      toast.error('Введите хотя бы одно название товара');
      return;
    }

    const geoFromLink = locationLink ? parse2GisLink(locationLink) : null;
    const geoValue =
      geoState.status === 'granted'
        ? { lat: geoState.lat, lng: geoState.lng }
        : geoFromLink ?? undefined;

    if (!geoValue) {
      toast.error('Необходимо указать геолокацию для массового поиска');
      return;
    }

    setBatchSearching(true);
    try {
      const response = await api.post(
        `/customers/conversations/${initData.conversationId}/messages/batch`,
        {
          productNames,
          geo: geoValue,
          radiusMeters: Math.round(radiusKm * 1000),
        }
      );

      const batchResults: BatchSearchResults = response.data;

      // Добавляем сообщение пользователя
      const userMessage: Message = {
        id: `user-batch-${Date.now()}`,
        role: 'user',
        text: `Поиск: ${productNames.join(', ')}`,
      };
      setMessages((prev) => [...prev, userMessage]);

      // Добавляем сообщение с результатами
      const foundCount = batchResults.found?.length || 0;
      const notFoundCount = batchResults.notFound?.length || 0;
      
      let resultText = '';
      if (foundCount > 0 && notFoundCount > 0) {
        resultText = `Найдено: ${foundCount} товар(ов)\nНе найдено: ${notFoundCount} товар(ов)`;
      } else if (foundCount > 0) {
        resultText = `Найдено: ${foundCount} товар(ов)`;
      } else if (notFoundCount > 0) {
        resultText = `Не найдено: ${notFoundCount} товар(ов)`;
      } else {
        resultText = 'Товары не найдены';
      }

      const assistantMessage: Message = {
        id: `assistant-batch-${Date.now()}`,
        role: 'assistant',
        text: resultText,
        batchResults,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      setShowBatchSearch(false);
      setBatchProductIds('');
      toast.success('Поиск завершен');
    } catch (error: any) {
      console.error('Ошибка массового поиска', error);
      toast.error(error?.response?.data?.message || 'Не удалось выполнить массовый поиск');
    } finally {
      setBatchSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center p-0 sm:p-4">
      <div className="w-full h-full sm:h-[90vh] sm:max-h-[800px] sm:max-w-xl sm:rounded-xl bg-card sm:border sm:border-border shadow-lg flex flex-col overflow-hidden">
        {/* Закрепленная верхняя часть */}
        <div className="flex-shrink-0 bg-card/95 backdrop-blur-sm border-b border-border p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 bg-primary/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold">Покупатель</h1>
                <p className="text-xs text-muted-foreground">
                  Чат‑поиск продуктов рядом
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
              title="Выход"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground">Радиус поиска</label>
            <div className="flex gap-2 flex-wrap">
              {[0.5, 1, 2, 3].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRadiusKm(value)}
                  className={`px-2 sm:px-3 py-1.5 rounded-full border text-xs whitespace-nowrap flex-shrink-0 ${radiusKm === value
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
              className="flex-shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm min-w-[44px]"
              disabled={geoState.status === 'requesting'}
              title={geoState.status === 'requesting' ? 'Запрашиваем…' : 'Геолокация'}
            >
              <Navigation className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{geoState.status === 'requesting' ? 'Запрашиваем…' : 'Геолокация'}</span>
            </button>
            <input
              type="text"
              value={locationLink}
              onChange={(e) => handleLocationChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLocationChange(locationLink);
                }
              }}
              placeholder="Ссылка 2ГИС"
              className="flex-1 min-w-0 px-2 sm:px-3 py-2 bg-input-background border border-border rounded-md text-base sm:text-sm"
              pattern="https://2gis\\.kz/[a-z-]+/geo/\\d+/-?\\d+(?:\\.\\d+)?,-?\\d+(?:\\.\\d+)?"
              title="Ссылка должна быть в формате https://2gis.kz/astana/geo/9570784901748102/71.411775,51.123502"
            />
            <button
              type="button"
              onClick={() => handleLocationChange(locationLink)}
              disabled={!locationLink.trim()}
              className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              title="Подтвердить ссылку"
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Прокручиваемая область чата */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 p-3 sm:p-4 bg-background/50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : message.role === 'system'
                    ? 'bg-muted/80 text-muted-foreground'
                    : 'bg-card border border-border/50 text-foreground'
                  }`}
              >
                {message.imageUrl && (
                  <div className="mb-2 rounded-lg overflow-hidden">
                    <img
                      src={message.imageUrl}
                      alt="Загруженное изображение"
                      className="max-w-full max-h-64 object-contain bg-background/50 rounded-lg"
                    />
                  </div>
                )}
                {message.text && <div className="whitespace-pre-wrap">{message.text}</div>}

                {/* Отображаем matchedProducts как карточки с изображениями, только если нет флагов выбора объема/количества */}
                {message.matchedProducts && message.matchedProducts.length > 0 && !message.isVolumeSelection && !message.needsQuantityInput && (
                  <div className="mt-4 space-y-2">
                    {message.matchedProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          // Отправляем сообщение с названием товара
                          const userMessage: Message = {
                            id: `user-product-${Date.now()}`,
                            role: 'user',
                            text: product.name,
                          };
                          setMessages((prev) => [...prev, userMessage]);
                          sendMessage(product.name);
                        }}
                        disabled={sending}
                        className="w-full text-left border border-border rounded-xl p-3 bg-card/80 hover:bg-card hover:border-primary/30 transition-all hover:shadow-md group"
                      >
                        <div className="flex items-center gap-3">
                          {/* Изображение товара */}
                          {product.images && product.images.length > 0 && product.images[0] && (
                            <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-border bg-background/50 group-hover:border-primary/50 transition-colors">
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Скрываем изображение при ошибке загрузки
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          {/* Информация о товаре */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                              {product.name}
                            </div>
                            {product.brandName && (
                              <div className="text-xs text-muted-foreground mb-1">
                                {product.brandName}
                              </div>
                            )}
                            {product.packageInfo && (
                              <div className="text-xs text-muted-foreground">
                                {product.packageInfo}
                              </div>
                            )}
                          </div>
                          <Navigation className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {message.candidates && message.candidates.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {message.candidates
                      .filter((candidate) => {
                        // Фильтруем кандидатов: показываем только те, у которых есть доступные предложения
                        const offers = Array.isArray(candidate?.offers) ? candidate.offers : [];
                        return offers.some((offer: any) => offer.isAvailable === true);
                      })
                      .map((candidate, idx) => {
                        const offers = Array.isArray(candidate?.offers) ? candidate.offers : [];
                        const availableOffers = offers.filter((offer: any) => offer.isAvailable === true);
                        const hasOffers = availableOffers.length > 0;

                        return (
                          <button
                            key={candidate.id || idx}
                            type="button"
                            onClick={() => {
                              // Находим доступные предложения (только те, что в наличии)
                              const availableOffers = offers.filter((offer: any) => offer.isAvailable === true);

                              if (availableOffers.length === 0) {
                                toast.info('Товар не найден в наличии');
                                return;
                              }

                              // Сортируем по расстоянию (ближайшие первыми) и берем только ближайший
                              const sortedOffers = [...availableOffers].sort((a: any, b: any) => {
                                const distA = a.store?.distanceMeters ?? Infinity;
                                const distB = b.store?.distanceMeters ?? Infinity;
                                return distA - distB;
                              });

                              // Берем только ближайший магазин (первый в отсортированном списке)
                              const nearestOffer = sortedOffers[0];
                              const nearestStore = nearestOffer?.store;

                              if (!nearestStore) {
                                toast.info('Информация о магазине недоступна');
                                return;
                              }

                              // Формируем результат для ближайшего магазина
                              const distance = nearestStore.distanceFormatted ?? (nearestStore.distanceMeters != null
                                ? formatDistance(nearestStore.distanceMeters)
                                : '—');

                              const locationLink = typeof nearestStore.location === 'string'
                                ? nearestStore.location
                                : (nearestStore.location?.link ?? 'https://2gis.kz');

                              const storeResult: StoreResult = {
                                storeName: nearestStore.name ?? 'Магазин',
                                distance,
                                address: nearestStore.address ?? '—',
                                updatedAgo: formatUpdated(nearestOffer.updatedAt),
                                deeplink: locationLink,
                                items: [{
                                  name: candidate.name,
                                  price: nearestOffer.price != null ? `${nearestOffer.price} ${nearestOffer.currency ?? '₸'}`.trim() : undefined,
                                  availability: 'в наличии',
                                  allocatedQuantity: nearestOffer.allocatedQuantity,
                                }],
                              };

                              const storeMessage: Message = {
                                id: `store-${candidate.id}-${Date.now()}`,
                                role: 'assistant',
                                text: `Ближайший магазин для "${candidate.name}":`,
                                selectedProduct: {
                                  id: candidate.id,
                                  name: candidate.name,
                                  brandName: candidate.brandName,
                                  packageInfo: candidate.packageInfo,
                                },
                                results: [storeResult],
                              };

                              setMessages((prev) => [...prev, storeMessage]);
                            }}
                            className="w-full text-left border border-border rounded-xl p-3 bg-card/80 hover:bg-card transition-all hover:shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{candidate.name}</div>
                                {hasOffers && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Доступно в {availableOffers.length} магазин(ах)
                                  </div>
                                )}
                              </div>
                              <Navigation className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}

                {message.selectedProduct && (
                  <div className="mt-4 p-3 bg-card/90 rounded-xl border border-border shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold mb-3">
                      <Package className="w-4 h-4 text-primary" />
                      Найден товар:
                    </div>
                    <div className="flex gap-3">
                      {/* Изображение товара */}
                      {message.selectedProduct.images && message.selectedProduct.images.length > 0 && message.selectedProduct.images[0] && (
                        <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-border bg-background/50">
                          <img
                            src={message.selectedProduct.images[0]}
                            alt={message.selectedProduct.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Скрываем изображение при ошибке загрузки
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {/* Информация о товаре */}
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="font-medium text-sm mb-1">{message.selectedProduct.name}</div>
                        {message.selectedProduct.brandName && (
                          <div className="text-muted-foreground mb-0.5">Бренд: {message.selectedProduct.brandName}</div>
                        )}
                        {message.selectedProduct.packageInfo && (
                          <div className="text-muted-foreground">Упаковка: {message.selectedProduct.packageInfo}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {message.fulfillmentInfo && (
                  <div className="mt-3 p-3 bg-primary/10 rounded-xl border border-primary/30 shadow-sm">
                    <div className="text-xs space-y-1">
                      <div className="font-semibold text-primary">
                        {message.fulfillmentInfo.isFullyFulfilled 
                          ? '✓ Заказ полностью укомплектован' 
                          : '⚠ Частичная доступность'}
                      </div>
                      <div className="text-muted-foreground">
                        Запрошено: <span className="font-medium text-foreground">{message.fulfillmentInfo.requestedQuantity} шт</span>
                      </div>
                      <div className="text-muted-foreground">
                        Доступно: <span className="font-medium text-foreground">{message.fulfillmentInfo.fulfilledQuantity} шт</span> из {message.fulfillmentInfo.storesCount} магазин(ов)
                      </div>
                      {message.fulfillmentInfo.remainingQuantity > 0 && (
                        <div className="text-orange-600 dark:text-orange-400 font-medium">
                          Не хватает: {message.fulfillmentInfo.remainingQuantity} шт
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {message.remainingProducts !== undefined && message.remainingProducts > 1 && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Осталось вариантов: {message.remainingProducts}
                  </div>
                )}

                {/* Показываем количество сверху, если нужно */}
                {message.needsQuantityInput && (
                  <QuantityInput
                    messageId={message.id}
                    defaultQuantity={message.defaultQuantity || 1}
                    onQuantityChange={(quantity: number) => {
                      // Сохраняем количество для этого сообщения
                      setMessageQuantities((prev) => ({
                        ...prev,
                        [message.id]: quantity,
                      }));
                    }}
                    disabled={sending}
                  />
                )}

                {/* Показываем выбор объема снизу, если нужно */}
                {message.isVolumeSelection && message.volumeOptions && (
                  <VolumeSelection
                    messageId={message.id}
                    volumeOptions={message.volumeOptions}
                    getQuantity={() => messageQuantities[message.id] || message.defaultQuantity || 1}
                    onSelect={(volume: string, quantity: number) => {
                      // При выборе объема отправляем количество и объем
                      const messageText = `${quantity} шт ${volume}`;
                      const userMessage: Message = {
                        id: `user-volume-${Date.now()}`,
                        role: 'user',
                        text: messageText,
                      };
                      setMessages((prev) => [...prev, userMessage]);
                      sendMessage(messageText);
                    }}
                    disabled={sending}
                    showFindButton={message.needsQuantityInput === true}
                  />
                )}

                {/* Показываем маленькие кнопки только если нет флагов выбора объема/количества и нет matchedProducts */}
                {message.quickReplies && message.quickReplies.length > 0 && !message.isVolumeSelection && !message.needsQuantityInput && !message.matchedProducts && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {message.quickReplies.map((reply) => (
                      <button
                        key={reply}
                        type="button"
                        onClick={() => handleQuickReply(reply)}
                        disabled={sending}
                        className="px-3 py-1.5 rounded-full bg-card border border-border text-xs hover:bg-accent hover:border-border/80 transition-all disabled:opacity-50"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                {/* Отображение результатов массового поиска */}
                {message.batchResults && (
                  <div className="mt-4 space-y-4 sm:space-y-5">
                    {/* Найденные товары */}
                    {message.batchResults.found && message.batchResults.found.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <h3 className="text-sm sm:text-base font-semibold text-green-600 dark:text-green-400">
                            Найдено: {message.batchResults.found.length} товар(ов)
                          </h3>
                        </div>
                        <div className="space-y-4 sm:space-y-5">
                          {(() => {
                            // Собираем все offers из всех товаров и группируем по магазинам
                            type StoreGroup = {
                              store: {
                                id: string;
                                name: string;
                                address: string;
                                location?: string;
                                distanceMeters?: number | null;
                                distanceFormatted?: string | null;
                              };
                              products: Array<{
                                item: BatchFoundProduct;
                                offer: typeof item.offers[0];
                                allocatedQuantity: number;
                              }>;
                            };

                            const storeGroupsMap = new Map<string, StoreGroup>();

                            message.batchResults.found.forEach((item) => {
                              const offersWithQuantity = (item.offers || [])
                                .filter(offer => offer.allocatedQuantity && offer.allocatedQuantity > 0 && offer.store);

                              offersWithQuantity.forEach((offer) => {
                                const storeId = offer.store?.id || offer.store?.name || 'unknown';
                                const existing = storeGroupsMap.get(storeId);

                                if (existing) {
                                  existing.products.push({
                                    item,
                                    offer,
                                    allocatedQuantity: offer.allocatedQuantity || 0,
                                  });
                                } else {
                                  storeGroupsMap.set(storeId, {
                                    store: offer.store!,
                                    products: [{
                                      item,
                                      offer,
                                      allocatedQuantity: offer.allocatedQuantity || 0,
                                    }],
                                  });
                                }
                              });
                            });

                            // Сортируем магазины по расстоянию
                            const storeGroups = Array.from(storeGroupsMap.values()).sort((a, b) => {
                              const distA = a.store.distanceMeters ?? Infinity;
                              const distB = b.store.distanceMeters ?? Infinity;
                              return distA - distB;
                            });

                            return storeGroups.map((storeGroup, storeIdx) => {
                              const locationLink = typeof storeGroup.store.location === 'string'
                                ? storeGroup.store.location
                                : null;

                              return (
                                <div key={storeGroup.store.id || storeIdx} className="border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-card/90 shadow-sm">
                                  {/* Заголовок магазина */}
                                  <div className="mb-3 sm:mb-4 pb-3 border-b border-border">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 text-sm sm:text-base font-semibold mb-1">
                                          <Store className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                          <span className="text-foreground">{storeGroup.store.name}</span>
                                        </div>
                                        {storeGroup.store.distanceFormatted && (
                                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
                                            <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                            <span>{storeGroup.store.distanceFormatted}</span>
                                          </div>
                                        )}
                                        {storeGroup.store.address && (
                                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                            <span className="line-clamp-2">{storeGroup.store.address}</span>
                                          </div>
                                        )}
                                      </div>
                                      {locationLink && (
                                        <a
                                          href={locationLink}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex-shrink-0 px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all text-primary font-medium whitespace-nowrap"
                                        >
                                          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5" />
                                          <span className="hidden sm:inline">2ГИС</span>
                                        </a>
                                      )}
                                    </div>
                                  </div>

                                  {/* Товары в этом магазине */}
                                  <div className="space-y-3">
                                    {storeGroup.products.map((productData, productIdx) => {
                                      const { item, allocatedQuantity } = productData;
                                      // Проверяем, есть ли еще товары этого же типа в других магазинах
                                      const totalAllocated = (item.offers || [])
                                        .filter(o => o.allocatedQuantity && o.allocatedQuantity > 0)
                                        .reduce((sum, o) => sum + (o.allocatedQuantity || 0), 0);

                                      return (
                                        <div key={`${item.product.id}-${productIdx}`} className="border border-border rounded-lg p-2 sm:p-3 bg-background/50">
                                          <div className="flex gap-2 sm:gap-3">
                                            {/* Изображение товара */}
                                            {item.product.images && item.product.images.length > 0 && item.product.images[0] && (
                                              <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-border bg-background/50">
                                                <img
                                                  src={item.product.images[0]}
                                                  alt={item.product.name}
                                                  className="w-full h-full object-cover"
                                                  onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                  }}
                                                />
                                              </div>
                                            )}
                                            {/* Информация о товаре */}
                                            <div className="flex-1 min-w-0">
                                              <div className="mb-1">
                                                <div className="text-xs text-muted-foreground mb-0.5">
                                                  Запрошено: <span className="font-medium">{item.requestedName}</span>
                                                  {item.requestedQuantity && (
                                                    <span className="ml-1">({item.requestedQuantity} шт)</span>
                                                  )}
                                                </div>
                                                <div className="font-semibold text-xs sm:text-sm text-foreground">{item.product.name}</div>
                                              </div>
                                              {item.product.brandName && (
                                                <div className="text-xs text-muted-foreground mb-1">{item.product.brandName}</div>
                                              )}
                                              {item.product.packageInfo && (
                                                <div className="text-xs text-muted-foreground mb-1">{item.product.packageInfo}</div>
                                              )}
                                              
                                              {/* Информация о количестве в этом магазине */}
                                              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                                                <div className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs sm:text-sm font-semibold">
                                                  В этом магазине: {allocatedQuantity} шт
                                                </div>
                                                {item.fulfillmentInfo && (
                                                  <div className={`text-xs font-medium ${
                                                    item.fulfillmentInfo.isFullyFulfilled
                                                      ? 'text-green-600 dark:text-green-400'
                                                      : 'text-orange-600 dark:text-orange-400'
                                                  }`}>
                                                    {item.fulfillmentInfo.isFullyFulfilled ? '✓ Полностью' : `⚠ Частично (${item.fulfillmentInfo.fulfilledQuantity}/${item.fulfillmentInfo.requestedQuantity})`}
                                                  </div>
                                                )}
                                              </div>
                                              
                                              {/* Общая информация о выполнении заказа */}
                                              {item.fulfillmentInfo && item.fulfillmentInfo.storesCount > 1 && (
                                                <div className="mt-2 text-xs text-muted-foreground">
                                                  Всего найдено: {item.fulfillmentInfo.fulfilledQuantity} шт из {item.fulfillmentInfo.storesCount} магазин(ов)
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Ненайденные товары */}
                    {message.batchResults.notFound && message.batchResults.notFound.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                            <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                          </div>
                          <h3 className="text-sm sm:text-base font-semibold text-red-600 dark:text-red-400">
                            Не найдено: {message.batchResults.notFound.length} товар(ов)
                          </h3>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          {message.batchResults.notFound.map((item, idx) => (
                            <div key={`${item.productName}-${idx}`} className="border border-red-200 dark:border-red-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-red-50/50 dark:bg-red-950/20 shadow-sm">
                              <div className="flex items-start gap-2 sm:gap-3">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-600 dark:text-red-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm sm:text-base text-red-700 dark:text-red-300 mb-1">
                                    {item.productName}
                                  </div>
                                  <div className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                                    {item.reason}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {message.results && message.results.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <h3 className="text-sm font-semibold mb-3 text-foreground">Магазины:</h3>
                    <div className="space-y-3">
                      {message.results
                        .filter((store) => {
                          // Фильтруем магазины: показываем только те, у которых есть товары в наличии
                          return store.items && store.items.some(item => item.availability === 'в наличии');
                        })
                        .map((store, idx) => (
                          <div key={`${store.storeName}-${idx}`} className="border border-border rounded-xl p-4 bg-card/90 shadow-sm hover:shadow-md transition-shadow">
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-sm font-semibold mb-1">{store.storeName}</h4>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>{store.address}</span>
                                </div>
                                {store.distance && store.distance !== '—' && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Navigation className="w-3.5 h-3.5" />
                                    <span>{store.distance}</span>
                                  </div>
                                )}
                              </div>

                              {/* Список товаров в магазине */}
                              {store.items && store.items.length > 0 && (
                                <div className="space-y-2">
                                  {store.items.map((item, itemIdx) => (
                                    <div key={itemIdx} className="p-2 bg-background/50 rounded-lg">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <div className="text-xs font-medium">{item.name}</div>
                                          {item.allocatedQuantity && (
                                            <div className="text-xs text-primary font-semibold mt-1">
                                              В наличии: {item.allocatedQuantity} шт
                                            </div>
                                          )}
                                        </div>
                                        {item.price && (
                                          <div className="text-xs font-semibold text-foreground whitespace-nowrap">
                                            {item.price}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <a
                                href={store.deeplink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 w-full text-xs px-3 py-2 rounded-lg border border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all text-primary font-medium"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                                Открыть в 2ГИС
                              </a>
                            </div>
                          </div>
                        ))}
                    </div>
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
          {uploadingImage && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-accent/60 text-foreground">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-muted-foreground text-xs">Анализирую изображение...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Закрепленная нижняя часть */}
        <div className="flex-shrink-0 bg-card/95 backdrop-blur-sm border-t border-border p-3 sm:p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setShowBatchSearch(true)}
              disabled={sending || uploadingImage || isRecording || batchSearching}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="Массовый поиск товаров"
            >
              <ShoppingBasket className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleAttachClick}
              disabled={sending || uploadingImage || isRecording}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="Прикрепить изображение"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишите, что ищете..."
              className="flex-1 min-w-0 px-2 sm:px-3 py-2 bg-input-background border border-border rounded-md text-base sm:text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={sending || uploadingImage || isRecording}
            />
            <button
              type="button"
              onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
              disabled={sending || uploadingImage}
              className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border transition-colors flex-shrink-0 ${isRecording
                ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                : 'border-border hover:bg-muted'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isRecording ? 'Остановить запись' : 'Голосовое сообщение'}
            >
              <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || sending || uploadingImage || isRecording}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно для массового поиска */}
      {showBatchSearch && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowBatchSearch(false);
              setBatchProductIds('');
            }
          }}
        >
          <div className="bg-card border border-border rounded-xl sm:rounded-2xl shadow-xl max-w-lg w-full p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ShoppingBasket className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold">Массовый поиск</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Список товаров</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowBatchSearch(false);
                  setBatchProductIds('');
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm sm:text-base font-medium block mb-2">
                  Названия товаров
                </label>
                <textarea
                  value={batchProductIds}
                  onChange={(e) => setBatchProductIds(e.target.value)}
                  placeholder="Введите названия товаров:&#10;&#10;Coca-Cola&#10;Хлеб&#10;Молоко&#10;&#10;Или через запятую:&#10;Coca-Cola, Хлеб, Молоко"
                  disabled={batchSearching}
                  className="w-full min-h-[140px] sm:min-h-[160px] px-3 sm:px-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-lg sm:rounded-xl text-base resize-none disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all placeholder:text-muted-foreground/60"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-primary font-semibold">i</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Введите названия товаров, разделенные запятыми или переносами строк. Каждое название будет обработано отдельно.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowBatchSearch(false);
                  setBatchProductIds('');
                }}
                disabled={batchSearching}
                className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 border border-border rounded-lg sm:rounded-xl hover:bg-muted transition-colors disabled:opacity-50 font-medium text-sm sm:text-base"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleBatchSearch}
                disabled={batchSearching || !batchProductIds.trim()}
                className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg sm:rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base shadow-md hover:shadow-lg"
              >
                {batchSearching ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Поиск...
                  </span>
                ) : (
                  'Найти товары'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
}
