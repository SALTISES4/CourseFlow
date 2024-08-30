import * as Utility from '@cfUtility'
import * as React from 'react'
import * as Constants from '@cfConstants'
import * as math from 'mathjs'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfEditableComponents/ComponentWithToggleDrop'
import { ObjectLock } from '@cfModule/types/common'
import { NumTuple } from '@cfModule/types/common'
import { _t } from '@cf/utility/utilityFunctions'

// eslint-disable-next-line no-undef
type Direction = { source: NumTuple; target: NumTuple }

type DirectionArray = { source: number[][]; target: number[][] }
type Port = 'source' | 'target'

/**
 * Creates paths between two ports
 *  SVG portion of a NodeLink
 */
class PathGenerator {
  // private direction: DirectionArray
  private direction: Direction
  private hasTicked: { source: boolean; target: boolean }
  private node_dims: Direction
  private findcounter: number
  private full_array: any[]
  private point_arrays: DirectionArray
  private last_point: Direction
  constructor(
    source_point: NumTuple,
    source_port: number,
    target_point: NumTuple,
    target_port: number,
    source_dims: NumTuple,
    target_dims: NumTuple
  ) {
    this.point_arrays = {
      source: [source_point],
      target: [target_point]
    }
    this.last_point = { source: source_point, target: target_point }
    this.direction = {
      source: Constants.port_direction[source_port] as NumTuple,
      target: Constants.port_direction[target_port] as NumTuple
    }
    this.hasTicked = { source: false, target: false }
    this.node_dims = { source: source_dims, target: target_dims }
    this.findcounter = 0
    this.full_array = []
  }

  //finds and returns the path
  findPath() {
    try {
      this.findNextPoint()
    } catch (err) {
      console.log('error calculating path')
    }
    this.full_array = this.joinArrays()
    return this.full_array
  }

  //gets the total length of our path
  getPathLength(): number {
    return this.full_array
      .slice(1)
      .reduce(
        (acc, currentPoint, index) =>
          acc + math.norm(math.subtract(currentPoint, this.full_array[index])),
        0
      )
  }
  // getPathLength() {
  //   let length = 0
  //   for (let i = 1; i < this.full_array.length; i++) {
  //     const seg_len = mathnorm(
  //       mathsubtract(this.full_array[i], this.full_array[i - 1])
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

    for (let i = 1; i < this.full_array.length; i++) {
      const segment = math.subtract(this.full_array[i], this.full_array[i - 1])
      const segmentLength = math.number(math.norm(segment))

      runLength += segmentLength
      if (runLength >= targetLength) {
        const remainingLength = targetLength - (runLength - segmentLength)
        return math.add(
          this.full_array[i - 1],
          math.multiply(math.divide(segment, segmentLength), remainingLength)
        )
      }
    }

    return this.full_array[1]
  }

  //Recursively checks to see whether we need to move around a node, if not, we just need to join the arrays
  findNextPoint() {
    if (this.findcounter > 8) return
    this.findcounter++

    const isSourceNegative =
      math.dot(
        this.direction['source'],
        math.subtract(this.last_point['target'], this.last_point['source'])
      ) < 0

    const isTargetNegative =
      math.dot(
        this.direction['target'],
        math.subtract(this.last_point['source'], this.last_point['target'])
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
    this.point_arrays[port].push(point)
    this.last_point[port] = point
  }

  addDelta(delta: NumTuple, port: Port = 'source') {
    this.addPoint(math.add(delta, this.last_point[port]), port)
  }

  //Pads out away from the node edge
  padOut(port: Port) {
    this.addDelta(
      // is of type MathType
      math.multiply(Constants.port_padding, this.direction[port]) as NumTuple,
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
    const sub = math.subtract(this.last_point[otherPort], this.last_point[port])

    // const new_direction = math.multiply(matrix, sub)._data // _data is a private class property

    const new_direction = math.multiply(matrix, sub).toArray()
    const norm = math.norm(new_direction)

    if (norm === 0) {
      throw 'Non-numeric'
    }

    this.direction[port] = math.multiply(
      // @ts-ignore
      1.0 / math.norm(new_direction),
      new_direction
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
      return Math.abs(math.dot(direction, this.node_dims[port]))
    } else {
      this.hasTicked[port] = true
      return Math.abs(math.dot(direction, this.node_dims[port]) / 2)
    }
  }

  //joins the two arrays, either as a corner or a double corner
  /**
   *
   */
  joinArrays(): number[][] {
    const joined = this.point_arrays['source'].slice()
    //We have remaining either a corner or both point towards each other
    if (math.dot(this.direction['source'], this.direction['target']) == 0) {
      //corner
      joined.push([
        this.direction['source'][0] ** 2 * this.last_point['target'][0] +
          this.direction['target'][0] ** 2 * this.last_point['source'][0],
        this.direction['source'][1] ** 2 * this.last_point['target'][1] +
          this.direction['target'][1] ** 2 * this.last_point['source'][1]
      ])
    } else {
      if (this.hasTicked.source == false && this.hasTicked.target == false) {
        this.padOut('target')
        this.padOut('source')
      }
      //double corner
      const diff = math.subtract(
        this.last_point['target'],
        this.last_point['source']
      )
      const mid1 = [
        (this.direction['source'][0] ** 2 * diff[0]) / 2,
        (this.direction['source'][1] ** 2 * diff[1]) / 2
      ]
      const mid2 = [
        (-(this.direction['source'][0] ** 2) * diff[0]) / 2,
        (-(this.direction['source'][1] ** 2) * diff[1]) / 2
      ]
      joined.push(math.add(this.last_point['source'], mid1))
      joined.push(math.add(this.last_point['target'], mid2))
    }
    for (let i = this.point_arrays['target'].length - 1; i >= 0; i--) {
      joined.push(this.point_arrays['target'][i])
    }
    return joined
  }
}

export type OwnProps = {
  hovered: boolean
  node_selected: boolean
  source_port_handle: d3.Selection<SVGElement, unknown, HTMLElement, any>
  source_port: number
  target_port_handle: d3.Selection<SVGElement, unknown, HTMLElement, any>
  target_port: number
  source_dimensions: Dimensions
  target_dimensions: Dimensions
  text_position?: number
  style?: Style
  clickFunction?: (evt: React.MouseEvent) => void
  title?: string | null
  selected?: boolean
  lock?: ObjectLock
}

type Dimensions = {
  width: number
  height: number
}

type Style = any

type PropsType = OwnProps & ComponentWithToggleProps

// top
class NodeLinkSVG extends ComponentWithToggleDrop<PropsType> {
  private parentNode: string
  getPathArray(
    source_point: NumTuple,
    source_port: number,
    target_point: NumTuple,
    target_port: number
  ) {
    const source_dims: NumTuple = [
      this.props.source_dimensions.width,
      this.props.source_dimensions.height
    ]
    const target_dims: NumTuple = [
      this.props.target_dimensions.width,
      this.props.target_dimensions.height
    ]
    return new PathGenerator(
      source_point,
      source_port,
      target_point,
      target_port,
      source_dims,
      target_dims
    )
  }
  getPath(pathArray: NumTuple[]): string {
    return pathArray.reduce(
      (acc, point, index) =>
        `${acc}${index > 0 ? ' L' : ''}${point[0]} ${point[1]}`,
      'M'
    )
  }

  // getPath(path_array) {
  //   let path = 'M'
  //   for (let i = 0; i < path_array.length; i++) {
  //     if (i > 0) path += ' L'
  //     const thispoint = path_array[i]
  //     path += thispoint[0] + ' ' + thispoint[1]
  //   }
  //   return path
  // }

  getStyle() {
    // if (this.props.hovered || this.state.hovered) { // @todo there is no state here
    if (this.props.hovered) {
      // @todo there is no state here
      return {
        ...this.props.style,
        stroke: 'yellow',
        opacity: 1
      }
    }
    if (this.props.node_selected) {
      return {
        ...this.props.style,
        // @ts-ignore
        stroke: COURSEFLOW_APP.contextData.myColour ?? '', // @todo find out where this comes from
        opacity: 0.4
      }
    }
    if (this.props.selected) {
      return {
        ...this.props.style,
        // @ts-ignore
        stroke: COURSEFLOW_APP.contextData.myColour ?? '', // @todo find out where this comes from
        opacity: 1
      }
    }
    if (this.props.lock) {
      return {
        ...this.props.style,
        stroke: this.props.lock?.user_colour ?? '',
        opacity: 1
      }
    }

    return {
      ...this.props.style,
      stroke: 'black',
      opacity: 0.4
    }
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  Title = ({ pathArray }) => {
    if (this.props.title && this.props.title !== '') {
      const text_position = pathArray.getFractionalPoint(
        this.props.text_position / 100.0
      )

      return (
        <foreignObject
          width="100"
          height="100"
          x={text_position[0] - 50}
          y={text_position[1] - 50}
        >
          <div className="nodelinkwrapper">
            <div
              className="nodelinktext"
              dangerouslySetInnerHTML={{ __html: this.props.title }}
              onClick={this.props.clickFunction}
            />
          </div>
        </foreignObject>
      )
    }
    return <></>
  }

  render() {
    try {
      const source_transform = Utility.getSVGTranslation(
        this.props.source_port_handle
          .select(function () {
            // @todo be careful of the scope of this here
            // we need to sort this out
            return this.parentNode as Element
          })
          .attr('transform')
      )

      this.props.target_port_handle
        .select(function () {
          // @todo be careful of the scope of this here
          return this.parentNode as Element
        })
        .attr('transform')

      const target_transform = Utility.getSVGTranslation(
        this.props.target_port_handle
          .select(function () {
            // @todo be careful of the scope of this here
            return this.parentNode as Element
          })
          .attr('transform')
      )

      // @todo what is all this doing?
      const source_point: NumTuple = [
        parseInt(this.props.source_port_handle.attr('cx')) +
          parseInt(source_transform[0]),
        parseInt(this.props.source_port_handle.attr('cy')) +
          parseInt(source_transform[1])
      ]

      const target_point: NumTuple = [
        parseInt(this.props.target_port_handle.attr('cx')) +
          parseInt(target_transform[0]),
        parseInt(this.props.target_port_handle.attr('cy')) +
          parseInt(target_transform[1])
      ]

      const path_array = this.getPathArray(
        source_point,
        this.props.source_port,
        target_point,
        this.props.target_port
      )

      const path = this.getPath(path_array.findPath())

      const style = this.getStyle()

      return (
        <g
          // @todo does this need a separate ref?
          //@ts-ignore
          ref={this.mainDiv}
          stroke="black"
          fill="none"
        >
          <path
            opacity="0"
            strokeWidth="10px"
            d={path}
            onClick={this.props.clickFunction}
            onMouseEnter={() =>
              this.setState({
                hovered: true
              })
            }
            onMouseLeave={() =>
              this.setState({
                hovered: false
              })
            }
            className={'nodelink'}
          />
          <path
            style={style}
            strokeWidth="2px"
            d={path}
            markerEnd="url(#arrow)"
          />
          <this.Title pathArray={path_array} />
        </g>
      )
    } catch (err) {
      console.log('could not draw a node link')
      console.log(err)
      return null
    }
  }
}

export default NodeLinkSVG
