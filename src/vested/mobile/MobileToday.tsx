/**
 * Today on a phone. Not the desktop page squeezed narrow: its own layout, built for one
 * hand. A large sentence for a title, the net-worth chart you can drag a finger along
 * (and, on the path view, drag the goal date to see what it would take), a list of what
 * needs you with swipe actions, then the supporting lists.
 */
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  CreditCard,
  Eye,
  KeyRound,
  Pause,
  PlusCircle,
  RefreshCw,
  Scale,
} from 'lucide-react'
import { type CSSProperties, type ReactNode, useCallback, useMemo, useState } from 'react'
import {
  ASSUMED_RETURN,
  buildNeeds,
  type Need,
  plotPath,
  plotRange,
  type RangeKey,
  requiredMonthly,
  type ScrubPoint,
  yearOf,
} from '../derive'
import { countWord, inr, inrParts, longDate, shortDate, signedPct } from '../format'
import { moveStory, yearSplit } from '../insights'
import { useCountUp } from '../useCountUp'
import type { VestedData } from '../useVestedData'
import { PageTop } from './PageTop'
import { ScrubChart } from './ScrubChart'
import { Sheet } from './Sheet'
import { SwipeRow } from './SwipeRow'
import type { Place } from './TabBar'

export interface MobileNav {
  places: Place[]
  onNavigate: (href: string) => void
  settings: { label: string; detail: string; href: string }[]
}

const GLYPH: Record<string, ReactNode> = {
  Login: <KeyRound size={18} />,
  Pay: <CreditCard size={18} />,
  Trim: <Scale size={18} />,
  Invest: <PlusCircle size={18} />,
  Watch: <Eye size={18} />,
  Hold: <Pause size={18} />,
  System: <Activity size={18} />,
  Sync: <RefreshCw size={18} />,
}

const RANGES: RangeKey[] = ['1M', '6M', '1Y', 'All', 'Path']
const SNOOZE_KEY = 'vested-snoozed'
/** Things you finish rather than defer. */
const DONE_TAGS = new Set(['Pay', 'Invest'])

function readSnoozed(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SNOOZE_KEY) ?? 'null')
    const today = new Date().toDateString()
    return raw && raw.day === today && Array.isArray(raw.ids) ? raw.ids : []
  } catch {
    return []
  }
}

function writeSnoozed(ids: string[]) {
  try {
    localStorage.setItem(SNOOZE_KEY, JSON.stringify({ day: new Date().toDateString(), ids }))
  } catch {
    /* private mode: the snooze just lasts this visit */
  }
}

function bucketColour(name: string): string {
  if (/gold/i.test(name)) return 'var(--gold)'
  if (/us\b|global|international|nasdaq|s&p|foreign/i.test(name)) return 'var(--steel)'
  if (/debt|cash|fd|bond|liquid/i.test(name)) return 'var(--ash)'
  return 'var(--ink)'
}

function Row({
  children,
  onClick,
  label,
}: {
  children: ReactNode
  onClick?: () => void
  label?: string
}) {
  if (!onClick) return <div className="vm-row">{children}</div>
  return (
    <button type="button" className="vm-row vm-row--tap" onClick={onClick} aria-label={label}>
      {children}
    </button>
  )
}

/** Shown while the very first load is under way: the page's own shape, so nothing jumps. */
function Skeleton() {
  return (
    <div className="vm-pad vm-skel" aria-busy="true">
      <span className="vm-sr">Loading your numbers</span>
      <span className="vm-skel-line" style={{ width: '78%', height: 34 }} />
      <span className="vm-skel-line" style={{ width: '52%', height: 34, marginTop: 8 }} />
      <span className="vm-skel-line" style={{ width: '40%', height: 56, marginTop: 34 }} />
      <span className="vm-skel-line" style={{ width: '100%', height: 170, marginTop: 28 }} />
      <span className="vm-skel-line" style={{ width: '100%', height: 44, marginTop: 20 }} />
      <span className="vm-skel-line" style={{ width: '100%', height: 150, marginTop: 34 }} />
    </div>
  )
}

function AllClear({ snoozed, onShow }: { snoozed: number; onShow: () => void }) {
  return (
    <div className="vm-clear">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle
          cx="32"
          cy="32"
          r="29"
          stroke="#ff7a1a"
          strokeWidth="2"
          pathLength={1}
          className="vm-clear-ring"
        />
        <path
          d="M20 33l9 9 16-18"
          stroke="#ece4d6"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className="vm-clear-tick"
        />
      </svg>
      <p className="vm-clear-title">All clear.</p>
      <p className="vm-sub">
        Everything is on target and every check is passing. The next check runs tomorrow morning.
      </p>
      {snoozed > 0 ? (
        <button type="button" className="vm-textbtn" onClick={onShow}>
          {snoozed} set aside. Show again
        </button>
      ) : null}
    </div>
  )
}

export function MobileToday({ data, nav }: { data: VestedData; nav: MobileNav }) {
  const { weekday, day } = longDate(new Date())
  const latest = data.snapshots.at(-1)
  const previous = data.snapshots.at(-2)
  const netWorth = data.fire?.net_worth ?? latest?.total_value ?? 0
  const delta = latest && previous ? latest.total_value - previous.total_value : null
  const deltaPct =
    latest && previous && previous.total_value ? ((delta ?? 0) / previous.total_value) * 100 : null

  // ----- needs you -----
  const allNeeds = useMemo(() => buildNeeds(data), [data])
  const [snoozed, setSnoozed] = useState<string[]>(readSnoozed)
  const needs = allNeeds.filter((n) => !snoozed.includes(n.id))
  const [showAll, setShowAll] = useState(false)
  const [open, setOpen] = useState<Need | null>(null)
  const snooze = useCallback(
    (id: string) => {
      const next = [...snoozed, id]
      setSnoozed(next)
      writeSnoozed(next)
      setOpen(null)
    },
    [snoozed]
  )
  const unsnooze = () => {
    setSnoozed([])
    writeSnoozed([])
  }
  const visible = showAll ? needs : needs.slice(0, 3)

  // ----- chart -----
  const goal = data.fire?.fire_number ?? null
  const monthly = data.allocation?.monthly_investment ?? 0
  const canPath = goal !== null && goal > netWorth
  const nifty = data.benchmark?.nifty ?? []
  const canBench = nifty.length > 1
  const [showBench, setShowBench] = useState(false)
  const ranges = useMemo(() => {
    const b = showBench && canBench ? nifty : undefined
    return {
      '1M': plotRange(data.snapshots, '1M', b),
      '6M': plotRange(data.snapshots, '6M', b),
      '1Y': plotRange(data.snapshots, '1Y', b),
      All: plotRange(data.snapshots, 'All', b),
    }
  }, [data.snapshots, nifty, showBench, canBench])

  const [goalMonths, setGoalMonths] = useState<number | null>(null)
  const needed =
    goalMonths !== null && goal !== null
      ? requiredMonthly(netWorth, goal, goalMonths, ASSUMED_RETURN)
      : null
  const monthlyEff = needed ?? monthly
  const path = useMemo(
    () => (canPath && goal !== null ? plotPath(data.snapshots, netWorth, goal, monthlyEff) : null),
    [canPath, goal, data.snapshots, netWorth, monthlyEff]
  )

  const [picked, setPicked] = useState<RangeKey | null>(null)
  const key: RangeKey = picked ?? (ranges['1Y'].enough ? '1Y' : 'All')
  const plot = key === 'Path' ? null : ranges[key]
  const shownRanges = RANGES.filter((r) => r !== 'Path' || canPath)
  const [scrub, setScrub] = useState<ScrubPoint | null>(null)

  const first = key === 'Path' ? data.snapshots[0] : undefined
  const startValue =
    key === 'Path' ? (first?.total_value ?? netWorth) : (plot?.scrub[0]?.value ?? netWorth)
  const startLabel = key === 'Path' ? (first ? shortDate(first.date) : '') : (plot?.from ?? '')

  const counted = useCountUp(netWorth)
  const shownValue = scrub ? scrub.value : counted
  const { num, unit } = inrParts(shownValue)
  const scrubChange = scrub ? scrub.value - startValue : null

  let caption: string
  if (key === 'Path' && path && goal !== null) {
    if (goalMonths !== null && needed !== null) {
      const by = yearOf(goalMonths)
      caption =
        needed <= 0
          ? `Growth alone gets you to ${inr(goal)} by ${by}. You would not need to add anything.`
          : `To reach ${inr(goal)} by ${by}, invest ${inr(needed)} a month${needed > monthly ? ` (it is ${inr(monthly)} now)` : ''}.`
    } else {
      caption = path.goalYear
        ? `At ${ASSUMED_RETURN}% a year and ${inr(monthly)} invested each month you reach ${inr(goal)} in ${path.goalYear}. Drag the hollow marker to a different year to see what it would take.`
        : `At ${ASSUMED_RETURN}% a year the goal is more than 15 years away. Drag the marker to see what it would take.`
    }
  } else if (plot?.enough && plot.gain !== null) {
    if (showBench && plot.benchGain !== null) {
      const diff = plot.gain - plot.benchGain
      caption = `Up ${inr(plot.gain)} since ${plot.from}. The same money in the Nifty would be up ${inr(plot.benchGain)}, so you are ${diff >= 0 ? 'ahead' : 'behind'} by ${inr(Math.abs(diff))}. Your figure includes money you added, so treat it as a rough guide.`
    } else {
      caption =
        (key === '1Y' || key === 'All' ? yearSplit(data) : null) ??
        `${plot.gain >= 0 ? 'Up' : 'Down'} ${inr(Math.abs(plot.gain))} since ${plot.from}.`
    }
  } else {
    caption = 'Not enough history yet for this range.'
  }
  const summary =
    key === 'Path' && path && goal !== null
      ? `Net worth ${inr(netWorth)} today, projected to reach ${inr(goal)} in ${path.goalYear ?? 'more than 15 years'}.`
      : plot?.enough && plot.gain !== null
        ? `Net worth ${inr(netWorth)}, ${plot.gain >= 0 ? 'up' : 'down'} ${inr(Math.abs(plot.gain))} since ${plot.from}.`
        : `Net worth ${inr(netWorth)}.`

  // ----- lead-in sentence -----
  const lead =
    deltaPct === null || Math.abs(deltaPct) < 1
      ? 'Quiet day.'
      : deltaPct > 0
        ? 'A good day.'
        : 'A rough day.'
  const noData = data.loaded && data.snapshots.length === 0 && !data.fire && !data.allocation
  const story = moveStory(data)

  const alloc = data.allocation
  const scale = alloc
    ? Math.max(
        20,
        Math.ceil(Math.max(...alloc.rows.flatMap((r) => [r.weight_pct, r.target_pct])) * 1.2)
      )
    : 20
  const movers = data.usHoldings
    .filter((h) => h.day_change_pct !== null)
    .sort((a, b) => Math.abs(b.day_change_pct ?? 0) - Math.abs(a.day_change_pct ?? 0))
    .slice(0, 4)
  const signalsHref = nav.places.find((p) => p.id === 'signals')?.href ?? '#'
  const fresh = data.asOf
    ? new Date(data.asOf).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    : null

  return (
    <div className="vm-page">
      <PageTop
        eyebrow={`${weekday}, ${day}`}
        barTitle={`Rs ${inrParts(netWorth).num} ${inrParts(netWorth).unit}`}
        barSub={
          delta !== null ? (
            <span className={`vm-bar-sub ${delta >= 0 ? 'vm-up' : 'vm-down'}`}>
              {delta >= 0 ? '+' : '−'}
              {inr(Math.abs(delta))}
            </span>
          ) : null
        }
        nav={nav}
      />

      {!data.loaded ? (
        <Skeleton />
      ) : (
        <>
          <div className="vm-pad">
            <h1 className="vm-title">
              {noData ? (
                <>
                  No numbers <em>yet.</em>
                </>
              ) : needs.length === 0 ? (
                <>
                  {lead} <em>Nothing</em> needs you.
                </>
              ) : (
                <>
                  {lead}{' '}
                  <em>
                    {countWord(needs.length)} {needs.length === 1 ? 'thing' : 'things'}
                  </em>{' '}
                  {needs.length === 1 ? 'needs' : 'need'} you.
                </>
              )}
            </h1>

            <section className="vm-net" aria-label="Net worth">
              <p className="vm-cap vm-net-label" aria-live="polite">
                {scrub ? scrub.label : 'Net worth'}
              </p>
              <p className="vm-num">
                <span className="vm-num-rs">Rs</span>
                {num}
                <span className="vm-num-unit">{unit}</span>
              </p>
              {scrub && scrubChange !== null ? (
                <>
                  <p className={`vm-delta ${scrubChange >= 0 ? 'vm-up' : 'vm-down'}`}>
                    {scrubChange >= 0 ? (
                      <ArrowUp size={16} strokeWidth={2.4} />
                    ) : (
                      <ArrowDown size={16} strokeWidth={2.4} />
                    )}
                    {inr(Math.abs(scrubChange))} <span className="vm-dim">from {startLabel}</span>
                  </p>
                  {scrub.note ? <p className="vm-story vm-ember">{scrub.note}</p> : null}
                </>
              ) : delta !== null && deltaPct !== null && previous ? (
                <>
                  <p className={`vm-delta ${delta >= 0 ? 'vm-up' : 'vm-down'}`}>
                    {delta >= 0 ? (
                      <ArrowUp size={16} strokeWidth={2.4} />
                    ) : (
                      <ArrowDown size={16} strokeWidth={2.4} />
                    )}
                    {inr(Math.abs(delta))} ({signedPct(deltaPct)}){' '}
                    <span className="vm-dim">since {shortDate(previous.date)}</span>
                  </p>
                  {story ? <p className="vm-story">{story}</p> : null}
                </>
              ) : null}
            </section>
          </div>

          <ScrubChart
            plot={plot}
            path={key === 'Path' ? path : null}
            drawKey={`${key}-${showBench}`}
            goalLabel={goal !== null ? `Goal ${inr(goal)}` : ''}
            summary={summary}
            scrub={scrub}
            onScrub={setScrub}
            goalMonths={goalMonths}
            onGoalMonths={setGoalMonths}
            showBench={showBench}
          />

          <div className="vm-pad">
            {/* biome-ignore lint/a11y/useSemanticElements: a fieldset is not reliably flexible on iOS Safari */}
            <div className="vm-seg" role="group" aria-label="Range">
              {shownRanges.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={key === r}
                  onClick={() => {
                    setPicked(r)
                    setScrub(null)
                    setGoalMonths(null)
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="vm-chartnote">
              <p className="vm-sub vm-caption">{caption}</p>
              {key === 'Path' && goalMonths !== null ? (
                <button type="button" className="vm-textbtn" onClick={() => setGoalMonths(null)}>
                  Reset
                </button>
              ) : null}
              {key !== 'Path' && canBench ? (
                <button
                  type="button"
                  className="vm-chipbtn"
                  aria-pressed={showBench}
                  onClick={() => setShowBench((s) => !s)}
                >
                  Compare with the Nifty
                </button>
              ) : null}
            </div>

            <section className="vm-section" aria-labelledby="vm-needs">
              <div className="vm-sechead">
                <h2 id="vm-needs">Needs you</h2>
                <span className="vm-cap">{needs.length} open</span>
              </div>
              {needs.length === 0 ? (
                noData ? (
                  <div className="vm-group">
                    <div className="vm-row vm-row--note">
                      <span className="vm-sub">Run the daily check to fill this in.</span>
                    </div>
                  </div>
                ) : (
                  <AllClear snoozed={snoozed.length} onShow={unsnooze} />
                )
              ) : (
                <div className="vm-group">
                  {visible.map((n, i) => (
                    <SwipeRow
                      key={n.id}
                      actionLabel={DONE_TAGS.has(n.tag) ? 'Done' : 'Later'}
                      onAction={() => snooze(n.id)}
                    >
                      <Row onClick={() => setOpen(n)} label={`${n.tag}: ${n.title}`}>
                        <span
                          className={`vm-tile${n.hot ? ' vm-tile--hot' : n.chip === 'steel' ? ' vm-tile--steel' : ''}`}
                          style={{ '--i': i } as CSSProperties}
                        >
                          {GLYPH[n.tag] ?? <Activity size={18} />}
                        </span>
                        <span className="vm-rowtext">
                          <span className={`vm-cap${n.hot ? ' vm-ember' : ''}`}>{n.tag}</span>
                          <span className="vm-rowtitle">{n.title}</span>
                          <span className="vm-sub vm-clamp">{n.detail}</span>
                        </span>
                        <ChevronRight size={18} className="vm-chev" aria-hidden="true" />
                      </Row>
                    </SwipeRow>
                  ))}
                  {needs.length > 3 ? (
                    <Row onClick={() => setShowAll((s) => !s)}>
                      <span className="vm-link">
                        {showAll ? 'Show fewer' : `Show ${needs.length - 3} more`}
                      </span>
                    </Row>
                  ) : null}
                </div>
              )}
              {snoozed.length > 0 && needs.length > 0 ? (
                <p className="vm-sub vm-snoozed">
                  {snoozed.length} set aside until tomorrow.{' '}
                  <button type="button" className="vm-textbtn" onClick={unsnooze}>
                    Show again
                  </button>
                </p>
              ) : null}
            </section>

            <section className="vm-section" aria-labelledby="vm-sits">
              <div className="vm-sechead">
                <h2 id="vm-sits">Where it sits</h2>
                {alloc ? <span className="vm-cap">against your targets</span> : null}
              </div>
              {alloc ? (
                <div className="vm-group">
                  {alloc.rows.map((r) => {
                    const off = r.status !== 'on target'
                    return (
                      <div key={r.category} className="vm-row vm-alloc">
                        <div className="vm-alloc-top">
                          <span>{r.category}</span>
                          <b>{r.weight_pct.toFixed(0)}%</b>
                        </div>
                        <div
                          className="vm-track"
                          role="img"
                          aria-label={`${r.weight_pct.toFixed(0)}% now, target ${r.target_pct}%`}
                        >
                          <span
                            className="vm-fill"
                            style={{
                              width: `${(r.weight_pct / scale) * 100}%`,
                              background: bucketColour(r.category),
                            }}
                          />
                          <span
                            className="vm-tick"
                            style={{ left: `calc(${(r.target_pct / scale) * 100}% - 1px)` }}
                          />
                        </div>
                        <span className={`vm-cap${off ? ' vm-ember' : ''}`}>
                          {off
                            ? `${Math.abs(r.drift_pp).toFixed(0)} points ${r.status} target (${r.target_pct}%)`
                            : `On target (${r.target_pct}%)`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="vm-group">
                  <div className="vm-row vm-row--note">
                    <span className="vm-sub">Run the diversification check to see this.</span>
                  </div>
                </div>
              )}
            </section>

            {movers.length > 0 ? (
              <section className="vm-section" aria-labelledby="vm-moved">
                <div className="vm-sechead">
                  <h2 id="vm-moved">Moved today</h2>
                  <span className="vm-cap">US holdings</span>
                </div>
                <div className="vm-group">
                  {movers.map((m) => {
                    const v = m.day_change_pct ?? 0
                    return (
                      <div key={m.ticker} className="vm-row">
                        <span className="vm-rowtitle vm-grow">{m.ticker}</span>
                        <span className={`vm-delta ${v < 0 ? 'vm-down' : 'vm-up'}`}>
                          {v < 0 ? (
                            <ArrowDown size={16} strokeWidth={2.4} />
                          ) : (
                            <ArrowUp size={16} strokeWidth={2.4} />
                          )}
                          {signedPct(v)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>
            ) : null}

            {data.regime || data.edge ? (
              <section className="vm-section" aria-labelledby="vm-sig">
                <div className="vm-sechead">
                  <h2 id="vm-sig">Signals</h2>
                </div>
                <div className="vm-group">
                  {data.regime ? (
                    <Row onClick={() => nav.onNavigate(signalsHref)}>
                      <span className="vm-rowtext">
                        <span className="vm-rowtitle">
                          Market {data.regime.uptrend ? 'risk-on' : 'below trend'}
                        </span>
                        <span className="vm-sub">
                          Nifty is {Math.abs(data.regime.pct_above_sma).toFixed(1)}%{' '}
                          {data.regime.pct_above_sma >= 0 ? 'above' : 'below'} its 200-day average
                        </span>
                      </span>
                      <ChevronRight size={18} className="vm-chev" aria-hidden="true" />
                    </Row>
                  ) : null}
                  {data.edge ? (
                    <Row onClick={() => nav.onNavigate(signalsHref)}>
                      <span className="vm-rowtext">
                        <span className="vm-rowtitle">Sentiment Edge</span>
                        <span className="vm-sub">{data.edge.verdict.split(/[.(]/)[0].trim()}</span>
                      </span>
                      <ChevronRight size={18} className="vm-chev" aria-hidden="true" />
                    </Row>
                  ) : null}
                </div>
              </section>
            ) : null}

            <p className="vm-foot" aria-live="polite">
              {data.refreshing
                ? 'Showing the last numbers while it refreshes… '
                : fresh
                  ? `Updated ${fresh}. `
                  : ''}
              {latest ? `Last snapshot ${shortDate(latest.date)}. ` : ''}Figures are for your
              tracked accounts.
            </p>
          </div>
        </>
      )}

      <Sheet
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.title ?? ''}
        subtitle={open?.tag}
      >
        {open ? (
          <>
            <p className="vm-body">{open.detail}</p>
            <div className="vm-actions">
              {!open.href.startsWith('#') ? (
                <a
                  className="vm-btn"
                  href={open.href}
                  onClick={(e) => {
                    e.preventDefault()
                    setOpen(null)
                    nav.onNavigate(open.href)
                  }}
                >
                  Open
                </a>
              ) : null}
              <button
                type="button"
                className="vm-btn vm-btn--ghost"
                onClick={() => snooze(open.id)}
              >
                {DONE_TAGS.has(open.tag) ? 'Mark done' : 'Remind me tomorrow'}
              </button>
            </div>
          </>
        ) : null}
      </Sheet>
    </div>
  )
}
