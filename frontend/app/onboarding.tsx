/**
 * Onboarding Primer Screen
 * Premium, professional introduction for first-time users
 * Explains camera usage and requests permission on user action
 */

import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  Camera,
  Sparkles,
  TrendingUp,
  Shield,
  ChevronRight,
} from "lucide-react-native";
import { useOnboardingStore } from "../src/stores/onboardingStore";
import { colors, typography, spacing, borderRadius } from "../src/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Feature highlights for the onboarding
const FEATURES = [
  {
    icon: Camera,
    title: "Instant Recognition",
    description: "Point your camera at any item to identify it instantly",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Valuations",
    description: "Get accurate market prices from trusted sources",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Analysis",
    description: "Advanced AI identifies brands, models, and condition",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isRequesting, setIsRequesting] = useState(false);

  const { completeOnboarding, setCameraPermission } = useOnboardingStore();

  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const featureAnims = useRef(
    FEATURES.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;

  // Entrance animations
  useEffect(() => {
    // Main content fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Stagger feature animations
    const featureDelay = 600;
    FEATURES.forEach((_, index) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(featureAnims[index].opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(featureAnims[index].translateY, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }, featureDelay + index * 150);
    });
  }, []);

  // Handle camera permission request
  const handleRequestPermission = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsRequesting(true);

    try {
      const result = await requestPermission();
      setCameraPermission(result.granted);
      completeOnboarding();

      // Navigate to main app
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Permission request failed:", error);
      setIsRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={["#0A0A0A", "#000000", "#050505"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Subtle decorative gradient orb */}
      <View style={styles.decorativeOrb} />

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Logo Section */}
        <Animated.View
          style={[
            styles.logoSection,
            { transform: [{ scale: logoScale }] },
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Sparkles size={32} color={colors.accent.primary} strokeWidth={1.5} />
            </View>
          </View>
          <Text style={styles.logoText}>LootLook</Text>
          <Text style={styles.tagline}>The Bloomberg Terminal for Your Stuff</Text>
        </Animated.View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          {FEATURES.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Animated.View
                key={feature.title}
                style={[
                  styles.featureRow,
                  {
                    opacity: featureAnims[index].opacity,
                    transform: [{ translateY: featureAnims[index].translateY }],
                  },
                ]}
              >
                <View style={styles.featureIconContainer}>
                  <IconComponent
                    size={24}
                    color={colors.accent.primary}
                    strokeWidth={1.5}
                  />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* Camera Permission Section */}
        <View style={styles.permissionSection}>
          <View style={styles.permissionCard}>
            <View style={styles.permissionHeader}>
              <View style={styles.cameraIconContainer}>
                <Camera size={28} color={colors.text.primary} strokeWidth={1.5} />
              </View>
              <View style={styles.permissionTextContainer}>
                <Text style={styles.permissionTitle}>Camera Access Required</Text>
                <Text style={styles.permissionDescription}>
                  LootLook needs camera access to scan and identify items. Your
                  privacy is protected—images are processed securely and never
                  stored on our servers.
                </Text>
              </View>
            </View>

            {/* Privacy badge */}
            <View style={styles.privacyBadge}>
              <Shield size={14} color={colors.value.positive} strokeWidth={2} />
              <Text style={styles.privacyText}>
                Private & Secure • No data stored
              </Text>
            </View>
          </View>

          {/* CTA Button */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.ctaButton,
                isRequesting && styles.ctaButtonDisabled,
              ]}
              onPress={handleRequestPermission}
              disabled={isRequesting}
              activeOpacity={0.9}
            >
              <Text style={styles.ctaButtonText}>
                {isRequesting ? "Requesting Access..." : "Enable Camera"}
              </Text>
              {!isRequesting && (
                <ChevronRight
                  size={20}
                  color={colors.background.primary}
                  strokeWidth={2.5}
                />
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Legal text */}
          <Text style={styles.legalText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  decorativeOrb: {
    position: "absolute",
    top: -SCREEN_HEIGHT * 0.2,
    left: -SCREEN_WIDTH * 0.3,
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
    borderRadius: SCREEN_WIDTH * 0.6,
    backgroundColor: colors.accent.primary,
    opacity: 0.03,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "space-between",
  },

  // Logo Section
  logoSection: {
    alignItems: "center",
    paddingTop: spacing.xxl,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  logoText: {
    ...typography.valueLarge,
    color: colors.text.primary,
    fontWeight: "300",
    letterSpacing: 2,
  },
  tagline: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },

  // Features Section
  featuresSection: {
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...typography.heading,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    lineHeight: 20,
  },

  // Permission Section
  permissionSection: {
    gap: spacing.lg,
  },
  permissionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  permissionHeader: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cameraIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.elevated,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionTitle: {
    ...typography.heading,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  permissionDescription: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.value.positiveMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  privacyText: {
    ...typography.caption,
    color: colors.value.positive,
    fontWeight: "500",
  },

  // CTA Button
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaButtonText: {
    ...typography.button,
    color: colors.background.primary,
  },

  // Legal
  legalText: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: "center",
  },
});
