# Vested, a demo

A live demo of the Vested dashboard: one place to see net worth, what needs attention today, where money sits against target, and how far away the goal is. Everything on the page is **sample data**; there is no backend and nothing is real money.

**Try it:** https://therealhazzard.github.io/vested-demo/ (best on a phone)

- Black, bone and one ember accent; Cormorant Garamond for words, Manrope for numbers
- Built phone-first to Apple's design guidelines: a four-tab bar with a badge, a large title, grouped lists, bottom sheets (grab, drag or tap to close), 44pt targets, text that follows your phone's text size, and a net-worth chart you can drag a finger along
- Wide screens get a left rail and a denser layout; no scrollbars anywhere
- Add it to your Home Screen for a full-screen, app-like launch
- The net worth chart has a **Path to goal** view that carries on into the future with a 4% to 10% band
- "Needs you" is ranked by urgency and built from the same rules the real app uses

Only the Today screen is built so far. Portfolio, Signals and Plan are designed and next.

```bash
npm install
npm run dev     # develop
npm run test    # unit tests for the ranking and chart maths
npm run build   # static site in dist/
python scripts/sync.py   # pull the latest UI from the OpenAlgo frontend
```
