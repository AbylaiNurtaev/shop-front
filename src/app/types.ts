export type UserRole =
  | 'store'        // Магазин
  | 'brand'        // Бренд
  | 'buyer'        // Покупатель (если останется)
  | 'admin'        // Администратор
  | 'distributor'  // Дистрибьютор
  | 'salesRep'     // Торговый представитель
  | 'storeSeller'; // Продавец магазина

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profileComplete: boolean;
  firstName?: string;
  lastName?: string;
  storeId?: string;
  brandId?: string;
  brandName?: string;
  distributorId?: string;
  isActive?: boolean;
  logoUrl?: string;
}

export interface StoreProfile {
  firstName?: string;
  lastName?: string;
  password: string;
  storeName: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  description?: string;
  locationLink: string;
  logoFile?: File | null;
  logoUrl?: string;
}

export interface BrandProfile {
  // Регистрация бренда (владелец бренда + данные бренда)
  name: string;
  country: string;
  categoryId: string;
  email: string;
  password: string;
  logoFile?: File | null;
  logoUrl?: string;
}

export interface DistributorProfile {
  // Регистрация дистрибьютора
  companyName: string;
  country: string;
  city: string;
  email: string;
  password: string;
  verificationCode: string;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
}

export interface Brand {
  id: string;
  name: string;
  country: string;
  categoryId: string;
  logoUrl?: string;
  isAccepted?: boolean;
  rejectedReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  sku: string;
  quantity: number;
  weight: string;
  volume: string;
  unitsPerBox: number;
  createdBy: 'store' | 'brand';
  brandName?: string;
  brandId?: string;
  images?: string[];
  offerId?: string;
  storeId?: string;
  price?: number;
  currency?: string;
  isAvailable?: boolean;
  // Дополнительные поля для бренда
  packageInfo?: string;
  unit?: string;
  storageLife?: string;
  productionDate?: string; // ISO-строка
  allergens?: string | string[];
  ageRestrictions?: string;
  // Поля оплаты
  isPayed?: boolean;
  paymentDate?: string; // ISO-строка
  paymentExpiresAt?: string; // ISO-строка
  // Себестоимость от дистрибьютора
  costPrice?: number;
  costCurrency?: string;
  // Цена магазина
  storePrice?: number;
  storeCurrency?: string;
}
