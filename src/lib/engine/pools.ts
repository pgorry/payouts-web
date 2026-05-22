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
  // Pool reservation and per-KP value are based on the standard number of cash
  // prizes, NOT the number of KP holes. This way an extra KP (paid in balls)
  // has no effect on the money pool.
  const cashCount = rules.kpCashCount;
  const baseKpTotal = cashCount * baseKpEach;
  const openPlayKpTotal = openPlayPlayerCount * rules.openPlayKpContribution;
  const kpTotal = baseKpTotal + openPlayKpTotal;
  const kpEach = cashCount > 0 ? kpTotal / cashCount : 0;

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
