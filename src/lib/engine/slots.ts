import type { SlotTeam, SlotResult, RulesConfig } from '@/types';

export function calculateSlots(
  teams: SlotTeam[],
  slotsPool: number,
  _playerCount: number,
  rules: RulesConfig,
): SlotResult[] {
  const splits = rules.splits;

  const placingTeams = teams.slice(0, splits.length);

  // First pass: calculate base payouts and identify pro shares
  let totalProShare = 0;
  let totalRealWinners = 0;

  const preliminary = placingTeams.map((team, i) => {
    const percentage = splits[i];
    const teamPayout = slotsPool * (percentage / 100);
    const perPlayer = teamPayout / team.players.length;

    const proCount = team.players.filter(p => p.isPro).length;
    const realCount = team.players.filter(p => !p.isPro).length;

    totalProShare += proCount * perPlayer;
    totalRealWinners += realCount;

    return { team, percentage, teamPayout, perPlayer, proCount, realCount };
  });

  // Pro bonus: redistribute all pro shares equally among all real winners
  const proBonus = totalRealWinners > 0 ? totalProShare / totalRealWinners : 0;

  // Build final results
  return preliminary.map(({ team, percentage, teamPayout, perPlayer }) => {
    const hasPros = team.players.some(p => p.isPro);

    return {
      place: team.place,
      percentage,
      teamPayout,
      players: team.players.map(p => ({
        name: p.name,
        isPro: p.isPro,
        basePayout: p.isPro ? 0 : perPlayer,
        proBonus: p.isPro ? 0 : proBonus,
        totalPayout: p.isPro ? 0 : perPlayer + proBonus,
      })),
      proRedistributionNote: hasPros
        ? `Pro share redistributed to all ${totalRealWinners} real winners (+${formatProBonus(proBonus)} each)`
        : undefined,
    };
  });
}

function formatProBonus(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
