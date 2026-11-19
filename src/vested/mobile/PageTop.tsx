import { ChevronRight, Settings } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import type { MobileNav } from './MobileToday'
import { Sheet } from './Sheet'

interface Props {
  /** Small line above the title: the date, or a count. */
  eyebrow: string
  /** What the bar shows once the big title has scrolled away. */
  barTitle: string
  barSub?: ReactNode
  nav: MobileNav
}

/**
 * The top of every phone page: a quiet line and the More button, with no empty bar above.
 * Once the large title scrolls away a slim bar slides in carrying the page's key figure.
 */
export function PageTop({ eyebrow, barTitle, barSub, nav }: Props) {
  const [condensed, setCondensed] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 150)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header className={`vm-bar${condensed ? ' is-condensed' : ''}`} inert={!condensed}>
        <div className="vm-bar-mid">
          <span className="vm-bar-title">{barTitle}</span>
          {barSub}
        </div>
        <button
          type="button"
          className="vm-circle vm-bar-btn"
          aria-label="More"
          onClick={() => setOpen(true)}
        >
          <Settings size={20} strokeWidth={1.8} />
        </button>
      </header>

      <div className="vm-pad">
        <div className="vm-top">
          <p className="vm-cap">{eyebrow}</p>
          <button
            type="button"
            className="vm-circle"
            aria-label="More"
            onClick={() => setOpen(true)}
          >
            <Settings size={20} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="More">
        <div className="vm-group">
          {nav.settings.map((s) => (
            <button
              key={s.label}
              type="button"
              className="vm-row vm-row--tap"
              onClick={() => {
                setOpen(false)
                nav.onNavigate(s.href)
              }}
            >
              <span className="vm-rowtext">
                <span className="vm-rowtitle">{s.label}</span>
                <span className="vm-sub">{s.detail}</span>
              </span>
              <ChevronRight size={18} className="vm-chev" aria-hidden="true" />
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}
