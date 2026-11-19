import { DesktopSignals } from './DesktopSignals'
import { MobileSignals } from './mobile/MobileSignals'
import type { MobileNav } from './mobile/MobileToday'
import { useIsMobile } from './useIsMobile'
import type { VestedData } from './useVestedData'

/** One page, two layouts: the phone gets its own design. */
export default function Signals({ data, nav }: { data: VestedData; nav: MobileNav }) {
  const isMobile = useIsMobile()
  return isMobile ? (
    <MobileSignals data={data} nav={nav} />
  ) : (
    <DesktopSignals data={data} nav={nav} />
  )
}
