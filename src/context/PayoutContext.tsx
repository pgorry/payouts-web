import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type {
  RoundInput,
  Player,
  SlotTeam,
  DeuceEntry,
  ParPointWinner,
  KPWinner,
  RulesConfig,
  PayoutResults,
} from '@/types';
import { DEFAULT_RULES } from '@/lib/rules/defaults';

export interface WizardState {
  currentStep: number;
  round: RoundInput;
  players: Player[];
  slotTeams: SlotTeam[];
  deuces: DeuceEntry[];
  parPointWinners: ParPointWinner[];
  kpWinners: KPWinner[];
  rules: RulesConfig;
  results: PayoutResults | null;
  xlsLoaded: boolean;
}

type Action =
  | { type: 'SET_ROUND'; payload: RoundInput }
  | { type: 'SET_XLS_DATA'; payload: { players: Player[]; slotTeams: SlotTeam[]; deuces: DeuceEntry[]; parPointWinners: ParPointWinner[] } }
  | { type: 'SET_PLAYERS'; payload: Player[] }
  | { type: 'SET_SLOT_TEAMS'; payload: SlotTeam[] }
  | { type: 'SET_DEUCES'; payload: DeuceEntry[] }
  | { type: 'SET_PAR_POINT_WINNERS'; payload: ParPointWinner[] }
  | { type: 'SET_KP_WINNERS'; payload: KPWinner[] }
  | { type: 'SET_RULES'; payload: RulesConfig }
  | { type: 'SET_RESULTS'; payload: PayoutResults }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'RESET' };

const initialState: WizardState = {
  currentStep: 1,
  round: { date: new Date().toISOString().split('T')[0], hasAce: false },
  players: [],
  slotTeams: [],
  deuces: [],
  parPointWinners: [],
  kpWinners: [],
  rules: DEFAULT_RULES,
  results: null,
  xlsLoaded: false,
};

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'SET_ROUND':
      return { ...state, round: action.payload };
    case 'SET_XLS_DATA':
      return {
        ...state,
        players: action.payload.players,
        slotTeams: action.payload.slotTeams,
        deuces: action.payload.deuces,
        parPointWinners: action.payload.parPointWinners,
        xlsLoaded: true,
      };
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
