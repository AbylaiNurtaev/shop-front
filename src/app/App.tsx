import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Login } from './components/auth/Login';
import { RoleSelection } from './components/auth/RoleSelection';
import { StoreRegistration } from './components/auth/StoreRegistration';
import { BrandRegistration } from './components/auth/BrandRegistration';
import { DistributorRegistration } from './components/auth/DistributorRegistration';
import { SalesRepRegistration } from './components/auth/SalesRepRegistration';
import { StoreSellerRegistration } from './components/auth/StoreSellerRegistration';
import { SalesRepHome } from './components/salesRep/SalesRepHome';
import { SalesRepHistory } from './components/salesRep/SalesRepHistory';
import { SalesRepStores } from './components/salesRep/SalesRepStores';
import { SalesRepProductGroups } from './components/salesRep/SalesRepProductGroups';
import { SalesRepAnalytics } from './components/salesRep/SalesRepAnalytics';
import { SalesRepSalesAnalytics } from './components/salesRep/SalesRepSalesAnalytics';
import { SalesRepInventory } from './components/salesRep/SalesRepInventory';
import { SalesRepExpiringProducts } from './components/salesRep/SalesRepExpiringProducts';
import { SalesRepPoorlySellingProducts } from './components/salesRep/SalesRepPoorlySellingProducts';
import { SalesRepPlan } from './components/salesRep/SalesRepPlan';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { MobileNav } from './components/MobileNav';
import { ProductList } from './components/store/ProductList';
import { BrandProductSelector } from './components/store/BrandProductSelector';
import { ProductForm } from './components/store/ProductForm';
import { Inventory } from './components/store/Inventory';
import { QRScanner } from './components/store/QRScanner';
import { POS } from './components/store/POS';
import { CategoryManagement } from './components/store/CategoryManagement';
import { InvoiceHistory } from './components/store/InvoiceHistory';
import { SalesHistory } from './components/store/SalesHistory';
import { ActivityHistory } from './components/store/ActivityHistory';
import { Expenses } from './components/store/Expenses';
import { ProductCatalog } from './components/brand/ProductCatalog';
import { BrandProductForm } from './components/brand/BrandProductForm';
import { AccountSettings } from './components/settings/AccountSettings';
import { BuyerHome } from './components/buyer/BuyerHome';
import { WhatsAppChat } from './components/buyer/WhatsAppChat';
import { BrandModeration } from './components/admin/BrandModeration';
import { AdminCategoryManagement } from './components/admin/AdminCategoryManagement';
import { StoresList } from './components/distributor/StoresList';
import { SalesRepsList } from './components/distributor/SalesRepsList';
import { Analytics } from './components/distributor/Analytics';
import { AIFAQ } from './components/distributor/AIFAQ';
import { DemandForecast } from './components/distributor/DemandForecast';
import { BrandRequests } from './components/distributor/BrandRequests';
import { DistributorProducts } from './components/distributor/DistributorProducts';
import { DistributorHistory } from './components/distributor/DistributorHistory';
import { DistributorPoorlySellingProducts } from './components/distributor/DistributorPoorlySellingProducts';
import { DistributorsList } from './components/brand/DistributorsList';
import { CategoryRequest } from './components/brand/CategoryRequest';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { TermsOfService } from './components/legal/TermsOfService';
import { RefundPolicy } from './components/legal/RefundPolicy';
import { PaymentPolicy } from './components/legal/PaymentPolicy';
import { Consent } from './components/legal/Consent';
import { BrandSearchStatistics } from './components/brand/BrandSearchStatistics';
import { User, UserRole, StoreProfile, BrandProfile, DistributorProfile, Product, Category } from './types';
import api from './api/axios';
import axios from 'axios';
import { uploadPhoto } from './api/upload';
import { toast } from 'sonner';

type ApiListResponse<T> = {
  items: T[];
  total?: number;
};

type ApiCategory = {
  id: string;
  name: string;
};

type ApiUser = {
  id: string;
  role: string;
  email: string;
  firstName: string;
  lastName: string;
  storeId?: string;
  brandId?: string;
  brandName?: string;
  distributorId?: string;
  isActive?: boolean;
};

type ApiStore = {
  id: string;
  name: string;
  address: string;
  location?: string | {
    lat?: number;
    lng?: number;
    link?: string;
  };
  latitude?: number;
  longitude?: number;
  description?: string;
  photos?: string[];
};

type ApiProduct = {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    parentId?: string;
  };
  images?: string[];
  sku?: string;
  weight?: string;
  volume?: string;
  unitsPerPack?: number;
  brandName?: string;
  packageInfo?: string;
  storageLife?: string;
  productionDate?: string;
  allergens?: string | string[];
  ageRestrictions?: string;
  // Себестоимость от Дс
  costPrice?: number | null;
  costCurrency?: string | null;
  // Цена магазина
  storePrice?: number | null;
  storeCurrency?: string | null;
  // Поля оплаты
  isPayed?: boolean;
  paymentDate?: string;
  paymentExpiresAt?: string;
  // Дополнительные поля из API
  hasOffer?: boolean;
  offerQuantity?: number | null;
};

type ApiOffer = {
  id: string;
  productId?: string;
  storeId?: string;
  price: number;
  markup?: number;
  currency: string;
  isAvailable?: boolean;
  quantity?: number;
  product?: ApiProduct;
};

type ApiAuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    role: string;
    email: string;
    brandId?: string;
    brandName?: string;
    storeId?: string;
    firstName?: string;
    lastName?: string;
    distributorId?: string;
    isActive?: boolean;
  };
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));
  const [storeId, setStoreId] = useState<string | null>(localStorage.getItem('storeId'));
  const [isSessionRestoring, setIsSessionRestoring] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<ApiOffer[]>([]);
  const [stores, setStores] = useState<ApiStore[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showBrandProductSelector, setShowBrandProductSelector] = useState(false);
  const [productsWithoutCostPrice, setProductsWithoutCostPrice] = useState<number>(0);
  const navigate = useNavigate();
  const location = useLocation();

  const brandProducts = useMemo(
    () => products.filter((product) => product.createdBy === 'brand'),
    [products]
  );

  const mapApiRoleToUserRole = (role: string | undefined): UserRole => {
    if (!role) return 'store';
    const upperRole = role.toUpperCase();

    // Привязка строк роли из бэкенда к фронтовым ролям
    if (upperRole.includes('ADMIN')) return 'admin';
    if (upperRole.includes('DISTRIBUTOR')) return 'distributor';
    if (upperRole.includes('BRAND')) return 'brand';
    if (upperRole.includes('STORE_SELLER') || upperRole.includes('STORESELLER')) return 'storeSeller';
    if (upperRole.includes('STORE')) return 'store';
    if (upperRole.includes('SALES') || upperRole.includes('REP') || upperRole.includes('SALES_REP')) return 'salesRep';
    if (upperRole.includes('BUYER') || upperRole.includes('CLIENT')) return 'buyer';

    // По умолчанию считаем пользователя магазином
    return 'store';
  };

  const resolveRole = (): UserRole => {
    const storedRole = localStorage.getItem('userRole');
    return storedRole === 'brand' || storedRole === 'store' || storedRole === 'buyer' || storedRole === 'admin'
      ? storedRole
      : 'store';
  };

  const encodeCredentials = (email: string, password: string) => {
    const value = `${email}:${password}`;
    return btoa(unescape(encodeURIComponent(value)));
  };

  // Функция для загрузки ФИО в зависимости от роли
  const loadUserFullName = async (role: UserRole, userId: string, storeId?: string): Promise<{ firstName?: string; lastName?: string; middleName?: string }> => {
    try {
      if (role === 'store' && storeId) {
        // Для владельца магазина загружаем из настроек магазина
        const storeSettingsResponse = await api.get<{
          firstName?: string;
          lastName?: string;
          middleName?: string;
        }>('/stores/me/settings');
        return {
          firstName: storeSettingsResponse.data.firstName,
          lastName: storeSettingsResponse.data.lastName,
          middleName: storeSettingsResponse.data.middleName,
        };
      } else if (role === 'salesRep') {
        // Для ТП загружаем из специального API
        const salesRepResponse = await api.get<{
          firstName?: string;
          lastName?: string;
          middleName?: string;
        }>('/sales-reps/me');
        return {
          firstName: salesRepResponse.data.firstName,
          lastName: salesRepResponse.data.lastName,
          middleName: salesRepResponse.data.middleName,
        };
      } else if (role === 'distributor') {
        // Для дистрибьютора загружаем name и разбиваем на ФИО
        const distributorResponse = await api.get<{ name?: string }>('/distributors/me');
        if (distributorResponse.data.name) {
          const nameParts = distributorResponse.data.name.trim().split(/\s+/);
          return {
            lastName: nameParts[0] || undefined,
            firstName: nameParts[1] || undefined,
            middleName: nameParts[2] || undefined,
          };
        }
      } else if (role === 'brand') {
        // Для бренда загружаем contactName и разбиваем на ФИО
        const brandResponse = await api.get<{ contactName?: string }>('/brands/me');
        if (brandResponse.data.contactName) {
          const nameParts = brandResponse.data.contactName.trim().split(/\s+/);
          return {
            lastName: nameParts[0] || undefined,
            firstName: nameParts[1] || undefined,
            middleName: nameParts[2] || undefined,
          };
        }
      }
      // Для остальных ролей (storeSeller, admin) используем данные из /users/{userId}
      const userResponse = await api.get<ApiUser>(`/users/${userId}`);
      return {
        firstName: userResponse.data.firstName,
        lastName: userResponse.data.lastName,
        middleName: undefined,
      };
    } catch (error) {
      console.warn('Не удалось загрузить ФИО пользователя', error);
      // Возвращаем пустые значения при ошибке
      return {};
    }
  };

  const mapApiProduct = (apiProduct: ApiProduct, overrides: Partial<Product> = {}): Product => {
    const createdBy = overrides.createdBy ?? 'brand';
    return {
      id: apiProduct.id,
      name: apiProduct.name ?? overrides.name ?? '—',
      categoryId: apiProduct.categoryId ?? apiProduct.category?.id ?? overrides.categoryId ?? '',
      sku: apiProduct.sku ?? overrides.sku ?? '—',
      quantity: apiProduct.offerQuantity ?? overrides.quantity ?? 0,
      weight: apiProduct.weight ?? overrides.weight ?? '—',
      volume: apiProduct.volume ?? overrides.volume ?? '—',
      unitsPerBox: apiProduct.unitsPerPack ?? overrides.unitsPerBox ?? 1,
      createdBy,
      brandName: apiProduct.brandName ?? overrides.brandName ?? (createdBy === 'brand' ? 'Бренд' : undefined),
      images: apiProduct.images ?? overrides.images,
      packageInfo: apiProduct.packageInfo ?? overrides.packageInfo,
      storageLife: apiProduct.storageLife ?? overrides.storageLife,
      productionDate: apiProduct.productionDate ?? overrides.productionDate,
      allergens: apiProduct.allergens ?? overrides.allergens,
      ageRestrictions: apiProduct.ageRestrictions ?? overrides.ageRestrictions,
      // Поля оплаты
      isPayed: apiProduct.isPayed ?? overrides.isPayed,
      paymentDate: apiProduct.paymentDate ?? overrides.paymentDate,
      paymentExpiresAt: apiProduct.paymentExpiresAt ?? overrides.paymentExpiresAt,
      offerId: overrides.offerId,
      storeId: overrides.storeId,
      price: overrides.price,
      currency: overrides.currency,
      isAvailable: overrides.isAvailable,
      // Себестоимость от Дс (из API напрямую)
      costPrice: apiProduct.costPrice ?? undefined,
      costCurrency: apiProduct.costCurrency ?? undefined,
      // Цена магазина (из API напрямую)
      storePrice: apiProduct.storePrice ?? undefined,
      storeCurrency: apiProduct.storeCurrency ?? undefined,
    };
  };

  useEffect(() => {
    let isActive = true;
    const restoreSession = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const storedUserId = localStorage.getItem('userId');
      if (!accessToken || !storedUserId) {
        if (isActive) setIsSessionRestoring(false);
        return;
      }
      try {
        const userResponse = await api.get<ApiUser>(`/users/${storedUserId}`);
        if (!isActive) return;

        // Загружаем настройки пользователя (включая валюту)
        let userCurrency = 'KZT';
        try {
          const settingsResponse = await api.get<{ currency?: string }>('/users/me/settings');
          userCurrency = settingsResponse.data.currency || 'KZT';
        } catch (error) {
          console.warn('Не удалось загрузить настройки пользователя, используем значение по умолчанию', error);
        }

        const role = mapApiRoleToUserRole(
          userResponse.data.role ?? localStorage.getItem('userRole') ?? undefined
        );

        // Загружаем ФИО в зависимости от роли
        const fullNameData = await loadUserFullName(role, userResponse.data.id, userResponse.data.storeId);

        setUser({
          id: userResponse.data.id,
          email: userResponse.data.email,
          role,
          profileComplete: true,
          firstName: fullNameData.firstName || userResponse.data.firstName,
          lastName: fullNameData.lastName || userResponse.data.lastName,
          middleName: fullNameData.middleName,
          storeId: userResponse.data.storeId,
          brandId: userResponse.data.brandId ?? localStorage.getItem('brandId') ?? undefined,
          brandName: userResponse.data.brandName,
          distributorId: userResponse.data.distributorId,
          isActive: userResponse.data.isActive,
          currency: userCurrency,
        });
        setUserId(userResponse.data.id);
        localStorage.setItem('userId', userResponse.data.id);
        if (userResponse.data.brandId) {
          localStorage.setItem('brandId', userResponse.data.brandId);
        }
        if (userResponse.data.storeId) {
          setStoreId(userResponse.data.storeId);
          localStorage.setItem('storeId', userResponse.data.storeId);
        }
      } catch (error) {
        console.warn('Не удалось восстановить сессию', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('storeId');
        localStorage.removeItem('brandId');
        localStorage.removeItem('userRole');
      } finally {
        if (isActive) setIsSessionRestoring(false);
      }
    };
    restoreSession();
    return () => {
      isActive = false;
    };
  }, []);

  // Auth handlers
  const handleLogin = async (email: string, password: string) => {
    try {
      const credentials = encodeCredentials(email, password);
      const response = await api.post<ApiAuthResponse>('/auth/login', { credentials });
      const { accessToken, refreshToken, user: authedUser, expiresIn } = response.data;

      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      if (expiresIn) {
        // Можно сохранить время истечения токена, если нужно
        localStorage.setItem('tokenExpiresIn', expiresIn.toString());
      }

      if (!authedUser) {
        toast.error('Не удалось получить данные пользователя.');
        return;
      }

      const role = mapApiRoleToUserRole(authedUser.role);

      // Загружаем настройки пользователя (включая валюту)
      let userCurrency = 'KZT';
      try {
        const settingsResponse = await api.get<{ currency?: string }>('/users/me/settings');
        userCurrency = settingsResponse.data.currency || 'KZT';
      } catch (error) {
        console.warn('Не удалось загрузить настройки пользователя, используем значение по умолчанию', error);
      }

      // Загружаем ФИО в зависимости от роли
      const fullNameData = await loadUserFullName(role, authedUser.id, authedUser.storeId);

      setUser({
        id: authedUser.id,
        email: authedUser.email,
        role,
        profileComplete: true,
        firstName: fullNameData.firstName || authedUser.firstName,
        lastName: fullNameData.lastName || authedUser.lastName,
        middleName: fullNameData.middleName,
        storeId: authedUser.storeId,
        brandId: authedUser.brandId,
        brandName: authedUser.brandName,
        distributorId: authedUser.distributorId,
        isActive: authedUser.isActive,
        currency: userCurrency,
      });
      setUserId(authedUser.id);
      localStorage.setItem('userId', authedUser.id);

      if (authedUser.brandId) {
        localStorage.setItem('brandId', authedUser.brandId);
      }

      if (authedUser.storeId) {
        setStoreId(authedUser.storeId);
        localStorage.setItem('storeId', authedUser.storeId);
        await api.get<ApiStore>(`/stores/${authedUser.storeId}`);
      }
      localStorage.setItem('userRole', role);
      if (role === 'admin') {
        navigate('/admin/brands', { replace: true });
      } else if (role === 'distributor') {
        navigate('/distributor/stores', { replace: true });
      } else if (role === 'brand') {
        navigate('/brand/catalog', { replace: true });
      } else if (role === 'salesRep') {
        navigate('/salesrep/analytics', { replace: true });
      } else if (role === 'storeSeller') {
        navigate('/store/pos', { replace: true });
      } else if (role === 'buyer') {
        navigate('/buyer', { replace: true });
      } else {
        navigate('/store/inventory', { replace: true });
      }
    } catch (error) {
      console.error('Ошибка входа', error);
      toast.error('Не удалось войти. Проверьте логин и пароль.');
    }
  };

  const handleRoleSelection = (role: UserRole) => {
    if (role === 'store') {
      navigate('/register/store');
      return;
    }
    if (role === 'brand') {
      navigate('/register/brand');
      return;
    }
    if (role === 'distributor') {
      navigate('/register/distributor');
      return;
    }
    if (role === 'salesRep') {
      navigate('/register/salesrep');
      return;
    }
    if (role === 'storeSeller') {
      navigate('/register/store-seller');
      return;
    }

    // Для остальных ролей пока только сообщаем, что регистрация будет позже
    toast.info('Регистрация этой роли появится позже. Сейчас доступны магазин, бренд, дистрибьютор, ТП и продавец магазина.');
  };

  const handleStoreRegistration = async (profile: StoreProfile) => {
    try {
      // Очистка и валидация ФИО
      const firstName = (profile.firstName || '').trim();
      const lastName = (profile.lastName || '').trim();
      const middleName = (profile.middleName || '').trim();

      if (!firstName) {
        toast.error('Имя обязательно для заполнения');
        return;
      }

      if (!lastName) {
        toast.error('Фамилия обязательна для заполнения');
        return;
      }

      let logoUrl: string | undefined;
      if (profile.logoFile) {
        logoUrl = await uploadPhoto(profile.logoFile);
      }

      const isDemo = window.location.pathname.includes('/demo');
      const userResponse = await api.post<ApiAuthResponse>('/users', {
        role: 'STORE',
        email: profile.email,
        firstName: firstName,
        lastName: lastName,
        middleName: middleName || undefined,
        password: profile.password,
        isActive: true,
        store: {
          name: profile.storeName,
          address: `${profile.address}, ${profile.city}, ${profile.country}`,
          location: profile.locationLink,
          latitude: profile.latitude,
          longitude: profile.longitude,
          description: profile.description || undefined,
          photos: logoUrl ? [logoUrl] : undefined,
          phoneNumber: profile.phoneNumber || profile.phone || undefined,
        },
        ...(isDemo && { demo: true }),
      });

      const { user: createdUser, accessToken, refreshToken } = userResponse.data || {};
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      if (!createdUser) {
        toast.error('Не удалось получить пользователя после регистрации.');
        return;
      }
      setUser({
        id: createdUser.id,
        email: createdUser.email,
        role: 'store',
        profileComplete: true,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        storeId: createdUser.storeId,
        isActive: createdUser.isActive,
        logoUrl,
      });
      setUserId(createdUser.id);
      localStorage.setItem('userId', createdUser.id);
      if (createdUser.storeId) {
        setStoreId(createdUser.storeId);
        localStorage.setItem('storeId', createdUser.storeId);
        await api.get<ApiStore>(`/stores/${createdUser.storeId}`);
      }
      localStorage.setItem('userRole', 'store');
      navigate('/store/inventory', { replace: true });
    } catch (error) {
      console.error('Ошибка регистрации магазина', error);
      toast.error('Не удалось завершить регистрацию магазина.');
    }
  };

  const handleBrandRegistration = async (profile: BrandProfile) => {
    try {
      let logoUrl: string | undefined;
      if (profile.logoFile) {
        logoUrl = await uploadPhoto(profile.logoFile);
      }

      const isDemo = window.location.pathname.includes('/demo');
      await api.post('/brands', {
        name: profile.name,
        country: profile.country,
        city: profile.city,
        phone: profile.phone,
        categoryId: profile.categoryId,
        email: profile.email,
        password: profile.password,
        logoUrl,
        ...(isDemo && { demo: true }),
      });

      toast.success('Бренд успешно зарегистрирован. Ожидайте подтверждения и войдите в систему.');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Ошибка регистрации бренда', error);
      toast.error('Не удалось завершить регистрацию бренда.');
    }
  };

  const handleDistributorRegistration = async (profile: DistributorProfile) => {
    try {
      const isDemo = window.location.pathname.includes('/demo');
      const response = await api.post<ApiAuthResponse>('/auth/register-distributor', {
        companyName: profile.companyName,
        country: profile.country,
        city: profile.city,
        email: profile.email,
        password: profile.password,
        verificationCode: profile.verificationCode,
        ...(profile.categoryIds && profile.categoryIds.length > 0 && { categoryIds: profile.categoryIds }),
        ...(isDemo && { demo: true }),
      });

      const { user: createdUser, accessToken, refreshToken } = response.data || {};
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      if (!createdUser) {
        toast.error('Не удалось получить пользователя после регистрации.');
        return;
      }

      const role = mapApiRoleToUserRole(createdUser.role);
      setUser({
        id: createdUser.id,
        email: createdUser.email,
        role,
        profileComplete: true,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        distributorId: createdUser.distributorId,
        isActive: createdUser.isActive,
      });
      setUserId(createdUser.id);
      localStorage.setItem('userId', createdUser.id);
      if (createdUser.distributorId) {
        localStorage.setItem('distributorId', createdUser.distributorId);
      }
      localStorage.setItem('userRole', role);

      toast.success('Дистрибьютор успешно зарегистрирован.');
      navigate('/distributor/stores', { replace: true });
    } catch (error: any) {
      console.error('Ошибка регистрации Дс', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Не удалось завершить регистрацию Дс.';
      toast.error(errorMessage);
    }
  };


  const handleLogout = () => {
    setUser(null);
    setUserId(null);
    setStoreId(null);
    setCategories([]);
    setProducts([]);
    setOffers([]);
    setStores([]);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('storeId');
    localStorage.removeItem('brandId');
    localStorage.removeItem('userRole');
    navigate('/login', { replace: true });
  };

  // Product handlers
  const handleCreateProduct = () => {
    // For store owners, show brand product selector instead of product form
    if (user?.role === 'store') {
      setShowBrandProductSelector(true);
    } else {
      // Brands can create new products
      setEditingProduct(null);
      setShowProductForm(true);
    }
  };

  const handleAddBrandProduct = async (
    brandProduct: Product,
    quantity: number,
    price: number,
    currency: string,
    isAvailable: boolean,
    markup?: number
  ) => {
    if (!storeId) {
      toast.error('Не удалось определить магазин для создания оффера.');
      return;
    }
    try {
      let calculatedPrice: number | null = null;

      const hasMarkup = markup !== undefined && markup !== null && !isNaN(markup) && markup >= 0;

      // Если указана наценка, вычисляем цену: цена = себестоимость + наценка
      if (hasMarkup) {
        const costPrice = brandProduct.costPrice;

        if (costPrice !== undefined && costPrice !== null) {
          // Есть себестоимость - вычисляем итоговую цену
          calculatedPrice = costPrice + (markup as number);
          console.log('Вычислена цена с наценкой:', { costPrice, markup, calculatedPrice });
        } else {
          // Себестоимости нет - не устанавливаем цену
          console.warn('Себестоимость не найдена для товара, цена не будет установлена', {
            productId: brandProduct.id,
            productName: brandProduct.name,
            markup,
          });
          calculatedPrice = null;
        }
      }

      // Если цена не была вычислена, используем 0 (цена будет установлена позже через наценку)
      const finalPrice = calculatedPrice !== null ? calculatedPrice : 0;

      const offerPayload = {
        productId: brandProduct.id,
        storeId,
        price: finalPrice,
        currency,
        isAvailable,
        quantity,
        ...(markup !== undefined && markup !== null && !isNaN(markup) && markup >= 0
          ? { markup: markup }
          : {}),
      };

      console.log('Создание Offer с данными:', offerPayload);

      const offerResponse = await api.post<ApiOffer>('/offers', offerPayload);
      const createdOffer = offerResponse.data;

      // Перезагружаем все данные, чтобы получить актуальную информацию о товаре с ценами и наценкой
      await loadProductsAndOffers();

      if (markup !== undefined && markup !== null && !isNaN(markup) && markup >= 0 && calculatedPrice !== null && calculatedPrice > 0) {
        toast.success('Товар добавлен и цена установлена');
      } else if (hasMarkup && calculatedPrice === null) {
        toast.warning('Товар добавлен, но цена не установлена - отсутствует себестоимость. Установите цену вручную.');
      } else {
        toast.success('Товар добавлен. Установите цену через наценку в списке товаров');
      }

      setShowBrandProductSelector(false);
    } catch (error) {
      console.error('Ошибка создания оффера', error);
      toast.error('Не удалось добавить товар в инвентарь.');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (editingProduct) {
      try {
        if (user?.role === 'store' && editingProduct.offerId) {
          const response = await api.put<ApiOffer>(`/offers/${editingProduct.offerId}`, {
            price: productData.price ?? editingProduct.price,
            currency: productData.currency ?? editingProduct.currency,
            isAvailable: productData.isAvailable ?? editingProduct.isAvailable ?? true,
            quantity: productData.quantity ?? editingProduct.quantity,
            markup: productData.markup ?? editingProduct.markup,
          });
          const updatedOffer = response.data;
          setOffers((prev) => prev.map((offer) => (
            offer.id === updatedOffer.id ? { ...offer, ...updatedOffer } : offer
          )));
          setShowProductForm(false);
          setEditingProduct(null);
          return;
        }
        await api.put(`/products/${editingProduct.id}`, {
          name: productData.name ?? editingProduct.name,
          categoryId: productData.categoryId ?? editingProduct.categoryId,
          sku: productData.sku ?? editingProduct.sku,
          images: productData.images ?? editingProduct.images,
          weight: productData.weight ?? editingProduct.weight,
          volume: productData.volume ?? editingProduct.volume,
          unit: productData.unit ?? editingProduct.unit,
          unitsPerPack: productData.unitsPerBox ?? editingProduct.unitsPerBox,
          packageInfo: productData.packageInfo ?? editingProduct.packageInfo,
          storageLife: productData.storageLife ?? editingProduct.storageLife,
          productionDate: productData.productionDate ?? editingProduct.productionDate,
          allergens: productData.allergens ?? editingProduct.allergens,
          ageRestrictions: productData.ageRestrictions ?? editingProduct.ageRestrictions,
          brandId: productData.brandId ?? editingProduct.brandId,
        });
        setProducts(products.map((p) =>
          p.id === editingProduct.id ? { ...p, ...productData } : p
        ));
        setShowProductForm(false);
        setEditingProduct(null);
      } catch (error) {
        console.error('Ошибка обновления товара', error);
        toast.error('Не удалось обновить товар.');
      }
      return;
    }

    try {
      if (!user) {
        toast.error('Пользователь не найден.');
        return;
      }

      // Создание товара брендом
      if (user.role === 'brand') {
        // Получаем brandId из user объекта или из localStorage как fallback
        const brandId = user.brandId || localStorage.getItem('brandId');
        if (!brandId) {
          toast.error('Не удалось определить бренд для создания товара.');
          return;
        }

        const response = await api.post('/products', {
          name: productData.name,
          categoryId: productData.categoryId,
          sku: productData.sku,
          brandId: brandId,
          images: productData.images,
          unitsPerPack: productData.unitsPerBox,
          packageInfo: productData.packageInfo,
          storageLife: productData.storageLife,
          productionDate: productData.productionDate,
          allergens: productData.allergens,
          ageRestrictions: productData.ageRestrictions,
        });
        const newProduct = mapApiProduct(response.data, {
          quantity: 0,
          name: productData.name ?? '—',
          sku: productData.sku ?? '—',
          categoryId: productData.categoryId ?? '',
          weight: productData.weight ?? '—',
          volume: productData.volume ?? '—',
          unitsPerBox: productData.unitsPerBox ?? 1,
          createdBy: 'brand',
          brandId: brandId,
          images: productData.images,
          packageInfo: productData.packageInfo,
          storageLife: productData.storageLife,
          productionDate: productData.productionDate,
          allergens: productData.allergens,
          ageRestrictions: productData.ageRestrictions,
        });
        setProducts([...products, newProduct]);
        setShowProductForm(false);
        setEditingProduct(null);
        return;
      }

      // Создание товара для магазина (через Дс)
      if (!user.distributorId) {
        toast.error('Не удалось определить Дс для создания товара.');
        return;
      }
      const response = await api.post('/products', {
        distributorId: user.distributorId,
        name: productData.name,
        sku: productData.sku,
        categoryId: productData.categoryId,
        packageInfo: productData.packageInfo,
        images: productData.images,
      });
      const newProduct = mapApiProduct(response.data, {
        quantity: productData.quantity ?? 0,
        name: productData.name ?? '—',
        sku: productData.sku ?? '—',
        categoryId: productData.categoryId ?? '',
        packageInfo: productData.packageInfo,
        createdBy: user?.role === 'brand' ? 'brand' : 'store',
        images: productData.images,
      });
      // Если указана наценка, создаем Offer с ценой = себестоимость + наценка
      const markup = (productData as any).markup;

      if (markup !== undefined && markup !== null && !isNaN(markup) && markup >= 0) {
        try {
          // Получаем актуальные данные товара с сервера, чтобы узнать себестоимость
          const productResponse = await api.get<ApiProduct>(`/products/${newProduct.id}`);
          const costPrice = productResponse.data.costPrice;

          if (costPrice !== undefined && costPrice !== null) {
            // Получаем валюту из настроек
            let userCurrency = 'KZT';
            try {
              const settingsResponse = await api.get<{ currency?: string }>('/users/me/settings');
              userCurrency = settingsResponse.data.currency || 'KZT';
            } catch (error) {
              console.warn('Не удалось загрузить валюту, используем значение по умолчанию', error);
            }

            // Вычисляем цену: цена = себестоимость + наценка
            const calculatedPrice = costPrice + markup;

            // Получаем storeId
            const storeId = user.storeId || localStorage.getItem('storeId');
            if (storeId) {
              try {
                await api.post('/offers', {
                  productId: newProduct.id,
                  storeId: storeId,
                  price: calculatedPrice,
                  currency: userCurrency,
                  quantity: productData.quantity ?? 0,
                  markup: markup,
                });

                // Перезагружаем все данные, чтобы получить актуальную информацию о товаре
                await loadProductsAndOffers();

                toast.success('Товар создан и цена установлена');
                setShowProductForm(false);
                setEditingProduct(null);
                return;
              } catch (offerError: any) {
                console.error('Ошибка создания Offer с наценкой', offerError);
                const errorMessage = offerError.response?.data?.message || offerError.response?.data?.error || 'Неизвестная ошибка';

                // Перезагружаем данные в любом случае
                await loadProductsAndOffers();

                toast.error(`Товар создан, но не удалось установить цену: ${errorMessage}. Попробуйте установить цену вручную.`);
                setShowProductForm(false);
                setEditingProduct(null);
                return;
              }
            } else {
              await loadProductsAndOffers();
              toast.warning('Товар создан, но не удалось определить магазин для установки цены');
              setShowProductForm(false);
              setEditingProduct(null);
              return;
            }
          } else {
            await loadProductsAndOffers();
            toast.success('Товар создан. Установите цену позже, когда будет известна себестоимость');
            setShowProductForm(false);
            setEditingProduct(null);
            return;
          }
        } catch (error: any) {
          console.error('Ошибка при работе с наценкой', error);
          await loadProductsAndOffers();

          if (error.response?.status === 401) {
            toast.error('Ошибка авторизации. Пожалуйста, обновите страницу и попробуйте снова.');
          } else {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Неизвестная ошибка';
            toast.warning(`Товар создан, но возникла проблема: ${errorMessage}`);
          }

          setShowProductForm(false);
          setEditingProduct(null);
          return;
        }
      }

      // Если наценка не указана, перезагружаем данные и закрываем форму
      await loadProductsAndOffers();
      toast.success('Товар создан');
      setShowProductForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Ошибка создания товара', error);
      toast.error('Не удалось создать товар.');
    }
  };

  const handleDeleteProduct = async (productId: string, offerId?: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
      return false;
    }
    try {
      if (offerId) {
        await api.delete(`/offers/${offerId}`);
        setOffers((prev) => prev.filter((offer) => offer.id !== offerId));
      } else {
        await api.delete(`/products/${productId}`);
        setProducts(products.filter((p) => p.id !== productId));
      }
      return true;
    } catch (error) {
      console.error('Ошибка удаления товара', error);
      toast.error('Не удалось удалить товар.');
      return false;
    }
  };

  const handleUpdateQuantity = (product: Product, newQuantity: number) => {
    if (!product.offerId) {
      toast.error('Нет оффера для обновления количества.');
      return;
    }
    // Обновляем UI сразу (оптимистичное обновление)
    setOffers((prev) => prev.map((offer) => (
      offer.id === product.offerId ? { ...offer, quantity: newQuantity } : offer
    )));

    // Выполняем запрос в фоне без ожидания
    api.put<ApiOffer>(`/offers/${product.offerId}`, {
      quantity: newQuantity,
      isAvailable: product.isAvailable ?? true,
    }).then((response) => {
      const updatedOffer = response.data;
      // Синхронизируем с ответом сервера на случай, если там другие данные
      setOffers((prev) => prev.map((offer) => (
        offer.id === updatedOffer.id ? { ...offer, ...updatedOffer } : offer
      )));
    }).catch((error) => {
      console.error('Ошибка обновления количества', error);
      toast.error('Не удалось обновить количество.');
      // Откатываем изменения при ошибке
      setOffers((prev) => prev.map((offer) => (
        offer.id === product.offerId ? { ...offer, quantity: product.quantity } : offer
      )));
    });
  };

  // Category handlers
  const handleCreateCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      ...category,
    };
    setCategories([...categories, newCategory]);
  };

  const handleEditCategory = (category: Category) => {
    setCategories(categories.map((c) =>
      c.id === category.id ? category : c
    ));
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('Вы уверены, что хотите удалить эту категорию?')) {
      // Delete category and all its children
      const categoriesToDelete = [categoryId];
      const childCategories = categories.filter((c) => c.parentId === categoryId);
      childCategories.forEach((c) => categoriesToDelete.push(c.id));

      setCategories(categories.filter((c) => !categoriesToDelete.includes(c.id)));
    }
  };

  const loadProductsAndOffers = useCallback(async () => {
    if (!user) return;
    setIsLoadingProducts(true);
    try {
      const [categoriesResponse, productsResponse, offersResponse, storesResponse] = await Promise.all([
        api.get<ApiListResponse<ApiCategory>>('/categories'),
        api.get<ApiListResponse<ApiProduct>>('/products'),
        api.get<ApiListResponse<ApiOffer>>('/offers'),
        api.get<ApiListResponse<ApiStore>>('/stores'),
      ]);

      // Для дистрибьютора загружаем количество товаров без себестоимости
      if (user.role === 'distributor') {
        try {
          const distributorProductsResponse = await api.get<{ items?: Array<{ costPrice?: number | null; hasCostPrice?: boolean }> }>('/distributors/me/products');
          const distributorProducts = distributorProductsResponse.data?.items || [];
          const withoutCostPrice = distributorProducts.filter(
            (product) => !product.hasCostPrice && (product.costPrice === undefined || product.costPrice === null)
          ).length;
          setProductsWithoutCostPrice(withoutCostPrice);
        } catch (error) {
          console.error('Ошибка загрузки количества товаров без себестоимости', error);
        }
      }

      console.log('GET /products response', productsResponse.data);
      console.log('GET /offers response', offersResponse.data);

      const loadedCategories = categoriesResponse.data?.items?.map((category) => ({
        id: category.id,
        name: category.name,
      })) ?? [];
      const loadedProducts = productsResponse.data?.items?.map((product) =>
        mapApiProduct(product)
      ) ?? [];
      const loadedOffers = offersResponse.data?.items ?? [];
      const loadedStores = storesResponse.data?.items ?? [];

      const knownProductIds = new Set(loadedProducts.map((product) => product.id));
      const missingProductIds = loadedOffers
        .filter((offer) => !offer.product && offer.productId)
        .map((offer) => offer.productId as string)
        .filter((productId) => !knownProductIds.has(productId));
      const missingProducts = await Promise.all(
        missingProductIds.map((productId) =>
          api.get<ApiProduct>(`/products/${productId}`).then((response) => response.data).catch(() => null)
        )
      );

      const mergedProducts = [
        ...loadedProducts,
        ...missingProducts.filter(Boolean).map((product) => mapApiProduct(product!)),
      ];

      const knownCategoryIds = new Set(loadedCategories.map((category) => category.id));
      const missingCategoryIds = mergedProducts
        .map((product) => product.categoryId)
        .filter((categoryId) => !knownCategoryIds.has(categoryId));
      const missingCategories = await Promise.all(
        missingCategoryIds.map((categoryId) =>
          api.get<ApiCategory>(`/categories/${categoryId}`).then((response) => response.data).catch(() => null)
        )
      );

      setCategories([
        ...loadedCategories,
        ...missingCategories.filter(Boolean).map((category) => ({
          id: category!.id,
          name: category!.name,
        })),
      ]);
      setProducts(mergedProducts);
      setOffers(loadedOffers);
      setStores(loadedStores);
    } catch (error) {
      console.error('Ошибка загрузки данных', error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let isActive = true;
    const loadData = async () => {
      await loadProductsAndOffers();
    };
    loadData();

    // Обновляем количество товаров без себестоимости при событии обновления
    const handleProductsUpdated = () => {
      if (user?.role === 'distributor') {
        loadProductsAndOffers();
      }
    };
    window.addEventListener('productsUpdated', handleProductsUpdated);

    return () => {
      isActive = false;
      window.removeEventListener('productsUpdated', handleProductsUpdated);
    };
  }, [user, loadProductsAndOffers]);

  const storeProducts = useMemo(() => {
    if (!storeId) return [];
    const normalizedStoreId = String(storeId);

    // Используем продукты напрямую, так как API теперь возвращает все данные в /products
    // Включая costPrice, costCurrency, storePrice, storeCurrency, offerQuantity
    // Фильтруем продукты, которые имеют offer для этого магазина (hasOffer: true)
    return products
      .filter((product) => {
        // Проверяем через offers - продукт должен иметь offer для этого магазина
        const productOffer = offers.find(
          (offer) => {
            const rawOfferStoreId =
              offer.storeId ?? (offer as unknown as { store?: { id?: string | number } }).store?.id;
            const offerStoreId = rawOfferStoreId !== undefined && rawOfferStoreId !== null
              ? String(rawOfferStoreId)
              : null;
            return (
              (offer.productId === product.id || offer.product?.id === product.id) &&
              (offerStoreId === normalizedStoreId || offerStoreId === null)
            );
          }
        );
        return !!productOffer;
      })
      .map((product) => {
        // Находим соответствующий offer для получения дополнительных данных
        const productOffer = offers.find(
          (offer) => {
            const rawOfferStoreId =
              offer.storeId ?? (offer as unknown as { store?: { id?: string | number } }).store?.id;
            const offerStoreId = rawOfferStoreId !== undefined && rawOfferStoreId !== null
              ? String(rawOfferStoreId)
              : null;
            return (
              (offer.productId === product.id || offer.product?.id === product.id) &&
              (offerStoreId === normalizedStoreId || offerStoreId === null)
            );
          }
        );

        // costPrice, costCurrency, storePrice, storeCurrency уже должны быть в продукте из API
        // quantity берем из offerQuantity (которое приходит в API) или из offer
        return {
          ...product,
          quantity: productOffer?.quantity ?? product.quantity ?? 0,
          // Убеждаемся, что offerId установлен
          offerId: productOffer?.id ?? product.offerId,
          // Наценка из оффера
          markup: productOffer?.markup ?? product.markup,
        };
      });
  }, [offers, products, storeId]);

  const storesCount = stores.length;

  const defaultAuthedPath =
    user?.role === 'admin' ? '/admin/brands' :
      user?.role === 'distributor' ? '/distributor/stores' :
        user?.role === 'brand' ? '/brand/catalog' :
          user?.role === 'salesRep' ? '/salesrep/analytics' :
            user?.role === 'storeSeller' ? '/store/pos' :
              '/store/inventory';
  const currentView = useMemo(() => {
    if (!user) return 'products';
    const path = location.pathname;
    if (path.startsWith('/admin/brands')) return 'brands';
    if (path.startsWith('/admin/categories')) return 'categories';
    if (path.startsWith('/store/products')) return 'products';
    if (path.startsWith('/store/inventory')) return 'inventory';
    if (path.startsWith('/store/invoice-history')) return 'invoice-history';
    if (path.startsWith('/store/activity-history')) return 'activity-history';
    if (path.startsWith('/store/expenses')) return 'expenses';
    if (path.startsWith('/store/qr-scanner')) return 'qr-scanner';
    if (path.startsWith('/store/pos')) return 'pos';
    if (path.startsWith('/store/sales-history')) return 'sales-history';
    if (path.startsWith('/store/settings')) return 'settings';
    if (path.startsWith('/brand/catalog')) return 'catalog';
    if (path.startsWith('/brand/distributors')) return 'distributors';
    if (path.startsWith('/brand/searchStatistics')) return 'searchStatistics';
    if (path.startsWith('/brand/settings')) return 'settings';
    if (path.startsWith('/distributor/stores')) return 'stores';
    if (path.startsWith('/distributor/salesReps')) return 'salesReps';
    if (path.startsWith('/distributor/products')) return 'products';
    if (path.startsWith('/distributor/requests')) return 'requests';
    if (path.startsWith('/distributor/analytics')) return 'analytics';
    if (path.startsWith('/distributor/aiFAQ')) return 'aiFAQ';
    if (path.startsWith('/distributor/forecast')) return 'forecast';
    if (path.startsWith('/distributor/poorlySelling')) return 'poorlySelling';
    if (path.startsWith('/distributor/history')) return 'history';
    if (path.startsWith('/distributor/settings')) return 'settings';
    if (path.startsWith('/salesrep/chat')) return 'chat';
    if (path.startsWith('/salesrep/history')) return 'history';
    if (path.startsWith('/salesrep/stores')) return 'stores';
    if (path.startsWith('/salesrep/productGroups')) return 'productGroups';
    if (path.startsWith('/salesrep/analytics')) return 'analytics';
    if (path.startsWith('/salesrep/inventory')) return 'inventory';
    if (path.startsWith('/salesrep/expiring')) return 'expiring';
    if (path.startsWith('/salesrep/poorly-selling')) return 'poorlySelling';
    if (path.startsWith('/salesrep/recommendations')) return 'recommendations';
    if (path.startsWith('/salesrep/plan')) return 'plan';
    if (path.startsWith('/salesrep/settings')) return 'settings';
    if (user.role === 'admin') return 'brands';
    if (user.role === 'distributor') return 'stores';
    if (user.role === 'salesRep') return 'analytics';
    if (user.role === 'storeSeller') return 'pos';
    return user.role === 'brand' ? 'catalog' : 'products';
  }, [location.pathname, user]);

  const handleNavigate = (view: string) => {
    if (!user) return;
    if (user.role === 'admin') {
      if (view === 'brands') navigate('/admin/brands');
      if (view === 'categories') navigate('/admin/categories');
      return;
    }
    if (user.role === 'distributor') {
      if (view === 'stores') navigate('/distributor/stores');
      if (view === 'salesReps') navigate('/distributor/salesReps');
      if (view === 'products') navigate('/distributor/products');
      if (view === 'analytics') navigate('/distributor/analytics');
      if (view === 'aiFAQ') navigate('/distributor/aiFAQ');
      if (view === 'forecast') navigate('/distributor/forecast');
      if (view === 'requests') navigate('/distributor/requests');
      if (view === 'poorlySelling') navigate('/distributor/poorlySelling');
      if (view === 'history') navigate('/distributor/history');
      if (view === 'settings') navigate('/distributor/settings');
      return;
    }
    if (user.role === 'brand') {
      if (view === 'catalog') navigate('/brand/catalog');
      if (view === 'distributors') navigate('/brand/distributors');
      if (view === 'searchStatistics') navigate('/brand/searchStatistics');
      if (view === 'settings') navigate('/brand/settings');
      return;
    }
    if (user.role === 'store' || user.role === 'storeSeller') {
      if (view === 'pos') navigate('/store/pos');
      if (view === 'products') navigate('/store/products');
      if (view === 'inventory') navigate('/store/inventory');
      if (view === 'invoice-history') navigate('/store/invoice-history');
      if (view === 'activity-history') navigate('/store/activity-history');
      if (view === 'expenses') navigate('/store/expenses');
      if (view === 'qr-scanner') navigate('/store/qr-scanner');
      if (view === 'sales-history') navigate('/store/sales-history');
      if (view === 'settings') navigate('/store/settings');
      return;
    }
    if (user.role === 'salesRep') {
      if (view === 'analytics') navigate('/salesrep/analytics');
      if (view === 'chat') navigate('/salesrep/chat');
      if (view === 'history') navigate('/salesrep/history');
      if (view === 'stores') navigate('/salesrep/stores');
      if (view === 'productGroups') navigate('/salesrep/productGroups');
      if (view === 'inventory') navigate('/salesrep/inventory');
      if (view === 'expiring') navigate('/salesrep/expiring');
      if (view === 'poorlySelling') navigate('/salesrep/poorly-selling');
      if (view === 'recommendations') navigate('/salesrep/recommendations');
      if (view === 'plan') navigate('/salesrep/plan');
      if (view === 'settings') navigate('/salesrep/settings');
      return;
    }
  };

  if (!user) {
    if (isSessionRestoring) {
      return <div className="p-4 text-sm text-muted-foreground">Восстановление сессии...</div>;
    }
    return (
      <>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <Login
                onLogin={handleLogin}
                onNavigateToRegister={() => navigate('/register/role')}
                showQuickLogins={false}
              />
            }
          />
          <Route
            path="/login/demo"
            element={
              <Login
                onLogin={handleLogin}
                onNavigateToRegister={() => navigate('/register/role')}
                showQuickLogins={true}
              />
            }
          />
          <Route
            path="/register/role"
            element={<RoleSelection onSelectRole={handleRoleSelection} onBack={() => navigate('/login')} />}
          />
          <Route
            path="/register/store"
            element={<StoreRegistration onComplete={handleStoreRegistration} onBack={() => navigate('/register/role')} />}
          />
          <Route
            path="/register/store/demo"
            element={<StoreRegistration isDemo={true} onComplete={handleStoreRegistration} onBack={() => navigate('/register/role')} />}
          />
          <Route
            path="/register/brand"
            element={<BrandRegistration onComplete={handleBrandRegistration} onBack={() => navigate('/register/role')} />}
          />
          <Route
            path="/register/brand/demo"
            element={<BrandRegistration isDemo={true} onComplete={handleBrandRegistration} onBack={() => navigate('/register/role')} />}
          />
          <Route
            path="/register/distributor"
            element={<DistributorRegistration onComplete={handleDistributorRegistration} onBack={() => navigate('/register/role')} />}
          />
          <Route
            path="/register/distributor/demo"
            element={<DistributorRegistration isDemo={true} onComplete={handleDistributorRegistration} onBack={() => navigate('/register/role')} />}
          />
          <Route
            path="/register/salesrep"
            element={<SalesRepRegistration onComplete={async () => {
              toast.success('Регистрация успешна! Войдите в систему.');
              navigate('/login', { replace: true });
            }} onBack={() => navigate('/register/role')} />}
          />
          <Route
            path="/register/salesrep/demo"
            element={<SalesRepRegistration isDemo={true} onComplete={async () => {
              toast.success('Регистрация успешна! Войдите в систему.');
              navigate('/login', { replace: true });
            }} onBack={() => navigate('/register/role')} />}
          />
          <Route
            path="/register/store-seller"
            element={<StoreSellerRegistration onComplete={async () => {
              // После регистрации токены уже сохранены, нужно восстановить сессию
              const storedUserId = localStorage.getItem('userId');
              const accessToken = localStorage.getItem('accessToken');
              if (storedUserId && accessToken) {
                try {
                  const userResponse = await api.get<ApiUser>(`/users/${storedUserId}`);
                  const role = mapApiRoleToUserRole(userResponse.data.role ?? 'STORE_SELLER');
                  setUser({
                    id: userResponse.data.id,
                    email: userResponse.data.email,
                    role,
                    profileComplete: true,
                    firstName: userResponse.data.firstName,
                    lastName: userResponse.data.lastName,
                    storeId: userResponse.data.storeId,
                    isActive: userResponse.data.isActive,
                  });
                  setUserId(userResponse.data.id);
                  if (userResponse.data.storeId) {
                    setStoreId(userResponse.data.storeId);
                    localStorage.setItem('storeId', userResponse.data.storeId);
                    await api.get<ApiStore>(`/stores/${userResponse.data.storeId}`);
                  }
                  localStorage.setItem('userRole', role);
                  navigate('/store/pos', { replace: true });
                } catch (error) {
                  console.error('Ошибка восстановления сессии', error);
                  toast.success('Регистрация успешна! Войдите в систему.');
                  navigate('/login', { replace: true });
                }
              } else {
                toast.success('Регистрация успешна! Войдите в систему.');
                navigate('/login', { replace: true });
              }
            }} onBack={() => navigate('/register/role')} />}
          />
          <Route
            path="/register/store-seller/demo"
            element={<StoreSellerRegistration isDemo={true} onComplete={async () => {
              // После регистрации токены уже сохранены, нужно восстановить сессию
              const storedUserId = localStorage.getItem('userId');
              const accessToken = localStorage.getItem('accessToken');
              if (storedUserId && accessToken) {
                try {
                  const userResponse = await api.get<ApiUser>(`/users/${storedUserId}`);
                  const role = mapApiRoleToUserRole(userResponse.data.role ?? 'STORE_SELLER');
                  setUser({
                    id: userResponse.data.id,
                    email: userResponse.data.email,
                    role,
                    profileComplete: true,
                    firstName: userResponse.data.firstName,
                    lastName: userResponse.data.lastName,
                    storeId: userResponse.data.storeId,
                    isActive: userResponse.data.isActive,
                  });
                  setUserId(userResponse.data.id);
                  if (userResponse.data.storeId) {
                    setStoreId(userResponse.data.storeId);
                    localStorage.setItem('storeId', userResponse.data.storeId);
                    await api.get<ApiStore>(`/stores/${userResponse.data.storeId}`);
                  }
                  localStorage.setItem('userRole', role);
                  navigate('/store/pos', { replace: true });
                } catch (error) {
                  console.error('Ошибка восстановления сессии', error);
                  toast.success('Регистрация успешна! Войдите в систему.');
                  navigate('/login', { replace: true });
                }
              } else {
                toast.success('Регистрация успешна! Войдите в систему.');
                navigate('/login', { replace: true });
              }
            }} onBack={() => navigate('/register/role')} />}
          />
          <Route path="/buyer" element={<BuyerHome />} />
          <Route path="/buyer/wp" element={<WhatsAppChat />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/payment-policy" element={<PaymentPolicy />} />
          <Route path="/consent" element={<Consent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    );
  }

  const uiRole = user.role === 'admin' ? 'admin' : user.role === 'distributor' ? 'distributor' : user.role === 'brand' ? 'brand' : user.role === 'salesRep' ? 'salesRep' : user.role === 'storeSeller' ? 'store' : 'store';

  return (
    <div className="flex min-h-screen md:h-screen bg-background md:overflow-hidden">
      {/* Desktop Sidebar - Hidden on Mobile */}
      {user.role !== 'admin' && (
        <div className="hidden md:block">
          <Sidebar
            role={uiRole as 'store' | 'brand' | 'distributor' | 'salesRep'}
            currentView={currentView}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            userRole={user.role === 'storeSeller' ? 'storeSeller' : user.role === 'store' ? 'store' : undefined}
            productsWithoutCostPrice={user.role === 'distributor' ? productsWithoutCostPrice : 0}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col md:overflow-hidden w-full">
        <TopBar
          userEmail={user.email}
          role={uiRole}
          onLogout={handleLogout}
          firstName={user.firstName}
          lastName={user.lastName}
          middleName={user.middleName}
          userRole={user.role}
        />

        <main className="flex-1 md:overflow-y-auto overflow-x-hidden md:p-6 pb-24 md:pb-6">
          <Routes>
            {user.role === 'admin' ? (
              <>
                <Route
                  path="/admin/brands"
                  element={<BrandModeration />}
                />
                <Route
                  path="/admin/categories"
                  element={<AdminCategoryManagement />}
                />
                <Route path="/admin/*" element={<Navigate to="/admin/brands" replace />} />
              </>
            ) : user.role === 'store' || user.role === 'storeSeller' ? (
              <>
                {user.role === 'store' && (
                  <>
                    <Route
                      path="/store/products"
                      element={
                        <ProductList
                          products={storeProducts}
                          categories={categories}
                          onCreateProduct={handleCreateProduct}
                          isLoading={isLoadingProducts}
                          onMarkupUpdated={loadProductsAndOffers}
                        />
                      }
                    />
                    <Route
                      path="/store/inventory"
                      element={
                        <Inventory
                          products={storeProducts}
                          categories={categories}
                          onUpdateQuantity={handleUpdateQuantity}
                        />
                      }
                    />
                    <Route
                      path="/store/invoice-history"
                      element={<InvoiceHistory />}
                    />
                    <Route
                      path="/store/activity-history"
                      element={<ActivityHistory />}
                    />
                    <Route
                      path="/store/expenses"
                      element={<Expenses />}
                    />
                  </>
                )}
                {user.role === 'storeSeller' && (
                  <>
                    <Route
                      path="/store/pos"
                      element={<POS />}
                    />
                    <Route
                      path="/store/qr-scanner"
                      element={<QRScanner />}
                    />
                    <Route
                      path="/store/sales-history"
                      element={<SalesHistory />}
                    />
                  </>
                )}
                <Route
                  path="/store/settings"
                  element={
                    <AccountSettings
                      userId={user.id}
                      storeId={storeId}
                      role={user.role === 'storeSeller' ? 'storeSeller' : 'store'}
                      onUserUpdated={(updatedUser) => setUser(updatedUser)}
                      onUserDeleted={handleLogout}
                      onStoreDeleted={handleLogout}
                    />
                  }
                />
                <Route
                  path="/store/*"
                  element={
                    <Navigate
                      to={user.role === 'storeSeller' ? '/store/pos' : '/store/inventory'}
                      replace
                    />
                  }
                />
              </>
            ) : user.role === 'distributor' ? (
              <>
                <Route path="/distributor/stores" element={<StoresList />} />
                <Route path="/distributor/salesReps" element={<SalesRepsList />} />
                <Route path="/distributor/products" element={<DistributorProducts />} />
                <Route path="/distributor/analytics" element={<Analytics />} />
                <Route path="/distributor/aiFAQ" element={<AIFAQ />} />
                <Route path="/distributor/forecast" element={<DemandForecast />} />
                <Route path="/distributor/requests" element={<BrandRequests />} />
                <Route path="/distributor/history" element={<DistributorHistory />} />
                <Route path="/distributor/poorlySelling" element={<DistributorPoorlySellingProducts />} />
                <Route
                  path="/distributor/settings"
                  element={
                    <AccountSettings
                      userId={user.id}
                      role="distributor"
                      onUserUpdated={(updatedUser) => setUser(updatedUser)}
                      onUserDeleted={handleLogout}
                    />
                  }
                />
                <Route path="/distributor/*" element={<Navigate to="/distributor/stores" replace />} />
              </>
            ) : user.role === 'brand' ? (
              <>
                <Route
                  path="/brand/catalog"
                  element={
                    <ProductCatalog
                      products={brandProducts}
                      categories={categories}
                      onCreateProduct={handleCreateProduct}
                      onEditProduct={handleEditProduct}
                      isLoading={isLoadingProducts}
                    />
                  }
                />
                <Route path="/brand/distributors" element={<DistributorsList />} />
                <Route path="/brand/searchStatistics" element={<BrandSearchStatistics />} />
                {/* Если бренд случайно попал на store-маршруты (например, по старой ссылке) — перенаправляем в каталог бренда */}
                <Route path="/store/*" element={<Navigate to="/brand/catalog" replace />} />
                <Route
                  path="/brand/settings"
                  element={
                    <AccountSettings
                      userId={user.id}
                      role="brand"
                      onUserUpdated={(updatedUser) => setUser(updatedUser)}
                      onUserDeleted={handleLogout}
                    />
                  }
                />
                <Route path="/brand/*" element={<Navigate to="/brand/catalog" replace />} />
              </>
            ) : user.role === 'salesRep' ? (
              <>
                <Route path="/salesrep/home" element={<SalesRepHome />} />
                <Route path="/salesrep/history" element={<SalesRepHistory />} />
                <Route path="/salesrep/stores" element={<SalesRepStores />} />
                <Route path="/salesrep/productGroups" element={<SalesRepProductGroups />} />
                <Route path="/salesrep/analytics" element={<SalesRepSalesAnalytics />} />
                <Route path="/salesrep/inventory" element={<SalesRepInventory />} />
                <Route path="/salesrep/expiring" element={<SalesRepExpiringProducts />} />
                <Route path="/salesrep/poorly-selling" element={<SalesRepPoorlySellingProducts />} />
                <Route path="/salesrep/plan" element={<SalesRepPlan />} />
                <Route
                  path="/salesrep/settings"
                  element={
                    <AccountSettings
                      userId={user.id}
                      role="salesRep"
                      onUserUpdated={(updatedUser) => setUser(updatedUser)}
                      onUserDeleted={handleLogout}
                    />
                  }
                />
                <Route path="/salesrep/*" element={<Navigate to="/salesrep/analytics" replace />} />
              </>
            ) : null}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/payment-policy" element={<PaymentPolicy />} />
            <Route path="/consent" element={<Consent />} />
            <Route path="/" element={<Navigate to={defaultAuthedPath} replace />} />
            <Route path="*" element={<Navigate to={defaultAuthedPath} replace />} />
          </Routes>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav
          role={uiRole}
          currentView={currentView}
          onNavigate={handleNavigate}
          userEmail={user.email}
          onLogout={handleLogout}
          userRole={user.role === 'storeSeller' ? 'storeSeller' : user.role === 'store' ? 'store' : undefined}
          productsWithoutCostPrice={user.role === 'distributor' ? productsWithoutCostPrice : 0}
        />
      </div>


      {showProductForm && user.role === 'brand' && (
        <BrandProductForm
          product={editingProduct || undefined}
          categories={categories}
          onSave={handleSaveProduct}
          onDelete={async () => {
            if (!editingProduct) return;
            const deleted = await handleDeleteProduct(editingProduct.id);
            if (deleted) {
              setShowProductForm(false);
              setEditingProduct(null);
            }
          }}
          onCancel={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Brand Product Selector Modal */}
      {showBrandProductSelector && (
        <BrandProductSelector
          brandProducts={brandProducts}
          categories={categories}
          existingProducts={storeProducts}
          onAddProduct={handleAddBrandProduct}
          onClose={() => setShowBrandProductSelector(false)}
        />
      )}
    </div>
  );
}