import { useMemo, useState } from 'react'
import { ASSUMED_RETURN, BOX, plotPath, plotRange, type RangeKey } from './derive'
import { inr } from './format'
import type { VestedData } from './useVestedData'

interface Props {
  data: VestedData
  netWorth: number
}

const RANGES: RangeKey[] = ['1M', '6M', '1Y', 'All', 'Path']
const LABEL: Record<RangeKey, string> = {
  '1M': '1M',
  '6M': '6M',
  '1Y': '1Y',
  All: 'All',
  Path: 'Path to goal',
}

/** Net worth over time, with a "Path" view that carries on into the future toward the goal. */
export function NetWorthChart({ data, netWorth }: Props) {
  const goal = data.fire?.fire_number ?? null
  const monthly = data.allocation?.monthly_investment ?? 0
  const canPath = goal !== null && goal > netWorth

  const ranges = useMemo(
    () => ({
      '1M': plotRange(data.snapshots, '1M'),
      '6M': plotRange(data.snapshots, '6M'),
      '1Y': plotRange(data.snapshots, '1Y'),
      All: plotRange(data.snapshots, 'All'),
    }),
    [data.snapshots]
  )
  const path = useMemo(
    () => (canPath && goal !== null ? plotPath(data.snapshots, netWorth, goal, monthly) : null),
    [canPath, goal, data.snapshots, netWorth, monthly]
  )

  const firstWithData: RangeKey = ranges['1Y'].enough ? '1Y' : 'All'
  const [picked, setPicked] = useState<RangeKey | null>(null)
  const key = picked ?? firstWithData
  const shown = RANGES.filter((r) => r !== 'Path' || canPath)

  const plot = key === 'Path' ? null : ranges[key]
  const alt =
    key === 'Path' && path
      ? `Net worth so far and the projected path to ${inr(goal ?? 0)}`
      : 'Net worth over time'

  let caption = ''
  if (key === 'Path' && path && goal !== null) {
    caption = path.goalYear
      ? `At ${ASSUMED_RETURN}% a year and ${inr(monthly)} invested each month you reach ${inr(goal)} in ${path.goalYear}. The orange band is ${ASSUMED_RETURN - 3}% to ${ASSUMED_RETURN + 3}% a year${path.earliestYear && path.latestYear ? `, which means ${path.earliestYear} to ${path.latestYear}` : ''}.`
      : `At ${ASSUMED_RETURN}% a year the goal is more than 15 years away.`
  } else if (plot?.enough && plot.gain !== null) {
    caption = `${plot.gain >= 0 ? 'Up' : 'Down'} ${inr(Math.abs(plot.gain))} since ${plot.from}.`
  } else {
    caption = 'Not enough history yet for this range. The daily snapshot adds one point a day.'
  }

  return (
    <div>
      {/* biome-ignore lint/a11y/useSemanticElements: a fieldset is not reliably flexible on iOS Safari */}
      <div className="v-tabs" role="group" aria-label="Range">
        {shown.map((r) => (
          <button key={r} type="button" aria-pressed={key === r} onClick={() => setPicked(r)}>
            {LABEL[r]}
          </button>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${BOX.w} ${BOX.h}`}
        role="img"
        aria-label={alt}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          overflow: 'visible',
          marginTop: 10,
        }}
      >
        <defs>
          <linearGradient id="v-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ece4d6" stopOpacity="0.16" />
            <stop offset="1" stopColor="#ece4d6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 70H760M0 150H760M0 230H760" stroke="#141414" strokeWidth="1" fill="none" />

        {key === 'Path' && path ? (
          <g>
            <path
              d={`M${path.today.x} ${path.goalY}H${BOX.w}`}
              stroke="#ff7a1a"
              strokeWidth="1.5"
              strokeDasharray="2 6"
              fill="none"
            />
            <path d={path.cone} fill="#ff7a1a" fillOpacity="0.12" />
            <path
              d={path.base}
              stroke="#ece4d6"
              strokeWidth="2.5"
              strokeDasharray="8 7"
              fill="none"
              strokeLinecap="round"
            />
            <path d={path.historyArea} fill="url(#v-fade)" />
            <path
              d={path.history}
              stroke="#ece4d6"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d={`M${path.today.x} 22V262`} stroke="#363636" strokeWidth="1" fill="none" />
            <text
              x={path.today.x + 8}
              y="14"
              fill="#8c8579"
              fontFamily="Space Mono, monospace"
              className="v-t-small"
              letterSpacing="2"
            >
              TODAY
            </text>
            <text
              x={BOX.w - 8}
              y={Math.max(path.goalY - 9, 14)}
              textAnchor="end"
              fill="#ff9a4a"
              fontFamily="Space Mono, monospace"
              className="v-t-small"
              letterSpacing="1.5"
            >
              GOAL {inr(goal ?? 0).toUpperCase()}
            </text>
            <circle
              cx={path.today.x}
              cy={path.today.y}
              r="6"
              fill="#ff7a1a"
              stroke="#000"
              strokeWidth="3"
            />
            {path.goalHit ? (
              <g>
                <circle
                  cx={path.goalHit.x}
                  cy={path.goalHit.y}
                  r="6"
                  fill="#000"
                  stroke="#ff7a1a"
                  strokeWidth="3"
                />
                <text
                  x={path.goalHit.x}
                  y={path.goalHit.y + 28}
                  textAnchor="middle"
                  fill="#ece4d6"
                  fontFamily="Manrope, sans-serif"
                  className="v-t-year"
                  fontWeight="600"
                >
                  {path.goalYear}
                </text>
              </g>
            ) : null}
          </g>
        ) : plot?.enough ? (
          <g>
            <path d={plot.area} fill="url(#v-fade)" />
            <path
              d={plot.line}
              stroke="#ece4d6"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {plot.end ? (
              <circle
                cx={plot.end.x}
                cy={plot.end.y}
                r="6"
                fill="#ff7a1a"
                stroke="#000"
                strokeWidth="3"
              />
            ) : null}
          </g>
        ) : null}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span className="v-mono">
          {key === 'Path' ? (path?.fromLabel ?? '') : (plot?.from ?? '')}
        </span>
        <span className="v-mono">
          {key === 'Path' ? (path?.toLabel ?? '') : plot?.enough ? 'Today' : ''}
        </span>
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--v-ink2)', marginTop: 10 }}>
        {caption}
      </p>
    </div>
  )
}
