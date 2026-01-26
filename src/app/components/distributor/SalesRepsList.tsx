import React, { useEffect, useState } from 'react';
import { Users, Phone, Mail, MapPin, Loader2, Trash2, Plus, Store, ChevronRight, Package, Search, ArrowLeft, Target, FolderTree, Eye } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { PlanManagement } from './PlanManagement';
import { CategoryPlansManagement } from './CategoryPlansManagement';
import { ProductSalesModal } from '../salesRep/ProductSalesModal';

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

interface Product {
  id: string;
  name: string;
  sku?: string;
  brandName?: string;
  brandId?: string;
  categoryId?: string;
  images?: string[];
}

export function SalesRepsList() {
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [salesRepresentativeId, setSalesRepresentativeId] = useState('');
  const [selectedSalesRep, setSelectedSalesRep] = useState<SalesRep | null>(null);
  const [isDetailView, setIsDetailView] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [assignedStores, setAssignedStores] = useState<Store[]>([]);
  const [availableStores, setAvailableStores] = useState<Store[]>([]);
  const [isStoresLoading, setIsStoresLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [isDeletingStore, setIsDeletingStore] = useState<string | null>(null);
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set());
  const [isBatchAdding, setIsBatchAdding] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('stores');
  
  // Состояния для товаров
  const [assignedProducts, setAssignedProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isAssigningProduct, setIsAssigningProduct] = useState<string | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isBatchAddingProducts, setIsBatchAddingProducts] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isPlanManagementOpen, setIsPlanManagementOpen] = useState(false);
  const [isCategoryPlansManagementOpen, setIsCategoryPlansManagementOpen] = useState(false);
  const [selectedProductIdForSales, setSelectedProductIdForSales] = useState<string | null>(null);
  const [isProductSalesModalOpen, setIsProductSalesModalOpen] = useState(false);

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
      console.error('Ошибка загрузки ТП', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить ТП';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSalesRep = async () => {
    if (!salesRepresentativeId.trim()) {
      toast.error('Введите ID ТП');
      return;
    }

    setIsAdding(true);
    try {
      await api.post('/distributors/sales-representatives', {
        salesRepresentativeId: salesRepresentativeId.trim(),
      });
      toast.success('ТП успешно добавлен');
      setIsAddDialogOpen(false);
      setSalesRepresentativeId('');
      await loadSalesReps();
    } catch (error: any) {
      console.error('Ошибка добавления ТП', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось добавить ТП';
      toast.error(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteSalesRep = async (salesRepresentativeId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого ТП?')) {
      return;
    }

    setIsDeleting(salesRepresentativeId);
    try {
      await api.delete(`/distributors/sales-representatives/${salesRepresentativeId}`);
      toast.success('ТП успешно удален');
      await loadSalesReps();
    } catch (error: any) {
      console.error('Ошибка удаления ТП', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось удалить ТП';
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
      console.error('Ошибка загрузки магазинов ТП', error);
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

  const openDetailView = async (salesRep: SalesRep) => {
    setSelectedSalesRep(salesRep);
    setIsDetailView(true);
    setSelectedStoreIds(new Set());
    setSelectedProductIds(new Set());
    setActiveTab('stores');
    setStoreSearchQuery('');
    setProductSearchQuery('');
    // Загружаем магазины сразу
    await Promise.all([
      loadSalesRepStores(salesRep.id),
      loadAvailableStores(),
    ]);
    // Товары будут загружены при переключении на вкладку товаров
  };

  const closeDetailView = () => {
    setIsDetailView(false);
    setSelectedSalesRep(null);
    setAssignedStores([]);
    setAvailableStores([]);
    setSelectedStoreIds(new Set());
    setAssignedProducts([]);
    setAvailableProducts([]);
    setSelectedProductIds(new Set());
    setStoreSearchQuery('');
    setProductSearchQuery('');
    setActiveTab('stores');
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
    if (!confirm('Вы уверены, что хотите удалить этот магазин у ТП?')) {
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

  // Функции для работы с товарами
  const loadSalesRepProducts = async (salesRepId: string) => {
    setIsProductsLoading(true);
    try {
      const response = await api.get<{ items?: Product[] }>(`/distributors/sales-representatives/${salesRepId}/products`);
      const items = response.data?.items || response.data || [];
      const productsList = Array.isArray(items) ? items : [];
      setAssignedProducts(productsList);
    } catch (error: any) {
      console.error('Ошибка загрузки товаров ТП', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить товары';
      toast.error(errorMessage);
      setAssignedProducts([]);
    } finally {
      setIsProductsLoading(false);
    }
  };

  const loadAvailableProducts = async () => {
    try {
      // Получаем список всех товаров от подключенных брендов Дс
      const response = await api.get<{ items?: Product[]; total?: number }>('/distributors/me/products');
      const items = response.data?.items || [];
      const productsList = Array.isArray(items) ? items : [];
      setAvailableProducts(productsList);
    } catch (error: any) {
      console.error('Ошибка загрузки доступных товаров', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить товары';
      toast.error(errorMessage);
      setAvailableProducts([]);
    }
  };

  const handleAddProduct = async (productId: string) => {
    if (!selectedSalesRep) return;
    setIsAssigningProduct(productId);
    try {
      await api.post(`/distributors/sales-representatives/${selectedSalesRep.id}/products`, {
        productId: productId,
      });
      toast.success('Товар успешно закреплен');
      // Обновляем оба списка для синхронизации
      await Promise.all([
        loadSalesRepProducts(selectedSalesRep.id),
        loadAvailableProducts(),
      ]);
    } catch (error: any) {
      console.error('Ошибка закрепления товара', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось закрепить товар';
      toast.error(errorMessage);
    } finally {
      setIsAssigningProduct(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!selectedSalesRep) return;
    if (!confirm('Вы уверены, что хотите открепить этот товар у ТП?')) {
      return;
    }
    setIsDeletingProduct(productId);
    try {
      await api.delete(`/distributors/sales-representatives/${selectedSalesRep.id}/products/${productId}`);
      toast.success('Товар успешно откреплен');
      // Обновляем оба списка для синхронизации
      await Promise.all([
        loadSalesRepProducts(selectedSalesRep.id),
        loadAvailableProducts(),
      ]);
    } catch (error: any) {
      console.error('Ошибка открепления товара', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось открепить товар';
      toast.error(errorMessage);
    } finally {
      setIsDeletingProduct(null);
    }
  };

  const handleBatchAddProducts = async () => {
    if (!selectedSalesRep || selectedProductIds.size === 0) return;
    setIsBatchAddingProducts(true);
    try {
      const productIds = Array.from(selectedProductIds);
      const response = await api.post<{
        message: string;
        added?: Array<{ id: string; salesRepresentativeId: string; productId: string; distributorId: string }>;
        alreadyAssigned?: string[];
        totalAdded?: number;
        totalSkipped?: number;
      }>(`/distributors/sales-representatives/${selectedSalesRep.id}/products/batch`, {
        productIds: productIds,
      });
      
      const data = response.data;
      const totalAdded = data.totalAdded || data.added?.length || 0;
      const totalSkipped = data.totalSkipped || data.alreadyAssigned?.length || 0;
      
      if (totalSkipped > 0) {
        toast.success(`Закреплено товаров: ${totalAdded}. Пропущено (уже закреплены): ${totalSkipped}`);
      } else {
        toast.success(`Успешно закреплено товаров: ${totalAdded}`);
      }
      
      setSelectedProductIds(new Set());
      // Обновляем оба списка для синхронизации
      await Promise.all([
        loadSalesRepProducts(selectedSalesRep.id),
        loadAvailableProducts(),
      ]);
    } catch (error: any) {
      console.error('Ошибка массового закрепления товаров', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось закрепить товары';
      toast.error(errorMessage);
    } finally {
      setIsBatchAddingProducts(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Фильтрация магазинов по поисковому запросу
  const filteredStores = availableStores.filter((store) => {
    if (!storeSearchQuery.trim()) return true;
    const query = storeSearchQuery.toLowerCase();
    return (
      store.name.toLowerCase().includes(query) ||
      store.address?.toLowerCase().includes(query) ||
      store.city?.toLowerCase().includes(query)
    );
  });

  const filteredAssignedStores = assignedStores.filter((store) => {
    if (!storeSearchQuery.trim()) return true;
    const query = storeSearchQuery.toLowerCase();
    return (
      store.name.toLowerCase().includes(query) ||
      store.address?.toLowerCase().includes(query) ||
      store.city?.toLowerCase().includes(query)
    );
  });

  // Фильтрация товаров по поисковому запросу
  const filteredProducts = availableProducts.filter((product) => {
    if (!productSearchQuery.trim()) return true;
    const query = productSearchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query) ||
      product.brandName?.toLowerCase().includes(query)
    );
  });

  const filteredAssignedProducts = assignedProducts.filter((product) => {
    if (!productSearchQuery.trim()) return true;
    const query = productSearchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query) ||
      product.brandName?.toLowerCase().includes(query)
    );
  });

  const handleViewProductSales = (productId: string) => {
    setSelectedProductIdForSales(productId);
    setIsProductSalesModalOpen(true);
  };

  const handleCloseProductSalesModal = () => {
    setIsProductSalesModalOpen(false);
    setSelectedProductIdForSales(null);
  };

  // Загрузка товаров при переключении на вкладку товаров
  useEffect(() => {
    if (activeTab === 'products' && selectedSalesRep && isDetailView) {
      loadSalesRepProducts(selectedSalesRep.id);
      loadAvailableProducts();
    }
  }, [activeTab, selectedSalesRep, isDetailView]);

  // Если открыт детальный вид, показываем его
  if (isDetailView && selectedSalesRep) {
    return (
      <div className="space-y-4 p-4 md:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="outline"
              onClick={closeDetailView}
              className="flex items-center gap-2"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Назад</span>
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold">Управление</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                ТП: {selectedSalesRep.firstName} {selectedSalesRep.lastName}
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stores">Закрепленные магазины</TabsTrigger>
            <TabsTrigger value="products">Закрепление товаров</TabsTrigger>
          </TabsList>
          
          {/* Вкладка: Закрепленные магазины */}
          <TabsContent value="stores" className="space-y-6 py-4">
            {/* Поиск магазинов */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск магазинов..."
                value={storeSearchQuery}
                onChange={(e) => setStoreSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Закрепленные магазины */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Store className="w-5 h-5" />
                Закрепленные магазины ({filteredAssignedStores.length})
              </h3>
              {isStoresLoading ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Загрузка магазинов...</span>
                </div>
              ) : filteredAssignedStores.length === 0 ? (
                <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
                  <Store className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Нет закрепленных магазинов</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredAssignedStores.map((store) => (
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
              {filteredStores.length === 0 ? (
                <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
                  <Store className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Нет доступных магазинов</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredStores
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
          </TabsContent>

          {/* Вкладка: Закрепление товаров */}
          <TabsContent value="products" className="space-y-6 py-4">
            {/* Поиск товаров */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск товаров..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Кнопки управления планами */}
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setIsPlanManagementOpen(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                Задать план
              </Button>
              <Button
                onClick={() => setIsCategoryPlansManagementOpen(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FolderTree className="w-4 h-4" />
                Планы по категориям
              </Button>
            </div>

            {/* Закрепленные товары */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Закрепленные товары ({filteredAssignedProducts.length})
              </h3>
              {isProductsLoading ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Загрузка товаров...</span>
                </div>
              ) : filteredAssignedProducts.length === 0 ? (
                <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
                  <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Нет закрепленных товаров</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredAssignedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-card border border-border rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium mb-1">{product.name}</h4>
                          {product.sku && (
                            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                          )}
                          {product.brandName && (
                            <p className="text-xs text-muted-foreground">Бренд: {product.brandName}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={isDeletingProduct === product.id}
                          className="ml-2 p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          title="Открепить товар"
                        >
                          {isDeletingProduct === product.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <Button
                        onClick={() => handleViewProductSales(product.id)}
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Посмотреть продажи
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Доступные товары для закрепления */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Доступные товары
                </h3>
                {selectedProductIds.size > 0 && (
                  <Button
                    onClick={handleBatchAddProducts}
                    disabled={isBatchAddingProducts}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {isBatchAddingProducts ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Закрепление...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Закрепить выбранные ({selectedProductIds.size})
                      </>
                    )}
                  </Button>
                )}
              </div>
              {filteredProducts.length === 0 ? (
                <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
                  <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Нет доступных товаров</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredProducts
                    .filter((product) => !assignedProducts.some((ap) => ap.id === product.id))
                    .map((product) => (
                      <label
                        key={product.id}
                        className="flex items-center justify-between gap-3 border border-border rounded-md px-3 py-2 hover:bg-muted/50 cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{product.name}</div>
                          {product.sku && (
                            <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                          )}
                          {product.brandName && (
                            <div className="text-xs text-muted-foreground">Бренд: {product.brandName}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddProduct(product.id);
                            }}
                            disabled={isAssigningProduct === product.id}
                            size="sm"
                            variant="outline"
                          >
                            {isAssigningProduct === product.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </Button>
                          <Checkbox
                            checked={selectedProductIds.has(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </label>
                    ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Модальное окно управления планами */}
        {isPlanManagementOpen && selectedSalesRep && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsPlanManagementOpen(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsPlanManagementOpen(false);
              }
            }}
            tabIndex={-1}
          >
            <div 
              className="bg-card border border-border rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 md:p-6">
                <PlanManagement
                  salesRepresentativeId={selectedSalesRep.id}
                  salesRepName={`${selectedSalesRep.firstName} ${selectedSalesRep.lastName}`}
                  onClose={() => setIsPlanManagementOpen(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно управления планами по категориям */}
        {isCategoryPlansManagementOpen && selectedSalesRep && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsCategoryPlansManagementOpen(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsCategoryPlansManagementOpen(false);
              }
            }}
            tabIndex={-1}
          >
            <div 
              className="bg-card border border-border rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <CategoryPlansManagement
                  salesRepresentativeId={selectedSalesRep.id}
                  salesRepName={`${selectedSalesRep.firstName} ${selectedSalesRep.lastName}`}
                  onClose={() => setIsCategoryPlansManagementOpen(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Иначе показываем список ТП
  return (
    <div className="space-y-4 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-semibold">ТП</h1>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="flex items-center gap-2 self-start sm:self-auto"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          Добавить ТП
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Loader2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Загрузка ТП...</p>
        </div>
      ) : salesReps.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">ТП не найдены</p>
          <p className="text-sm text-muted-foreground mt-2">Добавьте первого ТП</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {salesReps.map((rep) => (
            <div
              key={rep.id}
              role="button"
              tabIndex={0}
              onClick={() => openDetailView(rep)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openDetailView(rep);
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
                title="Удалить ТП"
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

      {/* Диалог добавления ТП */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить ТП</DialogTitle>
            <DialogDescription>
              Введите ID ТП для добавления в ваш список
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="salesRepId">ID ТП</Label>
              <Input
                id="salesRepId"
                value={salesRepresentativeId}
                onChange={(e) => setSalesRepresentativeId(e.target.value)}
                placeholder="Введите ID ТП"
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

      {/* Модальное окно продаж товара */}
      {selectedProductIdForSales && selectedSalesRep && (
        <ProductSalesModal
          isOpen={isProductSalesModalOpen}
          onClose={handleCloseProductSalesModal}
          productId={selectedProductIdForSales}
          salesRepresentativeId={selectedSalesRep.id}
        />
      )}

    </div>
  );
}
