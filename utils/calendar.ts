import type { accessorType } from '~/store'
import type { Milestone } from '~/store/circles'
import { WeekMark } from '~/utils/circle-canvas'
import { fromIsoDate, positionForDate } from '~/utils/stats'

type Accessor = typeof accessorType

/** Grid cells for each marked week that falls inside the calendar */
export function milestoneMarks(accessor: Accessor): WeekMark[] {
  const birthday = accessor.birthday.date
  if (!birthday) return []
  const rows = accessor.circles.lifeExpectancy
  const marks: WeekMark[] = []
  accessor.circles.sortedMilestones.forEach((milestone: Milestone) => {
    const date = fromIsoDate(milestone.date)
    const position = date && positionForDate(birthday, date)
    if (position && position.years < rows) {
      marks.push({
        row: position.years,
        column: position.weeks,
        color: milestone.color,
      })
    }
  })
  return marks
}

/** Everything drawCalendar() needs, read from the store */
export function calendarDrawOptions(accessor: Accessor) {
  return {
    circleMatrix: accessor.circles.circleMatrix,
    labels: accessor.circles.rightAxisLabels,
    position: accessor.birthday.elapsedPosition,
    fillElapsed: accessor.circles.fillElapsed,
    shape: accessor.circles.shape,
    currentColor: accessor.circles.currentColor,
    marks: milestoneMarks(accessor),
  }
}
