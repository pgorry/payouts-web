// --- Input types ---

export interface RoundInput {
  date: string;
  hasAce: boolean;
  aceWinner?: string;
}

export interface Player {
  name: string;
  isPro: boolean;
  parPoints?: number;
}

/**
 * A player who bought into the KP tournament only (the $2 entry) rather than
 * the full competition. They are eligible to win KPs, and they push the KP
 * field size up — but they contribute nothing to the deuce pot and cannot win
 * slots, par points or deuces.
 */
export interface KpOnlyPlayer extends Player {
  /** The label from the entry list's Event column, e.g. "LvR". Display only. */
  event?: string;
}

export interface SlotTeam {
  place: number;
  players: Player[];
  netScore?: number;
}

export interface DeuceEntry {
  player: string;
  instances: number;
}

export interface ParPointWinner {
  place: number;
  player: string;
  score: number;
}

export interface KPWinner {
  hole: string;
  player: string;
  /**
   * Whether this KP winner is paid in cash or given a sleeve of balls.
   * Undefined = let the engine decide (extra KPs beyond the cash count default
   * to balls, given to the players who won the most cash that day).
   */
  prize?: 'cash' | 'balls';
}

export interface RoundData {
  round: RoundInput;
  players: Player[];
  /**
   * Full-entry ($15) players from the entry list, when one was uploaded. When
   * present this is authoritative for the full-entry field — leaderboard
   * players absent from it (no-shows who never paid) are excluded from the
   * field and charges. Undefined when no entry list was uploaded, in which
   * case `players` (the leaderboard roster) is used instead.
   */
  paidFullPlayers?: Player[];
  openPlayPlayers: Player[];
  /** KP-only ($2) entrants, from the optional entry-list upload. */
  kpOnlyPlayers: KpOnlyPlayer[];
  /**
   * "No-slots" ($10) entrants (e.g. players stuck in a twosome who couldn't
   * play slots), from the optional entry-list upload. They play deuce, KP and
   * par points — everything but slots.
   */
  noSlotsPlayers: KpOnlyPlayer[];
  slotTeams: SlotTeam[];
  deuces: DeuceEntry[];
  parPointWinners: ParPointWinner[];
  kpWinners: KPWinner[];
}

// --- Rules config ---

export interface RulesConfig {
  entryFee: number;
  deuceContribution: number;
  kpHoles: string[];
  /**
   * Standard number of KP cash prizes. Drives the pool reservation and the
   * per-KP cash value, independent of how many KP holes there are. Any KP
   * winners beyond this count default to a sleeve of balls.
   */
  kpCashCount: number;
  kpPrizeOver32: number;
  kpPrizeUnder32: number;
  slotsPercent: number;
  parPointsPercent: number;
  playerThreshold: number;
  splits: number[];
  openPlayEntryFee: number;
  openPlayDeuceContribution: number;
  openPlayKpContribution: number;
  /**
   * Entry fee for a KP-only player. Their money is NOT used to inflate the KP
   * prizes — it drops into the general pot and is split slots/par points along
   * with everything else. What their presence does do is push the KP field size
   * up, which can lift the per-KP prize from the under- to the over-threshold
   * rate.
   */
  kpOnlyEntryFee: number;
  /**
   * Entry fee for a "no-slots" player — everything but slots (deuce + KP + par
   * points). Like the other partial tiers, their money does NOT inflate the KP
   * prizes; the residual drops into the general pot. They can win par points.
   */
  noSlotsEntryFee: number;
}

// --- Output types ---

export interface MoneyPool {
  totalCollected: number;
  deucePot: number;
  kpTotal: number;
  kpEach: number;
  remaining: number;
  slotsPool: number;
  parPointsPool: number;
  playerCount: number;
  openPlayPlayerCount: number;
  kpOnlyPlayerCount: number;
  noSlotsPlayerCount: number;
  /** Money collected from KP-only entrants, folded into `remaining`. */
  kpOnlyCollected: number;
  /** Money collected from no-slots ($10) entrants, folded into `remaining`. */
  noSlotsCollected: number;
  /** Everyone entered in the KP tournament — drives the per-KP prize rate. */
  kpFieldCount: number;
}

export interface DeuceResult {
  isAce: boolean;
  aceWinner?: string;
  aceAmount?: number;
  totalInstances: number;
  perInstance: number;
  winners: { player: string; instances: number; payout: number }[];
}

export interface SlotPlayerResult {
  name: string;
  isPro: boolean;
  basePayout: number;
  proBonus: number;
  totalPayout: number;
}

export interface SlotResult {
  place: number;
  percentage: number;
  teamPayout: number;
  players: SlotPlayerResult[];
  proRedistributionNote?: string;
}

export interface ParPointResult {
  place: number;
  percentage: number;
  player: string;
  payout: number;
}

export interface KPResult {
  hole: string;
  player: string;
  payout: number;
  pending: boolean;
  /** 'cash' = paid kpEach; 'balls' = a sleeve of balls (no cash). */
  prize: 'cash' | 'balls';
}

export interface PlayerCharge {
  name: string;
  charge: number;
  won: number;
  breakdown: string;
  net: number;
  /** Which entry tier this player bought into. */
  tier: 'full' | 'open-play' | 'no-slots' | 'kp-only';
}

export interface PayoutResults {
  date: string;
  pool: MoneyPool;
  deuces: DeuceResult;
  kps: KPResult[];
  slots: SlotResult[];
  parPoints: ParPointResult[];
  charges: PlayerCharge[];
  totalPaidOut: number;
  kpsReserved: number;
  kpReturnedToPot: number;
}
