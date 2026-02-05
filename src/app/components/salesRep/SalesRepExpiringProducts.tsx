import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Calendar, Store, Package, Loader2, Search, X, RotateCcw } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';

interface ExpiringProduct {
  offerId: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  productId: string;
  productName: string;
  sku: string;
  brandId: string;
  brandName: string;
  quantity: number;
  price: number;
  currency: string;
  expiryDate: string;
  daysLeft: number;
}

interface ExpiringProductsResponse {
  items: ExpiringProduct[];
  total: number;
}

export function SalesRepExpiringProducts() {
  const [products, setProducts] = useState<ExpiringProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [warningDays, setWarningDays] = useState<string>('14');
  const [total, setTotal] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStore, setFilterStore] = useState<string>('all');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterDaysLeft, setFilterDaysLeft] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [returnProduct, setReturnProduct] = useState<ExpiringProduct | null>(null);
  const [returnQuantity, setReturnQuantity] = useState<string>('');
  const [returnReason, setReturnReason] = useState<string>('');
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    loadExpiringProducts();
  }, [warningDays]);

  const loadExpiringProducts = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (warningDays.trim()) {
        const parsedDays = Number(warningDays);
        if (!Number.isNaN(parsedDays) && parsedDays > 0) {
          params.warningDays = parsedDays;
        }
      }
      const response = await api.get<ExpiringProductsResponse>('/sales-reps/expiring-products', { params });
      setProducts(response.data?.items || []);
      setTotal(response.data?.total || 0);
    } catch (error: any) {
      console.error('Ошибка загрузки товаров с истекающим сроком', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось загрузить товары с истекающим сроком';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency || 'KZT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getDaysLeftColor = (daysLeft: number) => {
    if (daysLeft <= 0) return 'text-red-600 bg-red-50 border-red-200';
    if (daysLeft <= 3) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (daysLeft <= 7) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getDaysLeftLabel = (daysLeft: number) => {
    if (daysLeft < 0) {
      const absDays = Math.abs(daysLeft);
      if (absDays === 1) return '1 день';
      if (absDays <= 4) return `${absDays} дня`;
      return `${absDays} дней`;
    }
    if (daysLeft === 0) return 'Истекает сегодня';
    if (daysLeft === 1) return '1 день';
    if (daysLeft <= 4) return `${daysLeft} дня`;
    return `${daysLeft} дней`;
  };

  // Получаем уникальные значения для фильтров
  const uniqueStores = useMemo(() => {
    const stores = Array.from(new Set(products.map(p => p.storeName)));
    return stores.sort();
  }, [products]);

  const uniqueBrands = useMemo(() => {
    const brands = Array.from(new Set(products.map(p => p.brandName)));
    return brands.sort();
  }, [products]);

  // Фильтрация товаров
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Поиск по тексту
      const matchesSearch = searchQuery === '' || 
        product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brandName.toLowerCase().includes(searchQuery.toLowerCase());

      // Фильтр по магазину
      const matchesStore = filterStore === 'all' || product.storeName === filterStore;

      // Фильтр по бренду
      const matchesBrand = filterBrand === 'all' || product.brandName === filterBrand;

      // Фильтр по дням до истечения
      let matchesDays = true;
      if (filterDaysLeft === 'expired') {
        matchesDays = product.daysLeft < 0;
      } else if (filterDaysLeft === 'today') {
        matchesDays = product.daysLeft === 0;
      } else if (filterDaysLeft === '1-3') {
        matchesDays = product.daysLeft >= 1 && product.daysLeft <= 3;
      } else if (filterDaysLeft === '4-7') {
        matchesDays = product.daysLeft >= 4 && product.daysLeft <= 7;
      } else if (filterDaysLeft === '8-14') {
        matchesDays = product.daysLeft >= 8 && product.daysLeft <= 14;
      } else if (filterDaysLeft === '15+') {
        matchesDays = product.daysLeft >= 15;
      }

      return matchesSearch && matchesStore && matchesBrand && matchesDays;
    });
  }, [products, searchQuery, filterStore, filterBrand, filterDaysLeft]);

  // Очищаем выбранные товары, которые больше не видны после фильтрации
  useEffect(() => {
    const visibleOfferIds = new Set(filteredProducts.map(p => p.offerId));
    setSelectedProducts(prev => {
      const newSelected = new Set(
        Array.from(prev).filter(id => visibleOfferIds.has(id))
      );
      return newSelected.size !== prev.size ? newSelected : prev;
    });
  }, [filteredProducts]);

  // Обработка выбора товаров
  const handleToggleProduct = (offerId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(offerId)) {
      newSelected.delete(offerId);
    } else {
      newSelected.add(offerId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.offerId)));
    }
  };

  // Обработка возврата товара
  const handleReturnClick = () => {
    if (selectedProducts.size === 0) return;
    
    // Если выбран один товар, открываем диалог с его данными
    if (selectedProducts.size === 1) {
      const offerId = Array.from(selectedProducts)[0];
      const product = filteredProducts.find(p => p.offerId === offerId);
      if (product) {
        setReturnProduct(product);
        setReturnQuantity(product.quantity.toString());
        setIsReturnDialogOpen(true);
      }
    } else {
      // Если выбрано несколько товаров, возвращаем каждый по отдельности
      toast.info('Для возврата нескольких товаров выберите их по одному');
    }
  };

  const handleReturnSubmit = async () => {
    if (!returnProduct || !returnQuantity) {
      toast.error('Укажите количество для возврата');
      return;
    }

    const quantity = Number(returnQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Количество должно быть больше 0');
      return;
    }

    if (quantity > returnProduct.quantity) {
      toast.error(`Нельзя вернуть больше, чем есть на складе (${returnProduct.quantity} шт.)`);
      return;
    }

    setIsReturning(true);
    try {
      const response = await api.post('/sales-reps/return-product', {
        offerId: returnProduct.offerId,
        quantity: quantity,
        reason: returnReason || undefined,
      });

      toast.success(response.data?.message || 'Товар успешно возвращен');
      
      // Обновляем список товаров
      await loadExpiringProducts();
      
      // Очищаем выбранные товары
      const newSelected = new Set(selectedProducts);
      newSelected.delete(returnProduct.offerId);
      setSelectedProducts(newSelected);
      
      // Закрываем диалог
      setIsReturnDialogOpen(false);
      setReturnProduct(null);
      setReturnQuantity('');
      setReturnReason('');
    } catch (error: any) {
      console.error('Ошибка возврата товара', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось вернуть товар';
      toast.error(errorMessage);
    } finally {
      setIsReturning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-0">
      {/* Заголовок */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
          Товары с истекающим сроком
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Всего товаров: {total} | Отображается: {filteredProducts.length}
        </p>
      </div>

      {/* Поиск и фильтры */}
      <div className="space-y-3 bg-card border border-border rounded-lg p-4">
        {/* Поиск */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Поиск по названию, SKU, магазину или бренду..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Фильтры */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Фильтр по дням предупреждения */}
          <div>
          <label className="text-xs text-muted-foreground mb-1 block">
              Предупреждение (дней)
          </label>
            <Input
            type="number"
            min={1}
            value={warningDays}
            onChange={(e) => setWarningDays(e.target.value)}
            placeholder="14"
              className="w-full"
            />
          </div>

          {/* Фильтр по магазину */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Магазин
            </label>
            <Select value={filterStore} onValueChange={setFilterStore}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Все магазины" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все магазины</SelectItem>
                {uniqueStores.map(store => (
                  <SelectItem key={store} value={store}>{store}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Фильтр по бренду */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Бренд
            </label>
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Все бренды" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все бренды</SelectItem>
                {uniqueBrands.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Фильтр по дням до истечения */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Дни до истечения
            </label>
            <Select value={filterDaysLeft} onValueChange={setFilterDaysLeft}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="expired">Просрочено</SelectItem>
                <SelectItem value="today">Истекает сегодня</SelectItem>
                <SelectItem value="1-3">1-3 дня</SelectItem>
                <SelectItem value="4-7">4-7 дней</SelectItem>
                <SelectItem value="8-14">8-14 дней</SelectItem>
                <SelectItem value="15+">15+ дней</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет товаров с истекающим сроком</p>
          <p className="text-sm text-muted-foreground mt-2">
            Товары, срок годности которых истекает в течение {warningDays} дней, будут отображаться здесь
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет товаров, соответствующих фильтрам</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Кнопка возврата */}
          {selectedProducts.size > 0 && (
            <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">
                Выбрано товаров: <span className="font-semibold text-foreground">{selectedProducts.size}</span>
              </div>
              <Button
                onClick={handleReturnClick}
                variant="default"
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Возврат
              </Button>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="min-w-[200px]">Товар</TableHead>
                    <TableHead className="min-w-[120px]">SKU</TableHead>
                    <TableHead className="min-w-[150px]">Бренд</TableHead>
                    <TableHead className="min-w-[180px]">Магазин</TableHead>
                    <TableHead className="text-center min-w-[80px]">Кол-во</TableHead>
                    <TableHead className="text-right min-w-[100px]">Цена</TableHead>
                    <TableHead className="text-right min-w-[120px]">Сумма</TableHead>
                    <TableHead className="min-w-[120px]">Дата истечения</TableHead>
                    <TableHead className="text-center min-w-[120px]">Осталось дней</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.offerId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.has(product.offerId)}
                          onCheckedChange={() => handleToggleProduct(product.offerId)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="truncate">{product.productName}</span>
                        </div>
                      </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{product.sku}</span>
                    </TableCell>
                    <TableCell>{product.brandName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Store className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{product.storeName}</div>
                          <div className="text-xs text-muted-foreground truncate">{product.storeAddress}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{product.quantity}</span>
                      <span className="text-xs text-muted-foreground ml-1">шт.</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm font-medium">{formatCurrency(product.price, product.currency)}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm font-semibold text-green-600">
                        {formatCurrency(product.price * product.quantity, product.currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span>{formatDate(product.expiryDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getDaysLeftColor(product.daysLeft)}`}>
                        {getDaysLeftLabel(product.daysLeft)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Сводная статистика */}
          <div className="border-t border-border p-4 bg-muted/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Всего товаров</div>
                <div className="text-lg font-semibold">{filteredProducts.length}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Просрочено</div>
                <div className="text-lg font-semibold text-red-600">
                  {filteredProducts.filter(p => p.daysLeft < 0).length}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Истекает сегодня</div>
                <div className="text-lg font-semibold text-orange-600">
                  {filteredProducts.filter(p => p.daysLeft === 0).length}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Общая стоимость</div>
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency(
                    filteredProducts.reduce((sum, p) => sum + p.price * p.quantity, 0),
                    filteredProducts[0]?.currency || 'KZT'
                  )}
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно возврата */}
      <Dialog 
        open={isReturnDialogOpen} 
        onOpenChange={(open) => {
          setIsReturnDialogOpen(open);
          if (!open) {
            setReturnProduct(null);
            setReturnQuantity('');
            setReturnReason('');
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Возврат товара</DialogTitle>
            <DialogDescription>
              Укажите количество товара для возврата и причину (опционально)
            </DialogDescription>
          </DialogHeader>
          
          {returnProduct && (
            <div className="space-y-4 py-4">
              {/* Информация о товаре */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="font-semibold">{returnProduct.productName}</div>
                <div className="text-sm text-muted-foreground">
                  <div>SKU: {returnProduct.sku}</div>
                  <div>Магазин: {returnProduct.storeName}</div>
                  <div>Доступно на складе: <span className="font-semibold text-foreground">{returnProduct.quantity} шт.</span></div>
                </div>
              </div>

              {/* Количество */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Количество для возврата <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  max={returnProduct.quantity}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(e.target.value)}
                  placeholder="Введите количество"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Максимум: {returnProduct.quantity} шт.
                </p>
              </div>

              {/* Причина */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Причина возврата (опционально)
                </label>
                <Textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Например: Истек срок годности"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReturnDialogOpen(false);
                setReturnProduct(null);
                setReturnQuantity('');
                setReturnReason('');
              }}
              disabled={isReturning}
            >
              Отмена
            </Button>
            <Button
              onClick={handleReturnSubmit}
              disabled={isReturning || !returnQuantity}
            >
              {isReturning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Возврат...
                </>
              ) : (
                'Вернуть товар'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
