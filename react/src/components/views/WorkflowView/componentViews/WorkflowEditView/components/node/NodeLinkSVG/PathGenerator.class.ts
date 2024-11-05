import * as Constants from '@cf/constants'
import { NumTuple } from '@cf/types/common'
import * as math from 'mathjs'

// eslint-disable-next-line no-undef
type Direction = { source: NumTuple; target: NumTuple }

type DirectionArray = { source: number[][]; target: number[][] }
type Port = 'source' | 'target'

class PathGenerator {
  // private direction: DirectionArray
  private direction: Direction
  private hasTicked: { source: boolean; target: boolean }
  private nodeDims: Direction
  private findcounter: number
  private fullArray: any[]
  private pointArrays: DirectionArray
  private lastPoint: Direction
  constructor(
    sourcePoint: NumTuple,
    sourcePort: number,
    targetPoint: NumTuple,
    targetPort: number,
    sourceDims: NumTuple,
    targetDims: NumTuple
  ) {
    this.pointArrays = {
      source: [sourcePoint],
      target: [targetPoint]
    }
    this.lastPoint = { source: sourcePoint, target: targetPoint }
    this.direction = {
      source: Constants.portDirection[sourcePort] as NumTuple,
      target: Constants.portDirection[targetPort] as NumTuple
    }
    this.hasTicked = { source: false, target: false }
    this.nodeDims = { source: sourceDims, target: targetDims }
    this.findcounter = 0
    this.fullArray = []
  }

  //finds and returns the path
  findPath() {
    try {
      this.findNextPoint()
    } catch (err) {
      console.log('error calculating path')
    }
    this.fullArray = this.joinArrays()
    return this.fullArray
  }

  //gets the total length of our path
  getPathLength(): number {
    return this.fullArray
      .slice(1)
      .reduce(
        (acc, currentPoint, index) =>
          acc + math.norm(math.subtract(currentPoint, this.fullArray[index])),
        0
      )
  }
  // getPathLength() {
  //   let length = 0
  //   for (let i = 1; i < this.fullArray.length; i++) {
  //     const seg_len = mathnorm(
  //       mathsubtract(this.fullArray[i], this.fullArray[i - 1])
  //     )
  //     length += seg_len
  //   }
  //   return length
  // }

  //gets the point at the given fraction of our path length
  getFractionalPoint(position: number): NumTuple {
    const totalLength = this.getPathLength()
    if (totalLength === 0) {
      return [0, 0]
    }

    let runLength = 0
    const targetLength = totalLength * position

    for (let i = 1; i < this.fullArray.length; i++) {
      const segment = math.subtract(this.fullArray[i], this.fullArray[i - 1])
      const segmentLength = math.number(math.norm(segment))

      runLength += segmentLength
      if (runLength >= targetLength) {
        const remainingLength = targetLength - (runLength - segmentLength)
        return math.add(
          this.fullArray[i - 1],
          math.multiply(math.divide(segment, segmentLength), remainingLength)
        )
      }
    }

    return this.fullArray[1]
  }

  //Recursively checks to see whether we need to move around a node, if not, we just need to join the arrays
  findNextPoint() {
    if (this.findcounter > 8) {
      return
    }
    this.findcounter++

    const isSourceNegative =
      math.dot(
        this.direction['source'],
        math.subtract(this.lastPoint['target'], this.lastPoint['source'])
      ) < 0

    const isTargetNegative =
      math.dot(
        this.direction['target'],
        math.subtract(this.lastPoint['source'], this.lastPoint['target'])
      ) < 0

    if (isSourceNegative) {
      this.tickPerpendicular('source')
      this.findNextPoint()
    } else if (isTargetNegative) {
      this.tickPerpendicular('target')
      this.findNextPoint()
    }
  }

  addPoint(point: NumTuple, port: Port = 'source') {
    this.pointArrays[port].push(point)
    this.lastPoint[port] = point
  }

  addDelta(delta: NumTuple, port: Port = 'source') {
    this.addPoint(math.add(delta, this.lastPoint[port]), port)
  }

  //Pads out away from the node edge
  padOut(port: Port) {
    this.addDelta(
      // is of type MathType
      math.multiply(Constants.portPadding, this.direction[port]) as NumTuple,
      port
    )
  }

  //Turns perpendicular to move around the edge of the node
  tickPerpendicular(port: Port = 'source') {
    const otherPort: Port = port === 'target' ? 'source' : 'target'

    this.padOut(port)

    const test = math.multiply([1, 0], this.direction[port][1] ** 2)

    // @ts-ignore
    const matrix = math.matrix([
      math.multiply([1, 0], this.direction[port][1] ** 2),
      math.multiply([0, 1], this.direction[port][0] ** 2)
    ])
    const sub = math.subtract(this.lastPoint[otherPort], this.lastPoint[port])

    // const newDirection = math.multiply(matrix, sub)._data // _data is a private class property

    const newDirection = math.multiply(matrix, sub).toArray()
    const norm = math.norm(newDirection)

    if (norm === 0) {
      throw 'Non-numeric'
    }

    this.direction[port] = math.multiply(
      // @ts-ignore
      1.0 / math.norm(newDirection),
      newDirection
    ) as NumTuple

    this.addDelta(
      math.multiply(
        this.getNodeOutline(this.direction[port], port),
        this.direction[port]
      ) as NumTuple,
      port
    )
  }

  //Determines how far we need to move in order to move around the edge of the node
  getNodeOutline(direction: [number, number], port: Port): number {
    if (this.hasTicked[port]) {
      return Math.abs(math.dot(direction, this.nodeDims[port]))
    } else {
      this.hasTicked[port] = true
      return Math.abs(math.dot(direction, this.nodeDims[port]) / 2)
    }
  }

  //joins the two arrays, either as a corner or a double corner
  /**
   *
   */
  joinArrays(): number[][] {
    const joined = this.pointArrays['source'].slice()
    //We have remaining either a corner or both point towards each other
    if (math.dot(this.direction['source'], this.direction['target']) == 0) {
      //corner
      joined.push([
        this.direction['source'][0] ** 2 * this.lastPoint['target'][0] +
          this.direction['target'][0] ** 2 * this.lastPoint['source'][0],
        this.direction['source'][1] ** 2 * this.lastPoint['target'][1] +
          this.direction['target'][1] ** 2 * this.lastPoint['source'][1]
      ])
    } else {
      if (this.hasTicked.source == false && this.hasTicked.target == false) {
        this.padOut('target')
        this.padOut('source')
      }
      //double corner
      const diff = math.subtract(
        this.lastPoint['target'],
        this.lastPoint['source']
      )
      const mid1 = [
        (this.direction['source'][0] ** 2 * diff[0]) / 2,
        (this.direction['source'][1] ** 2 * diff[1]) / 2
      ]
      const mid2 = [
        (-(this.direction['source'][0] ** 2) * diff[0]) / 2,
        (-(this.direction['source'][1] ** 2) * diff[1]) / 2
      ]
      joined.push(math.add(this.lastPoint['source'], mid1))
      joined.push(math.add(this.lastPoint['target'], mid2))
    }
    for (let i = this.pointArrays['target'].length - 1; i >= 0; i--) {
      joined.push(this.pointArrays['target'][i])
    }
    return joined
  }
}

export default PathGenerator
