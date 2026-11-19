"""Copy the Vested UI from the OpenAlgo frontend into this demo, then patch what the demo cannot have
(a router, a server). Re-run after changing the app; the demo's own sample data and shell are left alone."""
import re
import shutil
from pathlib import Path

SRC = Path('G:/Coding/openalgo/frontend/src/pages/vested')
DST = Path(__file__).resolve().parent.parent / 'src' / 'vested'

for name in ['derive.ts', 'derive.test.ts', 'format.ts', 'NetWorthChart.tsx', 'Today.tsx', 'vested.css', 'useIsMobile.ts']:
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
print('synced')
