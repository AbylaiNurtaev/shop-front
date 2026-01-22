import React, { useEffect, useState } from 'react';
import { Check, X, RefreshCw, AlertCircle, List, FolderTree } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Brand } from '../../types';
import api from '../../api/axios';
import { toast } from 'sonner';

type TabType = 'pending' | 'all';

export function BrandModeration() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [pendingBrands, setPendingBrands] = useState<Brand[]>([]);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});
  const [showRejectDialog, setShowRejectDialog] = useState<{ [key: string]: boolean }>({});
  const [processingBrandId, setProcessingBrandId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | null>(null);

  const loadPendingBrands = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<{ items: Brand[]; total: number }>('/brands/pending');
      setPendingBrands(response.data?.items ?? []);
    } catch (error) {
      console.error('Ошибка загрузки заявок на бренды', error);
      toast.error('Не удалось загрузить заявки на бренды.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllBrands = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<{ items: Brand[]; total: number }>('/brands');
      setAllBrands(response.data?.items ?? []);
    } catch (error) {
      console.error('Ошибка загрузки всех брендов', error);
      toast.error('Не удалось загрузить список брендов.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pending') {
      void loadPendingBrands();
    } else {
      void loadAllBrands();
    }
  }, [activeTab]);

  const handleApprove = async (brandId: string) => {
    try {
      setProcessingBrandId(brandId);
      setProcessingAction('approve');
      const response = await api.post<Brand>(`/brands/${brandId}/approve`);
      toast.success(`Бренд "${response.data.name}" одобрен.`);
      if (activeTab === 'pending') {
        void loadPendingBrands();
      } else {
        void loadAllBrands();
      }
    } catch (error) {
      console.error('Ошибка одобрения бренда', error);
      toast.error('Не удалось одобрить бренд.');
    } finally {
      setProcessingBrandId(null);
      setProcessingAction(null);
    }
  };

  const handleReject = async (brandId: string, reason?: string) => {
    try {
      setProcessingBrandId(brandId);
      setProcessingAction('reject');
      const response = await api.post<Brand>(`/brands/${brandId}/reject`, reason ? { reason } : {});
      toast.success(`Бренд "${response.data.name}" отклонен.`);
      setShowRejectDialog({ ...showRejectDialog, [brandId]: false });
      setRejectReason({ ...rejectReason, [brandId]: '' });
      if (activeTab === 'pending') {
        void loadPendingBrands();
      } else {
        void loadAllBrands();
      }
    } catch (error) {
      console.error('Ошибка отклонения бренда', error);
      toast.error('Не удалось отклонить бренд.');
    } finally {
      setProcessingBrandId(null);
      setProcessingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const brandsToShow = activeTab === 'pending' ? pendingBrands : allBrands;

  if (isLoading && brandsToShow.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activeTab === 'pending' && pendingBrands.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Модерация брендов</h2>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex gap-2 border-b border-border mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Заявки на модерацию
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Все бренды
          </button>
        </div>

        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Нет заявок на модерацию</p>
          <p className="text-sm text-muted-foreground mt-2">Все заявки обработаны</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Модерация брендов</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTab === 'pending'
              ? `Заявок на рассмотрение: ${pendingBrands.length}`
              : `Всего брендов: ${allBrands.length}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/categories')}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <FolderTree className="w-4 h-4" />
            Категории
          </button>
          <button
            onClick={() => {
              if (activeTab === 'pending') {
                void loadPendingBrands();
              } else {
                void loadAllBrands();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить
          </button>
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Заявки на модерацию {pendingBrands.length > 0 && `(${pendingBrands.length})`}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Все бренды {allBrands.length > 0 && `(${allBrands.length})`}
        </button>
      </div>

      <div className="grid gap-4">
        {brandsToShow.map((brand) => (
          <div
            key={brand.id}
            className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Логотип */}
              {brand.logoUrl && (
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-lg border border-border overflow-hidden bg-muted">
                    <img
                      src={brand.logoUrl}
                      alt={`Логотип ${brand.name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Информация о бренде */}
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-xl font-semibold">{brand.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Страна производства: {brand.country}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Категория ID: {brand.categoryId}
                  </p>
                  {brand.createdAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Подано: {new Date(brand.createdAt).toLocaleString('ru-RU')}
                    </p>
                  )}
                </div>

                {/* Причина отклонения (если есть) */}
                {brand.rejectedReason && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-sm font-medium text-destructive mb-1">Причина отклонения:</p>
                    <p className="text-sm text-destructive/80">{brand.rejectedReason}</p>
                  </div>
                )}

                {/* Диалог отклонения */}
                {showRejectDialog[brand.id] && (
                  <div className="bg-muted border border-border rounded-lg p-4 space-y-3">
                    <label className="block text-sm font-medium">
                      Причина отклонения (опционально)
                    </label>
                    <textarea
                      value={rejectReason[brand.id] || ''}
                      onChange={(e) =>
                        setRejectReason({ ...rejectReason, [brand.id]: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                      placeholder="Укажите причину отклонения..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(brand.id, rejectReason[brand.id])}
                        disabled={processingBrandId === brand.id && processingAction === 'reject'}
                        className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {processingBrandId === brand.id && processingAction === 'reject' ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Отклоняем...</span>
                          </>
                        ) : (
                          'Отклонить'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowRejectDialog({ ...showRejectDialog, [brand.id]: false });
                          setRejectReason({ ...rejectReason, [brand.id]: '' });
                        }}
                        className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}

                {/* Кнопки действий - только для заявок на модерацию */}
                {activeTab === 'pending' && !showRejectDialog[brand.id] && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleApprove(brand.id)}
                      disabled={processingBrandId === brand.id}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {processingBrandId === brand.id && processingAction === 'approve' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Одобряем...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Одобрить</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() =>
                        setShowRejectDialog({ ...showRejectDialog, [brand.id]: true })
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition-opacity font-medium"
                    >
                      <X className="w-4 h-4" />
                      Отклонить
                    </button>
                  </div>
                )}

                {/* Статус для всех брендов */}
                {activeTab === 'all' && (
                  <div className="pt-2">
                    {brand.isAccepted === true && (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium">
                        <Check className="w-4 h-4" />
                        Одобрен
                      </span>
                    )}
                    {brand.isAccepted === false && (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-destructive/10 text-destructive rounded-md text-sm font-medium">
                        <X className="w-4 h-4" />
                        Отклонен
                      </span>
                    )}
                    {brand.isAccepted === undefined && (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-muted text-muted-foreground rounded-md text-sm font-medium">
                        <AlertCircle className="w-4 h-4" />
                        На рассмотрении
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
