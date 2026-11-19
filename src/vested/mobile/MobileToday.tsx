/**
 * Today on a phone. Not the desktop page squeezed narrow: its own layout, built for one
 * hand. A large sentence for a title, the net-worth chart you can drag a finger along,
 * a list of what needs you (each opens a sheet), then the supporting lists.
 */
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  CreditCard,
  Eye,
  KeyRound,
  Pause,
  PlusCircle,
  RefreshCw,
  Scale,
  Settings,
} from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import {
  ASSUMED_RETURN,
  buildNeeds,
  type Need,
  plotPath,
  plotRange,
  type RangeKey,
  type ScrubPoint,
} from '../derive'
import { countWord, inr, inrParts, longDate, shortDate, signedPct } from '../format'
import type { VestedData } from '../useVestedData'
import { ScrubChart } from './ScrubChart'
import { Sheet } from './Sheet'
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
  const [openSettings, setOpenSettings] = useState(false)
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
  const ranges = useMemo(
    () => ({
      '1M': plotRange(data.snapshots, '1M'),
      '6M': plotRange(data.snapshots, '6M'),
      '1Y': plotRange(data.snapshots, '1Y'),
      All: plotRange(data.snapshots, 'All'),
    }),
    [data.snapshots]
  )
  const path = useMemo(
    () => (canPath && goal !== null ? plotPath(data.snapshots, netWorth, goal, monthly) : null),
    [canPath, goal, data.snapshots, netWorth, monthly]
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

  const shownValue = scrub ? scrub.value : netWorth
  const { num, unit } = inrParts(shownValue)
  const scrubChange = scrub ? scrub.value - startValue : null

  let caption: string
  if (key === 'Path' && path && goal !== null) {
    caption = path.goalYear
      ? `At ${ASSUMED_RETURN}% a year and ${inr(monthly)} invested each month you reach ${inr(goal)} in ${path.goalYear}. The orange band is ${ASSUMED_RETURN - 3}% to ${ASSUMED_RETURN + 3}%${path.earliestYear && path.latestYear ? `, so ${path.earliestYear} to ${path.latestYear}` : ''}.`
      : `At ${ASSUMED_RETURN}% a year the goal is more than 15 years away.`
  } else if (plot?.enough && plot.gain !== null) {
    caption = `${plot.gain >= 0 ? 'Up' : 'Down'} ${inr(Math.abs(plot.gain))} since ${plot.from}. Touch and drag the chart to read any day.`
  } else {
    caption = 'Not enough history yet for this range.'
  }
  const summary =
    key === 'Path' && path && goal !== null
      ? `Net worth ${inr(netWorth)} today, projected to reach ${inr(goal)} in ${path.goalYear ?? 'more than 15 years'}.`
      : plot?.enough && plot.gain !== null
        ? `Net worth ${inr(netWorth)}, ${plot.gain >= 0 ? 'up' : 'down'} ${inr(Math.abs(plot.gain))} since ${plot.from}.`
        : `Net worth ${inr(netWorth)}.`

  // ----- the top bar condenses once the big title has scrolled away -----
  const [condensed, setCondensed] = useState(false)
  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 150)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ----- lead-in sentence -----
  const lead =
    deltaPct === null || Math.abs(deltaPct) < 1
      ? 'Quiet day.'
      : deltaPct > 0
        ? 'A good day.'
        : 'A rough day.'
  const noData = data.loaded && data.snapshots.length === 0 && !data.fire && !data.allocation

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

  return (
    <div className="vm-page">
      <header className={`vm-bar${condensed ? ' is-condensed' : ''}`}>
        <div className="vm-bar-mid" aria-hidden={!condensed}>
          <span className="vm-bar-title">
            Rs {inrParts(netWorth).num} {inrParts(netWorth).unit}
          </span>
          {delta !== null ? (
            <span className={`vm-bar-sub ${delta >= 0 ? 'vm-up' : 'vm-down'}`}>
              {delta >= 0 ? '+' : '−'}
              {inr(Math.abs(delta))}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="vm-circle vm-bar-btn"
          aria-label="Settings and more"
          onClick={() => setOpenSettings(true)}
        >
          <Settings size={20} strokeWidth={1.8} />
        </button>
      </header>

      <div className="vm-pad">
        <p className="vm-cap">
          {weekday}, {day}
        </p>
        <h1 className="vm-title">
          {!data.loaded ? (
            'Reading your numbers.'
          ) : noData ? (
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
            <p className={`vm-delta ${scrubChange >= 0 ? 'vm-up' : 'vm-down'}`}>
              {scrubChange >= 0 ? (
                <ArrowUp size={16} strokeWidth={2.4} />
              ) : (
                <ArrowDown size={16} strokeWidth={2.4} />
              )}
              {inr(Math.abs(scrubChange))} <span className="vm-dim">from {startLabel}</span>
            </p>
          ) : delta !== null && deltaPct !== null && previous ? (
            <p className={`vm-delta ${delta >= 0 ? 'vm-up' : 'vm-down'}`}>
              {delta >= 0 ? (
                <ArrowUp size={16} strokeWidth={2.4} />
              ) : (
                <ArrowDown size={16} strokeWidth={2.4} />
              )}
              {inr(Math.abs(delta))} ({signedPct(deltaPct)}){' '}
              <span className="vm-dim">since {shortDate(previous.date)}</span>
            </p>
          ) : null}
        </section>
      </div>

      <ScrubChart
        plot={plot}
        path={key === 'Path' ? path : null}
        goalLabel={goal !== null ? `Goal ${inr(goal)}` : ''}
        summary={summary}
        scrub={scrub}
        onScrub={setScrub}
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
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <p className="vm-sub vm-caption">{caption}</p>

        <section className="vm-section" aria-labelledby="vm-needs">
          <div className="vm-sechead">
            <h2 id="vm-needs">Needs you</h2>
            <span className="vm-cap">{needs.length} open</span>
          </div>
          {needs.length === 0 ? (
            <div className="vm-group">
              <div className="vm-row vm-row--note">
                <Check size={18} className="vm-up" />
                <span className="vm-sub">
                  {!data.loaded
                    ? 'Checking…'
                    : noData
                      ? 'Run the daily check to fill this in.'
                      : 'Every check is passing and everything is on target.'}
                </span>
              </div>
            </div>
          ) : (
            <div className="vm-group">
              {visible.map((n) => (
                <Row key={n.id} onClick={() => setOpen(n)} label={`${n.tag}: ${n.title}`}>
                  <span
                    className={`vm-tile${n.hot ? ' vm-tile--hot' : n.chip === 'steel' ? ' vm-tile--steel' : ''}`}
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
          {snoozed.length > 0 ? (
            <p className="vm-sub vm-snoozed">
              {snoozed.length} snoozed until tomorrow.{' '}
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
                <span className="vm-sub">
                  {data.loaded ? 'Run the diversification check to see this.' : 'Loading…'}
                </span>
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

        <p className="vm-foot">
          {latest ? `Last snapshot ${shortDate(latest.date)}. ` : ''}Figures are for your tracked
          accounts.
        </p>
      </div>

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
              {open.href !== '#' ? (
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
                Remind me tomorrow
              </button>
            </div>
          </>
        ) : null}
      </Sheet>

      <Sheet open={openSettings} onClose={() => setOpenSettings(false)} title="More">
        <div className="vm-group">
          {nav.settings.map((s) => (
            <Row
              key={s.label}
              onClick={() => {
                setOpenSettings(false)
                nav.onNavigate(s.href)
              }}
            >
              <span className="vm-rowtext">
                <span className="vm-rowtitle">{s.label}</span>
                <span className="vm-sub">{s.detail}</span>
              </span>
              <ChevronRight size={18} className="vm-chev" aria-hidden="true" />
            </Row>
          ))}
        </div>
      </Sheet>
    </div>
  )
}
