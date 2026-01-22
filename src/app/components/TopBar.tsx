import { User, LogOut, Bell, Building2, FolderTree } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface TopBarProps {
  userEmail: string;
  role: 'store' | 'brand' | 'admin' | 'distributor' | 'salesRep';
  onLogout: () => void;
}

export function TopBar({ userEmail, role, onLogout }: TopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* Mobile TopBar - Hidden, using in-screen headers instead */}
      <header className="md:flex hidden bg-card border-b border-border px-6 py-3 items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-medium">
            {role === 'admin' ? 'Панель администратора' :
              role === 'distributor' ? 'Панель дистрибьютора' :
                role === 'store' ? 'Управление магазином' :
                  role === 'salesRep' ? 'Панель торгового представителя' : 'Управление брендом'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {role === 'admin' ? 'Модерация и управление системой' :
              role === 'distributor' ? 'Управление портфелем брендов и торговыми представителями' :
                role === 'store' ? 'Учет и контроль товарных запасов' :
                  role === 'salesRep' ? 'Аналитика по закрепленным магазинам и своим товарам' : 'Управление каталогом товаров'}
          </p>
          {/* Admin Navigation */}
          {role === 'admin' && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => navigate('/admin/brands')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  location.pathname.startsWith('/admin/brands')
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Бренды
              </button>
              <button
                onClick={() => navigate('/admin/categories')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  location.pathname.startsWith('/admin/categories')
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
          <button className="p-2 hover:bg-accent rounded-md transition-colors relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-border">
            <div className="text-right">
              <div className="text-sm font-medium">{userEmail}</div>
              <div className="text-xs text-muted-foreground">
                {role === 'store' ? 'Аккаунт магазина' :
                  role === 'distributor' ? 'Аккаунт дистрибьютора' :
                    role === 'admin' ? 'Администратор' : 'Аккаунт бренда'}
              </div>
            </div>
            <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors"
            title="Выход"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
    </>
  );
}
