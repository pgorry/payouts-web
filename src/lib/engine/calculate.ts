import type { RoundData, RulesConfig, PayoutResults, KPResult, Player } from '@/types';
import { calculatePool } from './pools';
import { calculateDeuces } from './deuces';
import { calculateSlots } from './slots';
import { calculateParPoints } from './parPoints';
import { calculateCharges } from './charges';

/**
 * Match a KP winner name to a player in the list, handling "First Last" vs "Last, First" formats.
 */
function resolvePlayerName(input: string, players: Player[]): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Exact match
  if (players.some(p => p.name === trimmed)) return trimmed;

  // Case-insensitive match
  const lower = trimmed.toLowerCase();
  const ciMatch = players.find(p => p.name.toLowerCase() === lower);
  if (ciMatch) return ciMatch.name;

  // Try flipping "First Last" → "Last, First" and vice versa
  let flipped = '';
  if (trimmed.includes(', ')) {
    // "Last, First" → "First Last"
    const [last, first] = trimmed.split(', ', 2);
    flipped = `${first} ${last}`;
  } else if (trimmed.includes(' ')) {
    // "First Last" → "Last, First"
    const parts = trimmed.split(' ');
    const last = parts.pop()!;
    flipped = `${last}, ${parts.join(' ')}`;
  }

  if (flipped) {
    const flippedLower = flipped.toLowerCase();
    const flipMatch = players.find(p => p.name.toLowerCase() === flippedLower);
    if (flipMatch) return flipMatch.name;
  }

  // No match found, return as-is
  return trimmed;
}

export function calculatePayouts(data: RoundData, rules: RulesConfig): PayoutResults {
  const realPlayers = data.players.filter(p => !p.isPro);
  const playerCount = realPlayers.length;

  const pool = calculatePool(playerCount, rules);
  const deuces = calculateDeuces(data.round, data.deuces, pool.deucePot);

  // Build KP results, resolving names to match the player list
  const kps: KPResult[] = rules.kpHoles.map(hole => {
    const winner = data.kpWinners.find(kp => kp.hole === hole);
    const resolved = winner ? resolvePlayerName(winner.player, data.players) : '';
    return {
      hole,
      player: resolved,
      payout: pool.kpEach,
      pending: !resolved,
    };
  });

  // Unclaimed KP money goes back into the general pot (slots + par points)
  const unclaimedKps = kps.filter(k => k.pending).length;
  const kpReturnedToPot = unclaimedKps * pool.kpEach;
  const adjustedSlotsPool = pool.slotsPool + kpReturnedToPot * rules.slotsPercent;
  const adjustedParPointsPool = pool.parPointsPool + kpReturnedToPot * rules.parPointsPercent;

  const slots = calculateSlots(data.slotTeams, adjustedSlotsPool, playerCount, rules);
  const parPoints = calculateParPoints(data.parPointWinners, adjustedParPointsPool, playerCount, rules);

  const charges = calculateCharges(data.players, deuces, kps, slots, parPoints, rules.entryFee);

  const totalPaidOut = charges.reduce((sum, c) => sum + c.won, 0);

  return {
    date: data.round.date,
    pool,
    deuces,
    kps,
    slots,
    parPoints,
    charges,
    totalPaidOut,
    kpsReserved: 0,
    kpReturnedToPot,
  };
}
