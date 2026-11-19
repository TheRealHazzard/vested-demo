/**
 * A bottom sheet, the way a phone expects one: a grabber you can tap or drag, a
 * medium rest height that opens to full, a swipe down to dismiss, a close button for
 * everyone who cannot swipe, focus kept inside while it is open and handed back after.
 */
import { X } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  /** Optional line under the title. */
  subtitle?: string
  children: ReactNode
}

type Detent = 'medium' | 'large'

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function Sheet({ open, onClose, title, subtitle, children }: Props) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const opener = useRef<Element | null>(null)
  const [detent, setDetent] = useState<Detent>('medium')
  const [drag, setDrag] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef<{ y: number; t: number } | null>(null)
  const [shown, setShown] = useState(open)

  // Keep the sheet mounted for the closing animation.
  useEffect(() => {
    if (open) {
      setShown(true)
      setDetent('medium')
      setDrag(0)
      return
    }
    const id = window.setTimeout(() => setShown(false), 260)
    return () => window.clearTimeout(id)
  }, [open])

  // Focus in, scroll lock, Escape and Tab handling.
  useEffect(() => {
    if (!open) return
    opener.current = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const raf = requestAnimationFrame(() => panel.current?.focus())

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel.current) return
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      if (opener.current instanceof HTMLElement) opener.current.focus()
    }
  }, [open, onClose])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    start.current = { y: e.clientY, t: performance.now() }
    setDragging(true)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!start.current) return
    setDrag(e.clientY - start.current.y)
  }, [])

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!start.current) return
      const dy = e.clientY - start.current.y
      const speed = dy / Math.max(performance.now() - start.current.t, 1)
      start.current = null
      setDragging(false)
      setDrag(0)
      if (Math.abs(dy) < 6) {
        setDetent((d) => (d === 'medium' ? 'large' : 'medium'))
      } else if (dy > 0 && (dy > 110 || speed > 0.6)) {
        if (detent === 'large') setDetent('medium')
        else onClose()
      } else if (dy < -50 || speed < -0.6) {
        setDetent('large')
      }
    },
    [detent, onClose]
  )

  if (!shown) return null

  return createPortal(
    <div className="vm-portal">
      <button
        type="button"
        className={`vm-backdrop${open ? ' is-open' : ''}`}
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`vm-sheet vm-sheet--${detent}${open ? ' is-open' : ''}${dragging ? ' is-dragging' : ''}`}
        style={{ transform: dragging && drag > 0 ? `translateY(${drag}px)` : undefined }}
      >
        <div
          className="vm-sheet-head"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="vm-grabber" aria-hidden="true" />
        </div>
        <button
          type="button"
          className="vm-sr"
          onClick={() => setDetent((d) => (d === 'medium' ? 'large' : 'medium'))}
        >
          {detent === 'medium' ? 'Expand sheet' : 'Collapse sheet'}
        </button>
        <div className="vm-sheet-bar">
          <div className="vm-sheet-titles">
            <h2 id={titleId} className="vm-sheet-title">
              {title}
            </h2>
            {subtitle ? <p className="vm-sub">{subtitle}</p> : null}
          </div>
          <button type="button" className="vm-circle" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>
        <div className="vm-sheet-body">{children}</div>
      </div>
    </div>,
    document.body
  )
}
