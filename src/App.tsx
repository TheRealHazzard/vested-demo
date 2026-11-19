import { Activity, Home, MoreHorizontal, PieChart, TrendingUp } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { buildNeeds } from './vested/derive'
import { MobileShell } from './vested/mobile/MobileShell'
import type { MobileNav } from './vested/mobile/MobileToday'
import type { Place, PlaceId } from './vested/mobile/TabBar'
import Plan from './vested/Plan'
import Portfolio from './vested/Portfolio'
import Signals from './vested/Signals'
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
  { label: 'Portfolio', icon: <PieChart size={22} strokeWidth={1.6} />, built: true },
  { label: 'Signals', icon: <Activity size={22} strokeWidth={1.6} />, built: true },
  { label: 'Plan', icon: <TrendingUp size={22} strokeWidth={1.6} />, built: true },
]

const NOT_YET = 'That part of the app is not in the demo.'

/** The demo shell: the phone layout on small screens, the rail on wide ones. Only Today exists. */
export function App() {
  const isMobile = useIsMobile()
  const data = useVestedData()
  const [note, setNote] = useState<string | null>(null)
  const [place, setPlace] = useState<PlaceId>('today')

  const nav: MobileNav = useMemo(
    () => ({
      places: PLACES,
      onNavigate: (href) => {
        const id = href.slice(1) as PlaceId
        if (['today', 'portfolio', 'signals', 'plan'].includes(id)) {
          setNote(null)
          setPlace(id)
          window.scrollTo(0, 0)
        } else setNote(NOT_YET)
      },
      settings: [
        { label: 'Trading console', detail: 'Orders, positions and the classic dashboard', href: '#console' },
        { label: 'System health', detail: 'Whether the daily checks are passing', href: '#health' },
        { label: 'Telegram and settings', detail: 'Alerts, bots and your profile', href: '#settings' },
      ],
    }),
    []
  )

  const pages: Record<PlaceId, ReactNode> = {
    today: <Today data={data} nav={nav} />,
    portfolio: <Portfolio data={data} nav={nav} />,
    signals: <Signals data={data} nav={nav} />,
    plan: <Plan data={data} nav={nav} />,
  }
  const page = pages[place]

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
        active={place}
        places={PLACES}
        badge={urgent > 0 ? { place: 'today', count: urgent } : undefined}
        onNavigate={nav.onNavigate}
      >
        {banner}
        {page}
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
            aria-current={p.label.toLowerCase() === place ? 'page' : undefined}
            onClick={() => nav.onNavigate(p.built ? `#${p.label.toLowerCase()}` : '#soon')}
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
        {page}
      </main>
    </div>
  )
}
