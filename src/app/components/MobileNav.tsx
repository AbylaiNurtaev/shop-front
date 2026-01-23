import { Package, BarChart3, FolderTree, LogOut, Settings, Store, Users, Building2, MessageCircle, Brain, Network, History, Calendar, QrCode, ShoppingCart, AlertTriangle, TrendingDown } from 'lucide-react';

interface MobileNavProps {
  role: 'store' | 'brand' | 'admin' | 'distributor' | 'salesRep';
  currentView: string;
  onNavigate: (view: string) => void;
  userEmail: string;
  onLogout: () => void;
  userRole?: 'store' | 'storeSeller';
}

export function MobileNav({ role, currentView, onNavigate, userEmail, onLogout, userRole }: MobileNavProps) {
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
    { id: 'qr-scanner', label: 'Приход', icon: QrCode },
    { id: 'pos', label: 'Касса', icon: ShoppingCart },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];
  const storeMenuItems = userRole === 'storeSeller' ? storeSellerMenuItems : storeOwnerMenuItems;

  const brandMenuItems = [
    { id: 'catalog', label: 'Каталог', icon: Package },
    { id: 'distributors', label: 'Дистрибьюторы', icon: Network },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  const distributorMenuItems = [
    { id: 'stores', label: 'Магазины', icon: Store },
    { id: 'salesReps', label: 'ТП', icon: Users },
    { id: 'requests', label: 'Запросы', icon: MessageCircle },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
    { id: 'aiFAQ', label: 'AI-FAQ', icon: MessageCircle },
    { id: 'forecast', label: 'Прогноз', icon: Brain },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  const salesRepMenuItems = [
    { id: 'home', label: 'Главная', icon: Store },
    { id: 'stores', label: 'Магазины', icon: Store },
    { id: 'productGroups', label: 'Товары', icon: FolderTree },
    { id: 'inventory', label: 'Остатки', icon: BarChart3 },
    { id: 'analytics', label: 'Аналитика', icon: Brain },
    { id: 'expiring', label: 'Срок', icon: AlertTriangle },
    { id: 'poorlySelling', label: 'Плохо', icon: TrendingDown },
    { id: 'plan', label: 'План', icon: Calendar },
    { id: 'history', label: 'История', icon: History },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  const menuItems =
    role === 'admin' ? adminMenuItems :
      role === 'store' ? storeMenuItems :
        role === 'brand' ? brandMenuItems :
          role === 'distributor' ? distributorMenuItems :
            role === 'salesRep' ? salesRepMenuItems :
              [];
  const totalItems = menuItems.length + 1;
  // Для торгового представителя используем 2 ряда по 4 элемента
  const gridColsClass =
    role === 'salesRep'
      ? 'grid-cols-4'
      : totalItems === 3
        ? 'grid-cols-3'
        : totalItems === 5
          ? 'grid-cols-5'
          : totalItems === 6
            ? 'grid-cols-6'
            : 'grid-cols-4';

  return (
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 z-50 shadow-2xl ${role === 'salesRep' ? 'pb-safe' : ''}`}>
      <div className={`grid ${gridColsClass} gap-1 px-2 ${role === 'salesRep' ? 'py-1' : 'py-2'} safe-area-inset-bottom`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 ${role === 'salesRep' ? 'px-1 py-2' : 'px-2 py-3'} rounded-xl transition-all ${isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 active:bg-gray-100'
                }`}
            >
              <Icon className={`${role === 'salesRep' ? 'w-5 h-5' : 'w-6 h-6'}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`${role === 'salesRep' ? 'text-[10px]' : 'text-xs'} leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Profile/Logout Button */}
        <button
          onClick={onLogout}
          className={`flex flex-col items-center gap-1 ${role === 'salesRep' ? 'px-1 py-2' : 'px-2 py-3'} rounded-xl text-gray-600 active:bg-gray-100 transition-all`}
        >
          <LogOut className={`${role === 'salesRep' ? 'w-5 h-5' : 'w-6 h-6'}`} strokeWidth={2} />
          <span className={`${role === 'salesRep' ? 'text-[10px]' : 'text-xs'} font-medium leading-tight`}>Выход</span>
        </button>
      </div>
    </nav>
  );
}