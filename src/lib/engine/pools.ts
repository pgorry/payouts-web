import type { MoneyPool, RulesConfig } from '@/types';

export function calculatePool(
  playerCount: number,
  rules: RulesConfig,
  openPlayPlayerCount: number = 0,
): MoneyPool {
  const slotsCollected = playerCount * rules.entryFee;
  const openPlayCollected = openPlayPlayerCount * rules.openPlayEntryFee;
  const totalCollected = slotsCollected + openPlayCollected;

  const deucePot =
    playerCount * rules.deuceContribution +
    openPlayPlayerCount * rules.openPlayDeuceContribution;

  const baseKpEach = playerCount >= rules.playerThreshold
    ? rules.kpPrizeOver32
    : rules.kpPrizeUnder32;
  const baseKpTotal = rules.kpHoles.length * baseKpEach;
  const openPlayKpTotal = openPlayPlayerCount * rules.openPlayKpContribution;
  const kpTotal = baseKpTotal + openPlayKpTotal;
  const kpEach = kpTotal / rules.kpHoles.length;

  const remaining = slotsCollected - playerCount * rules.deuceContribution - baseKpTotal;
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
    openPlayPlayerCount,
  };
}
