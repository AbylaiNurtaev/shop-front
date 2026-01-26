import { Store, Building2, ArrowLeft, User, Users, ShoppingBag } from 'lucide-react';
import { UserRole } from '../../types';

interface RoleSelectionProps {
  onSelectRole: (role: UserRole) => void;
  onBack: () => void;
}

export function RoleSelection({ onSelectRole, onBack }: RoleSelectionProps) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад ко входу
        </button>

        <div className="bg-card border border-border rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold">Создание аккаунта</h1>
            <p className="text-sm text-muted-foreground mt-1">Выберите тип аккаунта для продолжения</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Дистрибьютор */}
            <button
              onClick={() => onSelectRole('distributor')}
              className="border-2 border-border rounded-lg p-6 hover:border-primary hover:bg-accent/50 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <Building2 className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold mb-2">Дистрибьютор</h3>
              <p className="text-sm text-muted-foreground">
                Управление портфелем брендов и ТП
              </p>
            </button>

            {/* Бренд */}
            <button
              onClick={() => onSelectRole('brand')}
              className="border-2 border-border rounded-lg p-6 hover:border-primary hover:bg-accent/50 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <Store className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold mb-2">Бренд</h3>
              <p className="text-sm text-muted-foreground">
                Регистрация SKU и управление ассортиментом бренда
              </p>
            </button>

            {/* Магазин */}
            <button
              onClick={() => onSelectRole('store')}
              className="border-2 border-border rounded-lg p-6 hover:border-primary hover:bg-accent/50 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <Store className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold mb-2">Магазин</h3>
              <p className="text-sm text-muted-foreground">
                Добавление товаров в ассортимент и управление складом магазина
              </p>
            </button>

            {/* ТП */}
            <button
              type="button"
              onClick={() => onSelectRole('salesRep')}
              className="border-2 border-border rounded-lg p-6 hover:border-primary hover:bg-accent/50 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">ТП</h3>
              <p className="text-sm text-muted-foreground">
                Аналитика по закрепленным магазинам и своим товарам
              </p>
            </button>

            {/* Продавец магазина */}
            <button
              type="button"
              onClick={() => onSelectRole('storeSeller')}
              className="border-2 border-border rounded-lg p-6 hover:border-primary hover:bg-accent/50 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <ShoppingBag className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold mb-2">Продавец магазина</h3>
              <p className="text-sm text-muted-foreground">
                Присоединение к существующему магазину в качестве продавца
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}