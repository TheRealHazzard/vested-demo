import { useRef } from 'react'
import { BOX, type PathPlot, type Plot, type ScrubPoint } from '../derive'

interface Props {
  plot: Plot | null
  path: PathPlot | null
  goalLabel: string
  summary: string
  scrub: ScrubPoint | null
  onScrub: (p: ScrubPoint | null) => void
}

const pctX = (x: number) => `${(x / BOX.w) * 100}%`
const pctY = (y: number) => `${(y / BOX.h) * 100}%`

/**
 * The net-worth chart. Drag a finger along it to read any day (or, on the path view,
 * any future month); lift to return to today. The lines are stretched to the box and
 * every mark is a positioned element on top, so nothing distorts on tall or narrow screens.
 */
export function ScrubChart({ plot, path, goalLabel, summary, scrub, onScrub }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const points = path ? path.scrub : (plot?.scrub ?? [])

  const nearest = (clientX: number): ScrubPoint | null => {
    const el = box.current
    if (!el || !points.length) return null
    const r = el.getBoundingClientRect()
    const x = ((clientX - r.left) / r.width) * BOX.w
    let best = points[0]
    for (const p of points) if (Math.abs(p.x - x) < Math.abs(best.x - x)) best = p
    return best
  }

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
      <svg viewBox={`0 0 ${BOX.w} ${BOX.h}`} preserveAspectRatio="none" aria-hidden="true">
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
            <path d={plot.line} className="vm-line" />
          </>
        ) : null}
      </svg>

      {path ? (
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
            <>
              <span
                className="vm-dot vm-dot--goal"
                style={{ left: pctX(path.goalHit.x), top: pctY(path.goalHit.y) }}
              />
              <span
                className="vm-year"
                style={{ left: pctX(path.goalHit.x), top: pctY(path.goalHit.y) }}
              >
                {path.goalYear}
              </span>
            </>
          ) : null}
        </>
      ) : plot?.end ? (
        <span
          className="vm-dot vm-dot--now"
          style={{ left: pctX(plot.end.x), top: pctY(plot.end.y) }}
        />
      ) : null}

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
