import type { VestedData } from './useVestedData'

/** A blank data set for tests: everything missing, nothing loading. */
export const emptyData: VestedData = {
  loaded: true,
  asOf: null,
  refreshing: false,
  snapshots: [],
  fire: null,
  allocation: null,
  indmoney: null,
  healthProblems: [],
  regime: null,
  concentration: null,
  usHoldings: [],
  indiaHoldings: [],
  funds: [],
  otherAssets: [],
  benchmark: null,
  leaders: [],
  algo: null,
  sims: [],
  edge: null,
}
