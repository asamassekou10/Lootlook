import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LootAnalysisResponse, StashItem, StashStats } from "../types/loot";

interface StashState {
  items: StashItem[];
  stats: StashStats;
  addItem: (scan: LootAnalysisResponse, imageUri: string) => void;
  removeItem: (id: string) => void;
  clearStash: () => void;
  incrementScanCount: () => void;
}

function parseValueToNumber(value: string): number {
  // Handle range format like "$4 - $13" by taking the average
  const rangeMatch = value.match(/\$?([\d,]+(?:\.\d+)?)\s*-\s*\$?([\d,]+(?:\.\d+)?)/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1].replace(/,/g, ""));
    const max = parseFloat(rangeMatch[2].replace(/,/g, ""));
    return (min + max) / 2;
  }

  // Handle single value format like "~$50" or "$50"
  const singleMatch = value.match(/\$?([\d,]+(?:\.\d+)?)/);
  if (singleMatch) {
    return parseFloat(singleMatch[1].replace(/,/g, "")) || 0;
  }

  return 0;
}

function calculateLevel(totalValue: number): number {
  return Math.floor(totalValue / 500) + 1;
}

export const useStashStore = create<StashState>()(
  persist(
    (set, get) => ({
      items: [],
      stats: {
        totalScans: 0,
        stashCount: 0,
        totalLootValue: 0,
        level: 1,
      },

      addItem: (scan, imageUri) => {
        const now = new Date().toISOString();
        const newItem: StashItem = {
          id: Date.now().toString(),
          scan,
          imageUri,
          scannedAt: now,
          addedAt: now,
        };

        const itemValue = parseValueToNumber(scan.estimated_value);
        const newTotalValue = get().stats.totalLootValue + itemValue;

        set((state) => ({
          items: [newItem, ...state.items],
          stats: {
            ...state.stats,
            stashCount: state.stats.stashCount + 1,
            totalLootValue: newTotalValue,
            level: calculateLevel(newTotalValue),
          },
        }));
      },

      removeItem: (id) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;

        const itemValue = parseValueToNumber(item.scan.estimated_value);
        const newTotalValue = Math.max(0, get().stats.totalLootValue - itemValue);

        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
          stats: {
            ...state.stats,
            stashCount: Math.max(0, state.stats.stashCount - 1),
            totalLootValue: newTotalValue,
            level: calculateLevel(newTotalValue),
          },
        }));
      },

      clearStash: () => {
        set((state) => ({
          items: [],
          stats: {
            ...state.stats,
            stashCount: 0,
            totalLootValue: 0,
            level: 1,
          },
        }));
      },

      incrementScanCount: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            totalScans: state.stats.totalScans + 1,
          },
        }));
      },
    }),
    {
      name: "lootlook-stash",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
