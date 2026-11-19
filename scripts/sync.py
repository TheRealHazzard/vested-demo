"""Copy the Vested UI from the OpenAlgo frontend into this demo, then patch what the demo cannot have
(a router, a server). Re-run after changing the app; the demo's own sample data and shell are left alone."""
import re
import shutil
from pathlib import Path

SRC = Path('G:/Coding/openalgo/frontend/src/pages/vested')
DST = Path(__file__).resolve().parent.parent / 'src' / 'vested'

for name in ['derive.ts', 'derive.test.ts', 'format.ts', 'holdings.ts', 'holdings.test.ts', 'insights.ts', 'insights.test.ts', 'planMath.ts', 'planMath.test.ts', 'signalsLogic.ts', 'signalsLogic.test.ts', 'testData.ts', 'usePlan.ts', 'useCountUp.ts', 'NetWorthChart.tsx', 'Today.tsx', 'DesktopPortfolio.tsx', 'Portfolio.tsx', 'DesktopPlan.tsx', 'Plan.tsx', 'DesktopSignals.tsx', 'Signals.tsx', 'vested.css', 'useIsMobile.ts']:
    shutil.copy(SRC / name, DST / name)
for folder in ['mobile', 'fonts']:
    shutil.copytree(SRC / folder, DST / folder, dirs_exist_ok=True)

today = (DST / 'Today.tsx').read_text(encoding='utf-8')
today = today.replace("import { Link } from 'react-router'\n", '')
today = re.sub(r'<Link\b', '<a', today).replace('</Link>', '</a>')
today = re.sub(r'\bto=\{', 'href={', today)
today = re.sub(r'\bto="/tradingbot"', 'href="#"', today)
(DST / 'Today.tsx').write_text(today, encoding='utf-8')

derive = (DST / 'derive.ts').read_text(encoding='utf-8')
for h in ["'/tradingbot'", "'/broker'", "'/health'"]:
    derive = derive.replace('href: ' + h, "href: '#'")
(DST / 'derive.ts').write_text(derive, encoding='utf-8')
# Keep the demo's sample data, but take the data types from the app so the two cannot drift.
src_types = (SRC / 'useVestedData.ts').read_text(encoding='utf-8')
types = src_types[src_types.index('export interface Snapshot'):src_types.index('async function getOrNull')]
demo = (DST / 'useVestedData.ts').read_text(encoding='utf-8')
sample = demo[demo.index('/** Deterministic sample series'):]
(DST / 'useVestedData.ts').write_text(types + sample, encoding='utf-8')
print('synced')
