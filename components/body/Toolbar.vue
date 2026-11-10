<template>
  <div class="toolbar-wrap">
    <div class="toolbar" role="toolbar" aria-label="Calendar settings">
      <button type="button" class="born" title="Change birthday" @click="changeBirthday">
        <span class="born-label">Born</span>
        <span class="born-date">{{ birthdayText }}</span>
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path d="M4 20h4L19 9l-4-4L4 16v4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
        </svg>
      </button>

      <div class="group">
        <button
          type="button"
          role="switch"
          class="switch"
          :aria-checked="String(fillElapsed)"
          @click="fillElapsed = !fillElapsed"
        >
          <span class="track"><span class="thumb" /></span>
          Fill weeks
        </button>
        <button
          type="button"
          role="switch"
          class="switch"
          :aria-checked="String(showStageColors)"
          @click="showStageColors = !showStageColors"
        >
          <span class="track"><span class="thumb" /></span>
          Colours
        </button>
        <div class="stepper" title="Life expectancy in years">
          <span class="stepper-label">Lifespan</span>
          <button type="button" aria-label="Decrease lifespan" @click="lifeExpectancy = lifeExpectancy - 1">−</button>
          <input
            :value="lifeExpectancy"
            inputmode="numeric"
            aria-label="Life expectancy in years"
            @change="onLifespanInput"
            @keydown.enter="onLifespanInput"
          />
          <button type="button" aria-label="Increase lifespan" @click="lifeExpectancy = lifeExpectancy + 1">+</button>
          <span class="stepper-unit">yrs</span>
        </div>
      </div>

      <div class="right">
      <div class="group zoom" aria-label="Zoom">
        <button type="button" class="icon" aria-label="Zoom out (−)" title="Zoom out (−)" @click="zoomBy(-1)">−</button>
        <span class="zoom-value" aria-live="polite">{{ zoomText }}</span>
        <button type="button" class="icon" aria-label="Zoom in (+)" title="Zoom in (+)" @click="zoomBy(1)">+</button>
        <div class="segmented" role="group" aria-label="Fit chart">
          <button
            type="button"
            :class="{ active: fit === 'width' }"
            :aria-pressed="String(fit === 'width')"
            title="Fit to page width (0)"
            @click="setFit('width')"
          >
            Width
          </button>
          <button
            type="button"
            :class="{ active: fit === 'page' }"
            :aria-pressed="String(fit === 'page')"
            title="Show the whole chart on screen (9)"
            @click="setFit('page')"
          >
            Whole
          </button>
        </div>
      </div>

      <span class="divider" aria-hidden="true" />

      <div class="group actions">
        <button
          type="button"
          class="chip"
          title="Colours, shape, title and marked weeks"
          :aria-expanded="String(panelOpen)"
          @click="openPanel"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <circle cx="16" cy="6" r="2" fill="none" stroke="currentColor" stroke-width="2" />
            <circle cx="10" cy="12" r="2" fill="none" stroke="currentColor" stroke-width="2" />
            <circle cx="18" cy="18" r="2" fill="none" stroke="currentColor" stroke-width="2" />
          </svg>
          Customize
        </button>
        <button type="button" class="chip" title="Print (Ctrl+P)" @click="$emit('print')">
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
          </svg>
          Print
        </button>
        <button type="button" class="chip solid" title="Download as PNG image" @click="$emit('save')">
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path d="M12 3v12m0 0l-5-5m5 5l5-5M4 20h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Save image
        </button>
      </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { formatBirthday } from '~/utils/poster'
import { FitMode, ZOOM_STEP } from '~/store/view'

export default Vue.extend({
  name: 'BodyToolbar',
  computed: {
    birthdayText(): string {
      const date = this.$accessor.birthday.date
      return date ? formatBirthday(date) : ''
    },
    fillElapsed: {
      get(): boolean {
        return this.$accessor.circles.fillElapsed
      },
      set(value: boolean) {
        this.$accessor.circles.setFillElapsed(value)
      },
    },
    showStageColors: {
      get(): boolean {
        return this.$accessor.circles.showStageColors
      },
      set(value: boolean) {
        this.$accessor.circles.setShowStageColors(value)
      },
    },
    lifeExpectancy: {
      get(): number {
        return this.$accessor.circles.lifeExpectancy
      },
      set(value: number) {
        this.$accessor.circles.setLifeExpectancy(value)
      },
    },
    panelOpen(): boolean {
      return this.$accessor.view.panelOpen
    },
    fit(): FitMode | null {
      return this.$accessor.view.fit
    },
    zoomText(): string {
      return `${Math.round(this.$accessor.view.zoom * 100)}%`
    },
  },
  mounted() {
    window.addEventListener('keydown', this.onKeydown)
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.onKeydown)
  },
  methods: {
    openPanel() {
      this.$accessor.view.openPanel()
    },
    changeBirthday() {
      this.$accessor.birthday.startEditing()
    },
    onLifespanInput(event: Event) {
      const input = event.target as HTMLInputElement
      this.lifeExpectancy = Number(input.value)
      // Reflect clamping/rounding back into the field
      input.value = String(this.lifeExpectancy)
    },
    zoomBy(direction: number) {
      this.$accessor.view.setZoom(this.$accessor.view.zoom + direction * ZOOM_STEP)
    },
    setFit(mode: FitMode) {
      this.$accessor.view.setFit(mode)
    },
    onKeydown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (this.$accessor.view.panelOpen) return
      const target = event.target as HTMLElement
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key === '+' || event.key === '=') this.zoomBy(1)
      else if (event.key === '-' || event.key === '_') this.zoomBy(-1)
      else if (event.key === '0') this.setFit('width')
      else if (event.key === '9') this.setFit('page')
    },
  },
})
</script>

<style lang="scss" scoped>
.toolbar-wrap {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 0.6rem 1rem;
  background: rgba(243, 237, 226, 0.82);
  backdrop-filter: blur(10px) saturate(1.2);
  -webkit-backdrop-filter: blur(10px) saturate(1.2);
  border-bottom: 1px solid var(--line);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.9rem;
  max-width: 1400px;
  margin: 0 auto;
  font-size: 12px;
  letter-spacing: 0.04em;
}

button {
  font: inherit;
  letter-spacing: inherit;
  cursor: pointer;
}

.group {
  display: flex;
  align-items: center;
  gap: 0.35rem 0.9rem;
  flex-wrap: wrap;
}

.divider {
  width: 1px;
  height: 22px;
  background: var(--line);

  @media (max-width: 900px) {
    display: none;
  }
}

.born {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  height: 32px;
  padding: 0 0.75rem;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  transition: border-color 0.15s, background 0.15s;

  .born-label {
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  svg {
    color: var(--ink-faint);
    transition: color 0.15s;
  }

  &:hover {
    border-color: var(--line);
    background: var(--sheet);

    svg {
      color: var(--ink);
    }
  }
}

// Compact pill switch
.switch {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 32px;
  padding: 0;
  border: 0;
  background: none;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--ink-soft);

  .track {
    position: relative;
    width: 28px;
    height: 16px;
    border-radius: 999px;
    background: rgba(30, 31, 28, 0.18);
    transition: background 0.2s;
  }

  .thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--sheet);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s cubic-bezier(0.3, 0.7, 0.4, 1.3);
  }

  &[aria-checked='true'] {
    color: var(--ink);

    .track {
      background: var(--ink);
    }

    .thumb {
      transform: translateX(12px);
    }
  }
}

.stepper {
  display: inline-flex;
  align-items: center;
  height: 32px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--sheet);
  overflow: hidden;

  .stepper-label,
  .stepper-unit {
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .stepper-label {
    padding: 0 0.4rem 0 0.8rem;
  }

  .stepper-unit {
    padding: 0 0.8rem 0 0.1rem;
  }

  button {
    width: 24px;
    height: 100%;
    border: 0;
    background: none;
    font-size: 15px;
    color: var(--ink-soft);

    &:hover {
      color: var(--ink);
      background: rgba(30, 31, 28, 0.06);
    }
  }

  input {
    width: 3ch;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: 13px;
    text-align: center;
    font-variant-numeric: tabular-nums;

    &:focus {
      outline: none;
      text-decoration: underline;
    }
  }
}

.right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
}

// On small screens a multi-row sticky bar would eat the chart, so let it
// scroll away and wrap freely
@media (max-width: 760px) {
  .toolbar-wrap {
    position: static;
  }

  .right {
    flex-wrap: wrap;
    margin-left: 0;
  }

  .zoom,
  .actions {
    flex-wrap: wrap;
  }
}

.zoom {
  gap: 0.25rem;
  flex-wrap: nowrap;

  .zoom-value {
    min-width: 3.4em;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
}

.icon {
  width: 32px;
  height: 32px;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--sheet);
  font-size: 16px;
  line-height: 1;
  transition: border-color 0.15s;

  &:hover {
    border-color: var(--ink);
  }
}

.chip {
  display: inline-flex;
  white-space: nowrap;
  align-items: center;
  gap: 0.4rem;
  height: 32px;
  padding: 0 0.85rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--sheet);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.1em;
  transition: border-color 0.15s, background 0.15s, color 0.15s, transform 0.15s;

  &:hover {
    border-color: var(--ink);
  }

  &.active {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--sheet);
  }

  &.solid {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--sheet);

    &:hover {
      transform: translateY(-1px);
    }
  }
}

.segmented {
  display: inline-flex;
  height: 32px;
  margin-left: 0.3rem;
  padding: 2px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--sheet);

  button {
    padding: 0 0.7rem;
    border: 0;
    border-radius: 999px;
    background: none;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.12em;
    color: var(--ink-soft);
    transition: background 0.15s, color 0.15s;

    &:hover {
      color: var(--ink);
    }

    &.active {
      background: var(--ink);
      color: var(--sheet);
    }
  }
}

.actions {
  gap: 0.4rem;
  flex-wrap: nowrap;
}
</style>
