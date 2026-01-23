import React, { useEffect, useState, useMemo } from 'react';
import { Copy, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { uploadPhoto } from '../../api/upload';
import { User } from '../../types';
import { toast } from 'sonner';

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
  description?: string;
  photos?: string[];
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
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [initialUserForm, setInitialUserForm] = useState<{
    isActive?: boolean;
    email?: string;
    firstName?: string;
    name?: string;
    id?: string;
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
    photos: '',
    email: '',
  });
  const [userForm, setUserForm] = useState<{
    isActive?: boolean;
    email?: string;
    firstName?: string;
    name?: string;
    id?: string;
  }>({
    isActive: true,
  });
  const [storeForm, setStoreForm] = useState({
    name: '',
    address: '',
    country: '',
    city: '',
    description: '',
    locationLink: '',
    photos: '',
    email: '',
  });

  useEffect(() => {
    let isActive = true;
    const loadProfile = async () => {
      try {
        // Для торгового представителя используем специальный API
        if (role === 'salesRep') {
          const salesRepResponse = await api.get<{ email: string; firstName: string }>('/sales-reps/me');
          if (!isActive) return;
          const initialData = {
            email: salesRepResponse.data.email,
            firstName: salesRepResponse.data.firstName,
          };
          setInitialUserForm(initialData);
          setUserForm(initialData);
          setLoading(false);
          return;
        }

        // Для дистрибьютора используем специальный API
        if (role === 'distributor') {
          // Получаем данные пользователя для получения email
          const userResponse = await api.get<ApiUser>(`/users/${userId}`);
          if (!isActive) return;

          // Получаем данные дистрибьютора
          const distributorResponse = await api.get<{ id: string; name: string }>('/distributors/me');
          if (!isActive) return;

          const initialData = {
            id: distributorResponse.data.id,
            email: userResponse.data.email,
            name: distributorResponse.data.name,
          };
          setInitialUserForm(initialData);
          setUserForm(initialData);
          setLoading(false);
          return;
        }

        const userResponse = await api.get<ApiUser>(`/users/${userId}`);
        if (!isActive) return;
        const initialUser = {
          isActive: userResponse.data.isActive ?? true,
        };
        setInitialUserForm(initialUser);
        setUserForm(initialUser);
        if (storeId) {
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

          const initialStore = {
            name: storeResponse.data.name,
            address: parsedAddress,
            country: parsedCountry,
            city: parsedCity,
            description: storeResponse.data.description || '',
            locationLink:
              typeof storeResponse.data.location === 'string'
                ? storeResponse.data.location
                : storeResponse.data.location?.link ?? '',
            photos: storeResponse.data.photos?.join(', ') || '',
            email: userResponse.data.email,
          };
          setInitialStoreForm(initialStore);
          setStoreForm(initialStore);
        }
      } catch (error) {
        console.error('Ошибка загрузки профиля', error);
        if (role === 'salesRep') {
          toast.error('Не удалось загрузить данные торгового представителя');
        } else if (role === 'distributor') {
          toast.error('Не удалось загрузить данные дистрибьютора');
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
      // Для торгового представителя используем специальный API
      if (role === 'salesRep') {
        const response = await api.put<{
          message: string;
          salesRepresentative: { email: string; firstName: string };
        }>('/sales-reps/me', {
          firstName: userForm.firstName,
        });

        // Обновляем начальные значения
        setInitialUserForm({
          email: response.data.salesRepresentative.email,
          firstName: response.data.salesRepresentative.firstName,
        });

        // Обновляем данные пользователя в App.tsx
        const updatedUserData: User = {
          id: userId,
          email: response.data.salesRepresentative.email,
          role,
          profileComplete: true,
          firstName: response.data.salesRepresentative.firstName,
          lastName: '',
        };

        onUserUpdated(updatedUserData);
        toast.success('Имя успешно обновлено');
        return;
      }

      // Для дистрибьютора используем специальный API
      if (role === 'distributor') {
        await api.put('/distributors/me/name', {
          name: userForm.name,
        });

        // Получаем обновленные данные дистрибьютора
        const distributorResponse = await api.get<{ id: string; name: string }>('/distributors/me');

        // Получаем обновленные данные пользователя для email
        const userResponse = await api.get<ApiUser>(`/users/${userId}`);

        // Обновляем начальные значения
        setInitialUserForm({
          id: distributorResponse.data.id,
          email: userResponse.data.email,
          name: distributorResponse.data.name,
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
        };

        onUserUpdated(updatedUserData);
        toast.success('Имя успешно обновлено');
        return;
      }

      await api.put(`/users/${userId}`, {
        isActive: userForm.isActive,
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
      };

      if (role === 'store' && updatedUser.data.storeId) {
        updatedUserData.storeId = updatedUser.data.storeId;
      }
      if (role === 'brand' && (updatedUser.data as any).brandId) {
        updatedUserData.brandId = (updatedUser.data as any).brandId;
        updatedUserData.brandName = (updatedUser.data as any).brandName;
      }

      // Обновляем начальные значения
      setInitialUserForm({
        isActive: updatedUser.data.isActive ?? true,
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

  const handleUpdateStore = async () => {
    if (!storeId) return;
    setIsSavingStore(true);
    try {
      const updateData: {
        name?: string;
        address?: string;
        country?: string;
        city?: string;
        location?: string | { link: string };
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
        // API принимает location как string или object с полем link
        updateData.location = storeForm.locationLink;
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

      const updatedStore = {
        name: storeResponse.data.name,
        address: parsedAddress,
        country: parsedCountry,
        city: parsedCity,
        description: storeResponse.data.description || '',
        locationLink:
          typeof storeResponse.data.location === 'string'
            ? storeResponse.data.location
            : storeResponse.data.location?.link ?? '',
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
      return userForm.firstName !== initialUserForm.firstName;
    }
    if (role === 'distributor') {
      return userForm.name !== initialUserForm.name;
    }
    return userForm.isActive !== initialUserForm.isActive;
  }, [userForm, initialUserForm, role]);

  // Проверяем, изменились ли данные магазина
  const isStoreFormChanged = useMemo(() => {
    if (!storeId) return false;
    return (
      storeForm.name !== initialStoreForm.name ||
      storeForm.address !== initialStoreForm.address ||
      storeForm.description !== initialStoreForm.description ||
      storeForm.locationLink !== initialStoreForm.locationLink ||
      storeForm.photos !== initialStoreForm.photos
    );
  }, [storeForm, initialStoreForm, storeId]);

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
    return <div className="p-4 text-sm text-gray-500">Загрузка профиля...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-0">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Настройки аккаунта</h2>
        <p className="text-sm text-gray-500 mt-1">Обновление данных пользователя</p>
      </div>

      {role === 'salesRep' && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 space-y-4 mt-6">
          <div>
            <h3 className="text-xl font-semibold">Данные торгового представителя</h3>
            <p className="text-sm text-gray-500">Обновите информацию о себе</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={userForm.email || ''}
                disabled
                className="w-full h-11 px-3 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email нельзя изменить</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Имя</label>
              <input
                type="text"
                value={userForm.firstName || ''}
                onChange={(e) => setUserForm((prev) => ({ ...prev, firstName: e.target.value }))}
                className="w-full h-11 px-3 bg-gray-50 border border-gray-300 rounded-lg"
                placeholder="Введите ваше имя"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleUpdateUser}
              disabled={!isUserFormChanged || isSavingUser}
              className={`px-4 py-2 rounded-lg font-semibold cursor-pointer transition-opacity ${isUserFormChanged && !isSavingUser
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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

      {role === 'distributor' && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 space-y-4 mt-6">
          <div>
            <h3 className="text-xl font-semibold">Данные дистрибьютора</h3>
            <p className="text-sm text-gray-500">Обновите информацию о себе</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">ID дистрибьютора</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (userForm.id) {
                      try {
                        await navigator.clipboard.writeText(userForm.id);
                        toast.success('ID дистрибьютора скопирован в буфер обмена');
                      } catch (error) {
                        console.error('Ошибка копирования ID', error);
                        toast.error('Не удалось скопировать ID');
                      }
                    }
                  }}
                  className="flex-shrink-0 h-11 w-11 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  title="Копировать ID"
                >
                  <Copy className="h-5 w-5 text-gray-600" />
                </button>
                <input
                  type="text"
                  value={userForm.id || ''}
                  readOnly
                  className="w-full h-11 px-3 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={userForm.email || ''}
                disabled
                className="w-full h-11 px-3 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email нельзя изменить</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Имя</label>
              <input
                type="text"
                value={userForm.name || ''}
                onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full h-11 px-3 bg-gray-50 border border-gray-300 rounded-lg"
                placeholder="Введите ваше имя"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleUpdateUser}
              disabled={!isUserFormChanged || isSavingUser}
              className={`px-4 py-2 rounded-lg font-semibold cursor-pointer transition-opacity ${isUserFormChanged && !isSavingUser
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 space-y-4 mt-6">
          <div>
            <h3 className="text-xl font-semibold">Данные магазина</h3>
            <p className="text-sm text-gray-500">Обновите информацию магазина</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">ID магазина</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyStoreId}
                  className="flex-shrink-0 h-11 w-11 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  title="Копировать ID"
                >
                  <Copy className="h-5 w-5 text-gray-600" />
                </button>
                <input
                  type="text"
                  value={storeId}
                  readOnly
                  className="w-full h-11 px-3 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={storeForm.email}
                disabled
                className="w-full h-11 px-3 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Название</label>
              <input
                type="text"
                value={storeForm.name}
                onChange={(e) => setStoreForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full h-11 px-3 bg-gray-50 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Адрес</label>
              <input
                type="text"
                value={storeForm.address}
                onChange={(e) => setStoreForm((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full h-11 px-3 bg-gray-50 border border-gray-300 rounded-lg"
                placeholder="Улица, дом"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Локация (ссылка в 2ГИС)</label>
              <input
                type="url"
                value={storeForm.locationLink}
                onChange={(e) => setStoreForm((prev) => ({ ...prev, locationLink: e.target.value }))}
                className="w-full h-11 px-3 bg-gray-50 border border-gray-300 rounded-lg"
                placeholder="https://2gis.kz/astana/geo/9570784901748102/71.411775,51.123502"
                pattern="https://2gis\\.kz/[a-z-]+/geo/\\d+/-?\\d+(?:\\.\\d+)?,-?\\d+(?:\\.\\d+)?"
                title="Ссылка должна быть в формате https://2gis.kz/astana/geo/9570784901748102/71.411775,51.123502"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Описание</label>
              <textarea
                value={storeForm.description}
                onChange={(e) => setStoreForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full min-h-[90px] px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Фото магазина</label>
              {storeForm.photos ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {storeForm.photos
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .map((photo, index) => (
                      <div
                        key={`${photo}-${index}`}
                        className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                      >
                        <img src={photo} alt={`Фото магазина ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Фото еще не загружены.</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Загрузка фото магазина</label>
              <label className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm ${isPhotosUploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
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
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-semibold cursor-pointer hover:bg-red-50 transition-colors"
            >
              Удалить магазин
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

