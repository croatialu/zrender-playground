import type { Group, ZRenderType } from 'zrender'
import hotkeys from 'hotkeys-js'

class Drag {
  #isDragMode = false
  #isDragging = false
  #isEnable = false

  dragStartPoint = [0, 0]
  dragStartAbsolutePoint = [0, 0]
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

  #initMouseEvent() {
    this.zr.on('mousemove', (event) => {
      if (!this.#isEnable)
        return
      if (this.#isDragging) {
        const offsetX = event.offsetX - this.dragStartPoint[0]
        const offsetY = event.offsetY - this.dragStartPoint[1]

        this.rootGroup.attr({
          x: this.dragStartAbsolutePoint[0] + offsetX,
          y: this.dragStartAbsolutePoint[1] + offsetY,
        })

        this.zr.setCursorStyle('grabbing')
        return
      }

      if (!this.#isDragMode)
        return
      this.zr.setCursorStyle('grab')
    })

    this.zr.on('mousedown', (e) => {
      if (!this.#isDragMode || !this.#isEnable)
        return
      this.zr.setCursorStyle('grabbing')

      this.#isDragging = true
      this.dragStartPoint = [e.offsetX, e.offsetY]
      this.dragStartAbsolutePoint = [this.rootGroup.x, this.rootGroup.y]
    })
    this.zr.on('mouseup', () => {
      if (!this.#isDragMode || !this.#isEnable)
        return
      this.zr.setCursorStyle('grab')
      this.#isDragging = false
    })
  }

  #initHotkey() {
    hotkeys('space', { scope: 'global', keydown: true }, (e) => {
      if (!this.#isEnable)
        return
      e.preventDefault()
      if (!this.#isDragMode && e.type === 'keydown') {
        this.#isDragMode = true
        this.zr.setCursorStyle('grab')
      }
    })

    hotkeys('space', { scope: 'global', keyup: true }, (e) => {
      if (!this.#isEnable)
        return
      e.preventDefault()

      if (this.#isDragMode && e.type === 'keyup') {
        this.#isDragMode = false
        this.zr.setCursorStyle('default')
      }
    })
  }
}

export default Drag
