import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle2, XCircle, Loader2, Receipt, History, TrendingUp, Camera, X, Wallet, CreditCard } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../api/axios';
import { toast } from 'sonner';
import { ScrollToTopButton } from '../ui/scroll-to-top-button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

interface SaleItem {
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
  currency: string;
}

interface Sale {
  id: string;
  storeId: string;
  sellerId: string;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  items: SaleItem[];
  totalAmount: number;
  currency: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface CurrentSaleResponse {
  sale: Sale;
}

interface AddItemResponse {
  message: string;
  sale: Sale;
}

export function POS() {
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [scannedSku, setScannedSku] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | 'hybrid' | null>(null);
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [cashInput, setCashInput] = useState('');
  const [cardInput, setCardInput] = useState('');
  const skuInputRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = 'pos-camera';

  // Загрузка текущего чека при монтировании
  useEffect(() => {
    loadCurrentSale();
  }, []);

  // Автофокус на поле ввода артикула
  useEffect(() => {
    if (!showHistory) {
      skuInputRef.current?.focus();
    }
  }, [showHistory, currentSale]);

  // Очистка сканера при размонтировании
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => { });
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    // Проверяем, находимся ли мы в безопасном контексте (HTTPS или localhost)
    const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isSecureContext) {
      toast.error('Доступ к камере возможен только через HTTPS или localhost. Текущий протокол: ' + location.protocol);
      return;
    }

    // Базовая проверка поддержки (но не строгая, так как Html5Qrcode сам проверит)
    if (typeof navigator === 'undefined' || (!navigator.mediaDevices && !(navigator as any).getUserMedia && !(navigator as any).webkitGetUserMedia)) {
      console.warn('MediaDevices API может быть недоступен, но попробуем запустить камеру через Html5Qrcode');
    }

    setIsScanning(true);

    // Увеличиваем задержку для мобильных устройств
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const delay = isMobile ? 300 : 100;

    setTimeout(async () => {
      const element = document.getElementById(qrCodeRegionId);
      if (!element) {
        toast.error('Ошибка: элемент для камеры не найден');
        setIsScanning(false);
        return;
      }

      try {
        const scanner = new Html5Qrcode(qrCodeRegionId);
        scannerRef.current = scanner;

        // Адаптивная конфигурация для мобильных и десктопных устройств
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const qrboxSize = isMobile 
          ? Math.min(viewportWidth * 0.8, viewportHeight * 0.4, 300)
          : 250;

        const config: any = {
          fps: 10,
          qrbox: { width: qrboxSize, height: qrboxSize },
        };

        // aspectRatio может вызывать проблемы на некоторых мобильных устройствах
        if (!isMobile) {
          config.aspectRatio = 1.0;
        }

        const onScanError = (errorMessage: string) => {
          // Игнорируем ошибки сканирования (пока функциональность не реализована)
        };

        try {
          // Пробуем с facingMode (предпочтительно для мобильных)
          await scanner.start(
            { facingMode: 'environment' },
            config,
            (decodedText: string) => {
              // Пока просто игнорируем отсканированный код
              // В будущем здесь будет обработка сканирования
              console.log('Отсканировано:', decodedText);
            },
            onScanError
          );
        } catch (facingModeError: any) {
          console.warn('Не удалось запустить с facingMode, пробуем список камер', facingModeError);

          // Если не получилось, пробуем через список камер
          try {
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
              // На мобильных устройствах ищем заднюю камеру
              const backCamera = cameras.find(device =>
                device.label.toLowerCase().includes('back') ||
                device.label.toLowerCase().includes('rear') ||
                device.label.toLowerCase().includes('environment')
              );
              const cameraId = backCamera ? backCamera.id : cameras[0].id;

              await scanner.start(
                cameraId,
                config,
                (decodedText: string) => {
                  // Пока просто игнорируем отсканированный код
                  console.log('Отсканировано:', decodedText);
                },
                onScanError
              );
            } else {
              throw new Error('Камеры не найдены');
            }
          } catch (camerasError: any) {
            // Если и это не сработало, пробрасываем исходную ошибку
            throw facingModeError;
          }
        }
      } catch (error: any) {
        console.error('Ошибка запуска камеры', error);
        setIsScanning(false);

        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
            scannerRef.current.clear();
          } catch (e) {
            console.error('Ошибка очистки сканера', e);
          }
          scannerRef.current = null;
        }

        const errorName = error?.name || '';
        const errorMessage = error?.message || '';

        if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError' || errorMessage.includes('permission')) {
          toast.error('Доступ к камере запрещен. Разрешите доступ в настройках браузера.');
        } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError' || errorMessage.includes('not found')) {
          toast.error('Камера не найдена. Убедитесь, что камера подключена.');
        } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError' || errorMessage.includes('not readable')) {
          toast.error('Камера уже используется другим приложением.');
        } else if (errorName === 'OverconstrainedError' || errorMessage.includes('constraint')) {
          toast.error('Камера не поддерживает требуемые параметры.');
        } else if (errorMessage.includes('HTTPS') || errorMessage.includes('secure context')) {
          toast.error('Доступ к камере возможен только через HTTPS.');
        } else {
          toast.error(`Не удалось запустить камеру: ${errorMessage || errorName || 'Неизвестная ошибка'}`);
        }
      }
    }, delay);
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (error) {
        console.error('Ошибка остановки камеры', error);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const loadCurrentSale = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<CurrentSaleResponse>('/pos/sale/current');
      setCurrentSale(response.data.sale);
    } catch (error: any) {
      console.error('Ошибка загрузки чека', error);
      toast.error('Не удалось загрузить чек');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async (sku: string) => {
    if (!sku.trim() || !currentSale) {
      return;
    }

    setIsAdding(true);
    try {
      const response = await api.post<AddItemResponse>('/pos/sale/item', {
        saleId: currentSale.id,
        sku: sku.trim(),
        quantity: 1,
      });
      setCurrentSale(response.data.sale);
      setScannedSku('');
      toast.success('Товар добавлен в чек');
      skuInputRef.current?.focus();
    } catch (error: any) {
      console.error('Ошибка добавления товара', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Не удалось добавить товар';
      toast.error(errorMessage);
      setScannedSku('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && scannedSku.trim() && !isAdding) {
      handleScan(scannedSku);
    }
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (!currentSale) return;

    // Обновляем только локальное состояние - без запросов к API
    // Все изменения сохранятся при пробитии чека
    const item = currentSale.items.find(i => i.productId === productId);
    if (!item) return;

    // Вычисляем новые значения
    const newTotalPrice = item.price * newQuantity;
    const newTotalAmount = currentSale.totalAmount - item.totalPrice + newTotalPrice;

    // Обновляем состояние локально
    setCurrentSale({
      ...currentSale,
      items: currentSale.items.map(i =>
        i.productId === productId
          ? { ...i, quantity: newQuantity, totalPrice: newTotalPrice }
          : i
      ),
      totalAmount: newTotalAmount,
    });
  };

  const handleRemoveItem = (productId: string) => {
    if (!currentSale) return;

    // Удаляем товар только из локального состояния
    // Изменения сохранятся при пробитии чека
    const item = currentSale.items.find(i => i.productId === productId);
    if (!item) return;

    const newTotalAmount = currentSale.totalAmount - item.totalPrice;

    setCurrentSale({
      ...currentSale,
      items: currentSale.items.filter(i => i.productId !== productId),
      totalAmount: newTotalAmount,
    });
  };

  const handleComplete = () => {
    if (!currentSale || currentSale.items.length === 0) {
      toast.error('Чек пуст');
      return;
    }
    // Сбрасываем состояние оплаты при открытии
    setSelectedPaymentMethod(null);
      setCashAmount(0);
      setCardAmount(0);
      setCashInput('');
    setCardInput('');
    // Открываем модальное окно оплаты
    setShowPaymentModal(true);
  };

  const handleSelectPaymentMethod = (method: 'cash' | 'card' | 'hybrid') => {
    setSelectedPaymentMethod(method);
    if (method === 'cash' && cashInputRef.current) {
      setTimeout(() => cashInputRef.current?.focus(), 100);
    } else if (method === 'hybrid' && cashInputRef.current) {
      setTimeout(() => cashInputRef.current?.focus(), 100);
    }
  };

  const handleAddHybridPayment = () => {
    const cashValue = parseInt(cashInput) || 0;
    const cardValue = parseInt(cardInput) || 0;
    const total = cashValue + cardValue;
    
    if (total <= 0) {
      toast.error('Введите суммы');
      return;
    }
    
    if (total !== currentSale?.totalAmount) {
      toast.error(`Сумма должна равняться ${currentSale?.totalAmount} ${currentSale?.currency}`);
      return;
    }
    
    setCashAmount(cashValue);
    setCardAmount(cardValue);
    setCashInput('');
    setCardInput('');
    toast.success(`Оплата: ${cashValue} наличными, ${cardValue} картой`);
  };

  const handleResetPayment = () => {
    setSelectedPaymentMethod(null);
    setCashAmount(0);
    setCardAmount(0);
    setCashInput('');
    setCardInput('');
  };

  const calculateRemaining = () => {
    if (!currentSale) return 0;
    return Math.max(0, Math.ceil(currentSale.totalAmount - cashAmount - cardAmount));
  };

  // Обработка Escape для закрытия модального окна
  useEffect(() => {
    if (!showPaymentModal) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const remaining = calculateRemaining();
        if (remaining === currentSale?.totalAmount) {
          // Если ничего не оплачено, можно закрыть
          setShowPaymentModal(false);
          handleResetPayment();
        }
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showPaymentModal, currentSale, cashAmount, cardAmount]);

  const calculateChange = () => {
    if (!currentSale) return 0;
    const remaining = calculateRemaining();
    const cashInputValue = parseInt(cashInput) || 0;
    if (cashInputValue > 0 && remaining > 0) {
      return Math.max(0, cashInputValue - remaining);
    }
    return 0;
  };

  const handleAddCashPayment = () => {
    const amount = parseInt(cashInput) || 0;
    if (amount <= 0) {
      toast.error('Введите сумму');
      return;
    }
    
    if (!currentSale) return;
    
    const remaining = calculateRemaining();
    if (remaining <= 0) {
      toast.error('Сумма уже полностью оплачена');
      setCashInput('');
      return;
    }
    
    // Если введенная сумма больше или равна остатку, оплачиваем полностью
    if (amount >= remaining) {
      setCashAmount(currentSale.totalAmount);
      const change = amount - remaining;
      setCashInput('');
      
      if (change > 0) {
        toast.success(`Оплачено полностью. Сдача: ${change} ${currentSale.currency}`);
      } else {
        toast.success(`Оплачено полностью`);
      }
    } else {
      // Частичная оплата (не должно быть в новой логике, но оставляем для безопасности)
      setCashAmount(cashAmount + amount);
      setCashInput('');
      toast.success(`Оплачено: ${amount} ${currentSale.currency}`);
      
      if (cashInputRef.current) {
        cashInputRef.current.focus();
      }
    }
  };

  const handleAddCardPayment = () => {
    const remaining = calculateRemaining();
    if (remaining <= 0) {
      toast.error('Сумма уже полностью оплачена');
      return;
    }
    
    setCardAmount(cardAmount + remaining);
    toast.success(`Доплачено картой: ${remaining} ${currentSale?.currency}`);
  };

  const handleFullCardPayment = () => {
    if (!currentSale) return;
    setCardAmount(currentSale.totalAmount);
    toast.success(`Оплачено картой: ${currentSale.totalAmount} ${currentSale.currency}`);
  };

  const handleFullCashPayment = () => {
    if (!currentSale) return;
    const remaining = calculateRemaining();
    if (remaining > 0) {
      setCashAmount(cashAmount + remaining);
      setCashInput('');
      toast.success(`Оплачено наличными: ${remaining} ${currentSale.currency}`);
    }
  };

  const handleCompletePayment = async () => {
    if (!currentSale) return;

    const remaining = calculateRemaining();
    if (remaining > 0) {
      toast.error(`Осталось доплатить: ${remaining} ${currentSale.currency}`);
      return;
    }

    setShowPaymentModal(false);
    setIsCompleting(true);
    try {
      // Сначала синхронизируем все изменения с сервером
      // Обновляем каждый товар в чеке на сервере
      for (const item of currentSale.items) {
        try {
          await api.put<AddItemResponse>('/pos/sale/item', {
            saleId: currentSale.id,
            productId: item.productId,
            quantity: item.quantity,
          });
        } catch (error: any) {
          // Если товар не найден в чеке на сервере, добавляем его
          if (error.response?.status === 404) {
            await api.post<AddItemResponse>('/pos/sale/item', {
              saleId: currentSale.id,
              sku: item.sku,
              quantity: item.quantity,
            });
          } else {
            throw error;
          }
        }
      }

      // Определяем способ оплаты для API
      let paymentMethod: 'CASH' | 'CARD' | 'HYBRID' = 'CASH';
      const requestBody: {
        saleId: string;
        paymentMethod: 'CASH' | 'CARD' | 'HYBRID';
        cashAmount?: number;
        cardAmount?: number;
      } = {
        saleId: currentSale.id,
        paymentMethod: 'CASH',
      };

      if (cashAmount > 0 && cardAmount > 0) {
        // Гибридная оплата: обязательно передаем обе суммы
        paymentMethod = 'HYBRID';
        requestBody.paymentMethod = 'HYBRID';
        requestBody.cashAmount = cashAmount;
        requestBody.cardAmount = cardAmount;
      } else if (cardAmount > 0) {
        // Оплата картой: не передаем суммы
        paymentMethod = 'CARD';
        requestBody.paymentMethod = 'CARD';
      } else {
        // Оплата наличными: не передаем суммы
        paymentMethod = 'CASH';
        requestBody.paymentMethod = 'CASH';
      }

      // Теперь завершаем продажу с указанием способа оплаты
      const response = await api.post<AddItemResponse>('/pos/sale/complete', requestBody);
      
      let paymentMethodText = '';
      if (cashAmount > 0 && cardAmount > 0) {
        paymentMethodText = `смешанной оплатой (${cashAmount} наличными, ${cardAmount} картой)`;
      } else if (cashAmount > 0) {
        paymentMethodText = 'наличными';
      } else {
        paymentMethodText = 'картой';
      }
      
      toast.success(`Оплата ${paymentMethodText} завершена! Сумма: ${response.data.sale.totalAmount} ${response.data.sale.currency}`);
      
      // Загружаем новый чек
      await loadCurrentSale();
      setShowHistory(false);
      setSelectedPaymentMethod(null);
      setCashAmount(0);
      setCardAmount(0);
    } catch (error: any) {
      console.error('Ошибка завершения продажи', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Не удалось завершить продажу';
      toast.error(errorMessage);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCancel = async () => {
    if (!currentSale) return;

    if (!confirm('Вы уверены, что хотите отменить чек?')) {
      return;
    }

    try {
      await api.post('/pos/sale/cancel', {
        saleId: currentSale.id,
      });
      toast.success('Чек отменен');
      await loadCurrentSale();
    } catch (error: any) {
      console.error('Ошибка отмены чека', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Не удалось отменить чек';
      toast.error(errorMessage);
    }
  };

  const loadSalesHistory = async (page: number = 1) => {
    try {
      const response = await api.get<{
        items: Sale[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>('/pos/sales', {
        params: {
          page,
          limit: 20,
          status: 'COMPLETED',
        },
      });
      setSalesHistory(response.data.items);
      setHistoryTotal(response.data.total);
      setHistoryPage(page);
    } catch (error: any) {
      console.error('Ошибка загрузки истории', error);
      toast.error('Не удалось загрузить историю продаж');
    }
  };

  const handleShowHistory = () => {
    setShowHistory(true);
    loadSalesHistory(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка кассы...</p>
        </div>
      </div>
    );
  }

  if (showHistory) {
    return (
      <div className="min-h-screen bg-muted/30 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 mb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-semibold">История продаж</h1>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Назад к кассе
              </button>
            </div>

            {salesHistory.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">История продаж пуста</p>
              </div>
            ) : (
              <div className="space-y-4">
                {salesHistory.map((sale) => (
                  <div key={sale.id} className="bg-muted rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">Чек #{sale.id.slice(-8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(sale.completedAt || sale.createdAt).toLocaleString('ru-RU')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{sale.totalAmount} {sale.currency}</p>
                        <p className="text-sm text-muted-foreground">{sale.items.length} товаров</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.productName} ({item.sku})</span>
                          <span className="font-medium">
                            {item.quantity} x {item.price} = {item.totalPrice} {item.currency}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Header */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Касса</h1>
                <p className="text-xs text-muted-foreground">
                  Чек #{currentSale?.id.slice(-8) || '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShowHistory}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <History className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* SKU Scanner */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              ref={skuInputRef}
              type="text"
              value={scannedSku}
              onChange={(e) => setScannedSku(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Сканируйте или введите артикул"
              className="w-full pl-10 pr-20 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-base"
              disabled={isAdding || isScanning}
            />
            {isAdding && (
              <div className="absolute right-14 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            )}
            {!isScanning ? (
              <button
                onClick={startCamera}
                disabled={isAdding}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
                title="Открыть камеру"
              >
                <Camera className="w-5 h-5 text-primary" />
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-accent rounded-lg transition-colors"
                title="Закрыть камеру"
              >
                <X className="w-5 h-5 text-destructive" />
              </button>
            )}
          </div>

          {/* Camera Scanner */}
          {isScanning && (
            <div className="bg-card border border-border rounded-lg shadow-sm p-4 mb-4 mt-4">
              <div className="relative">
                <div id={qrCodeRegionId} className="w-full rounded-lg overflow-hidden" style={{ minHeight: '250px' }} />
                <button
                  onClick={stopCamera}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                  title="Закрыть камеру"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Наведите камеру на штрих-код
              </p>
            </div>
          )}
        </div>

        {/* Sale Items */}
        {currentSale && currentSale.items.length > 0 ? (
          <div className="bg-card border border-border rounded-lg shadow-sm p-4 mb-4">
            <h2 className="font-semibold mb-3">Товары в чеке</h2>
            <div className="space-y-3">
              {currentSale.items.map((item) => (
                <div key={item.productId} className="bg-muted rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      className="p-1 hover:bg-destructive/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center bg-background border border-border rounded hover:bg-accent transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-background border border-border rounded hover:bg-accent transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{item.totalPrice} {item.currency}</p>
                      <p className="text-xs text-muted-foreground">{item.price} за шт</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg shadow-sm p-8 text-center mb-4">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Чек пуст. Отсканируйте товары</p>
          </div>
        )}

        {/* Total and Actions */}
        {currentSale && currentSale.items.length > 0 && (
          <div className="bg-card border border-border rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold">Итого:</span>
              <span className="text-2xl font-bold text-primary">
                {currentSale.totalAmount} {currentSale.currency}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCancel}
                className="h-12 border border-border rounded-lg font-semibold hover:bg-accent transition-colors"
              >
                Отменить
              </button>
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="h-12 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCompleting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Оплата...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Оплата</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Scanner and Items */}
          <div className="col-span-2 space-y-4">
            {/* Header */}
            <div className="bg-card border border-border rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold">Касса</h1>
                    <p className="text-sm text-muted-foreground">
                      Чек #{currentSale?.id.slice(-8) || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShowHistory}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    История
                  </button>
                </div>
              </div>

              {/* SKU Scanner */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  ref={skuInputRef}
                  type="text"
                  value={scannedSku}
                  onChange={(e) => setScannedSku(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Сканируйте или введите артикул"
                  className="w-full pl-10 pr-20 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isAdding || isScanning}
                />
                {isAdding && (
                  <div className="absolute right-14 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                )}
                {!isScanning ? (
                  <button
                    onClick={startCamera}
                    disabled={isAdding}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    title="Открыть камеру"
                  >
                    <Camera className="w-5 h-5 text-primary" />
                    <span className="text-sm hidden sm:inline">Камера</span>
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-accent rounded-lg transition-colors flex items-center gap-2"
                    title="Закрыть камеру"
                  >
                    <X className="w-5 h-5 text-destructive" />
                    <span className="text-sm hidden sm:inline">Закрыть</span>
                  </button>
                )}
              </div>

              {/* Camera Scanner */}
              {isScanning && (
                <div className="mt-4 bg-card border border-border rounded-lg shadow-sm p-4">
                  <div className="relative">
                    <div id={qrCodeRegionId} className="w-full rounded-lg overflow-hidden max-w-md mx-auto" style={{ minHeight: '250px' }} />
                    <button
                      onClick={stopCamera}
                      className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                      title="Закрыть камеру"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Наведите камеру на штрих-код
                  </p>
                </div>
              )}
            </div>

            {/* Sale Items */}
            {currentSale && currentSale.items.length > 0 ? (
              <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                <h2 className="font-semibold mb-4">Товары в чеке</h2>
                <div className="space-y-3">
                  {currentSale.items.map((item) => (
                    <div key={item.productId} className="bg-muted rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-semibold">{item.productName}</p>
                          <p className="text-sm text-muted-foreground font-mono">{item.sku}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          className="p-2 hover:bg-destructive/10 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                            className="w-8 h-8 flex items-center justify-center bg-background border border-border rounded hover:bg-accent transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-background border border-border rounded hover:bg-accent transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{item.totalPrice} {item.currency}</p>
                          <p className="text-sm text-muted-foreground">{item.price} за шт</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg shadow-sm p-12 text-center">
                <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Чек пуст. Отсканируйте товары</p>
              </div>
            )}
          </div>

          {/* Right Column - Total and Actions */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="font-semibold mb-4">Итого</h2>
              {currentSale && currentSale.items.length > 0 ? (
                <>
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {currentSale.totalAmount} {currentSale.currency}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {currentSale.items.length} {currentSale.items.length === 1 ? 'товар' : 'товаров'}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={handleComplete}
                      disabled={isCompleting}
                      className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCompleting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Оплата...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Оплата</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="w-full h-12 border border-border rounded-lg font-semibold hover:bg-accent transition-colors"
                    >
                      Отменить чек
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Добавьте товары в чек</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal - Упрощенный UX */}
      <Dialog open={showPaymentModal} onOpenChange={(open) => {
        const remaining = calculateRemaining();
        // Разрешаем закрытие только если ничего не оплачено или оплата завершена
        if (!open && (remaining === currentSale?.totalAmount || remaining === 0)) {
          setShowPaymentModal(false);
          handleResetPayment();
        }
      }}>
        <DialogContent 
          className="sm:max-w-2xl max-h-[95vh] overflow-y-auto p-0"
          onEscapeKeyDown={(e) => {
            const remaining = calculateRemaining();
            if (remaining === currentSale?.totalAmount) {
              // Если ничего не оплачено, закрываем
              setShowPaymentModal(false);
              handleResetPayment();
            } else {
              // Иначе предотвращаем закрытие
              e.preventDefault();
            }
          }}
        >
          <div className="p-6 space-y-6">
            {/* Верхняя часть: Крупные цифры - всегда видны */}
            <div className="bg-primary/5 rounded-xl p-6 border-2 border-primary/20">
              <div className="text-center space-y-2">
                <div className="text-sm text-muted-foreground uppercase tracking-wide">К оплате</div>
                <div className="text-5xl font-bold text-primary">
                  {Math.ceil(currentSale?.totalAmount || 0)} {currentSale?.currency}
                </div>
              </div>
            </div>

            {/* Статус оплаты (показываем только если есть частичная оплата) */}
            {(cashAmount > 0 || cardAmount > 0) && (
              <div className={`rounded-xl p-6 border-2 ${
                calculateRemaining() === 0 
                  ? 'bg-green-50 dark:bg-green-950 border-green-500' 
                  : 'bg-orange-50 dark:bg-orange-950 border-orange-500'
              }`}>
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground uppercase tracking-wide">Осталось</div>
                  {calculateRemaining() === 0 ? (
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                      Оплачено полностью
                    </div>
                  ) : (
                    <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                      {calculateRemaining()} {currentSale?.currency}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Центральная часть: Основной способ оплаты */}
            {!selectedPaymentMethod ? (
              <div className="space-y-4">
                <div className="text-center text-sm text-muted-foreground mb-4">
                  Выберите способ оплаты
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleSelectPaymentMethod('cash')}
                    className="flex flex-col items-center justify-center p-8 border-2 border-border rounded-xl hover:bg-accent hover:border-primary transition-all group min-h-[140px]"
                  >
                    <Wallet className="w-16 h-16 text-primary mb-4 group-hover:scale-110 transition-transform" />
                    <span className="text-2xl font-bold">Наличными</span>
                  </button>
                  <button
                    onClick={() => handleSelectPaymentMethod('card')}
                    className="flex flex-col items-center justify-center p-8 border-2 border-border rounded-xl hover:bg-accent hover:border-primary transition-all group min-h-[140px]"
                  >
                    <CreditCard className="w-16 h-16 text-primary mb-4 group-hover:scale-110 transition-transform" />
                    <span className="text-2xl font-bold">Картой</span>
                  </button>
                </div>
                <button
                  onClick={() => handleSelectPaymentMethod('hybrid')}
                  className="w-full flex items-center justify-center gap-3 p-6 border-2 border-border rounded-xl hover:bg-accent hover:border-primary transition-all group"
                >
                  <Wallet className="w-6 h-6 text-primary" />
                  <CreditCard className="w-6 h-6 text-primary" />
                  <span className="text-xl font-bold">Смешанная оплата</span>
                </button>
              </div>
            ) : selectedPaymentMethod === 'cash' ? (
              <div className="space-y-4">
                {/* Ввод суммы наличными */}
                <div className="space-y-3">
                  <label className="text-base font-semibold block text-center">Введите сумму</label>
                  <input
                    ref={cashInputRef}
                    type="number"
                    step="1"
                    min="0"
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    placeholder="0"
                    className="w-full px-6 py-5 text-4xl text-center border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-bold bg-background"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCashPayment();
                      }
                    }}
                    autoFocus
                  />
                  
                  {/* Показ сдачи (если введено больше остатка) */}
                  {cashInput && parseInt(cashInput) > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      {parseInt(cashInput) > calculateRemaining() ? (
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Сдача</div>
                          <div className="text-2xl font-bold text-green-600">
                            {calculateChange()} {currentSale?.currency}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Останется доплатить</div>
                        <div className="text-2xl font-bold">
                          {Math.max(0, calculateRemaining() - (parseInt(cashInput) || 0))} {currentSale?.currency}
                        </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Кнопки действий */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleAddCashPayment}
                      disabled={!cashInput || parseInt(cashInput) <= 0}
                      className="h-16 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-xl font-bold"
                    >
                      Внести
                    </button>
                    <button
                      onClick={handleFullCashPayment}
                      disabled={calculateRemaining() <= 0}
                      className="h-16 border-2 border-primary text-primary rounded-xl hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xl font-bold"
                    >
                      Вся сумма
                    </button>
                  </div>
                </div>

                {/* Кнопка сброса выбора способа */}
                <button
                  onClick={handleResetPayment}
                  className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Выбрать другой способ оплаты
                </button>
              </div>
            ) : selectedPaymentMethod === 'card' ? (
              <div className="space-y-4">
                {/* Оплата картой */}
                <button
                  onClick={handleFullCardPayment}
                  disabled={calculateRemaining() <= 0}
                  className="w-full h-24 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-2xl font-bold flex items-center justify-center gap-4"
                >
                  <CreditCard className="w-10 h-10" />
                  Оплатить {Math.ceil(currentSale?.totalAmount || 0)} {currentSale?.currency}
                </button>

                {/* Кнопка сброса выбора способа */}
                <button
                  onClick={handleResetPayment}
                  className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Выбрать другой способ оплаты
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Смешанная оплата: два инпута */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-base font-semibold block text-center">Наличными</label>
                    <input
                      ref={cashInputRef}
                      type="number"
                      step="1"
                      min="0"
                      value={cashInput}
                      onChange={(e) => setCashInput(e.target.value)}
                      placeholder="0"
                      className="w-full px-6 py-5 text-3xl text-center border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-bold bg-background"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          cardInputRef.current?.focus();
                        }
                      }}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-base font-semibold block text-center">Картой</label>
                    <input
                      ref={cardInputRef}
                      type="number"
                      step="1"
                      min="0"
                      value={cardInput}
                      onChange={(e) => setCardInput(e.target.value)}
                      placeholder="0"
                      className="w-full px-6 py-5 text-3xl text-center border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-bold bg-background"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddHybridPayment();
                        }
                      }}
                    />
                  </div>

                  {/* Показ суммы */}
                  {(cashInput || cardInput) && (
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="text-sm text-muted-foreground mb-1">Итого</div>
                      <div className="text-2xl font-bold">
                        {(parseInt(cashInput) || 0) + (parseInt(cardInput) || 0)} {currentSale?.currency}
                      </div>
                      {(parseInt(cashInput) || 0) + (parseInt(cardInput) || 0) !== currentSale?.totalAmount && (
                        <div className="text-sm text-destructive mt-2">
                          Должно быть: {currentSale?.totalAmount} {currentSale?.currency}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Кнопка подтверждения */}
                  <button
                    onClick={handleAddHybridPayment}
                    disabled={
                      !cashInput || !cardInput || 
                      parseInt(cashInput) <= 0 || parseInt(cardInput) <= 0 ||
                      (parseInt(cashInput) || 0) + (parseInt(cardInput) || 0) !== currentSale?.totalAmount
                    }
                    className="w-full h-16 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-xl font-bold"
                  >
                    Подтвердить оплату
                  </button>
                </div>

                {/* Кнопка сброса выбора способа */}
                <button
                  onClick={handleResetPayment}
                  className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Выбрать другой способ оплаты
                </button>
              </div>
            )}

            {/* Нижняя часть: Завершение оплаты (только когда остаток = 0) */}
            {calculateRemaining() === 0 && (
              <div className="pt-4 border-t-2 border-border">
                  <button
                    onClick={handleCompletePayment}
                  disabled={isCompleting}
                  className="w-full h-16 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xl"
                  >
                    {isCompleting ? (
                      <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Обработка...</span>
                      </>
                    ) : (
                      <>
                      <CheckCircle2 className="w-6 h-6" />
                      <span>Завершить оплату</span>
                      </>
                    )}
                  </button>
                </div>
          )}
          </div>
        </DialogContent>
      </Dialog>
      <ScrollToTopButton />
    </div>
  );
}
