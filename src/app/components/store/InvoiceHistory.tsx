import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Package, CheckCircle, AlertCircle, X, Loader2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { ScrollToTopButton } from '../ui/scroll-to-top-button';

interface InvoiceInfo {
  items: Array<{
    productName: string;
    quantity: number;
    sku?: string | null;
    brand?: string;
    unit?: string;
  }>;
  invoiceNumber: string;
  date: string;
  supplier: string;
}

interface Invoice {
  id: string;
  imageUrl: string;
  invoiceInfo: InvoiceInfo;
  summary: {
    total: number;
    found: number;
    notFound: number;
    errors: number;
  };
  status: string;
  createdAt: string;
  originalSize?: number;
  compressedSize?: number;
}

interface InvoiceDetail extends Invoice {
  analysisResults: {
    found: Array<{
      originalItem: {
        productName: string;
        quantity: number;
        sku?: string | null;
        brand?: string;
        unit?: string;
        notes?: string | null;
      };
      product: {
        id: string;
        name: string;
        sku: string;
        brandName: string;
        brandId: string;
      };
      quantity: number;
      currentQuantity: number;
      newQuantity: number;
      error?: string | null;
      canAdd: boolean;
    }>;
    notFound: Array<{
      productName: string;
      sku?: string | null;
      brand?: string;
      quantity: number;
      unit?: string;
      notes?: string | null;
    }>;
    errors: Array<{
      item: {
        productName: string;
        quantity: number;
      };
      error: string;
    }>;
    summary: {
      total: number;
      found: number;
      notFound: number;
      errors: number;
    };
  };
  mimeType?: string;
}

export function InvoiceHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchInvoices = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/warehouse/invoice/history', {
        params: { page: pageNum, limit: 20 }
      });
      setInvoices(response.data.invoices);
      setTotalPages(response.data.pagination.totalPages);
      setPage(response.data.pagination.page);
    } catch (error: any) {
      console.error('Ошибка загрузки истории накладных', error);
      toast.error(error?.response?.data?.message || 'Не удалось загрузить историю накладных');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetail = async (invoiceId: string) => {
    setLoadingDetail(true);
    try {
      const response = await api.get(`/warehouse/invoice/${invoiceId}`);
      const invoiceData = response.data;
      // Убеждаемся, что все необходимые поля присутствуют
      if (invoiceData) {
        setSelectedInvoice({
          ...invoiceData,
          invoiceInfo: invoiceData.invoiceInfo || {
            items: [],
            invoiceNumber: '',
            date: '',
            supplier: ''
          },
          summary: invoiceData.summary || {
            total: 0,
            found: 0,
            notFound: 0,
            errors: 0
          },
          analysisResults: invoiceData.analysisResults || {
            found: [],
            notFound: [],
            errors: [],
            summary: invoiceData.summary || {
              total: 0,
              found: 0,
              notFound: 0,
              errors: 0
            }
          }
        });
        setShowDetailModal(true);
      }
    } catch (error: any) {
      console.error('Ошибка загрузки деталей накладной', error);
      toast.error(error?.response?.data?.message || 'Не удалось загрузить детали накладной');
      setSelectedInvoice(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchInvoices(page);
  }, [page]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="bg-card border-b border-border sticky top-0 z-20 shadow-sm">
          <div className="p-4">
            <h1 className="text-2xl font-bold text-foreground">История накладных</h1>
            <p className="text-sm text-muted-foreground mt-1">Просмотр всех обработанных накладных</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-4 text-center py-20">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Нет накладных в истории</p>
          </div>
        ) : (
          <>
            <div className="p-4 space-y-4 pb-24">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="bg-card border-2 border-border rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    {invoice.imageUrl && (
                      <img
                        src={invoice.imageUrl}
                        alt="Накладная"
                        className="w-20 h-20 object-cover rounded-lg border border-border"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-foreground truncate">
                            {invoice.invoiceInfo.invoiceNumber || 'Накладная без номера'}
                          </h3>
                          {invoice.invoiceInfo.supplier && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {invoice.invoiceInfo.supplier}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          invoice.status === 'PROCESSED' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {invoice.status === 'PROCESSED' ? 'Обработана' : invoice.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(invoice.createdAt)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-2">
                          <div className="text-xs text-green-700 dark:text-green-300 font-medium">Найдено</div>
                          <div className="text-lg font-bold text-green-900 dark:text-green-100">{invoice.summary.found}</div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-2">
                          <div className="text-xs text-orange-700 dark:text-orange-300 font-medium">Не найдено</div>
                          <div className="text-lg font-bold text-orange-900 dark:text-orange-100">{invoice.summary.notFound}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => fetchInvoiceDetail(invoice.id)}
                        disabled={loadingDetail}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Подробнее</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="fixed bottom-20 left-0 right-0 bg-card border-t border-border p-4 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-4 py-2 border border-border bg-card text-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Назад</span>
                </button>
                <span className="text-sm text-muted-foreground">
                  Страница {page} из {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-2 px-4 py-2 border border-border bg-card text-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Вперед</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground">История накладных</h2>
          <p className="text-sm text-muted-foreground mt-1">Просмотр всех обработанных накладных</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Нет накладных в истории</p>
          </div>
        ) : (
          <>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Изображение</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Номер накладной</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Поставщик</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Дата</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Статус</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Найдено</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Не найдено</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3">
                          {invoice.imageUrl && (
                            <img
                              src={invoice.imageUrl}
                              alt="Накладная"
                              className="w-16 h-16 object-cover rounded border border-border"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {invoice.invoiceInfo.invoiceNumber || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{invoice.invoiceInfo.supplier || '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(invoice.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            invoice.status === 'PROCESSED' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {invoice.status === 'PROCESSED' ? 'Обработана' : invoice.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-green-700 dark:text-green-300 font-medium">{invoice.summary.found}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-orange-700 dark:text-orange-300 font-medium">{invoice.summary.notFound}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => fetchInvoiceDetail(invoice.id)}
                            disabled={loadingDetail}
                            className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
                          >
                            Подробнее
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-4 py-2 border border-border bg-card text-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Назад
                </button>
                <span className="text-sm text-muted-foreground">
                  Страница {page} из {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-2 px-4 py-2 border border-border bg-card text-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперед
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-card rounded-t-2xl md:rounded-xl max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-card border-b border-border px-4 md:px-6 py-3 md:py-4 flex items-center justify-between z-10">
              <h3 className="text-lg md:text-xl font-semibold flex items-center gap-2 text-foreground">
                <FileText className="w-4 h-4 md:w-5 md:h-5" />
                <span>Детали накладной</span>
              </h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedInvoice(null);
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            <div className="p-4 md:p-6 pb-24 md:pb-6 space-y-4 md:space-y-6 flex-1 overflow-y-auto">
              {/* Изображение накладной */}
              {selectedInvoice.imageUrl && (
                <div>
                  <img
                    src={selectedInvoice.imageUrl}
                    alt="Накладная"
                    className="w-full max-w-md mx-auto rounded-lg border border-border"
                  />
                </div>
              )}

              {/* Информация о накладной */}
              {selectedInvoice.invoiceInfo && (
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold mb-3 text-foreground">Информация о накладной</h4>
                  {selectedInvoice.invoiceInfo.invoiceNumber && (
                    <div className="text-sm text-foreground">
                      <span className="font-medium">Номер накладной:</span> {selectedInvoice.invoiceInfo.invoiceNumber}
                    </div>
                  )}
                  {selectedInvoice.invoiceInfo.date && (
                    <div className="text-sm text-foreground">
                      <span className="font-medium">Дата:</span> {selectedInvoice.invoiceInfo.date}
                    </div>
                  )}
                  {selectedInvoice.invoiceInfo.supplier && (
                    <div className="text-sm text-foreground">
                      <span className="font-medium">Поставщик:</span> {selectedInvoice.invoiceInfo.supplier}
                    </div>
                  )}
                  {selectedInvoice.originalSize && (
                    <div className="text-sm text-foreground">
                      <span className="font-medium">Размер оригинала:</span> {formatFileSize(selectedInvoice.originalSize)}
                    </div>
                  )}
                  {selectedInvoice.compressedSize && (
                    <div className="text-sm text-foreground">
                      <span className="font-medium">Размер сжатого:</span> {formatFileSize(selectedInvoice.compressedSize)}
                    </div>
                  )}
                </div>
              )}

              {/* Сводка */}
              {selectedInvoice.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Всего</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{selectedInvoice.summary.total || 0}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">Найдено</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{selectedInvoice.summary.found || 0}</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Не найдено</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{selectedInvoice.summary.notFound || 0}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">Ошибки</span>
                    </div>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">{selectedInvoice.summary.errors || 0}</p>
                  </div>
                </div>
              )}

              {/* Найденные товары */}
              {selectedInvoice.analysisResults?.found && selectedInvoice.analysisResults.found.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Найденные товары ({selectedInvoice.analysisResults.found.length})
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {(selectedInvoice.analysisResults.found || []).map((item, idx) => (
                      <div
                        key={idx}
                        className="border-2 rounded-lg p-4 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700"
                      >
                        <div className="font-medium text-foreground">{item.product?.name || 'Неизвестный товар'}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <span>Артикул: {item.product?.sku || '—'}</span>
                          {item.product?.brandName && (
                            <span className="ml-2">Бренд: {item.product.brandName}</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          <span>Текущий остаток: {item.currentQuantity || 0} шт</span>
                          <span className="ml-2">Добавлено: {item.quantity || 0} шт</span>
                          <span className="ml-2">Новый остаток: {item.newQuantity || 0} шт</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Не найденные товары */}
              {selectedInvoice.analysisResults?.notFound && selectedInvoice.analysisResults.notFound.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                    <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    Товары не найдены ({selectedInvoice.analysisResults.notFound.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(selectedInvoice.analysisResults.notFound || []).map((item, idx) => (
                      <div key={idx} className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-3 text-sm">
                        <div className="font-medium break-words text-foreground">{item.productName || 'Не указано название'}</div>
                        <div className="text-muted-foreground mt-1">
                          <span>Количество: {item.quantity} {item.unit || 'шт'}</span>
                          {item.sku && <span className="ml-2">Артикул: {item.sku}</span>}
                          {item.brand && <span className="ml-2">Бренд: {item.brand}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ошибки */}
              {selectedInvoice.analysisResults?.errors && selectedInvoice.analysisResults.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                    <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                    Ошибки обработки ({selectedInvoice.analysisResults.errors.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(selectedInvoice.analysisResults.errors || []).map((error, idx) => (
                      <div key={idx} className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3 text-sm">
                        <div className="font-medium text-red-700 dark:text-red-300 break-words">{error.error}</div>
                        {error.item.productName && (
                          <div className="text-muted-foreground mt-1">Товар: {error.item.productName}</div>
                        )}
                        {error.item.quantity && (
                          <div className="text-muted-foreground">Количество: {error.item.quantity}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <ScrollToTopButton />
    </div>
  );
}
