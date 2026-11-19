import { DesktopPortfolio } from './DesktopPortfolio'
import { MobilePortfolio } from './mobile/MobilePortfolio'
import type { MobileNav } from './mobile/MobileToday'
import { useIsMobile } from './useIsMobile'
import type { VestedData } from './useVestedData'

/** One page, two layouts: the phone gets its own design. */
export default function Portfolio({ data, nav }: { data: VestedData; nav: MobileNav }) {
  const isMobile = useIsMobile()
  return isMobile ? (
    <MobilePortfolio data={data} nav={nav} />
  ) : (
    <DesktopPortfolio data={data} nav={nav} />
  )
}
