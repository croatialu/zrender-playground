import { Group, matrix } from 'zrender'
import type { ZRenderType } from 'zrender'
import hotkeys from 'hotkeys-js'

interface RootRecord {
  root: Group
  handler: Function
}

function find(root: Group, roots: Array<RootRecord>) {
  for (let i = 0; i < roots.length; i++) {
    if (roots[i].root === root)
      return i
  }
  return -1
}

class Roamable {
  private roots: Array<RootRecord> = []
  private moving: number[] | false = false
  private rawTransformable = new Group()
  private roamTransformable = new Group()

  private isMoveMode = false

  constructor(
    private zr: ZRenderType,
    rootGroup: Group,
  ) {
    const indexExists = find(rootGroup, this.roots)

    if (indexExists >= 0)
      return

    this.roots.push({ root: rootGroup, handler: () => { } })

    this.roamTransformable.add(this.rawTransformable)
  }

  init() {
    this.initMouseEvent()
    this.initHotkeys()
  }

  private initMouseEvent() {
    this.zr.on('mousedown', (e) => {
      if (!this.isMoveMode)
        return
      this.moving = [e.offsetX, e.offsetY]
      this.zr.setCursorStyle('grabbing')
    })
    this.zr.on('mouseup', () => {
      this.moving = false
      if (this.isMoveMode)
        this.zr.setCursorStyle('grab')
    })

    this.zr.on('mousemove', (e) => {
      if (!this.moving && this.isMoveMode)
        this.zr.setCursorStyle('grab')

      if (!this.moving)
        return
      const pointerPos = [e.offsetX, e.offsetY]
      for (let i = 0; i < this.roots.length; i++) {
        this.updateTransform(
          this.roots[i],
          [pointerPos[0] - this.moving[0], pointerPos[1] - this.moving[1]],
          [1, 1],
          [0, 0],
        )
      }
      this.moving = pointerPos
      this.zr.setCursorStyle('grabbing')
    })

    this.zr.on('mousewheel', (e) => {
      e.stop()
      this.zoom(e.wheelDelta, [e.offsetX, e.offsetY])
    })
  }

  private zoom(delta: number, offset: number[]) {
    const wheelDelta = delta
    const absWheelDeltaDelta = Math.abs(wheelDelta)
    const [originX, originY] = offset

    // wheelDelta maybe -0 in chrome mac.
    if (wheelDelta === 0)
      return

    const factor = absWheelDeltaDelta > 3 ? 1.4 : absWheelDeltaDelta > 1 ? 1.2 : 1.1
    const scaleDelta = wheelDelta > 0 ? factor : 1 / factor

    for (let i = 0; i < this.roots.length; i++)
      this.updateTransform(this.roots[i], [0, 0], [scaleDelta, scaleDelta], [originX, originY])
  }

  private resetZoom() {
    this.roots.forEach(({ root }) => {
      root.attr({
        scaleX: 1,
        scaleY: 1,
        x: 0,
        y: 0,
      })
    })
  }

  private initHotkeys() {
    // zoom in
    hotkeys('cmd+=', { scope: 'global' }, (e) => {
      e.preventDefault()
      const width = this.zr.getWidth()
      const height = this.zr.getHeight()
      this.zoom(1, [width / 2, height / 2])
    })

    // zoom out
    hotkeys('cmd+-', { scope: 'global' }, (e) => {
      e.preventDefault()
      const width = this.zr.getWidth()
      const height = this.zr.getHeight()
      this.zoom(-1, [width / 2, height / 2])
    })

    hotkeys('space', { scope: 'global', keydown: true }, (e) => {
      e.preventDefault()
      if (!this.isMoveMode && e.type === 'keydown') {
        this.isMoveMode = true
        this.zr.setCursorStyle('grab')
      }
    })

    hotkeys('space', { scope: 'global', keyup: true }, (e) => {
      e.preventDefault()

      if (this.isMoveMode && e.type === 'keyup') {
        this.isMoveMode = false
        this.zr.setCursorStyle('default')
      }
    })

    hotkeys('z', { scope: 'global' }, (e) => {
      e.preventDefault()
      this.resetZoom()
    })
  }

  private updateTransform(rootRecord: RootRecord, positionDeltas: number[], scaleDeltas: number[], origin: number[]) {
    const root = rootRecord.root

    this.rawTransformable.x = root.x
    this.rawTransformable.y = root.y
    this.rawTransformable.originX = root.originX
    this.rawTransformable.originY = root.originY
    this.rawTransformable.scaleX = root.scaleX
    this.rawTransformable.scaleY = root.scaleY
    this.rawTransformable.rotation = root.rotation

    this.roamTransformable.x = positionDeltas[0]
    this.roamTransformable.y = positionDeltas[1]
    this.roamTransformable.originX = origin[0]
    this.roamTransformable.originY = origin[1]
    this.roamTransformable.scaleX = scaleDeltas[0]
    this.roamTransformable.scaleY = scaleDeltas[1]

    this.roamTransformable.updateTransform()
    this.rawTransformable.updateTransform()

    matrix.copy(
      root.transform || (root.transform = []),
      this.rawTransformable.transform || matrix.create(),
    )

    root.decomposeTransform()
    root.dirty()

    const handler = rootRecord.handler
    handler && handler(root)
  }
}

export default Roamable
