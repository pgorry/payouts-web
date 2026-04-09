import type { MoneyPool, RulesConfig } from '@/types';

export function calculatePool(playerCount: number, rules: RulesConfig): MoneyPool {
  const totalCollected = playerCount * rules.entryFee;
  const deucePot = playerCount * rules.deuceContribution;
  const kpEach = playerCount >= rules.playerThreshold
    ? rules.kpPrizeOver32
    : rules.kpPrizeUnder32;
  const kpTotal = rules.kpHoles.length * kpEach;
  const remaining = totalCollected - deucePot - kpTotal;
  const slotsPool = remaining * rules.slotsPercent;
  const parPointsPool = remaining * rules.parPointsPercent;

  return {
    totalCollected,
    deucePot,
    kpTotal,
    kpEach,
    remaining,
    slotsPool,
    parPointsPool,
    playerCount,
  };
}
