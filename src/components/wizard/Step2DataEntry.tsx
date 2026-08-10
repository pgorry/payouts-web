import { useState } from 'react';
import { usePayout } from '@/context/PayoutContext';
import { FileDropZone } from '@/components/shared/FileDropZone';
import { parseLeagueXLS } from '@/lib/parser/xlsParser';
import { parseEntryListXLS, type ParsedEntryList } from '@/lib/parser/entryListParser';
import { formatCurrency } from '@/lib/format';

export function Step2DataEntry() {
  const { state, dispatch } = usePayout();
  const { rules } = state;
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const [entryList, setEntryList] = useState<ParsedEntryList | null>(null);
  const [entryListError, setEntryListError] = useState<string | null>(null);

  const handleEntryListLoaded = (buffer: ArrayBuffer, fileName: string) => {
    try {
      const parsed = parseEntryListXLS(
        buffer,
        rules.entryFee,
        rules.kpOnlyEntryFee,
        rules.openPlayEntryFee,
        rules.noSlotsEntryFee,
      );
      setEntryList(parsed);
      setEntryListError(null);
      dispatch({
        type: 'SET_ENTRY_LIST',
        payload: {
          kpOnlyPlayers: parsed.kpOnlyPlayers,
          openPlayPlayers: parsed.openPlayPlayers,
          noSlotsPlayers: parsed.noSlotsPlayers,
          fullEntryPlayers: parsed.fullEntryPlayers,
          fileName,
        },
      });
    } catch (e) {
      setEntryList(null);
      setEntryListError(e instanceof Error ? e.message : 'Could not read that file.');
      dispatch({ type: 'CLEAR_ENTRY_LIST' });
    }
  };

  const clearEntryList = () => {
    setEntryList(null);
    setEntryListError(null);
    dispatch({ type: 'CLEAR_ENTRY_LIST' });
  };

  const kpOnlyCount = entryList?.kpOnlyPlayers.filter(p => !p.isPro).length ?? 0;
  const openPlayCount = entryList?.openPlayPlayers.filter(p => !p.isPro).length ?? 0;
  const noSlotsCount = entryList?.noSlotsPlayers.filter(p => !p.isPro).length ?? 0;
  const fullEntryCount = entryList?.fullEntryPlayers.filter(p => !p.isPro).length ?? 0;
  const kpFieldCount = fullEntryCount + openPlayCount + noSlotsCount + kpOnlyCount;

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
          openPlayPlayers: parsed.openPlayPlayers,
          slotTeams: parsed.slotTeams,
          deuces: parsed.deuces,
          parPointWinners: parsed.parPointWinners,
          kpWinners: parsed.kpWinners,
          kpHoles: parsed.kpHoles,
        },
      });

      const openPlayCount = parsed.openPlayPlayers.filter(p => !p.isPro).length;
      const parts = [
        `${realPlayers.length} players`,
        openPlayCount > 0 ? `${openPlayCount} deuce+KP` : '',
        proCount > 0 ? `${proCount} pros` : '',
        `${parsed.slotTeams.length} slot teams`,
        `${parsed.deuces.length} deuce winners`,
        `${parsed.parPointWinners.length} par point leaders`,
        `${parsed.kpWinners.length} KPs`,
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
              <div className="text-teal font-semibold text-lg">{state.openPlayPlayers.filter(p => !p.isPro).length}</div>
              <div className="text-text-muted">Deuce + KP</div>
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

      {/* Optional entry list — only needed on weeks with partial entries */}
      <div className="border-t border-border pt-6 space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-teal">
            Entry List <span className="text-text-dim text-sm font-normal">(optional)</span>
          </h2>
          {state.entryListFileName && (
            <button
              onClick={clearEntryList}
              className="text-xs text-text-dim hover:text-red underline"
            >
              Remove
            </button>
          )}
        </div>

        <p className="text-text-muted text-sm">
          Only needed when some players didn't buy the full competition. The app
          splits players by what they paid: {formatCurrency(rules.entryFee)} full
          entry, {formatCurrency(rules.noSlotsEntryFee)} twosome (everything but
          slots), {formatCurrency(rules.openPlayEntryFee)} deuce + KP, or{' '}
          {formatCurrency(rules.kpOnlyEntryFee)} KP only. Skip this and everyone is
          charged the full entry, as usual.
        </p>

        <FileDropZone onFileLoaded={handleEntryListLoaded} />

        {entryListError && (
          <div className="bg-red/10 border border-red/30 rounded-lg px-4 py-3 text-red text-sm">
            {entryListError}
          </div>
        )}

        {entryList && (
          <div className="bg-card rounded-xl p-4 space-y-3 border border-border">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-card-highlight rounded-lg p-3">
                <div className="text-teal font-semibold text-lg">
                  {fullEntryCount} × {formatCurrency(rules.entryFee)}
                </div>
                <div className="text-text-muted">Full Entry</div>
              </div>
              <div className="bg-card-highlight rounded-lg p-3">
                <div className="text-amber font-semibold text-lg">
                  {noSlotsCount} × {formatCurrency(rules.noSlotsEntryFee)}
                </div>
                <div className="text-text-muted">Twosome (no slots)</div>
              </div>
              <div className="bg-card-highlight rounded-lg p-3">
                <div className="text-amber font-semibold text-lg">
                  {openPlayCount} × {formatCurrency(rules.openPlayEntryFee)}
                </div>
                <div className="text-text-muted">Deuce + KP</div>
              </div>
              <div className="bg-card-highlight rounded-lg p-3">
                <div className="text-amber font-semibold text-lg">
                  {kpOnlyCount} × {formatCurrency(rules.kpOnlyEntryFee)}
                </div>
                <div className="text-text-muted">KP Only</div>
              </div>
            </div>

            {(kpOnlyCount > 0 || openPlayCount > 0 || noSlotsCount > 0) && (
              <p className="text-xs text-text-dim">
                Partial entrants count toward the KP field ({kpFieldCount} entrants,
                which sets the per-KP prize).
                {noSlotsCount > 0 &&
                  ` Twosome players play everything but slots — deuce, KP and par points.`}
                {openPlayCount > 0 &&
                  ` Deuce + KP players also pay into the deuce pot (${formatCurrency(rules.openPlayDeuceContribution)} each).`}
              </p>
            )}

            {entryList.unknownFeeRows.length > 0 && (
              <p className="text-xs text-amber">
                {entryList.unknownFeeRows.length} row
                {entryList.unknownFeeRows.length === 1 ? '' : 's'} had an unrecognised fee
                (not {formatCurrency(rules.entryFee)},{' '}
                {formatCurrency(rules.noSlotsEntryFee)},{' '}
                {formatCurrency(rules.openPlayEntryFee)} or{' '}
                {formatCurrency(rules.kpOnlyEntryFee)}) and{' '}
                {entryList.unknownFeeRows.length === 1 ? 'was' : 'were'} skipped:{' '}
                {entryList.unknownFeeRows.slice(0, 3).map(r => r.name).join(', ')}
                {entryList.unknownFeeRows.length > 3 && '…'}
              </p>
            )}
          </div>
        )}
      </div>

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
