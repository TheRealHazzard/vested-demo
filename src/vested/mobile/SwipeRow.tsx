import { type ReactNode, useRef, useState } from 'react'

interface Props {
  children: ReactNode
  /** What the revealed action says, and what it does. */
  actionLabel: string
  onAction: () => void
}

const OPEN = -92

/**
 * A list row you can swipe left to reveal one action (the way Mail and Reminders do).
 * It is only a shortcut: the same action is always one tap away inside the row's sheet.
 */
export function SwipeRow({ children, actionLabel, onAction }: Props) {
  const [x, setX] = useState(0)
  const [drag, setDrag] = useState(false)
  const start = useRef<{ x: number; y: number; base: number } | null>(null)
  const moved = useRef(false)

  const end = () => {
    if (!start.current) return
    start.current = null
    setDrag(false)
    setX((cur) => (cur < OPEN / 2 ? OPEN : 0))
  }

  return (
    <div className="vm-swipe">
      <button
        type="button"
        className="vm-swipe-action"
        tabIndex={x === 0 ? -1 : 0}
        onClick={onAction}
      >
        {actionLabel}
      </button>
      <div
        className={`vm-swipe-body${drag ? ' is-dragging' : ''}`}
        style={{ transform: `translateX(${x}px)` }}
        onPointerDown={(e) => {
          start.current = { x: e.clientX, y: e.clientY, base: x }
          moved.current = false
        }}
        onPointerMove={(e) => {
          const s = start.current
          if (!s) return
          const dx = e.clientX - s.x
          const dy = e.clientY - s.y
          if (!moved.current && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            moved.current = true
            setDrag(true)
            e.currentTarget.setPointerCapture(e.pointerId)
          }
          if (moved.current) setX(Math.min(0, Math.max(OPEN - 24, s.base + dx)))
        }}
        onPointerUp={end}
        onPointerCancel={end}
        onClickCapture={(e) => {
          // A swipe is not a tap; and a tap on an opened row just closes it.
          if (moved.current) {
            e.stopPropagation()
            e.preventDefault()
            moved.current = false
          } else if (x !== 0) {
            e.stopPropagation()
            e.preventDefault()
            setX(0)
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}
