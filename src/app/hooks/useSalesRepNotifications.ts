import { useEffect, useRef } from 'react';
import api from '../api/axios';
import { toast } from 'sonner';

interface ExpiringProduct {
  offerId: string;
  storeId: string;
  storeName: string;
  productName: string;
  sku: string;
  quantity: number;
  expiryDate: string;
  daysLeft: number;
}

interface InventoryItem {
  id: string;
  productName: string;
  sku: string;
  storeName: string;
  storeId: string;
  currentStock: number;
}

interface NotificationData {
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Хук для проверки и создания уведомлений для торгового представителя
 * Проверяет:
 * - Товары с истекающим сроком (3 дня или меньше)
 * - Товары с низкими остатками (<= 10)
 */
export function useSalesRepNotifications() {
  const lastCheckRef = useRef<Date | null>(null);
  const createdNotificationsRef = useRef<Set<string>>(new Set());

  // Функция для проверки существующих уведомлений
  const checkExistingNotification = async (type: string, metadata?: Record<string, any>): Promise<boolean> => {
    try {
      const response = await api.get<{ items: Array<{ type: string; metadata?: Record<string, any>; createdAt: string }> }>(
        '/notifications',
        {
          params: {
            limit: 50,
            offset: 0,
          },
        }
      );

      const notifications = response.data?.items || [];
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Проверяем, есть ли похожее уведомление за последние 24 часа
      return notifications.some((notif) => {
        if (notif.type !== type) return false;
        
        const notifDate = new Date(notif.createdAt);
        if (notifDate < oneDayAgo) return false;

        // Если есть metadata, сравниваем ключевые поля
        if (metadata && notif.metadata) {
          // Для expiring_products сравниваем storeId и daysLeft
          if (type === 'expiring_products') {
            return (
              notif.metadata.storeId === metadata.storeId &&
              notif.metadata.daysLeft === metadata.daysLeft
            );
          }
          // Для low_stock сравниваем storeId
          if (type === 'low_stock') {
            return notif.metadata.storeId === metadata.storeId;
          }
        }

        return true;
      });
    } catch (error) {
      console.error('Ошибка проверки существующих уведомлений', error);
      return false;
    }
  };

  // Функция для создания уведомления через API
  const createNotification = async (notification: NotificationData) => {
    try {
      // Создаем уникальный ключ для предотвращения дублирования в рамках сессии
      const notificationKey = `${notification.type}-${JSON.stringify(notification.metadata || {})}`;
      
      // Проверяем, не создавали ли мы уже такое уведомление в этой сессии
      if (createdNotificationsRef.current.has(notificationKey)) {
        return;
      }

      // Проверяем, нет ли похожего уведомления на сервере
      const exists = await checkExistingNotification(notification.type, notification.metadata);
      if (exists) {
        // Помечаем как созданное, чтобы не проверять снова
        createdNotificationsRef.current.add(notificationKey);
        return;
      }

      await api.post('/notifications', notification);
      createdNotificationsRef.current.add(notificationKey);
    } catch (error: any) {
      console.error('Ошибка создания уведомления', error);
      // Не показываем ошибку пользователю, чтобы не мешать работе
    }
  };

  // Проверка товаров с истекающим сроком (3 дня или меньше)
  const checkExpiringProducts = async () => {
    try {
      const response = await api.get<{ items: ExpiringProduct[]; total: number }>(
        '/sales-reps/expiring-products',
        {
          params: {
            warningDays: 3, // Проверяем товары с истекающим сроком в течение 3 дней
          },
        }
      );

      const expiringProducts = response.data?.items || [];
      
      // Фильтруем только товары с 3 днями или меньше
      const urgentProducts = expiringProducts.filter(
        (product) => product.daysLeft <= 3 && product.daysLeft >= 0
      );

      if (urgentProducts.length > 0) {
        // Группируем по магазинам для более информативных уведомлений
        const productsByStore = new Map<string, ExpiringProduct[]>();
        
        urgentProducts.forEach((product) => {
          const storeKey = product.storeId;
          if (!productsByStore.has(storeKey)) {
            productsByStore.set(storeKey, []);
          }
          productsByStore.get(storeKey)!.push(product);
        });

        // Создаем уведомление для каждого магазина или одно общее
        if (productsByStore.size === 1) {
          // Один магазин - детальное уведомление
          const [storeId, products] = Array.from(productsByStore.entries())[0];
          const productNames = products
            .slice(0, 3)
            .map((p) => p.productName)
            .join(', ');
          const moreText = products.length > 3 ? ` и еще ${products.length - 3}` : '';

          await createNotification({
            type: 'expiring_products',
            title: 'Товары с истекающим сроком',
            message: `В магазине "${products[0].storeName}" у ${products.length} товар${products.length > 1 ? 'ов' : 'а'} истекает срок в течение 3 дней: ${productNames}${moreText}`,
            metadata: {
              storeId,
              storeName: products[0].storeName,
              count: products.length,
              daysLeft: Math.min(...products.map((p) => p.daysLeft)),
            },
          });
        } else {
          // Несколько магазинов - общее уведомление
          await createNotification({
            type: 'expiring_products',
            title: 'Товары с истекающим сроком',
            message: `У ${urgentProducts.length} товар${urgentProducts.length > 1 ? 'ов' : 'а'} в ${productsByStore.size} магазин${productsByStore.size > 1 ? 'ах' : 'е'} истекает срок в течение 3 дней`,
            metadata: {
              totalCount: urgentProducts.length,
              storesCount: productsByStore.size,
            },
          });
        }
      }
    } catch (error: any) {
      console.error('Ошибка проверки товаров с истекающим сроком', error);
    }
  };

  // Проверка товаров с низкими остатками (<= 10)
  const checkLowStockProducts = async () => {
    try {
      const response = await api.get<{ items: any[] }>('/sales-reps/stock-control');
      const inventoryItems = response.data?.items || [];

      // Фильтруем товары с остатками <= 10
      const lowStockItems = inventoryItems
        .map((item) => {
          const currentStock = item.currentStock ?? item.stock ?? item.quantity ?? 0;
          return {
            id: item.id ?? `${item.storeId}-${item.sku}`,
            productName: item.productName ?? item.product?.name ?? '',
            sku: item.sku ?? item.product?.sku ?? '',
            storeName: item.storeName ?? item.store?.name ?? '',
            storeId: item.storeId ?? item.store?.id ?? '',
            currentStock,
          } as InventoryItem;
        })
        .filter((item) => item.currentStock > 0 && item.currentStock <= 10 && item.productName);

      if (lowStockItems.length > 0) {
        // Группируем по магазинам
        const itemsByStore = new Map<string, InventoryItem[]>();
        
        lowStockItems.forEach((item) => {
          const storeKey = item.storeId;
          if (!itemsByStore.has(storeKey)) {
            itemsByStore.set(storeKey, []);
          }
          itemsByStore.get(storeKey)!.push(item);
        });

        // Создаем уведомление
        if (itemsByStore.size === 1) {
          // Один магазин - детальное уведомление
          const [storeId, items] = Array.from(itemsByStore.entries())[0];
          const productNames = items
            .slice(0, 3)
            .map((item) => `${item.productName} (остаток: ${item.currentStock})`)
            .join(', ');
          const moreText = items.length > 3 ? ` и еще ${items.length - 3}` : '';

          await createNotification({
            type: 'low_stock',
            title: 'Низкие остатки товаров',
            message: `В магазине "${items[0].storeName}" у ${items.length} товар${items.length > 1 ? 'ов' : 'а'} остаток ${items.length > 1 ? 'составляет' : 'составляет'} 10 единиц или меньше: ${productNames}${moreText}`,
            metadata: {
              storeId,
              storeName: items[0].storeName,
              count: items.length,
            },
          });
        } else {
          // Несколько магазинов - общее уведомление
          await createNotification({
            type: 'low_stock',
            title: 'Низкие остатки товаров',
            message: `У ${lowStockItems.length} товар${lowStockItems.length > 1 ? 'ов' : 'а'} в ${itemsByStore.size} магазин${itemsByStore.size > 1 ? 'ах' : 'е'} остаток составляет 10 единиц или меньше`,
            metadata: {
              totalCount: lowStockItems.length,
              storesCount: itemsByStore.size,
            },
          });
        }
      }
    } catch (error: any) {
      console.error('Ошибка проверки остатков товаров', error);
    }
  };

  // Основная функция проверки
  const checkNotifications = async () => {
    const now = new Date();
    
    // Проверяем не чаще, чем раз в 5 минут
    if (lastCheckRef.current) {
      const timeSinceLastCheck = now.getTime() - lastCheckRef.current.getTime();
      if (timeSinceLastCheck < 5 * 60 * 1000) {
        return;
      }
    }

    lastCheckRef.current = now;

    // Очищаем старые уведомления из кэша (старше 1 часа)
    const oneHourAgo = now.getTime() - 60 * 60 * 1000;
    // В реальности нужно было бы хранить время создания, но для простоты просто ограничим размер Set
    if (createdNotificationsRef.current.size > 100) {
      createdNotificationsRef.current.clear();
    }

    await Promise.all([
      checkExpiringProducts(),
      checkLowStockProducts(),
    ]);
  };

  // Запускаем проверку при монтировании и периодически
  useEffect(() => {
    // Первая проверка через 2 секунды после монтирования
    const initialTimeout = setTimeout(() => {
      checkNotifications();
    }, 2000);

    // Периодическая проверка каждые 10 минут
    const interval = setInterval(() => {
      checkNotifications();
    }, 10 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return {
    checkNotifications,
  };
}
