import { Plugin } from '@nuxt/types'
import { saveState } from '~/utils/storage'

// Saves birthday + chart settings to localStorage whenever they change.
// Loading happens in pages/index.vue's mounted() to avoid hydration mismatches.
const persist: Plugin = ({ store }) => {
  store.subscribe((mutation, state) => {
    // Zoom / panel state is per-session, no need to save it
    if (mutation.type.startsWith('view/')) return
    const date: Date | null = state.birthday.date
    saveState({
      ...state.circles,
      birthday: date ? date.toISOString() : null,
    })
  })
}

export default persist
