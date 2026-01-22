import React, { useEffect, useMemo, useState } from 'react';
import { Store, MapPin, Phone, Mail, Loader2, Trash2, Plus, Users } from 'lucide-react';
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

interface Store {
  id: string;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  description?: string;
}

interface SalesRep {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
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
        toast.success('Магазин отвязан от торгового представителя');
      } else {
        await api.post(`/distributors/sales-representatives/${repId}/stores`, {
          storeId: selectedStore.id,
        });
        setAssignedSalesRepIds((prev) => new Set(prev).add(repId));
        toast.success('Магазин привязан к торговому представителю');
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Магазины</h1>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Добавить магазин
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Loader2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Загрузка магазинов...</p>
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Магазины не найдены</p>
          <p className="text-sm text-muted-foreground mt-2">Добавьте первый магазин для начала работы</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow relative cursor-pointer"
            >
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteStore(store.id);
                }}
                disabled={isDeleting === store.id}
                className="absolute top-4 right-4 p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Удалить магазин"
              >
                {isDeleting === store.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
              <h3 className="font-semibold text-lg mb-2 pr-8">{store.name}</h3>
              {store.address && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{store.address}</span>
                </div>
              )}
              {store.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Phone className="w-4 h-4" />
                  <span>{store.phone}</span>
                </div>
              )}
              {store.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Mail className="w-4 h-4" />
                  <span>{store.email}</span>
                </div>
              )}
              {store.description && (
                <p className="text-sm text-muted-foreground mt-2">{store.description}</p>
              )}
              <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Торговые представители</span>
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

      {/* Диалог привязки торговых представителей к магазину */}
      <Dialog open={isAssignmentsOpen} onOpenChange={setIsAssignmentsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Привязка торговых представителей</DialogTitle>
            <DialogDescription>
              {selectedStore ? `Магазин: ${selectedStore.name}` : 'Выберите магазин'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isAssignmentsLoading ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Загрузка торговых представителей...</span>
              </div>
            ) : salesReps.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Торговые представители не найдены
              </div>
            ) : (
              <div className="space-y-3">
                {salesReps.map((rep) => {
                  const isAssigned = assignedSalesRepIds.has(rep.id);
                  return (
                    <label
                      key={rep.id}
                      className="flex items-center justify-between gap-3 border border-border rounded-md px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {rep.firstName} {rep.lastName}
                        </div>
                        {rep.email && (
                          <div className="text-xs text-muted-foreground truncate">{rep.email}</div>
                        )}
                      </div>
                      <Checkbox
                        checked={isAssigned}
                        disabled={isAssigning === rep.id}
                        onCheckedChange={() => handleToggleAssignment(rep.id, isAssigned)}
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Привязано: {assignedCount}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignmentsOpen(false);
                setSelectedStore(null);
                setAssignedSalesRepIds(new Set());
                setSalesReps([]);
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
