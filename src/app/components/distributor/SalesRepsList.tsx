import React, { useEffect, useState } from 'react';
import { Users, Phone, Mail, MapPin, Loader2, Trash2, Plus, Store, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';

interface SalesRep {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  assignedStores?: string[];
}

interface Store {
  id: string;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
}

export function SalesRepsList() {
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [salesRepresentativeId, setSalesRepresentativeId] = useState('');
  const [selectedSalesRep, setSelectedSalesRep] = useState<SalesRep | null>(null);
  const [isStoresDialogOpen, setIsStoresDialogOpen] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [assignedStores, setAssignedStores] = useState<Store[]>([]);
  const [availableStores, setAvailableStores] = useState<Store[]>([]);
  const [isStoresLoading, setIsStoresLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [isDeletingStore, setIsDeletingStore] = useState<string | null>(null);
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set());
  const [isBatchAdding, setIsBatchAdding] = useState(false);

  useEffect(() => {
    loadSalesReps();
  }, []);

  const loadSalesReps = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ items?: SalesRep[] }>('/distributors/me/sales-representatives');
      const items = response.data?.items || response.data || [];
      setSalesReps(Array.isArray(items) ? items : []);
    } catch (error: any) {
      console.error('Ошибка загрузки торговых представителей', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить торговых представителей';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSalesRep = async () => {
    if (!salesRepresentativeId.trim()) {
      toast.error('Введите ID торгового представителя');
      return;
    }

    setIsAdding(true);
    try {
      await api.post('/distributors/sales-representatives', {
        salesRepresentativeId: salesRepresentativeId.trim(),
      });
      toast.success('Торговый представитель успешно добавлен');
      setIsAddDialogOpen(false);
      setSalesRepresentativeId('');
      await loadSalesReps();
    } catch (error: any) {
      console.error('Ошибка добавления торгового представителя', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось добавить торгового представителя';
      toast.error(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteSalesRep = async (salesRepresentativeId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого торгового представителя?')) {
      return;
    }

    setIsDeleting(salesRepresentativeId);
    try {
      await api.delete(`/distributors/sales-representatives/${salesRepresentativeId}`);
      toast.success('Торговый представитель успешно удален');
      await loadSalesReps();
    } catch (error: any) {
      console.error('Ошибка удаления торгового представителя', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось удалить торгового представителя';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(null);
    }
  };

  const loadSalesRepStores = async (salesRepId: string) => {
    setIsStoresLoading(true);
    try {
      const response = await api.get<{ items?: Store[] }>(`/distributors/sales-representatives/${salesRepId}/stores`);
      const items = response.data?.items || response.data || [];
      const storesList = Array.isArray(items) ? items : [];
      setAssignedStores(storesList);
    } catch (error: any) {
      console.error('Ошибка загрузки магазинов торгового представителя', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить магазины';
      toast.error(errorMessage);
      setAssignedStores([]);
    } finally {
      setIsStoresLoading(false);
    }
  };

  const loadAvailableStores = async () => {
    try {
      const response = await api.get<{ items?: Store[] }>('/distributors/me/stores?withSalesReps=true');
      const items = response.data?.items || response.data || [];
      const storesList = Array.isArray(items) ? items : [];
      setAvailableStores(storesList);
      setStores(storesList);
    } catch (error: any) {
      console.error('Ошибка загрузки доступных магазинов', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить магазины';
      toast.error(errorMessage);
      setAvailableStores([]);
      setStores([]);
    }
  };

  const openStoresDialog = async (salesRep: SalesRep) => {
    setSelectedSalesRep(salesRep);
    setIsStoresDialogOpen(true);
    setSelectedStoreIds(new Set());
    await Promise.all([
      loadSalesRepStores(salesRep.id),
      loadAvailableStores(),
    ]);
  };

  const handleAddStore = async (storeId: string) => {
    if (!selectedSalesRep) return;
    setIsAssigning(storeId);
    try {
      await api.post(`/distributors/sales-representatives/${selectedSalesRep.id}/stores`, {
        storeId: storeId,
      });
      toast.success('Магазин успешно добавлен');
      await loadSalesRepStores(selectedSalesRep.id);
      await loadSalesReps();
    } catch (error: any) {
      console.error('Ошибка добавления магазина', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось добавить магазин';
      toast.error(errorMessage);
    } finally {
      setIsAssigning(null);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!selectedSalesRep) return;
    if (!confirm('Вы уверены, что хотите удалить этот магазин у торгового представителя?')) {
      return;
    }
    setIsDeletingStore(storeId);
    try {
      await api.delete(`/distributors/sales-representatives/${selectedSalesRep.id}/stores/${storeId}`);
      toast.success('Магазин успешно удален');
      await loadSalesRepStores(selectedSalesRep.id);
      await loadSalesReps();
    } catch (error: any) {
      console.error('Ошибка удаления магазина', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось удалить магазин';
      toast.error(errorMessage);
    } finally {
      setIsDeletingStore(null);
    }
  };

  const handleBatchAddStores = async () => {
    if (!selectedSalesRep || selectedStoreIds.size === 0) return;
    setIsBatchAdding(true);
    try {
      const storeIds = Array.from(selectedStoreIds);
      await api.post(`/distributors/sales-representatives/${selectedSalesRep.id}/stores/batch`, {
        storeIds: storeIds,
      });
      toast.success(`Успешно добавлено магазинов: ${storeIds.length}`);
      setSelectedStoreIds(new Set());
      await loadSalesRepStores(selectedSalesRep.id);
      await loadSalesReps();
    } catch (error: any) {
      console.error('Ошибка массового добавления магазинов', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось добавить магазины';
      toast.error(errorMessage);
    } finally {
      setIsBatchAdding(false);
    }
  };

  const toggleStoreSelection = (storeId: string) => {
    setSelectedStoreIds((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) {
        next.delete(storeId);
      } else {
        next.add(storeId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Торговые представители</h1>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Добавить ТП
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Loader2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Загрузка торговых представителей...</p>
        </div>
      ) : salesReps.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Торговые представители не найдены</p>
          <p className="text-sm text-muted-foreground mt-2">Добавьте первого торгового представителя</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {salesReps.map((rep) => (
            <div
              key={rep.id}
              role="button"
              tabIndex={0}
              onClick={() => openStoresDialog(rep)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openStoresDialog(rep);
                }
              }}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow relative cursor-pointer"
            >
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteSalesRep(rep.id);
                }}
                disabled={isDeleting === rep.id}
                className="absolute top-4 right-4 p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                title="Удалить торгового представителя"
              >
                {isDeleting === rep.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
              <div className="flex items-start justify-between mb-2 pr-8">
                <h3 className="font-semibold text-lg">
                  {rep.firstName} {rep.lastName}
                </h3>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
              {rep.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Phone className="w-4 h-4" />
                  <span>{rep.phone}</span>
                </div>
              )}
              {rep.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Mail className="w-4 h-4" />
                  <span>{rep.email}</span>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>Закреплено магазинов: {rep.assignedStores?.length || 0}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span className="text-primary">Нажмите для управления магазинами</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Диалог добавления торгового представителя */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить торгового представителя</DialogTitle>
            <DialogDescription>
              Введите ID торгового представителя для добавления в ваш список
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="salesRepId">ID торгового представителя</Label>
              <Input
                id="salesRepId"
                value={salesRepresentativeId}
                onChange={(e) => setSalesRepresentativeId(e.target.value)}
                placeholder="Введите ID торгового представителя"
                disabled={isAdding}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setSalesRepresentativeId('');
              }}
              disabled={isAdding}
            >
              Отмена
            </Button>
            <Button
              onClick={handleAddSalesRep}
              disabled={isAdding || !salesRepresentativeId.trim()}
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Добавление...
                </>
              ) : (
                'Добавить'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог управления магазинами торгового представителя */}
      <Dialog open={isStoresDialogOpen} onOpenChange={setIsStoresDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Управление магазинами</DialogTitle>
            <DialogDescription>
              {selectedSalesRep ? `Торговый представитель: ${selectedSalesRep.firstName} ${selectedSalesRep.lastName}` : 'Выберите торгового представителя'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Закрепленные магазины */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Store className="w-5 h-5" />
                Закрепленные магазины ({assignedStores.length})
              </h3>
              {isStoresLoading ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Загрузка магазинов...</span>
                </div>
              ) : assignedStores.length === 0 ? (
                <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
                  <Store className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Нет закрепленных магазинов</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {assignedStores.map((store) => (
                    <div
                      key={store.id}
                      className="bg-card border border-border rounded-lg p-3 flex items-start justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium mb-1">{store.name}</h4>
                        {store.address && (
                          <p className="text-xs text-muted-foreground truncate">{store.address}</p>
                        )}
                        {store.city && (
                          <p className="text-xs text-muted-foreground">{store.city}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteStore(store.id)}
                        disabled={isDeletingStore === store.id}
                        className="ml-2 p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        title="Удалить магазин"
                      >
                        {isDeletingStore === store.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Доступные магазины для добавления */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Доступные магазины
                </h3>
                {selectedStoreIds.size > 0 && (
                  <Button
                    onClick={handleBatchAddStores}
                    disabled={isBatchAdding}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {isBatchAdding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Добавление...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Добавить выбранные ({selectedStoreIds.size})
                      </>
                    )}
                  </Button>
                )}
              </div>
              {availableStores.length === 0 ? (
                <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
                  <Store className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Нет доступных магазинов</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableStores
                    .filter((store) => !assignedStores.some((as) => as.id === store.id))
                    .map((store) => (
                      <label
                        key={store.id}
                        className="flex items-center justify-between gap-3 border border-border rounded-md px-3 py-2 hover:bg-muted/50 cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{store.name}</div>
                          {store.address && (
                            <div className="text-xs text-muted-foreground truncate">{store.address}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddStore(store.id);
                            }}
                            disabled={isAssigning === store.id}
                            size="sm"
                            variant="outline"
                          >
                            {isAssigning === store.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </Button>
                          <Checkbox
                            checked={selectedStoreIds.has(store.id)}
                            onCheckedChange={() => toggleStoreSelection(store.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </label>
                    ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsStoresDialogOpen(false);
                setSelectedSalesRep(null);
                setAssignedStores([]);
                setAvailableStores([]);
                setSelectedStoreIds(new Set());
              }}
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
