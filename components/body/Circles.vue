<template>
  <div
    ref="scroller"
    class="circles-wrapper"
    @wheel="onWheel"
  >
    <div class="sheet" :style="{ zoom }">
      <div class="canvas-wrapper">
        <div class="top">
          <BodyArrow text="Weeks of Your Life" :arrow-on-bottom="true" />
        </div>
        <div class="rotated left">
          <BodyArrow text="Years of Your Life" :arrow-on-bottom="false" />
        </div>
        <div class="rotated right">
          <BodyArrow text="Stages of Your Life" :arrow-on-bottom="false" />
        </div>
        <canvas
          id="circles"
          ref="circles"
          @mousemove="onHover"
          @mouseleave="hover = null"
          @click="onClick"
        />
      </div>
    </div>

    <div
      v-if="hover"
      class="week-tooltip"
      :style="{ left: hover.x + 'px', top: hover.y + 'px' }"
      role="tooltip"
    >
      <strong>Year {{ hover.row + 1 }} · Week {{ hover.column + 1 }}</strong>
      <span>Age {{ hover.row }} · {{ hover.range }}</span>
      <span v-for="m in hover.milestones" :key="m.id" class="tip-mark">
        <i :style="{ background: m.color }" />{{ m.label || 'Marked week' }}
      </span>
      <em>{{ hover.status }} · click to mark</em>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {
  AXIS_WIDTH,
  CircleCanvasPainter,
  drawCalendar,
  loadCanvasFonts,
  STEP_SIZE,
} from '~/utils/circle-canvas'
import { calendarDrawOptions } from '~/utils/calendar'
import { Milestone } from '~/store/circles'
import {
  formatShortDate,
  fromIsoDate,
  positionForDate,
  toIsoDate,
  weekStartDate,
  WEEKS_PER_YEAR,
} from '~/utils/stats'

// Must match the paddings in the styles below
const SHEET_PADDING = 24
const WRAPPER_PADDING = 48
const MAX_FIT_ZOOM = 1

let canvasPainter: CircleCanvasPainter | null = null
let resizeObserver: ResizeObserver | null = null

interface HoverInfo {
  row: number
  column: number
  x: number
  y: number
  range: string
  status: string
  milestones: Milestone[]
}

export default Vue.extend({
  name: 'BodyCircles',
  data() {
    return { hover: null as HoverInfo | null }
  },
  computed: {
    zoom(): number {
      return this.$accessor.view.zoom
    },
    // Everything the drawing depends on; any change triggers a full redraw
    drawOptions(): ReturnType<typeof calendarDrawOptions> {
      return calendarDrawOptions(this.$accessor)
    },
    drawInputs(): unknown[] {
      return [this.drawOptions, this.pixelRatio]
    },
    pixelRatio(): number {
      const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
      // Render more pixels when zoomed in so circles stay sharp
      return Math.min(3, dpr * Math.max(1, this.$accessor.view.zoom))
    },
    naturalSize(): { width: number; height: number } {
      const rows = this.$accessor.circles.circleMatrix.length
      const columns = this.$accessor.circles.circleMatrix[0]?.length || 0
      const frame = 2 * (WRAPPER_PADDING + SHEET_PADDING)
      return {
        width: STEP_SIZE * columns + AXIS_WIDTH * 2 + frame,
        height: STEP_SIZE * rows + frame,
      }
    },
  },
  watch: {
    drawInputs() {
      this.draw()
    },
    '$accessor.view.fit'(mode: string | null) {
      this.applyFit()
      if (mode === 'page') {
        // Bring the whole chart into view just below the sticky toolbar
        this.$nextTick(() => {
          const scroller = this.$refs.scroller as HTMLElement
          const toolbar = document.querySelector('.toolbar-wrap') as HTMLElement | null
          const top =
            scroller.getBoundingClientRect().top +
            window.scrollY -
            (toolbar?.offsetHeight || 0)
          window.scrollTo({ top, behavior: 'smooth' })
        })
      }
    },
    naturalSize() {
      this.applyFit()
    },
  },
  mounted() {
    const canvas = this.$refs.circles as HTMLCanvasElement
    canvasPainter = new CircleCanvasPainter({
      canvas,
      rowCount: 0,
      columnCount: 0,
    })
    this.applyFit()
    this.draw()
    // Redraw once the custom font is ready so axis numbers use it
    loadCanvasFonts().then(() => this.draw())

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => this.applyFit())
      resizeObserver.observe(this.$refs.scroller as HTMLElement)
    }
  },
  beforeDestroy() {
    resizeObserver?.disconnect()
    resizeObserver = null
    canvasPainter = null
  },
  methods: {
    draw() {
      if (!canvasPainter) return
      drawCalendar({
        painter: canvasPainter,
        ...this.drawOptions,
        pixelRatio: this.pixelRatio,
      })
    },
    applyFit() {
      const mode = this.$accessor.view.fit
      const scroller = this.$refs.scroller as HTMLElement | undefined
      if (!mode || !scroller) return
      const { width, height } = this.naturalSize
      let zoom = Math.min(MAX_FIT_ZOOM, (scroller.clientWidth - 32) / width)
      if (mode === 'page') {
        // Leave room for the sticky toolbar and the wrapper padding
        const toolbar = document.querySelector('.toolbar-wrap') as HTMLElement | null
        const availableHeight =
          window.innerHeight - (toolbar?.offsetHeight || 0) - 48
        zoom = Math.min(zoom, availableHeight / height)
      }
      this.$accessor.view.applyFitZoom(zoom)
    },
    /** Maps a mouse event to the grid cell under it, if any */
    cellAt(event: MouseEvent): { row: number; column: number } | null {
      if (!canvasPainter) return null
      const canvas = this.$refs.circles as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()
      // Works regardless of zoom: compare on-screen size to logical size
      const scale = canvasPainter.getWidth() / rect.width
      const x = (event.clientX - rect.left) * scale - AXIS_WIDTH
      const y = (event.clientY - rect.top) * scale
      const column = Math.floor(x / STEP_SIZE)
      const row = Math.floor(y / STEP_SIZE)
      const rows = this.$accessor.circles.circleMatrix.length
      if (column < 0 || column >= WEEKS_PER_YEAR || row < 0 || row >= rows) {
        return null
      }
      return { row, column }
    },
    onHover(event: MouseEvent) {
      const cell = this.cellAt(event)
      const birthday = this.$accessor.birthday.date
      if (!cell || !birthday) {
        this.hover = null
        return
      }
      const start = weekStartDate(birthday, cell.row, cell.column)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      const now = this.$accessor.birthday.elapsedPosition
      let status = 'Ahead'
      if (now && cell.row === now.years && cell.column === now.weeks) {
        status = 'This week'
      } else if (
        now &&
        (cell.row < now.years ||
          (cell.row === now.years && cell.column < now.weeks))
      ) {
        status = 'Lived'
      }
      const milestones = this.$accessor.circles.sortedMilestones.filter((m: Milestone) => {
        const date = fromIsoDate(m.date)
        const position = date && positionForDate(birthday, date)
        return (
          !!position &&
          position.years === cell.row &&
          position.weeks === cell.column
        )
      })
      this.hover = {
        ...cell,
        x: event.clientX + 14,
        y: event.clientY + 14,
        range: `${formatShortDate(start)} – ${formatShortDate(end)}`,
        status,
        milestones,
      }
    },
    onClick(event: MouseEvent) {
      const cell = this.cellAt(event)
      const birthday = this.$accessor.birthday.date
      if (!cell || !birthday) return
      const start = weekStartDate(birthday, cell.row, cell.column)
      this.$accessor.view.openPanel(toIsoDate(start))
    },
    onWheel(event: WheelEvent) {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1
      this.$accessor.view.setZoom(this.$accessor.view.zoom * factor)
    },
  },
})
</script>

<style lang="scss">
.circles-wrapper {
  overflow-x: auto;
  padding: 2rem 1rem 4rem;
  text-align: center;
  scroll-margin-top: 30px;

  .sheet {
    display: inline-block;
    padding: 24px;
    background: var(--sheet);
    border-radius: 6px;
    box-shadow: 0 1px 0 rgba(30, 31, 28, 0.06), 0 24px 48px -24px rgba(30, 31, 28, 0.28);
    text-align: left;
    animation: sheet-in 0.7s 0.1s cubic-bezier(0.2, 0.7, 0.2, 1) both;
  }

  .canvas-wrapper {
    $padding: 48;
    $arrow-padding: 10;
    $axis-width: 28;

    display: inline-block;
    position: relative;
    padding: $padding + px;

    #circles {
      display: block;
      cursor: pointer;
    }

    .top {
      position: absolute;
      top: 0;
      left: $padding + $axis-width + px;
    }

    .rotated {
      position: absolute;
      top: $padding + px;

      canvas {
        position: absolute;
        transform-origin: top left;
        transform: rotate(90deg);
      }

      &.left {
        left: $padding - $arrow-padding + px;

        canvas {
          transform: rotate(90deg);
        }
      }

      &.right {
        right: $padding - $arrow-padding + px;

        canvas {
          transform: rotate(90deg) translateY(-100%);
        }
      }
    }
  }
}

.week-tooltip {
  position: fixed;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 240px;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  background: var(--ink);
  color: var(--sheet);
  font-size: 12px;
  text-align: left;
  pointer-events: none;
  box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.4);

  span,
  em {
    font-family: var(--font-body);
  }

  em {
    margin-top: 2px;
    font-style: normal;
    font-size: 11px;
    opacity: 0.6;
  }

  .tip-mark {
    display: flex;
    align-items: center;
    gap: 6px;

    i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
  }
}

@keyframes sheet-in {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
}
</style>
