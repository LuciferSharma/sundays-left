import { getterTree, mutationTree } from 'typed-vuex'

const GRAYSCALE_COLOR = '#111'
const WEEKS_PER_YEAR = 52

interface Stage {
  name: string
  start: number
  end: number
}
export const FIXED_STAGES: Stage[] = [
  { name: 'Childhood', start: 0, end: 12 },
  { name: 'Adolescence', start: 13, end: 19 },
  { name: 'Early Adulthood', start: 20, end: 34 },
  { name: 'Middle Adulthood', start: 35, end: 49 },
  { name: 'Mature Adulthood', start: 50, end: 79 },
  { name: 'Late Adulthood', start: 80, end: 100 },
]
export const DEFAULT_STAGE_COLORS = [
  '#eccbaa',
  '#f0b7b6',
  '#e69dc8',
  '#f693dd',
  '#76d7f6',
  '#74e085',
]
export const DEFAULT_CURRENT_COLOR = '#111111'
export const DEFAULT_TITLE = 'Calendar of Your Life'

export const MIN_LIFE_EXPECTANCY = 1
export const MAX_LIFE_EXPECTANCY = 120
export const MAX_TITLE_LENGTH = 48

export type Shape = 'circle' | 'rounded' | 'square'
const SHAPES: Shape[] = ['circle', 'rounded', 'square']

export interface Milestone {
  id: string
  /** Local date, YYYY-MM-DD */
  date: string
  label: string
  color: string
}

export interface CircleSettings {
  showStageColors: boolean
  fillElapsed: boolean
  lifeExpectancy: number
  shape: Shape
  stageColors: string[]
  currentColor: string
  title: string
  milestones: Milestone[]
}

type Store = CircleSettings

export const state = (): Store => ({
  showStageColors: true,
  fillElapsed: true,
  lifeExpectancy: 100,
  shape: 'circle',
  stageColors: [...DEFAULT_STAGE_COLORS],
  currentColor: DEFAULT_CURRENT_COLOR,
  title: '',
  milestones: [],
})

interface Circle {
  row: number
  column: number
  color: string
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i
const isColor = (value: unknown): value is string =>
  typeof value === 'string' && HEX_COLOR.test(value)
const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

const clampLifeExpectancy = (value: number) =>
  Math.min(MAX_LIFE_EXPECTANCY, Math.max(MIN_LIFE_EXPECTANCY, Math.round(value)))

export const getters = getterTree(state, {
  circleMatrix: (state) => {
    const makeRow = (rowIndex: number) => {
      const row: Circle[] = new Array<Circle>(WEEKS_PER_YEAR)
      const stageIndex = FIXED_STAGES.findIndex(
        (stage) => stage.start - 1 <= rowIndex && stage.end > rowIndex
      )
      const color: string =
        state.showStageColors && stageIndex >= 0
          ? state.stageColors[stageIndex]
          : GRAYSCALE_COLOR
      for (let columnIndex = 0; columnIndex < WEEKS_PER_YEAR; columnIndex++) {
        row[columnIndex] = { row: rowIndex, column: columnIndex, color }
      }
      return row
    }

    const rows: Circle[][] = new Array<Circle[]>(state.lifeExpectancy)
    for (let rowIndex = 0; rowIndex < state.lifeExpectancy; rowIndex++) {
      rows[rowIndex] = makeRow(rowIndex)
    }

    return rows
  },
  rightAxisLabels: (state) => {
    // Keep any stage that starts within the lifespan, clipped to its last row
    return FIXED_STAGES.map((stage, index) => ({ stage, index }))
      .filter(({ stage }) => stage.start - 1 < state.lifeExpectancy)
      .map(({ stage, index }) => ({
        rowStart: Math.max(stage.start - 1, 0),
        rowEnd: Math.min(stage.end - 1, state.lifeExpectancy - 1),
        color: state.showStageColors ? state.stageColors[index] : GRAYSCALE_COLOR,
        text: `${stage.name} (age ${stage.start} - ${stage.end})`.toUpperCase(),
      }))
  },
  displayTitle: (state) => state.title.trim() || DEFAULT_TITLE,
  sortedMilestones: (state) =>
    [...state.milestones].sort((a, b) => a.date.localeCompare(b.date)),
})

export const mutations = mutationTree(state, {
  toggleStageColors(state) {
    state.showStageColors = !state.showStageColors
  },
  setShowStageColors(state, value: boolean) {
    state.showStageColors = value
  },
  setFillElapsed(state, value: boolean) {
    state.fillElapsed = value
  },
  setLifeExpectancy(state, value: number) {
    const number = Number(value)
    if (Number.isNaN(number)) return
    state.lifeExpectancy = clampLifeExpectancy(number)
  },
  setShape(state, shape: Shape) {
    if (SHAPES.includes(shape)) state.shape = shape
  },
  setStageColor(state, { index, color }: { index: number; color: string }) {
    if (!isColor(color) || index < 0 || index >= state.stageColors.length) return
    state.stageColors.splice(index, 1, color)
  },
  setCurrentColor(state, color: string) {
    if (isColor(color)) state.currentColor = color
  },
  resetColors(state) {
    state.stageColors = [...DEFAULT_STAGE_COLORS]
    state.currentColor = DEFAULT_CURRENT_COLOR
  },
  setTitle(state, title: string) {
    state.title = String(title).slice(0, MAX_TITLE_LENGTH)
  },
  addMilestone(state, milestone: Omit<Milestone, 'id'>) {
    if (!isIsoDate(milestone.date) || !isColor(milestone.color)) return
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
    state.milestones.push({ ...milestone, label: milestone.label.trim(), id })
  },
  removeMilestone(state, id: string) {
    state.milestones = state.milestones.filter((m) => m.id !== id)
  },
  /** Restores saved settings, ignoring anything malformed */
  hydrate(state, saved: Partial<CircleSettings>) {
    if (typeof saved.showStageColors === 'boolean') {
      state.showStageColors = saved.showStageColors
    }
    if (typeof saved.fillElapsed === 'boolean') {
      state.fillElapsed = saved.fillElapsed
    }
    if (typeof saved.lifeExpectancy === 'number') {
      state.lifeExpectancy = clampLifeExpectancy(saved.lifeExpectancy)
    }
    if (saved.shape && SHAPES.includes(saved.shape)) state.shape = saved.shape
    if (Array.isArray(saved.stageColors)) {
      state.stageColors = DEFAULT_STAGE_COLORS.map((fallback, i) =>
        isColor(saved.stageColors![i]) ? saved.stageColors![i] : fallback
      )
    }
    if (isColor(saved.currentColor)) state.currentColor = saved.currentColor
    if (typeof saved.title === 'string') {
      state.title = saved.title.slice(0, MAX_TITLE_LENGTH)
    }
    if (Array.isArray(saved.milestones)) {
      state.milestones = saved.milestones
        .filter(
          (m) =>
            m &&
            typeof m.id === 'string' &&
            isIsoDate(m.date) &&
            isColor(m.color) &&
            typeof m.label === 'string'
        )
        .map((m) => ({ id: m.id, date: m.date, label: m.label, color: m.color }))
    }
  },
})
