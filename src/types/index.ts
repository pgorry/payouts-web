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
  openPlayPlayers: Player[];
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
