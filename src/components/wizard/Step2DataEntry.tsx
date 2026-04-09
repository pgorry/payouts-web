import { useState } from 'react';
import { usePayout } from '@/context/PayoutContext';
import { FileDropZone } from '@/components/shared/FileDropZone';
import { parseLeagueXLS } from '@/lib/parser/xlsParser';

export function Step2DataEntry() {
  const { state, dispatch } = usePayout();
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleFileLoaded = (buffer: ArrayBuffer, fileName: string) => {
    try {
      setError(null);
      const parsed = parseLeagueXLS(buffer);

      const realPlayers = parsed.players.filter(p => !p.isPro);
      const proCount = parsed.players.filter(p => p.isPro).length;

      dispatch({
        type: 'SET_XLS_DATA',
        payload: {
          players: parsed.players,
          slotTeams: parsed.slotTeams,
          deuces: parsed.deuces,
          parPointWinners: parsed.parPointWinners,
        },
      });

      const parts = [
        `${realPlayers.length} players`,
        proCount > 0 ? `${proCount} pros` : '',
        `${parsed.slotTeams.length} slot teams`,
        `${parsed.deuces.length} deuce winners`,
        `${parsed.parPointWinners.length} par point leaders`,
      ].filter(Boolean);

      setSummary(`Loaded ${fileName}: ${parts.join(', ')}`);
    } catch (err) {
      setError(`Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-teal">Upload League Data</h2>
      <p className="text-text-muted">
        Upload the XLS file exported from the league system. Player data, slots, par points, and deuces will be auto-extracted.
      </p>

      <FileDropZone onFileLoaded={handleFileLoaded} />

      <div className="flex items-center gap-3">
        <a
          href="https://www.golfgenius.com/leagues/11530790049666839684/rounds/12429475748304139773/v2tournaments"
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal text-sm hover:underline"
        >
          Open Golf Genius Leaderboard
        </a>
        <button
          onClick={() => setShowHelp(h => !h)}
          className="text-text-dim text-sm hover:text-teal transition-colors"
        >
          {showHelp ? 'Hide help' : 'How to export XLS?'}
        </button>
      </div>

      {showHelp && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <img
            src="export-help.png"
            alt="How to export XLS from Golf Genius: click Re-score/Print/Adjust Leaderboard, then Export XLS"
            className="w-full"
          />
        </div>
      )}

      {error && (
        <div className="bg-red/10 border border-red/30 rounded-lg px-4 py-3 text-red">
          {error}
        </div>
      )}

      {summary && (
        <div className="bg-emerald/10 border border-emerald/30 rounded-lg px-4 py-3 text-emerald">
          {summary}
        </div>
      )}

      {state.xlsLoaded && (
        <div className="bg-card rounded-xl p-4 space-y-3 border border-border">
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wide">Extracted Data</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-card-highlight rounded-lg p-3">
              <div className="text-teal font-semibold text-lg">{state.players.filter(p => !p.isPro).length}</div>
              <div className="text-text-muted">Players</div>
            </div>
            <div className="bg-card-highlight rounded-lg p-3">
              <div className="text-teal font-semibold text-lg">{state.slotTeams.length}</div>
              <div className="text-text-muted">Slot Teams</div>
            </div>
            <div className="bg-card-highlight rounded-lg p-3">
              <div className="text-teal font-semibold text-lg">{state.deuces.reduce((s, d) => s + d.instances, 0)}</div>
              <div className="text-text-muted">Deuces</div>
            </div>
            <div className="bg-card-highlight rounded-lg p-3">
              <div className="text-teal font-semibold text-lg">
                {state.parPointWinners[0]?.player.split(', ')[0] ?? '—'}
              </div>
              <div className="text-text-muted">Par Points Leader</div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 2 })}
        disabled={!state.xlsLoaded && state.players.length === 0}
        className="bg-teal text-background font-semibold px-6 py-3 rounded-lg hover:bg-teal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </div>
  );
}
