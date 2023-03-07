import type { ElementProps, Group, ZRenderType } from 'zrender'
import hotkeys from 'hotkeys-js'
export class Zoom {
  #zoomValue = 1
  #prevOrigin = [0, 0]
  #mousePosition = [0, 0]
  #relativeMousePosition = [0, 0]
  #isEnable = false
  constructor(
    private zr: ZRenderType,
    private rootGroup: Group,
  ) {
    this.#initMouseEvent()
    this.#initHotkey()
  }

  enable() {
    this.#isEnable = true
  }

  disable() {
    this.#isEnable = false
  }

  #zoom(origin: number[], delta: number) {
    this.#zoomValue += delta
    this.#zoomValue = Math.min(Math.max(0.1, this.#zoomValue), 10) // 缩放因子限制在0.1-10之间
    const realOrigin = [
      // origin[0] - (origin[0] - prevOrigin.value[0]) / 4,
      // origin[1] - (origin[1] - prevOrigin.value[1]) / 4,
    //   ...origin,
      origin[0] - (origin[0] - this.#relativeMousePosition[0]) / 4,
      origin[1] - (origin[1] - this.#relativeMousePosition[1]) / 4,

    ]

    const rect = this.rootGroup.getBoundingRect()
    // origin[0] - (origin[0] - prevOrigin.value[0]) / 4,
    // origin[1] - (origin[1] - prevOrigin.value[1]) / 4,
    // this.#prevOrigin = realOrigin.map(v => Math.floor(v))
    // const originX = origin[0] - (origin[0] - this.#relativeMousePosition[0]) / 4
    // const originY = origin[1] - (origin[1] - this.#relativeMousePosition[1]) / 4
    const attrInfo: ElementProps = {
      scaleX: this.#zoomValue,
      scaleY: this.#zoomValue,
      originX: realOrigin[0],
      originY: realOrigin[1],
    //   x: newX,
    //   y: newY,
      //   origi
      //   x: this.#relativeMousePosition[0],
      //   y: this.#relativeMousePosition[1],
    }
    console.log(rect, 'attrInfo')

    this.rootGroup.attr(attrInfo)
  }

  #resetZoom(origin: number[]) {
    this.rootGroup.setOrigin(origin)
    this.rootGroup.attr({
      scaleX: 1,
      scaleY: 1,
    })
  }

  #zoomIn(origin: number[]) {
    return this.#zoom(origin, 0.1)
  }

  #zoomOut(origin: number[]) {
    return this.#zoom(origin, -0.1)
  }

  #initHotkey() {
    hotkeys('cmd+=, ctrl+=', { scope: 'global' }, (e) => {
      e.preventDefault()
      this.#zoomIn(this.#mousePosition)
    })

    hotkeys('cmd+-,  ctrl+-', { scope: 'global' }, (e) => {
      e.preventDefault()
      this.#zoomOut(this.#mousePosition)
    })

    hotkeys('cmd+0, ctrl+0', { scope: 'global' }, (e) => {
      e.preventDefault()
      this.#resetZoom([0, 0])
    })
  }

  #initMouseEvent() {
    this.zr.on('mousewheel', (e) => {
      e.stop()
      const delta = e.wheelDelta > 0 ? 0.1 : -0.1 // 根据滚轮方向计算缩放因子
      this.#zoom([e.offsetX, e.offsetY], delta)
    })
    this.zr.on('mousemove', (e) => {
      e.stop()
      const relateOffsetX = e.offsetX - this.rootGroup.x
      const relateOffsetY = e.offsetY - this.rootGroup.y
      //   console.log([e.offsetX, e.offsetY], '23333')
      this.#mousePosition = [e.offsetX, e.offsetY]
      this.#relativeMousePosition = [relateOffsetX, relateOffsetY]
    })
  }
}
