/**
 * Portfolio on a phone: a sentence about balance, the allocation against your targets,
 * a lens and a search, then everything you own as one list. A row opens a sheet.
 */
import { ArrowDown, ArrowUp, ChevronRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { countWord, inr, signedPct } from '../format'
import {
  buildHoldings,
  type Holding,
  LENSES,
  type Lens,
  offBalance,
  targetBoundaries,
} from '../holdings'
import type { VestedData } from '../useVestedData'
import type { MobileNav } from './MobileToday'
import { PageTop } from './PageTop'
import { Sheet } from './Sheet'

const CHIP: Record<string, string> = {
  Trim: 'vm-chip--ember',
  Review: 'vm-chip--ember',
  Watch: 'vm-chip--steel',
  Keep: 'vm-chip--up',
}

const SEGMENT = ['var(--ink)', 'var(--steel)', 'var(--gold)', 'var(--ash)']

function Change({ value, label }: { value: number | null; label: string }) {
  if (value === null) return null
  return (
    <span className={`vm-change ${value < 0 ? 'vm-down' : 'vm-up'}`}>
      {value < 0 ? (
        <ArrowDown size={13} strokeWidth={2.6} />
      ) : (
        <ArrowUp size={13} strokeWidth={2.6} />
      )}
      {signedPct(value)} <span className="vm-dim">{label}</span>
    </span>
  )
}

export function MobilePortfolio({ data, nav }: { data: VestedData; nav: MobileNav }) {
  const all = useMemo(() => buildHoldings(data), [data])
  const total = all.reduce((s, h) => s + h.value, 0)
  const off = offBalance(data)
  const alloc = data.allocation

  const [lens, setLens] = useState<Lens>('All')
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [open, setOpen] = useState<Holding | null>(null)

  const q = query.trim().toLowerCase()
  const list = all.filter(
    (h) => (lens === 'All' || h.lens === lens) && (!q || h.name.toLowerCase().includes(q))
  )
  const visible = q || showAll ? list : list.slice(0, 8)
  const classicHref = nav.settings[0]?.href ?? '#'

  const targetTicks = alloc ? targetBoundaries(alloc.rows) : []
  const weightTotal = alloc ? alloc.rows.reduce((s, r) => s + r.weight_pct, 0) || 100 : 100

  let empty = 'Nothing in this view.'
  if (!data.loaded) empty = 'Loading…'
  else if (q) empty = `No holdings match "${query.trim()}".`
  else if (all.length === 0) empty = 'Run the daily check to fill this in.'

  return (
    <div className="vm-page">
      <PageTop
        eyebrow={`${all.length} holdings`}
        barTitle="Portfolio"
        barSub={<span className="vm-bar-sub vm-dim">{inr(total)}</span>}
        nav={nav}
      />

      <div className="vm-pad">
        <h1 className="vm-title">
          {!data.loaded ? (
            'Reading your holdings.'
          ) : all.length === 0 ? (
            <>
              Nothing here <em>yet.</em>
            </>
          ) : off === 0 ? (
            <>
              Everything you own. <em>All on target.</em>
            </>
          ) : (
            <>
              Everything you own.{' '}
              <em>
                {countWord(off)} {off === 1 ? 'thing is' : 'things are'} off balance.
              </em>
            </>
          )}
        </h1>

        {alloc ? (
          <section aria-label="Allocation against target" className="vm-ribbon-block">
            <div className="vm-ribbon-wrap">
              <div
                className="vm-ribbon"
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
              {targetTicks.map((t) => (
                <span key={t} className="vm-ribbon-tick" style={{ left: `${t}%` }} />
              ))}
            </div>
            <ul className="vm-legend">
              {alloc.rows.map((r, i) => (
                <li key={r.category}>
                  <span className="vm-swatch" style={{ background: SEGMENT[i % SEGMENT.length] }} />
                  <span>
                    {r.category} <b>{r.weight_pct.toFixed(0)}%</b>
                  </span>
                  <span className={r.status === 'on target' ? 'vm-dim' : 'vm-ember'}>
                    {r.status === 'on target'
                      ? 'on target'
                      : `${Math.abs(r.drift_pp).toFixed(0)} ${r.status}`}
                  </span>
                </li>
              ))}
            </ul>
            <p className="vm-cap">Orange marks are your targets.</p>
          </section>
        ) : null}

        <div className="vm-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            placeholder="Search holdings"
            aria-label="Search holdings"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* biome-ignore lint/a11y/useSemanticElements: a fieldset is not reliably flexible on iOS Safari */}
        <div className="vm-seg" role="group" aria-label="Show">
          {LENSES.map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={lens === l}
              onClick={() => {
                setLens(l)
                setShowAll(false)
              }}
            >
              {l}
            </button>
          ))}
        </div>

        <section className="vm-section vm-section--tight" aria-label="Holdings">
          {list.length === 0 ? (
            <div className="vm-group">
              <div className="vm-row vm-row--note">
                <span className="vm-sub">{empty}</span>
              </div>
            </div>
          ) : (
            <div className="vm-group">
              {visible.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  className="vm-row vm-row--tap"
                  onClick={() => setOpen(h)}
                >
                  <span className="vm-rowtext">
                    <span className="vm-rowtitle vm-ellipsis">{h.name}</span>
                    <span className="vm-sub">
                      {inr(h.value)} · {h.share.toFixed(h.share < 10 ? 1 : 0)}%
                    </span>
                  </span>
                  <span className="vm-rowend">
                    {h.verdict ? (
                      <span className={`vm-chip ${CHIP[h.verdict]}`}>{h.verdict}</span>
                    ) : null}
                    {h.today !== null ? (
                      <Change value={h.today} label="today" />
                    ) : (
                      <Change value={h.sixMonth} label="6M" />
                    )}
                  </span>
                  <ChevronRight size={18} className="vm-chev" aria-hidden="true" />
                </button>
              ))}
              {!q && list.length > 8 ? (
                <button
                  type="button"
                  className="vm-row vm-row--tap"
                  onClick={() => setShowAll((s) => !s)}
                >
                  <span className="vm-link">
                    {showAll ? 'Show fewer' : `Show all ${list.length}`}
                  </span>
                </button>
              ) : null}
            </div>
          )}
        </section>

        <p className="vm-foot">
          Shares are of everything listed here. India prices and fund values are as of the last
          daily check.
        </p>
      </div>

      <Sheet
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.name ?? ''}
        subtitle={open?.kind}
      >
        {open ? (
          <>
            {open.verdict ? (
              <p className="vm-sheet-chip">
                <span className={`vm-chip ${CHIP[open.verdict]}`}>{open.verdict}</span>
              </p>
            ) : null}
            <p className="vm-body">{open.why}</p>
            <dl className="vm-metrics">
              <div>
                <dt className="vm-cap">Value</dt>
                <dd>{inr(open.value)}</dd>
              </div>
              <div>
                <dt className="vm-cap">Share</dt>
                <dd>{open.share.toFixed(1)}%</dd>
              </div>
              <div>
                <dt className="vm-cap">{open.today !== null ? 'Today' : '6 months'}</dt>
                <dd className={(open.today ?? open.sixMonth ?? 0) < 0 ? 'vm-down' : ''}>
                  {open.today !== null
                    ? signedPct(open.today)
                    : open.sixMonth !== null
                      ? signedPct(open.sixMonth)
                      : '–'}
                </dd>
              </div>
            </dl>
            {!classicHref.startsWith('#') ? (
              <div className="vm-actions">
                <a
                  className="vm-btn"
                  href={classicHref}
                  onClick={(e) => {
                    e.preventDefault()
                    setOpen(null)
                    nav.onNavigate(classicHref)
                  }}
                >
                  Open in the trading console
                </a>
              </div>
            ) : null}
          </>
        ) : null}
      </Sheet>
    </div>
  )
}
