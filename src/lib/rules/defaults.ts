import type { RulesConfig } from '@/types';

export const SPLIT_PRESETS: Record<number, number[]> = {
  2: [60, 40],
  3: [50, 30, 20],
  4: [40, 25, 20, 15],
  5: [30, 25, 20, 15, 10],
};

export function getDefaultPlaces(playerCount: number): number {
  if (playerCount >= 48) return 5;
  if (playerCount >= 32) return 3;
  return 2;
}

export const DEFAULT_RULES: RulesConfig = {
  entryFee: 15,
  deuceContribution: 3,
  kpHoles: ['#2', '#7', '#12', '#16'],
  kpPrizeOver32: 15,
  kpPrizeUnder32: 10,
  slotsPercent: 0.80,
  parPointsPercent: 0.20,
  playerThreshold: 32,
  splits: SPLIT_PRESETS[2],
};
