export const WEEKS_PER_YEAR = 52
const ONE_DAY = 1000 * 60 * 60 * 24

export interface GridPosition {
  /** Row on the calendar: completed years of age */
  years: number
  /** Column on the calendar: full weeks since the last birthday (0-51) */
  weeks: number
}

export function weeksRemaining(
  weeksElapsed: number | null,
  lifeExpectancy: number
): number | null {
  if (weeksElapsed === null) return null
  return Math.max(lifeExpectancy * WEEKS_PER_YEAR - weeksElapsed, 0)
}

export function percentLived(
  weeksElapsed: number | null,
  lifeExpectancy: number
): number | null {
  if (weeksElapsed === null) return null
  const total = lifeExpectancy * WEEKS_PER_YEAR
  return Math.min(100, (weeksElapsed / total) * 100)
}

/** Where a given date falls on the calendar grid, or null if before birth */
export function positionForDate(
  birthday: Date,
  date: Date
): GridPosition | null {
  if (date < birthday) return null
  let years = date.getFullYear() - birthday.getFullYear()
  const lastBirthday = new Date(birthday)
  lastBirthday.setFullYear(birthday.getFullYear() + years)
  if (lastBirthday > date) {
    years -= 1
    lastBirthday.setFullYear(birthday.getFullYear() + years)
  }
  const days = Math.floor((date.getTime() - lastBirthday.getTime()) / ONE_DAY)
  const weeks = Math.min(Math.floor(days / 7), WEEKS_PER_YEAR - 1)
  return { years, weeks }
}

/** First day of the week shown at a grid cell (inverse of positionForDate) */
export function weekStartDate(
  birthday: Date,
  row: number,
  column: number
): Date {
  const date = new Date(birthday)
  date.setFullYear(birthday.getFullYear() + row)
  date.setDate(date.getDate() + column * 7)
  return date
}

export const pad = (value: number, length = 2) =>
  String(value).padStart(length, '0')

/** Local-time YYYY-MM-DD (avoids the UTC shift of toISOString) */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`
}

export function fromIsoDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return date.getMonth() === Number(match[2]) - 1 ? date : null
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
