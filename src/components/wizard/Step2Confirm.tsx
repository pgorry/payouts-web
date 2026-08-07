import { useState, useEffect, useRef } from 'react';
import { usePayout } from '@/context/PayoutContext';
import { calculatePayouts } from '@/lib/engine/calculate';
import { formatPlace } from '@/lib/format';
import { SPLIT_PRESETS, getDefaultPlaces } from '@/lib/rules/defaults';
import { PlacesInfoTooltip } from '@/components/shared/PlacesInfoTooltip';
import type { KPWinner } from '@/types';

interface KpRow {
  id: number;
  hole: string;
  player: string;
  prize?: 'cash' | 'balls';
}

export function Step2Confirm() {
  const { state, dispatch } = usePayout();
  const realPlayers = state.players.filter(p => !p.isPro);
  const proCount = state.players.filter(p => p.isPro).length;
  const openPlayPlayers = [...state.openPlayPlayers, ...state.entryListOpenPlayPlayers]
    .filter(p => !p.isPro);
  const { round } = state;
  const currentPlaces = state.rules.splits.length;
  const defaultPlaces = getDefaultPlaces(realPlayers.length);

  const [showKPs, setShowKPs] = useState(false);

  // KP state — one row per hole, with add/remove for weeks with extra KPs.
  const kpRowId = useRef(0);
  const [kpRows, setKpRows] = useState<KpRow[]>(() =>
    state.rules.kpHoles.map(hole => {
      const existing = state.kpWinners.find(kp => kp.hole === hole);
      return { id: kpRowId.current++, hole, player: existing?.player ?? '', prize: existing?.prize };
    })
  );
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [showAceSuggestions, setShowAceSuggestions] = useState(false);
  const [aceSearch, setAceSearch] = useState(round.aceWinner ?? '');

  // KP-only ($2) entrants can win KPs, so they belong in the autocomplete too.
  const kpOnlyPlayers = state.kpOnlyPlayers.filter(p => !p.isPro);
  const playerNames = [...realPlayers, ...openPlayPlayers, ...kpOnlyPlayers].map(p => p.name);

  const updateRow = (id: number, patch: Partial<KpRow>) =>
    setKpRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
  const addRow = () =>
    setKpRows(prev => [...prev, { id: kpRowId.current++, hole: '', player: '' }]);
  const removeRow = (id: number) =>
    setKpRows(prev => prev.filter(r => r.id !== id));

  const handleKPChange = (id: number, value: string) => {
    updateRow(id, { player: value });
    setActiveRow(id);
    setSuggestions(value.length > 0
      ? playerNames.filter(name => name.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
      : []);
  };

  const selectSuggestion = (id: number, name: string) => {
    updateRow(id, { player: name });
    setSuggestions([]);
    setActiveRow(null);
  };

  const handleAceSearch = (value: string) => {
    setAceSearch(value);
    dispatch({ type: 'SET_ROUND', payload: { ...round, hasAce: true, aceWinner: value } });
    setShowAceSuggestions(value.length > 0);
  };

  const selectAceWinner = (name: string) => {
    setAceSearch(name);
    dispatch({ type: 'SET_ROUND', payload: { ...round, hasAce: true, aceWinner: name } });
    setShowAceSuggestions(false);
  };

  // The ace pays out of the deuce pot. Full-competition and open-play ($5)
  // players both buy into it, so both are eligible; KP-only ($2) entrants don't.
  const acePlayerNames = [...realPlayers, ...openPlayPlayers].map(p => p.name);
  const aceSuggestions = acePlayerNames.filter(name =>
    name.toLowerCase().includes(aceSearch.toLowerCase())
  ).slice(0, 5);

  // Sync rows back into context: KP winners (rows with a name) and the hole list
  // (any row with a hole label, so empty holes still count as "no winner").
  useEffect(() => {
    const kpWinners: KPWinner[] = kpRows
      .filter(r => r.hole.trim() && r.player.trim())
      .map(r => ({ hole: r.hole.trim(), player: r.player.trim(), prize: r.prize }));
    dispatch({ type: 'SET_KP_WINNERS', payload: kpWinners });

    const kpHoles = kpRows.filter(r => r.hole.trim()).map(r => r.hole.trim());
    dispatch({ type: 'SET_RULES', payload: { ...state.rules, kpHoles } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kpRows]);

  const setPlaces = (n: number) => {
    dispatch({ type: 'SET_RULES', payload: { ...state.rules, splits: SPLIT_PRESETS[n] } });
  };

  const handleCalculate = () => {
    const results = calculatePayouts(
      {
        round: state.round,
        players: state.players,
        openPlayPlayers: [...state.openPlayPlayers, ...state.entryListOpenPlayPlayers],
        noSlotsPlayers: state.entryListNoSlotsPlayers,
        kpOnlyPlayers: state.kpOnlyPlayers,
        slotTeams: state.slotTeams,
        deuces: state.deuces,
        parPointWinners: state.parPointWinners,
        kpWinners: state.kpWinners,
      },
      state.rules,
    );
    dispatch({ type: 'SET_RESULTS', payload: results });
    dispatch({ type: 'GO_TO_STEP', payload: 3 });
  };

  const filledKPs = kpRows.filter(r => r.player.trim()).length;
  const totalKPs = kpRows.filter(r => r.hole.trim()).length;
  const cashCount = state.rules.kpCashCount;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-teal">Confirm & Calculate</h2>

      {/* Date */}
      <div className="bg-card rounded-xl p-4 border border-border space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-text-dim text-xs uppercase tracking-wide mb-1">Round Date</label>
            <input
              type="date"
              value={round.date}
              onChange={(e) =>
                dispatch({ type: 'SET_ROUND', payload: { ...round, date: e.target.value } })
              }
              className="w-full bg-background border border-border-accent rounded-lg px-4 py-2 text-text text-sm focus:outline-none focus:border-teal"
            />
          </div>
          <div>
            <span className="text-text-dim text-xs uppercase tracking-wide">Field</span>
            <div className="text-text font-medium mt-1">
              {realPlayers.length} players
              {openPlayPlayers.length > 0 && ` + ${openPlayPlayers.length} deuce+KP`}
              {state.kpOnlyPlayers.filter(p => !p.isPro).length > 0 &&
                ` + ${state.kpOnlyPlayers.filter(p => !p.isPro).length} KP only`}
              {proCount > 0 && ` + ${proCount} pros`}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-card rounded-xl p-4 border border-border space-y-3 text-sm">
        <div className="text-text-muted">
          Slots: {state.slotTeams.slice(0, currentPlaces).map(t =>
            `#${t.place} ${t.players.map(p => p.name.split(', ')[0]).join('/')}`
          ).join(' • ')}
        </div>
        <div className="text-text-muted">
          Par Points: {state.parPointWinners.slice(0, currentPlaces).map((w, i) =>
            `${formatPlace(i + 1)} ${w.player}`
          ).join(' • ')}
        </div>
        <div className="text-text-muted">
          Deuces: {state.deuces.length > 0
            ? state.deuces.map(d => `${d.player}${d.instances > 1 ? ` x${d.instances}` : ''}`).join(', ')
            : 'None'}
        </div>
      </div>

      {/* Places to Pay */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-text-dim text-xs uppercase tracking-wide">Places to Pay</span>
            <span className="text-text-dim text-xs">
              (default: {defaultPlaces} for {realPlayers.length} players)
            </span>
            <PlacesInfoTooltip />
          </div>
          <div className="flex gap-1">
            {[2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setPlaces(n)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  currentPlaces === n
                    ? 'bg-teal text-background'
                    : 'bg-card-highlight text-text-muted hover:text-text border border-border-accent'
                }`}
              >
                Top {n}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-1 text-text-dim text-xs">
          Split: {state.rules.splits.join(' / ')}%
        </div>
      </div>

      {/* KP & Ace Section (collapsible) */}
      <div className="bg-card rounded-xl border border-border">
        <button
          onClick={() => setShowKPs(!showKPs)}
          className="w-full flex items-center justify-between p-4 hover:bg-card-highlight transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-text">KP Winners & Ace</span>
            <span className="text-text-dim text-xs">
              {filledKPs}/{totalKPs} entered
              {round.hasAce && ' • Ace'}
            </span>
          </div>
          <span className="text-text-dim text-sm">{showKPs ? '▲' : '▼'}</span>
        </button>

        {showKPs && (
          <div className="border-t border-border p-4 space-y-4">
            {/* Ace */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide">Ace</h4>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    dispatch({ type: 'SET_ROUND', payload: { ...round, hasAce: false, aceWinner: undefined } });
                    setAceSearch('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    !round.hasAce
                      ? 'bg-teal text-background'
                      : 'bg-card-highlight border border-border-accent text-text-muted'
                  }`}
                >
                  No Ace
                </button>
                <button
                  onClick={() => dispatch({ type: 'SET_ROUND', payload: { ...round, hasAce: true } })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    round.hasAce
                      ? 'bg-red text-white'
                      : 'bg-card-highlight border border-border-accent text-text-muted'
                  }`}
                >
                  Ace!
                </button>
              </div>
              {round.hasAce && (
                <div className="relative">
                  <input
                    type="text"
                    value={aceSearch}
                    onChange={(e) => handleAceSearch(e.target.value)}
                    onFocus={() => aceSearch.length > 0 && setShowAceSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowAceSuggestions(false), 200)}
                    placeholder="Ace winner..."
                    className="w-full bg-background border border-border-accent rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-teal"
                  />
                  {showAceSuggestions && aceSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-card border border-border-accent rounded-lg shadow-lg overflow-hidden">
                      {aceSuggestions.map((name) => (
                        <button
                          key={name}
                          onMouseDown={() => selectAceWinner(name)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-card-highlight text-text"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* KP Holes */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Closest to Pin
              </h4>
              <p className="text-text-dim text-xs">Leave a name blank if no winner — money goes back to pot</p>
              {filledKPs > cashCount && (
                <p className="text-teal text-xs">
                  {cashCount} cash prizes available — the extra {filledKPs - cashCount} KP
                  {filledKPs - cashCount > 1 ? 's go' : ' goes'} to a sleeve of balls.
                  Pick who gets balls on the results screen.
                </p>
              )}
              <div className="space-y-2">
                {kpRows.map((row) => (
                  <div key={row.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={row.hole}
                      onChange={(e) => updateRow(row.id, { hole: e.target.value })}
                      placeholder="#5"
                      className="w-16 shrink-0 bg-background border border-border-accent rounded-lg px-2 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-teal"
                    />
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={row.player}
                        onChange={(e) => handleKPChange(row.id, e.target.value)}
                        onFocus={() => setActiveRow(row.id)}
                        onBlur={() => setTimeout(() => { setActiveRow(null); setSuggestions([]); }, 200)}
                        placeholder="Player name"
                        className="w-full bg-background border border-border-accent rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-teal"
                      />
                      {activeRow === row.id && suggestions.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-card border border-border-accent rounded-lg shadow-lg overflow-hidden">
                          {suggestions.map((name) => (
                            <button
                              key={name}
                              onMouseDown={() => selectSuggestion(row.id, name)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-card-highlight text-text"
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeRow(row.id)}
                      title="Remove KP"
                      className="shrink-0 px-2 py-2 text-text-dim hover:text-red transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addRow} className="text-teal text-sm font-medium hover:text-teal/80">
                + Add KP
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 1 })}
          className="bg-card border border-border-accent text-text-muted font-medium px-6 py-3 rounded-lg hover:border-teal/50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleCalculate}
          className="bg-emerald text-background font-bold px-8 py-3 rounded-lg hover:bg-emerald/90 transition-colors text-lg"
        >
          Calculate Payouts
        </button>
      </div>
    </div>
  );
}
