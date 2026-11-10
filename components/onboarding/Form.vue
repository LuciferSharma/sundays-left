<template>
  <form id="onboarding-form" novalidate @submit.prevent="submit">
    <p class="eyebrow">Calendar of Your Life</p>
    <h1 class="title">When were you&nbsp;born?</h1>
    <p class="lede">
      Every circle on the next page is one week of your life. Type your
      birthday below. You can also paste a date or use the calendar.
    </p>

    <div class="dots" aria-hidden="true">
      <span v-for="n in 52" :key="n" :style="{ animationDelay: n * 18 + 'ms' }" />
    </div>

    <fieldset class="date-fields" :class="{ invalid: showError }">
      <legend class="visually-hidden">Birthday</legend>
      <label class="field field-day">
        <span class="field-label">Day</span>
        <input
          ref="day"
          v-model="day"
          inputmode="numeric"
          autocomplete="bday-day"
          placeholder="DD"
          maxlength="2"
          aria-label="Day"
          @input="onInput('day', 2, 'month')"
          @keydown="onKeydown($event, null)"
          @paste="onPaste"
          @blur="touched = true"
        />
      </label>
      <span class="sep" aria-hidden="true">/</span>
      <label class="field field-month">
        <span class="field-label">Month</span>
        <input
          ref="month"
          v-model="month"
          inputmode="numeric"
          autocomplete="bday-month"
          placeholder="MM"
          maxlength="2"
          aria-label="Month"
          @input="onInput('month', 2, 'year')"
          @keydown="onKeydown($event, 'day')"
          @paste="onPaste"
          @blur="touched = true"
        />
      </label>
      <span class="sep" aria-hidden="true">/</span>
      <label class="field field-year">
        <span class="field-label">Year</span>
        <input
          ref="year"
          v-model="year"
          inputmode="numeric"
          autocomplete="bday-year"
          placeholder="YYYY"
          maxlength="4"
          aria-label="Year"
          @input="onInput('year', 4, null)"
          @keydown="onKeydown($event, 'month')"
          @paste="onPaste"
          @blur="touched = true"
        />
      </label>

      <button
        type="button"
        class="picker-button"
        title="Pick from a calendar"
        aria-label="Pick from a calendar"
        @click="openPicker"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="2" />
          <path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
      <input
        ref="native"
        class="native-picker"
        type="date"
        tabindex="-1"
        aria-hidden="true"
        :max="todayIso"
        min="1900-01-01"
        :value="isoValue"
        @change="onNativeChange"
      />
    </fieldset>

    <p class="hint" :class="{ error: showError }" aria-live="polite">
      <template v-if="showError">{{ error }}</template>
      <template v-else-if="parsed">
        {{ formattedDate }}. That's {{ weeksAgo }} weeks ago.
      </template>
      <template v-else>Day / month / year, e.g. 21 / 05 / 1998</template>
    </p>

    <div class="actions">
      <button type="submit" class="primary" :disabled="!parsed">
        Show my weeks
        <span aria-hidden="true">→</span>
      </button>
      <button v-if="editing" type="button" class="ghost" @click="cancel">
        Cancel
      </button>
    </div>
  </form>
</template>

<script lang="ts">
import Vue from 'vue'
import { formatBirthday } from '~/utils/poster'

type Field = 'day' | 'month' | 'year'

const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
]

const pad = (value: number, length = 2) => String(value).padStart(length, '0')

/** Parses common pasted formats into day / month / year strings */
function parsePastedDate(text: string): [string, string, string] | null {
  const clean = text.trim()
  let match = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (match) return [match[3], match[2], match[1]]
  match = clean.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})$/)
  if (match) return [match[1], match[2], match[3]]
  // "21 May 1998", "May 21, 1998"
  const monthIndex = MONTHS.findIndex((m) => clean.toLowerCase().includes(m))
  const numbers = clean.match(/\d+/g)
  if (monthIndex >= 0 && numbers && numbers.length >= 2) {
    const yearNumber = numbers.find((n) => n.length === 4)
    const dayNumber = numbers.find((n) => n.length <= 2)
    if (yearNumber && dayNumber) {
      return [dayNumber, String(monthIndex + 1), yearNumber]
    }
  }
  return null
}

export default Vue.extend({
  name: 'OnboardingForm',
  data() {
    const existing = this.$accessor.birthday.date
    return {
      day: existing ? pad(existing.getDate()) : '',
      month: existing ? pad(existing.getMonth() + 1) : '',
      year: existing ? String(existing.getFullYear()) : '',
      touched: false,
      submitted: false,
    }
  },
  computed: {
    editing(): boolean {
      return this.$accessor.birthday.editing
    },
    todayIso(): string {
      const now = new Date()
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    },
    complete(): boolean {
      return this.day !== '' && this.month !== '' && this.year.length === 4
    },
    error(): string | null {
      if (!this.complete) return 'Please enter a full date: day, month and year.'
      const day = Number(this.day)
      const month = Number(this.month)
      const year = Number(this.year)
      if (month < 1 || month > 12) return 'Month should be between 1 and 12.'
      const date = new Date(year, month - 1, day)
      if (day < 1 || date.getMonth() !== month - 1) {
        return `That month doesn't have a day ${day}.`
      }
      if (year < 1900) return 'Please use a year from 1900 onwards.'
      if (date > new Date()) return "That's in the future. Use a real birthday!"
      return null
    },
    parsed(): Date | null {
      if (this.error) return null
      return new Date(Number(this.year), Number(this.month) - 1, Number(this.day))
    },
    showError(): boolean {
      // Only nag once the user has finished typing or tried to submit
      return !!this.error && (this.submitted || (this.touched && this.complete))
    },
    isoValue(): string {
      const date = this.parsed
      if (!date) return ''
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    },
    formattedDate(): string {
      return this.parsed ? formatBirthday(this.parsed) : ''
    },
    weeksAgo(): string {
      if (!this.parsed) return ''
      // Same formula as the "weeks lived" stat on the calendar page
      const days = Math.round(
        (Date.now() - this.parsed.getTime()) / (1000 * 60 * 60 * 24)
      )
      return Math.ceil(days / 7).toLocaleString('en-US')
    },
  },
  mounted() {
    ;(this.$refs.day as HTMLInputElement).focus()
  },
  methods: {
    onInput(field: Field, length: number, next: Field | null) {
      const digits = this[field].replace(/\D/g, '').slice(0, length)
      this[field] = digits
      if (next && digits.length === length) {
        const nextInput = this.$refs[next] as HTMLInputElement
        nextInput.focus()
        nextInput.select()
      }
    },
    onKeydown(event: KeyboardEvent, previous: Field | null) {
      const input = event.target as HTMLInputElement
      if (
        event.key === 'Backspace' &&
        previous &&
        input.selectionStart === 0 &&
        input.selectionEnd === 0
      ) {
        event.preventDefault()
        const previousInput = this.$refs[previous] as HTMLInputElement
        previousInput.focus()
        const end = previousInput.value.length
        previousInput.setSelectionRange(end, end)
      } else if (['/', '-', '.', ' '].includes(event.key)) {
        // Typing a separator jumps to the next field
        event.preventDefault()
        const order: Field[] = ['day', 'month', 'year']
        const current = order.find((f) => this.$refs[f] === input)
        const index = current ? order.indexOf(current) : -1
        if (index >= 0 && index < 2) {
          ;(this.$refs[order[index + 1]] as HTMLInputElement).focus()
        }
      }
    },
    onPaste(event: ClipboardEvent) {
      const text = event.clipboardData?.getData('text') || ''
      const parts = parsePastedDate(text)
      if (!parts) return
      event.preventDefault()
      this.day = pad(Number(parts[0]))
      this.month = pad(Number(parts[1]))
      this.year = parts[2]
      this.touched = true
      ;(this.$refs.year as HTMLInputElement).focus()
    },
    openPicker() {
      const native = this.$refs.native as HTMLInputElement & {
        showPicker?: () => void
      }
      try {
        if (native.showPicker) native.showPicker()
        else native.click()
      } catch {
        native.click()
      }
    },
    onNativeChange(event: Event) {
      const value = (event.target as HTMLInputElement).value
      const parts = parsePastedDate(value)
      if (!parts) return
      this.day = pad(Number(parts[0]))
      this.month = pad(Number(parts[1]))
      this.year = parts[2]
      this.touched = true
    },
    submit() {
      this.submitted = true
      if (this.parsed) {
        this.$accessor.birthday.set({ date: this.parsed })
      }
    },
    cancel() {
      this.$accessor.birthday.cancelEditing()
    },
  },
})
</script>

<style lang="scss" scoped>
#onboarding-form {
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
  animation: rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

.eyebrow {
  margin: 0 0 1rem;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.title {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: clamp(40px, 7vw, 68px);
  line-height: 0.98;
  letter-spacing: -0.01em;
  text-transform: uppercase;
}

.lede {
  margin: 1.25rem 0 0;
  max-width: 34em;
  font-family: var(--font-body);
  font-size: 17px;
  line-height: 1.5;
  color: var(--ink-soft);
}

.dots {
  display: grid;
  grid-template-columns: repeat(26, 1fr);
  gap: 5px;
  max-width: 420px;
  margin: 2.25rem 0 2rem;

  span {
    aspect-ratio: 1;
    border-radius: 50%;
    border: 1.5px solid var(--accent);
    animation: fill 0.5s ease both;
  }

  // Fill roughly the first third, like a life already under way
  span:nth-child(-n + 17) {
    animation-name: fill-solid;
  }
}

.date-fields {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  border: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  input {
    width: 100%;
    padding: 0.35rem 0 0.4rem;
    border: 0;
    border-bottom: 3px solid var(--ink);
    border-radius: 0;
    background: transparent;
    font-family: var(--font-display);
    font-size: clamp(34px, 6vw, 52px);
    line-height: 1;
    text-align: center;
    font-variant-numeric: tabular-nums;
    transition: border-color 0.15s;

    &::placeholder {
      color: var(--ink-faint);
      opacity: 0.55;
    }

    &:focus {
      outline: none;
      border-bottom-color: var(--accent);
    }
  }
}

.field-day,
.field-month {
  width: 3.2ch;
  flex: 0 0 auto;
  min-width: 78px;
}

.field-year {
  width: 5.4ch;
  min-width: 140px;
}

.field-label {
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.sep {
  padding-bottom: 0.7rem;
  font-family: var(--font-display);
  font-size: 32px;
  color: var(--ink-faint);
}

.invalid .field input {
  border-bottom-color: #d4584f;
}

.picker-button {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-left: 0.5rem;
  margin-bottom: 0.25rem;
  border: 1.5px solid var(--line);
  border-radius: 50%;
  background: var(--sheet);
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;

  &:hover {
    border-color: var(--ink);
    transform: translateY(-1px);
  }
}

.native-picker {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 48px;
  height: 48px;
  opacity: 0;
  pointer-events: none;
}

.hint {
  min-height: 1.5em;
  margin: 1rem 0 0;
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--ink-soft);

  &.error {
    color: #c0443b;
  }
}

.actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.primary,
.ghost {
  height: 52px;
  padding: 0 1.6rem;
  border-radius: 999px;
  font-size: 15px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s, opacity 0.15s;
}

.primary {
  border: 0;
  background: var(--ink);
  color: var(--sheet);

  span {
    display: inline-block;
    margin-left: 0.4rem;
    transition: transform 0.2s;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);

    span {
      transform: translateX(4px);
    }
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.ghost {
  border: 1.5px solid var(--line);
  background: transparent;

  &:hover {
    border-color: var(--ink);
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}

@keyframes fill {
  from {
    opacity: 0;
    transform: scale(0.4);
  }
}

@keyframes fill-solid {
  from {
    opacity: 0;
    transform: scale(0.4);
  }
  to {
    background: var(--accent);
  }
}
</style>
