/**
 * Portfolio Dashboard - Asset collection view
 * Data-driven layout with portfolio metrics and holdings list
 */

import { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  TrendingUp,
  Package,
  Scan,
  Trash2,
} from "lucide-react-native";
import { useStashStore } from "../../src/stores/stashStore";
import { StashItem, RarityScore } from "../../src/types/loot";
import { colors, typography, spacing, borderRadius } from "../../src/theme";

const RARITY_COLORS: Record<RarityScore, string> = {
  Common: colors.text.tertiary,
  Uncommon: colors.value.positive,
  Rare: colors.accent.primary,
  Epic: "#A855F7",
  Legendary: colors.value.warning,
  Unknown: colors.text.tertiary,
};

function PortfolioCard({
  item,
  onRemove,
  index,
}: {
  item: StashItem;
  onRemove: () => void;
  index: number;
}) {
  const rarityColor = RARITY_COLORS[item.scan.rarity_score] || RARITY_COLORS.Unknown;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleLongPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Remove from Portfolio",
      `Remove "${item.scan.item_name}" from your portfolio?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onRemove();
          },
        },
      ]
    );
  };

  // Parse the estimated value to get numeric value
  const parseValue = (value: string): number => {
    const match = value.match(/[\d,]+\.?\d*/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ""));
    }
    return 0;
  };

  const numericValue = parseValue(item.scan.estimated_value);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        delayLongPress={300}
      >
        <Image source={{ uri: item.imageUri }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleSection}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.scan.item_name}
              </Text>
              <Text style={styles.category}>{item.scan.category}</Text>
            </View>
            <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.value}>{item.scan.estimated_value}</Text>
            <Text style={styles.dateAdded}>
              {new Date(item.addedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function EmptyPortfolio() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Package size={48} color={colors.text.tertiary} strokeWidth={1} />
      </View>
      <Text style={styles.emptyTitle}>No Assets Yet</Text>
      <Text style={styles.emptyText}>
        Scan items to add them to your portfolio
      </Text>
    </View>
  );
}

export default function StashScreen() {
  const { items, stats, removeItem } = useStashStore();
  const insets = useSafeAreaInsets();

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${Math.round(value).toLocaleString()}`;
  };

  const formatCompactValue = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.screenTitle}>Portfolio</Text>
      </View>

      {/* Portfolio Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.totalValueSection}>
          <Text style={styles.totalLabel}>TOTAL VALUE</Text>
          <Text style={styles.totalValue}>
            {formatValue(stats.totalLootValue)}
          </Text>
          <View style={styles.changeIndicator}>
            <TrendingUp size={14} color={colors.value.positive} strokeWidth={1.5} />
            <Text style={styles.changeText}>Portfolio</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <View style={[styles.metricIcon, { backgroundColor: `${colors.accent.primary}15` }]}>
              <Package size={16} color={colors.accent.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.metricValue}>{stats.stashCount}</Text>
            <Text style={styles.metricLabel}>Holdings</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metric}>
            <View style={[styles.metricIcon, { backgroundColor: `${colors.value.positive}15` }]}>
              <Scan size={16} color={colors.value.positive} strokeWidth={1.5} />
            </View>
            <Text style={styles.metricValue}>{stats.totalScans}</Text>
            <Text style={styles.metricLabel}>Scans</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metric}>
            <View style={[styles.metricIcon, { backgroundColor: `${colors.value.warning}15` }]}>
              <TrendingUp size={16} color={colors.value.warning} strokeWidth={1.5} />
            </View>
            <Text style={styles.metricValue}>
              {stats.stashCount > 0
                ? formatCompactValue(Math.round(stats.totalLootValue / stats.stashCount))
                : "0"}
            </Text>
            <Text style={styles.metricLabel}>Avg Value</Text>
          </View>
        </View>
      </View>

      {/* Holdings List */}
      <View style={styles.holdingsSection}>
        <View style={styles.holdingsHeader}>
          <Text style={styles.holdingsTitle}>HOLDINGS</Text>
          <Text style={styles.holdingsCount}>{items.length} items</Text>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <PortfolioCard
              item={item}
              index={index}
              onRemove={() => removeItem(item.id)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          ListEmptyComponent={EmptyPortfolio}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  screenTitle: {
    ...typography.title,
    color: colors.text.primary,
  },

  // Summary
  summaryContainer: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.lg,
  },
  totalValueSection: {
    alignItems: "center",
    gap: spacing.xs,
  },
  totalLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    letterSpacing: 2,
  },
  totalValue: {
    ...typography.hero,
    color: colors.value.positive,
  },
  changeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  changeText: {
    ...typography.caption,
    color: colors.value.positive,
  },

  // Metrics
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  metric: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  metricValue: {
    ...typography.heading,
    color: colors.text.primary,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.subtle,
  },

  // Holdings
  holdingsSection: {
    flex: 1,
    marginTop: spacing.lg,
  },
  holdingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  holdingsTitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    letterSpacing: 1,
  },
  holdingsCount: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  cardImage: {
    width: 80,
    height: 80,
    backgroundColor: colors.background.elevated,
  },
  cardContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitleSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: "500",
  },
  category: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  value: {
    ...typography.body,
    color: colors.value.positive,
    fontWeight: "600",
  },
  dateAdded: {
    ...typography.caption,
    color: colors.text.tertiary,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.elevated,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: "center",
  },
});
