import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Store, Loader2, Mail, CheckCircle2, Phone } from 'lucide-react';
import { StoreProfile } from '../../types';
import api from '../../api/axios';
import { PhoneVerificationModal } from './PhoneVerificationModal';
import { LocationPickerMap } from '../store/LocationPickerMap';

interface StoreRegistrationProps {
  onComplete: (profile: StoreProfile) => void;
  onBack: () => void;
  isDemo?: boolean;
}

const COUNTRIES = [
  'Казахстан',
  'Россия',
  'Узбекистан',
  'Кыргызстан',
  'Таджикистан',
  'Туркменистан',
  'Другая',
];

const KAZAKHSTAN_CITIES = [
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

// Список тестовых email и телефонов, для которых не требуется верификация
const TEST_STORE_EMAILS = [
  'test-store-1@example.com',
  'test-store-2@example.com',
  'test-store-3@example.com',
  'test-store-4@example.com',
  'test-store-5@example.com',
];

const TEST_STORE_PHONES = [
  '+7 (700) 111-11-11',
  '+7 (700) 222-22-22',
  '+7 (700) 333-33-33',
  '+7 (700) 444-44-44',
  '+7 (700) 555-55-55',
];

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

export function StoreRegistration({ onComplete, onBack, isDemo = false }: StoreRegistrationProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    password: '',
    storeName: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    phoneNumber: '',
    email: '',
    description: '',
    locationLink: '',
    logoFile: null,
    logoUrl: undefined,
  } as StoreProfile);

  // Email verification states
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [isVerifyingEmailCode, setIsVerifyingEmailCode] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailVerificationError, setEmailVerificationError] = useState(undefined as string | undefined);
  const [emailCodeCooldown, setEmailCodeCooldown] = useState(0);

  // Phone verification states
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingPhoneCode, setIsSendingPhoneCode] = useState(false);
  const [phoneVerificationError, setPhoneVerificationError] = useState(undefined as string | undefined);
  const [isPhoneVerificationModalOpen, setIsPhoneVerificationModalOpen] = useState(false);
  const [phoneCodeCooldown, setPhoneCodeCooldown] = useState(0);

  const [locationError, setLocationError] = useState<string | undefined>(undefined);
  const [hasCoordinatesFromLink, setHasCoordinatesFromLink] = useState(false);
  const [hasLocationFromMap, setHasLocationFromMap] = useState(false);

  const EMAIL_COOLDOWN_KEY = 'store_email_verification_last_sent';
  const PHONE_COOLDOWN_KEY = 'store_phone_verification_last_sent';

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

  const updateField = (field: keyof StoreProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const parse2GisCoordinates = (url: string): { lat: number; lng: number } | null => {
    try {
      const parsed = new URL(url);

      // Ожидаемый формат: https://2gis.kz/<city>/geo/<id>/<lng>,<lat>
      const parts = parsed.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (!last) return null;

      const match = last.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
      if (!match) return null;

      const lng = parseFloat(match[1]);
      const lat = parseFloat(match[2]);

      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

      return { lat, lng };
    } catch {
      return null;
    }
  };

  const handlePhoneChange = (e: any) => {
    const formatted = formatPhoneNumber(e.target.value);
    updateField('phone', formatted);
    updateField('phoneNumber', formatted);
  };

  const handleLocationLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, locationLink: value } as StoreProfile & {
        latitude?: number;
        longitude?: number;
      };

      const parsed = parse2GisCoordinates(value);
      if (parsed) {
        next.latitude = parsed.lat;
        next.longitude = parsed.lng;
        setHasCoordinatesFromLink(true);
        setHasLocationFromMap(false);
        setLocationError(undefined);
      } else {
        next.latitude = undefined;
        next.longitude = undefined;
        setHasCoordinatesFromLink(false);
        setHasLocationFromMap(false);
      }

      return next;
    });
  };

  const handleLocationPicked = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
    setHasCoordinatesFromLink(true);
    setHasLocationFromMap(true);
    setLocationError(undefined);
  };

  const handlePrefillTestStore = () => {
    const testLocationLink = 'https://2gis.kz/almaty/geo/9570784901748102/76.889709,43.238949';
    const parsed = parse2GisCoordinates(testLocationLink);

    setFormData((prev) => ({
      ...prev,
      storeName: prev.storeName || 'Тестовый магазин',
      firstName: prev.firstName || 'Иван',
      lastName: prev.lastName || 'Иванов',
      country: prev.country || 'Казахстан',
      city: prev.city || 'Алматы',
      address: prev.address || 'Улица Тестовая, 1',
      email: TEST_STORE_EMAILS[0],
      phone: TEST_STORE_PHONES[0],
      phoneNumber: TEST_STORE_PHONES[0],
      locationLink: testLocationLink,
      latitude: parsed?.lat,
      longitude: parsed?.lng,
    }));
    setHasCoordinatesFromLink(true);
    setHasLocationFromMap(false);
    setLocationError(undefined);
  };

  // Функция для нормализации номера телефона
  const normalizePhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  };

  const handleEmailChange = (e: any) => {
    if (!isDemo && isEmailVerified) return;
    const email = e.target.value;
    updateField('email', email);
    setEmailVerificationError(undefined);
    setEmailCodeCooldown(0);
    if (!isDemo) {
      localStorage.removeItem(EMAIL_COOLDOWN_KEY);
    }
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
  };

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

  const handleSubmit = (e: any) => {
    e.preventDefault();

    // Валидация и очистка ФИО от пробелов
    const cleanedFirstName = formData.firstName?.trim() || '';
    const cleanedLastName = formData.lastName?.trim() || '';
    const cleanedMiddleName = formData.middleName?.trim() || '';

    if (!cleanedFirstName) {
      setEmailVerificationError('Имя обязательно для заполнения');
      return;
    }

    if (!cleanedLastName) {
      setEmailVerificationError('Фамилия обязательна для заполнения');
      return;
    }

    const isTestEmail = TEST_STORE_EMAILS.includes(formData.email);
    const isTestPhone =
      TEST_STORE_PHONES.includes(formData.phone) || TEST_STORE_PHONES.includes(formData.phoneNumber);

    if (!isDemo && !isEmailVerified && !isTestEmail) {
      setEmailVerificationError('Пожалуйста, подтвердите ваш email');
      return;
    }
    if (!isDemo && !isPhoneVerified && !isTestPhone) {
      setPhoneVerificationError('Пожалуйста, подтвердите ваш номер телефона');
      return;
    }

    if (!formData.locationLink) {
      setLocationError('Пожалуйста, укажите ссылку на локацию в 2ГИС');
      return;
    }

    if (formData.locationLink) {
      const hasLatLng =
        typeof (formData as any).latitude === 'number' && typeof (formData as any).longitude === 'number';
      if (!hasLatLng) {
        setLocationError(
          'Не удалось автоматически определить координаты. Нажмите «Определить на карте» и выберите точку.'
        );
        return;
      }
    }

    // Валидация корпоративной почты
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setEmailVerificationError('Некорректный формат email');
        return;
      }

      if (!isDemo && !isCorporateEmail(formData.email)) {
        setEmailVerificationError('Пожалуйста, используйте корпоративную почту. Публичные почтовые сервисы (Gmail, Yahoo, Mail.ru и т.д.) не допускаются.');
        return;
      }
    }

    setEmailVerificationError(undefined);
    setPhoneVerificationError(undefined);

    // Отправляем очищенные данные
    onComplete({
      ...formData,
      firstName: cleanedFirstName,
      lastName: cleanedLastName,
      middleName: cleanedMiddleName || undefined,
    });
  };

  const isKazakhstan = formData.country === 'Казахстан';

  const handleLogoChange = (event: any) => {
    const file = event.target.files?.[0] ?? null;
    setFormData((prev) => ({ ...prev, logoFile: file }));
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
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
              <Store className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Регистрация магазина{isDemo ? ' (Демо)' : ''}</h1>
              <p className="text-sm text-muted-foreground">Введите данные вашего магазина</p>
              {isDemo && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Демо-режим: можно использовать обычную почту (Gmail, Yahoo и т.д.), подтверждение email не требуется
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm mb-1.5">
                  Название магазина <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => updateField('storeName', e.target.value)}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Введите название магазина"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5">
                  Фамилия <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Введите фамилию"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5">
                  Имя <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Введите имя"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1.5">Отчество</label>
                <input
                  type="text"
                  value={formData.middleName}
                  onChange={(e) => updateField('middleName', e.target.value)}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Введите отчество (необязательно)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1.5">
                  Email <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={handleEmailChange}
                    className={`flex-1 px-3 py-2 bg-input-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${emailVerificationError ? 'border-destructive' : 'border-border'
                      }`}
                    placeholder="store@example.com"
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
                  Телефон <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className={`flex-1 px-3 py-2 bg-input-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${phoneVerificationError ? 'border-destructive' : 'border-border'
                      }`}
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

              <div className="md:col-span-2">
                <label className="block text-sm mb-1.5">
                  Пароль <span className="text-destructive">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Введите пароль"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1.5">
                  Адрес <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Улица, дом"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5">
                  Страна <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => {
                    updateField('country', e.target.value);
                    // Сбрасываем город при смене страны
                    if (e.target.value !== 'Казахстан') {
                      updateField('city', '');
                    }
                  }}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Выберите страну</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1.5">
                  Город <span className="text-destructive">*</span>
                </label>
                {isKazakhstan ? (
                  <select
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Выберите город</option>
                    {KAZAKHSTAN_CITIES.map((city) => (
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
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Город"
                    required
                  />
                )}
              </div>


              <div className="md:col-span-2">
                <label className="block text-sm mb-1.5">
                  Локация (ссылка в 2ГИС) <span className="text-destructive">*</span>
                </label>
                <input
                  type="url"
                  value={formData.locationLink}
                  onChange={handleLocationLinkChange}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="https://2gis.kz/astana/geo/9570784901748102/71.411775,51.123502"
                  pattern="https://2gis\\.kz/[a-z-]+/geo/\\d+(?:/-?\\d+(?:\\.\\d+)?,-?\\d+(?:\\.\\d+)?)?"
                  title="Ссылка должна быть в формате https://2gis.kz/astana/geo/9570784901748102/71.411775,51.123502 или https://2gis.kz/astana/geo/9570784901748102"
                  required
                />
                {formData.locationLink && (
                  <>
                    {hasCoordinatesFromLink && !hasLocationFromMap && (
                      <p className="mt-1 text-xs text-emerald-600">
                        Нашли ваш магазин, спасибо!
                      </p>
                    )}
                    {(!hasCoordinatesFromLink || hasLocationFromMap) && (
                      <>
                        <p
                          className={`mt-1 text-xs ${hasCoordinatesFromLink && hasLocationFromMap
                            ? 'text-emerald-600'
                            : 'text-destructive'
                            }`}
                        >
                          {hasCoordinatesFromLink && hasLocationFromMap
                            ? 'Нашли ваш магазин, спасибо!'
                            : 'Вам обязательно нужно указать точку на карте вашего магазина.'}
                        </p>
                        <div className="mt-2">
                          <LocationPickerMap
                            latitude={(formData as any).latitude}
                            longitude={(formData as any).longitude}
                            initialCity={formData.city}
                            onChange={handleLocationPicked}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
                {locationError && (
                  <p className="mt-1 text-xs text-destructive">{locationError}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1.5">Логотип магазина (необязательно)</label>
                <label className="border-2 border-dashed border-border rounded-md p-6 text-center hover:border-primary/50 transition-colors cursor-pointer block">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Нажмите для загрузки или перетащите файл
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG до 2 МБ</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </label>
                {formData.logoFile && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Файл: {formData.logoFile.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 px-4 py-2.5 border border-border rounded-md hover:bg-accent transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-md hover:opacity-90 transition-opacity font-medium"
              >
                Завершить регистрацию
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