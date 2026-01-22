import React, { useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowLeft, Upload, Store } from 'lucide-react';
import { StoreProfile } from '../../types';

interface StoreRegistrationProps {
  onComplete: (profile: StoreProfile) => void;
  onBack: () => void;
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

export function StoreRegistration({ onComplete, onBack }: StoreRegistrationProps) {
  const [formData, setFormData] = useState<StoreProfile>({
    firstName: '',
    lastName: '',
    password: '',
    storeName: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    description: '',
    locationLink: '',
    logoFile: null,
    logoUrl: undefined,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  const updateField = (field: keyof StoreProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    updateField('phone', formatted);
  };

  const isKazakhstan = formData.country === 'Казахстан';

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
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
              <h1 className="text-xl font-semibold">Регистрация магазина</h1>
              <p className="text-sm text-muted-foreground">Введите данные вашего магазина</p>
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

              <div className="md:col-span-2">
                <label className="block text-sm mb-1.5">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="store@example.com"
                  required
                />
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
                  Телефон <span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="+7 (900) 123-45-67"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1.5">
                  Локация (ссылка в 2ГИС) <span className="text-destructive">*</span>
                </label>
                <input
                  type="url"
                  value={formData.locationLink}
                  onChange={(e) => updateField('locationLink', e.target.value)}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="https://2gis.kz/astana/geo/9570784901748102/71.411775,51.123502"
                  pattern="https://2gis\\.kz/[a-z-]+/geo/\\d+/-?\\d+(?:\\.\\d+)?,-?\\d+(?:\\.\\d+)?"
                  title="Ссылка должна быть в формате https://2gis.kz/astana/geo/9570784901748102/71.411775,51.123502"
                  required
                />
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
    </div>
  );
}