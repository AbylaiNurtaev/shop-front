import React, { useState, useEffect, FormEvent } from 'react';
import { ArrowLeft, Users, Loader2, Mail, CheckCircle2, Phone } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { PhoneVerificationModal } from './PhoneVerificationModal';

interface SalesRepRegistrationProps {
  onComplete: () => void | Promise<void>;
  onBack: () => void;
  isDemo?: boolean;
}

// Функция для форматирования номера телефона
const formatPhoneNumber = (value: string): string => {
  // Удаляем все нецифровые символы, кроме +
  const cleaned = value.replace(/[^\d+]/g, '');

  // Если начинается с +7, форматируем как казахстанский номер
  if (cleaned.startsWith('+7')) {
    const digits = cleaned.slice(2).replace(/\D/g, '').slice(0, 10);
    if (digits.length === 0) return '+7';
    if (digits.length <= 3) return `+7 (${digits}`;
    if (digits.length <= 6) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    if (digits.length <= 8) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
  }

  // Если начинается с 7 без +, добавляем +
  if (cleaned.startsWith('7') && !cleaned.startsWith('+')) {
    const digits = cleaned.slice(1).replace(/\D/g, '').slice(0, 10);
    if (digits.length === 0) return '+7';
    if (digits.length <= 3) return `+7 (${digits}`;
    if (digits.length <= 6) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    if (digits.length <= 8) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
  }

  // Если начинается с 8, заменяем на +7
  if (cleaned.startsWith('8')) {
    const digits = cleaned.slice(1).replace(/\D/g, '').slice(0, 10);
    if (digits.length === 0) return '+7';
    if (digits.length <= 3) return `+7 (${digits}`;
    if (digits.length <= 6) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    if (digits.length <= 8) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
  }

  // Если начинается с +, но не +7, оставляем как есть
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Если ничего не подошло, начинаем с +7
  const digits = cleaned.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '+7';
  if (digits.length <= 3) return `+7 (${digits}`;
  if (digits.length <= 6) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 8) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
};

const EMAIL_COOLDOWN_KEY = 'salesrep_email_cooldown';
const PHONE_COOLDOWN_KEY = 'salesrep_phone_cooldown';

export function SalesRepRegistration({ onComplete, onBack, isDemo = false }: SalesRepRegistrationProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    password: '',
    phoneNumber: '',
  });

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

  // Функция для нормализации номера телефона
  const normalizePhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
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
      const isDemoMode = window.location.pathname.includes('/demo');
      await api.post('/auth/register-sales-representative', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || undefined,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber || undefined,
        verificationCode: isDemo ? '000000' : emailVerificationCode,
        ...(isDemoMode && { demo: true }),
      });
      toast.success('Регистрация успешна!');
      await onComplete();
    } catch (error: any) {
      console.error('Ошибка при регистрации ТП', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось зарегистрироваться';
      toast.error(errorMessage);
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
    if (!formData.phoneNumber) {
      setPhoneVerificationError('Пожалуйста, введите номер телефона');
      return;
    }

    const normalizedPhone = normalizePhoneNumber(formData.phoneNumber);
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

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 relative">
      {isSubmitting && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-lg p-6 sm:p-8 flex flex-col items-center gap-4 max-w-sm w-full">
            <div className="relative">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary/70" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold mb-1">Регистрация ТП</h3>
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
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold">
                Регистрация ТП{isDemo && ' (Демо)'}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isDemo
                  ? 'Демо-режим: можно использовать любой email, подтверждение email не требуется'
                  : 'Укажите основные данные'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 relative">
            {isSubmitting && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] rounded-lg z-10" />
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm mb-1.5">
                  Имя <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Введите ваше имя"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm mb-1.5">
                  Фамилия <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Введите вашу фамилию"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm mb-1.5">
                  Отчество
                </label>
                <input
                  type="text"
                  value={formData.middleName}
                  onChange={(e) => updateField('middleName', e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Введите ваше отчество (необязательно)"
                />
              </div>

              {/* Email верификация */}
              <div>
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
                    placeholder="sales@example.com"
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
                      Код отправлен на <span className="break-all">{formData.email}</span>. Проверьте почту.
                    </p>
                  </div>
                )}
                {emailVerificationError && (
                  <p className="mt-2 text-xs text-destructive">{emailVerificationError}</p>
                )}
              </div>

              {/* Phone верификация */}
              <div>
                <label className="block text-xs sm:text-sm mb-1.5">
                  Номер телефона <span className="text-destructive">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      updateField('phoneNumber', formatted);
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
                      disabled={isSendingPhoneCode || !formData.phoneNumber || phoneCodeCooldown > 0}
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

              <div>
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

              <div>
                <label className="block text-xs sm:text-sm mb-1.5">
                  Номер телефона
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    updateField('phoneNumber', formatted);
                  }}
                  className="w-full px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  placeholder="+7 (900) 123-45-67"
                  disabled={!isDemo && isPhoneVerified}
                />
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
        phoneNumber={formData.phoneNumber}
        onVerified={handlePhoneVerified}
        isDemo={isDemo}
      />
    </div>
  );
}
