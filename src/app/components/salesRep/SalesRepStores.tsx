import React, { useState, useEffect } from 'react';
import { Store, MapPin, Phone, Mail, Package, Loader2, Search, ExternalLink, User, X } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface StoreOwner {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}

interface Store {
  id: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  productCount?: number;
  owner?: StoreOwner;
  // Поля владельца могут быть напрямую в объекте магазина
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phoneNumber?: string;
  location?: string | {
    link?: string;
  };
  locationLink?: string;
}

export function SalesRepStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ items?: Store[] }>('/sales-reps/stores');
      const items = response.data?.items || response.data || [];
      setStores(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Ошибка загрузки магазинов', error);
      toast.error('Не удалось загрузить магазины');
    } finally {
      setIsLoading(false);
    }
  };

  // Получаем ссылку на 2ГИС из разных форматов
  const getLocationLink = (store: Store): string | null => {
    if (typeof store.location === 'string') {
      return store.location;
    }
    if (store.location && typeof store.location === 'object' && store.location.link) {
      return store.location.link;
    }
    if (store.locationLink) {
      return store.locationLink;
    }
    return null;
  };

  // Получаем данные владельца из объекта магазина (может быть в owner или напрямую)
  const getOwnerData = (store: Store) => {
    return {
      firstName: store.owner?.firstName || store.firstName,
      lastName: store.owner?.lastName || store.lastName,
      middleName: store.middleName,
      phoneNumber: store.owner?.phoneNumber || store.phoneNumber,
      email: store.owner?.email,
    };
  };

  // Получаем полное имя владельца
  const getOwnerName = (store: Store): string | null => {
    const owner = getOwnerData(store);
    const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ');
    return name || null;
  };

  // Фильтрация магазинов по поисковому запросу
  const filteredStores = stores.filter((store) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const owner = getOwnerData(store);
    return (
      store.name.toLowerCase().includes(query) ||
      store.address?.toLowerCase().includes(query) ||
      store.city?.toLowerCase().includes(query) ||
      store.phone?.toLowerCase().includes(query) ||
      store.email?.toLowerCase().includes(query) ||
      owner.phoneNumber?.toLowerCase().includes(query) ||
      owner.firstName?.toLowerCase().includes(query) ||
      owner.lastName?.toLowerCase().includes(query) ||
      owner.middleName?.toLowerCase().includes(query) ||
      owner.email?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
          <Store className="w-5 h-5 md:w-6 md:h-6" />
          Магазины
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Всего магазинов: {filteredStores.length} {searchQuery && `из ${stores.length}`}
        </p>
      </div>

      {/* Поисковое окно */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по названию, адресу, городу, телефону, email или владельцу..."
          className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        />
      </div>

      {filteredStores.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 md:p-12 text-center">
          <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground text-base">
            {searchQuery ? 'Магазины не найдены' : 'Нет закрепленных магазинов'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredStores.map((store) => {
            const locationLink = getLocationLink(store);
            const ownerName = getOwnerName(store);
            const owner = getOwnerData(store);

            return (
              <div
                key={store.id}
                className="bg-card border border-border rounded-xl p-5 md:p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer group"
                onClick={() => setSelectedStore(store)}
              >
                {/* Заголовок карточки */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Store className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg md:text-xl mb-2 text-foreground group-hover:text-primary transition-colors">
                      {store.name}
                    </h3>
                    {store.address && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{store.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Информация о владельце */}
                {(ownerName || owner.phoneNumber) && (
                  <div className="mb-4 pb-4 border-b border-border">
                    {ownerName && (
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-0.5">Владелец</p>
                          <p className="font-semibold text-foreground truncate">{ownerName}</p>
                        </div>
                      </div>
                    )}
                    {owner.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          {!ownerName && <p className="text-xs text-muted-foreground mb-0.5">Телефон владельца</p>}
                          <a
                            href={`tel:${owner.phoneNumber}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {owner.phoneNumber}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Кнопка 2ГИС */}
                {locationLink && (
                  <div className="mb-4">
                    <a
                      href={locationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105 active:scale-95 w-full justify-center"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Открыть в 2ГИС</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Дополнительная информация */}
                <div className="space-y-2 pt-3 border-t border-border">
                  {store.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <a
                        href={`tel:${store.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-primary transition-colors truncate"
                      >
                        {store.phone}
                      </a>
                    </div>
                  )}
                  {store.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <a
                        href={`mailto:${store.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-primary transition-colors truncate"
                      >
                        {store.email}
                      </a>
                    </div>
                  )}
                  {store.productCount !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="w-4 h-4 flex-shrink-0" />
                      <span>Товаров: <span className="font-semibold">{store.productCount}</span></span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно с деталями магазина */}
      {selectedStore && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-6 animate-in fade-in duration-200"
          onClick={() => setSelectedStore(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок модального окна */}
            <div className="p-5 md:p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Store className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold mb-1 text-foreground">{selectedStore.name}</h2>
                  {selectedStore.address && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{selectedStore.address}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedStore(null)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
                  aria-label="Закрыть"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Содержимое модального окна */}
            <div className="p-5 md:p-6 space-y-5 overflow-y-auto flex-1">
              {/* Кнопка 2ГИС */}
              {getLocationLink(selectedStore) && (
                <div>
                  <a
                    href={getLocationLink(selectedStore)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm md:text-base transition-all duration-200 hover:bg-primary/90 hover:scale-105 active:scale-95 w-full justify-center shadow-lg"
                  >
                    <MapPin className="w-5 h-5" />
                    <span>Открыть в 2ГИС</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Информация о владельце */}
              {(() => {
                const owner = getOwnerData(selectedStore);
                const ownerName = getOwnerName(selectedStore);
                return (ownerName || owner.phoneNumber || owner.email) ? (
                  <div className="border border-border rounded-xl p-4 md:p-5 bg-gradient-to-br from-muted/50 to-muted/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-base md:text-lg font-semibold">Владелец магазина</h3>
                    </div>
                    <div className="space-y-3 pl-2">
                      {ownerName && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Имя</p>
                          <p className="text-base md:text-lg font-semibold text-foreground">
                            {ownerName}
                          </p>
                        </div>
                      )}
                      {owner.phoneNumber && (
                        <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                          <p className="text-xs text-muted-foreground mb-2">Телефон</p>
                          <a
                            href={`tel:${owner.phoneNumber}`}
                            className="flex items-center gap-2 text-lg md:text-xl font-bold text-primary hover:underline"
                          >
                            <Phone className="w-5 h-5" />
                            {owner.phoneNumber}
                          </a>
                        </div>
                      )}
                      {owner.email && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Email</p>
                          <a
                            href={`mailto:${owner.email}`}
                            className="flex items-center gap-2 text-sm md:text-base text-primary hover:underline break-all"
                          >
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            {owner.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Контакты магазина */}
              {(selectedStore.phone || selectedStore.email) && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Контакты магазина</h3>
                  {selectedStore.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Телефон</p>
                        <a
                          href={`tel:${selectedStore.phone}`}
                          className="text-base font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {selectedStore.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {selectedStore.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                        <a
                          href={`mailto:${selectedStore.email}`}
                          className="text-sm md:text-base text-foreground hover:text-primary transition-colors break-all"
                        >
                          {selectedStore.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Дополнительная информация */}
              {selectedStore.productCount !== undefined && (
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Товаров в магазине</p>
                    <p className="text-base md:text-lg font-semibold text-foreground">{selectedStore.productCount}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
