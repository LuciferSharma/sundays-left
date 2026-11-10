import { mutationTree } from 'typed-vuex'

export const MIN_ZOOM = 0.15
export const MAX_ZOOM = 3
export const ZOOM_STEP = 0.1

/** 'width' fills the page width, 'page' shows the whole chart on screen */
export type FitMode = 'width' | 'page'

interface Store {
  /** Current zoom factor for the chart (1 = 100%) */
  zoom: number
  /** When set, the chart zoom tracks the viewport; null = manual zoom */
  fit: FitMode | null
  /** Whether the Customize panel is open */
  panelOpen: boolean
  /** Date (YYYY-MM-DD) to prefill the "mark a week" form with */
  draftDate: string
}

export const state = (): Store => ({
  zoom: 1,
  fit: 'width',
  panelOpen: false,
  draftDate: '',
})

const clamp = (value: number) =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100))

export const mutations = mutationTree(state, {
  setZoom(state, value: number) {
    state.zoom = clamp(value)
    state.fit = null
  },
  /** Used by the chart itself to report the zoom it computed in fit mode */
  applyFitZoom(state, value: number) {
    state.zoom = clamp(value)
  },
  setFit(state, mode: FitMode) {
    state.fit = mode
  },
  openPanel(state, draftDate?: string) {
    state.panelOpen = true
    if (draftDate) state.draftDate = draftDate
  },
  closePanel(state) {
    state.panelOpen = false
  },
  clearDraftDate(state) {
    state.draftDate = ''
  },
})
