import { CELL_HEIGHT, CELL_WIDTH, ROW_CARD_COUNT } from './constant'
export const getStartPoint = (containerRect: { width: number; height: number }, lineWidth: number) => {
  const { width, height } = containerRect

  const maxWidth = lineWidth * ROW_CARD_COUNT + CELL_WIDTH * (ROW_CARD_COUNT - 1)
  const maxHeight = lineWidth * ROW_CARD_COUNT + CELL_HEIGHT * (ROW_CARD_COUNT - 1)

  const startX = (width - maxWidth) / 2
  const startY = (height - maxHeight) / 2

  return { x: startX, y: startY, maxWidth, maxHeight }
}
