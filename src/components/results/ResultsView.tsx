import { useRef, useState, useEffect } from 'react';
import { usePayout } from '@/context/PayoutContext';
import { PayoutsCard } from './PayoutsCard';
import { SummaryCard } from './SummaryCard';
import { ChargesCard } from './ChargesCard';
import { ChargesOnlyCard } from './ChargesOnlyCard';
import { PaymentsOnlyCard } from './PaymentsOnlyCard';
import { PlacesInfoTooltip } from '@/components/shared/PlacesInfoTooltip';
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
type ProShopMode = 'combined' | 'charges' | 'payments';

interface KpEditRow {
  id: number;
  hole: string;
  player: string;
  prize?: 'cash' | 'balls';
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'details', label: 'For Pro Shop' },
  { key: 'payouts', label: 'For Members' },
  { key: 'summary', label: 'For Exec' },
];

const PRO_SHOP_MODES: { key: ProShopMode; label: string }[] = [
  { key: 'combined', label: 'Combined' },
  { key: 'charges', label: 'Charges Only' },
  { key: 'payments', label: 'Payments Only' },
];

export function ResultsView() {
  const { state, dispatch } = usePayout();
  const payoutsRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const chargesRef = useRef<HTMLDivElement>(null);
  const chargesOnlyRef = useRef<HTMLDivElement>(null);
  const paymentsOnlyRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [proShopMode, setProShopMode] = useState<ProShopMode>('combined');
  const [showKPEditor, setShowKPEditor] = useState(false);
  const [kpRows, setKpRows] = useState<KpEditRow[]>([]);
  const [kpSuggestions, setKpSuggestions] = useState<string[]>([]);
  const [kpActiveRow, setKpActiveRow] = useState<number | null>(null);
  const kpRowId = useRef(0);

  const playerNames = state.players.filter(p => !p.isPro).map(p => p.name);

  // Re-seed the editor rows from current state each time it's opened.
  useEffect(() => {
    if (!showKPEditor) return;
    setKpRows(state.rules.kpHoles.map(hole => {
      const existing = state.kpWinners.find(kp => kp.hole === hole);
      return { id: kpRowId.current++, hole, player: existing?.player ?? '', prize: existing?.prize };
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showKPEditor]);

  const updateKpRow = (id: number, patch: Partial<KpEditRow>) =>
    setKpRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
  const addKpRow = () =>
    setKpRows(prev => [...prev, { id: kpRowId.current++, hole: '', player: '' }]);
  const removeKpRow = (id: number) =>
    setKpRows(prev => prev.filter(r => r.id !== id));

  const handleKPChange = (id: number, value: string) => {
    updateKpRow(id, { player: value });
    setKpActiveRow(id);
    setKpSuggestions(value.length > 0
      ? playerNames.filter(n => n.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
      : []);
  };

  const selectKPSuggestion = (id: number, name: string) => {
    updateKpRow(id, { player: name });
    setKpSuggestions([]);
    setKpActiveRow(null);
  };

  const saveKPs = () => {
    const rows = kpRows.filter(r => r.hole.trim());
    const kpWinners: KPWinner[] = rows
      .filter(r => r.player.trim())
      .map(r => ({ hole: r.hole.trim(), player: r.player.trim(), prize: r.prize }));
    const newRules = { ...state.rules, kpHoles: rows.map(r => r.hole.trim()) };
    dispatch({ type: 'SET_KP_WINNERS', payload: kpWinners });
    dispatch({ type: 'SET_RULES', payload: newRules });

    // Recalculate with updated KPs
    const results = calculatePayouts(
      {
        round: state.round,
        players: state.players,
        openPlayPlayers: [...state.openPlayPlayers, ...state.entryListOpenPlayPlayers],
        kpOnlyPlayers: state.kpOnlyPlayers,
        slotTeams: state.slotTeams,
        deuces: state.deuces,
        parPointWinners: state.parPointWinners,
        kpWinners,
      },
      newRules,
    );
    dispatch({ type: 'SET_RESULTS', payload: results });
    setShowKPEditor(false);
  };

  if (!state.results) return null;

  const currentPlaces = state.rules.splits.length;
  const dateStr = state.results.date;

  // KP allocation summary for the bar / editor (derived from computed results).
  const kpResults = state.results.kps;
  const cashKps = kpResults.filter(k => k.prize === 'cash' && !k.pending);
  const ballsKps = kpResults.filter(k => k.prize === 'balls');
  const pendingKps = kpResults.filter(k => k.pending);

  const recalculate = (places: number) => {
    const newRules = { ...state.rules, splits: SPLIT_PRESETS[places] };
    dispatch({ type: 'SET_RULES', payload: newRules });
    const results = calculatePayouts(
      {
        round: state.round,
        players: state.players,
        openPlayPlayers: [...state.openPlayPlayers, ...state.entryListOpenPlayPlayers],
        kpOnlyPlayers: state.kpOnlyPlayers,
        slotTeams: state.slotTeams,
        deuces: state.deuces,
        parPointWinners: state.parPointWinners,
        kpWinners: state.kpWinners,
      },
      newRules,
    );
    dispatch({ type: 'SET_RESULTS', payload: results });
  };

  const proShopRef = proShopMode === 'combined' ? chargesRef : proShopMode === 'charges' ? chargesOnlyRef : paymentsOnlyRef;
  const proShopFilename = proShopMode === 'combined'
    ? `charges-payouts-${dateStr}.png`
    : proShopMode === 'charges'
      ? `charges-only-${dateStr}.png`
      : `payments-only-${dateStr}.png`;

  const activeRef = activeTab === 'details' ? proShopRef : activeTab === 'payouts' ? summaryRef : payoutsRef;
  const activeFilename = activeTab === 'details' ? proShopFilename : activeTab === 'payouts' ? `summary-${dateStr}.png` : `payouts-${dateStr}.png`;

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
            <PlacesInfoTooltip />
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

      {/* KP allocation bar */}
      {!showKPEditor && (
        <div className={`rounded-lg px-4 py-3 flex items-center justify-between border ${
          pendingKps.length > 0 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-card border-border'
        }`}>
          <span className={`text-sm ${pendingKps.length > 0 ? 'text-orange-400' : 'text-text-muted'}`}>
            KPs: {cashKps.length} cash
            {ballsKps.length > 0 && <> · {ballsKps.length} sleeve{ballsKps.length > 1 ? 's' : ''} of balls ({ballsKps.map(k => k.player.split(', ')[0]).join(', ')})</>}
            {pendingKps.length > 0 && <> · {pendingKps.length} missing ({pendingKps.map(k => k.hole).join(', ')}) — money returned to pot</>}
          </span>
          <button
            onClick={() => setShowKPEditor(true)}
            className="text-teal text-sm font-medium hover:text-teal/80 underline shrink-0 ml-3"
          >
            Edit KPs
          </button>
        </div>
      )}

      {/* KP Editor */}
      {showKPEditor && (
        <div className="bg-card rounded-xl border border-teal/30 p-4 space-y-3">
          <h4 className="text-sm font-medium text-text uppercase tracking-wide">Edit KP Winners</h4>
          <p className="text-text-dim text-xs">
            {state.rules.kpCashCount} cash prizes available — any extra KP winners get a sleeve of balls (no cash, no effect on payouts).
            Blank winner = no winner, money returns to pot.
          </p>
          <div className="space-y-2">
            {kpRows.map((row) => {
              const hasPlayer = !!row.player.trim();
              const computed = state.results?.kps.find(k => k.hole === row.hole && !k.pending)?.prize;
              const effectivePrize = row.prize ?? computed ?? 'cash';
              return (
                <div key={row.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row.hole}
                    onChange={(e) => updateKpRow(row.id, { hole: e.target.value })}
                    placeholder="#5"
                    className="w-16 shrink-0 bg-background border border-border-accent rounded-lg px-2 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-teal"
                  />
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={row.player}
                      onChange={(e) => handleKPChange(row.id, e.target.value)}
                      onFocus={() => setKpActiveRow(row.id)}
                      onBlur={() => setTimeout(() => { setKpActiveRow(null); setKpSuggestions([]); }, 200)}
                      placeholder="Player name"
                      className="w-full bg-background border border-border-accent rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-teal"
                    />
                    {kpActiveRow === row.id && kpSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-card border border-border-accent rounded-lg shadow-lg overflow-hidden">
                        {kpSuggestions.map((name) => (
                          <button
                            key={name}
                            onMouseDown={() => selectKPSuggestion(row.id, name)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-card-highlight text-text"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {hasPlayer ? (
                    <div className="flex shrink-0 rounded-lg overflow-hidden border border-border-accent">
                      <button
                        onClick={() => updateKpRow(row.id, { prize: 'cash' })}
                        className={`px-3 py-2 text-xs font-medium transition-colors ${
                          effectivePrize === 'cash' ? 'bg-emerald text-background' : 'text-text-muted hover:text-text'
                        }`}
                      >
                        Cash
                      </button>
                      <button
                        onClick={() => updateKpRow(row.id, { prize: 'balls' })}
                        className={`px-3 py-2 text-xs font-medium transition-colors ${
                          effectivePrize === 'balls' ? 'bg-amber text-background' : 'text-text-muted hover:text-text'
                        }`}
                      >
                        Balls
                      </button>
                    </div>
                  ) : (
                    <div className="shrink-0 w-[88px]" />
                  )}
                  <button
                    onClick={() => removeKpRow(row.id)}
                    title="Remove KP"
                    className="shrink-0 px-2 py-2 text-text-dim hover:text-red transition-colors"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
          <button onClick={addKpRow} className="text-teal text-sm font-medium hover:text-teal/80">
            + Add KP
          </button>
          <div className="flex gap-2 pt-1">
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
      <div className="mt-4 space-y-4">
        {activeTab === 'details' && (
          <>
            <div className="flex gap-1 bg-card rounded-lg p-1 border border-border w-fit">
              {PRO_SHOP_MODES.map(mode => (
                <button
                  key={mode.key}
                  onClick={() => setProShopMode(mode.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    proShopMode === mode.key
                      ? 'bg-teal text-background'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            {proShopMode === 'combined' && <ChargesCard ref={chargesRef} results={state.results} />}
            {proShopMode === 'charges' && <ChargesOnlyCard ref={chargesOnlyRef} results={state.results} />}
            {proShopMode === 'payments' && <PaymentsOnlyCard ref={paymentsOnlyRef} results={state.results} />}
          </>
        )}
        {activeTab === 'payouts' && <SummaryCard ref={summaryRef} results={state.results} />}
        {activeTab === 'summary' && <PayoutsCard ref={payoutsRef} results={state.results} />}
      </div>
    </div>
  );
}
