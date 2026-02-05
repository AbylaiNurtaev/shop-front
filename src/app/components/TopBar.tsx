import { User, LogOut, Bell, Building2, FolderTree, Menu, Settings, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, React, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'sonner';
import { useTheme } from '../hooks/useTheme';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { ScrollArea } from './ui/scroll-area';

interface TopBarProps {
  userEmail: string;
  role: 'store' | 'brand' | 'admin' | 'distributor' | 'salesRep';
  onLogout: () => void;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  userRole?: 'store' | 'storeSeller' | 'brand' | 'admin' | 'distributor' | 'salesRep';
}

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: {
    brandId?: string;
    distributorId?: string;
    requestId?: string;
    brandName?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

interface NotificationsResponse {
  items: Notification[];
  total: number;
  limit: number;
  offset: number;
}

interface UnreadCountResponse {
  count: number;
}

export function TopBar({ userEmail, role, onLogout, firstName, lastName, middleName, userRole }: TopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Функция для получения названия роли на русском
  const getRoleName = (role: string | undefined): string => {
    if (!role) return '';
    switch (role) {
      case 'store':
        return 'Владелец магазина';
      case 'storeSeller':
        return 'Продавец магазина';
      case 'brand':
        return 'Владелец бренда';
      case 'distributor':
        return 'Дистрибьютор';
      case 'salesRep':
        return 'Торговый представитель';
      case 'admin':
        return 'Администратор';
      default:
        return '';
    }
  };

  // Формируем ФИО (всегда показываем ФИО, даже если оно не заполнено полностью)
  const fullName = [lastName, firstName, middleName].filter(Boolean).join(' ') || 'Пользователь';

  // Загрузка количества непрочитанных уведомлений
  const loadUnreadCount = async () => {
    try {
      const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Ошибка загрузки количества уведомлений', error);
    }
  };

  // Загрузка уведомлений
  const loadNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const response = await api.get<NotificationsResponse>('/notifications', {
        params: {
          limit: 50,
          offset: 0,
        },
      });
      setNotifications(response.data.items || []);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений', error);
      toast.error('Не удалось загрузить уведомления');
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Отметить уведомление как прочитанное
  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Ошибка отметки уведомления', error);
      toast.error('Не удалось отметить уведомление как прочитанное');
    }
  };

  // Отметить все уведомления как прочитанные
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      toast.success('Все уведомления отмечены как прочитанные');
    } catch (error) {
      console.error('Ошибка отметки всех уведомлений', error);
      toast.error('Не удалось отметить все уведомления как прочитанные');
    }
  };

  // Открытие попапа уведомлений
  const handleNotificationsOpenChange = (open: boolean) => {
    setIsNotificationsOpen(open);
    if (open) {
      loadNotifications();
    } else {
      // Обновляем количество непрочитанных при закрытии
      loadUnreadCount();
    }
  };

  // Загрузка количества непрочитанных при монтировании и периодически
  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Обновление каждые 30 секунд
    return () => clearInterval(interval);
  }, []);

  // Получаем путь к настройкам
  const getSettingsPath = () => {
    const actualRole = userRole || role;
    switch (actualRole) {
      case 'store':
      case 'storeSeller':
        return '/store/settings';
      case 'distributor':
        return '/distributor/settings';
      case 'admin':
        return '/admin/settings';
      case 'salesRep':
        return '/salesrep/settings';
      case 'brand':
        return '/brand/settings';
      default:
        return '/store/settings';
    }
  };

  return (
    <>
      {/* Mobile TopBar - Hidden, using in-screen headers instead */}
      <header className="md:flex hidden bg-card border-b border-border px-6 py-3 items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-medium">
            {role === 'admin' ? 'Панель администратора' :
              role === 'distributor' ? 'Панель Дс' :
                role === 'store' ? 'Управление магазином' :
                  role === 'salesRep' ? 'Панель ТП' : 'Управление брендом'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {role === 'admin' ? 'Модерация и управление системой' :
              role === 'distributor' ? 'Управление портфелем брендов и ТП' :
                role === 'store' ? 'Учет и контроль товарных запасов' :
                  role === 'salesRep' ? 'Аналитика по закрепленным магазинам и своим товарам' : 'Управление каталогом товаров'}
          </p>
          {/* Admin Navigation */}
          {role === 'admin' && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => navigate('/admin/brands')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${location.pathname.startsWith('/admin/brands')
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
              >
                <Building2 className="w-4 h-4" />
                Бренды
              </button>
              <button
                onClick={() => navigate('/admin/categories')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${location.pathname.startsWith('/admin/categories')
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
              >
                <FolderTree className="w-4 h-4" />
                Категории
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Элемент 1: Переключатель темы */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Moon className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {/* Элемент 2: Уведомления */}
          <Popover open={isNotificationsOpen} onOpenChange={handleNotificationsOpenChange}>
            <PopoverTrigger asChild>
              <button
                className="p-2 hover:bg-accent rounded-md transition-colors relative"
                title="Уведомления"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-96 p-0"
              align="end"
              sideOffset={8}
            >
              <div className="flex flex-col max-h-[80vh]">
                <div className="p-3 border-b">
                  <h3 className="font-semibold text-sm">Уведомления</h3>
                </div>
                <ScrollArea className="flex-1 max-h-[60vh]">
                  <div className="p-2">
                    {isLoadingNotifications ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-muted-foreground text-sm">Загрузка...</div>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-muted-foreground text-sm">Нет уведомлений</div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 rounded-md cursor-pointer transition-colors ${notification.isRead
                              ? 'bg-card hover:bg-accent/50'
                              : 'bg-accent/50 border-l-2 border-primary'
                              }`}
                            onClick={() => !notification.isRead && markAsRead(notification.id)}
                          >
                            <h4 className="font-medium text-sm mb-1">{notification.title}</h4>
                            <p className="text-xs text-muted-foreground">{notification.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>

          {/* Элемент 3: Информация о пользователе */}
          <button
            onClick={() => navigate(getSettingsPath())}
            className="flex items-center gap-3 pl-3 border-l border-border hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="text-right">
              <div className="text-sm font-medium">{fullName}</div>
              <div className="text-xs text-muted-foreground">
                {getRoleName(userRole || role)}
              </div>
            </div>
            <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>

          {/* Элемент 4: Разделитель */}
          <div className="w-px h-8 bg-border"></div>

          {/* Элемент 5: Бургер-меню */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              title="Меню"
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Выпадающее меню */}
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        const settingsPath =
                          role === 'store' ? '/store/settings' :
                            role === 'distributor' ? '/distributor/settings' :
                              role === 'admin' ? '/admin/settings' :
                                role === 'salesRep' ? '/salesrep/settings' :
                                  '/brand/settings';
                        navigate(settingsPath);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-md hover:bg-accent transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Настройки</span>
                    </button>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => {
                        onLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Выход</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

    </>
  );
}
