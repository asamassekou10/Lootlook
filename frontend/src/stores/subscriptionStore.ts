/**
 * Subscription & Monetization Store
 * Manages user tiers: Free, Pack Holder, Pro Subscriber
 * Handles scan credits, subscription status, and ad visibility
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// User tier states as defined in the monetization strategy
export type UserTier = "free" | "pack_holder" | "pro_subscriber";

// IAP Product IDs (must match App Store Connect)
export const IAP_PRODUCTS = {
  // Consumable credit packs
  CREDITS_WEEKEND_20: "com.lootlook.credits.weekend20",
  CREDITS_HUNTER_100: "com.lootlook.credits.hunter100",
  // Auto-renewing subscriptions
  SUB_PRO_MONTHLY: "com.lootlook.sub.pro.monthly",
  SUB_PRO_YEARLY: "com.lootlook.sub.pro.yearly",
} as const;

// Product metadata for display
export const PRODUCT_INFO = {
  [IAP_PRODUCTS.CREDITS_WEEKEND_20]: {
    name: "Weekend Pack",
    credits: 20,
    price: "$2.99",
    priceValue: 2.99,
  },
  [IAP_PRODUCTS.CREDITS_HUNTER_100]: {
    name: "Hunter Pack",
    credits: 100,
    price: "$9.99",
    priceValue: 9.99,
  },
  [IAP_PRODUCTS.SUB_PRO_MONTHLY]: {
    name: "Pro Monthly",
    price: "$14.99/month",
    priceValue: 14.99,
    period: "monthly",
  },
  [IAP_PRODUCTS.SUB_PRO_YEARLY]: {
    name: "Pro Yearly",
    price: "$119.99/year",
    priceValue: 119.99,
    period: "yearly",
    savings: "Save 33%",
  },
} as const;

// Free tier constants
const FREE_MONTHLY_SCANS = 5;
const FAIR_USE_CAP = 1500; // Pro subscriber fair use cap

interface SubscriptionState {
  // User tier
  userTier: UserTier;

  // Free tier tracking
  freeScansUsedThisMonth: number;
  freeScansResetDate: string; // ISO date of last reset

  // Pack credits (consumable purchases)
  packCredits: number;

  // Pro subscription
  proSubscriptionActive: boolean;
  proSubscriptionExpiry: string | null;
  proSubscriptionProductId: string | null;

  // Rewarded ad bonus (temporary +1 scan)
  rewardedAdBonusScans: number;

  // Computed getters
  canScan: () => boolean;
  getRemainingFreeScans: () => number;
  shouldShowAds: () => boolean;

  // Actions
  checkAndResetMonthlyScans: () => void;
  consumeScan: () => boolean;
  addPackCredits: (credits: number) => void;
  addRewardedScan: () => void;
  setProSubscription: (active: boolean, productId?: string, expiry?: string) => void;
  restorePurchases: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state - Free tier
      userTier: "free",
      freeScansUsedThisMonth: 0,
      freeScansResetDate: new Date().toISOString(),
      packCredits: 0,
      proSubscriptionActive: false,
      proSubscriptionExpiry: null,
      proSubscriptionProductId: null,
      rewardedAdBonusScans: 0,

      // Check if user can perform a scan
      canScan: () => {
        const state = get();

        // Pro subscribers can always scan (fair use cap)
        if (state.proSubscriptionActive) {
          return true;
        }

        // Pack holders can scan if they have credits
        if (state.packCredits > 0) {
          return true;
        }

        // Free tier can scan if they have remaining monthly scans
        const remainingFree = FREE_MONTHLY_SCANS - state.freeScansUsedThisMonth;
        if (remainingFree > 0) {
          return true;
        }

        // Check for rewarded ad bonus scans
        if (state.rewardedAdBonusScans > 0) {
          return true;
        }

        return false;
      },

      // Get remaining free scans for display
      getRemainingFreeScans: () => {
        const state = get();
        return Math.max(0, FREE_MONTHLY_SCANS - state.freeScansUsedThisMonth);
      },

      // Determine if ads should be shown
      shouldShowAds: () => {
        const state = get();
        // Ads are disabled for pack holders and pro subscribers
        return state.userTier === "free";
      },

      // Check and reset monthly scans on the 1st of each month
      checkAndResetMonthlyScans: () => {
        const state = get();
        const lastReset = new Date(state.freeScansResetDate);
        const now = new Date();

        // Check if we're in a new month
        if (
          now.getMonth() !== lastReset.getMonth() ||
          now.getFullYear() !== lastReset.getFullYear()
        ) {
          set({
            freeScansUsedThisMonth: 0,
            freeScansResetDate: now.toISOString(),
          });
        }
      },

      // Consume a scan credit (called on shutter press)
      consumeScan: () => {
        const state = get();

        // Pro subscribers don't consume credits
        if (state.proSubscriptionActive) {
          return true;
        }

        // Use rewarded bonus first
        if (state.rewardedAdBonusScans > 0) {
          set({ rewardedAdBonusScans: state.rewardedAdBonusScans - 1 });
          return true;
        }

        // Use pack credits second
        if (state.packCredits > 0) {
          set({
            packCredits: state.packCredits - 1,
            userTier: state.packCredits - 1 > 0 ? "pack_holder" : "free",
          });
          return true;
        }

        // Use free monthly scans last
        const remainingFree = FREE_MONTHLY_SCANS - state.freeScansUsedThisMonth;
        if (remainingFree > 0) {
          set({ freeScansUsedThisMonth: state.freeScansUsedThisMonth + 1 });
          return true;
        }

        return false;
      },

      // Add credits from pack purchase
      addPackCredits: (credits: number) => {
        set((state) => ({
          packCredits: state.packCredits + credits,
          userTier: "pack_holder",
        }));
      },

      // Add bonus scan from rewarded ad
      addRewardedScan: () => {
        set((state) => ({
          rewardedAdBonusScans: state.rewardedAdBonusScans + 1,
        }));
      },

      // Set pro subscription status
      setProSubscription: (active: boolean, productId?: string, expiry?: string) => {
        set({
          proSubscriptionActive: active,
          proSubscriptionProductId: productId || null,
          proSubscriptionExpiry: expiry || null,
          userTier: active ? "pro_subscriber" : (get().packCredits > 0 ? "pack_holder" : "free"),
        });
      },

      // Restore purchases (required for App Store compliance)
      restorePurchases: async () => {
        // This will be implemented with react-native-iap
        // For now, it's a placeholder
        console.log("Restoring purchases...");
      },
    }),
    {
      name: "lootlook-subscription",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper to get user tier display info
export function getTierDisplayInfo(tier: UserTier) {
  switch (tier) {
    case "pro_subscriber":
      return {
        name: "Pro",
        color: "#3B82F6",
        icon: "crown",
      };
    case "pack_holder":
      return {
        name: "Pack",
        color: "#10B981",
        icon: "package",
      };
    default:
      return {
        name: "Free",
        color: "#71717A",
        icon: "user",
      };
  }
}
