import React, { useState } from 'react';
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

export function PaymentModal({
  product,
  products,
  isOpen,
  onClose,
  onPaymentSuccess,
  onMultiplePaymentSuccess,
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const productsToPay = products && products.length > 0 ? products : [product];
  const isMultiplePayment = productsToPay.length > 1;

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      if (isMultiplePayment && onMultiplePaymentSuccess) {
        // Множественная оплата
        const paymentPromises = productsToPay.map(p => 
          api.post(`/products/${p.id}/pay`)
        );
        
        const responses = await Promise.all(paymentPromises);
        const updatedProducts: Product[] = responses.map((response, index) => {
          const responseData = response.data;
          return responseData?.product || {
            ...productsToPay[index],
            isPayed: true,
            paymentDate: new Date().toISOString(),
            paymentExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          };
        });

        onMultiplePaymentSuccess(updatedProducts);
        toast.success(`Оплата успешно выполнена для ${productsToPay.length} товаров!`);
      } else {
        // Одиночная оплата
        const response = await api.post(`/products/${product.id}/pay`);
        
        const responseData = response.data;
        const updatedProduct: Product = responseData?.product || {
          ...product,
          isPayed: true,
          paymentDate: new Date().toISOString(),
          paymentExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };

        onPaymentSuccess(updatedProduct);
        toast.success('Оплата успешно выполнена!');
      }
      
      onClose();
    } catch (error: any) {
      console.error('Ошибка оплаты:', error);
      toast.error(error?.response?.data?.message || 'Ошибка при выполнении оплаты');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
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
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-sm font-medium">Срок действия для всех товаров:</span>
                <span className="font-semibold text-primary">30 дней</span>
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
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-sm font-medium">Срок действия:</span>
                <span className="font-semibold text-primary">30 дней</span>
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Внимание:</strong> Эквайринг временно недоступен. 
              Оплата будет обработана в тестовом режиме.
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
                  <CheckCircle2 className="w-4 h-4" />
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
