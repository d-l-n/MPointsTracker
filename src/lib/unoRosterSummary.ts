import type { Match, UnoRosterEvent } from "../types";

interface UnoRosterSummarySource extends Pick<Match, "rosterEvents"> {}

function getPortableRound(event: UnoRosterEvent): number {
  return Number.isFinite(event.effectiveRound) && event.effectiveRound > 0 ? Math.trunc(event.effectiveRound) : 1;
}

function formatRosterEvent(event: UnoRosterEvent): string | null {
  const playerName = event.playerName?.trim();
  if (!playerName) return null;
  return `${event.type === "join" ? "+" : "-"}${playerName} R${getPortableRound(event)}`;
}

export function formatUnoRosterSummary(match: UnoRosterSummarySource | null | undefined): string | null {
  // Saved-match consumers must rely on rosterEvents. inactivePlayers stores
  // transient live-match ids, so it cannot reconstruct historical roster UI.
  if (!match?.rosterEvents?.length) return null;

  const eventLabels = match.rosterEvents
    .map((event, index) => ({ event, index }))
    .sort((left, right) => getPortableRound(left.event) - getPortableRound(right.event) || left.index - right.index)
    .map(({ event }) => formatRosterEvent(event))
    .filter(Boolean) as string[];

  return eventLabels.length > 0 ? eventLabels.join(" · ") : null;
}
