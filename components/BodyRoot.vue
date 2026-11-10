<template>
  <div id="body">
    <BodyHeader class="no-print" />
    <BodyToolbar class="no-print" @print="print" @save="save" />
    <BodyCircles class="no-print" />
    <BodyCustomizePanel class="no-print" />
    <img
      v-if="printSrc"
      class="print-only print-poster"
      :src="printSrc"
      alt="Calendar of your life poster"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { loadCanvasFonts } from '~/utils/circle-canvas'
import { downloadCanvas, PosterData, renderPoster } from '~/utils/poster'
import { calendarDrawOptions } from '~/utils/calendar'

export default Vue.extend({
  name: 'BodyRoot',
  data() {
    return { printSrc: '' }
  },
  mounted() {
    // Also handle the browser's own Print (Ctrl+P)
    window.addEventListener('beforeprint', this.preparePrint)
  },
  beforeDestroy() {
    window.removeEventListener('beforeprint', this.preparePrint)
  },
  methods: {
    posterData(): PosterData {
      return {
        ...calendarDrawOptions(this.$accessor),
        title: this.$accessor.circles.displayTitle,
        birthday: this.$accessor.birthday.date,
        milestones: this.$accessor.circles.sortedMilestones,
      }
    },
    preparePrint() {
      this.printSrc = renderPoster(this.posterData(), 2).toDataURL('image/png')
    },
    async print() {
      await loadCanvasFonts()
      this.preparePrint()
      await this.$nextTick()
      const img = this.$el.querySelector('.print-poster') as HTMLImageElement
      if (img && !img.complete) {
        await new Promise((resolve) => {
          img.onload = resolve
          img.onerror = resolve
        })
      }
      window.print()
    },
    async save() {
      await loadCanvasFonts()
      downloadCanvas(
        renderPoster(this.posterData(), 2),
        'sundays-left.png'
      )
    },
  },
})
</script>

<style lang="scss" scoped>
#body {
  min-height: 100vh;
}

@media print {
  .print-poster {
    display: block;
    width: auto;
    max-width: 100%;
    max-height: calc(100vh - 2mm);
    margin: 0 auto;
    object-fit: contain;
  }
}
</style>
