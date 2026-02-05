import { Package, BarChart3, FolderTree, LogOut, Settings, Store, Users, Building2, MessageCircle, Brain, Network, History, Calendar, QrCode, ShoppingCart, AlertTriangle, TrendingDown, Menu, X, Search, FileText, DollarSign } from 'lucide-react';
import { useState, useEffect, React } from 'react';

interface MobileNavProps {
  role: 'store' | 'brand' | 'admin' | 'distributor' | 'salesRep';
  currentView: string;
  onNavigate: (view: string) => void;
  userEmail: string;
  onLogout: () => void;
  userRole?: 'store' | 'storeSeller';
}

export function MobileNav({ role, currentView, onNavigate, userEmail, onLogout, userRole }: MobileNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const adminMenuItems = [
    { id: 'brands', label: 'Бренды', icon: Building2 },
    { id: 'categories', label: 'Категории', icon: FolderTree },
  ];
  // Для владельца магазина: 3 основных элемента
  const storeOwnerMainItems = [
    { id: 'products', label: 'Товары', icon: Package },
    { id: 'inventory', label: 'Склад', icon: BarChart3 },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  // Для владельца магазина: элементы в бургер-меню (история и настройки)
  const storeOwnerMenuItems = [
    { id: 'invoice-history', label: 'История накладных', icon: FileText },
    { id: 'activity-history', label: 'История действий', icon: History },
    { id: 'expenses', label: 'Расходы', icon: DollarSign },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  // Для продавца: основные элементы в нижней навигации
  const storeSellerMainItems = [
    { id: 'pos', label: 'Касса', icon: ShoppingCart },
    { id: 'sales-history', label: 'История', icon: History },
    { id: 'qr-scanner', label: 'Приход', icon: QrCode },
  ];

  // Для продавца: элементы в бургер-меню (настройки)
  const storeSellerBurgerMenuItems = [
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  // Для владельца магазина используем основные элементы без настроек
  const storeMainItems = userRole === 'storeSeller' ? storeSellerMainItems : storeOwnerMainItems;
  const storeMenuItems = userRole === 'storeSeller' ? storeSellerBurgerMenuItems : storeOwnerMenuItems;

  const brandMainItems = [
    { id: 'catalog', label: 'Каталог', icon: Package },
    { id: 'distributors', label: 'Партнеры', icon: Network },
    { id: 'searchStatistics', label: 'Поиск', icon: Search },
  ];

  const brandMenuItems = [
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  // Для Дс: 4 элемента в нижней навигации (3 основных + бургер-меню)
  const distributorMainItems = [
    { id: 'salesReps', label: 'ТП', icon: Users },
    { id: 'products', label: 'Товары', icon: Package },
    { id: 'stores', label: 'Магазины', icon: Store },
  ];

  const distributorMenuItems = [
    { id: 'poorlySelling', label: 'Низкие продажи', icon: TrendingDown },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
    { id: 'forecast', label: 'Прогноз спроса (AI)', icon: Brain },
    { id: 'history', label: 'История', icon: History },
    { id: 'requests', label: 'Запросы от брендов', icon: MessageCircle },
    { id: 'aiFAQ', label: 'AI-FAQ и обучение', icon: MessageCircle },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  // Для ТП: 4 элемента в нижней навигации (3 основных + бургер-меню)
  const salesRepMainItems = [
    { id: 'plan', label: 'План продаж', icon: Calendar },
    { id: 'stores', label: 'Магазины', icon: Store },
    { id: 'analytics', label: 'Аналитика', icon: Brain },
  ];

  const salesRepMenuItems = [
    { id: 'productGroups', label: 'Группы товаров', icon: FolderTree },
    { id: 'inventory', label: 'Контроль остатков', icon: BarChart3 },
    { id: 'poorlySelling', label: 'Низкие продажи', icon: TrendingDown },
    { id: 'expiring', label: 'Истекающий срок', icon: AlertTriangle },
    { id: 'history', label: 'История', icon: History },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  // Определяем основные элементы для отображения (3 раздела)
  const mainItems =
    role === 'admin' ? adminMenuItems :
      role === 'store' ? storeMainItems :
        role === 'brand' ? brandMainItems :
          role === 'distributor' ? distributorMainItems :
            role === 'salesRep' ? salesRepMainItems :
              [];

  // Определяем элементы для бургер-меню
  const burgerMenuItems =
    role === 'store' ? storeMenuItems :
      role === 'brand' ? brandMenuItems :
        role === 'distributor' ? distributorMenuItems :
          role === 'salesRep' ? salesRepMenuItems :
            [];

  // Закрываем меню при изменении вида
  useEffect(() => {
    setIsMenuOpen(false);
  }, [currentView]);

  // Управление видимостью навигации с помощью кастомного события (например, при фокусе на инпуте на мобильных)
  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ hidden: boolean }>;
      if (typeof customEvent.detail?.hidden === 'boolean') {
        setIsHidden(customEvent.detail.hidden);
      }
    };

    window.addEventListener('mobileNavVisibilityChange', handler as EventListener);
    return () => {
      window.removeEventListener('mobileNavVisibilityChange', handler as EventListener);
    };
  }, []);

  // Для Дс, ТП, владельца магазина и бренда - только 4 элемента (3 основных + бургер-меню)
  // Для остальных ролей - как было (с кнопкой выхода)
  const shouldShowLogoutInNav = role !== 'distributor' && role !== 'salesRep' && role !== 'store' && role !== 'brand';

  // Для роли store всегда показываем бургер-меню (даже если burgerMenuItems пустой)
  const shouldShowBurgerMenu = burgerMenuItems.length > 0 || !shouldShowLogoutInNav;

  const totalItems = shouldShowLogoutInNav
    ? mainItems.length + (shouldShowBurgerMenu ? 1 : 0) + 1 // +1 для бургер-меню (если есть), +1 для выхода
    : mainItems.length + 1; // +1 для бургер-меню (всегда для store/distributor/salesRep)
  const gridColsClass =
    totalItems === 3
      ? 'grid-cols-3'
      : totalItems === 4
        ? 'grid-cols-4'
        : totalItems === 5
          ? 'grid-cols-5'
          : totalItems === 6
            ? 'grid-cols-6'
            : 'grid-cols-4';

  return (
    <>
      {/* Бургер-меню (overlay) */}
      {isMenuOpen && shouldShowBurgerMenu && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="md:hidden fixed bottom-20 left-0 right-0 bg-card border-t-2 border-border z-50 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Меню</h3>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>
              <div className="space-y-1">
                {burgerMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent'
                        }`}
                    >
                      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
                {/* Кнопка выхода в бургер-меню для Дс, ТП, владельца магазина и бренда */}
                {!shouldShowLogoutInNav && (
                  <>
                    <div className="border-t border-border my-2" />
                    <button
                      onClick={() => {
                        onLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="w-5 h-5" strokeWidth={2} />
                      <span className="font-medium">Выход</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Нижняя навигация */}
      {!isHidden && (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border z-50 shadow-2xl pb-safe">
        <div className={`grid ${gridColsClass} gap-1 px-2 py-2 safe-area-inset-bottom`}>
          {mainItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl transition-all ${isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-foreground active:bg-accent'
                  }`}
              >
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-xs leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Кнопка бургер-меню (если есть дополнительные элементы или нужно скрыть выход) */}
          {shouldShowBurgerMenu && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl transition-all ${burgerMenuItems.some(item => item.id === currentView && !mainItems.some(mainItem => mainItem.id === currentView))
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-foreground active:bg-accent'
                }`}
            >
              <Menu className="w-6 h-6" strokeWidth={burgerMenuItems.some(item => item.id === currentView && !mainItems.some(mainItem => mainItem.id === currentView)) ? 2.5 : 2} />
              <span className={`text-xs leading-tight ${burgerMenuItems.some(item => item.id === currentView && !mainItems.some(mainItem => mainItem.id === currentView)) ? 'font-bold' : 'font-medium'}`}>
                Ещё
              </span>
            </button>
          )}

          {/* Кнопка выхода (только для ролей, где она должна быть в навигации) */}
          {shouldShowLogoutInNav && (
            <button
              onClick={onLogout}
              className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-foreground active:bg-accent transition-all"
            >
              <LogOut className="w-6 h-6" strokeWidth={2} />
              <span className="text-xs font-medium leading-tight">Выход</span>
            </button>
          )}
        </div>
      </nav>
      )}
    </>
  );
}