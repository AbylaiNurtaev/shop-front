import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  /**
   * Порог прокрутки в пикселях, после которого показывается кнопка
   * @default 300
   */
  threshold?: number;
  /**
   * Показывать кнопку только на мобильных устройствах
   * @default true
   */
  mobileOnly?: boolean;
  /**
   * Отступ снизу в пикселях
   * @default 16 (4 * 4px = 16px)
   */
  bottomOffset?: number;
  /**
   * Отступ справа в пикселях
   * @default 16 (4 * 4px = 16px)
   */
  rightOffset?: number;
}

export function ScrollToTopButton({
  threshold = 300,
  mobileOnly = true,
  bottomOffset = 16,
  rightOffset = 16,
}: ScrollToTopButtonProps) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > threshold;
      
      if (mobileOnly) {
        // Показываем кнопку только на мобильной версии (ширина < 768px)
        if (window.innerWidth < 768) {
          setShowButton(shouldShow);
        } else {
          setShowButton(false);
        }
      } else {
        setShowButton(shouldShow);
      }
    };

    // Проверяем при загрузке
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [threshold, mobileOnly]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!showButton) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className={`${mobileOnly ? 'md:hidden' : ''} fixed z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 active:bg-primary/80 transition-all duration-200`}
      style={{
        bottom: `${bottomOffset}px`,
        right: `${rightOffset}px`,
      }}
      aria-label="Наверх"
    >
      <ArrowUp className="w-6 h-6" />
    </button>
  );
}
