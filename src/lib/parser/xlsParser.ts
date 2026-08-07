import * as XLSX from 'xlsx';
import type { Player, SlotTeam, DeuceEntry, ParPointWinner, KPWinner } from '@/types';

export interface ParsedXLS {
  players: Player[];
  openPlayPlayers: Player[];
  parPointWinners: ParPointWinner[];
  slotTeams: SlotTeam[];
  deuces: DeuceEntry[];
  kpWinners: KPWinner[];
  /** KP holes detected in the file, in sheet order (e.g. ['#2','#7',...]). */
  kpHoles: string[];
  sheetNames: string[];
}

function findSheet(wb: XLSX.WorkBook, prefix: string): XLSX.WorkSheet | undefined {
  const lower = prefix.toLowerCase();
  const match = wb.SheetNames.find(n => n.toLowerCase().startsWith(lower));
  return match ? wb.Sheets[match] : undefined;
}

export function parseLeagueXLS(buffer: ArrayBuffer): ParsedXLS {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetNames = wb.SheetNames;

  // Newer exports split par points into an individual sheet ("modified scoring
  // par points") and a foursome/team sheet ("par points"). Older exports had a
  // single "par points" sheet with the individual scores. Prefer the individual
  // sheet — the source for the player roster and par-point winners — and fall
  // back to the plain "par points" sheet for the old format.
  const parPointsSheet =
    findSheet(wb, 'modified scoring par points') ?? findSheet(wb, 'par points');
  const players = parseParPointsSheet(parPointsSheet);
  const parPointWinners = extractParPointWinners(parPointsSheet);
  const openPlayPlayers = parseOpenPlaySheet(findSheet(wb, 'general open play'));
  const slotTeams = parseSlotsSheet(findSheet(wb, 'sunday slots'), players);
  const deuces = parseDeucesSheet(findSheet(wb, 'deuce pot'));
  const { kpWinners, kpHoles } = parseKPSheets(wb);

  return { players, openPlayPlayers, parPointWinners, slotTeams, deuces, kpWinners, kpHoles, sheetNames };
}

/**
 * Detect every KP sheet in the workbook (any sheet whose name starts with "kp").
 * The hole label is whatever follows "kp" in the sheet name, e.g. "KP #2" → "#2".
 * This way weeks with more than the usual four KPs are picked up automatically.
 */
function parseKPSheets(wb: XLSX.WorkBook): { kpWinners: KPWinner[]; kpHoles: string[] } {
  const kpWinners: KPWinner[] = [];
  const kpHoles: string[] = [];

  for (const sheetName of wb.SheetNames) {
    const match = sheetName.trim().match(/^kp\b\s*(.*)$/i);
    if (!match) continue;

    let hole = match[1].trim();
    if (!hole) continue; // e.g. a sheet literally named "KP"
    if (/^\d/.test(hole)) hole = `#${hole}`; // normalise "2" → "#2"
    if (kpHoles.includes(hole)) continue; // ignore duplicate sheet names

    kpHoles.push(hole);

    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 }) as unknown as unknown[][];
    // Row 0 = header "Pos | Player | Details", row 1 = first winner
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;
      const name = String(row[1] ?? '').trim();
      if (name && name !== 'Total Purse Allocated:') {
        kpWinners.push({ hole, player: name });
        break; // only take the first winner per hole
      }
    }
  }

  return { kpWinners, kpHoles };
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

    // "Pro for Slots" placeholders are named with a "Z-" prefix (e.g.
    // "Z- Woods, Tiger") so they sort last. The individual par-points sheet
    // doesn't repeat the "Pro for Slots" label, so key off the prefix too.
    const isPro =
      /^z-\s/i.test(playerName) ||
      row.some(cell =>
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

function parseOpenPlaySheet(sheet: XLSX.WorkSheet | undefined): Player[] {
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 }) as unknown as unknown[][];

  const players: Player[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const posStr = String(row[0] ?? '').trim();
    if (!posStr || posStr === 'Total Purse Allocated:') continue;
    if (isNaN(parseInt(posStr))) continue;

    const playerName = String(row[1] ?? '').trim();
    if (!playerName) continue;

    const isPro = row.some(cell =>
      typeof cell === 'string' && cell.toLowerCase().includes('pro for slots')
    );

    players.push({ name: playerName, isPro });
  }

  return players;
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
