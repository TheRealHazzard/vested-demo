/**
 * Portfolio on a wide screen: the allocation against your targets across the top,
 * then the list on the left and the selected holding on the right.
 */
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { countWord, inr, longDate, signedPct } from './format'
import {
  buildHoldings,
  type Holding,
  LENSES,
  type Lens,
  lensCounts,
  offBalance,
  targetBoundaries,
} from './holdings'
import type { MobileNav } from './mobile/MobileToday'
import type { VestedData } from './useVestedData'

const SEGMENT = ['var(--v-ink)', 'var(--v-steel)', 'var(--v-gold)', 'var(--v-ash)']
const CHIP: Record<string, string> = {
  Trim: 'v-chip--ember',
  Review: 'v-chip--ember',
  Watch: 'v-chip--steel',
  Keep: 'v-chip--up',
}

function Pct({ value }: { value: number | null }) {
  if (value === null) return <span className="v-dim">–</span>
  return <span className={value < 0 ? 'v-down' : 'v-up'}>{signedPct(value)}</span>
}

export function DesktopPortfolio({ data }: { data: VestedData; nav: MobileNav }) {
  const all = useMemo(() => buildHoldings(data), [data])
  const counts = lensCounts(all)
  const total = all.reduce((s, h) => s + h.value, 0)
  const off = offBalance(data)
  const alloc = data.allocation
  const { weekday, day } = longDate(new Date())

  const [lens, setLens] = useState<Lens>('All')
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<string | null>(null)

  const q = query.trim().toLowerCase()
  const list = all.filter(
    (h) => (lens === 'All' || h.lens === lens) && (!q || h.name.toLowerCase().includes(q))
  )
  const sel: Holding | undefined = list.find((h) => h.id === picked) ?? list[0]
  const maxShare = Math.max(...all.map((h) => h.share), 1) * 1.1
  const weightTotal = alloc ? alloc.rows.reduce((s, r) => s + r.weight_pct, 0) || 100 : 100
  const ticks = alloc ? targetBoundaries(alloc.rows) : []

  return (
    <div className="v-today">
      <header className="v-head">
        <div className="v-col" style={{ gap: 10, marginRight: 'auto' }}>
          <p className="v-mono">
            {weekday} &middot; {day} &middot; {inr(total)} &middot; {all.length} holdings
          </p>
          <h1 className="v-serif v-h1">
            {!data.loaded ? (
              'Reading your holdings.'
            ) : all.length === 0 ? (
              <>
                Nothing here <span className="v-em">yet.</span>
              </>
            ) : off === 0 ? (
              <>
                Everything you own. <span className="v-em">All on target.</span>
              </>
            ) : (
              <>
                Everything you own.{' '}
                <span className="v-em">
                  {countWord(off)} {off === 1 ? 'thing is' : 'things are'} off balance.
                </span>
              </>
            )}
          </h1>
        </div>
      </header>

      {alloc ? (
        <section className="vp-alloc" aria-labelledby="vp-alloc">
          <h2 id="vp-alloc" className="v-mono">
            Allocation against target
          </h2>
          <div className="vp-ribbon-wrap">
            <div
              className="vp-ribbon"
              role="img"
              aria-label={alloc.rows
                .map((r) => `${r.category} ${r.weight_pct.toFixed(0)}%`)
                .join(', ')}
            >
              {alloc.rows.map((r, i) => (
                <span
                  key={r.category}
                  style={{
                    flex: r.weight_pct / weightTotal,
                    background: SEGMENT[i % SEGMENT.length],
                  }}
                />
              ))}
            </div>
            {ticks.map((t) => (
              <span key={t} className="vp-ribbon-tick" style={{ left: `${t}%` }} />
            ))}
          </div>
          <div className="vp-ribbon-labels">
            {alloc.rows.map((r) => (
              <div key={r.category} style={{ flex: r.weight_pct / weightTotal }}>
                <b>
                  {r.category} {r.weight_pct.toFixed(0)}%
                </b>{' '}
                <span className={r.status === 'on target' ? 'v-dim' : 'v-ember'}>
                  {r.status === 'on target'
                    ? 'on target'
                    : `${Math.abs(r.drift_pp).toFixed(0)} ${r.status}`}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="vp-grid">
        <section aria-label="Holdings" className="v-col">
          <div className="vp-controls">
            <div className="v-tabs">
              {LENSES.map((l) => (
                <button key={l} type="button" aria-pressed={lens === l} onClick={() => setLens(l)}>
                  {l} <span className="v-dim">{counts[l]}</span>
                </button>
              ))}
            </div>
            <label className="vp-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search"
                aria-label="Search holdings"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>

          <div className="vp-row vp-row--head v-mono" aria-hidden="true">
            <span>Holding</span>
            <span className="vp-r">Value</span>
            <span>Share</span>
            <span className="vp-r">Today</span>
            <span className="vp-r">6 months</span>
            <span>Verdict</span>
          </div>
          {list.length === 0 ? (
            <p className="vp-empty">
              {!data.loaded
                ? 'Loading…'
                : q
                  ? `No holdings match "${query.trim()}".`
                  : 'Nothing in this view.'}
            </p>
          ) : (
            list.map((h) => (
              <button
                key={h.id}
                type="button"
                className="vp-row"
                aria-pressed={sel?.id === h.id}
                onClick={() => setPicked(h.id)}
              >
                <span className="v-col" style={{ gap: 2 }}>
                  <b className="vp-name">{h.name}</b>
                  <span className="vp-kind">{h.kind}</span>
                </span>
                <span className="vp-r">{inr(h.value)}</span>
                <span className="vp-size">
                  <span className="v-track">
                    <span
                      className="v-fill"
                      style={{
                        width: `${(h.share / maxShare) * 100}%`,
                        background: 'var(--v-ink)',
                      }}
                    />
                  </span>
                  <span className="vp-pct">{h.share.toFixed(h.share < 10 ? 1 : 0)}%</span>
                </span>
                <span className="vp-r">
                  <Pct value={h.today} />
                </span>
                <span className="vp-r">
                  <Pct value={h.sixMonth} />
                </span>
                <span>
                  {h.verdict ? (
                    <span className={`v-chip ${CHIP[h.verdict]}`}>{h.verdict}</span>
                  ) : null}
                </span>
              </button>
            ))
          )}
        </section>

        <aside className="vp-detail" aria-label="Selected holding">
          {sel ? (
            <>
              <p className="v-mono">{sel.kind}</p>
              <h2 className="v-serif vp-dname">{sel.name}</h2>
              <p className="vp-dline">
                {sel.verdict ? (
                  <span className={`v-chip ${CHIP[sel.verdict]}`}>{sel.verdict}</span>
                ) : null}
                <span className="v-dim">
                  {inr(sel.value)} &middot; {sel.share.toFixed(1)}% of what is listed
                </span>
              </p>
              <p className="vp-why">{sel.why}</p>
              <dl className="vp-metrics">
                <div>
                  <dt className="v-mono">Today</dt>
                  <dd>
                    <Pct value={sel.today} />
                  </dd>
                </div>
                <div>
                  <dt className="v-mono">6 months</dt>
                  <dd>
                    <Pct value={sel.sixMonth} />
                  </dd>
                </div>
                <div>
                  <dt className="v-mono">Value</dt>
                  <dd>{inr(sel.value)}</dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="v-dim">Pick a holding to see why it has its verdict.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
