/**
 * Plan on a phone: how far along you are, the year you reach the goal, and the two things you
 * can change (what you save, what it earns) plus a stress test and an "can I afford it" check.
 * The goal marker on the chart can be dragged too; the saving it needs is worked out for you.
 */
import { inr, inrParts, shortDate } from '../format'
import { usePlan } from '../usePlan'
import type { VestedData } from '../useVestedData'
import type { MobileNav } from './MobileToday'
import { PageTop } from './PageTop'
import { Afford, Milestones, WhatIf } from './PlanSections'
import { ScrubChart } from './ScrubChart'

export function MobilePlan({ data, nav }: { data: VestedData; nav: MobileNav }) {
  const p = usePlan(data)

  if (!p.ready || !p.model || !p.path || p.goal === null) {
    return (
      <div className="vm-page">
        <PageTop eyebrow="Independence" barTitle="Plan" nav={nav} />
        <div className="vm-pad">
          <h1 className="vm-title">
            {data.loaded ? (
              <>
                The plan needs <em>a goal.</em>
              </>
            ) : (
              'Reading your plan.'
            )}
          </h1>
          {data.loaded ? (
            <p className="vm-body">
              Tell the bot your yearly expenses with /fire_expenses on Telegram and this page fills
              in: the year you reach independence, what each milestone is, and what a fall in the
              market would cost.
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  const { model, path } = p
  const year = model.goalYear
  const pct = Math.round(p.percent ?? 0)
  const goalParts = inrParts(p.goal)

  return (
    <div className="vm-page">
      <PageTop
        eyebrow="Independence"
        barTitle="Plan"
        barSub={
          <span className="vm-bar-sub vm-dim">{year ? `Goal in ${year}` : 'Goal is far off'}</span>
        }
        nav={nav}
      />

      <div className="vm-pad">
        <h1 className="vm-title">
          You are <em>{pct}% of the way</em> there.
        </h1>

        <section className="vm-net" aria-label="Goal year">
          <p className="vm-cap">
            You reach Rs {goalParts.num} {goalParts.unit} in
          </p>
          <p className="vm-num">{year ?? 'later'}</p>
          <p className="vm-delta vm-dim">
            {model.yearsAway !== null
              ? `${model.yearsAway.toFixed(1)} years from now`
              : 'More than 15 years away at these settings'}
          </p>
          {p.crash && model.crashDelay !== null ? (
            <p className="vm-story vm-ember">
              The fall costs you about {Math.round(model.crashDelay)} months.
            </p>
          ) : null}
        </section>
      </div>

      <ScrubChart
        plot={null}
        path={path}
        drawKey={`${p.monthly}-${p.returnPct}-${p.crash}`}
        goalLabel={`Goal ${inr(p.goal)}`}
        summary={`Net worth ${inr(p.start)} today, projected to reach ${inr(p.goal)} in ${year ?? 'more than 15 years'}.`}
        scrub={null}
        onScrub={() => undefined}
        goalMonths={model.goalMonths}
        onGoalMonths={p.dragGoalTo}
        showBench={false}
      />

      <div className="vm-pad">
        <p className="vm-sub vm-caption">
          At {p.returnPct}% a year and {inr(p.monthly)} invested each month. The orange band is{' '}
          {Math.max(p.returnPct - 3, 1)}% to {p.returnPct + 3}%. Drag the hollow marker to a
          different year to see what it would take.
        </p>

        <Milestones p={p} />
        <WhatIf p={p} />
        <Afford p={p} />

        <p className="vm-foot">
          Projections assume a steady return and are not advice.{' '}
          {data.fire
            ? `Based on net worth as of ${shortDate(data.snapshots.at(-1)?.date ?? new Date().toISOString())}.`
            : ''}
        </p>
      </div>
    </div>
  )
}
