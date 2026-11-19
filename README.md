# Vested, a demo

A live demo of the Vested dashboard: one place to see net worth, what needs attention today, where money sits against target, and how far away the goal is. Everything on the page is **sample data**; there is no backend and nothing is real money.

**Try it:** https://therealhazzard.github.io/vested-demo/ (best on a phone)

- Black, bone and one ember accent; Cormorant Garamond for words, Manrope for numbers
- Mobile first: a bottom tab bar on phones, a left rail on wide screens, no scrollbars anywhere
- The net worth chart has a **Path to goal** view that carries on into the future with a 4% to 10% band
- "Needs you" is ranked by urgency and built from the same rules the real app uses

Only the Today screen is built so far. Portfolio, Signals and Plan are designed and next.

```bash
npm install
npm run dev     # develop
npm run test    # unit tests for the ranking and chart maths
npm run build   # static site in dist/
```
