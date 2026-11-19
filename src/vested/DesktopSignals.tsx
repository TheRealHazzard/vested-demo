/**
 * Signals on a wide screen: the same three lenses as the phone (Live, Strategies, Lab) as tabs,
 * with the page's sentence changing to match what you are looking at.
 */
import { useState } from 'react'
import { longDate, signedPct } from './format'
import type { MobileNav } from './mobile/MobileToday'
import {
  edgeView,
  picks,
  SIGNAL_TABS,
  type SignalTab,
  signalsHeadline,
  strategies,
} from './signalsLogic'
import type { VestedData } from './useVestedData'

const VERDICT_CHIP: Record<string, string> = {
  Ahead: 'v-chip--up',
  Behind: 'v-chip--ember',
  Running: 'v-chip--steel',
}

function Pct({ value }: { value: number }) {
  return <span className={value < 0 ? 'v-down' : 'v-up'}>{signedPct(value)}</span>
}

export function DesktopSignals({ data }: { data: VestedData; nav: MobileNav }) {
  const [tab, setTab] = useState<SignalTab>('Live')
  const head = signalsHeadline(data, tab)
  const list = picks(data)
  const rows = strategies(data)
  const edge = edgeView(data)
  const { weekday, day } = longDate(new Date())

  return (
    <div className="v-today">
      <header className="v-head">
        <div className="v-col" style={{ gap: 10, marginRight: 'auto' }}>
          <p className="v-mono">
            {weekday} &middot; {day} &middot; reads the market, places no orders
          </p>
          <h1 className="v-serif v-h1">
            {head.lead}
            <span className="v-em">{head.em}</span>
            {head.tail}
          </h1>
        </div>
      </header>

      <div className="v-tabs" style={{ marginBottom: 26 }}>
        {SIGNAL_TABS.map((t) => (
          <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Live' ? (
        <div className="vp-grid">
          <section aria-labelledby="sg-picks" className="v-col">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
              <h2 id="sg-picks" className="v-serif v-h2">
                This week&rsquo;s momentum picks
              </h2>
              <span className="v-mono">6-month momentum</span>
            </div>
            {list.length === 0 ? (
              <p className="vp-empty">
                {data.loaded ? 'The leaderboard has not run yet.' : 'Loading…'}
              </p>
            ) : (
              list.map((p) => (
                <div key={p.symbol} className="vs-row">
                  <span className="v-mono">{p.rank}</span>
                  <b>{p.symbol.replace(/\.NS$/, '')}</b>
                  <span className="v-dim">{p.owned ? 'You own it' : 'Not in your portfolio'}</span>
                  <span className="vp-r">
                    {p.momentum !== null ? <Pct value={p.momentum} /> : null}
                  </span>
                </div>
              ))
            )}
            <p className="v-dim" style={{ fontSize: 13, marginTop: 14 }}>
              Picks are signals, not orders. They update from the closing prices after the market
              closes.
            </p>
          </section>
          <aside className="vp-detail">
            <p className="v-mono">Market regime</p>
            {data.regime ? (
              <>
                <h2 className="v-serif" style={{ fontSize: 40, lineHeight: 1 }}>
                  {data.regime.uptrend ? 'Risk-on' : 'Below trend'}
                </h2>
                <p className="vp-why">
                  Nifty is {Math.abs(data.regime.pct_above_sma).toFixed(1)}%{' '}
                  {data.regime.pct_above_sma >= 0 ? 'above' : 'below'} its 200-day average
                  {data.regime.uptrend ? ', so the strategies hold full positions.' : '.'}
                </p>
              </>
            ) : (
              <p className="v-dim">The daily regime check has not run yet.</p>
            )}
          </aside>
        </div>
      ) : null}

      {tab === 'Strategies' ? (
        <section aria-label="Strategies" className="v-col" style={{ maxWidth: 980 }}>
          <p className="vp-why" style={{ maxWidth: 720, marginBottom: 12 }}>
            Paper money only. Each approach is replayed on real prices with costs, and has to beat
            the plain approach for a long time before it earns a green verdict.
          </p>
          {rows.length === 0 ? (
            <p className="vp-empty">
              {data.loaded ? 'No strategies are running yet.' : 'Loading…'}
            </p>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="vs-strategy">
                <span className="v-col" style={{ gap: 3 }}>
                  <b style={{ fontSize: 17 }}>{r.name}</b>
                  <span className="v-dim" style={{ fontSize: 13 }}>
                    {r.note}
                  </span>
                  {r.detail ? (
                    <span className="v-dim" style={{ fontSize: 13 }}>
                      {r.detail}
                    </span>
                  ) : null}
                </span>
                <span className="vp-r">
                  <Pct value={r.result} />
                  {r.against !== null ? (
                    <span className="v-dim"> vs {signedPct(r.against)}</span>
                  ) : null}
                </span>
                <span>
                  <span className={`v-chip ${VERDICT_CHIP[r.verdict]}`}>{r.verdict}</span>
                </span>
              </div>
            ))
          )}
        </section>
      ) : null}

      {tab === 'Lab' ? (
        <section aria-label="Sentiment Edge" className="vp-grid">
          <div className="v-col" style={{ gap: 16 }}>
            <p className="v-mono">Sentiment Edge, India</p>
            {edge ? (
              <>
                <h2 className="v-serif" style={{ fontSize: 42, lineHeight: 1.02 }}>
                  {edge.kind === 'none'
                    ? 'No edge found.'
                    : edge.kind === 'promising'
                      ? 'Promising.'
                      : 'Too early.'}
                </h2>
                <p className="vp-why">{edge.verdict}</p>
                {edge.rule ? (
                  <p className="v-dim" style={{ fontSize: 13, maxWidth: 560 }}>
                    {edge.rule}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="v-dim">
                {data.loaded ? 'The experiment has not produced a result yet.' : 'Loading…'}
              </p>
            )}
          </div>
          {edge ? (
            <aside className="vp-detail">
              <dl className="vp-metrics">
                {edge.metrics.map((m) => (
                  <div key={m.label}>
                    <dt className="v-mono">{m.label}</dt>
                    <dd className={m.negative ? 'v-down' : ''}>{m.value}</dd>
                  </div>
                ))}
              </dl>
              {edge.halves.length ? (
                <div className="v-col" style={{ gap: 10 }}>
                  <p className="v-mono">Net return per trade, by half</p>
                  {edge.halves.map((h) => (
                    <div key={h.label} className="vs-half">
                      <span className="v-dim">{h.label}</span>
                      <Pct value={h.value} />
                    </div>
                  ))}
                </div>
              ) : null}
            </aside>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
