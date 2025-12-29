/**
 * Paywall Modal
 * Apple App Store Compliant (Guideline 3.1.2)
 * - Clear price, duration, and auto-renewal disclosure
 * - Restore Purchases button mandatory
 * - Rewarded ad option for +1 scan
 */

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  X,
  Crown,
  Package,
  Play,
  Sparkles,
  Check,
  RefreshCw,
} from "lucide-react-native";
import { colors, typography, spacing, borderRadius } from "../theme";
import {
  useSubscriptionStore,
  IAP_PRODUCTS,
  PRODUCT_INFO,
} from "../stores/subscriptionStore";
import { iapService } from "../services/iapService";

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onWatchAd: () => void;
  onPurchaseComplete: () => void;
}

export function PaywallModal({
  visible,
  onClose,
  onWatchAd,
  onPurchaseComplete,
}: PaywallModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const remainingFreeScans = useSubscriptionStore((s) => s.getRemainingFreeScans());

  const handlePurchaseCredits = async (productId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(productId);

    try {
      const success = await iapService.purchaseCredits(productId);
      if (success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onPurchaseComplete();
      }
    } catch (error) {
      console.error("Purchase failed:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleSubscribe = async (productId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(productId);

    try {
      const success = await iapService.subscribeToPro(productId);
      if (success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onPurchaseComplete();
      }
    } catch (error) {
      console.error("Subscription failed:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleRestorePurchases = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRestoring(true);

    try {
      await iapService.restorePurchases();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Restore failed:", error);
    } finally {
      setRestoring(false);
    }
  };

  const handleWatchAd = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onWatchAd();
  };

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.text.secondary} strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Out of Scans</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <Sparkles size={40} color={colors.accent.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.heroTitle}>Unlock More Scans</Text>
            <Text style={styles.heroSubtitle}>
              You've used all {5 - remainingFreeScans} of your free monthly scans.
              Choose an option below to continue.
            </Text>
          </View>

          {/* Rewarded Ad Option */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QUICK FIX</Text>
            <TouchableOpacity
              style={styles.adCard}
              onPress={handleWatchAd}
              activeOpacity={0.7}
            >
              <View style={styles.adIconContainer}>
                <Play size={24} color={colors.value.positive} strokeWidth={1.5} />
              </View>
              <View style={styles.adContent}>
                <Text style={styles.adTitle}>Watch a Short Video</Text>
                <Text style={styles.adSubtitle}>Get +1 free scan instantly</Text>
              </View>
              <View style={styles.adBadge}>
                <Text style={styles.adBadgeText}>FREE</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Credit Packs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CREDIT PACKS</Text>

            {/* Weekend Pack */}
            <TouchableOpacity
              style={styles.packCard}
              onPress={() => handlePurchaseCredits(IAP_PRODUCTS.CREDITS_WEEKEND_20)}
              activeOpacity={0.7}
              disabled={loading !== null}
            >
              <View style={styles.packIconContainer}>
                <Package size={24} color={colors.value.warning} strokeWidth={1.5} />
              </View>
              <View style={styles.packContent}>
                <Text style={styles.packTitle}>
                  {PRODUCT_INFO[IAP_PRODUCTS.CREDITS_WEEKEND_20].name}
                </Text>
                <Text style={styles.packCredits}>
                  {PRODUCT_INFO[IAP_PRODUCTS.CREDITS_WEEKEND_20].credits} scans
                </Text>
              </View>
              {loading === IAP_PRODUCTS.CREDITS_WEEKEND_20 ? (
                <ActivityIndicator color={colors.accent.primary} />
              ) : (
                <Text style={styles.packPrice}>
                  {PRODUCT_INFO[IAP_PRODUCTS.CREDITS_WEEKEND_20].price}
                </Text>
              )}
            </TouchableOpacity>

            {/* Hunter Pack */}
            <TouchableOpacity
              style={[styles.packCard, styles.packCardPopular]}
              onPress={() => handlePurchaseCredits(IAP_PRODUCTS.CREDITS_HUNTER_100)}
              activeOpacity={0.7}
              disabled={loading !== null}
            >
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>BEST VALUE</Text>
              </View>
              <View style={[styles.packIconContainer, { backgroundColor: `${colors.accent.primary}20` }]}>
                <Package size={24} color={colors.accent.primary} strokeWidth={1.5} />
              </View>
              <View style={styles.packContent}>
                <Text style={styles.packTitle}>
                  {PRODUCT_INFO[IAP_PRODUCTS.CREDITS_HUNTER_100].name}
                </Text>
                <Text style={styles.packCredits}>
                  {PRODUCT_INFO[IAP_PRODUCTS.CREDITS_HUNTER_100].credits} scans
                </Text>
              </View>
              {loading === IAP_PRODUCTS.CREDITS_HUNTER_100 ? (
                <ActivityIndicator color={colors.accent.primary} />
              ) : (
                <Text style={styles.packPrice}>
                  {PRODUCT_INFO[IAP_PRODUCTS.CREDITS_HUNTER_100].price}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Pro Subscription */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>UNLIMITED ACCESS</Text>

            <View style={styles.proCard}>
              <View style={styles.proHeader}>
                <View style={styles.proIconContainer}>
                  <Crown size={28} color={colors.value.warning} strokeWidth={1.5} />
                </View>
                <View>
                  <Text style={styles.proTitle}>LootLook Pro</Text>
                  <Text style={styles.proSubtitle}>Unlimited scans, no ads</Text>
                </View>
              </View>

              <View style={styles.proFeatures}>
                {["Unlimited scans", "No advertisements", "Priority support", "Early access to features"].map(
                  (feature) => (
                    <View key={feature} style={styles.proFeature}>
                      <Check size={16} color={colors.value.positive} strokeWidth={2} />
                      <Text style={styles.proFeatureText}>{feature}</Text>
                    </View>
                  )
                )}
              </View>

              {/* Monthly Option */}
              <TouchableOpacity
                style={styles.subOption}
                onPress={() => handleSubscribe(IAP_PRODUCTS.SUB_PRO_MONTHLY)}
                activeOpacity={0.7}
                disabled={loading !== null}
              >
                <View>
                  <Text style={styles.subOptionTitle}>Monthly</Text>
                  <Text style={styles.subOptionPrice}>
                    {PRODUCT_INFO[IAP_PRODUCTS.SUB_PRO_MONTHLY].price}
                  </Text>
                </View>
                {loading === IAP_PRODUCTS.SUB_PRO_MONTHLY && (
                  <ActivityIndicator color={colors.accent.primary} />
                )}
              </TouchableOpacity>

              {/* Yearly Option */}
              <TouchableOpacity
                style={[styles.subOption, styles.subOptionRecommended]}
                onPress={() => handleSubscribe(IAP_PRODUCTS.SUB_PRO_YEARLY)}
                activeOpacity={0.7}
                disabled={loading !== null}
              >
                <View>
                  <Text style={styles.subOptionTitle}>Yearly</Text>
                  <Text style={styles.subOptionPrice}>
                    {PRODUCT_INFO[IAP_PRODUCTS.SUB_PRO_YEARLY].price}
                  </Text>
                </View>
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsBadgeText}>
                    {PRODUCT_INFO[IAP_PRODUCTS.SUB_PRO_YEARLY].savings}
                  </Text>
                </View>
                {loading === IAP_PRODUCTS.SUB_PRO_YEARLY && (
                  <ActivityIndicator color={colors.accent.primary} />
                )}
              </TouchableOpacity>

              {/* Apple Compliance: Auto-renewal disclosure */}
              <Text style={styles.legalText}>
                Subscriptions auto-renew unless cancelled at least 24 hours before
                the end of the current period. Your Apple ID account will be charged
                for renewal within 24 hours prior to the end of the current period.
                Manage subscriptions in Settings after purchase.
              </Text>
            </View>
          </View>

          {/* Restore Purchases - Required by Apple */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            activeOpacity={0.7}
            disabled={restoring}
          >
            {restoring ? (
              <ActivityIndicator color={colors.text.secondary} size="small" />
            ) : (
              <>
                <RefreshCw size={16} color={colors.text.secondary} strokeWidth={1.5} />
                <Text style={styles.restoreText}>Restore Purchases</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Legal Links */}
          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={() => Linking.openURL("https://lootlook.app/terms")}>
              <Text style={styles.legalLink}>Terms of Use</Text>
            </TouchableOpacity>
            <Text style={styles.legalDivider}>|</Text>
            <TouchableOpacity onPress={() => Linking.openURL("https://lootlook.app/privacy")}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...typography.heading,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  // Hero
  heroSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.accent.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  heroTitle: {
    ...typography.title,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: "center",
  },

  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },

  // Ad Card
  adCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.value.positive}10`,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.value.positive}30`,
  },
  adIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.value.positive}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  adContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  adTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: "600",
  },
  adSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  adBadge: {
    backgroundColor: colors.value.positive,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  adBadgeText: {
    ...typography.caption,
    color: colors.background.primary,
    fontWeight: "700",
  },

  // Pack Cards
  packCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.sm,
  },
  packCardPopular: {
    borderColor: colors.accent.primary,
    position: "relative",
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    right: spacing.md,
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  popularBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "700",
    fontSize: 10,
  },
  packIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.value.warning}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  packContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  packTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: "600",
  },
  packCredits: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  packPrice: {
    ...typography.heading,
    color: colors.accent.primary,
  },

  // Pro Card
  proCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.value.warning,
  },
  proHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  proIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.value.warning}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  proTitle: {
    ...typography.heading,
    color: colors.value.warning,
  },
  proSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  proFeatures: {
    marginBottom: spacing.lg,
  },
  proFeature: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  proFeatureText: {
    ...typography.body,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  subOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  subOptionRecommended: {
    borderColor: colors.accent.primary,
  },
  subOptionTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: "500",
  },
  subOptionPrice: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  savingsBadge: {
    backgroundColor: colors.value.positive,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  savingsBadgeText: {
    ...typography.caption,
    color: colors.background.primary,
    fontWeight: "700",
    fontSize: 10,
  },
  legalText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
    lineHeight: 14,
    marginTop: spacing.md,
  },

  // Restore
  restoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  restoreText: {
    ...typography.body,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },

  // Legal Links
  legalLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  legalLink: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  legalDivider: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginHorizontal: spacing.sm,
  },
});
