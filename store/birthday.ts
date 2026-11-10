import { getterTree, mutationTree } from 'typed-vuex'
import { positionForDate } from '~/utils/stats'

interface Store {
  date: Date | null
  /** True while the user is changing an existing birthday */
  editing: boolean
}

interface SetPayload {
  date: Date
}

export const state = (): Store => ({
  date: null,
  editing: false,
})

const ONE_DAY = 1000 * 60 * 60 * 24

export const getters = getterTree(state, {
  currentWeek: (state) => {
    const birthdate = state.date
    if (!birthdate) return null
    const nowEpoch = new Date().getTime()
    const birthdayEpoch = birthdate.getTime()
    const daysBetween = Math.round((nowEpoch - birthdayEpoch) / ONE_DAY)
    return Math.ceil(daysBetween / 7)
  },
  /**
   * Position of "now" on the calendar grid: the row is the completed years of
   * age, the column is the number of full weeks since the last birthday.
   */
  elapsedPosition: (state) =>
    state.date ? positionForDate(state.date, new Date()) : null,
})

export const mutations = mutationTree(state, {
  set(state, { date }: SetPayload) {
    state.date = date
    state.editing = false
  },
  startEditing(state) {
    state.editing = true
  },
  cancelEditing(state) {
    state.editing = false
  },
})
