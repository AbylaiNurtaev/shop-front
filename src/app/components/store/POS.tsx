import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle2, XCircle, Loader2, Receipt, History, TrendingUp, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'sonner';

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
  const navigate = useNavigate();
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [scannedSku, setScannedSku] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const skuInputRef = useRef<HTMLInputElement>(null);

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

  const handleComplete = async () => {
    if (!currentSale || currentSale.items.length === 0) {
      toast.error('Чек пуст');
      return;
    }

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

      // Теперь завершаем продажу
      const response = await api.post<AddItemResponse>('/pos/sale/complete', {
        saleId: currentSale.id,
      });
      toast.success(`Продажа завершена! Сумма: ${response.data.sale.totalAmount} ${response.data.sale.currency}`);
      
      // Загружаем новый чек
      await loadCurrentSale();
      setShowHistory(false);
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
                onClick={() => navigate('/store/qr-scanner')}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                title="Приход товара"
              >
                <QrCode className="w-5 h-5" />
              </button>
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
              className="w-full pl-10 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-base"
              disabled={isAdding}
            />
            {isAdding && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            )}
          </div>
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
                    <span>Пробитие...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Пробить чек</span>
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
                    onClick={() => navigate('/store/qr-scanner')}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
                    title="Приход товара"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Приход</span>
                  </button>
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
                  className="w-full pl-10 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isAdding}
                />
                {isAdding && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                )}
              </div>
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
                          <span>Пробитие...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Пробить чек</span>
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
    </div>
  );
}
