import React, { useState, useEffect } from 'react';
import { X, CreditCard, CheckCircle2, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import api from '../../api/axios';
import { toast } from 'sonner';

interface PaymentModalProps {
  product: Product;
  products?: Product[];
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (updatedProduct: Product) => void;
  onMultiplePaymentSuccess?: (updatedProducts: Product[]) => void;
}

const TIPTOP_PUBLIC_TERMINAL_ID =
  import.meta.env.VITE_TIP_TOP_PUBLIC_KEY ?? import.meta.env.TIP_TOP_PUBLIC_KEY ?? '';

export function PaymentModal({
  product,
  products,
  isOpen,
  onClose,
  onPaymentSuccess,
  onMultiplePaymentSuccess,
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [periodMonths, setPeriodMonths] = useState<6 | 9 | 12>(6);

  // Сброс состояния при закрытии модалки
  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
      setPeriodMonths(6); // Сброс периода при закрытии
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const productsToPay = products && products.length > 0 ? products : [product];
  const isMultiplePayment = productsToPay.length > 1;

  // Подсчет суммы оплаты
  // Цена зависит от периода: 1000 тенге за месяц
  // 6 месяцев = 6000, 9 месяцев = 9000, 12 месяцев = 12000
  const calculateAmount = (): number => {
    const pricePerMonth = 1000;
    const pricePerProduct = pricePerMonth * periodMonths;
    
    // При множественной оплате умножаем на количество товаров
    if (isMultiplePayment) {
      return pricePerProduct * productsToPay.length;
    }
    
    return pricePerProduct;
  };

  const activateProducts = async () => {
    setIsProcessing(true);
    try {
      if (isMultiplePayment && onMultiplePaymentSuccess) {
        const productIds = productsToPay.map((p) => p.id);
        const response = await api.post('/products/pay/multiple', {
          productIds,
          periodMonths,
        });

        const responseData = response.data;
        const responseItems: any[] =
          responseData?.items || responseData?.products || [];

        const updatedProducts: Product[] = productsToPay.map((p) => {
          const updated =
            responseItems.find((item: any) => item.id === p.id) ||
            responseData?.product;
          return (
            updated || {
              ...p,
              isPayed: true,
              paymentDate: new Date().toISOString(),
              paymentExpiresAt: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000,
              ).toISOString(),
            }
          );
        });

        onMultiplePaymentSuccess(updatedProducts);
        toast.success(
          `Оплата успешно выполнена для ${productsToPay.length} товаров!`,
        );
      } else {
        const response = await api.post(`/products/${product.id}/pay`, {
          periodMonths,
        });
        const responseData = response.data;

        const updatedProduct: Product =
          responseData?.product ||
          responseData ||
          ({
            ...product,
            isPayed: true,
            paymentDate: new Date().toISOString(),
            paymentExpiresAt: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          } as Product);

        onPaymentSuccess(updatedProduct);
        toast.success('Оплата успешно выполнена!');
      }

      onClose();
    } catch (error: any) {
      console.error('Ошибка активации оплаченных товаров:', error);
      toast.error(
        error?.response?.data?.message ||
          'Ошибка при активации оплаченных товаров',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const launchTipTopWidget = async () => {
    try {
      if (typeof window === 'undefined' || !window.tiptop || !window.tiptop.Widget) {
        toast.error('Платежный виджет временно недоступен. Попробуйте позже.');
        return;
      }

      const publicTerminalId =
        TIPTOP_PUBLIC_TERMINAL_ID || 'test_api_00000000000000000000002';

      const amount = calculateAmount();

      const widget = new window.tiptop.Widget();

      const intentParams: any = {
        publicTerminalId,
        description: isMultiplePayment
          ? `Оплата размещения ${productsToPay.length} товаров`
          : `Оплата размещения товара "${product.name}"`,
        paymentSchema: 'Single',
        currency: 'KZT',
        amount,
        externalId: `brand-products-${productsToPay
          .map((p) => p.id)
          .join('-')}-${Date.now()}`,
        emailBehavior: 'Optional',
      };

      const widgetResult = await widget.start(intentParams);
      console.log('TipTop widget result', widgetResult);

      // Если виджет завершился без ошибки, считаем платеж успешным и активируем товары на бэке
      await activateProducts();
    } catch (error: any) {
      console.error('Ошибка запуска платежного виджета TipTop:', error);
      toast.error(error?.message || 'Ошибка при запуске платежного виджета');
    }
  };

  const handlePayment = async () => {
    const canUseWidget =
      typeof window !== 'undefined' && window.tiptop && window.tiptop.Widget;

    if (canUseWidget) {
      await launchTipTopWidget();
      return;
    }
    // Фолбек: без виджета просто активируем товары (например, в тестовом окружении)
    await activateProducts();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {isMultiplePayment ? `Оплата товаров (${productsToPay.length})` : 'Оплата товара'}
              </h2>
              {!isMultiplePayment && (
                <p className="text-sm text-muted-foreground">{product.name}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {isMultiplePayment ? (
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-3">Выбранные товары для оплаты:</p>
                <div className="space-y-2">
                  {productsToPay.map((p) => (
                    <div key={p.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <div>
                        <span className="font-medium text-sm">{p.name}</span>
                        <span className="text-xs text-muted-foreground font-mono ml-2">({p.sku})</span>
                      </div>
                      <span className="text-sm font-medium text-primary">
                        {(1000 * periodMonths).toLocaleString('ru-RU')} ₸
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-base font-semibold">Период оплаты:</label>
                    <select
                      value={periodMonths}
                      onChange={(e) => setPeriodMonths(Number(e.target.value) as 6 | 9 | 12)}
                      className="px-4 py-2.5 bg-card border-2 border-primary/30 rounded-lg text-base font-medium focus:border-primary focus:ring-2 focus:ring-ring transition-all min-w-[140px]"
                      disabled={isProcessing}
                    >
                      <option value={6}>6 месяцев</option>
                      <option value={9}>9 месяцев</option>
                      <option value={12}>12 месяцев</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center mb-2 pt-2 border-t border-primary/20">
                    <span className="text-sm text-muted-foreground">Цена за товар:</span>
                    <span className="text-sm font-medium">{(1000 * periodMonths).toLocaleString('ru-RU')} ₸</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Количество товаров:</span>
                    <span className="text-sm font-medium">{productsToPay.length} шт.</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                    <span className="text-sm font-semibold">Итого к оплате:</span>
                    <span className="text-lg font-bold text-primary">
                      {calculateAmount().toLocaleString('ru-RU')} ₸
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm font-medium">Срок действия для всех товаров:</span>
                  <span className="font-semibold text-primary">{periodMonths} месяцев</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Товар:</span>
                <span className="font-medium">{product.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Артикул:</span>
                <span className="font-mono text-sm">{product.sku}</span>
              </div>
              <div className="space-y-4">
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-base font-semibold">Период оплаты:</label>
                    <select
                      value={periodMonths}
                      onChange={(e) => setPeriodMonths(Number(e.target.value) as 6 | 9 | 12)}
                      className="px-4 py-2.5 bg-card border-2 border-primary/30 rounded-lg text-base font-medium focus:border-primary focus:ring-2 focus:ring-ring transition-all min-w-[140px]"
                      disabled={isProcessing}
                    >
                      <option value={6}>6 месяцев</option>
                      <option value={9}>9 месяцев</option>
                      <option value={12}>12 месяцев</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                    <span className="text-sm font-semibold">Сумма к оплате:</span>
                    <span className="text-lg font-bold text-primary">
                      {calculateAmount().toLocaleString('ru-RU')} ₸
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm font-medium">Срок действия:</span>
                  <span className="font-semibold text-primary">{periodMonths} месяцев</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Внимание:</strong> Оплата будет выполнена через платежную систему TipTop.
              Стоимость размещения одного товара составляет 1 000 ₸ за месяц.
              После нажатия «Оплатить» откроется безопасная форма оплаты карты.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors font-medium"
              disabled={isProcessing}
            >
              Отмена
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Оплатить
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
