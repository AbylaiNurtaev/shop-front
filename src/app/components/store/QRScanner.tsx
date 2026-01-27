import React, { useState, useRef, useEffect } from 'react';
import { QrCode, Search, Plus, Package, Loader2, CheckCircle2, XCircle, Camera, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../api/axios';
import { toast } from 'sonner';

interface ProductInfo {
  id: string;
  name: string;
  sku: string;
  brandName?: string;
  categoryId?: string;
}

interface OfferInfo {
  id: string;
  quantity: number;
  price: number;
  currency: string;
}

interface BarcodeResponse {
  product: ProductInfo;
  offer: OfferInfo | null;
}

export function QRScanner() {
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<BarcodeResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [lastAdded, setLastAdded] = useState<{ barcode: string; quantity: number } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = 'qr-reader';

  // Автофокус на поле ввода штрих-кода
  useEffect(() => {
    if (!isScanning) {
      barcodeInputRef.current?.focus();
    }
  }, [isScanning]);

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

  // Автоматический поиск при вводе штрих-кода
  useEffect(() => {
    if (barcode.trim().length > 0) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setProduct(null);
    }
  }, [barcode]);

  const handleSearch = async () => {
    if (!barcode.trim()) {
      toast.error('Введите штрих-код');
      return;
    }

    setIsSearching(true);
    setProduct(null);
    setLastAdded(null);

    try {
      const response = await api.get<BarcodeResponse>(`/warehouse/barcode/${barcode.trim()}`);
      setProduct(response.data);
      setQuantity(1);
    } catch (error: any) {
      console.error('Ошибка поиска товара', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Товар не найден';
      toast.error(errorMessage);
      setProduct(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickAdd = async () => {
    if (!barcode.trim()) {
      toast.error('Введите штрих-код');
      return;
    }

    if (!quantity || quantity <= 0) {
      toast.error('Введите количество больше 0');
      return;
    }

    setIsAdding(true);

    try {
      const response = await api.post<{
        message: string;
        product: ProductInfo;
        offer: OfferInfo;
      }>('/warehouse/barcode/quick-add', {
        barcode: barcode.trim(),
        quantity: quantity,
      });

      toast.success(`Товар добавлен! Текущее количество: ${response.data.offer.quantity}`);
      setLastAdded({ barcode: barcode.trim(), quantity: quantity });

      const searchResponse = await api.get<BarcodeResponse>(`/warehouse/barcode/${barcode.trim()}`);
      setProduct(searchResponse.data);

      setBarcode('');
      setQuantity(1);
      barcodeInputRef.current?.focus();
    } catch (error: any) {
      console.error('Ошибка добавления товара', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Не удалось добавить товар';
      toast.error(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (product && !isAdding) {
        handleQuickAdd();
      } else if (!isSearching) {
        handleSearch();
      }
    }
  };

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

        const onScanSuccess = async (decodedText: string) => {
          await stopCamera();
          setBarcode(decodedText);
          toast.success('Штрих-код отсканирован');
        };

        const onScanError = (errorMessage: string) => {
          // Игнорируем ошибки сканирования
        };

        try {
          // Пробуем с facingMode (предпочтительно для мобильных)
          await scanner.start(
            { facingMode: 'environment' },
            config,
            onScanSuccess,
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
                onScanSuccess,
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

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Header */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Приход товара</h1>
              <p className="text-sm text-muted-foreground">Сканирование и быстрый приход товара</p>
            </div>
          </div>
        </div>

        {/* Barcode Input */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-4 mb-4">
          <label className="block text-sm font-medium mb-2">
            Штрих-код (SKU)
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите или отсканируйте штрих-код"
              className="w-full pl-10 pr-20 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-base"
              disabled={isSearching || isAdding || isScanning}
            />
            {isSearching && (
              <div className="absolute right-14 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            )}
            {!isScanning ? (
              <button
                onClick={startCamera}
                disabled={isSearching || isAdding}
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
        </div>

        {/* Camera Scanner */}
        {isScanning && (
          <div className="bg-card border border-border rounded-lg shadow-sm p-4 mb-4">
            <div className="relative">
              <div id={qrCodeRegionId} className="w-full rounded-lg overflow-hidden" style={{ minHeight: '250px' }} />
              <button
                onClick={stopCamera}
                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
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

        {/* Product Info */}
        {product && (
          <div className="bg-card border border-border rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1">{product.product.name}</h3>
                <p className="text-sm text-muted-foreground font-mono mb-2">SKU: {product.product.sku}</p>
                {product.product.brandName && (
                  <p className="text-sm text-muted-foreground">Бренд: {product.product.brandName}</p>
                )}
              </div>
            </div>

            {product.offer ? (
              <div className="bg-muted rounded-lg p-3 mb-4">
                <p className="text-xs text-muted-foreground mb-1">Текущий остаток</p>
                <p className="text-2xl font-bold">{product.offer.quantity} <span className="text-sm text-muted-foreground">шт</span></p>
                <p className="text-xs text-muted-foreground mt-1">
                  Цена: {product.offer.price} {product.offer.currency}
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">Товар не найден на складе. Будет создан новый оффер.</p>
              </div>
            )}

            {/* Quantity Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Количество для добавления
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isAdding}
                  className="w-12 h-12 flex items-center justify-center bg-muted rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <span className="text-xl font-bold">−</span>
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 h-12 text-center text-xl font-bold bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isAdding}
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={isAdding}
                  className="w-12 h-12 flex items-center justify-center bg-muted rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <span className="text-xl font-bold">+</span>
                </button>
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={handleQuickAdd}
              disabled={isAdding || quantity <= 0}
              className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Добавление...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Добавить на склад</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Success Message */}
        {lastAdded && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Товар успешно добавлен!</p>
                <p className="text-sm text-green-700">
                  SKU: {lastAdded.barcode}, Количество: +{lastAdded.quantity}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!product && !isSearching && barcode.trim() === '' && (
          <div className="bg-card border border-border rounded-lg shadow-sm p-8 text-center">
            <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Введите или отсканируйте штрих-код товара</p>
          </div>
        )}

        {/* Not Found State */}
        {!product && !isSearching && barcode.trim() !== '' && (
          <div className="bg-card border border-border rounded-lg shadow-sm p-8 text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">Товар не найден</p>
            <p className="text-sm text-muted-foreground">Проверьте правильность штрих-кода</p>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Приход товара</h1>
              <p className="text-sm text-muted-foreground">Сканирование и быстрый приход товара</p>
            </div>
          </div>

          {/* Barcode Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Штрих-код (SKU)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Введите или отсканируйте штрих-код"
                className="w-full pl-10 pr-20 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isSearching || isAdding || isScanning}
              />
              {isSearching && (
                <div className="absolute right-14 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              )}
              {!isScanning ? (
                <button
                  onClick={startCamera}
                  disabled={isSearching || isAdding}
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
          </div>

          {/* Camera Scanner */}
          {isScanning && (
            <div className="mb-6 bg-card border border-border rounded-lg shadow-sm p-4">
              <div className="relative">
                <div className="w-full rounded-lg overflow-hidden max-w-md mx-auto">
                  <div id={qrCodeRegionId} style={{ minHeight: '250px', width: '100%' }} />
                </div>
                <button
                  onClick={stopCamera}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
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

          {/* Product Info and Actions */}
          {product && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Product Info */}
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1">{product.product.name}</h3>
                    <p className="text-sm text-muted-foreground font-mono mb-2">SKU: {product.product.sku}</p>
                    {product.product.brandName && (
                      <p className="text-sm text-muted-foreground">Бренд: {product.product.brandName}</p>
                    )}
                  </div>
                </div>

                {product.offer ? (
                  <div className="bg-background rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Текущий остаток</p>
                    <p className="text-2xl font-bold">{product.offer.quantity} <span className="text-sm text-muted-foreground">шт</span></p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Цена: {product.offer.price} {product.offer.currency}
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">Товар не найден на складе. Будет создан новый оффер.</p>
                  </div>
                )}
              </div>

              {/* Quantity and Add */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Количество для добавления
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={isAdding}
                      className="w-12 h-12 flex items-center justify-center bg-muted rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                    >
                      <span className="text-xl font-bold">−</span>
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 h-12 text-center text-xl font-bold bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={isAdding}
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={isAdding}
                      className="w-12 h-12 flex items-center justify-center bg-muted rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                    >
                      <span className="text-xl font-bold">+</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleQuickAdd}
                  disabled={isAdding || quantity <= 0}
                  className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Добавление...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Добавить на склад</span>
                    </>
                  )}
                </button>

                {lastAdded && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-900 text-sm">Товар успешно добавлен!</p>
                        <p className="text-xs text-green-700">
                          SKU: {lastAdded.barcode}, Количество: +{lastAdded.quantity}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!product && !isSearching && barcode.trim() === '' && (
            <div className="bg-muted rounded-lg p-12 text-center">
              <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Введите или отсканируйте штрих-код товара</p>
            </div>
          )}

          {/* Not Found State */}
          {!product && !isSearching && barcode.trim() !== '' && (
            <div className="bg-muted rounded-lg p-12 text-center">
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Товар не найден</p>
              <p className="text-sm text-muted-foreground">Проверьте правильность штрих-кода</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}