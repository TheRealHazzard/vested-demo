import { type ReactNode, useEffect } from 'react'
import './vm.css'
import { type Place, type PlaceId, TabBar } from './TabBar'

interface Props {
  active: PlaceId
  places: Place[]
  badge?: { place: PlaceId; count: number }
  onNavigate: (href: string) => void
  children: ReactNode
}

/** The phone frame: page content on the document (so the status bar and address bar behave), tab bar pinned below. */
export function MobileShell({ active, places, badge, onNavigate, children }: Props) {
  // Keep the overscroll area and the browser chrome black, then hand both back.
  useEffect(() => {
    const root = document.documentElement
    const prev = root.style.backgroundColor
    root.style.backgroundColor = '#000'
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const created = !meta
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    const prevColor = meta.content
    meta.content = '#000000'
    return () => {
      root.style.backgroundColor = prev
      if (created) meta?.remove()
      else if (meta) meta.content = prevColor
    }
  }, [])

  return (
    <div className="vm">
      {children}
      <TabBar places={places} active={active} badge={badge} onNavigate={onNavigate} />
    </div>
  )
}
