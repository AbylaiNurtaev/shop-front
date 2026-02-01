import React, { useEffect, useMemo, useState } from 'react';
import { Store, MapPin, Phone, Mail, Loader2, Trash2, Plus, Users, User, ExternalLink } from 'lucide-react';
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

interface StoreOwner {
  firstName: string;
  email: string;
  phoneNumber?: string | null;
}

interface Store {
  id: string;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  description?: string;
  owner?: StoreOwner;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phoneNumber?: string;
  location?: string;
}

interface SalesRep {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
}

export function StoresList() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [storeId, setStoreId] = useState('');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isAssignmentsOpen, setIsAssignmentsOpen] = useState(false);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [assignedSalesRepIds, setAssignedSalesRepIds] = useState<Set<string>>(new Set());
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ items?: Store[] }>('/distributors/me/stores?withSalesReps=true');
      const items = response.data?.items || response.data || [];
      setStores(Array.isArray(items) ? items : []);
    } catch (error: any) {
      console.error('Ошибка загрузки магазинов', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить магазины';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStore = async () => {
    if (!storeId.trim()) {
      toast.error('Введите ID магазина');
      return;
    }

    setIsAdding(true);
    try {
      await api.post('/distributors/stores', {
        storeId: storeId.trim(),
      });
      toast.success('Магазин успешно добавлен');
      setIsAddDialogOpen(false);
      setStoreId('');
      await loadStores();
    } catch (error: any) {
      console.error('Ошибка добавления магазина', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось добавить магазин';
      toast.error(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteStore = async (storeIdToDelete: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот магазин?')) {
      return;
    }

    setIsDeleting(storeIdToDelete);
    try {
      await api.delete(`/distributors/stores/${storeIdToDelete}`);
      toast.success('Магазин успешно удален');
      await loadStores();
    } catch (error: any) {
      console.error('Ошибка удаления магазина', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось удалить магазин';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(null);
    }
  };

  const loadStoreAssignments = async (store: Store) => {
    setIsAssignmentsLoading(true);
    try {
      const repsResponse = await api.get<{ items?: SalesRep[] }>('/distributors/me/sales-representatives');
      const repsItems = repsResponse.data?.items || repsResponse.data || [];
      const reps = Array.isArray(repsItems) ? repsItems : [];
      setSalesReps(reps);

      const repsStores = await Promise.all(
        reps.map((rep) =>
          api
            .get<{ items?: Store[] }>(`/distributors/sales-representatives/${rep.id}/stores`)
            .then((response) => ({ repId: rep.id, items: response.data?.items || response.data || [] }))
            .catch(() => ({ repId: rep.id, items: [] }))
        )
      );

      const assigned = new Set<string>();
      repsStores.forEach(({ repId, items }) => {
        const list = Array.isArray(items) ? items : [];
        if (list.some((item) => String(item.id) === String(store.id))) {
          assigned.add(repId);
        }
      });
      setAssignedSalesRepIds(assigned);
    } catch (error: any) {
      console.error('Ошибка загрузки привязок магазинов к ТП', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить привязки';
      toast.error(errorMessage);
    } finally {
      setIsAssignmentsLoading(false);
    }
  };

  const openAssignments = async (store: Store) => {
    setSelectedStore(store);
    setIsAssignmentsOpen(true);
    await loadStoreAssignments(store);
  };

  const handleToggleAssignment = async (repId: string, isAssigned: boolean) => {
    if (!selectedStore) return;
    setIsAssigning(repId);
    try {
      if (isAssigned) {
        await api.delete(`/distributors/sales-representatives/${repId}/stores/${selectedStore.id}`);
        setAssignedSalesRepIds((prev) => {
          const next = new Set(prev);
          next.delete(repId);
          return next;
        });
        toast.success('Магазин отвязан от ТП');
      } else {
        await api.post(`/distributors/sales-representatives/${repId}/stores`, {
          storeId: selectedStore.id,
        });
        setAssignedSalesRepIds((prev) => new Set(prev).add(repId));
        toast.success('Магазин привязан к ТП');
      }
    } catch (error: any) {
      console.error('Ошибка привязки магазина к ТП', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось изменить привязку';
      toast.error(errorMessage);
    } finally {
      setIsAssigning(null);
    }
  };

  const assignedCount = useMemo(() => assignedSalesRepIds.size, [assignedSalesRepIds]);

  return (
    <div className="space-y-4 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-semibold">Магазины</h1>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="flex items-center gap-2 self-start sm:self-auto"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          Добавить магазин
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-lg p-6 md:p-8 text-center">
          <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-sm md:text-base text-muted-foreground">Загрузка магазинов...</p>
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-6 md:p-8 text-center">
          <Store className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm md:text-base text-muted-foreground">Магазины не найдены</p>
          <p className="text-xs md:text-sm text-muted-foreground mt-2">Добавьте первый магазин для начала работы</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {stores.map((store) => (
            <div
              key={store.id}
              role="button"
              tabIndex={0}
              onClick={() => openAssignments(store)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openAssignments(store);
                }
              }}
              className="bg-card border border-border rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow relative cursor-pointer"
            >
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteStore(store.id);
                }}
                disabled={isDeleting === store.id}
                className="absolute top-3 right-3 md:top-4 md:right-4 p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                title="Удалить магазин"
              >
                {isDeleting === store.id ? (
                  <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                )}
              </button>
              <h3 className="font-semibold text-base md:text-lg mb-2 pr-8 break-words">{store.name}</h3>
              {store.address && (
                <div className="flex items-start gap-2 text-xs md:text-sm text-muted-foreground mb-2">
                  <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 mt-0.5 flex-shrink-0" />
                  <span className="break-words">{store.address}</span>
                </div>
              )}
              {store.phone && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-2">
                  <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="break-all">{store.phone}</span>
                </div>
              )}
              {store.email && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-2">
                  <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="break-all">{store.email}</span>
                </div>
              )}
              {store.phoneNumber && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-2">
                  <User className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="break-all">{store.phoneNumber}</span>
                </div>
              )}
              {store.description && (
                <p className="text-xs md:text-sm text-muted-foreground mt-2 line-clamp-2">{store.description}</p>
              )}
              <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground flex items-center gap-2">
                <Users className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span>ТП</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Диалог добавления магазина */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить магазин</DialogTitle>
            <DialogDescription>
              Введите ID магазина для привязки к вашему дистрибьютору
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="storeId">ID магазина</Label>
              <Input
                id="storeId"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                placeholder="Введите ID магазина"
                disabled={isAdding}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setStoreId('');
              }}
              disabled={isAdding}
            >
              Отмена
            </Button>
            <Button
              onClick={handleAddStore}
              disabled={isAdding || !storeId.trim()}
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

      {/* Диалог привязки ТП к магазину */}
      <Dialog open={isAssignmentsOpen} onOpenChange={setIsAssignmentsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg sm:text-xl">Привязка ТП</DialogTitle>
            <DialogDescription className="text-sm">
              {selectedStore ? `Магазин: ${selectedStore.name}` : 'Выберите магазин'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 sm:py-4">
            {/* Информация о магазине */}
            {selectedStore && (
              <div className="border border-border rounded-md p-3 sm:p-4 bg-muted/20">
                <div className="flex items-center gap-2 mb-3">
                  <Store className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                  <h3 className="text-sm sm:text-base font-semibold">Информация о магазине</h3>
                </div>
                <div className="space-y-2.5 sm:space-y-3">
                  {(selectedStore.city || selectedStore.address) && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">Адрес: </span>
                      <span className="break-words">
                        {selectedStore.city && `${selectedStore.city}, `}
                        {selectedStore.address}
                      </span>
                    </div>
                  )}
                  {selectedStore.phone && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">Телефон: </span>
                      <span className="break-all font-medium">{selectedStore.phone}</span>
                    </div>
                  )}
                  {selectedStore.location && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">2ГИС: </span>
                      <a
                        href={selectedStore.location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>Открыть на карте</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Информация о владельце магазина */}
            {(selectedStore?.owner || selectedStore?.firstName || selectedStore?.phoneNumber) && (
              <div className="border border-border rounded-md p-3 sm:p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                  <h3 className="text-sm sm:text-base font-semibold">Владелец магазина</h3>
                </div>
                <div className="space-y-2.5 sm:space-y-3">
                  {(selectedStore.firstName || selectedStore.owner?.firstName) && (
                    <div className="text-xs sm:text-sm">
                      <span className="text-muted-foreground">Имя: </span>
                      <span className="font-medium">
                        {[selectedStore.lastName, selectedStore.firstName, selectedStore.middleName]
                          .filter(Boolean)
                          .join(' ') || selectedStore.owner?.firstName || ''}
                      </span>
                    </div>
                  )}
                  {(selectedStore.owner?.email) && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">Email: </span>
                      <span className="break-all">{selectedStore.owner.email}</span>
                    </div>
                  )}
                  {(selectedStore.phoneNumber || selectedStore.owner?.phoneNumber) && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">Телефон: </span>
                      <span className="break-all font-medium">{selectedStore.phoneNumber || selectedStore.owner?.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <h4 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                ТП
              </h4>
              {isAssignmentsLoading ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs sm:text-sm">Загрузка ТП...</span>
                </div>
              ) : salesReps.length === 0 ? (
                <div className="text-xs sm:text-sm text-muted-foreground py-4 text-center">
                  ТП не найдены
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 max-h-[300px] overflow-y-auto">
                  {salesReps.map((rep) => {
                    const isAssigned = assignedSalesRepIds.has(rep.id);
                    return (
                      <label
                        key={rep.id}
                        className="flex items-center justify-between gap-2 sm:gap-3 border border-border rounded-md px-2.5 sm:px-3 py-2 sm:py-2.5 hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-medium truncate">
                            {rep.firstName} {rep.lastName}
                          </div>
                          {rep.email && (
                            <div className="text-xs text-muted-foreground truncate mt-0.5">{rep.email}</div>
                          )}
                          {(rep.phoneNumber || rep.phone) && (
                            <div className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span>{rep.phoneNumber || rep.phone}</span>
                            </div>
                          )}
                        </div>
                        <Checkbox
                          checked={isAssigned}
                          disabled={isAssigning === rep.id}
                          onCheckedChange={() => handleToggleAssignment(rep.id, isAssigned)}
                          className="flex-shrink-0"
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 sm:pt-0 border-t border-border sm:border-t-0">
            <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
              Привязано: <span className="font-medium">{assignedCount}</span>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignmentsOpen(false);
                setSelectedStore(null);
                setAssignedSalesRepIds(new Set());
                setSalesReps([]);
              }}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
