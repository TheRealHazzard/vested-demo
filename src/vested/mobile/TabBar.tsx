import type { ReactNode } from 'react'

export type PlaceId = 'today' | 'portfolio' | 'signals' | 'plan'

export interface Place {
  id: PlaceId
  label: string
  href: string
}

/** Outline when idle, filled when selected, the way the platform draws them. */
const HOUSE =
  'M12 3.2 3.4 10.4a1 1 0 0 0-.4.8V20a1 1 0 0 0 1 1h4.6v-6.2h6.8V21H20a1 1 0 0 0 1-1v-8.8a1 1 0 0 0-.4-.8z'

const ICON: Record<PlaceId, (on: boolean) => ReactNode> = {
  today: (on) => (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={HOUSE}
        fill={on ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  ),
  portfolio: (on) => (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M11 3.2a9 9 0 1 0 9.8 9.8H11z"
        fill={on ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M13.2 2.9a8.2 8.2 0 0 1 7.9 7.9h-7.9z"
        fill={on ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  ),
  signals: (on) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12h4l3-8 4 16 3-8h4"
        stroke="currentColor"
        strokeWidth={on ? 2.6 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  plan: (on) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 18 9.5 11l4 4L21 6"
        stroke="currentColor"
        strokeWidth={on ? 2.6 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 6h6v6"
        stroke="currentColor"
        strokeWidth={on ? 2.6 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
}

interface Props {
  places: Place[]
  active: PlaceId
  /** Only for things that need attention now, so it keeps its meaning. */
  badge?: { place: PlaceId; count: number }
  onNavigate: (href: string) => void
}

/** Four top-level places, always visible, one word each. Solid black with a hairline. */
export function TabBar({ places, active, badge, onNavigate }: Props) {
  return (
    <nav className="vm-tabbar" aria-label="Main">
      {places.map((p) => {
        const on = p.id === active
        const count = badge?.place === p.id ? badge.count : 0
        return (
          <a
            key={p.id}
            href={p.href}
            aria-current={on ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault()
              if (!on) onNavigate(p.href)
              else window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <span className="vm-tabicon">
              {ICON[p.id](on)}
              {count > 0 ? (
                <span className="vm-badge" role="img" aria-label={`${count} need you`}>
                  {count}
                </span>
              ) : null}
            </span>
            {p.label}
          </a>
        )
      })}
    </nav>
  )
}
