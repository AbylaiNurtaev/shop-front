import React, { useEffect, useState, FormEvent } from 'react';
import { ArrowLeft, Building2, Loader2, Mail, CheckCircle2, Package, Check, Phone } from 'lucide-react';
import { DistributorProfile, Category } from '../../types';
import api from '../../api/axios';
import { PhoneVerificationModal } from './PhoneVerificationModal';

interface DistributorRegistrationProps {
  onComplete: (profile: DistributorProfile) => void | Promise<void>;
  onBack: () => void;
  isDemo?: boolean;
}

const EMAIL_COOLDOWN_KEY = 'distributor_email_cooldown';
const PHONE_COOLDOWN_KEY = 'distributor_phone_cooldown';

export function DistributorRegistration({ onComplete, onBack, isDemo = false }: DistributorRegistrationProps) {
  const [formData, setFormData] = useState<DistributorProfile & { phone?: string }>({
    companyName: '',
    country: 'Казахстан',
    city: '',
    email: '',
    password: '',
    categoryIds: [],
    phone: '',
    verificationCode: '',
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email verification states
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [isVerifyingEmailCode, setIsVerifyingEmailCode] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailVerificationError, setEmailVerificationError] = useState<string | undefined>(undefined);
  const [emailCodeCooldown, setEmailCodeCooldown] = useState(() => {
    if (isDemo) return 0;
    const stored = localStorage.getItem(EMAIL_COOLDOWN_KEY);
    if (!stored) return 0;
    const elapsed = Math.floor((Date.now() - parseInt(stored)) / 1000);
    return Math.max(0, 60 - elapsed);
  });

  // Phone verification states
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingPhoneCode, setIsSendingPhoneCode] = useState(false);
  const [phoneVerificationError, setPhoneVerificationError] = useState<string | undefined>(undefined);
  const [isPhoneVerificationModalOpen, setIsPhoneVerificationModalOpen] = useState(false);
  const [phoneCodeCooldown, setPhoneCodeCooldown] = useState(() => {
    if (isDemo) return 0;
    const stored = localStorage.getItem(PHONE_COOLDOWN_KEY);
    if (!stored) return 0;
    const elapsed = Math.floor((Date.now() - parseInt(stored)) / 1000);
    return Math.max(0, 60 - elapsed);
  });

  const countries = [
    'Россия',
    'США',
    'Германия',
    'Франция',
    'Италия',
    'Испания',
    'Великобритания',
    'Китай',
    'Япония',
    'Южная Корея',
    'Канада',
    'Австралия',
    'Бразилия',
    'Индия',
    'Мексика',
    'Польша',
    'Нидерланды',
    'Бельгия',
    'Швейцария',
    'Австрия',
    'Швеция',
    'Норвегия',
    'Дания',
    'Финляндия',
    'Турция',
    'Аргентина',
    'Чили',
    'Колумбия',
    'Перу',
    'Украина',
    'Беларусь',
    'Казахстан',
    'Другая',
  ];

  const kazakhstanCities = [
    'Алматы',
    'Астана',
    'Шымкент',
    'Караганда',
    'Актобе',
    'Тараз',
    'Павлодар',
    'Усть-Каменогорск',
    'Семей',
    'Уральск',
    'Костанай',
    'Петропавловск',
    'Кызылорда',
    'Атырау',
    'Актау',
    'Темиртау',
    'Туркестан',
    'Кокшетау',
    'Талдыкорган',
    'Экибастуз',
    'Рудный',
    'Жанаозен',
    'Жезказган',
    'Балхаш',
    'Сатпаев',
  ];

  // Функция для нормализации номера телефона
  const normalizePhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  };

  // Функция для форматирования номера телефона
  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+7')) {
      const digits = cleaned.slice(2).replace(/\D/g, '').slice(0, 10);
      if (digits.length === 0) return '+7';
      if (digits.length <= 3) return `+7 (${digits}`;
      if (digits.length <= 6) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
      if (digits.length <= 8) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
    }
    if (cleaned.startsWith('7') && !cleaned.startsWith('+')) {
      const digits = cleaned.slice(1).replace(/\D/g, '').slice(0, 10);
      if (digits.length === 0) return '+7';
      if (digits.length <= 3) return `+7 (${digits}`;
      if (digits.length <= 6) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
      if (digits.length <= 8) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
    }
    if (cleaned.startsWith('8')) {
      const digits = cleaned.slice(1).replace(/\D/g, '').slice(0, 10);
      if (digits.length === 0) return '+7';
      if (digits.length <= 3) return `+7 (${digits}`;
      if (digits.length <= 6) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
      if (digits.length <= 8) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
    }
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    const digits = cleaned.replace(/\D/g, '').slice(0, 10);
    if (digits.length === 0) return '+7';
    if (digits.length <= 3) return `+7 (${digits}`;
    if (digits.length <= 6) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    if (digits.length <= 8) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isDemo && !isEmailVerified) {
      setEmailVerificationError('Пожалуйста, подтвердите ваш email');
      return;
    }
    if (!isDemo && !isPhoneVerified) {
      setPhoneVerificationError('Пожалуйста, подтвердите ваш номер телефона');
      return;
    }
    // УБРАЛ проверку emailVerificationCode, так как email уже подтвержден через isEmailVerified

    setIsSubmitting(true);
    try {
      await onComplete({
        ...formData,
        verificationCode: isDemo ? '000000' : emailVerificationCode,
      });
    } catch (error) {
      console.error('Ошибка при регистрации Дс', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Функция для проверки корпоративной почты
  const isCorporateEmail = (email: string): boolean => {
    const publicEmailDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'mail.ru',
      'yandex.ru', 'yandex.com', 'rambler.ru', 'inbox.ru', 'bk.ru',
      'list.ru', 'live.com', 'msn.com', 'aol.com', 'icloud.com',
      'protonmail.com', 'proton.me', 'gmx.com', 'zoho.com', 'mail.com',
      'qq.com', '163.com', 'sina.com', 'rediffmail.com', 'cox.net',
      'verizon.net', 'comcast.net', 'att.net', 'sbcglobal.net'
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    return !publicEmailDomains.includes(domain);
  };

  const handleSendEmailCode = async () => {
    if (!formData.email) {
      setEmailVerificationError('Пожалуйста, введите email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailVerificationError('Некорректный формат email');
      return;
    }

    if (!isDemo && !isCorporateEmail(formData.email)) {
      setEmailVerificationError('Пожалуйста, используйте корпоративную почту. Публичные почтовые сервисы (Gmail, Yahoo, Mail.ru и т.д.) не допускаются.');
      return;
    }

    setIsSendingEmailCode(true);
    setEmailVerificationError(undefined);
    setEmailCodeSent(false);
    setIsEmailVerified(false);

    try {
      await api.post('/auth/verification/send', {
        email: formData.email,
        ...(isDemo && { demo: true }),
      });
      setEmailCodeSent(true);
      setEmailCodeCooldown(60);
      if (!isDemo) {
        localStorage.setItem(EMAIL_COOLDOWN_KEY, Date.now().toString());
      }
    } catch (error: any) {
      const status = error.response?.status;
      const code = error.response?.data?.code;
      const backendError = error.response?.data?.error;

      if (status === 409 && code === 'EMAIL_ALREADY_EXISTS') {
        setEmailVerificationError('Пользователь с таким email уже существует. Попробуйте войти в систему или используйте другой email.');
      } else {
        const fallbackMessage = backendError || error.response?.data?.message || 'Не удалось отправить код верификации';
        setEmailVerificationError(fallbackMessage);
      }
      setEmailCodeSent(false);
      setIsEmailVerified(false);
    } finally {
      setIsSendingEmailCode(false);
    }
  };

  const handleSendPhoneCode = async () => {
    if (!formData.phone) {
      setPhoneVerificationError('Пожалуйста, введите номер телефона');
      return;
    }

    const normalizedPhone = normalizePhoneNumber(formData.phone);
    const digitsOnly = normalizedPhone.replace(/\D/g, '');
    if (digitsOnly.length !== 11 || (!digitsOnly.startsWith('7') && !digitsOnly.startsWith('1'))) {
      setPhoneVerificationError('Некорректный формат номера телефона. Поддерживаются: RU/KZ 7XXXXXXXXXX или US 1XXXXXXXXXX (11 цифр)');
      return;
    }

    setIsSendingPhoneCode(true);
    setPhoneVerificationError(undefined);
    setIsPhoneVerified(false);

    try {
      await api.post('/auth/verification/phone/send', {
        phoneNumber: normalizedPhone,
        ...(isDemo && { demo: true }),
      });
      setIsPhoneVerificationModalOpen(true);
      setPhoneCodeCooldown(60);
      if (!isDemo) {
        localStorage.setItem(PHONE_COOLDOWN_KEY, Date.now().toString());
      }
    } catch (error: any) {
      const status = error.response?.status;
      const code = error.response?.data?.code;
      const backendError = error.response?.data?.error;

      if (status === 409 && code === 'PHONE_ALREADY_EXISTS') {
        setPhoneVerificationError('Пользователь с таким номером телефона уже существует. Попробуйте войти в систему или используйте другой номер.');
      } else {
        const fallbackMessage = backendError || error.response?.data?.message || 'Не удалось отправить код верификации через WhatsApp';
        setPhoneVerificationError(fallbackMessage);
      }
    } finally {
      setIsSendingPhoneCode(false);
    }
  };

  // Кулдаун для кнопок отправки кода
  useEffect(() => {
    if (phoneCodeCooldown > 0) {
      const timer = setTimeout(() => {
        setPhoneCodeCooldown((s) => s - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phoneCodeCooldown]);

  useEffect(() => {
    if (emailCodeCooldown > 0) {
      const timer = setTimeout(() => {
        setEmailCodeCooldown((s) => s - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCodeCooldown]);

  const handleVerifyEmailCode = async () => {
    if (!emailVerificationCode || emailVerificationCode.length !== 6) {
      setEmailVerificationError('Код должен состоять из 6 цифр');
      return;
    }

    setIsVerifyingEmailCode(true);
    setEmailVerificationError(undefined);

    try {
      await api.post('/auth/verification/verify', {
        email: formData.email,
        code: emailVerificationCode,
        ...(isDemo && { demo: true }),
      });

      // После успешной верификации устанавливаем все состояния
      setIsEmailVerified(true);
      setEmailVerificationError(undefined);
      setEmailCodeCooldown(0);
      setEmailCodeSent(false);
      setEmailVerificationCode('');

      if (!isDemo) {
        localStorage.removeItem(EMAIL_COOLDOWN_KEY);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Неверный код верификации';
      setEmailVerificationError(errorMessage);
      setIsEmailVerified(false);
    } finally {
      setIsVerifyingEmailCode(false);
    }
  };

  const handlePhoneVerified = () => {
    setIsPhoneVerified(true);
    setIsPhoneVerificationModalOpen(false);
    setPhoneVerificationError(undefined);
    setPhoneCodeCooldown(0);
    if (!isDemo) {
      localStorage.removeItem(PHONE_COOLDOWN_KEY);
    }
  };

  // Загрузка категорий
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const response = await api.get<{ items: { id: string; name: string }[] }>('/categories');
        const items = response.data?.items ?? [];
        const loaded = items.map((c) => ({ id: c.id, name: c.name }));
        setCategories(loaded);
      } catch (error) {
        console.error('Ошибка загрузки категорий', error);
        setCategories([]);
      } finally {
        setIsCategoriesLoading(false);
      }
    };
    loadCategories();
  }, []);

  // Сброс города при смене страны
  useEffect(() => {
    if (formData.country !== 'Казахстан') {
      setFormData((prev) => ({ ...prev, city: '' }));
    }
  }, [formData.country]);

  const updateField = (field: keyof typeof formData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev) => {
      const currentIds = prev.categoryIds || [];
      const newIds = currentIds.includes(categoryId)
        ? currentIds.filter((id) => id !== categoryId)
        : [...currentIds, categoryId];
      return { ...prev, categoryIds: newIds };
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 relative">
      {isSubmitting && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-lg p-6 sm:p-8 flex flex-col items-center gap-4 max-w-sm w-full">
            <div className="relative">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary/70" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold mb-1">Регистрация Дс</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Отправка данных...
              </p>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                style={{
                  width: '60%',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              />
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-2xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Назад</span>
        </button>

        <div className="bg-card border border-border rounded-lg shadow-sm p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold">Регистрация Дс{isDemo ? ' (Демо)' : ''}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Укажите основные данные дистрибьюторской компании</p>
              {isDemo && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Демо-режим: можно использовать обычную почту (Gmail, Yahoo и т.д.), подтверждение email не требуется
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 relative">
            {isSubmitting && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] rounded-lg z-10" />
            )}
            <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm mb-1.5">
                  Название дистрибьюторской компании <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Например, ООО Дистрибьютор"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm mb-1.5">
                  Страна <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Выберите страну</option>
                  {countries.map((country) => (
                    <option key={country} value={country} selected={formData.country === country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm mb-1.5">
                  Город <span className="text-destructive">*</span>
                </label>
                {formData.country === 'Казахстан' ? (
                  <select
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Выберите город</option>
                    {kazakhstanCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Введите название города"
                    required
                  />
                )}
              </div>

              {/* Email верификация */}
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm mb-1.5">
                  Email <span className="text-destructive">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      if (!isDemo && isEmailVerified) return;
                      updateField('email', e.target.value);
                    }}
                    className="flex-1 px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    placeholder="distributor@example.com"
                    required
                    disabled={!isDemo && isEmailVerified}
                  />
                  {!isDemo && !isEmailVerified && (
                    <button
                      type="button"
                      onClick={handleSendEmailCode}
                      disabled={isSendingEmailCode || !formData.email || emailCodeCooldown > 0}
                      className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm font-medium whitespace-nowrap"
                    >
                      {isSendingEmailCode ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="hidden sm:inline">Отправка...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : emailCodeCooldown > 0 ? (
                        <>
                          <Mail className="w-4 h-4" />
                          <span className="hidden sm:inline">Повторить ({emailCodeCooldown}с)</span>
                          <span className="sm:hidden">{emailCodeCooldown}с</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span className="hidden sm:inline">Отправить код</span>
                          <span className="sm:hidden">Код</span>
                        </>
                      )}
                    </button>
                  )}
                  {!isDemo && isEmailVerified && (
                    <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-500/10 text-green-600 rounded-md whitespace-nowrap">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium">Подтверждено</span>
                    </div>
                  )}
                </div>
                {!isDemo && emailCodeSent && !isEmailVerified && (
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs sm:text-sm mb-1.5">
                      Код верификации <span className="text-destructive">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={emailVerificationCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setEmailVerificationCode(value);
                          setEmailVerificationError(undefined);
                        }}
                        className="flex-1 px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Введите 6-значный код"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyEmailCode}
                        disabled={isVerifyingEmailCode || emailVerificationCode.length !== 6}
                        className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm font-medium whitespace-nowrap"
                      >
                        {isVerifyingEmailCode ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">Проверка...</span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          'Подтвердить'
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground break-words">
                      Код отправлен на {formData.email}. Проверьте почту.
                    </p>
                  </div>
                )}
                {emailVerificationError && (
                  <p className="mt-2 text-xs text-destructive">{emailVerificationError}</p>
                )}
              </div>

              {/* Phone верификация */}
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm mb-1.5">
                  Номер телефона <span className="text-destructive">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      updateField('phone', formatted);
                    }}
                    className="flex-1 px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    placeholder="+7 (900) 123-45-67"
                    required
                    disabled={!isDemo && isPhoneVerified}
                  />
                  {!isDemo && !isPhoneVerified && (
                    <button
                      type="button"
                      onClick={handleSendPhoneCode}
                      disabled={isSendingPhoneCode || !formData.phone || phoneCodeCooldown > 0}
                      className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm font-medium whitespace-nowrap"
                    >
                      {isSendingPhoneCode ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="hidden sm:inline">Отправка...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : phoneCodeCooldown > 0 ? (
                        <>
                          <Phone className="w-4 h-4" />
                          <span className="hidden sm:inline">Повторить ({phoneCodeCooldown}с)</span>
                          <span className="sm:hidden">{phoneCodeCooldown}с</span>
                        </>
                      ) : (
                        <>
                          <Phone className="w-4 h-4" />
                          <span className="hidden sm:inline">Отправить код</span>
                          <span className="sm:hidden">Код</span>
                        </>
                      )}
                    </button>
                  )}
                  {isPhoneVerified && (
                    <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-500/10 text-green-600 rounded-md whitespace-nowrap">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium">Подтверждено</span>
                    </div>
                  )}
                </div>
                {phoneVerificationError && (
                  <p className="mt-2 text-xs text-destructive">{phoneVerificationError}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm mb-1.5">
                  Пароль <span className="text-destructive">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Минимум 8 символов"
                  minLength={8}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm mb-1.5 font-medium">
                  Категории (необязательно)
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Выберите категории, с которыми вы работаете. Можно выбрать несколько или не выбирать ни одной.
                </p>
                {isCategoriesLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Загрузка категорий...
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Категории не загружены</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {categories.map((category) => {
                        const isSelected = formData.categoryIds?.includes(category.id) || false;
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => handleCategoryToggle(category.id)}
                            className={`relative group p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
                              ? 'border-primary bg-primary/10 shadow-md scale-[1.02]'
                              : 'border-border bg-card hover:border-primary/50 hover:bg-accent/30 hover:shadow-sm'
                              }`}
                          >
                            {/* Иконка галочки при выборе */}
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm">
                                <Check className="w-4 h-4 text-primary-foreground" />
                              </div>
                            )}

                            {/* Иконка категории */}
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${isSelected
                              ? 'bg-primary/20'
                              : 'bg-muted group-hover:bg-primary/10'
                              }`}>
                              <Package className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                                }`} />
                            </div>

                            {/* Название категории */}
                            <p className={`text-sm font-medium text-left transition-colors ${isSelected ? 'text-primary' : 'text-foreground'
                              }`}>
                              {category.name}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Счетчик выбранных */}
                    {formData.categoryIds && formData.categoryIds.length > 0 && (
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <div className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                          Выбрано: {formData.categoryIds.length} {formData.categoryIds.length === 1 ? 'категория' : 'категорий'}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
              <button
                type="button"
                onClick={onBack}
                disabled={isSubmitting}
                className="w-full sm:flex-1 px-4 py-2.5 text-sm sm:text-base border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (!isDemo && (!isEmailVerified || !isPhoneVerified))}
                className="w-full sm:flex-1 bg-primary text-primary-foreground py-2.5 rounded-md hover:opacity-90 transition-opacity font-medium disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Регистрация...</span>
                    <span className="sm:hidden">Отправка...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Завершить регистрацию</span>
                    <span className="sm:hidden">Зарегистрироваться</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <PhoneVerificationModal
        isOpen={isPhoneVerificationModalOpen}
        onClose={() => setIsPhoneVerificationModalOpen(false)}
        phoneNumber={formData.phone || ''}
        onVerified={handlePhoneVerified}
        isDemo={isDemo}
      />
    </div>
  );
}
