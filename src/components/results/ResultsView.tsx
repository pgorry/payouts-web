import { useRef, useState, useEffect } from 'react';
import { usePayout } from '@/context/PayoutContext';
import { PayoutsCard } from './PayoutsCard';
import { SummaryCard } from './SummaryCard';
import { ChargesCard } from './ChargesCard';
import { exportCardAsPNG, copyCardToClipboard } from '@/lib/pngExport';
import { formatDate } from '@/lib/format';
import { calculatePayouts } from '@/lib/engine/calculate';
import { SPLIT_PRESETS } from '@/lib/rules/defaults';
import type { KPWinner } from '@/types';

function buildGmailLink(dateStr: string): string {
  const formattedDate = formatDate(dateStr);
  const to = 'dbyrne@universitygolf.com';
  const cc = [
    'derrick.horne@gmail.com',
    'fritzkeswick@yahoo.ca',
    'mark.ellis1@hotmail.com',
  ].join(',');
  const subject = `UGC Mens Club Payouts - ${formattedDate}`;
  const body = `Hi all,\n\nPlease find the payouts for ${formattedDate} attached.\n\nThanks`;

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&cc=${encodeURIComponent(cc)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function CopyButton({ elementRef }: { elementRef: React.RefObject<HTMLDivElement | null> }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        if (!elementRef.current) return;
        await copyCardToClipboard(elementRef.current);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="bg-teal/10 text-teal border border-teal/30 font-medium px-4 py-2 rounded-lg hover:bg-teal/20 transition-colors text-sm"
    >
      {copied ? '✓ Copied' : '📋 Copy'}
    </button>
  );
}

type Tab = 'details' | 'payouts' | 'summary';

const TABS: { key: Tab; label: string }[] = [
  { key: 'details', label: 'For Pro Shop' },
  { key: 'payouts', label: 'For Members' },
  { key: 'summary', label: 'For Exec' },
];

export function ResultsView() {
  const { state, dispatch } = usePayout();
  const payoutsRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const chargesRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [showKPEditor, setShowKPEditor] = useState(false);
  const [kpEntries, setKpEntries] = useState<Record<string, string>>({});
  const [kpSuggestions, setKpSuggestions] = useState<string[]>([]);
  const [kpActiveHole, setKpActiveHole] = useState<string | null>(null);

  const holes = state.rules.kpHoles;
  const playerNames = state.players.filter(p => !p.isPro).map(p => p.name);
  const missingKPs = holes.filter(h => !state.kpWinners.find(kp => kp.hole === h && kp.player));

  // Init KP entries from state
  useEffect(() => {
    const entries: Record<string, string> = {};
    for (const hole of holes) {
      const existing = state.kpWinners.find(kp => kp.hole === hole);
      entries[hole] = existing?.player ?? '';
    }
    setKpEntries(entries);
  }, []);

  const handleKPChange = (hole: string, value: string) => {
    setKpEntries(prev => ({ ...prev, [hole]: value }));
    setKpActiveHole(hole);
    if (value.length > 0) {
      setKpSuggestions(playerNames.filter(name =>
        name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5));
    } else {
      setKpSuggestions([]);
    }
  };

  const selectKPSuggestion = (hole: string, name: string) => {
    setKpEntries(prev => ({ ...prev, [hole]: name }));
    setKpSuggestions([]);
    setKpActiveHole(null);
  };

  const saveKPs = () => {
    const kpWinners: KPWinner[] = holes
      .filter(hole => kpEntries[hole]?.trim())
      .map(hole => ({ hole, player: kpEntries[hole].trim() }));
    dispatch({ type: 'SET_KP_WINNERS', payload: kpWinners });

    // Recalculate with updated KPs
    const results = calculatePayouts(
      {
        round: state.round,
        players: state.players,
        slotTeams: state.slotTeams,
        deuces: state.deuces,
        parPointWinners: state.parPointWinners,
        kpWinners,
      },
      state.rules,
    );
    dispatch({ type: 'SET_RESULTS', payload: results });
    setShowKPEditor(false);
  };

  if (!state.results) return null;

  const currentPlaces = state.rules.splits.length;
  const dateStr = state.results.date;

  const recalculate = (places: number) => {
    const newRules = { ...state.rules, splits: SPLIT_PRESETS[places] };
    dispatch({ type: 'SET_RULES', payload: newRules });
    const results = calculatePayouts(
      {
        round: state.round,
        players: state.players,
        slotTeams: state.slotTeams,
        deuces: state.deuces,
        parPointWinners: state.parPointWinners,
        kpWinners: state.kpWinners,
      },
      newRules,
    );
    dispatch({ type: 'SET_RESULTS', payload: results });
  };

  const activeRef = activeTab === 'details' ? chargesRef : activeTab === 'payouts' ? summaryRef : payoutsRef;
  const activeFilename = activeTab === 'details' ? `charges-${dateStr}.png` : activeTab === 'payouts' ? `summary-${dateStr}.png` : `payouts-${dateStr}.png`;

  return (
    <div>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background pb-4 space-y-4">
        {/* Top row: title, places toggle, actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-teal">Results</h2>
            <div className="flex items-center gap-1 bg-card rounded-lg p-1 border border-border">
              {[2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => recalculate(n)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    currentPlaces === n
                      ? 'bg-teal text-background'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  Top {n}
                </button>
              ))}
            </div>
            <span className="text-text-dim text-xs">{state.rules.splits.join('/')}%</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={buildGmailLink(dateStr)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-teal/10 text-teal border border-teal/30 font-medium px-4 py-2 rounded-lg hover:bg-teal/20 transition-colors text-sm inline-flex items-center gap-2"
            >
              ✉️ Email Payouts
            </a>
            <button
              onClick={() => dispatch({ type: 'RESET' })}
              className="bg-card border border-border-accent text-text-muted font-medium px-4 py-2 rounded-lg hover:border-teal/50 transition-colors text-sm"
            >
              Start New Round
            </button>
          </div>
        </div>

        {/* Tabs + copy/download for active tab */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-card rounded-lg p-1 border border-border">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-teal text-background'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <CopyButton elementRef={activeRef} />
            <button
              onClick={() => activeRef.current && exportCardAsPNG(activeRef.current, activeFilename)}
              className="bg-teal/10 text-teal border border-teal/30 font-medium px-4 py-2 rounded-lg hover:bg-teal/20 transition-colors text-sm"
            >
              📥 Download
            </button>
          </div>
        </div>
      </div>

      {/* KP Banner */}
      {missingKPs.length > 0 && !showKPEditor && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-orange-400 text-sm">
            {missingKPs.length} KP winner{missingKPs.length > 1 ? 's' : ''} missing ({missingKPs.join(', ')}) — money returned to pot
          </span>
          <button
            onClick={() => setShowKPEditor(true)}
            className="text-orange-400 text-sm font-medium hover:text-orange-300 underline"
          >
            Edit KPs
          </button>
        </div>
      )}

      {/* KP Editor */}
      {showKPEditor && (
        <div className="bg-card rounded-xl border border-orange-500/30 p-4 space-y-3">
          <h4 className="text-sm font-medium text-text uppercase tracking-wide">Edit KP Winners</h4>
          <p className="text-text-dim text-xs">Leave blank if no winner — money goes back to pot</p>
          <div className="grid grid-cols-2 gap-3">
            {holes.map((hole) => (
              <div key={hole} className="relative">
                <label className="block text-xs text-text-dim mb-1">Hole {hole}</label>
                <input
                  type="text"
                  value={kpEntries[hole] ?? ''}
                  onChange={(e) => handleKPChange(hole, e.target.value)}
                  onFocus={() => setKpActiveHole(hole)}
                  onBlur={() => setTimeout(() => { setKpActiveHole(null); setKpSuggestions([]); }, 200)}
                  placeholder="Player name"
                  className="w-full bg-background border border-border-accent rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-teal"
                />
                {kpActiveHole === hole && kpSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-card border border-border-accent rounded-lg shadow-lg overflow-hidden">
                    {kpSuggestions.map((name) => (
                      <button
                        key={name}
                        onMouseDown={() => selectKPSuggestion(hole, name)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-card-highlight text-text"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveKPs}
              className="bg-teal text-background font-medium px-4 py-2 rounded-lg hover:bg-teal/90 text-sm"
            >
              Save & Recalculate
            </button>
            <button
              onClick={() => setShowKPEditor(false)}
              className="bg-card border border-border-accent text-text-muted font-medium px-4 py-2 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === 'details' && <ChargesCard ref={chargesRef} results={state.results} />}
        {activeTab === 'payouts' && <SummaryCard ref={summaryRef} results={state.results} />}
        {activeTab === 'summary' && <PayoutsCard ref={payoutsRef} results={state.results} />}
      </div>
    </div>
  );
}
