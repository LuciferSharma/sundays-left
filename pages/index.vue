<template>
  <div v-if="!loaded" />
  <BodyRoot v-else-if="hasBirthday" />
  <OnboardingRoot v-else />
</template>

<script lang="ts">
import Vue from 'vue'
import { loadState, parseBirthday } from '~/utils/storage'

export default Vue.extend({
  name: 'Home',
  data() {
    return { loaded: false }
  },
  computed: {
    hasBirthday(): boolean {
      return (
        Boolean(this.$accessor.birthday.date) &&
        !this.$accessor.birthday.editing
      )
    },
  },
  mounted() {
    const saved = loadState()
    if (saved) {
      // `saved` is read once up front: each mutation below re-saves the whole
      // store, so intermediate saves are overwritten by the final one
      const { birthday, ...settings } = saved
      this.$accessor.circles.hydrate(settings)
      const date = parseBirthday(birthday)
      if (date) this.$accessor.birthday.set({ date })
    }
    this.loaded = true
  },
})
</script>
