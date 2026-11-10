<template>
  <div class="customize-root">
    <transition name="fade">
      <div v-if="open" class="backdrop" @click="close" />
    </transition>
    <transition name="slide">
      <aside
        v-if="open"
        ref="panel"
        class="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customize-title"
        tabindex="-1"
        @keydown.esc="close"
      >
        <header class="panel-head">
          <h2 id="customize-title">Customize</h2>
          <button type="button" class="close" aria-label="Close" @click="close">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </header>

        <div class="panel-body">
          <!-- Marked weeks first: it's the most personal bit -->
          <section>
            <h3>Mark a week</h3>
            <p class="help">
              Highlight weeks that mattered or are coming up. You can also
              click any week on the chart.
            </p>
            <form class="mark-form" @submit.prevent="addMilestone">
              <div class="row">
                <label class="stack">
                  <span class="label">Date</span>
                  <DateInput ref="dateInput" v-model="draft.date" />
                </label>
                <label class="stack grow">
                  <span class="label">Label</span>
                  <input
                    v-model="draft.label"
                    class="text"
                    maxlength="40"
                    placeholder="e.g. Graduated"
                  />
                </label>
              </div>
              <div class="row between">
                <div class="palette" role="radiogroup" aria-label="Marker colour">
                  <button
                    v-for="color in palette"
                    :key="color"
                    type="button"
                    role="radio"
                    class="swatch"
                    :aria-checked="String(draft.color === color)"
                    :aria-label="color"
                    :style="{ background: color }"
                    @click="draft.color = color"
                  />
                  <label class="swatch custom" title="Custom colour">
                    <input v-model="draft.color" type="color" aria-label="Custom marker colour" />
                    <span :style="{ background: palette.includes(draft.color) ? 'transparent' : draft.color }">+</span>
                  </label>
                </div>
                <button type="submit" class="btn solid" :disabled="!draft.date">Add</button>
              </div>
              <p v-if="draftError" class="error" aria-live="polite">{{ draftError }}</p>
            </form>

            <ul v-if="milestones.length" class="milestones">
              <li v-for="m in milestones" :key="m.id">
                <i :style="{ background: m.color }" />
                <div class="m-text">
                  <strong>{{ m.label || 'Marked week' }}</strong>
                  <span>{{ describe(m.date) }}</span>
                </div>
                <button
                  type="button"
                  class="remove"
                  :aria-label="`Remove ${m.label || 'marked week'}`"
                  @click="removeMilestone(m.id)"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  </svg>
                </button>
              </li>
            </ul>
          </section>

          <section>
            <h3>Title</h3>
            <input
              v-model="title"
              class="text full"
              :maxlength="maxTitleLength"
              :placeholder="defaultTitle"
              aria-label="Calendar title"
            />
            <p class="help">Shown at the top of the page, print and image.</p>
          </section>

          <section>
            <h3>Shape</h3>
            <div class="shapes" role="radiogroup" aria-label="Week shape">
              <button
                v-for="option in shapes"
                :key="option.value"
                type="button"
                role="radio"
                class="shape"
                :aria-checked="String(shape === option.value)"
                @click="shape = option.value"
              >
                <svg viewBox="0 0 40 16" width="40" height="16" aria-hidden="true">
                  <g v-for="i in 3" :key="i" :transform="`translate(${(i - 1) * 14} 1)`">
                    <circle v-if="option.value === 'circle'" cx="6" cy="7" r="6" :fill="i < 3 ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.5" />
                    <rect v-else x="0.75" y="0.75" width="11" height="11" :rx="option.value === 'rounded' ? 3 : 0" :fill="i < 3 ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.5" />
                  </g>
                </svg>
                {{ option.label }}
              </button>
            </div>
          </section>

          <section>
            <div class="section-head">
              <h3>Colours</h3>
              <button type="button" class="link" @click="resetColors">Reset</button>
            </div>
            <p v-if="!showStageColors" class="help">
              Stage colours are off. Turn them on in the toolbar to see these.
            </p>
            <ul class="colors">
              <li v-for="(stage, index) in stages" :key="stage.name">
                <label class="color-row">
                  <span class="color-swatch" :style="{ background: stageColors[index] }">
                    <input
                      type="color"
                      :value="stageColors[index]"
                      :aria-label="`${stage.name} colour`"
                      @input="setStageColor(index, $event.target.value)"
                    />
                  </span>
                  <span class="color-name">{{ stage.name }}</span>
                  <span class="color-ages">age {{ stage.start }}–{{ stage.end }}</span>
                </label>
              </li>
              <li>
                <label class="color-row">
                  <span class="color-swatch ring" :style="{ borderColor: currentColor }">
                    <input
                      type="color"
                      :value="currentColor"
                      aria-label="This week marker colour"
                      @input="setCurrentColor($event.target.value)"
                    />
                  </span>
                  <span class="color-name">This week</span>
                  <span class="color-ages">outline</span>
                </label>
              </li>
            </ul>
          </section>
        </div>
      </aside>
    </transition>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {
  DEFAULT_TITLE,
  FIXED_STAGES,
  MAX_TITLE_LENGTH,
  Milestone,
  Shape,
} from '~/store/circles'
import { formatDate, fromIsoDate, positionForDate } from '~/utils/stats'

const PALETTE = [
  '#e4572e',
  '#f3a712',
  '#2bb673',
  '#2e86de',
  '#7b4fd6',
  '#1e1f1c',
]

export default Vue.extend({
  name: 'BodyCustomizePanel',
  data() {
    return {
      palette: PALETTE,
      stages: FIXED_STAGES,
      defaultTitle: DEFAULT_TITLE,
      maxTitleLength: MAX_TITLE_LENGTH,
      shapes: [
        { value: 'circle' as Shape, label: 'Circle' },
        { value: 'rounded' as Shape, label: 'Rounded' },
        { value: 'square' as Shape, label: 'Square' },
      ],
      draft: { date: '', label: '', color: PALETTE[0] },
      draftError: '',
      lastFocus: null as HTMLElement | null,
    }
  },
  computed: {
    open(): boolean {
      return this.$accessor.view.panelOpen
    },
    milestones(): Milestone[] {
      return this.$accessor.circles.sortedMilestones
    },
    showStageColors(): boolean {
      return this.$accessor.circles.showStageColors
    },
    stageColors(): string[] {
      return this.$accessor.circles.stageColors
    },
    currentColor(): string {
      return this.$accessor.circles.currentColor
    },
    title: {
      get(): string {
        return this.$accessor.circles.title
      },
      set(value: string) {
        this.$accessor.circles.setTitle(value)
      },
    },
    shape: {
      get(): Shape {
        return this.$accessor.circles.shape
      },
      set(value: Shape) {
        this.$accessor.circles.setShape(value)
      },
    },
  },
  watch: {
    open(open: boolean) {
      if (open) {
        this.lastFocus = document.activeElement as HTMLElement | null
        this.takeDraftDate()
        this.$nextTick(() => {
          if (this.draft.date) {
            // Came from clicking a week: jump straight to the label
            const label = (this.$refs.panel as HTMLElement).querySelector(
              '.mark-form input.text'
            ) as HTMLInputElement | null
            label?.focus()
          } else {
            ;(this.$refs.panel as HTMLElement)?.focus()
          }
        })
      } else {
        this.lastFocus?.focus?.()
      }
    },
    '$accessor.view.draftDate'() {
      if (this.open) this.takeDraftDate()
    },
    'draft.date'() {
      this.draftError = ''
    },
  },
  methods: {
    close() {
      this.$accessor.view.closePanel()
    },
    takeDraftDate() {
      const draftDate = this.$accessor.view.draftDate
      if (draftDate) {
        this.draft.date = draftDate
        this.$accessor.view.clearDraftDate()
      }
    },
    describe(iso: string): string {
      const date = fromIsoDate(iso)
      const birthday = this.$accessor.birthday.date
      if (!date) return iso
      const position = birthday && positionForDate(birthday, date)
      const where = position
        ? ` · year ${position.years + 1}, week ${position.weeks + 1}`
        : ''
      return `${formatDate(date)}${where}`
    },
    addMilestone() {
      const date = fromIsoDate(this.draft.date)
      const birthday = this.$accessor.birthday.date
      if (!date || !birthday) {
        this.draftError = 'Enter a full date (day / month / year).'
        return
      }
      const position = positionForDate(birthday, date)
      if (!position) {
        this.draftError = 'That date is before you were born.'
        return
      }
      if (position.years >= this.$accessor.circles.lifeExpectancy) {
        this.draftError = 'That date is beyond your lifespan setting.'
        return
      }
      this.$accessor.circles.addMilestone({
        date: this.draft.date,
        label: this.draft.label,
        color: this.draft.color,
      })
      this.draft = { date: '', label: '', color: this.draft.color }
      ;(this.$refs.dateInput as Vue & { focus: () => void }).focus()
    },
    removeMilestone(id: string) {
      this.$accessor.circles.removeMilestone(id)
    },
    setStageColor(index: number, color: string) {
      this.$accessor.circles.setStageColor({ index, color })
    },
    setCurrentColor(color: string) {
      this.$accessor.circles.setCurrentColor(color)
    },
    resetColors() {
      this.$accessor.circles.resetColors()
    },
  },
})
</script>

<style lang="scss" scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(30, 31, 28, 0.18);
}

.panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 41;
  display: flex;
  flex-direction: column;
  width: min(400px, 100vw);
  background: var(--paper);
  box-shadow: -24px 0 48px -24px rgba(30, 31, 28, 0.35);
  font-size: 13px;

  &:focus {
    outline: none;
  }
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.25rem;
  border-bottom: 1px solid var(--line);

  h2 {
    margin: 0;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 20px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }
}

.close {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--sheet);
  cursor: pointer;

  &:hover {
    border-color: var(--ink);
  }
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.25rem 1.25rem 2rem;
}

section {
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--line);

  &:last-child {
    border-bottom: 0;
  }
}

h3 {
  margin: 0 0 0.6rem;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.help {
  margin: 0 0 0.75rem;
  font-family: var(--font-body);
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--ink-soft);
}

.label {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.row {
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
  margin-bottom: 0.7rem;

  &.between {
    align-items: center;
    justify-content: space-between;
  }
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  &.grow {
    flex: 1;
    min-width: 0;
  }
}

.text {
  height: 36px;
  width: 100%;
  padding: 0 0.7rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--sheet);
  font-family: var(--font-body);
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: var(--ink);
  }

  &::placeholder {
    color: var(--ink-faint);
  }

  &.full {
    margin-bottom: 0.5rem;
  }
}

.palette {
  display: flex;
  gap: 6px;
}

.swatch {
  position: relative;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
  transition: transform 0.12s;

  &:hover {
    transform: scale(1.1);
  }

  &[aria-checked='true'] {
    box-shadow: 0 0 0 2px var(--paper), 0 0 0 4px var(--ink);
  }

  &.custom {
    display: grid;
    place-items: center;
    border: 1.5px dashed var(--ink-faint);
    box-shadow: none;

    span {
      display: grid;
      place-items: center;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      font-size: 14px;
      color: var(--ink-soft);
    }

    input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }
  }
}

.btn {
  height: 34px;
  padding: 0 1.1rem;
  border: 1px solid var(--ink);
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;

  &.solid {
    background: var(--ink);
    color: var(--sheet);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
}

.link {
  padding: 0;
  border: 0;
  background: none;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-soft);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;

  &:hover {
    color: var(--ink);
  }
}

.error {
  margin: 0;
  font-family: var(--font-body);
  font-size: 12.5px;
  color: #c0443b;
}

.milestones {
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.55rem 0;
    border-top: 1px dashed var(--line);
  }

  i {
    flex: 0 0 auto;
    width: 14px;
    height: 14px;
    border-radius: 50%;
  }

  .m-text {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;

    strong {
      overflow: hidden;
      font-size: 13px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      font-family: var(--font-body);
      font-size: 11.5px;
      color: var(--ink-soft);
    }
  }
}

.remove {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--ink-faint);
  cursor: pointer;

  &:hover {
    background: rgba(192, 68, 59, 0.1);
    color: #c0443b;
  }
}

.shapes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.shape {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  padding: 0.75rem 0.5rem 0.6rem;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--sheet);
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-soft);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: var(--ink-faint);
  }

  &[aria-checked='true'] {
    border-color: var(--ink);
    box-shadow: inset 0 0 0 1px var(--ink);
    color: var(--ink);
  }
}

.colors {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.15rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.35rem 0.4rem;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: rgba(30, 31, 28, 0.05);
  }
}

.color-swatch {
  position: relative;
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);

  &.ring {
    border: 3px solid;
    background: var(--sheet);
  }

  input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
}

.color-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.color-ages {
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--ink-faint);
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.slide-enter,
.slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
