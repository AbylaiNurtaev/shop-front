import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Mail, Lock, ShoppingBag, Building2, Network, Users } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  onNavigateToRegister: () => void;
  /**
   * Показывать ли демо-кнопки для быстрого входа.
   * Для реального логина (/login) отключаем, для демо (/login/demo) включаем.
   */
  showQuickLogins?: boolean;
}

export function Login({ onLogin, onNavigateToRegister, showQuickLogins = true }: LoginProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  const quickLoginAccounts = [
    { email: 'krutyev7@gmail.com', password: '12345678', label: 'Бренд', icon: Building2, color: 'bg-blue-500 hover:bg-blue-600' },
    { email: 'krutyev6@gmail.com', password: '12345678', label: 'Дистрибьютор', icon: Network, color: 'bg-purple-500 hover:bg-purple-600' },
    { email: 'krutyev5@gmail.com', password: '12345678', label: 'ТП', icon: Users, color: 'bg-green-500 hover:bg-green-600' },
    { email: 'abylaynurtayev01@gmail.com', password: '12345678', label: 'Магазин', icon: Store, color: 'bg-orange-500 hover:bg-orange-600' },
    { email: 'abylay.nurtayev.dev@gmail.com', password: '12345678', label: 'Продавец магазина', icon: ShoppingBag, color: 'bg-cyan-500 hover:bg-cyan-600' },
  ];

  const handleQuickLogin = (accountEmail: string, accountPassword: string) => {
    setEmail(accountEmail);
    setPassword(accountPassword);
    onLogin(accountEmail, accountPassword);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-sm p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center mb-3">
              <Store className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-semibold">Inventory Pro</h1>
            <p className="text-sm text-muted-foreground mt-1">Вход в систему</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5">Электронная почта</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Введите электронную почту"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1.5">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Введите пароль"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-md hover:opacity-90 transition-opacity font-medium"
            >
              Войти
            </button>
          </form>

          {showQuickLogins && (
            <>
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">или</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground text-center mb-2">Быстрый вход (для разработки):</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickLoginAccounts.map((account) => {
                    const Icon = account.icon;
                    return (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => handleQuickLogin(account.email, account.password)}
                        className={`${account.color} text-white py-2 px-3 rounded-md transition-opacity font-medium text-xs flex items-center justify-center gap-1.5`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="truncate">{account.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">или</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/buyer')}
            className="w-full mt-4 bg-secondary text-secondary-foreground py-2.5 rounded-md hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Поиск магазинов (как гость)
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Нет аккаунта?{' '}
              <button
                onClick={onNavigateToRegister}
                className="text-primary hover:underline font-medium"
              >
                Зарегистрироваться
              </button>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          © 2026 Inventory Pro. Все права защищены.
        </div>
      </div>
    </div>
  );
}