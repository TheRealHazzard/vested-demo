import { Activity, Home, MoreHorizontal, PieChart, TrendingUp } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { buildNeeds } from './vested/derive'
import { MobileShell } from './vested/mobile/MobileShell'
import type { MobileNav } from './vested/mobile/MobileToday'
import type { Place } from './vested/mobile/TabBar'
import Today from './vested/Today'
import { useIsMobile } from './vested/useIsMobile'
import { useVestedData } from './vested/useVestedData'
import './demo.css'
import './vested/vested.css'

const PLACES: Place[] = [
  { id: 'today', label: 'Today', href: '#today' },
  { id: 'portfolio', label: 'Portfolio', href: '#portfolio' },
  { id: 'signals', label: 'Signals', href: '#signals' },
  { id: 'plan', label: 'Plan', href: '#plan' },
]

const RAIL: { label: string; icon: ReactNode; built: boolean }[] = [
  { label: 'Today', icon: <Home size={22} strokeWidth={1.6} />, built: true },
  { label: 'Portfolio', icon: <PieChart size={22} strokeWidth={1.6} />, built: false },
  { label: 'Signals', icon: <Activity size={22} strokeWidth={1.6} />, built: false },
  { label: 'Plan', icon: <TrendingUp size={22} strokeWidth={1.6} />, built: false },
]

const NOT_YET = 'That part is designed and being built next. Today is what exists so far.'

/** The demo shell: the phone layout on small screens, the rail on wide ones. Only Today exists. */
export function App() {
  const isMobile = useIsMobile()
  const data = useVestedData()
  const [note, setNote] = useState<string | null>(null)

  const nav: MobileNav = useMemo(
    () => ({
      places: PLACES,
      onNavigate: (href) => setNote(href === '#today' ? null : NOT_YET),
      settings: [
        { label: 'Trading console', detail: 'Orders, positions and the classic dashboard', href: '#console' },
        { label: 'System health', detail: 'Whether the daily checks are passing', href: '#health' },
        { label: 'Telegram and settings', detail: 'Alerts, bots and your profile', href: '#settings' },
      ],
    }),
    []
  )

  const banner = (
    <div className="v-demostrip">
      <p className="v-demo">
        <span className="v-mono">Demo</span> Sample data, not real money.
      </p>
      {note ? (
        <output className="v-note">
          {note}
          <button type="button" onClick={() => setNote(null)}>
            Dismiss
          </button>
        </output>
      ) : null}
    </div>
  )

  if (isMobile) {
    const urgent = buildNeeds(data).filter((n) => n.hot).length
    return (
      <MobileShell
        active="today"
        places={PLACES}
        badge={urgent > 0 ? { place: 'today', count: urgent } : undefined}
        onNavigate={nav.onNavigate}
      >
        {banner}
        <Today data={data} nav={nav} />
      </MobileShell>
    )
  }

  return (
    <div className="vested">
      <nav className="v-rail" aria-label="Main">
        <span className="v-logo" aria-hidden="true">
          V
        </span>
        {RAIL.map((p) => (
          <button
            key={p.label}
            type="button"
            className="v-navbtn"
            aria-current={p.built ? 'page' : undefined}
            onClick={() => setNote(p.built ? null : NOT_YET)}
          >
            {p.icon}
            {p.label}
          </button>
        ))}
        <div style={{ marginTop: 'auto' }}>
          <button type="button" className="v-navbtn" onClick={() => setNote(NOT_YET)}>
            <MoreHorizontal size={22} strokeWidth={1.6} />
            More
          </button>
        </div>
      </nav>
      <main className="v-main">
        {banner}
        <Today data={data} nav={nav} />
      </main>
    </div>
  )
}
