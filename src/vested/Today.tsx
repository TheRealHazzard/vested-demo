import { Search } from 'lucide-react'
import { buildNeeds, type Need } from './derive'
import { countWord, inr, inrParts, longDate, shortDate, signedPct } from './format'
import { type MobileNav, MobileToday } from './mobile/MobileToday'
import { NetWorthChart } from './NetWorthChart'
import { useIsMobile } from './useIsMobile'
import type { AllocationRow, VestedData } from './useVestedData'

function bucketColour(name: string): string {
  if (/gold/i.test(name)) return 'var(--v-gold)'
  if (/us\b|global|international|nasdaq|s&p|foreign/i.test(name)) return 'var(--v-steel)'
  if (/debt|cash|fd|bond|liquid/i.test(name)) return 'var(--v-ash)'
  return 'var(--v-ink)'
}

function Headline({
  needs,
  change,
  loaded,
  empty,
}: {
  needs: Need[]
  change: number | null
  loaded: boolean
  empty: boolean
}) {
  if (!loaded) return <>Reading your numbers.</>
  if (empty) {
    return (
      <>
        No numbers <span className="v-em">yet.</span>
      </>
    )
  }
  const lead =
    change === null || Math.abs(change) < 1
      ? 'Quiet day.'
      : change > 0
        ? 'A good day.'
        : 'A rough day.'
  if (needs.length === 0) {
    return (
      <>
        {lead} <span className="v-em">Nothing</span> needs you.
      </>
    )
  }
  return (
    <>
      {lead}{' '}
      <span className="v-em">
        {countWord(needs.length)} {needs.length === 1 ? 'thing' : 'things'}
      </span>{' '}
      {needs.length === 1 ? 'needs' : 'need'} you.
    </>
  )
}

function AllocationRows({ rows }: { rows: AllocationRow[] }) {
  const scale = Math.max(
    20,
    Math.ceil(Math.max(...rows.flatMap((r) => [r.weight_pct, r.target_pct])) * 1.2)
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {rows.map((r) => {
        const off = r.status !== 'on target'
        return (
          <div key={r.category} className="v-arow">
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.category}
            </span>
            <div
              className="v-track"
              role="img"
              aria-label={`${r.weight_pct.toFixed(0)}% now, target ${r.target_pct}%`}
            >
              <span
                className="v-fill"
                style={{
                  width: `${(r.weight_pct / scale) * 100}%`,
                  background: bucketColour(r.category),
                }}
              />
              <span
                className="v-tick"
                style={{ left: `calc(${(r.target_pct / scale) * 100}% - 1px)` }}
              />
            </div>
            <span style={{ textAlign: 'right', fontWeight: 600 }}>{r.weight_pct.toFixed(0)}%</span>
            <span
              className="v-arow-note"
              style={{ fontSize: 13, color: off ? 'var(--v-ember-ink)' : 'var(--v-mute)' }}
            >
              {off ? `${Math.abs(r.drift_pp).toFixed(0)} ${r.status} target` : 'on target'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function DesktopToday({ data }: { data: VestedData }) {
  const { weekday, day } = longDate(new Date())

  const latest = data.snapshots.at(-1)
  const previous = data.snapshots.at(-2)
  const netWorth = data.fire?.net_worth ?? latest?.total_value ?? 0
  const delta = latest && previous ? latest.total_value - previous.total_value : null
  const deltaPct =
    latest && previous && previous.total_value ? ((delta ?? 0) / previous.total_value) * 100 : null
  const needs = buildNeeds(data)
  const noData = data.loaded && data.snapshots.length === 0 && !data.fire && !data.allocation
  const { num, unit } = inrParts(netWorth)
  const alloc = data.allocation
  const movers = data.usHoldings
    .filter((h) => h.day_change_pct !== null)
    .sort((a, b) => Math.abs(b.day_change_pct ?? 0) - Math.abs(a.day_change_pct ?? 0))
    .slice(0, 4)
  const maxMove = Math.max(...movers.map((m) => Math.abs(m.day_change_pct ?? 0)), 0.1)
  const regimeText = data.regime
    ? data.regime.uptrend
      ? 'Market risk-on'
      : 'Market below trend'
    : null

  return (
    <div className="v-today">
      <header className="v-head">
        <div className="v-col" style={{ gap: 10, marginRight: 'auto' }}>
          <p className="v-mono">
            {weekday} &middot; {day}
          </p>
          <h1 className="v-serif v-h1">
            <Headline needs={needs} change={deltaPct} loaded={data.loaded} empty={noData} />
          </h1>
        </div>
        {regimeText ? (
          <span
            className="v-pill"
            style={
              data.regime?.uptrend
                ? undefined
                : { color: 'var(--v-ember-ink)', borderColor: '#4a2a10' }
            }
          >
            <span
              aria-hidden="true"
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: data.regime?.uptrend ? '#5c9c68' : 'var(--v-ember)',
              }}
            />
            {regimeText}
          </span>
        ) : null}
        <button type="button" className="v-search" aria-label="Jump to anything">
          <Search size={16} />
          Jump to anything
          <span
            style={{
              marginLeft: 'auto',
              border: '1px solid var(--v-line2)',
              borderRadius: 999,
              padding: '3px 10px',
              fontSize: 12,
              color: 'var(--v-ink2)',
            }}
          >
            Ctrl K
          </span>
        </button>
        <button type="button" className="v-iconbtn v-only-mobile" aria-label="Jump to anything">
          <Search size={19} />
        </button>
      </header>

      <div className="v-grid">
        <section className="v-area-nw" aria-labelledby="v-nw">
          <h2 id="v-nw" className="v-mono">
            Net worth
          </h2>
          <div className="v-bigrow">
            <p className="v-bignum">
              <span className="v-rs">Rs</span>
              <span className="v-num">{num}</span>
              <span className="v-unit">{unit}</span>
            </p>
            {delta !== null && deltaPct !== null && previous ? (
              <p style={{ lineHeight: 1.25, paddingBottom: 10 }}>
                <span
                  className={delta >= 0 ? 'v-up' : 'v-down'}
                  style={{ fontSize: 18, fontWeight: 600, display: 'block' }}
                >
                  {delta >= 0 ? '+' : '−'}
                  {inr(Math.abs(delta))}
                </span>
                <span style={{ fontSize: 13, color: 'var(--v-mute)' }}>
                  {signedPct(deltaPct)} since {shortDate(previous.date)}
                </span>
              </p>
            ) : null}
          </div>
          <NetWorthChart data={data} netWorth={netWorth} />
        </section>

        <section className="v-area-needs" aria-labelledby="v-needs">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
            <h2 id="v-needs" className="v-serif v-h2">
              Needs you
            </h2>
            <span className="v-mono">{needs.length} open</span>
          </div>
          {needs.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--v-mute)', lineHeight: 1.5 }}>
              {!data.loaded
                ? 'Checking…'
                : noData
                  ? 'Run the daily check to fill this in.'
                  : 'Everything is on target and every check is passing.'}
            </p>
          ) : (
            <div className="v-needs">
              {needs.slice(0, 5).map((n) => (
                <a key={n.id} href={n.href} className={`v-need${n.hot ? ' v-need--hot' : ''}`}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`v-dot${n.hot ? ' v-dot--hot' : ''}`} aria-hidden="true" />
                    <span className={`v-chip v-chip--${n.chip}`}>{n.tag}</span>
                  </span>
                  <span className="v-serif v-need-title">{n.title}</span>
                  <span style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--v-mute)' }}>
                    {n.detail}
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="v-area-alloc v-rule" aria-labelledby="v-alloc">
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >
            <h2 id="v-alloc" className="v-serif v-h2">
              Where it sits
            </h2>
            <span style={{ fontSize: 14, color: 'var(--v-mute)' }}>against where you want it</span>
          </div>
          {alloc ? (
            <>
              <AllocationRows rows={alloc.rows} />
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--v-mute)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 14,
                }}
              >
                <span
                  style={{
                    width: 2,
                    height: 12,
                    background: 'var(--v-ember)',
                    display: 'inline-block',
                  }}
                />
                Your target. Orange text means outside your {alloc.band_pp}-point band.
              </p>
            </>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--v-mute)' }}>
              {data.loaded ? 'Run the diversification check to see this.' : 'Loading…'}
            </p>
          )}
        </section>

        <section className="v-area-moved v-rule" aria-labelledby="v-moved">
          <h2 id="v-moved" className="v-serif v-h2" style={{ marginBottom: 14 }}>
            Moved today
          </h2>
          {movers.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {movers.map((m) => {
                const v = m.day_change_pct ?? 0
                return (
                  <div
                    key={m.ticker}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}
                  >
                    <span style={{ flex: 1, fontWeight: 500 }}>{m.ticker}</span>
                    <span
                      style={{
                        width: 80,
                        height: 4,
                        background: '#141414',
                        borderRadius: 2,
                        position: 'relative',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          borderRadius: 2,
                          [v < 0 ? 'right' : 'left']: 0,
                          width: `${(Math.abs(v) / maxMove) * 100}%`,
                          background: v < 0 ? 'var(--v-down)' : 'var(--v-up)',
                        }}
                      />
                    </span>
                    <span
                      className={v < 0 ? 'v-down' : 'v-up'}
                      style={{ width: 56, textAlign: 'right', fontWeight: 600 }}
                    >
                      {signedPct(v)}
                    </span>
                  </div>
                )
              })}
              <p style={{ fontSize: 12, color: 'var(--v-mute)' }}>
                US holdings. India prices arrive after the close.
              </p>
            </div>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--v-mute)' }}>No price moves recorded yet.</p>
          )}
        </section>

        <section className="v-area-signals v-rule" aria-labelledby="v-sig">
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12 }}>
            <h2 id="v-sig" className="v-serif v-h2">
              Signals
            </h2>
            <a
              href="#"
              style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--v-mute)' }}
            >
              Open &rarr;
            </a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
            {data.regime ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span>Market regime</span>
                <span style={{ color: 'var(--v-mute)' }}>
                  Nifty {Math.abs(data.regime.pct_above_sma).toFixed(1)}%{' '}
                  {data.regime.pct_above_sma >= 0 ? 'above' : 'below'} its 200-day
                </span>
              </div>
            ) : null}
            {data.edge ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span>Sentiment Edge</span>
                <span className="v-chip v-chip--plain">
                  {data.edge.verdict.split(/[.(]/)[0].trim().slice(0, 32)}
                </span>
              </div>
            ) : null}
            {!data.regime && !data.edge ? (
              <p style={{ color: 'var(--v-mute)' }}>
                {data.loaded ? 'No signals have run yet.' : 'Loading…'}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}

/** One page, two layouts: the phone gets its own design, not the desktop one squeezed. */
export default function Today({ data, nav }: { data: VestedData; nav: MobileNav }) {
  const isMobile = useIsMobile()
  return isMobile ? <MobileToday data={data} nav={nav} /> : <DesktopToday data={data} />
}
