import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type {
  RoundInput,
  Player,
  KpOnlyPlayer,
  SlotTeam,
  DeuceEntry,
  ParPointWinner,
  KPWinner,
  RulesConfig,
  PayoutResults,
} from '@/types';
import { DEFAULT_RULES, getDefaultPlaces, SPLIT_PRESETS } from '@/lib/rules/defaults';

function getPreviousSunday(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diff = day === 0 ? 0 : day;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - diff);
  const y = sunday.getFullYear();
  const m = String(sunday.getMonth() + 1).padStart(2, '0');
  const d = String(sunday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface WizardState {
  currentStep: number;
  round: RoundInput;
  players: Player[];
  /** Open-play ($5) players from the leaderboard's "General Open Play" sheet. */
  openPlayPlayers: Player[];
  /** Open-play ($5) players from the optional entry-list upload. */
  entryListOpenPlayPlayers: KpOnlyPlayer[];
  kpOnlyPlayers: KpOnlyPlayer[];
  slotTeams: SlotTeam[];
  deuces: DeuceEntry[];
  parPointWinners: ParPointWinner[];
  kpWinners: KPWinner[];
  rules: RulesConfig;
  results: PayoutResults | null;
  xlsLoaded: boolean;
  /** Name of the optional entry-list file, if one was uploaded. */
  entryListFileName: string | null;
}

type Action =
  | { type: 'SET_ROUND'; payload: RoundInput }
  | { type: 'SET_XLS_DATA'; payload: { players: Player[]; openPlayPlayers: Player[]; slotTeams: SlotTeam[]; deuces: DeuceEntry[]; parPointWinners: ParPointWinner[]; kpWinners: KPWinner[]; kpHoles: string[] } }
  | { type: 'SET_PLAYERS'; payload: Player[] }
  | { type: 'SET_SLOT_TEAMS'; payload: SlotTeam[] }
  | { type: 'SET_DEUCES'; payload: DeuceEntry[] }
  | { type: 'SET_PAR_POINT_WINNERS'; payload: ParPointWinner[] }
  | { type: 'SET_KP_WINNERS'; payload: KPWinner[] }
  | { type: 'SET_RULES'; payload: RulesConfig }
  | { type: 'SET_RESULTS'; payload: PayoutResults }
  | { type: 'SET_ENTRY_LIST'; payload: { kpOnlyPlayers: KpOnlyPlayer[]; openPlayPlayers: KpOnlyPlayer[]; fileName: string } }
  | { type: 'CLEAR_ENTRY_LIST' }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'RESET' };

const initialState: WizardState = {
  currentStep: 1,
  round: { date: getPreviousSunday(), hasAce: false },
  players: [],
  openPlayPlayers: [],
  entryListOpenPlayPlayers: [],
  kpOnlyPlayers: [],
  slotTeams: [],
  deuces: [],
  parPointWinners: [],
  kpWinners: [],
  rules: DEFAULT_RULES,
  results: null,
  xlsLoaded: false,
  entryListFileName: null,
};

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'SET_ROUND':
      return { ...state, round: action.payload };
    case 'SET_XLS_DATA': {
      const realCount = action.payload.players.filter(p => !p.isPro).length;
      const defaultPlaces = getDefaultPlaces(realCount);
      // Use the KP holes detected in the file; fall back to the standard set.
      const kpHoles = action.payload.kpHoles.length > 0
        ? action.payload.kpHoles
        : state.rules.kpHoles;
      return {
        ...state,
        players: action.payload.players,
        openPlayPlayers: action.payload.openPlayPlayers,
        slotTeams: action.payload.slotTeams,
        deuces: action.payload.deuces,
        parPointWinners: action.payload.parPointWinners,
        kpWinners: action.payload.kpWinners,
        xlsLoaded: true,
        rules: { ...state.rules, splits: SPLIT_PRESETS[defaultPlaces], kpHoles },
      };
    }
    case 'SET_PLAYERS':
      return { ...state, players: action.payload };
    case 'SET_SLOT_TEAMS':
      return { ...state, slotTeams: action.payload };
    case 'SET_DEUCES':
      return { ...state, deuces: action.payload };
    case 'SET_PAR_POINT_WINNERS':
      return { ...state, parPointWinners: action.payload };
    case 'SET_KP_WINNERS':
      return { ...state, kpWinners: action.payload };
    case 'SET_RULES':
      return { ...state, rules: action.payload };
    case 'SET_RESULTS':
      return { ...state, results: action.payload };
    case 'SET_ENTRY_LIST':
      return {
        ...state,
        kpOnlyPlayers: action.payload.kpOnlyPlayers,
        entryListOpenPlayPlayers: action.payload.openPlayPlayers,
        entryListFileName: action.payload.fileName,
      };
    case 'CLEAR_ENTRY_LIST':
      return {
        ...state,
        kpOnlyPlayers: [],
        entryListOpenPlayPlayers: [],
        entryListFileName: null,
      };
    case 'GO_TO_STEP':
      return { ...state, currentStep: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const PayoutContext = createContext<{
  state: WizardState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function PayoutProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <PayoutContext.Provider value={{ state, dispatch }}>
      {children}
    </PayoutContext.Provider>
  );
}

export function usePayout() {
  const context = useContext(PayoutContext);
  if (!context) throw new Error('usePayout must be used within PayoutProvider');
  return context;
}
