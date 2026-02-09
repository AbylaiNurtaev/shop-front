import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Package,
  Store,
  ShoppingCart,
  Building2,
  Smartphone,
  Monitor,
  Tablet,
  Settings,
  Bot,
  Sparkles,
  TrendingUp,
  BarChart3,
  Zap,
  Shield,
  CheckCircle2,
  MessageSquare,
  Menu,
  X,
  ChevronDown,
  ArrowUp,
} from 'lucide-react';
import { Footer } from './Footer';
import { LandingAIFAQ } from './LandingAIFAQ';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { AnimatedSection } from './AnimatedSection';
import { useTheme } from '../hooks/useTheme';

export function LandingPage() {
  const navigate = useNavigate();
  const [aiFAQOpen, setAiFAQOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Используем тему для лендинга (всегда темная)
  useTheme('landing');

  // Принудительно устанавливаем темную тему при монтировании
  // и сохраняем текущую тему дашборда для восстановления
  useEffect(() => {
    // Сохраняем текущую тему дашборда перед установкой темной
    const dashboardTheme = localStorage.getItem('dashboard-theme') ||
      localStorage.getItem('theme') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    // Сохраняем тему дашборда если её еще нет
    if (!localStorage.getItem('dashboard-theme')) {
      localStorage.setItem('dashboard-theme', dashboardTheme);
    }

    // Принудительно устанавливаем темную тему для лендинга
    const root = document.documentElement;
    root.classList.add('dark');

    // При размонтировании восстанавливаем тему дашборда
    return () => {
      const savedDashboardTheme = localStorage.getItem('dashboard-theme') || 'dark';
      if (savedDashboardTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };
  }, []);

  // Показываем кнопку "вверх" при прокрутке страницы вниз
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 400;
      if (isScrolled !== showScrollTop) {
        setShowScrollTop(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showScrollTop]);

  // Слайды для hero секции
  const heroSlides = [
    {
      image: '/images/image1.png',
      title: 'Управление магазином нового поколения',
    },
    {
      image: '/images/apteka.png',
      title: (
        <>
          Управление аптекой<br />нового поколения
        </>
      ),
    },
    {
      image: '/images/supermarket.png',
      title: 'Управление супермаркетом нового поколения',
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  // Автоматическое переключение слайдов
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000); // Переключение каждые 5 секунд

    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const faqItems = [
    {
      question: 'Как начать пользоваться программой?',
      answer: 'Для начала работы вам нужно зарегистрироваться на платформе, выбрав тип вашего бизнеса (магазин, мини-маркет или супермаркет). После регистрации вы получите доступ ко всем функциям программы.',
    },
    {
      question: 'Нужно ли покупать дополнительное оборудование?',
      answer: 'Нет, программа работает на любых устройствах - компьютерах, планшетах и смартфонах. Если у вас уже есть оборудование (кассовые терминалы, сканеры), мы можем настроить нашу программу для работы с ним.',
    },
    {
      question: 'Сколько стоит использование программы?',
      answer: 'Программа полностью бесплатна навсегда. Мы не взимаем плату за использование основных функций.',
    },
    {
      question: 'Какие функции доступны в программе?',
      answer: 'Программа включает управление товарами и инвентарем, POS-систему, аналитику продаж, прогнозирование спроса, управление категориями, работу с поставщиками и многое другое. Все функции доступны через удобный веб-интерфейс.',
    },
    {
      question: 'Как работает ИИ в программе?',
      answer: 'Искусственный интеллект помогает в прогнозировании спроса, анализе продаж, рекомендациях по закупкам, выявлении плохо продающихся товаров и автоматизации рутинных задач. ИИ также доступен в виде помощника для ответов на вопросы.',
    },
    {
      question: 'Можно ли использовать программу на нескольких устройствах?',
      answer: 'Да, программа работает на всех устройствах одновременно. Вы можете использовать её на компьютере в офисе, на планшете в торговом зале и на смартфоне в дороге. Все данные синхронизируются в реальном времени.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 py-4">
        <div className="container mx-auto px-4">
          <div className="w-[90%] max-w-7xl mx-auto bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl shadow-lg">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-8 h-8 text-primary" />
                  <span className="text-xl font-bold">Omiai</span>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-6">
                  <button
                    onClick={() => scrollToSection('features')}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    Функции
                  </button>
                  <button
                    onClick={() => scrollToSection('for-whom')}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    Для кого
                  </button>
                  <button
                    onClick={() => scrollToSection('advantages')}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    Преимущества
                  </button>
                  <button
                    onClick={() => scrollToSection('ai')}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    ИИ возможности
                  </button>
                  <button
                    onClick={() => scrollToSection('pricing')}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    Тарифы
                  </button>
                  <button
                    onClick={() => scrollToSection('faq')}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    FAQ
                  </button>
                </nav>

                <div className="flex items-center gap-3">
                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
                    aria-label="Меню"
                  >
                    {mobileMenuOpen ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Menu className="w-5 h-5" />
                    )}
                  </button>

                  <button
                    onClick={() => navigate('/login')}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    Войти
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mobile Navigation */}
              {mobileMenuOpen && (
                <nav className="lg:hidden px-6 pb-4 border-t border-border/50 pt-4">
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => scrollToSection('features')}
                      className="text-left text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                    >
                      Функции
                    </button>
                    <button
                      onClick={() => scrollToSection('for-whom')}
                      className="text-left text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                    >
                      Для кого
                    </button>
                    <button
                      onClick={() => scrollToSection('advantages')}
                      className="text-left text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                    >
                      Преимущества
                    </button>
                    <button
                      onClick={() => scrollToSection('ai')}
                      className="text-left text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                    >
                      ИИ возможности
                    </button>
                    <button
                      onClick={() => scrollToSection('pricing')}
                      className="text-left text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                    >
                      Тарифы
                    </button>
                    <button
                      onClick={() => scrollToSection('faq')}
                      className="text-left text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                    >
                      FAQ
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium mt-2"
                    >
                      Войти
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </nav>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 1. Блок описания продукта */}
      <section
        id="hero"
        className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden min-h-[700px] md:min-h-[800px] flex items-end"
      >
        {/* Фоновые изображения с плавным переходом */}
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        ))}

        {/* Градиентный overlay для эффекта исчезновения снизу и затемнения для читаемости */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />

        {/* Контент поверх фона, размещен внизу где градиент светлее */}
        <div className="relative container mx-auto px-4 z-10 pb-32 md:pb-32">
          <div className="max-w-4xl mx-auto text-center">
            <AnimatedSection direction="fade">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur-md text-primary rounded-full mb-6 border border-primary/30">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Лидер в автоматизации торговли</span>
                </div>
                <div className="relative h-24 md:h-32 mb-24 md:mb-14">
                  {heroSlides.map((slide, index) => (
                    <h1
                      key={index}
                      className={`absolute inset-0 text-4xl md:text-6xl font-bold leading-tight text-foreground drop-shadow-lg transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                        }`}
                      style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}
                    >
                      {slide.title}
                    </h1>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 md:mb-0">
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Начать бесплатно
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setAiFAQOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-card/90 backdrop-blur-sm border-2 border-border text-foreground rounded-lg hover:bg-accent hover:border-primary/50 transition-all text-lg font-semibold"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <Bot className="w-5 h-5" />
                    Задать вопрос ИИ
                  </button>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* 2. Блок "Для кого" */}
      <section id="for-whom" className="py-16 md:py-20 bg-card">
        <div className="container mx-auto px-4">
          <AnimatedSection direction="fade">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Для кого создана программа
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <AnimatedSection direction="up" delay={0}>
              <div className="bg-background border-2 border-border rounded-2xl p-8 hover:shadow-xl hover:border-primary/50 transition-all transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Store className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Продуктовый магазин</h3>
                <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Идеальное решение для небольших магазинов. Простой интерфейс для управления товарами и продажами.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={100}>
              <div className="bg-background border-2 border-border rounded-2xl p-8 hover:shadow-xl hover:border-primary/50 transition-all transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <ShoppingCart className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Мини-маркет</h3>
                <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Полнофункциональная система: POS-система, управление инвентарем и аналитика в одном месте.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={200}>
              <div className="bg-background border-2 border-border rounded-2xl p-8 hover:shadow-xl hover:border-primary/50 transition-all transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Супермаркет</h3>
                <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Масштабируемое решение с расширенной аналитикой и прогнозированием спроса.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* 3. Блок визуалов программы */}
      <section id="visuals" className="py-6 md:py-8 bg-gradient-to-b from-primary/5 via-primary/10 to-background relative overflow-hidden">
        {/* Декоративный элемент для градиента */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/20 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <AnimatedSection direction="right" delay={200} className="order-2 lg:order-1">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-6 text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Современный и интуитивный интерфейс
                  </h3>
                  <p className="text-lg text-foreground/80 mb-6 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Программа разработана с учетом всех потребностей современного бизнеса.
                    Простой и понятный интерфейс позволяет быстро освоить все функции без специального обучения.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1 text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>Адаптивный дизайн</p>
                        <p className="text-sm text-foreground/70" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Работает на всех устройствах - компьютере, планшете и смартфоне
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1 text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>Быстрая работа</p>
                        <p className="text-sm text-foreground/70" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Оптимизированный интерфейс обеспечивает мгновенную реакцию на действия
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1 text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>Удобная навигация</p>
                        <p className="text-sm text-foreground/70" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Все функции доступны в несколько кликов, без сложных меню
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
              <AnimatedSection direction="left" delay={200} className="order-1 lg:order-2">
                <div className="flex justify-center lg:justify-end">
                  <img
                    src="/images/mockup.png"
                    alt="Мокап программы"
                    className="w-full max-w-xs h-auto rounded-2xl"
                  />
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Блок функций программы */}
      <section id="features" className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <AnimatedSection direction="fade">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Функции программы
            </h2>
          </AnimatedSection>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatedSection direction="up" delay={0}>
                <div className="bg-card border-2 border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all transform hover:-translate-y-1 h-full">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Управление товарами</h3>
                  <p className="text-sm text-muted-foreground">
                    Полный контроль над каталогом товаров, категориями и характеристиками
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection direction="up" delay={100}>
                <div className="bg-card border-2 border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all transform hover:-translate-y-1 h-full">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Аналитика продаж</h3>
                  <p className="text-sm text-muted-foreground">
                    Детальная статистика продаж, прибыли и популярности товаров
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection direction="up" delay={200}>
                <div className="bg-card border-2 border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all transform hover:-translate-y-1 h-full">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">POS-система</h3>
                  <p className="text-sm text-muted-foreground">
                    Современная кассовая система для быстрой обработки продаж
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection direction="up" delay={300}>
                <div className="bg-card border-2 border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all transform hover:-translate-y-1 h-full">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Прогнозирование спроса</h3>
                  <p className="text-sm text-muted-foreground">
                    ИИ-прогнозы помогают оптимизировать закупки и снизить потери
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection direction="up" delay={400}>
                <div className="bg-card border-2 border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all transform hover:-translate-y-1 h-full">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Управление инвентарем</h3>
                  <p className="text-sm text-muted-foreground">
                    Отслеживание остатков, сроков годности и контроль складских запасов
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection direction="up" delay={500}>
                <div className="bg-card border-2 border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all transform hover:-translate-y-1 h-full">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Работа с поставщиками</h3>
                  <p className="text-sm text-muted-foreground">
                    Интеграция с брендами и дистрибьюторами для автоматизации закупок
                  </p>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* 5. УТП блок */}
      <section
        id="advantages"
        className="pt-16 md:pt-20 pb-0 relative overflow-hidden"
      >
        <div
          className="mx-auto w-full rounded-[2.5rem] overflow-hidden relative"
          style={{
            backgroundImage: 'url(/images/image2.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Overlay для читаемости контента - затемнённый */}
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />

          <div className="container mx-auto px-4 pt-16 md:pt-20 pb-16 md:pb-20 relative z-10">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <AnimatedSection direction="up" delay={0}>
                  <div className="bg-background backdrop-blur-md border border-border rounded-xl p-8 text-center shadow-xl">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Smartphone className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Работа на всех устройствах</h3>
                    <p className="text-muted-foreground">
                      Используйте программу на компьютере, планшете или смартфоне.
                      Все устройства синхронизируются в реальном времени.
                    </p>
                  </div>
                </AnimatedSection>

                <AnimatedSection direction="up" delay={100}>
                  <div className="bg-background backdrop-blur-md border border-border rounded-xl p-8 text-center shadow-xl">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Без покупки оборудования</h3>
                    <p className="text-muted-foreground">
                      Не нужно покупать дорогое оборудование. Программа работает на любых
                      устройствах, которые у вас уже есть.
                    </p>
                  </div>
                </AnimatedSection>

                <AnimatedSection direction="up" delay={200}>
                  <div className="bg-background backdrop-blur-md border border-border rounded-xl p-8 text-center shadow-xl">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Settings className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Настройка на вашем оборудовании</h3>
                    <p className="text-muted-foreground">
                      Если у вас уже есть кассовые терминалы или сканеры, мы настроим
                      нашу программу для работы с вашим оборудованием.
                    </p>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Блок про ИИ */}
      <section id="ai" className="py-16 md:py-20 bg-card">
        <div className="container mx-auto px-4">
          <AnimatedSection direction="fade">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Вся работа построена вокруг ИИ
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Искусственный интеллект помогает на каждом этапе работы магазина
            </p>
          </AnimatedSection>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AnimatedSection direction="up" delay={0}>
                <div className="bg-background border border-border rounded-xl p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Прогнозирование спроса</h3>
                      <p className="text-muted-foreground">
                        ИИ анализирует исторические данные продаж и помогает предсказать,
                        какие товары будут пользоваться спросом, оптимизируя закупки и снижая потери.
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection direction="up" delay={100}>
                <div className="bg-background border border-border rounded-xl p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Анализ продаж</h3>
                      <p className="text-muted-foreground">
                        Автоматический анализ продаж помогает выявлять тренды,
                        находить плохо продающиеся товары и предлагать рекомендации по оптимизации ассортимента.
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection direction="up" delay={200}>
                <div className="bg-background border border-border rounded-xl p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Рекомендации по закупкам</h3>
                      <p className="text-muted-foreground">
                        ИИ предлагает оптимальные объемы закупок на основе прогнозов спроса,
                        сезонности и текущих остатков, помогая избежать излишков и дефицита.
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection direction="up" delay={300}>
                <div className="bg-background border border-border rounded-xl p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-3">AI-помощник</h3>
                      <p className="text-muted-foreground">
                        Виртуальный помощник отвечает на вопросы о работе программы,
                        помогает с настройкой и предоставляет советы по оптимизации бизнеса.
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Блок тарифа */}
      <section id="pricing" className="py-16 md:py-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4">
          <AnimatedSection direction="up" className="max-w-4xl mx-auto text-center">
            <div className="bg-card border border-border rounded-2xl p-12 shadow-lg">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Программа пожизненно бесплатная
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Все основные функции доступны без ограничений и без скрытых платежей
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-lg font-semibold"
                >
                  Начать бесплатно
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 8. FAQ блок */}
      <section id="faq" className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl md:max-w-6xl mx-auto">
            <AnimatedSection direction="fade">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                Часто задаваемые вопросы
              </h2>
              <p className="text-center text-muted-foreground mb-8">
                Не нашли ответ? Задайте вопрос нашему AI-помощнику
              </p>
            </AnimatedSection>

            <div className="mb-8">
              <button
                onClick={() => setAiFAQOpen(true)}
                className="w-full md:w-auto mx-auto flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                <Bot className="w-5 h-5" />
                Открыть AI-помощника
              </button>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b">
                  <AccordionTrigger className="text-left text-lg md:text-xl font-semibold py-6 hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base md:text-lg">
                    <p className="text-muted-foreground pb-6 leading-relaxed">{item.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Кнопка "вверх" для мобильных устройств */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/30 transition-all hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hidden"
          aria-label="Наверх"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {/* AI FAQ Modal */}
      <LandingAIFAQ open={aiFAQOpen} onOpenChange={setAiFAQOpen} />
    </div>
  );
}
