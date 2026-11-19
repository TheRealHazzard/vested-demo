import { Activity, Home, MoreHorizontal, PieChart, TrendingUp } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import Today from './vested/Today'
import './vested/vested.css'

interface Place {
  label: string
  icon: ReactNode
  built: boolean
}

const PLACES: Place[] = [
  { label: 'Today', icon: <Home size={22} strokeWidth={1.6} />, built: true },
  { label: 'Portfolio', icon: <PieChart size={22} strokeWidth={1.6} />, built: false },
  { label: 'Signals', icon: <Activity size={22} strokeWidth={1.6} />, built: false },
  { label: 'Plan', icon: <TrendingUp size={22} strokeWidth={1.6} />, built: false },
]

/** The shell: a left rail on wide screens, a bottom bar on phones. Only Today exists so far. */
export function App() {
  const [note, setNote] = useState<string | null>(null)

  const item = (p: Place) => (
    <button
      key={p.label}
      type="button"
      className="v-navbtn"
      aria-current={p.built ? 'page' : undefined}
      onClick={() => setNote(p.built ? null : `${p.label} is designed and being built next. Today is the part that exists so far.`)}
    >
      {p.icon}
      {p.label}
    </button>
  )

  return (
    <div className="vested">
      <nav className="v-rail" aria-label="Main">
        <span className="v-logo" aria-hidden="true">
          V
        </span>
        {PLACES.map(item)}
        <div style={{ marginTop: 'auto' }}>
          <button type="button" className="v-navbtn" onClick={() => setNote('Settings and the trading console live here in the full app.')}>
            <MoreHorizontal size={22} strokeWidth={1.6} />
            More
          </button>
        </div>
      </nav>

      <main className="v-main">
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
        <Today />
      </main>

      <nav className="v-tabbar" aria-label="Main">
        {PLACES.map(item)}
        <button type="button" className="v-navbtn" onClick={() => setNote('Settings and the trading console live here in the full app.')}>
          <MoreHorizontal size={22} strokeWidth={1.6} />
          More
        </button>
      </nav>
    </div>
  )
}
