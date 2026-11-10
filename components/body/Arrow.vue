<template>
  <canvas ref="canvas" />
</template>

<script lang="ts">
import Vue from 'vue'
import { ArrowCanvasPainter } from '~/utils/arrow-canvas'
import { loadCanvasFonts } from '~/utils/circle-canvas'

export default Vue.extend({
  name: 'BodyArrow',
  props: {
    text: {
      type: String,
      required: true,
    },
    arrowOnBottom: {
      type: Boolean,
      default: true,
    },
  },
  mounted() {
    const canvas = this.$refs.canvas as HTMLCanvasElement
    const painter = new ArrowCanvasPainter(canvas)
    const draw = () => painter.draw(this.$props.text, this.$props.arrowOnBottom)
    draw()
    // Text is measured, so redraw once the real font has loaded
    loadCanvasFonts().then(draw)
  },
})
</script>
