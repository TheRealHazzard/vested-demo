import { DesktopPlan } from './DesktopPlan'
import { MobilePlan } from './mobile/MobilePlan'
import type { MobileNav } from './mobile/MobileToday'
import { useIsMobile } from './useIsMobile'
import type { VestedData } from './useVestedData'

/** One page, two layouts: the phone gets its own design. */
export default function Plan({ data, nav }: { data: VestedData; nav: MobileNav }) {
  const isMobile = useIsMobile()
  return isMobile ? <MobilePlan data={data} nav={nav} /> : <DesktopPlan data={data} nav={nav} />
}
