import { Package, BarChart3, FolderTree, Store, Menu, X, Search, Settings, Users, Building2, TrendingUp, MessageCircle, Brain, Network, History, FolderTree as FolderTreeIcon, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SidebarProps {
  role: 'store' | 'brand' | 'admin' | 'distributor' | 'salesRep';
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Sidebar({ role, currentView, onNavigate }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const storeMenuItems = [
    { id: 'products', label: 'Товары', icon: Package },
    { id: 'inventory', label: 'Склад', icon: BarChart3 },
    { id: 'categories', label: 'Категории', icon: FolderTree },
    { id: 'search', label: 'Поиск', icon: Search },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  const brandMenuItems = [
    { id: 'catalog', label: 'Каталог товаров', icon: Package },
    { id: 'distributors', label: 'Дистрибьюторы', icon: Network },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  const distributorMenuItems = [
    { id: 'stores', label: 'Магазины', icon: Store },
    { id: 'salesReps', label: 'Торговые представители', icon: Users },
    { id: 'brands', label: 'Бренды / Товары', icon: Building2 },
    { id: 'requests', label: 'Запросы от брендов', icon: MessageCircle },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
    { id: 'aiFAQ', label: 'AI-FAQ и обучение', icon: MessageCircle },
    { id: 'forecast', label: 'Прогноз спроса (AI)', icon: Brain },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  const salesRepMenuItems = [
    { id: 'home', label: 'Главная', icon: Store },
    { id: 'chat', label: 'Чат', icon: MessageCircle },
    { id: 'history', label: 'История', icon: History },
    { id: 'stores', label: 'Магазины', icon: Store },
    { id: 'productGroups', label: 'Группы товаров', icon: FolderTreeIcon },
    { id: 'analytics', label: 'AI-аналитика', icon: Brain },
    { id: 'inventory', label: 'Контроль остатков', icon: BarChart3 },
    { id: 'recommendations', label: 'AI-рекомендации', icon: Brain },
    { id: 'plan', label: 'План', icon: Calendar },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  const menuItems = 
    role === 'store' ? storeMenuItems :
    role === 'brand' ? brandMenuItems :
    role === 'distributor' ? distributorMenuItems :
    role === 'salesRep' ? salesRepMenuItems :
    [];

  // Close mobile menu when view changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [currentView]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-card border-r border-border h-screen sticky top-0 flex flex-col transition-all duration-300 z-40
          ${isCollapsed ? 'w-16' : 'w-64'}
          md:translate-x-0 md:relative
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed md:static
        `}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Store className="w-6 h-6 text-primary" />
              <span className="font-semibold">Inventory Pro</span>
            </div>
          )}
          <button
            onClick={() => {
              setIsCollapsed(!isCollapsed);
              setIsMobileOpen(false);
            }}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-colors min-h-[44px] ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-border">
          <div className={`text-xs text-muted-foreground ${isCollapsed ? 'text-center' : ''}`}>
            {isCollapsed ? 'v1' : 'Версия 1.0.0'}
          </div>
        </div>
      </aside>
    </>
  );
}
