<template>
  <div class="date-input" :class="{ invalid }" @paste="onPaste">
    <input
      ref="day"
      v-model="day"
      inputmode="numeric"
      placeholder="DD"
      maxlength="2"
      aria-label="Day"
      @input="onInput('day', 2, 'month')"
      @keydown="onKeydown($event, null, 'month')"
    />
    <span aria-hidden="true">/</span>
    <input
      ref="month"
      v-model="month"
      inputmode="numeric"
      placeholder="MM"
      maxlength="2"
      aria-label="Month"
      @input="onInput('month', 2, 'year')"
      @keydown="onKeydown($event, 'day', 'year')"
    />
    <span aria-hidden="true">/</span>
    <input
      ref="year"
      v-model="year"
      class="year"
      inputmode="numeric"
      placeholder="YYYY"
      maxlength="4"
      aria-label="Year"
      @input="onInput('year', 4, null)"
      @keydown="onKeydown($event, 'month', null)"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { fromIsoDate, pad } from '~/utils/stats'

type Field = 'day' | 'month' | 'year'

/** Compact day / month / year text entry. v-model is 'YYYY-MM-DD' or ''. */
export default Vue.extend({
  name: 'DateInput',
  props: {
    value: { type: String, default: '' },
  },
  data() {
    return { day: '', month: '', year: '' }
  },
  computed: {
    complete(): boolean {
      return this.day !== '' && this.month !== '' && this.year.length === 4
    },
    iso(): string {
      if (!this.complete) return ''
      const iso = `${this.year}-${pad(Number(this.month))}-${pad(Number(this.day))}`
      return fromIsoDate(iso) ? iso : ''
    },
    invalid(): boolean {
      return this.complete && !this.iso
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(value: string) {
        if (value === this.iso) return
        const date = value ? fromIsoDate(value) : null
        this.day = date ? pad(date.getDate()) : ''
        this.month = date ? pad(date.getMonth() + 1) : ''
        this.year = date ? String(date.getFullYear()) : ''
      },
    },
    iso(iso: string) {
      if (iso !== this.value) this.$emit('input', iso)
    },
  },
  methods: {
    focus() {
      ;(this.$refs.day as HTMLInputElement).focus()
    },
    onInput(field: Field, length: number, next: Field | null) {
      const digits = this[field].replace(/\D/g, '').slice(0, length)
      this[field] = digits
      if (next && digits.length === length) {
        const input = this.$refs[next] as HTMLInputElement
        input.focus()
        input.select()
      }
    },
    onKeydown(event: KeyboardEvent, previous: Field | null, next: Field | null) {
      const input = event.target as HTMLInputElement
      if (
        event.key === 'Backspace' &&
        previous &&
        input.selectionStart === 0 &&
        input.selectionEnd === 0
      ) {
        event.preventDefault()
        const prev = this.$refs[previous] as HTMLInputElement
        prev.focus()
        prev.setSelectionRange(prev.value.length, prev.value.length)
      } else if (['/', '-', '.', ' '].includes(event.key)) {
        event.preventDefault()
        if (next) (this.$refs[next] as HTMLInputElement).focus()
      }
    },
    onPaste(event: ClipboardEvent) {
      const text = (event.clipboardData?.getData('text') || '').trim()
      let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
      let parts: string[] | null = match ? [match[3], match[2], match[1]] : null
      if (!parts) {
        match = text.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})$/)
        parts = match ? [match[1], match[2], match[3]] : null
      }
      if (!parts) return
      event.preventDefault()
      this.day = pad(Number(parts[0]))
      this.month = pad(Number(parts[1]))
      this.year = parts[2]
    },
  },
})
</script>

<style lang="scss" scoped>
.date-input {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 36px;
  padding: 0 0.6rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--sheet);
  transition: border-color 0.15s;

  &:focus-within {
    border-color: var(--ink);
  }

  &.invalid {
    border-color: #c0443b;
  }

  span {
    color: var(--ink-faint);
  }

  input {
    width: 2.3ch;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: 14px;
    text-align: center;
    font-variant-numeric: tabular-nums;

    &.year {
      width: 4.4ch;
    }

    &:focus {
      outline: none;
    }

    &::placeholder {
      color: var(--ink-faint);
    }
  }
}
</style>
