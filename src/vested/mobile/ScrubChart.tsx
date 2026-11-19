import { useRef } from 'react'
import { BOX, HORIZON_MONTHS, type PathPlot, type Plot, type ScrubPoint, TODAY_X } from '../derive'

interface Props {
  plot: Plot | null
  path: PathPlot | null
  /** Changes when the range changes, so the line draws in again. */
  drawKey: string
  goalLabel: string
  summary: string
  scrub: ScrubPoint | null
  onScrub: (p: ScrubPoint | null) => void
  /** Path view only: the month the goal is dragged to, or null for the plan as it stands. */
  goalMonths: number | null
  onGoalMonths: (months: number | null) => void
  showBench: boolean
}

const pctX = (x: number) => `${(x / BOX.w) * 100}%`
const pctY = (y: number) => `${(y / BOX.h) * 100}%`
const clampMonths = (m: number) => Math.min(Math.max(Math.round(m), 12), HORIZON_MONTHS)

/**
 * The net-worth chart. Drag a finger along it to read any day (or, on the path view, any
 * future month); lift to return to today. On the path view the hollow goal marker can be
 * dragged to a different year: the saving needed to get there is worked out and shown.
 * The lines are stretched to the box and every mark is a positioned element on top, so
 * nothing distorts on tall or narrow screens.
 */
export function ScrubChart({
  plot,
  path,
  drawKey,
  goalLabel,
  summary,
  scrub,
  onScrub,
  goalMonths,
  onGoalMonths,
  showBench,
}: Props) {
  const box = useRef<HTMLDivElement>(null)
  const points = path ? path.scrub : (plot?.scrub ?? [])

  const xAt = (clientX: number): number => {
    const el = box.current
    if (!el) return 0
    const r = el.getBoundingClientRect()
    return ((clientX - r.left) / r.width) * BOX.w
  }

  const nearest = (clientX: number): ScrubPoint | null => {
    if (!points.length) return null
    const x = xAt(clientX)
    let best = points[0]
    for (const p of points) if (Math.abs(p.x - x) < Math.abs(best.x - x)) best = p
    return best
  }

  const monthsAtX = (x: number) => clampMonths(((x - TODAY_X) / (BOX.w - TODAY_X)) * HORIZON_MONTHS)
  const knob = path ? (path.goalHit ?? { x: BOX.w - 2, y: path.goalY }) : null
  const nowMonths = path?.goalHit ? monthsAtX(path.goalHit.x) : HORIZON_MONTHS

  return (
    <div
      ref={box}
      className="vm-chart"
      role="img"
      aria-label={summary}
      onPointerDown={(e) => onScrub(nearest(e.clientX))}
      onPointerMove={(e) => {
        if (e.buttons || e.pointerType === 'touch') onScrub(nearest(e.clientX))
      }}
      onPointerUp={() => onScrub(null)}
      onPointerCancel={() => onScrub(null)}
      onPointerLeave={() => onScrub(null)}
    >
      <svg
        key={drawKey}
        viewBox={`0 0 ${BOX.w} ${BOX.h}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="vm-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ece4d6" stopOpacity="0.18" />
            <stop offset="1" stopColor="#ece4d6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 70H760M0 150H760M0 230H760" className="vm-grid" />
        {path ? (
          <>
            <path d={`M${path.today.x} ${path.goalY}H${BOX.w}`} className="vm-goalline" />
            <path d={path.cone} fill="#ff7a1a" fillOpacity="0.14" />
            <path d={path.base} className="vm-proj" />
            <path d={path.historyArea} fill="url(#vm-fade)" />
            <path d={path.history} className="vm-line" />
          </>
        ) : plot?.enough ? (
          <>
            <path d={plot.area} fill="url(#vm-fade)" />
            {showBench && plot.bench ? <path d={plot.bench} className="vm-bench" /> : null}
            <path d={plot.line} className="vm-line" />
          </>
        ) : null}
      </svg>

      <div key={`m-${drawKey}`} className="vm-marks">
        {path && knob ? (
          <>
            <span className="vm-vline" style={{ left: pctX(path.today.x) }} />
            <span className="vm-tag" style={{ left: pctX(path.today.x), top: 0 }}>
              Today
            </span>
            <span
              className="vm-tag vm-tag--ember"
              style={{ right: 0, top: pctY(path.goalY), transform: 'translateY(-130%)' }}
            >
              {goalLabel}
            </span>
            <span
              className="vm-dot vm-dot--now"
              style={{ left: pctX(path.today.x), top: pctY(path.today.y) }}
            />
            {path.goalHit ? (
              <span
                className="vm-year"
                style={{ left: pctX(path.goalHit.x), top: pctY(path.goalHit.y) }}
              >
                {path.goalYear}
              </span>
            ) : null}
            <div
              className="vm-knob"
              role="slider"
              tabIndex={0}
              aria-label="Goal date. Drag, or use the arrow keys, to see what it would take."
              aria-valuemin={12}
              aria-valuemax={HORIZON_MONTHS}
              aria-valuenow={goalMonths ?? nowMonths}
              aria-valuetext={path.goalYear ? `Goal in ${path.goalYear}` : 'Goal beyond 15 years'}
              style={{ left: pctX(knob.x), top: pctY(knob.y) }}
              onPointerDown={(e) => {
                e.stopPropagation()
                e.currentTarget.setPointerCapture(e.pointerId)
              }}
              onPointerMove={(e) => {
                if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
                e.stopPropagation()
                onGoalMonths(monthsAtX(xAt(e.clientX)))
              }}
              onPointerUp={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                const step = e.key === 'ArrowLeft' ? -6 : e.key === 'ArrowRight' ? 6 : 0
                if (!step) return
                e.preventDefault()
                onGoalMonths(clampMonths((goalMonths ?? nowMonths) + step))
              }}
            >
              <span className="vm-knob-dot" />
            </div>
          </>
        ) : plot?.end ? (
          <span
            className="vm-dot vm-dot--now"
            style={{ left: pctX(plot.end.x), top: pctY(plot.end.y) }}
          />
        ) : null}

        {!path
          ? plot?.events.map((e) => (
              <span
                key={`${e.tone}-${e.x}`}
                className={`vm-evt vm-evt--${e.tone}`}
                style={{ left: pctX(e.x), top: pctY(e.y) }}
              />
            ))
          : null}
      </div>

      {scrub ? (
        <>
          <span className="vm-vline vm-vline--scrub" style={{ left: pctX(scrub.x) }} />
          <span
            className="vm-dot vm-dot--scrub"
            style={{ left: pctX(scrub.x), top: pctY(scrub.y) }}
          />
        </>
      ) : null}

      {!path && !plot?.enough ? (
        <p className="vm-chart-empty">
          Not enough history yet. The daily snapshot adds one point a day.
        </p>
      ) : null}
    </div>
  )
}
