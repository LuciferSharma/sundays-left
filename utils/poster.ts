import {
  Circle,
  CircleCanvasPainter,
  drawCalendar,
  ElapsedPosition,
  RightAxisLabel,
  Shape,
  WeekMark,
} from '~/utils/circle-canvas'
import { formatDate, formatShortDate, fromIsoDate } from '~/utils/stats'

const SHEET_COLOR = '#fffdf8'
const INK = '#1e1f1c'
const INK_SOFT = '#5c5a54'
const INK_FAINT = '#a29d92'
const MARGIN = 72
const LEFT_LABEL_WIDTH = 36
const LEGEND_ROW_HEIGHT = 24
const LEGEND_GAP = 28

export interface PosterMilestone {
  date: string
  label: string
  color: string
}

export interface PosterData {
  title: string
  birthday: Date | null
  circleMatrix: Circle[][]
  labels: RightAxisLabel[]
  position: ElapsedPosition | null
  fillElapsed: boolean
  shape: Shape
  currentColor: string
  marks: WeekMark[]
  milestones: PosterMilestone[]
}

export const formatBirthday = formatDate

function drawArrow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number
) {
  const head = 7
  context.beginPath()
  context.moveTo(x, y)
  context.lineTo(x + length, y)
  context.moveTo(x + length - head, y - head * 0.6)
  context.lineTo(x + length, y)
  context.lineTo(x + length - head, y + head * 0.6)
  context.stroke()
}

interface LegendItem {
  text: string
  color: string
  x: number
  y: number
}

/** Flows milestone legend items into rows that fit `maxWidth` */
function layoutLegend(
  context: CanvasRenderingContext2D,
  milestones: PosterMilestone[],
  maxWidth: number
): { items: LegendItem[]; height: number } {
  context.font = '13px "Giga Sans Medium", sans-serif'
  const items: LegendItem[] = []
  let x = 0
  let y = 0
  milestones.forEach((milestone) => {
    const date = fromIsoDate(milestone.date)
    const dateText = date ? formatShortDate(date) : milestone.date
    const text = milestone.label ? `${milestone.label} · ${dateText}` : dateText
    const width = 20 + context.measureText(text).width
    if (x > 0 && x + width > maxWidth) {
      x = 0
      y += LEGEND_ROW_HEIGHT
    }
    items.push({ text, color: milestone.color, x, y })
    x += width + LEGEND_GAP
  })
  return { items, height: items.length ? y + LEGEND_ROW_HEIGHT : 0 }
}

/**
 * Renders a print-quality poster (title, axis labels, the full calendar and
 * a legend of marked weeks) to an offscreen canvas.
 */
export function renderPoster(data: PosterData, scale = 2): HTMLCanvasElement {
  // 1. The calendar grid on its own high-resolution canvas
  const gridCanvas = document.createElement('canvas')
  const painter = new CircleCanvasPainter({
    canvas: gridCanvas,
    rowCount: 0,
    columnCount: 0,
  })
  drawCalendar({
    painter,
    circleMatrix: data.circleMatrix,
    labels: data.labels,
    position: data.position,
    fillElapsed: data.fillElapsed,
    shape: data.shape,
    currentColor: data.currentColor,
    marks: data.marks,
    pixelRatio: scale,
  })
  const gridWidth = painter.getWidth()
  const gridHeight = painter.getHeight()

  // 2. Layout of the sheet, in logical px
  const poster = document.createElement('canvas')
  const context = poster.getContext('2d')!
  const legend = layoutLegend(context, data.milestones, gridWidth - 28)

  const titleY = MARGIN
  const subtitleY = titleY + 58
  const topLabelY = (data.birthday ? subtitleY : titleY + 32) + 52
  const gridX = MARGIN + LEFT_LABEL_WIDTH
  const gridY = topLabelY + 30
  const legendY = gridY + gridHeight + 36
  const width = gridX + gridWidth + MARGIN
  const height =
    (legend.height ? legendY + legend.height : gridY + gridHeight) +
    MARGIN +
    16

  poster.width = Math.round(width * scale)
  poster.height = Math.round(height * scale)
  context.scale(scale, scale)
  context.fillStyle = SHEET_COLOR
  context.fillRect(0, 0, width, height)
  context.textBaseline = 'top'
  context.textAlign = 'start'

  // Title + birth date
  context.fillStyle = INK
  context.font = '44px "Giga Sans Black", sans-serif'
  context.fillText(data.title.toUpperCase(), MARGIN, titleY, width - 2 * MARGIN)

  if (data.birthday) {
    context.fillStyle = INK_SOFT
    context.font = '17px "Giga Sans Medium", sans-serif'
    context.fillText(`Born ${formatDate(data.birthday)}`, MARGIN, subtitleY)
  }

  // Axis titles with arrows
  context.fillStyle = INK
  context.strokeStyle = INK
  context.lineWidth = 1.5
  context.font = '14px "Giga Sans Extra Bold", sans-serif'
  const topText = 'WEEKS OF YOUR LIFE'
  context.fillText(topText, gridX + 28, topLabelY)
  const topTextWidth = context.measureText(topText).width
  drawArrow(context, gridX + 28 + topTextWidth + 12, topLabelY + 7, 60)

  context.save()
  context.translate(MARGIN + 4, gridY)
  context.rotate(Math.PI / 2)
  const leftText = 'YEARS OF YOUR LIFE'
  context.fillText(leftText, 0, -14)
  drawArrow(context, context.measureText(leftText).width + 12, -7, 60)
  context.restore()

  // The grid itself
  context.drawImage(gridCanvas, gridX, gridY, gridWidth, gridHeight)

  // Legend of marked weeks
  context.font = '13px "Giga Sans Medium", sans-serif'
  legend.items.forEach((item) => {
    const x = gridX + 28 + item.x
    const y = legendY + item.y
    context.beginPath()
    context.arc(x + 6, y + 7, 6, 0, Math.PI * 2)
    context.fillStyle = item.color
    context.fill()
    context.fillStyle = INK
    context.fillText(item.text, x + 20, y)
  })

  // Footer
  context.fillStyle = INK_FAINT
  context.font = '12px "Giga Sans Medium", sans-serif'
  context.fillText(
    `Each circle is one week. Made ${formatDate(new Date())}.`,
    MARGIN,
    height - MARGIN + 24
  )

  return poster
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, 'image/png')
}
