import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type ThemeContext = 'landing' | 'dashboard';

export function useTheme(context: ThemeContext = 'dashboard') {
  const [theme, setTheme] = useState<Theme>(() => {
    // Для лендинга всегда темная тема
    if (context === 'landing') {
      return 'dark';
    }
    
    // Для дашборда проверяем сохраненную тему
    const savedTheme = localStorage.getItem('dashboard-theme') as Theme | null;
    if (savedTheme) {
      return savedTheme;
    }
    // Проверяем старый ключ для обратной совместимости
    const oldTheme = localStorage.getItem('theme') as Theme | null;
    if (oldTheme) {
      // Мигрируем в новый ключ
      localStorage.setItem('dashboard-theme', oldTheme);
      localStorage.removeItem('theme');
      return oldTheme;
    }
    // Проверяем системные настройки
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Сохраняем только для дашборда
    if (context === 'dashboard') {
      localStorage.setItem('dashboard-theme', theme);
    }
  }, [theme, context]);

  const toggleTheme = () => {
    // Для лендинга переключение не работает
    if (context === 'landing') {
      return;
    }
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return { theme, setTheme, toggleTheme };
}
