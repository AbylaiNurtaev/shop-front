import React, { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowLeft, Upload, Building2, Loader2, Mail, CheckCircle2, Phone } from 'lucide-react';
import { BrandProfile, Category } from '../../types';
import api from '../../api/axios';
import { PhoneVerificationModal } from './PhoneVerificationModal';

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

interface BrandRegistrationProps {
  onComplete: (profile: BrandProfile) => void | Promise<void>;
  onBack: () => void;
  isDemo?: boolean;
}

export function BrandRegistration({ onComplete, onBack, isDemo = false }: BrandRegistrationProps) {
  const [formData, setFormData] = useState<BrandProfile>({
    name: '',
    country: 'Казахстан',
    city: '',
    phone: '',
    categoryId: '',
    email: '',
    password: '',
    logoFile: null,
    logoUrl: undefined,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(undefined);
  const [logoError, setLogoError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email verification states
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [isVerifyingEmailCode, setIsVerifyingEmailCode] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailVerificationError, setEmailVerificationError] = useState<string | undefined>(undefined);
  const [emailCodeCooldown, setEmailCodeCooldown] = useState(0);

  // Phone verification states
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingPhoneCode, setIsSendingPhoneCode] = useState(false);
  const [phoneVerificationError, setPhoneVerificationError] = useState<string | undefined>(undefined);
  const [isPhoneVerificationModalOpen, setIsPhoneVerificationModalOpen] = useState(false);
  const [phoneCodeCooldown, setPhoneCodeCooldown] = useState(0);

  const EMAIL_COOLDOWN_KEY = 'brand_email_verification_last_sent';
  const PHONE_COOLDOWN_KEY = 'brand_phone_verification_last_sent';

  const defaultBrandCategories: Category[] = [
    { id: 'category_1', name: 'Напитки' },
    { id: 'category_2', name: 'Снеки и снеки' },
    { id: 'category_3', name: 'Молочная продукция' },
    { id: 'category_4', name: 'Хлеб и выпечка' },
    { id: 'category_5', name: 'Бытовая химия' },
  ];

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
    'Сарань',
    'Каскелен',
    'Кентау',
    'Риддер',
    'Жаркент',
    'Аягоз',
  ];

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const response = await api.get<{ items: { id: string; name: string }[] }>('/categories');
        const items = response.data?.items ?? [];
        const loaded = items.map((c) => ({ id: c.id, name: c.name }));
        setCategories(loaded.length > 0 ? loaded : defaultBrandCategories);
      } catch (error) {
        console.error('Ошибка загрузки категорий бренда', error);
        // При ошибке — используем дефолтные категории бренда
        setCategories(defaultBrandCategories);
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    void loadCategories();
  }, []);

  // Функция для нормализации номера телефона (убирает пробелы, дефисы, скобки, добавляет + если нет)
  const normalizePhoneNumber = (phone: string): string => {
    // Удаляем все нецифровые символы, кроме +
    let cleaned = phone.replace(/[^\d+]/g, '');
    // Если не начинается с +, добавляем
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.logoFile) {
      setLogoError('Пожалуйста, загрузите логотип бренда');
      return;
    }
    if (logoError) {
      return;
    }
    if (!isDemo && !isEmailVerified) {
      setEmailVerificationError('Пожалуйста, подтвердите ваш email');
      return;
    }
    if (!isDemo && !isPhoneVerified) {
      setPhoneVerificationError('Пожалуйста, подтвердите ваш номер телефона');
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete(formData);
    } catch (error) {
      console.error('Ошибка при регистрации бренда', error);
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

  const handleSendEmailVerificationCode = async () => {
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

  const handleSendPhoneVerificationCode = async () => {
    if (!formData.phone) {
      setPhoneVerificationError('Пожалуйста, введите номер телефона');
      return;
    }

    const normalizedPhone = normalizePhoneNumber(formData.phone);
    // Проверяем формат: должен быть 7XXXXXXXXXX (RU/KZ) или 1XXXXXXXXXX (US) - всего 11 цифр
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
      setPhoneCodeCooldown(60); // Устанавливаем кулдаун на 60 секунд
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
      setIsPhoneVerified(false);
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

  // Восстанавливаем кулдауны из localStorage при монтировании
  useEffect(() => {
    if (isDemo) return;

    try {
      const lastEmailTs = localStorage.getItem(EMAIL_COOLDOWN_KEY);
      if (lastEmailTs) {
        const last = parseInt(lastEmailTs, 10);
        if (!Number.isNaN(last)) {
          const diff = Math.floor((Date.now() - last) / 1000);
          const remaining = 60 - diff;
          if (remaining > 0) {
            setEmailCodeCooldown(remaining);
          } else {
            localStorage.removeItem(EMAIL_COOLDOWN_KEY);
          }
        }
      }

      const lastPhoneTs = localStorage.getItem(PHONE_COOLDOWN_KEY);
      if (lastPhoneTs) {
        const last = parseInt(lastPhoneTs, 10);
        if (!Number.isNaN(last)) {
          const diff = Math.floor((Date.now() - last) / 1000);
          const remaining = 60 - diff;
          if (remaining > 0) {
            setPhoneCodeCooldown(remaining);
          } else {
            localStorage.removeItem(PHONE_COOLDOWN_KEY);
          }
        }
      }
    } catch {
      // игнорируем ошибки доступа к localStorage
    }
  }, [isDemo]);

  // Автоматическая отправка и подтверждение кода в демо-режиме
  useEffect(() => {
    if (isDemo) {
      // Автоверификация email
      if (formData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(formData.email) && !isEmailVerified) {
          const autoVerifyEmail = async () => {
            try {
              setIsSendingEmailCode(true);
              setEmailVerificationError(undefined);

              await api.post('/auth/verification/send', {
                email: formData.email,
                demo: true,
              });
              setEmailCodeSent(true);

              await new Promise(resolve => setTimeout(resolve, 500));

              setIsVerifyingEmailCode(true);
              const demoCode = '000000';
              setEmailVerificationCode(demoCode);
              await api.post('/auth/verification/verify', {
                email: formData.email,
                code: demoCode,
                demo: true,
              });
              setIsEmailVerified(true);
              setEmailVerificationError(undefined);
            } catch (error: any) {
              console.warn('Демо-режим: ошибка верификации email, но считаем подтвержденным', error);
              setIsEmailVerified(true);
              setEmailVerificationError(undefined);
            } finally {
              setIsSendingEmailCode(false);
              setIsVerifyingEmailCode(false);
            }
          };

          autoVerifyEmail();
        }
      }

      // Автоверификация телефона
      if (formData.phone) {
        const normalizedPhone = normalizePhoneNumber(formData.phone);
        const digitsOnly = normalizedPhone.replace(/\D/g, '');
        if (digitsOnly.length === 11 && !isPhoneVerified) {
          const autoVerifyPhone = async () => {
            try {
              setIsSendingPhoneCode(true);
              setPhoneVerificationError(undefined);

              await api.post('/auth/verification/phone/send', {
                phoneNumber: normalizedPhone,
                demo: true,
              });

              await new Promise(resolve => setTimeout(resolve, 500));

              const demoCode = '000000';
              await api.post('/auth/verification/phone/verify', {
                phoneNumber: normalizedPhone,
                code: demoCode,
                demo: true,
              });
              setIsPhoneVerified(true);
              setPhoneVerificationError(undefined);
            } catch (error: any) {
              console.warn('Демо-режим: ошибка верификации телефона, но считаем подтвержденным', error);
              setIsPhoneVerified(true);
              setPhoneVerificationError(undefined);
            } finally {
              setIsSendingPhoneCode(false);
            }
          };

          autoVerifyPhone();
        }
      }
    }
    // УБРАЛ else блок, который сбрасывал isEmailVerified и isPhoneVerified!
  }, [formData.email, formData.phone, isDemo, isEmailVerified, isPhoneVerified]);

  const updateField = (field: keyof BrandProfile, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Если страна изменилась и это не Казахстан, очищаем город
      if (field === 'country' && value !== 'Казахстан') {
        updated.city = '';
      }
      return updated;
    });
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setLogoError(undefined);

    if (!file) {
      setFormData((prev) => ({ ...prev, logoFile: null }));
      setLogoPreview(undefined);
      return;
    }

    // Проверка размера файла (2 МБ)
    const maxSizeInBytes = 2 * 1024 * 1024; // 2 МБ
    if (file.size > maxSizeInBytes) {
      setLogoError('Размер файла не должен превышать 2 МБ');
      setFormData((prev) => ({ ...prev, logoFile: null }));
      setLogoPreview(undefined);
      return;
    }

    // Проверка квадратного формата
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const aspectRatio = width / height;
      const tolerance = 0.05; // Допустимое отклонение 5%

      if (Math.abs(aspectRatio - 1) > tolerance) {
        setLogoError('Изображение должно быть квадратным (ширина = высота)');
        setFormData((prev) => ({ ...prev, logoFile: null }));
        setLogoPreview(undefined);
        URL.revokeObjectURL(objectUrl);
      } else {
        setFormData((prev) => ({ ...prev, logoFile: file }));
        setLogoPreview(objectUrl);
      }
    };

    img.onerror = () => {
      setLogoError('Не удалось загрузить изображение');
      setFormData((prev) => ({ ...prev, logoFile: null }));
      setLogoPreview(undefined);
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 relative">
      {isSubmitting && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg shadow-lg p-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary/70" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-1">Регистрация бренда</h3>
              <p className="text-sm text-muted-foreground">
                Загрузка логотипа и отправка данных...
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
          Назад
        </button>

        <div className="bg-card border border-border rounded-lg shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Регистрация бренда{isDemo ? ' (Демо)' : ''}</h1>
              <p className="text-sm text-muted-foreground">Укажите основные данные бренда</p>
              {isDemo && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Демо-режим: можно использовать обычную почту (Gmail, Yahoo и т.д.), подтверждение email не требуется
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative">
            {isSubmitting && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] rounded-lg z-10" />
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1.5">
                  Название бренда <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Например, Coca-Cola"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5">
                  Страна производства <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
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

              {formData.country === 'Казахстан' && (
                <div>
                  <label className="block text-sm mb-1.5">
                    Город
                  </label>
                  <select
                    value={formData.city || ''}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Выберите город</option>
                    {kazakhstanCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm mb-1.5">
                  Email владельца бренда <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      if (!isDemo && isEmailVerified) return;
                      updateField('email', e.target.value);
                    }}
                    className="flex-1 px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    placeholder="owner@example.com"
                    required
                    disabled={!isDemo && isEmailVerified}
                  />
                  {!isDemo && !isEmailVerified && (
                    <button
                      type="button"
                      onClick={handleSendEmailVerificationCode}
                      disabled={isSendingEmailCode || !formData.email || emailCodeCooldown > 0}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                    >
                      {isSendingEmailCode ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Отправка...</span>
                        </>
                      ) : emailCodeCooldown > 0 ? (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>Повторить ({emailCodeCooldown}с)</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>Отправить код</span>
                        </>
                      )}
                    </button>
                  )}
                  {!isDemo && isEmailVerified && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-md">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Подтверждено</span>
                    </div>
                  )}
                </div>
                {!isDemo && emailCodeSent && !isEmailVerified && (
                  <div className="mt-3 space-y-2">
                    <label className="block text-sm mb-1.5">
                      Код верификации email <span className="text-destructive">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={emailVerificationCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setEmailVerificationCode(value);
                          setEmailVerificationError(undefined);
                        }}
                        className="flex-1 px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Введите 6-значный код"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyEmailCode}
                        disabled={isVerifyingEmailCode || emailVerificationCode.length !== 6}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                      >
                        {isVerifyingEmailCode ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Проверка...</span>
                          </>
                        ) : (
                          'Подтвердить'
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Код отправлен на {formData.email}. Проверьте почту.
                    </p>
                  </div>
                )}
                {emailVerificationError && (
                  <p className="mt-2 text-xs text-destructive">{emailVerificationError}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1.5">
                  Номер телефона владельца бренда <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      updateField('phone', formatted);
                    }}
                    className="flex-1 px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    placeholder="+7 (900) 123-45-67"
                    required
                    disabled={!isDemo && isPhoneVerified}
                  />
                  {!isDemo && !isPhoneVerified && (
                    <button
                      type="button"
                      onClick={handleSendPhoneVerificationCode}
                      disabled={isSendingPhoneCode || !formData.phone || phoneCodeCooldown > 0}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                    >
                      {isSendingPhoneCode ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Отправка...</span>
                        </>
                      ) : phoneCodeCooldown > 0 ? (
                        <>
                          <Phone className="w-4 h-4" />
                          <span>Повторить ({phoneCodeCooldown}с)</span>
                        </>
                      ) : (
                        <>
                          <Phone className="w-4 h-4" />
                          <span>Отправить код</span>
                        </>
                      )}
                    </button>
                  )}
                  {isPhoneVerified && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-md">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Подтверждено</span>
                    </div>
                  )}
                </div>
                {phoneVerificationError && (
                  <p className="mt-2 text-xs text-destructive">{phoneVerificationError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm mb-1.5">
                  Пароль <span className="text-destructive">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Минимум 8 символов"
                  minLength={8}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1.5">
                  Категория бренда <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => updateField('categoryId', e.target.value)}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">
                    {isCategoriesLoading ? 'Загрузка категорий...' : 'Выберите категорию'}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1.5">
                  Логотип бренда <span className="text-destructive">*</span>
                </label>
                <label className="border-2 border-dashed border-border rounded-md p-6 text-center hover:border-primary/50 transition-colors cursor-pointer block">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Квадратное изображение (1:1), PNG, JPG до 2 МБ
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Рекомендуемый размер: 512×512px или 1024×1024px
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </label>
                {logoError && (
                  <p className="mt-2 text-xs text-destructive">{logoError}</p>
                )}
                {formData.logoFile && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-16 h-16 rounded-md border border-border overflow-hidden bg-muted flex-shrink-0">
                      {logoPreview && (
                        <img
                          src={logoPreview}
                          alt="Превью логотипа бренда"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Файл: {formData.logoFile.name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onBack}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (!isDemo && (!isEmailVerified || !isPhoneVerified))}
                className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-md hover:opacity-90 transition-opacity font-medium disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Регистрация...</span>
                  </>
                ) : (
                  'Завершить регистрацию'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <PhoneVerificationModal
        isOpen={isPhoneVerificationModalOpen}
        onClose={() => setIsPhoneVerificationModalOpen(false)}
        phoneNumber={formData.phone}
        onVerified={handlePhoneVerified}
        isDemo={isDemo}
      />
    </div>
  );
}