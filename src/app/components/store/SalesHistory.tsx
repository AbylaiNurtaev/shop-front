import React, { useState, useEffect } from 'react';
import { History, Receipt, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { ScrollToTopButton } from '../ui/scroll-to-top-button';

interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  totalPrice: number;
  currency: string;
}

interface Sale {
  id: string;
  storeId: string;
  sellerId?: string;
  items: SaleItem[];
  totalAmount: number;
  currency: string;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  paymentMethod?: string;
  cashAmount?: number;
  cardAmount?: number;
  createdAt: string;
  completedAt?: string;
  updatedAt?: string;
}

export function SalesHistory() {
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadSalesHistory(1);
  }, []);

  const loadSalesHistory = async (page: number = 1) => {
    setIsLoading(true);
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
          limit,
          status: 'COMPLETED',
        },
      });
      setSalesHistory(response.data.items);
      setTotal(response.data.total);
      setCurrentPage(response.data.page);
      setTotalPages(response.data.totalPages);
    } catch (error: any) {
      console.error('Ошибка загрузки истории', error);
      toast.error('Не удалось загрузить историю продаж');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      loadSalesHistory(page);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка истории продаж...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-lg shadow-sm p-4 md:p-6 mb-4">
          <div className="flex items-center gap-3 mb-6">
            <History className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold">История продаж</h1>
          </div>

          {salesHistory.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">История продаж пуста</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
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
                        {sale.paymentMethod && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {sale.paymentMethod === 'cash' && 'Наличные'}
                            {sale.paymentMethod === 'card' && 'Карта'}
                            {sale.paymentMethod === 'hybrid' && 
                              `Наличные: ${sale.cashAmount} ${sale.currency}, Карта: ${sale.cardAmount} ${sale.currency}`
                            }
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row md:justify-between gap-1 text-sm">
                          <div className="flex-1">
                            <div className="font-medium">{item.productName}</div>
                            <div className="text-xs text-muted-foreground font-mono">Арт: {item.sku}</div>
                          </div>
                          <div className="font-medium md:text-right">
                            {item.quantity} x {item.price} = {item.totalPrice} {item.currency}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Пагинация */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="text-sm text-muted-foreground">
                    Показано {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, total)} из {total}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium px-3">
                      Страница {currentPage} из {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <ScrollToTopButton />
    </div>
  );
}
