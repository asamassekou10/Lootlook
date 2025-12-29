/**
 * Onboarding Store
 * Tracks first-time user state and onboarding completion
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OnboardingState {
  // Has the user completed onboarding?
  hasCompletedOnboarding: boolean;

  // Has the user granted camera permission through our primer?
  hasCameraPermission: boolean;

  // When was onboarding completed?
  onboardingCompletedAt: string | null;

  // Actions
  completeOnboarding: () => void;
  setCameraPermission: (granted: boolean) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      hasCameraPermission: false,
      onboardingCompletedAt: null,

      completeOnboarding: () => {
        set({
          hasCompletedOnboarding: true,
          onboardingCompletedAt: new Date().toISOString(),
        });
      },

      setCameraPermission: (granted: boolean) => {
        set({ hasCameraPermission: granted });
      },

      resetOnboarding: () => {
        set({
          hasCompletedOnboarding: false,
          hasCameraPermission: false,
          onboardingCompletedAt: null,
        });
      },
    }),
    {
      name: "lootlook-onboarding",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
