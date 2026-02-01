import React, { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Building2, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { DistributorProfile } from '../../types';
import api from '../../api/axios';

interface DistributorRegistrationProps {
  onComplete: (profile: DistributorProfile) => void | Promise<void>;
  onBack: () => void;
}

export function DistributorRegistration({ onComplete, onBack }: DistributorRegistrationProps) {
  const [formData, setFormData] = useState<DistributorProfile>({
    companyName: '',
    country: 'Казахстан',
    city: '',
    email: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email verification states
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verificationError, setVerificationError] = useState<string | undefined>(undefined);
  const [codeSent, setCodeSent] = useState(false);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isEmailVerified) {
      setVerificationError('Пожалуйста, подтвердите ваш email');
      return;
    }
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError('Пожалуйста, введите и подтвердите код верификации');
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete({
        ...formData,
        verificationCode,
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

  const handleSendVerificationCode = async () => {
    if (!formData.email) {
      setVerificationError('Пожалуйста, введите email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setVerificationError('Некорректный формат email');
      return;
    }

    if (!isCorporateEmail(formData.email)) {
      setVerificationError('Пожалуйста, используйте корпоративную почту. Публичные почтовые сервисы (Gmail, Yahoo, Mail.ru и т.д.) не допускаются.');
      return;
    }

    setIsSendingCode(true);
    setVerificationError(undefined);
    setCodeSent(false);
    setIsEmailVerified(false);

    try {
      await api.post('/auth/verification/send', {
        email: formData.email,
      });
      setCodeSent(true);
    } catch (error: any) {
      const status = error.response?.status;
      const code = error.response?.data?.code;
      const backendError = error.response?.data?.error;

      if (status === 409 && code === 'EMAIL_ALREADY_EXISTS') {
        setVerificationError('Пользователь с таким email уже существует. Попробуйте войти в систему или используйте другой email.');
      } else {
        const fallbackMessage = backendError || error.response?.data?.message || 'Не удалось отправить код верификации';
        setVerificationError(fallbackMessage);
      }
      setCodeSent(false);
      setIsEmailVerified(false);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError('Код должен состоять из 6 цифр');
      return;
    }

    setIsVerifyingCode(true);
    setVerificationError(undefined);

    try {
      await api.post('/auth/verification/verify', {
        email: formData.email,
        code: verificationCode,
      });
      setIsEmailVerified(true);
      setVerificationError(undefined);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Неверный код верификации';
      setVerificationError(errorMessage);
      setIsEmailVerified(false);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Сброс верификации при изменении email
  useEffect(() => {
    if (formData.email) {
      setIsEmailVerified(false);
      setCodeSent(false);
      setVerificationCode('');
      setVerificationError(undefined);
    }
  }, [formData.email]);

  // Сброс города при смене страны
  useEffect(() => {
    if (formData.country !== 'Казахстан') {
      setFormData((prev) => ({ ...prev, city: '' }));
    }
  }, [formData.country]);

  const updateField = (field: keyof DistributorProfile, value: string) => {
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
              <h1 className="text-lg sm:text-xl font-semibold">Регистрация Дс</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Укажите основные данные дистрибьюторской компании</p>
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

              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm mb-1.5">
                  Email <span className="text-destructive">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    placeholder="distributor@example.com"
                    required
                    disabled={isEmailVerified}
                  />
                  {!isEmailVerified && (
                    <button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={isSendingCode || !formData.email}
                      className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm font-medium whitespace-nowrap"
                    >
                      {isSendingCode ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="hidden sm:inline">Отправка...</span>
                          <span className="sm:hidden">...</span>
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
                  {isEmailVerified && (
                    <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-500/10 text-green-600 rounded-md whitespace-nowrap">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium">Подтверждено</span>
                    </div>
                  )}
                </div>
                {codeSent && !isEmailVerified && (
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs sm:text-sm mb-1.5">
                      Код верификации <span className="text-destructive">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setVerificationCode(value);
                          setVerificationError(undefined);
                        }}
                        className="flex-1 px-3 py-2 text-sm sm:text-base bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Введите 6-значный код"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={isVerifyingCode || verificationCode.length !== 6}
                        className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm font-medium whitespace-nowrap"
                      >
                        {isVerifyingCode ? (
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
                {verificationError && (
                  <p className="mt-2 text-xs text-destructive">{verificationError}</p>
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
                disabled={isSubmitting || !isEmailVerified}
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
    </div>
  );
}
