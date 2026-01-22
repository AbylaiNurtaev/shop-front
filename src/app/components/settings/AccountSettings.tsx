import React, { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import api from '../../api/axios';
import { uploadPhoto } from '../../api/upload';
import { User } from '../../types';
import { toast } from 'sonner';

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
  role: 'store' | 'brand' | 'distributor' | 'salesRep';
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
  const [userForm, setUserForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    isActive: true,
  });
  const [storeForm, setStoreForm] = useState({
    name: '',
    address: '',
    description: '',
    locationLink: '',
    photos: '',
  });

  useEffect(() => {
    let isActive = true;
    const loadProfile = async () => {
      try {
        const userResponse = await api.get<ApiUser>(`/users/${userId}`);
        if (!isActive) return;
        setUserForm({
          email: userResponse.data.email,
          firstName: userResponse.data.firstName,
          lastName: userResponse.data.lastName,
          isActive: userResponse.data.isActive ?? true,
        });
        if (storeId) {
          const storeResponse = await api.get<ApiStore>(`/stores/${storeId}`);
          if (!isActive) return;
          setStoreForm({
            name: storeResponse.data.name,
            address: storeResponse.data.address,
            description: storeResponse.data.description || '',
            locationLink:
              typeof storeResponse.data.location === 'string'
                ? storeResponse.data.location
                : storeResponse.data.location?.link ?? '',
            photos: storeResponse.data.photos?.join(', ') || '',
          });
        }
      } catch (error) {
        console.error('Ошибка загрузки профиля', error);
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
  }, [userId, storeId]);

  const handleUpdateUser = async () => {
    try {
      await api.put(`/users/${userId}`, {
        firstName: userForm.firstName,
        lastName: userForm.lastName,
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
      if (role === 'distributor' && (updatedUser.data as any).distributorId) {
        updatedUserData.distributorId = (updatedUser.data as any).distributorId;
      }

      onUserUpdated(updatedUserData);
      toast.success('Профиль пользователя обновлен.');
    } catch (error) {
      console.error('Ошибка обновления пользователя', error);
      toast.error('Не удалось обновить пользователя.');
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
    try {
      await api.put(`/stores/${storeId}`, {
        name: storeForm.name,
        address: storeForm.address,
        location: {
          link: storeForm.locationLink,
        },
        description: storeForm.description || undefined,
        photos: storeForm.photos
          ? storeForm.photos.split(',').map((item) => item.trim()).filter(Boolean)
          : undefined,
      });
      await api.get<ApiStore>(`/stores/${storeId}`);
      toast.success('Данные магазина обновлены.');
    } catch (error) {
      console.error('Ошибка обновления магазина', error);
      toast.error('Не удалось обновить магазин.');
    }
  };

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

      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={userForm.email}
              disabled
              className="w-full h-11 px-3 bg-gray-100 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={userForm.isActive}
              onChange={(e) => setUserForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="h-5 w-5"
            />
            <span className="text-sm font-medium">Активен</span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Имя</label>
            <input
              type="text"
              value={userForm.firstName}
              onChange={(e) => setUserForm((prev) => ({ ...prev, firstName: e.target.value }))}
              className="w-full h-11 px-3 bg-gray-50 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Фамилия</label>
            <input
              type="text"
              value={userForm.lastName}
              onChange={(e) => setUserForm((prev) => ({ ...prev, lastName: e.target.value }))}
              className="w-full h-11 px-3 bg-gray-50 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleUpdateUser}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
          >
            Сохранить пользователя
          </button>
          <button
            onClick={handleDeleteUser}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-semibold"
          >
            Удалить пользователя
          </button>
        </div>
      </div>

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
                  className="flex-shrink-0 h-11 w-11 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
            >
              Сохранить магазин
            </button>
            <button
              onClick={handleDeleteStore}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-semibold"
            >
              Удалить магазин
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

