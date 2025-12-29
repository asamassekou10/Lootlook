/**
 * In-App Purchase Service
 * Mock implementation for Expo Go development
 *
 * PRODUCTION SETUP:
 * 1. Install expo-in-app-purchases: npx expo install expo-in-app-purchases
 * 2. Create a development build: npx expo prebuild && npx expo run:ios
 * 3. Configure products in App Store Connect
 * 4. Replace mock implementations with real InAppPurchases calls
 *
 * This mock implementation simulates the complete purchase flow
 * so you can test UI and business logic before having real IAP.
 */

import { Alert } from "react-native";
import { IAP_PRODUCTS, PRODUCT_INFO, useSubscriptionStore } from "../stores/subscriptionStore";

class IAPService {
  private initialized = false;

  /**
   * Initialize IAP service (mock)
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    console.log("[IAP] Mock service initialized");
    console.log("[IAP] For real IAP, create a development build with expo-in-app-purchases");
    this.initialized = true;
    return true;
  }

  /**
   * Get product info with static pricing
   */
  getProduct(productId: string): { price: string; title: string } {
    const info = PRODUCT_INFO[productId as keyof typeof PRODUCT_INFO];
    return { price: info?.price || "N/A", title: info?.name || "Unknown" };
  }

  /**
   * Process a successful purchase (internal)
   */
  private processPurchase(productId: string): void {
    const store = useSubscriptionStore.getState();

    switch (productId) {
      case IAP_PRODUCTS.CREDITS_WEEKEND_20:
        store.addPackCredits(20);
        console.log("[IAP] Added 20 credits");
        break;
      case IAP_PRODUCTS.CREDITS_HUNTER_100:
        store.addPackCredits(100);
        console.log("[IAP] Added 100 credits");
        break;
      case IAP_PRODUCTS.SUB_PRO_MONTHLY: {
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1);
        store.setProSubscription(true, productId, expiry.toISOString());
        console.log("[IAP] Pro Monthly subscription activated");
        break;
      }
      case IAP_PRODUCTS.SUB_PRO_YEARLY: {
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
        store.setProSubscription(true, productId, expiry.toISOString());
        console.log("[IAP] Pro Yearly subscription activated");
        break;
      }
    }
  }

  /**
   * Purchase credits (mock - simulates App Store payment sheet)
   */
  async purchaseCredits(productId: string): Promise<boolean> {
    const productInfo = PRODUCT_INFO[productId as keyof typeof PRODUCT_INFO];

    return new Promise((resolve) => {
      Alert.alert(
        "Purchase",
        `${productInfo?.name || "Product"}\n${productInfo?.price || ""}\n\nThis is a simulated purchase. In production, the App Store payment sheet will appear here.`,
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Buy",
            onPress: () => {
              this.processPurchase(productId);
              Alert.alert("Success", `${productInfo?.name} purchased successfully!`);
              resolve(true);
            },
          },
        ]
      );
    });
  }

  /**
   * Subscribe to Pro (mock - simulates App Store subscription sheet)
   */
  async subscribeToPro(productId: string): Promise<boolean> {
    const productInfo = PRODUCT_INFO[productId as keyof typeof PRODUCT_INFO];

    return new Promise((resolve) => {
      Alert.alert(
        "Subscribe to Pro",
        `${productInfo?.name || "Pro"}\n${productInfo?.price || ""}\n\nThis subscription auto-renews. You can cancel anytime in Settings.\n\nThis is a simulated subscription. In production, the App Store subscription sheet will appear.`,
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Subscribe",
            onPress: () => {
              this.processPurchase(productId);
              Alert.alert("Welcome to Pro!", "You now have unlimited scans.");
              resolve(true);
            },
          },
        ]
      );
    });
  }

  /**
   * Restore purchases (App Store compliance - required)
   */
  async restorePurchases(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        "Restore Purchases",
        "This will restore any previous purchases made with your Apple ID.\n\n(Simulated - no actual restore in development mode)",
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Restore",
            onPress: () => {
              // In production, this would check App Store for previous purchases
              Alert.alert("No Purchases Found", "No previous purchases were found for this Apple ID.");
              resolve(true);
            },
          },
        ]
      );
    });
  }

  /**
   * Check if running in native/production mode
   */
  isNativeMode(): boolean {
    return false; // Always mock in Expo Go
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    this.initialized = false;
  }
}

// Singleton instance
export const iapService = new IAPService();
