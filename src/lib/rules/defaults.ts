import type { RulesConfig } from '@/types';

export const DEFAULT_RULES: RulesConfig = {
  entryFee: 15,
  deuceContribution: 3,
  kpHoles: ['#2', '#7', '#12', '#16'],
  kpPrizeOver32: 15,
  kpPrizeUnder32: 10,
  slotsPercent: 0.80,
  parPointsPercent: 0.20,
  playerThreshold: 32,
  splitsUnder: [60, 40],
  splitsOver: [50, 30, 20],
};
