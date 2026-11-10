export const AXIS_WIDTH = 28
const AXIS_TEXT_COLOR = '#111'
const DIAMETER = 22
export const FONT_FAMILY = '"Giga Sans Extra Bold", sans-serif'
const FONT = `12px ${FONT_FAMILY}`
const PADDING = 2
const RADIUS_WIDTH = 2
export const STEP_SIZE = DIAMETER + 2 * PADDING

export type Shape = 'circle' | 'rounded' | 'square'

export interface Circle {
  row: number
  column: number
  color: string
  filled?: boolean
  /** Ring colour when this is the current week */
  currentColor?: string
  /** Fill colour when this week is a marked milestone */
  markColor?: string
}

export interface RightAxisLabel {
  text: string
  rowStart: number
  rowEnd: number
  color: string
}

export interface ElapsedPosition {
  years: number
  weeks: number
}

interface ConstructorArguments {
  canvas: HTMLCanvasElement
  rowCount: number
  columnCount: number
  pixelRatio?: number
}

export class CircleCanvasPainter {
  private readonly canvas: HTMLCanvasElement
  private rowCount: number
  private columnCount: number
  private pixelRatio: number
  shape: Shape = 'circle'

  constructor({
    canvas,
    rowCount,
    columnCount,
    pixelRatio = 1,
  }: ConstructorArguments) {
    this.canvas = canvas
    this.rowCount = rowCount
    this.columnCount = columnCount
    this.pixelRatio = pixelRatio
    this.updateDimensions()

    this.drawCircle = this.drawCircle.bind(this)
    this.drawLeftAxis = this.drawLeftAxis.bind(this)
    this.drawRightAxis = this.drawRightAxis.bind(this)
  }

  /**
   * Resizes the canvas (which also clears it) for a new grid size. The
   * backing store is multiplied by `pixelRatio` so the chart stays crisp on
   * high-DPI screens and when zoomed in, while CSS size stays in logical px.
   */
  reset(rowCount: number, columnCount: number, pixelRatio = this.pixelRatio) {
    this.rowCount = rowCount
    this.columnCount = columnCount
    this.pixelRatio = pixelRatio
    this.updateDimensions()
  }

  drawLeftAxis(row: number) {
    const context = this.getContext()
    context.fillStyle = AXIS_TEXT_COLOR
    context.font = FONT
    context.textAlign = 'start'
    context.fillText(`${row + 1}`, 0, STEP_SIZE * row + STEP_SIZE * 0.7)
  }

  drawRightAxis({ text, rowStart, rowEnd, color }: RightAxisLabel) {
    const context = this.getContext()
    context.save()
    context.font = FONT
    context.textAlign = 'center'
    context.rotate(Math.PI / 2)
    // The x/y are relative to the origin rotated as above
    const x = STEP_SIZE * rowStart + (STEP_SIZE * (1 + rowEnd - rowStart)) / 2
    const y = -(this.getWidth() - STEP_SIZE * 0.5)
    context.fillStyle = color
    context.fillText(text.toUpperCase(), x, y)
    context.restore()
  }

  drawCircle({ row, column, color, filled, currentColor, markColor }: Circle) {
    if (row >= this.rowCount || row < 0) return
    if (column >= this.columnCount || column < 0) return

    const centerX = STEP_SIZE * column + STEP_SIZE / 2 + AXIS_WIDTH
    const centerY = STEP_SIZE * row + STEP_SIZE / 2
    const context = this.getContext()
    this.tracePath(context, centerX, centerY, DIAMETER / 2)

    const fill = markColor || (filled ? color : null)
    if (fill) {
      context.fillStyle = fill
      context.fill()
    }
    context.lineWidth = currentColor ? RADIUS_WIDTH * 1.5 : RADIUS_WIDTH
    context.strokeStyle = currentColor || markColor || color
    context.stroke()

    if (markColor) {
      // A small white dot makes marked weeks stand out from lived ones
      this.tracePath(context, centerX, centerY, DIAMETER / 6)
      context.fillStyle = '#fffdf8'
      context.fill()
    }
  }

  /** Builds the path for one week cell in the current shape */
  private tracePath(
    context: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number
  ) {
    context.beginPath()
    if (this.shape === 'circle') {
      context.arc(centerX, centerY, radius, 0, Math.PI * 2, true)
    } else {
      // Inset slightly so squares look the same visual size as circles
      const half = radius * 0.9
      const corner = this.shape === 'rounded' ? half * 0.45 : 0
      const left = centerX - half
      const top = centerY - half
      const size = half * 2
      context.moveTo(left + corner, top)
      context.arcTo(left + size, top, left + size, top + size, corner)
      context.arcTo(left + size, top + size, left, top + size, corner)
      context.arcTo(left, top + size, left, top, corner)
      context.arcTo(left, top, left + size, top, corner)
    }
    context.closePath()
  }

  getWidth(): number {
    return STEP_SIZE * this.columnCount + AXIS_WIDTH * 2
  }

  getHeight(): number {
    return STEP_SIZE * this.rowCount
  }

  private updateDimensions() {
    const width = this.getWidth()
    const height = this.getHeight()
    this.canvas.width = Math.round(width * this.pixelRatio)
    this.canvas.height = Math.round(height * this.pixelRatio)
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
    this.getContext().setTransform(
      this.pixelRatio,
      0,
      0,
      this.pixelRatio,
      0,
      0
    )
  }

  private getContext(): CanvasRenderingContext2D {
    return this.canvas.getContext('2d')!
  }
}

export interface WeekMark {
  row: number
  column: number
  color: string
}

interface DrawCalendarArguments {
  painter: CircleCanvasPainter
  circleMatrix: Circle[][]
  labels: RightAxisLabel[]
  position: ElapsedPosition | null
  fillElapsed: boolean
  shape?: Shape
  currentColor?: string
  marks?: WeekMark[]
  pixelRatio?: number
}

/** Draws the full calendar (axes, cells, stage labels) with one painter */
export function drawCalendar({
  painter,
  circleMatrix,
  labels,
  position,
  fillElapsed,
  shape = 'circle',
  currentColor = AXIS_TEXT_COLOR,
  marks = [],
  pixelRatio,
}: DrawCalendarArguments) {
  const rowCount = circleMatrix.length
  const columnCount = rowCount > 0 ? circleMatrix[0].length : 0
  painter.shape = shape
  painter.reset(rowCount, columnCount, pixelRatio)

  const markByCell = new Map<string, string>()
  marks.forEach((mark) => markByCell.set(`${mark.row}:${mark.column}`, mark.color))

  circleMatrix.forEach((row, rowIndex) => {
    painter.drawLeftAxis(rowIndex)
    row.forEach((circle) => {
      const isPast =
        !!position &&
        (circle.row < position.years ||
          (circle.row === position.years && circle.column < position.weeks))
      const isCurrent =
        !!position &&
        circle.row === position.years &&
        circle.column === position.weeks
      painter.drawCircle({
        ...circle,
        filled: fillElapsed && isPast,
        currentColor: isCurrent ? currentColor : undefined,
        markColor: markByCell.get(`${circle.row}:${circle.column}`),
      })
    })
  })

  labels.forEach(painter.drawRightAxis)
}

/** Waits for the canvas fonts so text isn't drawn with a fallback face */
export function loadCanvasFonts(): Promise<unknown> {
  // TS 4.3's DOM lib lacks document.fonts, so type the bit we use
  const fonts =
    typeof document === 'undefined'
      ? undefined
      : (document as unknown as { fonts?: { load(font: string): Promise<unknown> } }).fonts
  if (!fonts) return Promise.resolve()
  return Promise.all([
    fonts.load('12px "Giga Sans Extra Bold"'),
    fonts.load('16px "Giga Sans Extra Bold"'),
    fonts.load('16px "Giga Sans Black"'),
    fonts.load('16px "Giga Sans Medium"'),
  ]).catch(() => undefined)
}
