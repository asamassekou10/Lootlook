/**
 * Developer Tools
 * Utilities for testing monetization flows during development
 */

import { useSubscriptionStore } from "../stores/subscriptionStore";
import { useOnboardingStore } from "../stores/onboardingStore";

/**
 * Reset all user state for testing
 */
export function resetAllState() {
  // Reset subscription state
  useSubscriptionStore.setState({
    userTier: "free",
    freeScansUsedThisMonth: 0,
    freeScansResetDate: new Date().toISOString(),
    packCredits: 0,
    proSubscriptionActive: false,
    proSubscriptionExpiry: null,
    proSubscriptionProductId: null,
    rewardedAdBonusScans: 0,
  });

  // Reset onboarding state
  useOnboardingStore.setState({
    hasCompletedOnboarding: false,
    hasCameraPermission: false,
    onboardingCompletedAt: null,
  });

  console.log("[DevTools] All state reset");
}

/**
 * Simulate exhausted free scans (triggers paywall on next scan)
 */
export function exhaustFreeScans() {
  useSubscriptionStore.setState({
    freeScansUsedThisMonth: 5,
    packCredits: 0,
    rewardedAdBonusScans: 0,
    proSubscriptionActive: false,
  });
  console.log("[DevTools] Free scans exhausted - paywall will show");
}

/**
 * Simulate Pack Holder tier
 */
export function simulatePackHolder(credits: number = 20) {
  useSubscriptionStore.setState({
    userTier: "pack_holder",
    packCredits: credits,
  });
  console.log(`[DevTools] Now Pack Holder with ${credits} credits`);
}

/**
 * Simulate Pro Subscriber tier
 */
export function simulateProSubscriber() {
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 1);

  useSubscriptionStore.setState({
    userTier: "pro_subscriber",
    proSubscriptionActive: true,
    proSubscriptionExpiry: expiry.toISOString(),
    proSubscriptionProductId: "com.lootlook.sub.pro.monthly",
  });
  console.log("[DevTools] Now Pro Subscriber");
}

/**
 * Simulate Free tier with remaining scans
 */
export function simulateFreeTier(scansUsed: number = 0) {
  useSubscriptionStore.setState({
    userTier: "free",
    freeScansUsedThisMonth: scansUsed,
    packCredits: 0,
    proSubscriptionActive: false,
    rewardedAdBonusScans: 0,
  });
  console.log(`[DevTools] Now Free tier with ${5 - scansUsed}/5 scans remaining`);
}

/**
 * Get current monetization state for debugging
 */
export function getMonetizationDebugInfo() {
  const sub = useSubscriptionStore.getState();
  const onb = useOnboardingStore.getState();

  return {
    tier: sub.userTier,
    freeScansUsed: sub.freeScansUsedThisMonth,
    freeScansRemaining: 5 - sub.freeScansUsedThisMonth,
    packCredits: sub.packCredits,
    rewardedBonusScans: sub.rewardedAdBonusScans,
    proActive: sub.proSubscriptionActive,
    proExpiry: sub.proSubscriptionExpiry,
    canScan: sub.canScan(),
    shouldShowAds: sub.shouldShowAds(),
    hasCompletedOnboarding: onb.hasCompletedOnboarding,
  };
}

// Expose to global for easy console access in development
if (__DEV__) {
  (global as any).DevTools = {
    resetAllState,
    exhaustFreeScans,
    simulatePackHolder,
    simulateProSubscriber,
    simulateFreeTier,
    getMonetizationDebugInfo,
  };

  console.log(
    "[DevTools] Available commands:\n" +
    "  DevTools.resetAllState() - Reset all user state\n" +
    "  DevTools.exhaustFreeScans() - Trigger paywall\n" +
    "  DevTools.simulatePackHolder(credits) - Simulate pack holder\n" +
    "  DevTools.simulateProSubscriber() - Simulate pro subscriber\n" +
    "  DevTools.simulateFreeTier(scansUsed) - Simulate free tier\n" +
    "  DevTools.getMonetizationDebugInfo() - View current state"
  );
}
