import { Package, BarChart3, FolderTree, Store, Menu, X, Settings, Users, Building2, TrendingUp, TrendingDown, MessageCircle, Brain, Network, History, FolderTree as FolderTreeIcon, Calendar, QrCode, ShoppingCart, AlertTriangle, LogOut, Search, FileText, DollarSign } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface SidebarProps {
  role: 'store' | 'brand' | 'admin' | 'distributor' | 'salesRep';
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  userRole?: 'store' | 'storeSeller';
}

export function Sidebar({ role, currentView, onNavigate, onLogout, userRole }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Меню для владельца магазина (полный доступ)
  const storeOwnerMenuItems = [
    { id: 'inventory', label: 'Склад', icon: BarChart3 },
    { id: 'invoice-history', label: 'История накладных', icon: FileText },
    { id: 'activity-history', label: 'История действий', icon: History },
    { id: 'expenses', label: 'Расходы', icon: DollarSign },
    { id: 'products', label: 'Товары', icon: Package },
  ];

  // Меню для продавца магазина (ограниченный доступ)
  const storeSellerMenuItems = [
    { id: 'pos', label: 'Касса', icon: ShoppingCart },
    { id: 'sales-history', label: 'История', icon: History },
    { id: 'qr-scanner', label: 'Приход товара', icon: QrCode },
  ];

  const storeMenuItems = userRole === 'storeSeller' ? storeSellerMenuItems : storeOwnerMenuItems;

  const brandMenuItems = [
    { id: 'catalog', label: 'Каталог товаров', icon: Package },
    { id: 'distributors', label: 'Партнеры', icon: Network },
    { id: 'searchStatistics', label: 'Статистика поиска', icon: Search },
  ];

  const distributorMenuItems = [
    { id: 'salesReps', label: 'ТП', icon: Users },
    { id: 'products', label: 'Товары', icon: Package },
    { id: 'stores', label: 'Магазины', icon: Store },
    { id: 'poorlySelling', label: 'Низкие продажи', icon: TrendingDown },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
    { id: 'forecast', label: 'Прогноз спроса (AI)', icon: Brain },
    { id: 'history', label: 'История', icon: History },
    { id: 'requests', label: 'Запросы от брендов', icon: MessageCircle },
    { id: 'aiFAQ', label: 'AI-FAQ и обучение', icon: MessageCircle },
  ];

  const salesRepMenuItems = [
    { id: 'plan', label: 'План продаж', icon: Calendar },
    { id: 'stores', label: 'Магазины', icon: Store },
    { id: 'analytics', label: 'AI-аналитика', icon: Brain },
    { id: 'productGroups', label: 'Группы товаров', icon: FolderTreeIcon },
    { id: 'inventory', label: 'Контроль остатков', icon: BarChart3 },
    { id: 'poorlySelling', label: 'Низкие продажи', icon: TrendingDown },
    { id: 'expiring', label: 'Истекающий срок', icon: AlertTriangle },
    { id: 'history', label: 'История', icon: History },
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
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg"
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
        className={`bg-card border-l border-r border-border h-screen flex flex-col transition-all duration-300 z-40
          ${isCollapsed ? 'w-16' : 'w-64'}
          md:translate-x-0 md:relative md:sticky md:top-0 md:border-l-0
          ${isMobileOpen ? 'translate-x-0' : 'translate-x-full'}
          fixed top-0 right-0 md:static md:left-0
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
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-colors min-h-[44px] ${isActive
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

      </aside>
    </>
  );
}
