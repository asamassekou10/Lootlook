/**
 * The Lens - Premium camera scanning interface
 * Minimalist design with subtle corner brackets and elegant controls
 */

import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Zap, RotateCcw, TrendingUp, Sparkles } from "lucide-react-native";
import { useAnalyzeImage } from "../../src/api/queries";
import { useStashStore } from "../../src/stores/stashStore";
import { useSubscriptionStore } from "../../src/stores/subscriptionStore";
import { PaywallModal } from "../../src/components/PaywallModal";
import { adService } from "../../src/services/adService";
import { colors, typography, spacing, borderRadius, layout } from "../../src/theme";

const ANALYSIS_MESSAGES = [
  "Analyzing object geometry...",
  "Identifying manufacturer...",
  "Retrieving market data...",
  "Calculating valuation...",
];

export default function ScannerScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [analysisMessage, setAnalysisMessage] = useState(ANALYSIS_MESSAGES[0]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [pendingCapture, setPendingCapture] = useState<(() => void) | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const analyzeMutation = useAnalyzeImage();
  const { stats, incrementScanCount } = useStashStore();

  // Subscription state
  const {
    userTier,
    canScan,
    consumeScan,
    getRemainingFreeScans,
    checkAndResetMonthlyScans,
  } = useSubscriptionStore();

  // Check and reset monthly scans on mount
  useEffect(() => {
    checkAndResetMonthlyScans();
  }, []);

  // Animated values
  const shutterScale = useRef(new Animated.Value(1)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  // Rotate analysis messages
  useEffect(() => {
    if (analyzeMutation.isPending) {
      let index = 0;
      const interval = setInterval(() => {
        index = (index + 1) % ANALYSIS_MESSAGES.length;
        setAnalysisMessage(ANALYSIS_MESSAGES[index]);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [analyzeMutation.isPending]);

  // Progress bar animation
  useEffect(() => {
    if (analyzeMutation.isPending) {
      progressWidth.setValue(0);
      Animated.timing(progressWidth, {
        toValue: 100,
        duration: 6000,
        useNativeDriver: false,
      }).start();
    } else {
      progressWidth.setValue(0);
    }
  }, [analyzeMutation.isPending]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { paddingTop: insets.top }]}>
        <View style={styles.permissionContent}>
          <Text style={styles.permissionTitle}>Camera Access</Text>
          <Text style={styles.permissionText}>
            LootLook uses your camera to identify items and estimate their market value.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /**
   * Perform the actual scan after credit check passes
   */
  const performScan = async () => {
    if (!cameraRef.current || analyzeMutation.isPending) return;

    // Shutter animation
    Animated.sequence([
      Animated.timing(shutterScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shutterScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo?.uri) {
        Alert.alert("Error", "Failed to capture image");
        return;
      }

      // Consume the scan credit
      consumeScan();
      incrementScanCount();

      analyzeMutation.mutate(photo.uri, {
        onSuccess: async (result) => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.push({
            pathname: "/result",
            params: {
              imageUri: photo.uri,
              result: JSON.stringify(result),
            },
          });
        },
        onError: async (error) => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert("Analysis Failed", error.message);
        },
      });
    } catch (error) {
      Alert.alert("Error", "Failed to take picture");
    }
  };

  /**
   * Handle shutter button press - implements scan gating logic
   * Flow: Pro Sub -> Pack Credits -> Free Monthly -> Paywall
   */
  const handleCapture = async () => {
    if (!cameraRef.current || analyzeMutation.isPending) return;

    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Check if user can scan (follows the flow diagram)
    if (canScan()) {
      // User has credits - proceed with scan
      await performScan();
    } else {
      // Out of credits - show paywall
      setPendingCapture(() => performScan);
      setShowPaywall(true);
    }
  };

  /**
   * Handle rewarded ad completion
   */
  const handleWatchAd = async () => {
    setShowPaywall(false);

    const success = await adService.showRewardedAd(() => {
      // Ad completed, +1 scan granted by adService
      // Now perform the pending capture
      if (pendingCapture) {
        pendingCapture();
        setPendingCapture(null);
      }
    });

    if (!success) {
      Alert.alert("Ad Not Ready", "Please try again in a moment.");
      setShowPaywall(true);
    }
  };

  /**
   * Handle successful purchase
   */
  const handlePurchaseComplete = () => {
    setShowPaywall(false);
    // Credits added by IAP service, proceed with scan
    if (pendingCapture) {
      pendingCapture();
      setPendingCapture(null);
    }
  };

  const toggleCameraFacing = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleFlash = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlashEnabled((current) => !current);
  };

  const isAnalyzing = analyzeMutation.isPending;
  const remainingFreeScans = getRemainingFreeScans();

  const formatPortfolioValue = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${Math.round(value)}`;
  };

  // Get scan credits display
  const getCreditsDisplay = () => {
    if (userTier === "pro_subscriber") {
      return { label: "PRO", color: colors.accent.primary };
    }
    const { packCredits } = useSubscriptionStore.getState();
    if (packCredits > 0) {
      return { label: `${packCredits}`, color: colors.value.positive };
    }
    return { label: `${remainingFreeScans}/5`, color: remainingFreeScans > 0 ? colors.text.secondary : colors.value.warning };
  };

  const creditsDisplay = getCreditsDisplay();

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        enableTorch={flashEnabled}
      >
        {/* Top Header - Portfolio Value and Credits */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          {/* Credits Indicator */}
          <BlurView intensity={40} tint="dark" style={styles.creditsPill}>
            <Sparkles size={12} color={creditsDisplay.color} strokeWidth={2} />
            <Text style={[styles.creditsText, { color: creditsDisplay.color }]}>
              {creditsDisplay.label}
            </Text>
          </BlurView>

          {/* Portfolio Value */}
          <BlurView intensity={40} tint="dark" style={styles.portfolioPill}>
            <TrendingUp
              size={14}
              color={colors.value.positive}
              strokeWidth={2}
            />
            <Text style={styles.portfolioLabel}>Portfolio</Text>
            <Text style={styles.portfolioValue}>
              {formatPortfolioValue(stats.totalLootValue)}
            </Text>
          </BlurView>

          {/* Spacer for layout balance */}
          <View style={styles.headerSpacer} />
        </View>

        {/* Center - Viewfinder */}
        <View style={styles.viewfinder}>
          <View style={styles.scanFrame}>
            {/* Subtle corner brackets */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={[styles.controls, { paddingBottom: insets.bottom + 100 }]}>
          {/* Flash Toggle */}
          <TouchableOpacity
            style={[styles.sideButton, flashEnabled && styles.sideButtonActive]}
            onPress={toggleFlash}
            disabled={isAnalyzing}
            activeOpacity={0.7}
          >
            <Zap
              size={22}
              color={flashEnabled ? colors.accent.primary : colors.text.secondary}
              strokeWidth={1.5}
              fill={flashEnabled ? colors.accent.primary : "transparent"}
            />
          </TouchableOpacity>

          {/* Shutter Button */}
          <TouchableOpacity
            onPress={handleCapture}
            disabled={isAnalyzing}
            activeOpacity={0.9}
          >
            <Animated.View
              style={[
                styles.shutterButton,
                { transform: [{ scale: shutterScale }] },
                isAnalyzing && styles.shutterDisabled,
              ]}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color={colors.background.primary} />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </Animated.View>
          </TouchableOpacity>

          {/* Flip Camera */}
          <TouchableOpacity
            style={styles.sideButton}
            onPress={toggleCameraFacing}
            disabled={isAnalyzing}
            activeOpacity={0.7}
          >
            <RotateCcw
              size={22}
              color={colors.text.secondary}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        </View>

        {/* Analysis Overlay */}
        {isAnalyzing && (
          <View style={styles.analysisOverlay}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressWidth.interpolate({
                      inputRange: [0, 100],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>

            {/* Status Message */}
            <View style={styles.analysisContent}>
              <Text style={styles.analysisText}>{analysisMessage}</Text>
            </View>
          </View>
        )}
      </CameraView>

      {/* Paywall Modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => {
          setShowPaywall(false);
          setPendingCapture(null);
        }}
        onWatchAd={handleWatchAd}
        onPurchaseComplete={handlePurchaseComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  camera: {
    flex: 1,
  },

  // Header
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  creditsPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    overflow: "hidden",
  },
  creditsText: {
    ...typography.caption,
    fontWeight: "600",
  },
  portfolioPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    overflow: "hidden",
  },
  portfolioLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  portfolioValue: {
    ...typography.heading,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 50, // Balance the header layout
  },

  // Viewfinder
  viewfinder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 260,
    height: 260,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: colors.white,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },

  // Controls
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  sideButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  sideButtonActive: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
  },
  shutterButton: {
    width: layout.shutterSize,
    height: layout.shutterSize,
    borderRadius: layout.shutterSize / 2,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  shutterDisabled: {
    opacity: 0.7,
  },
  shutterInner: {
    width: layout.shutterInnerSize,
    height: layout.shutterInnerSize,
    borderRadius: layout.shutterInnerSize / 2,
    backgroundColor: colors.white,
  },

  // Analysis Overlay
  analysisOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.overlay,
    justifyContent: "flex-end",
  },
  progressContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.border.subtle,
  },
  progressBar: {
    height: 2,
    backgroundColor: colors.accent.primary,
  },
  analysisContent: {
    alignItems: "center",
    paddingBottom: 200,
  },
  analysisText: {
    ...typography.body,
    color: colors.text.secondary,
  },

  // Permission Screen
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  permissionContent: {
    alignItems: "center",
    maxWidth: 300,
  },
  permissionTitle: {
    ...typography.title,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  permissionText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  permissionButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  permissionButtonText: {
    ...typography.button,
    color: colors.white,
  },
});
