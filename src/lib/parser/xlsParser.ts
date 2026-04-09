import * as XLSX from 'xlsx';
import type { Player, SlotTeam, DeuceEntry, ParPointWinner } from '@/types';

export interface ParsedXLS {
  players: Player[];
  parPointWinners: ParPointWinner[];
  slotTeams: SlotTeam[];
  deuces: DeuceEntry[];
  sheetNames: string[];
}

export function parseLeagueXLS(buffer: ArrayBuffer): ParsedXLS {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetNames = wb.SheetNames;

  const players = parseParPointsSheet(wb.Sheets['par points']);
  const parPointWinners = extractParPointWinners(wb.Sheets['par points']);
  const slotTeams = parseSlotsSheet(wb.Sheets['sunday slots'], players);
  const deuces = parseDeucesSheet(wb.Sheets['deuce pot']);

  return { players, parPointWinners, slotTeams, deuces, sheetNames };
}

function parseParPointsSheet(sheet: XLSX.WorkSheet | undefined): Player[] {
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 }) as unknown as unknown[][];

  const players: Player[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    // Columns vary: could be [Pos, Player, Score] or [Pos, Player, ProFlag, Score]
    const posStr = String(row[0] ?? '').trim();
    if (!posStr || posStr === 'Total Purse Allocated:') continue;

    const playerName = String(row[1] ?? '').trim();
    if (!playerName) continue;

    // Check for "Pro for Slots" in any column
    const isPro = row.some(cell =>
      typeof cell === 'string' && cell.toLowerCase().includes('pro for slots')
    );

    // Find the score (last numeric column)
    let score = 0;
    for (let j = row.length - 1; j >= 0; j--) {
      const val = Number(row[j]);
      if (!isNaN(val) && val > 0 && j > 0) {
        score = val;
        break;
      }
    }

    players.push({ name: playerName, isPro, parPoints: score });
  }

  return players;
}

function extractParPointWinners(sheet: XLSX.WorkSheet | undefined): ParPointWinner[] {
  if (!sheet) return [];
  const players = parseParPointsSheet(sheet);
  const realPlayers = players.filter(p => !p.isPro);

  return realPlayers
    .sort((a, b) => (b.parPoints ?? 0) - (a.parPoints ?? 0))
    .slice(0, 5)
    .map((p, i) => ({
      place: i + 1,
      player: p.name,
      score: p.parPoints ?? 0,
    }));
}

function parseSlotsSheet(sheet: XLSX.WorkSheet | undefined, allPlayers: Player[]): SlotTeam[] {
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 }) as unknown as unknown[][];

  const proNames = new Set(allPlayers.filter(p => p.isPro).map(p => p.name.toLowerCase()));
  const teams: SlotTeam[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const posStr = String(row[0] ?? '').trim();
    const pos = parseInt(posStr);
    if (isNaN(pos)) continue;

    // Find the foursome column (contains " / " separator)
    let foursomeStr = '';
    let netScore: number | undefined;

    for (const cell of row) {
      const str = String(cell ?? '');
      if (str.includes(' / ')) {
        foursomeStr = str;
      }
    }

    // Find net score (look for negative or small positive numbers in later columns)
    for (let j = row.length - 1; j >= 2; j--) {
      const val = Number(row[j]);
      if (!isNaN(val)) {
        netScore = val;
        break;
      }
    }

    if (!foursomeStr) continue;

    const playerNames = foursomeStr.split(' / ').map(n => n.trim());
    const players: Player[] = playerNames.map(name => ({
      name,
      isPro: proNames.has(name.toLowerCase()),
    }));

    teams.push({ place: pos, players, netScore });
  }

  return teams;
}

function parseDeucesSheet(sheet: XLSX.WorkSheet | undefined): DeuceEntry[] {
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 }) as unknown as unknown[][];

  const deuces: DeuceEntry[] = [];

  // Find the "Instances" column index from the header row
  const header = rows[0] ?? [];
  let instancesCol = header.findIndex(
    cell => typeof cell === 'string' && cell.toLowerCase().includes('instances')
  );
  if (instancesCol < 0) instancesCol = 2; // fallback

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;

    const playerName = String(row[1] ?? '').trim();
    if (!playerName || playerName === 'Total Purse Allocated:') continue;

    const instances = Number(row[instancesCol]);
    if (isNaN(instances) || instances <= 0) continue;

    deuces.push({ player: playerName, instances });
  }

  return deuces;
}
