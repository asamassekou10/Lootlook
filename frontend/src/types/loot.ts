export type RarityScore =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Legendary"
  | "Unknown";

export interface LootAnalysisResponse {
  item_name: string;
  estimated_value: string;
  confidence_score: number;
  description: string;
  rarity_score: RarityScore;
  category: string;
  market_demand?: "High" | "Medium" | "Low";
  source_count?: number;
}

export interface StashItem {
  id: string;
  scan: LootAnalysisResponse;
  imageUri: string;
  scannedAt: string;
  addedAt: string;
}

export interface StashStats {
  totalScans: number;
  stashCount: number;
  totalLootValue: number;
  level: number;
}
