/**
 * The sentences. The app should read like a thoughtful person who has looked at your money,
 * not a dashboard reciting fields: what moved and why, where the year's gain came from.
 * Every sentence is built only from numbers we actually have, and says so when we do not.
 */
import { inr, signedPct } from './format'
import type { VestedData } from './useVestedData'

const DAY = 86_400_000

/** What moved today. Only US holdings carry a day change, and the sentence says as much. */
export function moveStory(d: VestedData): string | null {
  const moves = d.usHoldings
    .filter((h) => h.day_change_pct !== null && Math.abs(h.day_change_pct) >= 0.5)
    .sort((a, b) => Math.abs(b.day_change_pct ?? 0) - Math.abs(a.day_change_pct ?? 0))
  if (moves.length === 0) {
    return d.usHoldings.length
      ? 'Your US holdings barely moved. India prices land after the close.'
      : null
  }
  const parts = moves.slice(0, 2).map((m) => `${m.ticker} ${signedPct(m.day_change_pct ?? 0)}`)
  const up = moves.filter((m) => (m.day_change_pct ?? 0) > 0).length
  const lead =
    up === moves.length
      ? 'The US lifted you'
      : up === 0
        ? 'The US weighed on you'
        : 'The US did the moving'
  return `${lead}: ${parts.join(', ')}. India prices land after the close.`
}

/** Where the last year's gain came from: what you put in against what the money earned. */
export function yearSplit(d: VestedData): string | null {
  const snaps = d.snapshots
  const last = snaps.at(-1)
  if (!last || snaps.length < 2) return null
  const cutoff = new Date(last.date).getTime() - 365 * DAY
  const first = snaps.find((s) => new Date(s.date).getTime() >= cutoff)
  if (!first || new Date(last.date).getTime() - new Date(first.date).getTime() < 300 * DAY)
    return null
  const gain = last.total_value - first.total_value
  const invested = (d.allocation?.monthly_investment ?? 0) * 12
  if (gain <= 0) return `Down ${inr(Math.abs(gain))} over the year.`
  if (invested <= 0) return `Up ${inr(gain)} over the year.`
  if (invested >= gain) {
    return `Up ${inr(gain)} over the year, and about all of it is what you added.`
  }
  return `Up ${inr(gain)} over the year: about ${inr(invested)} is what you added, and ${inr(gain - invested)} is growth.`
}
