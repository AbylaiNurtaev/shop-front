import React, { useEffect, useState, useMemo } from 'react';
import { Copy, Loader2, Package, Check } from 'lucide-react';
import api from '../../api/axios';
import { uploadPhoto } from '../../api/upload';
import { User } from '../../types';
import { toast } from 'sonner';
import { ScrollToTopButton } from '../ui/scroll-to-top-button';
import { LocationPickerMap } from '../store/LocationPickerMap';

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

type ApiUser = {
  id: string;
  role: string;
  email: string;
  firstName: string;
  lastName: string;
  storeId?: string;
  isActive?: boolean;
};

type ApiStore = {
  id: string;
  name: string;
  address: string;
  country?: string;
  city?: string;
  location?: {
    link?: string;
    lat?: number;
    lng?: number;
  } | string;
  latitude?: number;
  longitude?: number;
  description?: string;
  photos?: string[];
};

type ApiBrand = {
  id: string;
  name: string;
  country?: string;
  city?: string;
  phone?: string;
  categoryId?: string;
  logoUrl?: string;
  contactName?: string;
};

type ApiCategory = {
  id: string;
  name: string;
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

interface AccountSettingsProps {
  userId: string;
  storeId?: string | null;
  role: 'store' | 'storeSeller' | 'brand' | 'distributor' | 'salesRep';
  onUserUpdated: (user: User) => void;
  onUserDeleted: () => void;
  onStoreDeleted?: () => void;
}

export function AccountSettings({
  userId,
  storeId,
  role,
  onUserUpdated,
  onUserDeleted,
  onStoreDeleted,
}: AccountSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [isPhotosUploading, setIsPhotosUploading] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [initialUserForm, setInitialUserForm] = useState<{
    isActive?: boolean;
    email?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    name?: string;
    id?: string;
    phoneNumber?: string;
    currency?: string;
    country?: string;
    city?: string;
    categoryIds?: string[];
  }>({
    isActive: true,
  });
  const [initialStoreForm, setInitialStoreForm] = useState({
    name: '',
    address: '',
    country: '',
    city: '',
    description: '',
    locationLink: '',
    latitude: '',
    longitude: '',
    photos: '',
    email: '',
  });
  const [userForm, setUserForm] = useState<{
    isActive?: boolean;
    email?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    name?: string;
    id?: string;
    phoneNumber?: string;
    currency?: string;
    country?: string;
    city?: string;
    categoryIds?: string[];
  }>({
    isActive: true,
    currency: 'KZT',
  });
  const [initialBrandForm, setInitialBrandForm] = useState({
    name: '',
    country: '',
    city: '',
    phone: '',
    categoryId: '',
    logoUrl: '',
    contactName: '',
  });
  const [brandForm, setBrandForm] = useState({
    name: '',
    country: '',
    city: '',
    phone: '',
    categoryId: '',
    logoUrl: '',
    contactName: '',
  });
  const [storeForm, setStoreForm] = useState({
    name: '',
    address: '',
    country: '',
    city: '',
    description: '',
    locationLink: '',
    latitude: '',
    longitude: '',
    photos: '',
    email: '',
  });
  const [storeSettingsForm, setStoreSettingsForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    phoneNumber: '',
  });
  const [initialStoreSettingsForm, setInitialStoreSettingsForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    phoneNumber: '',
  });
  const [isSavingStoreSettings, setIsSavingStoreSettings] = useState(false);
  const [storeLocationError, setStoreLocationError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isActive = true;
    const loadProfile = async () => {
      try {
        // Загружаем настройки пользователя (включая валюту) через новый API
        let userSettings: { currency?: string } = {};
        try {
          const settingsResponse = await api.get<{ currency?: string }>('/users/me/settings');
          if (isActive) {
            userSettings = settingsResponse.data;
          }
        } catch (error) {
          console.warn('Не удалось загрузить настройки пользователя, используем значение по умолчанию', error);
          userSettings = { currency: 'KZT' };
        }

        // Для продавца магазина (кассира) используем POS API
        if (role === 'storeSeller') {
          try {
            // Получаем данные пользователя, чтобы взять email и storeId
            const userResponse = await api.get<ApiUser>(`/users/${userId}`);
            const posResponse = await api.get<{ 
              firstName?: string;
              lastName?: string;
              middleName?: string;
              phoneNumber?: string;
            }>('/pos/account');
            if (!isActive) return;

            const initialData = {
              email: userResponse.data.email,
              firstName: posResponse.data.firstName || '',
              lastName: posResponse.data.lastName || '',
              middleName: posResponse.data.middleName || '',
              phoneNumber: posResponse.data.phoneNumber || '',
              currency: userSettings.currency || 'KZT',
            };

            setInitialUserForm(initialData);
            setUserForm(initialData);
          } catch (error) {
            console.error('Ошибка загрузки профиля кассира', error);
            // Если не удалось получить данные кассира, используем данные пользователя или пустые значения
            const userResponse = await api.get<ApiUser>(`/users/${userId}`);
            const initialData = {
              email: userResponse.data.email,
              firstName: userResponse.data.firstName || '',
              lastName: userResponse.data.lastName || '',
              middleName: '',
              phoneNumber: '',
              currency: userSettings.currency || 'KZT',
            };
            setInitialUserForm(initialData);
            setUserForm(initialData);
          } finally {
            if (isActive) {
              setLoading(false);
            }
          }
          return;
        }

        // Для ТП используем специальный API
        if (role === 'salesRep') {
          const salesRepResponse = await api.get<{ email: string; firstName: string; lastName?: string; middleName?: string; phoneNumber?: string }>('/sales-reps/me');
          if (!isActive) return;
          const initialData = {
            email: salesRepResponse.data.email,
            firstName: salesRepResponse.data.firstName || '',
            lastName: salesRepResponse.data.lastName || '',
            middleName: salesRepResponse.data.middleName || '',
            phoneNumber: salesRepResponse.data.phoneNumber || '',
            currency: userSettings.currency || 'KZT',
          };
          setInitialUserForm(initialData);
          setUserForm(initialData);
          setLoading(false);
          return;
        }

        // Для Дс используем специальный API
        if (role === 'distributor') {
          // Получаем данные пользователя для получения email
          const userResponse = await api.get<ApiUser>(`/users/${userId}`);
          if (!isActive) return;

          // Загружаем категории и данные Дс параллельно
          const [categoriesResponse, distributorResponse] = await Promise.all([
            api.get<{ items: ApiCategory[] }>('/categories'),
            api.get<{ id: string; name: string; country?: string; city?: string; categoryIds?: string[] }>('/distributors/me'),
          ]);
          if (!isActive) return;

          setCategories(categoriesResponse.data.items || []);

          const initialData = {
            id: distributorResponse.data.id,
            email: userResponse.data.email,
            name: distributorResponse.data.name,
            country: distributorResponse.data.country || '',
            city: distributorResponse.data.city || '',
            categoryIds: distributorResponse.data.categoryIds || [],
            currency: userSettings.currency || 'KZT',
          };
          setInitialUserForm(initialData);
          setUserForm(initialData);
          setLoading(false);
          return;
        }

        // Для бренда используем специальный API
        if (role === 'brand') {
          // Получаем данные пользователя для получения email
          const userResponse = await api.get<ApiUser>(`/users/${userId}`);
          if (!isActive) return;

          // Загружаем категории и данные бренда параллельно
          const [categoriesResponse, brandResponse] = await Promise.all([
            api.get<{ items: ApiCategory[] }>('/categories'),
            api.get<ApiBrand>('/brands/me'),
          ]);
          if (!isActive) return;

          setCategories(categoriesResponse.data.items || []);

          const initialBrandData = {
            name: brandResponse.data.name || '',
            country: brandResponse.data.country || '',
            city: brandResponse.data.city || '',
            phone: brandResponse.data.phone || '',
            categoryId: brandResponse.data.categoryId || '',
            logoUrl: brandResponse.data.logoUrl || '',
            contactName: brandResponse.data.contactName || '',
          };
          setInitialBrandForm(initialBrandData);
          setBrandForm(initialBrandData);

          const initialUserData = {
            email: userResponse.data.email,
            currency: userSettings.currency || 'KZT',
          };
          setInitialUserForm(initialUserData);
          setUserForm(initialUserData);
          setLoading(false);
          return;
        }

        const userResponse = await api.get<ApiUser>(`/users/${userId}`);
        if (!isActive) return;
        const initialUser = {
          isActive: userResponse.data.isActive ?? true,
          currency: userSettings.currency || 'KZT',
        };
        setInitialUserForm(initialUser);
        setUserForm(initialUser);
        if (storeId) {
          // Загружаем настройки магазина
          try {
            const storeSettingsResponse = await api.get<{
              firstName?: string;
              lastName?: string;
              middleName?: string;
              phoneNumber?: string;
            }>('/stores/me/settings');
            if (!isActive) return;
            const settingsData = {
              firstName: storeSettingsResponse.data.firstName || userResponse.data.firstName || '',
              lastName: storeSettingsResponse.data.lastName || userResponse.data.lastName || '',
              middleName: storeSettingsResponse.data.middleName || '',
              phoneNumber: storeSettingsResponse.data.phoneNumber || '',
            };
            setInitialStoreSettingsForm(settingsData);
            setStoreSettingsForm(settingsData);
          } catch (error) {
            console.error('Ошибка загрузки настроек магазина', error);
            // Если настройки не загрузились, используем данные пользователя
            const settingsData = {
              firstName: userResponse.data.firstName || '',
              lastName: userResponse.data.lastName || '',
              middleName: '',
              phoneNumber: '',
            };
            setInitialStoreSettingsForm(settingsData);
            setStoreSettingsForm(settingsData);
          }

          const storeResponse = await api.get<ApiStore>(`/stores/${storeId}`);
          if (!isActive) return;

          // Парсим адрес, если country и city не пришли отдельно
          // Формат адреса при регистрации: "улица, дом, город, страна"
          let parsedAddress = storeResponse.data.address || '';
          let parsedCountry = storeResponse.data.country || '';
          let parsedCity = storeResponse.data.city || '';

          // Если country и city не пришли отдельно, пытаемся извлечь из address
          if (!parsedCountry && !parsedCity && parsedAddress) {
            const addressParts = parsedAddress.split(',').map(part => part.trim());
            if (addressParts.length >= 2) {
              // Последняя часть - страна
              parsedCountry = addressParts[addressParts.length - 1];
              // Предпоследняя часть - город
              if (addressParts.length >= 3) {
                parsedCity = addressParts[addressParts.length - 2];
                // Остальные части - адрес (улица, дом)
                parsedAddress = addressParts.slice(0, -2).join(', ');
              } else {
                // Если только 2 части, то первая - адрес, вторая - страна
                parsedAddress = addressParts[0];
                parsedCountry = addressParts[1];
              }
            }
          } else if (parsedAddress && (parsedCountry || parsedCity)) {
            // Если country/city пришли отдельно, но address может содержать их
            // Убираем city и country из address, если они там есть
            let cleanAddress = parsedAddress;
            if (parsedCity && cleanAddress.includes(parsedCity)) {
              cleanAddress = cleanAddress.replace(new RegExp(`,\\s*${parsedCity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), '');
            }
            if (parsedCountry && cleanAddress.includes(parsedCountry)) {
              cleanAddress = cleanAddress.replace(new RegExp(`,\\s*${parsedCountry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), '');
            }
            parsedAddress = cleanAddress.trim().replace(/^,\s*|,\s*$/g, '');
          }

          const location = storeResponse.data.location;
          let locationLink = '';
          let latitude = '';
          let longitude = '';

          if (typeof location === 'string') {
            locationLink = location;
          } else if (location && typeof location === 'object') {
            locationLink = location.link ?? '';
            if (typeof location.lat === 'number') {
              latitude = String(location.lat);
            }
            if (typeof location.lng === 'number') {
              longitude = String(location.lng);
            }
          }

          if (typeof storeResponse.data.latitude === 'number') {
            latitude = String(storeResponse.data.latitude);
          }
          if (typeof storeResponse.data.longitude === 'number') {
            longitude = String(storeResponse.data.longitude);
          }

          if (!latitude && !longitude && locationLink) {
            const parsed = parse2GisCoordinates(locationLink);
            if (parsed) {
              latitude = String(parsed.lat);
              longitude = String(parsed.lng);
            }
          }

          const initialStore = {
            name: storeResponse.data.name,
            address: parsedAddress,
            country: parsedCountry,
            city: parsedCity,
            description: storeResponse.data.description || '',
            locationLink,
            latitude,
            longitude,
            photos: storeResponse.data.photos?.join(', ') || '',
            email: userResponse.data.email,
          };
          setInitialStoreForm(initialStore);
          setStoreForm(initialStore);
        }
      } catch (error) {
        console.error('Ошибка загрузки профиля', error);
        if (role === 'salesRep') {
          toast.error('Не удалось загрузить данные ТП');
        } else if (role === 'distributor') {
          toast.error('Не удалось загрузить данные Дс');
        } else {
          toast.error('Не удалось загрузить профиль');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };
    loadProfile();
    return () => {
      isActive = false;
    };
  }, [userId, storeId, role]);

  const handleUpdateUser = async () => {
    setIsSavingUser(true);
    try {
      // Для продавца магазина (кассира) используем POS API
      if (role === 'storeSeller') {
        const updateData: {
          firstName?: string;
          lastName?: string;
          middleName?: string | null;
          phoneNumber?: string | null;
        } = {};

        if (userForm.firstName !== undefined && userForm.firstName.trim() !== '') {
          updateData.firstName = userForm.firstName.trim();
        }
        if (userForm.lastName !== undefined && userForm.lastName.trim() !== '') {
          updateData.lastName = userForm.lastName.trim();
        }
        if (userForm.middleName !== undefined) {
          updateData.middleName = userForm.middleName.trim() || null;
        }
        if (userForm.phoneNumber !== undefined) {
          updateData.phoneNumber = userForm.phoneNumber.trim() || null;
        }

        await api.put('/pos/account', updateData);

        // Получаем обновленные данные кассира
        const posResponse = await api.get<{ 
          firstName?: string;
          lastName?: string;
          middleName?: string;
          phoneNumber?: string;
        }>('/pos/account');

        // Пытаемся получить актуальные данные пользователя для обновления стора
        try {
          const userResponse = await api.get<ApiUser>(`/users/${userId}`);
          const updatedUserData: User = {
            id: userId,
            email: userResponse.data.email,
            role,
            profileComplete: true,
            firstName: posResponse.data.firstName || userResponse.data.firstName || '',
            lastName: posResponse.data.lastName || userResponse.data.lastName || '',
            storeId: userResponse.data.storeId,
            isActive: userResponse.data.isActive,
          };
          onUserUpdated(updatedUserData);
        } catch (error) {
          console.error('Не удалось обновить данные пользователя после обновления кассира', error);
        }

        // Обновляем начальные значения
        const updatedData = {
          email: userForm.email || '',
          firstName: posResponse.data.firstName || '',
          lastName: posResponse.data.lastName || '',
          middleName: posResponse.data.middleName || '',
          phoneNumber: posResponse.data.phoneNumber || '',
          currency: userForm.currency || 'KZT',
        };
        setInitialUserForm(updatedData);
        setUserForm(updatedData);

        toast.success('Данные кассира успешно обновлены');
        return;
      }

      // Для ТП используем специальный API
      if (role === 'salesRep') {
        await api.put('/sales-reps/me', {
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          middleName: userForm.middleName || undefined,
          phoneNumber: userForm.phoneNumber || undefined,
        });

        // Получаем обновленные данные с сервера
        const salesRepResponse = await api.get<{
          email: string;
          firstName: string;
          lastName?: string;
          middleName?: string;
          phoneNumber?: string;
        }>('/sales-reps/me');

        // Сохраняем валюту через API
        if (userForm.currency) {
          try {
            await api.put('/users/me/settings', {
              currency: userForm.currency,
            });
          } catch (error) {
            console.error('Ошибка сохранения валюты', error);
          }
        }

        // Обновляем начальные значения
        const updatedData = {
          email: salesRepResponse.data.email,
          firstName: salesRepResponse.data.firstName || '',
          lastName: salesRepResponse.data.lastName || '',
          middleName: salesRepResponse.data.middleName || '',
          phoneNumber: salesRepResponse.data.phoneNumber || '',
          currency: userForm.currency || 'KZT',
        };
        setInitialUserForm(updatedData);
        setUserForm(updatedData);

        // Обновляем данные пользователя в App.tsx
        const updatedUserData: User = {
          id: userId,
          email: salesRepResponse.data.email,
          role,
          profileComplete: true,
          firstName: salesRepResponse.data.firstName,
          lastName: salesRepResponse.data.lastName || '',
          currency: userForm.currency || 'KZT',
        };

        onUserUpdated(updatedUserData);
        toast.success('Данные успешно обновлены');
        return;
      }

      // Для Дс используем специальный API
      if (role === 'distributor') {
        const updateData: {
          name?: string;
          country?: string;
          city?: string;
          categoryIds?: string[];
        } = {};

        if (userForm.name !== undefined) {
          updateData.name = userForm.name;
        }
        if (userForm.country !== undefined) {
          updateData.country = userForm.country;
        }
        if (userForm.city !== undefined) {
          updateData.city = userForm.city;
        }
        if (userForm.categoryIds !== undefined) {
          updateData.categoryIds = userForm.categoryIds;
        }

        await api.put('/distributors/me/name', updateData);

        // Получаем обновленные данные Дс
        const distributorResponse = await api.get<{ id: string; name: string; country?: string; city?: string; categoryIds?: string[] }>('/distributors/me');

        // Получаем обновленные данные пользователя для email
        const userResponse = await api.get<ApiUser>(`/users/${userId}`);

        // Сохраняем валюту через API
        if (userForm.currency) {
          try {
            await api.put('/users/me/settings', {
              currency: userForm.currency,
            });
          } catch (error) {
            console.error('Ошибка сохранения валюты', error);
          }
        }

        // Обновляем начальные значения
        setInitialUserForm({
          id: distributorResponse.data.id,
          email: userResponse.data.email,
          name: distributorResponse.data.name,
          country: distributorResponse.data.country || '',
          city: distributorResponse.data.city || '',
          categoryIds: distributorResponse.data.categoryIds || [],
          currency: userForm.currency || 'KZT',
        });

        // Обновляем данные пользователя в App.tsx
        const updatedUserData: User = {
          id: userId,
          email: userResponse.data.email,
          role,
          profileComplete: true,
          firstName: distributorResponse.data.name,
          lastName: '',
          distributorId: distributorResponse.data.id,
          currency: userForm.currency || 'KZT',
        };

        onUserUpdated(updatedUserData);
        toast.success('Данные успешно обновлены');
        return;
      }

      // Для бренда используем специальный API
      if (role === 'brand') {
        await handleUpdateBrand();
        return;
      }

      // Сохраняем валюту через API
      if (userForm.currency) {
        try {
          await api.put('/users/me/settings', {
            currency: userForm.currency,
          });
        } catch (error) {
          console.error('Ошибка сохранения валюты', error);
        }
      }

      await api.put(`/users/${userId}`, {
        isActive: userForm.isActive,
        currency: userForm.currency,
      });
      const updatedUser = await api.get<ApiUser>(`/users/${userId}`);
      const updatedUserData: User = {
        id: updatedUser.data.id,
        email: updatedUser.data.email,
        role,
        profileComplete: true,
        firstName: updatedUser.data.firstName,
        lastName: updatedUser.data.lastName,
        isActive: updatedUser.data.isActive,
        currency: userForm.currency || 'KZT',
      };

      if (role === 'store' && updatedUser.data.storeId) {
        updatedUserData.storeId = updatedUser.data.storeId;
      }

      // Обновляем начальные значения
      setInitialUserForm({
        isActive: updatedUser.data.isActive ?? true,
        currency: userForm.currency || 'KZT',
      });

      onUserUpdated(updatedUserData);
      toast.success('Профиль пользователя обновлен.');
    } catch (error) {
      console.error('Ошибка обновления пользователя', error);
      toast.error('Не удалось обновить пользователя.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleUpdateBrand = async () => {
    setIsSavingBrand(true);
    try {
      const updateData: {
        name?: string;
        country?: string;
        city?: string;
        phone?: string;
        categoryId?: string;
        logoUrl?: string;
        contactName?: string;
      } = {};

      if (brandForm.name !== undefined) {
        updateData.name = brandForm.name;
      }
      if (brandForm.country !== undefined) {
        updateData.country = brandForm.country;
      }
      if (brandForm.city !== undefined) {
        updateData.city = brandForm.city;
      }
      if (brandForm.phone !== undefined) {
        updateData.phone = brandForm.phone;
      }
      if (brandForm.categoryId !== undefined) {
        updateData.categoryId = brandForm.categoryId;
      }
      if (brandForm.logoUrl !== undefined) {
        updateData.logoUrl = brandForm.logoUrl;
      }
      if (brandForm.contactName !== undefined) {
        updateData.contactName = brandForm.contactName;
      }

      // Сохраняем валюту через API
      if (userForm.currency) {
        try {
          await api.put('/users/me/settings', {
            currency: userForm.currency,
          });
        } catch (error) {
          console.error('Ошибка сохранения валюты', error);
        }
      }

      await api.put('/brands/me/settings', updateData);

      // Получаем обновленные данные бренда
      const brandResponse = await api.get<ApiBrand>('/brands/me');

      // Получаем обновленные данные пользователя для email
      const userResponse = await api.get<ApiUser>(`/users/${userId}`);

      // Обновляем начальные значения
      const updatedBrandData = {
        name: brandResponse.data.name || '',
        country: brandResponse.data.country || '',
        city: brandResponse.data.city || '',
        phone: brandResponse.data.phone || '',
        categoryId: brandResponse.data.categoryId || '',
        logoUrl: brandResponse.data.logoUrl || '',
        contactName: brandResponse.data.contactName || '',
      };
      setInitialBrandForm(updatedBrandData);

      // Обновляем данные пользователя в App.tsx
      const updatedUserData: User = {
        id: userId,
        email: userResponse.data.email,
        role,
        profileComplete: true,
        firstName: userResponse.data.firstName,
        lastName: userResponse.data.lastName,
        brandId: brandResponse.data.id,
        brandName: brandResponse.data.name,
        currency: userForm.currency || 'KZT',
      };

      onUserUpdated(updatedUserData);
      toast.success('Данные бренда успешно обновлены');
    } catch (error) {
      console.error('Ошибка обновления бренда', error);
      toast.error('Не удалось обновить данные бренда.');
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm('Удалить пользователя? Это действие нельзя отменить.')) return;
    try {
      await api.delete(`/users/${userId}`);
      onUserDeleted();
    } catch (error) {
      console.error('Ошибка удаления пользователя', error);
      toast.error('Не удалось удалить пользователя.');
    }
  };

  const handleUpdateStoreSettings = async () => {
    setIsSavingStoreSettings(true);
    try {
      await api.put('/stores/me/settings', {
        firstName: storeSettingsForm.firstName,
        lastName: storeSettingsForm.lastName,
        middleName: storeSettingsForm.middleName || undefined,
        phoneNumber: storeSettingsForm.phoneNumber || undefined,
      });

      // Получаем обновленные настройки
      const storeSettingsResponse = await api.get<{
        firstName?: string;
        lastName?: string;
        middleName?: string;
        phoneNumber?: string;
      }>('/stores/me/settings');

      const updatedSettings = {
        firstName: storeSettingsResponse.data.firstName || '',
        lastName: storeSettingsResponse.data.lastName || '',
        middleName: storeSettingsResponse.data.middleName || '',
        phoneNumber: storeSettingsResponse.data.phoneNumber || '',
      };
      setInitialStoreSettingsForm(updatedSettings);

      // Обновляем данные пользователя в App.tsx
      const userResponse = await api.get<ApiUser>(`/users/${userId}`);
      const updatedUserData: User = {
        id: userId,
        email: userResponse.data.email,
        role,
        profileComplete: true,
        firstName: updatedSettings.firstName,
        lastName: updatedSettings.lastName,
        storeId: userResponse.data.storeId,
        isActive: userResponse.data.isActive,
      };
      onUserUpdated(updatedUserData);

      toast.success('Настройки магазина обновлены.');
    } catch (error) {
      console.error('Ошибка обновления настроек магазина', error);
      toast.error('Не удалось обновить настройки магазина.');
    } finally {
      setIsSavingStoreSettings(false);
    }
  };

  const handleUpdateStore = async () => {
    if (!storeId) return;
    setIsSavingStore(true);
    try {
      const updateData: {
        name?: string;
        address?: string;
        country?: string;
        city?: string;
        location?: string;
        latitude?: number;
        longitude?: number;
        description?: string;
        photos?: string[];
      } = {};

      if (storeForm.name) {
        updateData.name = storeForm.name;
      }
      if (storeForm.address) {
        updateData.address = storeForm.address;
      }
      if (storeForm.locationLink) {
        updateData.location = storeForm.locationLink;

        const lat = storeForm.latitude ? Number(storeForm.latitude) : undefined;
        const lng = storeForm.longitude ? Number(storeForm.longitude) : undefined;

        if (
          lat !== undefined &&
          lng !== undefined &&
          !Number.isNaN(lat) &&
          !Number.isNaN(lng)
        ) {
          updateData.latitude = lat;
          updateData.longitude = lng;
        }
      }
      if (storeForm.description) {
        updateData.description = storeForm.description;
      }
      if (storeForm.photos) {
        updateData.photos = storeForm.photos
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }

      await api.put(`/stores/${storeId}`, updateData);

      // Перезагружаем данные магазина для обновления UI
      const storeResponse = await api.get<ApiStore>(`/stores/${storeId}`);

      // Парсим адрес, если country и city не пришли отдельно
      let parsedAddress = storeResponse.data.address || '';
      let parsedCountry = storeResponse.data.country || '';
      let parsedCity = storeResponse.data.city || '';

      if (!parsedCountry && !parsedCity && parsedAddress) {
        const addressParts = parsedAddress.split(',').map(part => part.trim());
        if (addressParts.length >= 2) {
          parsedCountry = addressParts[addressParts.length - 1];
          if (addressParts.length >= 3) {
            parsedCity = addressParts[addressParts.length - 2];
            parsedAddress = addressParts.slice(0, -2).join(', ');
          } else {
            parsedAddress = addressParts[0];
            parsedCountry = addressParts[1];
          }
        }
      } else if (parsedAddress && (parsedCountry || parsedCity)) {
        let cleanAddress = parsedAddress;
        if (parsedCity && cleanAddress.includes(parsedCity)) {
          cleanAddress = cleanAddress.replace(new RegExp(`,\\s*${parsedCity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), '');
        }
        if (parsedCountry && cleanAddress.includes(parsedCountry)) {
          cleanAddress = cleanAddress.replace(new RegExp(`,\\s*${parsedCountry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), '');
        }
        parsedAddress = cleanAddress.trim().replace(/^,\s*|,\s*$/g, '');
      }

      // Получаем email пользователя для обновления
      const userResponse = await api.get<ApiUser>(`/users/${userId}`);

      const location = storeResponse.data.location;
      let locationLink = '';
      let latitude = '';
      let longitude = '';

      if (typeof location === 'string') {
        locationLink = location;
      } else if (location && typeof location === 'object') {
        locationLink = location.link ?? '';
        if (typeof location.lat === 'number') {
          latitude = String(location.lat);
        }
        if (typeof location.lng === 'number') {
          longitude = String(location.lng);
        }
      }

      if (typeof storeResponse.data.latitude === 'number') {
        latitude = String(storeResponse.data.latitude);
      }
      if (typeof storeResponse.data.longitude === 'number') {
        longitude = String(storeResponse.data.longitude);
      }

      if (!latitude && !longitude && locationLink) {
        const parsed = parse2GisCoordinates(locationLink);
        if (parsed) {
          latitude = String(parsed.lat);
          longitude = String(parsed.lng);
        }
      }

      const updatedStore = {
        name: storeResponse.data.name,
        address: parsedAddress,
        country: parsedCountry,
        city: parsedCity,
        description: storeResponse.data.description || '',
        locationLink,
        latitude,
        longitude,
        photos: storeResponse.data.photos?.join(', ') || '',
        email: userResponse.data.email,
      };

      // Обновляем начальные значения
      setInitialStoreForm(updatedStore);
      setStoreForm(updatedStore);

      toast.success('Данные магазина обновлены.');
    } catch (error) {
      console.error('Ошибка обновления магазина', error);
      toast.error('Не удалось обновить магазин.');
    } finally {
      setIsSavingStore(false);
    }
  };

  // Проверяем, изменились ли данные пользователя
  const isUserFormChanged = useMemo(() => {
    if (role === 'salesRep') {
      return (
        userForm.firstName !== initialUserForm.firstName ||
        userForm.lastName !== initialUserForm.lastName ||
        userForm.middleName !== initialUserForm.middleName ||
        userForm.phoneNumber !== initialUserForm.phoneNumber ||
        userForm.currency !== initialUserForm.currency
      );
    }
    if (role === 'distributor') {
      const categoryIdsChanged = JSON.stringify(userForm.categoryIds || []) !== JSON.stringify(initialUserForm.categoryIds || []);
      return (
        userForm.name !== initialUserForm.name ||
        userForm.country !== initialUserForm.country ||
        userForm.city !== initialUserForm.city ||
        categoryIdsChanged ||
        userForm.currency !== initialUserForm.currency
      );
    }
    if (role === 'storeSeller') {
      return (
        userForm.firstName !== initialUserForm.firstName ||
        userForm.lastName !== initialUserForm.lastName ||
        userForm.middleName !== initialUserForm.middleName ||
        userForm.phoneNumber !== initialUserForm.phoneNumber
      );
    }
    return userForm.isActive !== initialUserForm.isActive || userForm.currency !== initialUserForm.currency;
  }, [userForm, initialUserForm, role]);

  // Проверяем, изменились ли данные бренда
  const isBrandFormChanged = useMemo(() => {
    if (role !== 'brand') return false;
    return (
      brandForm.name !== initialBrandForm.name ||
      brandForm.country !== initialBrandForm.country ||
      brandForm.city !== initialBrandForm.city ||
      brandForm.phone !== initialBrandForm.phone ||
      brandForm.categoryId !== initialBrandForm.categoryId ||
      brandForm.logoUrl !== initialBrandForm.logoUrl ||
      brandForm.contactName !== initialBrandForm.contactName
    );
  }, [brandForm, initialBrandForm, role]);

  // Проверяем, изменились ли данные магазина
  const isStoreFormChanged = useMemo(() => {
    if (!storeId) return false;
    return (
      storeForm.name !== initialStoreForm.name ||
      storeForm.address !== initialStoreForm.address ||
      storeForm.description !== initialStoreForm.description ||
      storeForm.locationLink !== initialStoreForm.locationLink ||
      storeForm.latitude !== initialStoreForm.latitude ||
      storeForm.longitude !== initialStoreForm.longitude ||
      storeForm.photos !== initialStoreForm.photos
    );
  }, [storeForm, initialStoreForm, storeId]);

  // Проверяем, изменились ли настройки магазина (ФИО и телефон)
  const isStoreSettingsFormChanged = useMemo(() => {
    return (
      storeSettingsForm.firstName !== initialStoreSettingsForm.firstName ||
      storeSettingsForm.lastName !== initialStoreSettingsForm.lastName ||
      storeSettingsForm.middleName !== initialStoreSettingsForm.middleName ||
      storeSettingsForm.phoneNumber !== initialStoreSettingsForm.phoneNumber
    );
  }, [storeSettingsForm, initialStoreSettingsForm]);

  const handleStorePhotosChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []) as File[];
    if (files.length === 0) return;
    setIsPhotosUploading(true);
    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file: File) => uploadPhoto(file))
      );
      const newUrls = uploadedUrls.filter(Boolean) as string[];
      if (newUrls.length > 0) {
        setStoreForm((prev) => ({
          ...prev,
          photos: prev.photos ? `${prev.photos}, ${newUrls.join(', ')}` : newUrls.join(', '),
        }));
      }
    } catch (error) {
      console.error('Ошибка загрузки фотографий магазина', error);
      toast.error('Не удалось загрузить фото магазина.');
    } finally {
      setIsPhotosUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteStore = async () => {
    if (!storeId) return;
    if (!confirm('Удалить магазин? Это действие нельзя отменить.')) return;
    try {
      await api.delete(`/stores/${storeId}`);
      onStoreDeleted?.();
    } catch (error) {
      console.error('Ошибка удаления магазина', error);
      toast.error('Не удалось удалить магазин.');
    }
  };

  const handleCopyStoreId = async () => {
    if (!storeId) return;
    try {
      await navigator.clipboard.writeText(storeId);
      toast.success('ID магазина скопирован в буфер обмена');
    } catch (error) {
      console.error('Ошибка копирования ID', error);
      toast.error('Не удалось скопировать ID');
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Загрузка профиля...</div>;
  }

  // Функция для получения названия роли на русском
  const getRoleName = (role: string): string => {
    switch (role) {
      case 'store':
        return 'Владелец магазина';
      case 'storeSeller':
        return 'Продавец магазина';
      case 'brand':
        return 'Владелец бренда';
      case 'distributor':
        return 'Дистрибьютор';
      case 'salesRep':
        return 'Торговый представитель';
      case 'admin':
        return 'Администратор';
      default:
        return '';
    }
  };

  // Формируем ФИО в зависимости от роли
  const getFullName = (): string => {
    if (role === 'salesRep') {
      return [userForm.lastName, userForm.firstName, userForm.middleName].filter(Boolean).join(' ') || userForm.email || '';
    }
    if (role === 'store' && storeId) {
      return [storeSettingsForm.lastName, storeSettingsForm.firstName, storeSettingsForm.middleName].filter(Boolean).join(' ') || userForm.email || '';
    }
    if (role === 'distributor') {
      return userForm.name || userForm.email || '';
    }
    if (role === 'storeSeller') {
      return [userForm.lastName, userForm.firstName, userForm.middleName].filter(Boolean).join(' ') || userForm.email || '';
    }
    return userForm.email || '';
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-0">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Настройки аккаунта</h2>
        <div className="mt-4 p-4 bg-card border border-border rounded-lg">
          <div className="text-lg font-semibold text-foreground">{getFullName()}</div>
          <div className="text-sm text-muted-foreground mt-1">{getRoleName(role)}</div>
        </div>
      </div>

      {role === 'salesRep' && (
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-4 mt-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Данные ТП</h3>
            <p className="text-sm text-muted-foreground">Обновите информацию о себе</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-foreground">ID торгового представителя</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (userId) {
                      try {
                        await navigator.clipboard.writeText(userId);
                        toast.success('ID торгового представителя скопирован в буфер обмена');
                      } catch (error) {
                        console.error('Ошибка копирования ID', error);
                        toast.error('Не удалось скопировать ID');
                      }
                    }
                  }}
                  className="flex-shrink-0 h-11 w-11 flex items-center justify-center border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  title="Копировать ID"
                >
                  <Copy className="h-5 w-5 text-foreground" />
                </button>
                <input
                  type="text"
                  value={userId || ''}
                  readOnly
                  className="w-full h-11 px-3 bg-muted border border-border rounded-lg cursor-not-allowed text-muted-foreground"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-foreground">Email</label>
              <input
                type="email"
                value={userForm.email || ''}
                disabled
                className="w-full h-11 px-3 bg-muted border border-border rounded-lg cursor-not-allowed text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">Email нельзя изменить</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                Имя <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={userForm.firstName || ''}
                onChange={(e) => setUserForm((prev) => ({ ...prev, firstName: e.target.value }))}
                className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
                placeholder="Введите ваше имя"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                Фамилия <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={userForm.lastName || ''}
                onChange={(e) => setUserForm((prev) => ({ ...prev, lastName: e.target.value }))}
                className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
                placeholder="Введите вашу фамилию"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-foreground">Отчество</label>
              <input
                type="text"
                value={userForm.middleName || ''}
                onChange={(e) => setUserForm((prev) => ({ ...prev, middleName: e.target.value }))}
                className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
                placeholder="Введите ваше отчество (необязательно)"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-foreground">Номер телефона</label>
              <input
                type="tel"
                value={userForm.phoneNumber || ''}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setUserForm((prev) => ({ ...prev, phoneNumber: formatted }));
                }}
                className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
                placeholder="+7 (900) 123-45-67"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-foreground">Валюта</label>
              <select
                value={userForm.currency || 'KZT'}
                onChange={(e) => setUserForm((prev) => ({ ...prev, currency: e.target.value }))}
                className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
              >
                <option value="KZT">KZT (₸)</option>
                <option value="RUB">RUB (₽)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleUpdateUser}
              disabled={!isUserFormChanged || isSavingUser}
              className={`px-4 py-2 rounded-lg font-semibold cursor-pointer transition-opacity ${isUserFormChanged && !isSavingUser
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
            >
              {isSavingUser ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Сохранение...
                </span>
              ) : (
                'Сохранить'
              )}
            </button>
          </div>
        </div>
      )}

      {role === 'brand' && (
        <div className="bg-gradient-to-br from-card to-muted border border-border rounded-2xl shadow-lg overflow-hidden mt-6">
          {/* Заголовок с логотипом */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Данные бренда</h3>
                <p className="text-sm md:text-base text-muted-foreground">Обновите информацию о вашем бренде</p>
              </div>
              {/* Логотип справа */}
              <div className="flex-shrink-0">
                {brandForm.logoUrl ? (
                  <div className="relative group">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-card shadow-xl overflow-hidden bg-card">
                      <img
                        src={brandForm.logoUrl}
                        alt="Логотип бренда"
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    <label className={`absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${isLogoUploading ? 'opacity-100 cursor-not-allowed' : ''}`}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          setIsLogoUploading(true);
                          try {
                            const uploadedUrl = await uploadPhoto(file);
                            if (uploadedUrl) {
                              setBrandForm((prev) => ({ ...prev, logoUrl: uploadedUrl }));
                            }
                          } catch (error) {
                            console.error('Ошибка загрузки логотипа', error);
                            toast.error('Не удалось загрузить логотип.');
                          } finally {
                            setIsLogoUploading(false);
                            event.target.value = '';
                          }
                        }}
                        disabled={isLogoUploading}
                      />
                      <span className="text-white text-sm font-medium px-4 py-2 bg-primary rounded-lg">
                        {isLogoUploading ? 'Загрузка...' : 'Изменить'}
                      </span>
                    </label>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center w-32 h-32 md:w-40 md:h-40 rounded-2xl border-2 border-dashed border-border bg-muted hover:bg-accent transition-colors cursor-pointer ${isLogoUploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        setIsLogoUploading(true);
                        try {
                          const uploadedUrl = await uploadPhoto(file);
                          if (uploadedUrl) {
                            setBrandForm((prev) => ({ ...prev, logoUrl: uploadedUrl }));
                          }
                        } catch (error) {
                          console.error('Ошибка загрузки логотипа', error);
                          toast.error('Не удалось загрузить логотип.');
                        } finally {
                          setIsLogoUploading(false);
                          event.target.value = '';
                        }
                      }}
                      disabled={isLogoUploading}
                    />
                    <div className="text-center">
                      <div className="text-3xl mb-2">📷</div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {isLogoUploading ? 'Загрузка...' : 'Загрузить логотип'}
                      </span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Форма с данными */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={userForm.email || ''}
                  disabled
                  className="w-full h-12 px-4 bg-muted border border-border rounded-xl cursor-not-allowed text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1.5">Email нельзя изменить</p>
              </div>

              {/* Название бренда */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Название бренда <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={brandForm.name}
                  onChange={(e) => setBrandForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full h-12 px-4 bg-card border-2 border-border rounded-xl text-foreground focus:border-primary focus:ring-2 focus:ring-ring transition-all"
                  placeholder="Введите название бренда"
                />
              </div>

              {/* Страна и Город */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Страна</label>
                <select
                  value={brandForm.country}
                  onChange={(e) => setBrandForm((prev) => ({ ...prev, country: e.target.value }))}
                  className="w-full h-12 px-4 bg-card border-2 border-border rounded-xl text-foreground focus:border-primary focus:ring-2 focus:ring-ring transition-all"
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
                <label className="block text-sm font-semibold text-foreground mb-2">Город</label>
                {brandForm.country === 'Казахстан' ? (
                  <select
                    value={brandForm.city}
                    onChange={(e) => setBrandForm((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full h-12 px-4 bg-card border-2 border-border rounded-xl text-foreground focus:border-primary focus:ring-2 focus:ring-ring transition-all"
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
                    value={brandForm.city}
                    onChange={(e) => setBrandForm((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full h-12 px-4 bg-card border-2 border-border rounded-xl text-foreground focus:border-primary focus:ring-2 focus:ring-ring transition-all"
                    placeholder="Введите город"
                  />
                )}
              </div>

              {/* Категория */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">Категория</label>
                <select
                  value={brandForm.categoryId}
                  onChange={(e) => setBrandForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full h-12 px-4 bg-card border-2 border-border rounded-xl text-foreground focus:border-primary focus:ring-2 focus:ring-ring transition-all"
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Контактное лицо */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">Контактное лицо</label>
                <input
                  type="text"
                  value={brandForm.contactName}
                  onChange={(e) => setBrandForm((prev) => ({ ...prev, contactName: e.target.value }))}
                  className="w-full h-12 px-4 bg-card border-2 border-border rounded-xl text-foreground focus:border-primary focus:ring-2 focus:ring-ring transition-all"
                  placeholder="Введите имя контактного лица"
                />
              </div>

              {/* Номер телефона */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">Номер телефона</label>
                <input
                  type="tel"
                  value={brandForm.phone || ''}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setBrandForm((prev) => ({ ...prev, phone: formatted }));
                  }}
                  className="w-full h-12 px-4 bg-card border-2 border-border rounded-xl text-foreground focus:border-primary focus:ring-2 focus:ring-ring transition-all"
                  placeholder="+7 (900) 123-45-67"
                />
              </div>

              {/* Валюта */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">Валюта</label>
                <select
                  value={userForm.currency || 'KZT'}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, currency: e.target.value }))}
                  className="w-full h-12 px-4 bg-card border-2 border-border rounded-xl text-foreground focus:border-primary focus:ring-2 focus:ring-ring transition-all"
                >
                  <option value="KZT">KZT (₸)</option>
                  <option value="RUB">RUB (₽)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            {/* Кнопка сохранения */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
              <button
                onClick={handleUpdateBrand}
                disabled={!isBrandFormChanged || isSavingBrand}
                className={`px-6 py-3 rounded-xl font-semibold text-base transition-all shadow-lg ${
                  isBrandFormChanged && !isSavingBrand
                    ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:shadow-xl hover:scale-105 active:scale-95'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {isSavingBrand ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Сохранение...
                  </span>
                ) : (
                  'Сохранить изменения'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {role === 'distributor' && (
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-4 mt-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Данные Дс</h3>
            <p className="text-sm text-muted-foreground">Обновите информацию о себе</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-foreground">ID Дс</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (userForm.id) {
                      try {
                        await navigator.clipboard.writeText(userForm.id);
                        toast.success('ID Дс скопирован в буфер обмена');
                      } catch (error) {
                        console.error('Ошибка копирования ID', error);
                        toast.error('Не удалось скопировать ID');
                      }
                    }
                  }}
                  className="flex-shrink-0 h-11 w-11 flex items-center justify-center border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  title="Копировать ID"
                >
                  <Copy className="h-5 w-5 text-foreground" />
                </button>
                <input
                  type="text"
                  value={userForm.id || ''}
                  readOnly
                  className="w-full h-11 px-3 bg-muted border border-border rounded-lg cursor-not-allowed text-muted-foreground"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-foreground">Email</label>
              <input
                type="email"
                value={userForm.email || ''}
                disabled
                className="w-full h-11 px-3 bg-muted border border-border rounded-lg cursor-not-allowed text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">Email нельзя изменить</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-foreground">Имя</label>
              <input
                type="text"
                value={userForm.name || ''}
                onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
                placeholder="Введите ваше имя"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Страна</label>
              <select
                value={userForm.country || ''}
                onChange={(e) => setUserForm((prev) => ({ ...prev, country: e.target.value }))}
                className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
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
              <label className="block text-sm font-medium mb-1 text-foreground">Город</label>
              {userForm.country === 'Казахстан' ? (
                <select
                  value={userForm.city || ''}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
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
                  value={userForm.city || ''}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
                  placeholder="Введите город"
                />
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-foreground">Валюта</label>
              <select
                value={userForm.currency || 'KZT'}
                onChange={(e) => setUserForm((prev) => ({ ...prev, currency: e.target.value }))}
                className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
              >
                <option value="KZT">KZT (₸)</option>
                <option value="RUB">RUB (₽)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-foreground">
                Категории (необязательно)
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Выберите категории, с которыми вы работаете. Можно выбрать несколько или не выбирать ни одной.
              </p>
              {categories.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Загрузка категорий...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {categories.map((category) => {
                      const isSelected = userForm.categoryIds?.includes(category.id) || false;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            const currentIds = userForm.categoryIds || [];
                            const newIds = currentIds.includes(category.id)
                              ? currentIds.filter((id) => id !== category.id)
                              : [...currentIds, category.id];
                            setUserForm((prev) => ({ ...prev, categoryIds: newIds }));
                          }}
                          className={`relative group p-4 rounded-xl border-2 transition-all duration-200 ${
                            isSelected
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
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                            isSelected
                              ? 'bg-primary/20'
                              : 'bg-muted group-hover:bg-primary/10'
                          }`}>
                            <Package className={`w-5 h-5 ${
                              isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                            }`} />
                          </div>
                          
                          {/* Название категории */}
                          <p className={`text-sm font-medium text-left transition-colors ${
                            isSelected ? 'text-primary' : 'text-foreground'
                          }`}>
                            {category.name}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Счетчик выбранных */}
                  {userForm.categoryIds && userForm.categoryIds.length > 0 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <div className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        Выбрано: {userForm.categoryIds.length} {userForm.categoryIds.length === 1 ? 'категория' : 'категорий'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleUpdateUser}
              disabled={!isUserFormChanged || isSavingUser}
              className={`px-4 py-2 rounded-lg font-semibold cursor-pointer transition-opacity ${isUserFormChanged && !isSavingUser
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
            >
              {isSavingUser ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Сохранение...
                </span>
              ) : (
                'Сохранить'
              )}
            </button>
          </div>
        </div>
      )}

      {role === 'storeSeller' && (
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-4 mt-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Настройки кассира</h3>
            <p className="text-sm text-muted-foreground">
              Обновите данные кассира
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-foreground">Email</label>
              <input
                type="email"
                value={userForm.email || ''}
                disabled
                className="w-full h-11 px-3 bg-muted border border-border rounded-lg cursor-not-allowed text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">Email кассира менять нельзя.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                Фамилия <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={userForm.lastName || ''}
                onChange={(e) => setUserForm((prev) => ({ ...prev, lastName: e.target.value }))}
                className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
                placeholder="Введите фамилию"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                Имя <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={userForm.firstName || ''}
                onChange={(e) => setUserForm((prev) => ({ ...prev, firstName: e.target.value }))}
                className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
                placeholder="Введите имя"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-foreground">Отчество</label>
              <input
                type="text"
                value={userForm.middleName || ''}
                onChange={(e) => setUserForm((prev) => ({ ...prev, middleName: e.target.value }))}
                className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
                placeholder="Введите отчество (необязательно)"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-foreground">Номер телефона</label>
              <input
                type="tel"
                value={userForm.phoneNumber || ''}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setUserForm((prev) => ({ ...prev, phoneNumber: formatted }));
                }}
                className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
                placeholder="+7 (900) 123-45-67"
              />
            </div>

            {storeId && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-foreground">ID магазина</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyStoreId}
                    className="flex-shrink-0 h-11 w-11 flex items-center justify-center border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    title="Копировать ID"
                    type="button"
                  >
                    <Copy className="h-5 w-5 text-foreground" />
                  </button>
                  <input
                    type="text"
                    value={storeId}
                    readOnly
                    className="w-full h-11 px-3 bg-muted border border-border rounded-lg cursor-not-allowed text-muted-foreground"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleUpdateUser}
              disabled={!isUserFormChanged || isSavingUser}
              className={`px-4 py-2 rounded-lg font-semibold cursor-pointer transition-opacity ${isUserFormChanged && !isSavingUser
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
            >
              {isSavingUser ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Сохранение...
                </span>
              ) : (
                'Сохранить'
              )}
            </button>
          </div>
        </div>
      )}

      {role === 'store' && storeId && (
        <>
          <div className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-4 mt-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Настройки магазина</h3>
              <p className="text-sm text-muted-foreground">Обновите ФИО и номер телефона</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Фамилия <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={storeSettingsForm.lastName}
                  onChange={(e) => setStoreSettingsForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
                  placeholder="Введите фамилию"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Имя <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={storeSettingsForm.firstName}
                  onChange={(e) => setStoreSettingsForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
                  placeholder="Введите имя"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-foreground">Отчество</label>
                <input
                  type="text"
                  value={storeSettingsForm.middleName}
                  onChange={(e) => setStoreSettingsForm((prev) => ({ ...prev, middleName: e.target.value }))}
                  className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
                  placeholder="Введите отчество (необязательно)"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Номер телефона <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={storeSettingsForm.phoneNumber}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setStoreSettingsForm((prev) => ({ ...prev, phoneNumber: formatted }));
                  }}
                  className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
                  placeholder="+7 (900) 123-45-67"
                  required
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleUpdateStoreSettings}
                disabled={!isStoreSettingsFormChanged || isSavingStoreSettings}
                className={`px-4 py-2 rounded-lg font-semibold cursor-pointer transition-opacity ${isStoreSettingsFormChanged && !isSavingStoreSettings
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
              >
                {isSavingStoreSettings ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Сохранение...
                  </span>
                ) : (
                  'Сохранить настройки'
                )}
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-4 mt-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Данные магазина</h3>
              <p className="text-sm text-muted-foreground">Обновите информацию магазина</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-foreground">ID магазина</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyStoreId}
                    className="flex-shrink-0 h-11 w-11 flex items-center justify-center border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    title="Копировать ID"
                  >
                    <Copy className="h-5 w-5 text-foreground" />
                  </button>
                  <input
                    type="text"
                    value={storeId}
                    readOnly
                    className="w-full h-11 px-3 bg-muted border border-border rounded-lg cursor-not-allowed text-muted-foreground"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-foreground">Email</label>
                <input
                  type="email"
                  value={storeForm.email}
                  disabled
                  className="w-full h-11 px-3 bg-muted border border-border rounded-lg cursor-not-allowed text-muted-foreground"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-foreground">Название</label>
                <input
                  type="text"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-foreground">Адрес</label>
                <input
                  type="text"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
                  placeholder="Улица, дом"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-foreground">Локация (ссылка в 2ГИС)</label>
                <input
                  type="url"
                  value={storeForm.locationLink}
                  onChange={(e) => {
                    const value = e.target.value;
                    setStoreForm((prev) => {
                      const next = { ...prev, locationLink: value };
                      const parsed = parse2GisCoordinates(value);
                      if (parsed) {
                        next.latitude = String(parsed.lat);
                        next.longitude = String(parsed.lng);
                        setStoreLocationError(undefined);
                      } else {
                        next.latitude = '';
                        next.longitude = '';
                        setStoreLocationError('В ссылке не удалось найти координаты. Укажите точку на карте ниже.');
                      }
                      return next;
                    });
                  }}
                  className="w-full h-11 px-3 bg-input-background border border-border rounded-lg text-foreground"
                  placeholder="https://2gis.kz/astana/geo/9570784901748102/71.411775,51.123502"
                  pattern="https://2gis\\.kz/[a-z-]+/geo/\\d+(?:/-?\\d+(?:\\.\\d+)?,-?\\d+(?:\\.\\d+)?)?"
                  title="Ссылка должна быть в формате https://2gis.kz/astana/geo/9570784901748102/71.411775,51.123502 или https://2gis.kz/astana/geo/9570784901748102"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Вставьте ссылку из 2ГИС. Если координаты не определились, укажите точку на карте ниже.
                </p>
                {storeLocationError && (
                  <p className="mt-1 text-xs text-destructive">
                    {storeLocationError}
                  </p>
                )}
                {storeForm.latitude && storeForm.longitude && !storeLocationError && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Текущая точка: {storeForm.longitude}, {storeForm.latitude}
                  </p>
                )}
                <div className="mt-2">
                  <LocationPickerMap
                    latitude={storeForm.latitude}
                    longitude={storeForm.longitude}
                    initialCity={storeForm.city}
                    onChange={(lat, lng) => {
                      setStoreForm((prev) => ({
                        ...prev,
                        latitude: String(lat),
                        longitude: String(lng),
                      }));
                      setStoreLocationError(undefined);
                    }}
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-foreground">Описание</label>
                <textarea
                  value={storeForm.description}
                  onChange={(e) => setStoreForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full min-h-[90px] px-3 py-2 bg-input-background border border-border rounded-lg text-foreground"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-foreground">Фото магазина</label>
                {storeForm.photos ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {storeForm.photos
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean)
                      .map((photo, index) => (
                        <div
                          key={`${photo}-${index}`}
                          className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                        >
                          <img src={photo} alt={`Фото магазина ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Фото еще не загружены.</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-foreground">Загрузка фото магазина</label>
                <label className={`inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm ${isPhotosUploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-muted'
                  }`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={handleStorePhotosChange}
                    disabled={isPhotosUploading}
                  />
                  {isPhotosUploading ? 'Загрузка...' : 'Выбрать файлы'}
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleUpdateStore}
                disabled={!isStoreFormChanged || isSavingStore}
                className={`px-4 py-2 rounded-lg font-semibold cursor-pointer transition-opacity ${isStoreFormChanged && !isSavingStore
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
              >
                {isSavingStore ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Сохранение...
                  </span>
                ) : (
                  'Сохранить магазин'
                )}
              </button>
              <button
                onClick={handleDeleteStore}
                className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg font-semibold cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                Удалить магазин
              </button>
            </div>
          </div>
        </>
      )}
      <ScrollToTopButton />
    </div>
  );
}

