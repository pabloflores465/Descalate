import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

export const DONATION_PRODUCT_IDS = {
  DONATE_1: 'donate_1_usd',
  DONATE_5: 'donate_5_usd',
  DONATE_10: 'donate_10_usd',
} as const;

export type DonationProductId = (typeof DONATION_PRODUCT_IDS)[keyof typeof DONATION_PRODUCT_IDS];

export interface DonationProduct {
  productId: string;
  price: string;
  title: string;
  description: string;
  localizedPrice: string;
}

// Check if we're running in Expo Go (where native modules are not available)
const isExpoGo = Constants.appOwnership === 'expo';

let isConnected = false;
let purchaseUpdateSubscription: { remove: () => void } | null = null;
let purchaseErrorSubscription: { remove: () => void } | null = null;

export function isIapAvailable(): boolean {
  // IAP is not available in Expo Go
  if (isExpoGo) return false;

  // Check if native module exists
  return !!NativeModules.ExpoIap;
}

// Lazy load expo-iap only when needed and available
function getExpoIap(): typeof import('expo-iap') | null {
  if (!isIapAvailable()) return null;

  try {
    return require('expo-iap');
  } catch {
    return null;
  }
}

export async function connectToStore(): Promise<boolean> {
  const ExpoIap = getExpoIap();
  if (!ExpoIap) return false;
  if (isConnected) return true;

  try {
    await ExpoIap.initConnection();
    isConnected = true;
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Failed to connect to store:', message);
    return false;
  }
}

export async function disconnectFromStore(): Promise<void> {
  const ExpoIap = getExpoIap();
  if (!ExpoIap) return;
  if (!isConnected) return;

  try {
    if (purchaseUpdateSubscription) {
      purchaseUpdateSubscription.remove();
      purchaseUpdateSubscription = null;
    }
    if (purchaseErrorSubscription) {
      purchaseErrorSubscription.remove();
      purchaseErrorSubscription = null;
    }
    await ExpoIap.endConnection();
    isConnected = false;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Failed to disconnect from store:', message);
  }
}

export async function getDonationProducts(): Promise<DonationProduct[]> {
  const ExpoIap = getExpoIap();
  if (!ExpoIap) return [];

  try {
    const connected = await connectToStore();
    if (!connected) return [];

    const productIds = Object.values(DONATION_PRODUCT_IDS);
    const products = await ExpoIap.fetchProducts({
      skus: productIds,
      type: 'in-app',
    });

    if (!products) return [];

    return products.map((product) => ({
      productId: product.id,
      price: String(product.price ?? '0'),
      title: product.title || '',
      description: product.description || '',
      localizedPrice: product.displayPrice || String(product.price ?? '$0.00'),
    }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Failed to get donation products:', message);
    return [];
  }
}

export async function purchaseDonation(
  productId: string,
  onSuccess?: (purchase: unknown) => void,
  onError?: (error: unknown) => void
): Promise<boolean> {
  const ExpoIap = getExpoIap();
  if (!ExpoIap) {
    throw new Error('In-app purchases not available');
  }

  try {
    const connected = await connectToStore();
    if (!connected) {
      throw new Error('Not connected to store');
    }

    // Set up listeners for purchase result
    purchaseUpdateSubscription = ExpoIap.purchaseUpdatedListener(async (purchase) => {
      if (purchase.productId === productId) {
        // Finish the transaction for consumable products
        try {
          await ExpoIap!.finishTransaction({
            purchase,
            isConsumable: true,
          });
          onSuccess?.(purchase);
        } catch (finishError) {
          console.warn('Failed to finish transaction:', finishError);
        }
      }
    });

    purchaseErrorSubscription = ExpoIap.purchaseErrorListener((error) => {
      onError?.(error);
    });

    // Request the purchase
    if (Platform.OS === 'android') {
      await ExpoIap.requestPurchase({
        request: {
          android: {
            skus: [productId],
          },
        },
        type: 'in-app',
      });
    } else {
      await ExpoIap.requestPurchase({
        request: {
          ios: {
            sku: productId,
          },
        },
        type: 'in-app',
      });
    }

    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // User cancelled the purchase
    if (message.includes('cancelled') || message.includes('canceled') || message.includes('user-cancelled')) {
      return false;
    }

    throw error;
  }
}

export function formatDonationAmount(amount: number): string {
  return `$${amount.toFixed(2)} USD`;
}
