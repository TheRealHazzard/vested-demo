/**
 * Signals on a phone: what the bots say, in three lenses. Live is this week's picks and the
 * market's mood; Strategies is how each approach is doing against the plain one; Lab is the
 * verdict on the sentiment experiment, shown as plainly as a gain would be.
 */
import { ArrowDown, ArrowUp, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { signedPct } from '../format'
import {
  edgeView,
  picks,
  SIGNAL_TABS,
  type SignalTab,
  type StrategyRow,
  signalsHeadline,
  strategies,
} from '../signalsLogic'
import type { VestedData } from '../useVestedData'
import type { MobileNav } from './MobileToday'
import { PageTop } from './PageTop'
import { Sheet } from './Sheet'

const VERDICT_CHIP: Record<string, string> = {
  Ahead: 'vm-chip--up',
  Behind: 'vm-chip--ember',
  Running: 'vm-chip--steel',
}

function Trend({ value }: { value: number }) {
  return (
    <span className={`vm-change ${value < 0 ? 'vm-down' : 'vm-up'}`}>
      {value < 0 ? (
        <ArrowDown size={13} strokeWidth={2.6} />
      ) : (
        <ArrowUp size={13} strokeWidth={2.6} />
      )}
      {signedPct(value)}
    </span>
  )
}

export function MobileSignals({ data, nav }: { data: VestedData; nav: MobileNav }) {
  const [tab, setTab] = useState<SignalTab>('Live')
  const [open, setOpen] = useState<StrategyRow | null>(null)
  const head = signalsHeadline(data, tab)
  const list = picks(data)
  const rows = strategies(data)
  const edge = edgeView(data)
  const todayHref = nav.places.find((p) => p.id === 'today')?.href ?? '#'

  return (
    <div className="vm-page">
      <PageTop
        eyebrow="Reads the market, places no orders"
        barTitle="Signals"
        barSub={<span className="vm-bar-sub vm-dim">{tab}</span>}
        nav={nav}
      />

      <div className="vm-pad">
        <h1 className="vm-title">
          {head.lead}
          <em>{head.em}</em>
          {head.tail}
        </h1>

        {/* biome-ignore lint/a11y/useSemanticElements: a fieldset is not reliably flexible on iOS Safari */}
        <div className="vm-seg" role="group" aria-label="Show">
          {SIGNAL_TABS.map((t) => (
            <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'Live' ? (
          <>
            <section className="vm-section vm-section--tight" aria-labelledby="vm-picks">
              <div className="vm-sechead">
                <h2 id="vm-picks">This week&rsquo;s picks</h2>
                <span className="vm-cap">momentum, 6 months</span>
              </div>
              <div className="vm-group">
                {list.length === 0 ? (
                  <div className="vm-row vm-row--note">
                    <span className="vm-sub">
                      {data.loaded ? 'The leaderboard has not run yet.' : 'Loading…'}
                    </span>
                  </div>
                ) : (
                  list.map((p) => (
                    <div key={p.symbol} className="vm-row">
                      <span className="vm-rank">{p.rank}</span>
                      <span className="vm-rowtext">
                        <span className="vm-rowtitle">{p.symbol.replace(/\.NS$/, '')}</span>
                        <span className="vm-sub">
                          {p.owned ? 'You own it' : 'Not in your portfolio'}
                        </span>
                      </span>
                      {p.momentum !== null ? <Trend value={p.momentum} /> : null}
                    </div>
                  ))
                )}
              </div>
              <p className="vm-foot">
                Picks are signals, not orders. They come from the closing prices and update after
                the market closes.
              </p>
            </section>

            <section className="vm-section" aria-labelledby="vm-mood">
              <div className="vm-sechead">
                <h2 id="vm-mood">Market mood</h2>
              </div>
              <div className="vm-group">
                {data.regime ? (
                  <div className="vm-row">
                    <span className="vm-rowtext">
                      <span className="vm-rowtitle">
                        {data.regime.uptrend ? 'Risk-on' : 'Below trend'}
                      </span>
                      <span className="vm-sub">
                        Nifty is {Math.abs(data.regime.pct_above_sma).toFixed(1)}%{' '}
                        {data.regime.pct_above_sma >= 0 ? 'above' : 'below'} its 200-day average
                        {data.regime.uptrend ? ', so the strategies hold full positions.' : '.'}
                      </span>
                    </span>
                  </div>
                ) : (
                  <div className="vm-row vm-row--note">
                    <span className="vm-sub">The daily regime check has not run yet.</span>
                  </div>
                )}
                <button
                  type="button"
                  className="vm-row vm-row--tap"
                  onClick={() => nav.onNavigate(todayHref)}
                >
                  <span className="vm-rowtext">
                    <span className="vm-rowtitle">Alerts</span>
                    <span className="vm-sub">What needs you is on Today.</span>
                  </span>
                  <ChevronRight size={18} className="vm-chev" aria-hidden="true" />
                </button>
              </div>
            </section>
          </>
        ) : null}

        {tab === 'Strategies' ? (
          <section className="vm-section vm-section--tight" aria-label="Strategies">
            <p className="vm-sub vm-caption">
              Paper money only. Each approach is replayed on real prices with costs, and has to beat
              the plain approach for a long time before it earns a green verdict.
            </p>
            <div className="vm-group">
              {rows.length === 0 ? (
                <div className="vm-row vm-row--note">
                  <span className="vm-sub">
                    {data.loaded ? 'No strategies are running yet.' : 'Loading…'}
                  </span>
                </div>
              ) : (
                rows.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="vm-row vm-row--tap"
                    onClick={() => setOpen(r)}
                  >
                    <span className="vm-rowtext">
                      <span className="vm-rowtitle">{r.name}</span>
                      <span className="vm-sub vm-clamp">{r.note}</span>
                    </span>
                    <span className="vm-rowend">
                      <span className={`vm-chip ${VERDICT_CHIP[r.verdict]}`}>{r.verdict}</span>
                      <Trend value={r.result} />
                    </span>
                    <ChevronRight size={18} className="vm-chev" aria-hidden="true" />
                  </button>
                ))
              )}
            </div>
          </section>
        ) : null}

        {tab === 'Lab' ? (
          <section className="vm-section vm-section--tight" aria-labelledby="vm-edge">
            <div className="vm-sechead">
              <h2 id="vm-edge">Sentiment Edge, India</h2>
              {edge ? (
                <span
                  className={`vm-chip ${edge.kind === 'promising' ? 'vm-chip--up' : 'vm-chip--plain'}`}
                >
                  {edge.kind === 'none'
                    ? 'No edge found'
                    : edge.kind === 'promising'
                      ? 'Promising'
                      : 'Too early'}
                </span>
              ) : null}
            </div>
            {edge ? (
              <>
                <p className="vm-body">{edge.verdict}</p>
                {edge.metrics.length ? (
                  <dl className="vm-metrics">
                    {edge.metrics.map((m) => (
                      <div key={m.label}>
                        <dt className="vm-cap">{m.label}</dt>
                        <dd className={m.negative ? 'vm-down' : ''}>{m.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {edge.halves.length ? (
                  <>
                    <div className="vm-sechead" style={{ marginTop: 18 }}>
                      <h2>Net return per trade, by half</h2>
                    </div>
                    <div className="vm-group">
                      {edge.halves.map((h) => (
                        <div key={h.label} className="vm-row">
                          <span className="vm-grow">{h.label}</span>
                          <Trend value={h.value} />
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
                {edge.rule ? <p className="vm-foot">{edge.rule}</p> : null}
              </>
            ) : (
              <div className="vm-group">
                <div className="vm-row vm-row--note">
                  <span className="vm-sub">
                    {data.loaded ? 'The experiment has not produced a result yet.' : 'Loading…'}
                  </span>
                </div>
              </div>
            )}
          </section>
        ) : null}
      </div>

      <Sheet
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.name ?? ''}
        subtitle={open?.note}
      >
        {open ? (
          <>
            <p className="vm-sheet-chip">
              <span className={`vm-chip ${VERDICT_CHIP[open.verdict]}`}>{open.verdict}</span>
            </p>
            {open.detail ? <p className="vm-body">{open.detail}</p> : null}
            <dl className="vm-metrics">
              <div>
                <dt className="vm-cap">Result</dt>
                <dd className={open.result < 0 ? 'vm-down' : ''}>{signedPct(open.result)}</dd>
              </div>
              {open.against !== null ? (
                <div>
                  <dt className="vm-cap">Plain approach</dt>
                  <dd>{signedPct(open.against)}</dd>
                </div>
              ) : null}
            </dl>
          </>
        ) : null}
      </Sheet>
    </div>
  )
}
