import { Group, matrix } from 'zrender'
import type { ZRenderType } from 'zrender'

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
  constructor(
    private zr: ZRenderType,
    rootGroup: Group,
  ) {
    const indexExists = find(rootGroup, this.roots)

    if (indexExists >= 0)
      return

    this.roots.push({ root: rootGroup, handler: () => { } })

    this.roamTransformable.add(this.rawTransformable)
    this.initMouseEvent()
  }

  private initMouseEvent() {
    this.zr.on('mousedown', (e) => {
      this.moving = [e.offsetX, e.offsetY]
    })
    this.zr.on('mouseup', () => {
      this.moving = false
    })

    this.zr.on('mousemove', (e) => {
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
    })

    this.zr.on('mousewheel', (e) => {
      e.stop()

      const wheelDelta = e.wheelDelta
      const absWheelDeltaDelta = Math.abs(wheelDelta)
      const originX = e.offsetX
      const originY = e.offsetY

      // wheelDelta maybe -0 in chrome mac.
      if (wheelDelta === 0)
        return

      const factor = absWheelDeltaDelta > 3 ? 1.4 : absWheelDeltaDelta > 1 ? 1.2 : 1.1
      const scaleDelta = wheelDelta > 0 ? factor : 1 / factor

      for (let i = 0; i < this.roots.length; i++)
        this.updateTransform(this.roots[i], [0, 0], [scaleDelta, scaleDelta], [originX, originY])
    })
  }

  private updateTransform(rootRecord: RootRecord, positionDeltas: number[], scaleDeltas: number[], origin: number[]) {
    const root = rootRecord.root

    this.rawTransformable.attr({
      scaleX: root.scaleX,
      scaleY: root.scaleY,
      originX: root.originX,
      originY: root.originY,
      rotation: root.rotation,
    })

    this.roamTransformable.setPosition(positionDeltas)

    this.roamTransformable.attr({
      scaleX: scaleDeltas[0],
      scaleY: scaleDeltas[1],
      originX: origin[0],
      originY: origin[1],
    })

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
