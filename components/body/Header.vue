<template>
  <header class="header">
    <div class="intro">
      <p class="eyebrow">A life in weeks</p>
      <h1>{{ title }}</h1>
      <p class="lede">Time is limited and precious. How do you want to spend it?</p>
    </div>

    <div v-if="weeksLived !== null" class="stats">
      <div class="stat">
        <span class="value">{{ format(weeksLived) }}</span>
        <span class="label">weeks lived</span>
      </div>
      <div class="stat">
        <span class="value">{{ format(weeksLeft) }}</span>
        <span class="label">weeks to go</span>
      </div>
      <div class="stat">
        <span class="value">{{ percentText }}<small>%</small></span>
        <span class="label">of {{ lifeExpectancy }} years</span>
      </div>

      <div
        class="progress"
        role="progressbar"
        :aria-valuenow="Math.round(percent || 0)"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`${percentText}% of life lived`"
      >
        <span
          v-for="segment in segments"
          :key="segment.text"
          class="segment"
          :style="{ flexGrow: segment.size, background: segment.color }"
        />
        <span class="mask" :style="{ left: (percent || 0) + '%' }" />
        <span class="marker" :style="{ left: (percent || 0) + '%' }" />
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import Vue from 'vue'
import { percentLived, weeksRemaining } from '~/utils/stats'

export default Vue.extend({
  name: 'BodyHeader',
  computed: {
    title(): string {
      return this.$accessor.circles.displayTitle
    },
    lifeExpectancy(): number {
      return this.$accessor.circles.lifeExpectancy
    },
    weeksLived(): number | null {
      return this.$accessor.birthday.currentWeek
    },
    weeksLeft(): number | null {
      return weeksRemaining(this.weeksLived, this.lifeExpectancy)
    },
    percent(): number | null {
      return percentLived(this.weeksLived, this.lifeExpectancy)
    },
    percentText(): string {
      return (this.percent || 0).toFixed(1)
    },
    segments(): { text: string; color: string; size: number }[] {
      return this.$accessor.circles.rightAxisLabels.map((label) => ({
        text: label.text,
        color: label.color,
        size: label.rowEnd - label.rowStart + 1,
      }))
    },
  },
  methods: {
    format(value: number | null): string {
      return value === null ? '–' : value.toLocaleString('en-US')
    },
  },
})
</script>

<style lang="scss" scoped>
.header {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 2rem 4rem;
  align-items: end;
  max-width: 1400px;
  margin: 0 auto;
  padding: 3.5rem 1.5rem 2rem;
  text-align: left;
  animation: rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    padding-top: 2.5rem;
  }
}

.eyebrow {
  margin: 0 0 0.75rem;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

h1 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: clamp(34px, 5vw, 58px);
  line-height: 0.95;
  letter-spacing: -0.01em;
  text-transform: uppercase;
}

.lede {
  margin: 1rem 0 0;
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--ink-soft);
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, auto);
  justify-content: start;
  gap: 1.25rem 2.5rem;

  // Three equal columns that can shrink, so 320px screens never overflow
  @media (max-width: 520px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem 0.75rem;
  }
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  .value {
    font-family: var(--font-display);
    font-size: clamp(20px, 6.5vw, 36px);
    line-height: 1;
    font-variant-numeric: tabular-nums;

    small {
      font-size: 0.55em;
      margin-left: 1px;
    }
  }

  .label {
    font-size: clamp(9.5px, 2.6vw, 11px);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }
}

.progress {
  position: relative;
  grid-column: 1 / -1;
  display: flex;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;

  .segment {
    flex-basis: 0;
  }

  // Unlived part fades to a pale wash of the stage colours
  .mask {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 253, 248, 0.72);
  }

  .marker {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    margin-left: -1px;
    background: var(--ink);
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}
</style>
