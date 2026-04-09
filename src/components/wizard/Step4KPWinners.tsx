import { useState, useEffect } from 'react';
import { usePayout } from '@/context/PayoutContext';
import type { KPWinner } from '@/types';

export function Step4KPWinners() {
  const { state, dispatch } = usePayout();
  const { round } = state;
  const holes = state.rules.kpHoles;

  const [kpEntries, setKpEntries] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const hole of holes) {
      const existing = state.kpWinners.find(kp => kp.hole === hole);
      initial[hole] = existing?.player ?? '';
    }
    return initial;
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeHole, setActiveHole] = useState<string | null>(null);
  const [showAceSuggestions, setShowAceSuggestions] = useState(false);
  const [aceSearch, setAceSearch] = useState(round.aceWinner ?? '');

  const playerNames = state.players.filter(p => !p.isPro).map(p => p.name);

  const handleChange = (hole: string, value: string) => {
    setKpEntries(prev => ({ ...prev, [hole]: value }));
    setActiveHole(hole);
    if (value.length > 0) {
      const filtered = playerNames.filter(name =>
        name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (hole: string, name: string) => {
    setKpEntries(prev => ({ ...prev, [hole]: name }));
    setSuggestions([]);
    setActiveHole(null);
  };

  const handleAceSearch = (value: string) => {
    setAceSearch(value);
    dispatch({ type: 'SET_ROUND', payload: { ...round, hasAce: true, aceWinner: value } });
    if (value.length > 0) {
      setShowAceSuggestions(true);
    } else {
      setShowAceSuggestions(false);
    }
  };

  const selectAceWinner = (name: string) => {
    setAceSearch(name);
    dispatch({ type: 'SET_ROUND', payload: { ...round, hasAce: true, aceWinner: name } });
    setShowAceSuggestions(false);
  };

  const aceSuggestions = playerNames.filter(name =>
    name.toLowerCase().includes(aceSearch.toLowerCase())
  ).slice(0, 5);

  useEffect(() => {
    const kpWinners: KPWinner[] = holes
      .filter(hole => kpEntries[hole]?.trim())
      .map(hole => ({ hole, player: kpEntries[hole].trim() }));
    dispatch({ type: 'SET_KP_WINNERS', payload: kpWinners });
  }, [kpEntries, holes, dispatch]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-teal">KP Winners & Ace</h2>

      {/* Ace Section */}
      <div className="bg-card rounded-xl p-5 border border-border space-y-4">
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wide">
          Ace (Hole-in-One)
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              dispatch({ type: 'SET_ROUND', payload: { ...round, hasAce: false, aceWinner: undefined } });
              setAceSearch('');
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !round.hasAce
                ? 'bg-teal text-background'
                : 'bg-card-highlight border border-border-accent text-text-muted hover:border-teal/50'
            }`}
          >
            No Ace
          </button>
          <button
            onClick={() =>
              dispatch({ type: 'SET_ROUND', payload: { ...round, hasAce: true } })
            }
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              round.hasAce
                ? 'bg-red text-white'
                : 'bg-card-highlight border border-border-accent text-text-muted hover:border-red/50'
            }`}
          >
            🏌️ Ace!
          </button>
        </div>

        {round.hasAce && (
          <div className="relative">
            <label className="block text-sm font-medium text-text-muted mb-1">
              Ace Winner
            </label>
            <input
              type="text"
              value={aceSearch}
              onChange={(e) => handleAceSearch(e.target.value)}
              onFocus={() => aceSearch.length > 0 && setShowAceSuggestions(true)}
              onBlur={() => setTimeout(() => setShowAceSuggestions(false), 200)}
              placeholder="Start typing to search players..."
              className="w-full bg-background border border-border-accent rounded-lg px-4 py-3 text-text placeholder:text-text-dim focus:outline-none focus:border-teal"
            />
            {showAceSuggestions && aceSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-card border border-border-accent rounded-lg shadow-lg overflow-hidden">
                {aceSuggestions.map((name) => (
                  <button
                    key={name}
                    onMouseDown={() => selectAceWinner(name)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-card-highlight text-text"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* KP Section */}
      <p className="text-text-muted">
        Enter the Closest to Pin winners for each hole. Leave blank if no one won (money goes back to pot).
      </p>

      <div className="space-y-4">
        {holes.map((hole) => (
          <div key={hole} className="relative">
            <label className="block text-sm font-medium text-text-muted mb-1">
              Hole {hole}
            </label>
            <input
              type="text"
              value={kpEntries[hole] ?? ''}
              onChange={(e) => handleChange(hole, e.target.value)}
              onFocus={() => setActiveHole(hole)}
              onBlur={() => setTimeout(() => { setActiveHole(null); setSuggestions([]); }, 200)}
              placeholder="Player name (leave blank if no winner)"
              className="w-full bg-card border border-border-accent rounded-lg px-4 py-3 text-text placeholder:text-text-dim focus:outline-none focus:border-teal"
            />
            {activeHole === hole && suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-card border border-border-accent rounded-lg shadow-lg overflow-hidden">
                {suggestions.map((name) => (
                  <button
                    key={name}
                    onMouseDown={() => selectSuggestion(hole, name)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-card-highlight text-text"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {Object.values(kpEntries).some(v => !v.trim()) && (
        <div className="bg-teal/10 border border-teal/30 rounded-lg px-4 py-3 text-teal text-sm">
          Empty KP slots = no winner — that money goes back into the slots/par points pool
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 3 })}
          className="bg-card border border-border-accent text-text-muted font-medium px-6 py-3 rounded-lg hover:border-teal/50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 5 })}
          className="bg-teal text-background font-semibold px-6 py-3 rounded-lg hover:bg-teal/90 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
