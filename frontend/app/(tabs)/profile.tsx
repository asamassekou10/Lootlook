/**
 * Profile Screen - User statistics and settings
 * Clean, data-focused layout with achievement metrics
 */

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  User,
  Scan,
  Package,
  DollarSign,
  TrendingUp,
  Trash2,
  ChevronRight,
  Award,
  Sparkles,
  Crown,
  Play,
  RotateCcw,
  Wrench,
} from "lucide-react-native";
import { useStashStore } from "../../src/stores/stashStore";
import { useSubscriptionStore } from "../../src/stores/subscriptionStore";
import { useOnboardingStore } from "../../src/stores/onboardingStore";
import { iapService } from "../../src/services/iapService";
import { colors, typography, spacing, borderRadius } from "../../src/theme";

const LEVEL_TITLES: Record<number, string> = {
  1: "Novice Appraiser",
  2: "Item Scout",
  3: "Market Watcher",
  4: "Value Hunter",
  5: "Asset Tracker",
  6: "Portfolio Builder",
  7: "Market Analyst",
  8: "Senior Appraiser",
  9: "Valuation Expert",
  10: "Master Collector",
};

export default function ProfileScreen() {
  const { stats, clearStash } = useStashStore();
  const insets = useSafeAreaInsets();
  const {
    userTier,
    freeScansUsedThisMonth,
    packCredits,
    proSubscriptionActive,
    rewardedAdBonusScans,
    getRemainingFreeScans,
  } = useSubscriptionStore();
  const { resetOnboarding } = useOnboardingStore();

  const getLevelTitle = (level: number): string => {
    if (level >= 10) return LEVEL_TITLES[10];
    return LEVEL_TITLES[level] || LEVEL_TITLES[1];
  };

  const getNextLevelProgress = (): number => {
    const scansPerLevel = 5;
    const currentLevelScans = stats.totalScans % scansPerLevel;
    return (currentLevelScans / scansPerLevel) * 100;
  };

  const handleClearPortfolio = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Clear Portfolio",
      "This will remove all items from your portfolio. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearStash();
          },
        },
      ]
    );
  };

  const handleRestorePurchases = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await iapService.restorePurchases();
  };

  // Dev tools handlers
  const handleExhaustFreeScans = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    useSubscriptionStore.setState({
      freeScansUsedThisMonth: 5,
      packCredits: 0,
      rewardedAdBonusScans: 0,
      proSubscriptionActive: false,
      userTier: "free",
    });
    Alert.alert("Dev Mode", "Free scans exhausted. Paywall will show on next scan.");
  };

  const handleSimulateProSubscriber = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    useSubscriptionStore.setState({
      userTier: "pro_subscriber",
      proSubscriptionActive: true,
      proSubscriptionExpiry: expiry.toISOString(),
    });
    Alert.alert("Dev Mode", "Now Pro Subscriber - unlimited scans!");
  };

  const handleSimulatePackHolder = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    useSubscriptionStore.setState({
      userTier: "pack_holder",
      packCredits: 20,
      proSubscriptionActive: false,
    });
    Alert.alert("Dev Mode", "Now Pack Holder with 20 credits!");
  };

  const handleResetOnboarding = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Reset Onboarding",
      "This will show the onboarding screen on next app restart.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: () => {
            resetOnboarding();
            Alert.alert("Done", "Restart the app to see onboarding.");
          },
        },
      ]
    );
  };

  const handleResetAllState = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Reset All State",
      "This will reset all subscription and onboarding data. The app will restart.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset All",
          style: "destructive",
          onPress: () => {
            useSubscriptionStore.setState({
              userTier: "free",
              freeScansUsedThisMonth: 0,
              packCredits: 0,
              proSubscriptionActive: false,
              proSubscriptionExpiry: null,
              rewardedAdBonusScans: 0,
            });
            resetOnboarding();
            Alert.alert("Done", "All state reset. Restart the app.");
          },
        },
      ]
    );
  };

  // Get tier display info
  const getTierInfo = () => {
    if (proSubscriptionActive) {
      return { label: "Pro Subscriber", color: colors.accent.primary, icon: Crown };
    }
    if (packCredits > 0) {
      return { label: `Pack Holder (${packCredits} credits)`, color: colors.value.positive, icon: Package };
    }
    const remaining = getRemainingFreeScans();
    return { label: `Free (${remaining}/5 scans)`, color: colors.text.secondary, icon: User };
  };

  const tierInfo = getTierInfo();

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${Math.round(value).toLocaleString()}`;
  };

  const avgValue = stats.stashCount > 0
    ? Math.round(stats.totalLootValue / stats.stashCount)
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Profile</Text>
      </View>

      {/* Subscription Status Card */}
      <View style={styles.subscriptionCard}>
        <View style={styles.subscriptionHeader}>
          <View style={[styles.tierIconContainer, { backgroundColor: `${tierInfo.color}20` }]}>
            <tierInfo.icon size={20} color={tierInfo.color} strokeWidth={1.5} />
          </View>
          <View style={styles.tierInfo}>
            <Text style={styles.tierLabel}>Current Plan</Text>
            <Text style={[styles.tierValue, { color: tierInfo.color }]}>{tierInfo.label}</Text>
          </View>
        </View>
        {rewardedAdBonusScans > 0 && (
          <View style={styles.bonusBadge}>
            <Sparkles size={12} color={colors.value.warning} strokeWidth={2} />
            <Text style={styles.bonusText}>+{rewardedAdBonusScans} bonus scan{rewardedAdBonusScans > 1 ? 's' : ''}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
          activeOpacity={0.7}
        >
          <RotateCcw size={14} color={colors.accent.primary} strokeWidth={2} />
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>
      </View>

      {/* User Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <User size={32} color={colors.text.secondary} strokeWidth={1.5} />
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelNumber}>{stats.level}</Text>
          </View>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userTitle}>{getLevelTitle(stats.level)}</Text>
          <Text style={styles.userSubtitle}>Level {stats.level}</Text>
        </View>

        {/* Level Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Next Level</Text>
            <Text style={styles.progressValue}>
              {stats.totalScans % 5}/5 scans
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${getNextLevelProgress()}%` }]}
            />
          </View>
        </View>
      </View>

      {/* Statistics Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>STATISTICS</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.value.positive}15` }]}>
            <Scan size={20} color={colors.value.positive} strokeWidth={1.5} />
          </View>
          <Text style={styles.statValue}>{stats.totalScans}</Text>
          <Text style={styles.statLabel}>Total Scans</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.accent.primary}15` }]}>
            <Package size={20} color={colors.accent.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.statValue}>{stats.stashCount}</Text>
          <Text style={styles.statLabel}>Items Saved</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.value.warning}15` }]}>
            <DollarSign size={20} color={colors.value.warning} strokeWidth={1.5} />
          </View>
          <Text style={styles.statValue}>{formatValue(stats.totalLootValue)}</Text>
          <Text style={styles.statLabel}>Portfolio Value</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.text.secondary}15` }]}>
            <TrendingUp size={20} color={colors.text.secondary} strokeWidth={1.5} />
          </View>
          <Text style={styles.statValue}>{formatValue(avgValue)}</Text>
          <Text style={styles.statLabel}>Avg Item Value</Text>
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>MILESTONES</Text>
      </View>

      <View style={styles.achievementsContainer}>
        <View style={[styles.achievement, stats.totalScans >= 1 && styles.achievementUnlocked]}>
          <Award
            size={24}
            color={stats.totalScans >= 1 ? colors.value.warning : colors.text.tertiary}
            strokeWidth={1.5}
          />
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementTitle, stats.totalScans >= 1 && styles.achievementTitleUnlocked]}>
              First Scan
            </Text>
            <Text style={styles.achievementDesc}>Complete your first scan</Text>
          </View>
          {stats.totalScans >= 1 && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </View>

        <View style={[styles.achievement, stats.stashCount >= 5 && styles.achievementUnlocked]}>
          <Award
            size={24}
            color={stats.stashCount >= 5 ? colors.value.warning : colors.text.tertiary}
            strokeWidth={1.5}
          />
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementTitle, stats.stashCount >= 5 && styles.achievementTitleUnlocked]}>
              Collector
            </Text>
            <Text style={styles.achievementDesc}>Save 5 items to portfolio</Text>
          </View>
          {stats.stashCount >= 5 && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </View>

        <View style={[styles.achievement, stats.totalLootValue >= 1000 && styles.achievementUnlocked]}>
          <Award
            size={24}
            color={stats.totalLootValue >= 1000 ? colors.value.warning : colors.text.tertiary}
            strokeWidth={1.5}
          />
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementTitle, stats.totalLootValue >= 1000 && styles.achievementTitleUnlocked]}>
              Thousand Club
            </Text>
            <Text style={styles.achievementDesc}>Reach $1,000 portfolio value</Text>
          </View>
          {stats.totalLootValue >= 1000 && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>ACTIONS</Text>
      </View>

      <TouchableOpacity
        style={styles.dangerAction}
        onPress={handleClearPortfolio}
        activeOpacity={0.7}
      >
        <View style={styles.dangerIconContainer}>
          <Trash2 size={20} color="#EF4444" strokeWidth={1.5} />
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.dangerActionTitle}>Clear Portfolio</Text>
          <Text style={styles.dangerActionDesc}>Remove all saved items</Text>
        </View>
        <ChevronRight size={20} color={colors.text.tertiary} strokeWidth={1.5} />
      </TouchableOpacity>

      {/* Dev Tools (only in development) */}
      {__DEV__ && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>DEV TOOLS</Text>
          </View>

          <View style={styles.devToolsContainer}>
            <Text style={styles.devToolsNote}>
              These tools are for testing monetization flows
            </Text>

            <View style={styles.devToolsGrid}>
              <TouchableOpacity
                style={styles.devButton}
                onPress={handleExhaustFreeScans}
                activeOpacity={0.7}
              >
                <Play size={16} color={colors.value.warning} strokeWidth={2} />
                <Text style={styles.devButtonText}>Exhaust Scans</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.devButton}
                onPress={handleSimulatePackHolder}
                activeOpacity={0.7}
              >
                <Package size={16} color={colors.value.positive} strokeWidth={2} />
                <Text style={styles.devButtonText}>Pack Holder</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.devButton}
                onPress={handleSimulateProSubscriber}
                activeOpacity={0.7}
              >
                <Crown size={16} color={colors.accent.primary} strokeWidth={2} />
                <Text style={styles.devButtonText}>Pro Sub</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.devButton}
                onPress={handleResetOnboarding}
                activeOpacity={0.7}
              >
                <RotateCcw size={16} color={colors.text.secondary} strokeWidth={2} />
                <Text style={styles.devButtonText}>Reset Onboard</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.devDangerButton}
              onPress={handleResetAllState}
              activeOpacity={0.7}
            >
              <Wrench size={16} color="#EF4444" strokeWidth={2} />
              <Text style={styles.devDangerButtonText}>Reset All State</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.appName}>LootLook</Text>
        <Text style={styles.tagline}>Your personal asset appraiser</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },

  // Header
  header: {
    marginBottom: spacing.lg,
  },
  screenTitle: {
    ...typography.title,
    color: colors.text.primary,
  },

  // Subscription Card
  subscriptionCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  subscriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  tierIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  tierInfo: {
    flex: 1,
  },
  tierLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  tierValue: {
    ...typography.body,
    fontWeight: "600",
  },
  bonusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.value.warningMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  bonusText: {
    ...typography.caption,
    color: colors.value.warning,
    fontWeight: "500",
  },
  restoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    marginTop: spacing.xs,
  },
  restoreButtonText: {
    ...typography.caption,
    color: colors.accent.primary,
    fontWeight: "500",
  },

  // User Card
  userCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: "center",
    gap: spacing.md,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.background.secondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border.medium,
  },
  levelBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.background.elevated,
  },
  levelNumber: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "700",
  },
  userInfo: {
    alignItems: "center",
  },
  userTitle: {
    ...typography.heading,
    color: colors.text.primary,
  },
  userSubtitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  progressSection: {
    width: "100%",
    gap: spacing.sm,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  progressValue: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border.subtle,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.full,
  },

  // Section Headers
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    letterSpacing: 1,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statCard: {
    width: "48%",
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    ...typography.heading,
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },

  // Achievements
  achievementsContainer: {
    gap: spacing.sm,
  },
  achievement: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.md,
    opacity: 0.5,
  },
  achievementUnlocked: {
    opacity: 1,
    borderColor: colors.value.warning,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    ...typography.body,
    color: colors.text.tertiary,
    fontWeight: "500",
  },
  achievementTitleUnlocked: {
    color: colors.text.primary,
  },
  achievementDesc: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.value.warning,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: colors.background.primary,
    fontWeight: "700",
    fontSize: 12,
  },

  // Actions
  dangerAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    gap: spacing.md,
  },
  dangerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionContent: {
    flex: 1,
  },
  dangerActionTitle: {
    ...typography.body,
    color: "#EF4444",
    fontWeight: "500",
  },
  dangerActionDesc: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },

  // Dev Tools
  devToolsContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderStyle: "dashed",
    gap: spacing.md,
  },
  devToolsNote: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: "center",
  },
  devToolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  devButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.background.elevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  devButtonText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  devDangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  devDangerButtonText: {
    ...typography.caption,
    color: "#EF4444",
    fontWeight: "600",
  },

  // Footer
  footer: {
    alignItems: "center",
    marginTop: spacing.xxl,
    paddingVertical: spacing.xl,
  },
  appName: {
    ...typography.heading,
    color: colors.accent.primary,
  },
  tagline: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  version: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
    opacity: 0.5,
  },
});
