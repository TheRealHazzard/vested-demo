/** Indian notation at the size a person thinks in: Cr above a crore, L above a lakh. */
export function inr(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1e7) return `${sign}Rs ${(abs / 1e7).toFixed(2)} Cr`
  if (abs >= 1e5) return `${sign}Rs ${(abs / 1e5).toFixed(1)} L`
  return `${sign}Rs ${abs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

/** The big number split into its parts so the unit can be set small. */
export function inrParts(value: number): { num: string; unit: string } {
  const abs = Math.abs(value)
  if (abs >= 1e7) return { num: (abs / 1e7).toFixed(2), unit: 'Cr' }
  if (abs >= 1e5) return { num: (abs / 1e5).toFixed(1), unit: 'L' }
  return { num: abs.toLocaleString('en-IN', { maximumFractionDigits: 0 }), unit: '' }
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function longDate(d: Date): { weekday: string; day: string } {
  return {
    weekday: d.toLocaleDateString('en-IN', { weekday: 'long' }),
    day: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }),
  }
}

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
export function countWord(n: number): string {
  return n < WORDS.length ? WORDS[n] : String(n)
}

export function signedPct(v: number, digits = 1): string {
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits)}%`
}
