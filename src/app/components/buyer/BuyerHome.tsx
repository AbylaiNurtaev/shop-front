import React, { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin, Search, Mic, Paperclip, Store, Package, Image as ImageIcon, X } from 'lucide-react';
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
  imageUrl?: string;
  imageAnalysis?: {
    productName?: string;
    brand?: string;
    packageType?: string;
    packageInfo?: string;
    type?: string;
    description?: string;
  };
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
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-xl bg-card border border-border rounded-lg shadow-sm flex flex-col h-[90vh] max-h-[800px]">
        {/* Закрепленная верхняя часть */}
        <div className="sticky top-0 z-10 bg-card border-b border-border p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3">
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
              placeholder="Ссылка 2ГИС"
              className="flex-1 min-w-0 px-2 sm:px-3 py-2 bg-input-background border border-border rounded-md text-xs sm:text-sm"
              pattern="https://2gis\\.kz/[a-z-]+/geo/\\d+/-?\\d+(?:\\.\\d+)?,-?\\d+(?:\\.\\d+)?"
              title="Ссылка должна быть в формате https://2gis.kz/astana/geo/9570784901748102/71.411775,51.123502"
            />
          </div>
        </div>

        {/* Прокручиваемая область чата */}
        <div className="flex-1 overflow-y-auto space-y-3 p-3 sm:p-4 pr-1">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : message.role === 'system'
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-accent/60 text-foreground'
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

                {message.candidates && message.candidates.length > 0 && (
                  <div className="mt-3 space-y-2">
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
                            className="w-full text-left border border-border rounded-lg p-3 bg-background/50 hover:bg-background/70 transition-colors"
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
                  <div className="mt-3">
                    {message.results
                      .filter((store) => {
                        // Фильтруем магазины: показываем только те, у которых есть товары в наличии
                        return store.items && store.items.some(item => item.availability === 'в наличии');
                      })
                      .map((store, idx) => (
                        <div key={`${store.storeName}-${idx}`} className="border border-border rounded-lg p-4 bg-background/80">
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

                            <a
                              href={store.deeplink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-2 w-full text-xs px-3 py-2 rounded-md border border-primary/30 hover:bg-primary/10 transition-colors text-primary font-medium"
                            >
                              <MapPin className="w-3.5 h-3.5" />
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
        <div className="sticky bottom-0 z-10 bg-card border-t border-border p-3 sm:p-4">
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
              className="flex-1 min-w-0 px-2 sm:px-3 py-2 bg-input-background border border-border rounded-md text-xs sm:text-sm"
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
    </div>
  );
}
