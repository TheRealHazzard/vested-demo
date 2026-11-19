/**
 * Plan on a wide screen: the year you reach the goal and the path to it on the left, the
 * things you can change on the right. Same pieces as the phone, laid out side by side.
 */
import { inr, inrParts } from './format'
import type { MobileNav } from './mobile/MobileToday'
import { Afford, Milestones, WhatIf } from './mobile/PlanSections'
import { ScrubChart } from './mobile/ScrubChart'
import { usePlan } from './usePlan'
import type { VestedData } from './useVestedData'

export function DesktopPlan({ data }: { data: VestedData; nav: MobileNav }) {
  const p = usePlan(data)

  if (!p.ready || !p.model || !p.path || p.goal === null) {
    return (
      <div className="v-today">
        <header className="v-head">
          <div className="v-col" style={{ gap: 10 }}>
            <p className="v-mono">Plan &middot; financial independence</p>
            <h1 className="v-serif v-h1">
              {data.loaded ? (
                <>
                  The plan needs <span className="v-em">a goal.</span>
                </>
              ) : (
                'Reading your plan.'
              )}
            </h1>
          </div>
        </header>
        {data.loaded ? (
          <p className="vp-why" style={{ maxWidth: 560 }}>
            Tell the bot your yearly expenses with /fire_expenses on Telegram and this page fills
            in: the year you reach independence, what each milestone is, and what a fall in the
            market would cost.
          </p>
        ) : null}
      </div>
    )
  }

  const { model, path } = p
  const goalParts = inrParts(p.goal)

  return (
    <div className="v-today">
      <header className="v-head">
        <div className="v-col" style={{ gap: 10, marginRight: 'auto' }}>
          <p className="v-mono">Plan &middot; financial independence</p>
          <h1 className="v-serif v-h1">
            You are <span className="v-em">{Math.round(p.percent ?? 0)}% of the way</span> there.
          </h1>
        </div>
      </header>

      <div className="vp-grid vp-plan">
        <section aria-label="The path to your goal" className="v-col">
          <p className="v-mono">
            You reach Rs {goalParts.num} {goalParts.unit} in
          </p>
          <div className="vp-yearrow">
            <p className="vp-year">{model.goalYear ?? 'later'}</p>
            <div className="v-col" style={{ gap: 4, paddingBottom: 14 }}>
              <p style={{ fontSize: 20, fontWeight: 300 }}>
                {model.yearsAway !== null
                  ? `${model.yearsAway.toFixed(1)} years from now`
                  : 'More than 15 years away at these settings'}
              </p>
              <p className="v-dim" style={{ fontSize: 13 }}>
                {p.crash && model.crashDelay !== null
                  ? `The fall costs you about ${Math.round(model.crashDelay)} months`
                  : 'No market fall assumed'}
              </p>
            </div>
          </div>

          <div className="vp-chartwrap">
            <ScrubChart
              plot={null}
              path={path}
              drawKey={`${p.monthly}-${p.returnPct}-${p.crash}`}
              goalLabel={`Goal ${inr(p.goal)}`}
              summary={`Net worth ${inr(p.start)} today, projected to reach ${inr(p.goal)} in ${model.goalYear ?? 'more than 15 years'}.`}
              scrub={null}
              onScrub={() => undefined}
              goalMonths={model.goalMonths}
              onGoalMonths={p.dragGoalTo}
              showBench={false}
            />
          </div>
          <p className="vp-caption">
            At {p.returnPct}% a year and {inr(p.monthly)} invested each month. The orange band is{' '}
            {Math.max(p.returnPct - 3, 1)}% to {p.returnPct + 3}%. Drag the hollow marker to a
            different year to see the saving it would take.
          </p>
          <Milestones p={p} />
        </section>

        <aside className="vp-side">
          <WhatIf p={p} />
          <Afford p={p} />
        </aside>
      </div>
    </div>
  )
}
