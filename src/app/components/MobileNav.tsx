import { Package, BarChart3, FolderTree, LogOut, Settings, Store, Users, Building2, MessageCircle, Brain, Network, History, Calendar, QrCode, ShoppingCart, AlertTriangle, TrendingDown, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

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
  const adminMenuItems = [
    { id: 'brands', label: 'Бренды', icon: Building2 },
    { id: 'categories', label: 'Категории', icon: FolderTree },
  ];
  const storeOwnerMenuItems = [
    { id: 'products', label: 'Товары', icon: Package },
    { id: 'inventory', label: 'Склад', icon: BarChart3 },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];
  const storeSellerMenuItems = [
    { id: 'pos', label: 'Касса', icon: ShoppingCart },
    { id: 'products', label: 'Товары', icon: Package },
    { id: 'qr-scanner', label: 'Приход', icon: QrCode },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];
  const storeMenuItems = userRole === 'storeSeller' ? storeSellerMenuItems : storeOwnerMenuItems;

  const brandMenuItems = [
    { id: 'catalog', label: 'Каталог', icon: Package },
    { id: 'distributors', label: 'Дистрибьюторы', icon: Network },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  // Для дистрибьютора: 3 основных раздела + остальное в меню
  const distributorMainItems = [
    { id: 'stores', label: 'Магазины', icon: Store },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
    { id: 'products', label: 'Товары', icon: Package },
  ];

  const distributorMenuItems = [
    { id: 'salesReps', label: 'Торговые представители', icon: Users },
    { id: 'requests', label: 'Запросы от брендов', icon: MessageCircle },
    { id: 'aiFAQ', label: 'AI-FAQ и обучение', icon: MessageCircle },
    { id: 'forecast', label: 'Прогноз спроса (AI)', icon: Brain },
    { id: 'history', label: 'История', icon: History },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  // Для торгового представителя: 3 основных раздела + остальное в меню
  const salesRepMainItems = [
    { id: 'analytics', label: 'Аналитика', icon: Brain },
    { id: 'stores', label: 'Магазины', icon: Store },
    { id: 'inventory', label: 'Остатки', icon: BarChart3 },
  ];

  const salesRepMenuItems = [
    { id: 'home', label: 'Главная', icon: Store },
    { id: 'history', label: 'История', icon: History },
    { id: 'productGroups', label: 'Группы товаров', icon: FolderTree },
    { id: 'expiring', label: 'Истекающий срок', icon: AlertTriangle },
    { id: 'poorlySelling', label: 'Плохо продается', icon: TrendingDown },
    { id: 'plan', label: 'План', icon: Calendar },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  // Определяем основные элементы для отображения (3 раздела)
  const mainItems =
    role === 'admin' ? adminMenuItems :
      role === 'store' ? storeMenuItems :
        role === 'brand' ? brandMenuItems :
          role === 'distributor' ? distributorMainItems :
            role === 'salesRep' ? salesRepMainItems :
              [];

  // Определяем элементы для бургер-меню
  const burgerMenuItems =
    role === 'distributor' ? distributorMenuItems :
      role === 'salesRep' ? salesRepMenuItems :
        [];

  // Закрываем меню при изменении вида
  useEffect(() => {
    setIsMenuOpen(false);
  }, [currentView]);

  const totalItems = mainItems.length + (burgerMenuItems.length > 0 ? 1 : 0) + 1; // +1 для бургер-меню, +1 для выхода
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
      {isMenuOpen && burgerMenuItems.length > 0 && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="md:hidden fixed bottom-20 left-0 right-0 bg-white border-t-2 border-gray-200 z-50 shadow-2xl max-h-[60vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Меню</h3>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
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
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Нижняя навигация */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 z-50 shadow-2xl pb-safe">
        <div className={`grid ${gridColsClass} gap-1 px-2 py-2 safe-area-inset-bottom`}>
          {mainItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl transition-all ${isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 active:bg-gray-100'
                  }`}
              >
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-xs leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Кнопка бургер-меню (если есть дополнительные элементы) */}
          {burgerMenuItems.length > 0 && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl transition-all ${isMenuOpen
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 active:bg-gray-100'
                }`}
            >
              <Menu className="w-6 h-6" strokeWidth={isMenuOpen ? 2.5 : 2} />
              <span className={`text-xs leading-tight ${isMenuOpen ? 'font-bold' : 'font-medium'}`}>
                Ещё
              </span>
            </button>
          )}

          {/* Кнопка выхода */}
          <button
            onClick={onLogout}
            className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-gray-600 active:bg-gray-100 transition-all"
          >
            <LogOut className="w-6 h-6" strokeWidth={2} />
            <span className="text-xs font-medium leading-tight">Выход</span>
          </button>
        </div>
      </nav>
    </>
  );
}