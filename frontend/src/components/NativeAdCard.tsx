/**
 * Native Ad Card
 * Styled to match Stash list items (per monetization strategy)
 * Appears every 6th item in the list
 *
 * Supports both:
 * - Real native ads via react-native-google-mobile-ads (development build)
 * - Fallback placeholder for Expo Go development
 */

import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from "react-native";
import { Megaphone } from "lucide-react-native";
import { colors, typography, spacing, borderRadius } from "../theme";
import { adService } from "../services/adService";

interface NativeAdCardProps {
  index: number;
}

// Try to load native ads component
let NativeAdView: any = null;
let NativeAsset: any = null;
let isNativeAdsAvailable = false;

async function loadNativeAdComponents() {
  try {
    const nativeAds = await import("react-native-google-mobile-ads");
    // Note: Native ads have specific components - this is a simplified approach
    isNativeAdsAvailable = true;
    return true;
  } catch {
    return false;
  }
}

// Initialize on module load
loadNativeAdComponents();

export function NativeAdCard({ index }: NativeAdCardProps) {
  const [adData, setAdData] = useState<{
    headline: string;
    advertiser: string;
    icon?: string;
    callToAction: string;
  } | null>(null);

  useEffect(() => {
    // In a real implementation with react-native-google-mobile-ads,
    // you would load native ad data here
    if (isNativeAdsAvailable) {
      // Load real native ad
      // This is a placeholder for the actual implementation
    }
  }, []);

  // Fallback placeholder for Expo Go / when native ads aren't available
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Megaphone size={24} color={colors.text.tertiary} strokeWidth={1.5} />
        </View>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={styles.headline} numberOfLines={1}>
                {adData?.headline || "Sponsored Content"}
              </Text>
              <Text style={styles.advertiser} numberOfLines={1}>
                {adData?.advertiser || "Ad Placeholder"}
              </Text>
            </View>
            <View style={styles.adBadge}>
              <Text style={styles.adBadgeText}>AD</Text>
            </View>
          </View>
          <View style={styles.footer}>
            <Text style={styles.cta}>
              {adData?.callToAction || "Learn More"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Real Native Ad Card Component
 * Use this when you have react-native-google-mobile-ads installed
 * in a development build
 */
export function RealNativeAdCard({ index }: NativeAdCardProps) {
  // This would be implemented with the actual NativeAdView from
  // react-native-google-mobile-ads. Example structure:
  //
  // return (
  //   <NativeAdView
  //     adUnitId={adService.getNativeAdUnitId()}
  //     onNativeAdLoaded={(ad) => console.log('Native ad loaded:', ad)}
  //     onAdFailedToLoad={(error) => console.log('Native ad failed:', error)}
  //   >
  //     <View style={styles.card}>
  //       <NativeAsset assetType="icon">
  //         <Image style={styles.imageContainer} />
  //       </NativeAsset>
  //       <View style={styles.content}>
  //         <NativeAsset assetType="headline">
  //           <Text style={styles.headline} />
  //         </NativeAsset>
  //         <NativeAsset assetType="advertiser">
  //           <Text style={styles.advertiser} />
  //         </NativeAsset>
  //         <NativeAsset assetType="callToAction">
  //           <Text style={styles.cta} />
  //         </NativeAsset>
  //       </View>
  //     </View>
  //   </NativeAdView>
  // );

  // For now, return the fallback
  return <NativeAdCard index={index} />;
}

/**
 * Helper function to determine if an index should show an ad
 * Inserts ad after every 6th item per monetization strategy
 */
export function shouldShowAdAtIndex(index: number): boolean {
  // Show ad after every 6 items (index 5, 11, 17, etc.)
  return (index + 1) % 6 === 0 && index > 0;
}

/**
 * Convert list index to actual item index accounting for ads
 */
export function getActualItemIndex(displayIndex: number): number {
  // Calculate how many ads have been inserted before this index
  const adsBeforeIndex = Math.floor(displayIndex / 7);
  return displayIndex - adsBeforeIndex;
}

/**
 * Check if native ads are supported in current environment
 */
export function isNativeAdsSupported(): boolean {
  return isNativeAdsAvailable;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderStyle: "dashed",
    opacity: 0.7,
  },
  imageContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.background.elevated,
    justifyContent: "center",
    alignItems: "center",
  },
  adImage: {
    width: 80,
    height: 80,
    resizeMode: "cover",
  },
  content: {
    flex: 1,
    padding: spacing.md,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headline: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  advertiser: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  adBadge: {
    backgroundColor: colors.value.warning,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  adBadgeText: {
    ...typography.caption,
    color: colors.background.primary,
    fontWeight: "700",
    fontSize: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cta: {
    ...typography.caption,
    color: colors.accent.primary,
    fontWeight: "600",
  },
});
