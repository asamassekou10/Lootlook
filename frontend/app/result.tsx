/**
 * Valuation Sheet - Premium result display
 * Editorial layout with hero pricing and market intelligence
 */

import { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  Share,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import {
  ChevronLeft,
  Plus,
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  ShieldCheck,
} from "lucide-react-native";
import { useStashStore } from "../src/stores/stashStore";
import { LootAnalysisResponse, RarityScore } from "../src/types/loot";
import { colors, typography, spacing, borderRadius } from "../src/theme";

const DEMAND_CONFIG: Record<string, { icon: typeof TrendingUp; color: string; label: string }> = {
  High: { icon: TrendingUp, color: colors.value.positive, label: "High Demand" },
  Medium: { icon: Minus, color: colors.value.warning, label: "Moderate" },
  Low: { icon: TrendingDown, color: colors.text.tertiary, label: "Low Demand" },
};

const RARITY_COLORS: Record<RarityScore, string> = {
  Common: colors.text.tertiary,
  Uncommon: colors.value.positive,
  Rare: colors.accent.primary,
  Epic: "#A855F7",
  Legendary: colors.value.warning,
  Unknown: colors.text.tertiary,
};

export default function ResultScreen() {
  const params = useLocalSearchParams<{ imageUri: string; result: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addItem = useStashStore((state) => state.addItem);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const priceScale = useRef(new Animated.Value(0.9)).current;

  const imageUri = params.imageUri || "";
  const result: LootAnalysisResponse = params.result
    ? JSON.parse(params.result)
    : null;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(priceScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!result) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No result data available</Text>
      </View>
    );
  }

  const rarityColor = RARITY_COLORS[result.rarity_score] || RARITY_COLORS.Unknown;
  const confidencePercent = Math.round(result.confidence_score * 100);
  const demandLevel = result.market_demand || "Medium";
  const demandConfig = DEMAND_CONFIG[demandLevel] || DEMAND_CONFIG.Medium;
  const DemandIcon = demandConfig.icon;

  const handleAddToPortfolio = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addItem(result, imageUri);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${result.item_name}\nEstimated Value: ${result.estimated_value}\n\nValued with LootLook`,
      });
    } catch (error) {
      // Silently fail
    }
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Hero Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} />

        {/* Gradient overlay */}
        <View style={styles.imageGradient} />

        {/* Back button */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + spacing.sm }]}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <BlurView intensity={40} tint="dark" style={styles.backButtonBlur}>
            <ChevronLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
          </BlurView>
        </TouchableOpacity>

        {/* Rarity badge */}
        <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
          <Text style={styles.rarityText}>{result.rarity_score.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.mainContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Item Header */}
          <View style={styles.itemHeader}>
            <Text style={styles.category}>{result.category}</Text>
            <Text style={styles.itemName}>{result.item_name}</Text>
          </View>

          {/* Hero Price */}
          <Animated.View
            style={[
              styles.priceContainer,
              { transform: [{ scale: priceScale }] },
            ]}
          >
            <Text style={styles.priceLabel}>ESTIMATED VALUE</Text>
            <Text style={styles.priceValue}>{result.estimated_value}</Text>
          </Animated.View>

          {/* Market Indicators */}
          <View style={styles.indicatorsRow}>
            {/* Market Demand */}
            <View style={styles.indicator}>
              <View style={[styles.indicatorIcon, { backgroundColor: `${demandConfig.color}15` }]}>
                <DemandIcon size={18} color={demandConfig.color} strokeWidth={1.5} />
              </View>
              <View>
                <Text style={styles.indicatorLabel}>Market</Text>
                <Text style={[styles.indicatorValue, { color: demandConfig.color }]}>
                  {demandConfig.label}
                </Text>
              </View>
            </View>

            {/* Confidence */}
            <View style={styles.indicator}>
              <View style={[styles.indicatorIcon, { backgroundColor: `${colors.accent.primary}15` }]}>
                <ShieldCheck size={18} color={colors.accent.primary} strokeWidth={1.5} />
              </View>
              <View>
                <Text style={styles.indicatorLabel}>Confidence</Text>
                <Text style={[styles.indicatorValue, { color: colors.accent.primary }]}>
                  {confidencePercent}%
                </Text>
              </View>
            </View>

            {/* Sources */}
            <View style={styles.indicator}>
              <View style={[styles.indicatorIcon, { backgroundColor: `${colors.text.secondary}15` }]}>
                <BarChart3 size={18} color={colors.text.secondary} strokeWidth={1.5} />
              </View>
              <View>
                <Text style={styles.indicatorLabel}>Sources</Text>
                <Text style={styles.indicatorValue}>
                  {result.source_count || 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Confidence Bar */}
          <View style={styles.confidenceSection}>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceFill,
                  { width: `${confidencePercent}%` },
                ]}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionLabel}>ANALYSIS</Text>
            <Text style={styles.descriptionText}>{result.description}</Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.actionsContainer, { paddingBottom: insets.bottom + spacing.md }]}>
        <BlurView intensity={80} tint="dark" style={styles.actionsBlur}>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Share2 size={20} color={colors.text.secondary} strokeWidth={1.5} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryAction}
            onPress={handleAddToPortfolio}
            activeOpacity={0.8}
          >
            <Plus size={20} color={colors.background.primary} strokeWidth={2} />
            <Text style={styles.primaryActionText}>Add to Portfolio</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  errorText: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: "center",
    marginTop: 40,
  },

  // Image Section
  imageContainer: {
    height: 280,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.background.secondary,
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: "transparent",
    // Gradient effect via shadow
  },
  backButton: {
    position: "absolute",
    left: spacing.md,
    zIndex: 10,
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  rarityBadge: {
    position: "absolute",
    top: 60,
    right: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  rarityText: {
    ...typography.caption,
    color: colors.background.primary,
    fontWeight: "600",
    letterSpacing: 1,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  mainContent: {
    gap: spacing.lg,
  },

  // Item Header
  itemHeader: {
    gap: spacing.xs,
  },
  category: {
    ...typography.caption,
    color: colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  itemName: {
    ...typography.title,
    color: colors.text.primary,
  },

  // Price
  priceContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  priceLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  priceValue: {
    ...typography.hero,
    color: colors.value.positive,
  },

  // Indicators
  indicatorsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  indicatorIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  indicatorLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  indicatorValue: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: "500",
  },

  // Confidence
  confidenceSection: {
    gap: spacing.sm,
  },
  confidenceBar: {
    height: 3,
    backgroundColor: colors.border.subtle,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  confidenceFill: {
    height: 3,
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.full,
  },

  // Description
  descriptionSection: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    letterSpacing: 1,
  },
  descriptionText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },

  // Actions
  actionsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionsBlur: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: colors.border.subtle,
  },
  secondaryAction: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.elevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  primaryAction: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  primaryActionText: {
    ...typography.button,
    color: colors.background.primary,
  },
});
