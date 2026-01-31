import React, { useState, useEffect } from 'react';
import { Building2, Mail, CheckCircle2, XCircle, Clock, Loader2, MessageSquare, Package } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { BrandProductsModal } from './BrandProductsModal';

interface BrandRequestApi {
  _id?: string;
  id: string;
  brandId: string;
  distributorId: string;
  status: string; // 'PENDING' | 'ACCEPTED' | 'REJECTED'
  rejectedReason?: string | null;
  createdAt: string;
  updatedAt: string;
  brand?: {
    _id?: string;
    id: string;
    name: string;
    email?: string;
    country?: string;
    categoryId?: string;
    logoUrl?: string;
    [key: string]: any;
  };
}

interface BrandRequest {
  id: string;
  brandId: string;
  brandName: string;
  brandEmail?: string;
  brandLogoUrl?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  rejectedReason?: string;
}

export function BrandRequests() {
  const [requests, setRequests] = useState<BrandRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
  const [selectedBrandForProducts, setSelectedBrandForProducts] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ items: BrandRequestApi[] }>('/distributors/requests');
      const apiRequests = response.data?.items || [];
      
      // Преобразуем данные из API в формат компонента
      const mappedRequests: BrandRequest[] = apiRequests.map((req) => {
        // Преобразуем статус из верхнего регистра в нижний
        const statusMap: { [key: string]: 'pending' | 'accepted' | 'rejected' } = {
          'PENDING': 'pending',
          'ACCEPTED': 'accepted',
          'REJECTED': 'rejected',
        };
        
        const normalizedStatus = statusMap[req.status.toUpperCase()] || 'pending';
        
        return {
          id: req.id,
          brandId: req.brandId,
          brandName: req.brand?.name || 'Неизвестный бренд',
          brandEmail: req.brand?.email,
          brandLogoUrl: req.brand?.logoUrl,
          status: normalizedStatus,
          createdAt: req.createdAt,
          rejectedReason: req.rejectedReason || undefined,
        };
      });
      
      setRequests(mappedRequests);
    } catch (error) {
      console.error('Ошибка загрузки запросов', error);
      toast.error('Не удалось загрузить запросы');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      await api.post(`/distributors/requests/${requestId}/accept`);
      toast.success('Запрос принят');
      await loadRequests();
    } catch (error: any) {
      console.error('Ошибка принятия запроса', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось принять запрос';
      toast.error(errorMessage);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      await api.post(`/distributors/requests/${requestId}/reject`, {
        reason: rejectReason[requestId] || undefined,
      });
      toast.success('Запрос отклонен');
      setShowRejectDialog(null);
      setRejectReason({ ...rejectReason, [requestId]: '' });
      await loadRequests();
    } catch (error: any) {
      console.error('Ошибка отклонения запроса', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось отклонить запрос';
      toast.error(errorMessage);
    } finally {
      setProcessingRequest(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const acceptedRequests = requests.filter(r => r.status === 'accepted');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold">Запросы от брендов</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Ожидающие запросы */}
          {pendingRequests.length > 0 && (
            <div>
              <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 flex-shrink-0" />
                <span>Ожидающие решения ({pendingRequests.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-card border-2 border-yellow-500/20 rounded-lg p-3 md:p-4"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {request.brandLogoUrl ? (
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border">
                          <img
                            src={request.brandLogoUrl}
                            alt={request.brandName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <Building2 className="w-full h-full text-muted-foreground hidden" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                          <Building2 className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg">{request.brandName}</h3>
                        {request.brandEmail && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{request.brandEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mb-3">
                      Запрос отправлен: {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                    </div>

                    <button
                      onClick={() => setSelectedBrandForProducts({ id: request.brandId, name: request.brandName })}
                      className="w-full mb-3 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Package className="w-4 h-4" />
                      <span>Посмотреть товары</span>
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(request.id)}
                        disabled={processingRequest === request.id}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        {processingRequest === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Принять</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowRejectDialog(request.id)}
                        disabled={processingRequest === request.id}
                        className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Отклонить</span>
                      </button>
                    </div>

                    {/* Диалог отклонения */}
                    {showRejectDialog === request.id && (
                      <div className="mt-4 p-4 bg-muted rounded-md">
                        <label className="block text-sm font-medium mb-2">
                          Причина отклонения (опционально)
                        </label>
                        <textarea
                          value={rejectReason[request.id] || ''}
                          onChange={(e) =>
                            setRejectReason({ ...rejectReason, [request.id]: e.target.value })
                          }
                          placeholder="Укажите причину отклонения..."
                          className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring mb-2"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={processingRequest === request.id}
                            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            {processingRequest === request.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Подтвердить отклонение'
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowRejectDialog(null);
                              setRejectReason({ ...rejectReason, [request.id]: '' });
                            }}
                            className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm font-medium"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Принятые запросы */}
          {acceptedRequests.length > 0 && (
            <div>
              <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                <span>Принятые ({acceptedRequests.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {acceptedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-card border border-green-500/20 rounded-lg p-3 md:p-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {request.brandLogoUrl ? (
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border">
                          <img
                            src={request.brandLogoUrl}
                            alt={request.brandName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <Building2 className="w-full h-full text-muted-foreground hidden" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{request.brandName}</h3>
                        {request.brandEmail && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{request.brandEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedBrandForProducts({ id: request.brandId, name: request.brandName })}
                      className="w-full mb-2 px-3 py-1.5 border border-border rounded-md hover:bg-accent transition-colors flex items-center justify-center gap-2 text-xs font-medium"
                    >
                      <Package className="w-3 h-3" />
                      <span>Товары</span>
                    </button>
                    <div className="text-xs text-muted-foreground">
                      Принят: {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Отклоненные запросы */}
          {rejectedRequests.length > 0 && (
            <div>
              <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
                <XCircle className="w-4 h-4 md:w-5 md:h-5 text-destructive flex-shrink-0" />
                <span>Отклоненные ({rejectedRequests.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {rejectedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-card border border-destructive/20 rounded-lg p-3 md:p-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {request.brandLogoUrl ? (
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border">
                          <img
                            src={request.brandLogoUrl}
                            alt={request.brandName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <Building2 className="w-full h-full text-muted-foreground hidden" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{request.brandName}</h3>
                        {request.brandEmail && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{request.brandEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedBrandForProducts({ id: request.brandId, name: request.brandName })}
                      className="w-full mb-2 px-3 py-1.5 border border-border rounded-md hover:bg-accent transition-colors flex items-center justify-center gap-2 text-xs font-medium"
                    >
                      <Package className="w-3 h-3" />
                      <span>Товары</span>
                    </button>
                    {request.rejectedReason && (
                      <div className="mb-2 p-2 bg-muted rounded-md">
                        <div className="flex items-start gap-2 text-sm">
                          <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{request.rejectedReason}</span>
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Отклонен: {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {requests.length === 0 && (
            <div className="bg-card border border-border rounded-lg p-6 md:p-8 text-center">
              <Building2 className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm md:text-base text-muted-foreground">Запросы от брендов отсутствуют</p>
            </div>
          )}
        </>
      )}

      {/* Модальное окно товаров бренда */}
      {selectedBrandForProducts && (
        <BrandProductsModal
          brandId={selectedBrandForProducts.id}
          brandName={selectedBrandForProducts.name}
          isOpen={!!selectedBrandForProducts}
          onClose={() => setSelectedBrandForProducts(null)}
        />
      )}
    </div>
  );
}
