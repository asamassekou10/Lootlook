/**
 * Ad Service
 * Real Google Mobile Ads (AdMob) integration
 *
 * IMPORTANT: This service requires a development build (expo-dev-client)
 * to work with react-native-google-mobile-ads. In Expo Go, ads will be simulated.
 *
 * For production:
 * 1. Install react-native-google-mobile-ads
 * 2. Configure app.json with your AdMob App ID
 * 3. Create a development build with expo-dev-client
 */

import { Alert, Platform } from "react-native";
import { useSubscriptionStore } from "../stores/subscriptionStore";

// AdMob Ad Unit IDs - Replace with your actual ad unit IDs
const AD_UNIT_IDS = {
  // Test IDs for development (replace with real IDs for production)
  REWARDED_IOS: "ca-app-pub-3940256099942544/1712485313",
  REWARDED_ANDROID: "ca-app-pub-3940256099942544/5224354917",
  NATIVE_IOS: "ca-app-pub-3940256099942544/3986624511",
  NATIVE_ANDROID: "ca-app-pub-3940256099942544/2247696110",
  BANNER_IOS: "ca-app-pub-3940256099942544/2934735716",
  BANNER_ANDROID: "ca-app-pub-3940256099942544/6300978111",
};

// Check if we're in a development build with native modules available
let MobileAds: any = null;
let RewardedAd: any = null;
let RewardedAdEventType: any = null;
let TestIds: any = null;
let isNativeAdsAvailable = false;

// Try to import the native ads module
async function loadNativeAdsModule() {
  try {
    const nativeAds = await import("react-native-google-mobile-ads");
    MobileAds = nativeAds.default;
    RewardedAd = nativeAds.RewardedAd;
    RewardedAdEventType = nativeAds.RewardedAdEventType;
    TestIds = nativeAds.TestIds;
    isNativeAdsAvailable = true;
    console.log("[Ads] Native ads module loaded successfully");
    return true;
  } catch (error) {
    console.log("[Ads] Native ads module not available - using fallback mode");
    isNativeAdsAvailable = false;
    return false;
  }
}

class AdService {
  private initialized = false;
  private rewardedAd: any = null;
  private isRewardedAdLoaded = false;

  /**
   * Initialize the ad service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Try to load native ads module
    const hasNativeAds = await loadNativeAdsModule();

    if (hasNativeAds && MobileAds) {
      try {
        // Initialize Mobile Ads SDK
        await MobileAds().initialize();
        console.log("[Ads] AdMob SDK initialized");

        // Preload rewarded ad
        await this.loadRewardedAd();
      } catch (error) {
        console.error("[Ads] AdMob initialization failed:", error);
      }
    } else {
      console.log("[Ads] Running in fallback mode (Expo Go)");
    }

    this.initialized = true;
  }

  /**
   * Load a rewarded ad
   */
  async loadRewardedAd(): Promise<void> {
    if (!isNativeAdsAvailable || !RewardedAd) {
      // Simulate ad loading in fallback mode
      this.isRewardedAdLoaded = true;
      return;
    }

    try {
      const adUnitId = Platform.select({
        ios: AD_UNIT_IDS.REWARDED_IOS,
        android: AD_UNIT_IDS.REWARDED_ANDROID,
      }) || AD_UNIT_IDS.REWARDED_IOS;

      this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
        keywords: ["collectibles", "antiques", "shopping", "resale"],
      });

      // Set up event listeners
      const unsubscribeLoaded = this.rewardedAd.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          this.isRewardedAdLoaded = true;
          console.log("[Ads] Rewarded ad loaded");
        }
      );

      const unsubscribeEarned = this.rewardedAd.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        (reward: any) => {
          console.log("[Ads] User earned reward:", reward);
          // Reward is granted in showRewardedAd callback
        }
      );

      // Load the ad
      await this.rewardedAd.load();
    } catch (error) {
      console.error("[Ads] Failed to load rewarded ad:", error);
      // Fallback mode
      this.isRewardedAdLoaded = true;
    }
  }

  /**
   * Show rewarded ad and grant +1 scan on completion
   */
  async showRewardedAd(onComplete?: () => void): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    // If native ads are available and we have a loaded ad
    if (isNativeAdsAvailable && this.rewardedAd && this.isRewardedAdLoaded) {
      return new Promise((resolve) => {
        try {
          // Set up close listener
          const unsubscribeClosed = this.rewardedAd.addAdEventListener(
            "closed",
            () => {
              // Grant the reward
              useSubscriptionStore.getState().addRewardedScan();
              console.log("[Ads] Reward granted: +1 scan");

              // Reload for next time
              this.isRewardedAdLoaded = false;
              this.loadRewardedAd();

              if (onComplete) {
                onComplete();
              }
              unsubscribeClosed();
              resolve(true);
            }
          );

          // Show the ad
          this.rewardedAd.show();
        } catch (error) {
          console.error("[Ads] Failed to show rewarded ad:", error);
          resolve(false);
        }
      });
    }

    // Fallback mode - simulate ad with alert
    return new Promise((resolve) => {
      Alert.alert(
        "Watch Video",
        "Watch a short video to earn 1 bonus scan.\n\n(In production, a 15-30 second video ad will play here.)",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: "Watch Ad",
            onPress: () => {
              // Grant the bonus scan
              useSubscriptionStore.getState().addRewardedScan();
              console.log("[Ads] Fallback reward granted: +1 scan");

              if (onComplete) {
                onComplete();
              }
              resolve(true);
            },
          },
        ]
      );
    });
  }

  /**
   * Check if rewarded ad is ready
   */
  isRewardedAdReady(): boolean {
    return this.isRewardedAdLoaded;
  }

  /**
   * Get native ad unit ID
   */
  getNativeAdUnitId(): string {
    return Platform.select({
      ios: AD_UNIT_IDS.NATIVE_IOS,
      android: AD_UNIT_IDS.NATIVE_ANDROID,
    }) || AD_UNIT_IDS.NATIVE_IOS;
  }

  /**
   * Get banner ad unit ID
   */
  getBannerAdUnitId(): string {
    return Platform.select({
      ios: AD_UNIT_IDS.BANNER_IOS,
      android: AD_UNIT_IDS.BANNER_ANDROID,
    }) || AD_UNIT_IDS.BANNER_IOS;
  }

  /**
   * Check if native ads module is available
   */
  isNativeAdsSupported(): boolean {
    return isNativeAdsAvailable;
  }
}

// Singleton instance
export const adService = new AdService();

// Export ad unit IDs for use in native ad components
export { AD_UNIT_IDS };
