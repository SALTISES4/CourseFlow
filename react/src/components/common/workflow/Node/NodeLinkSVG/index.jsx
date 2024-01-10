import * as Utility from '@cfUtility'
import * as React from 'react'
import { Component } from '@cfParentComponents'
import * as Constants from '@cfConstants'
import {
  add as mathadd,
  dot as mathdot,
  matrix as mathmatrix,
  multiply as mathmultiply,
  norm as mathnorm,
  subtract as mathsubtract
} from 'mathjs'

/**
 * Creates paths between two ports
 *  SVG portion of a NodeLink
 */
class PathGenerator {
  constructor(
    source_point,
    source_port,
    target_point,
    target_port,
    source_dims,
    target_dims
  ) {
    this.point_arrays = { source: [source_point], target: [target_point] }
    this.last_point = { source: source_point, target: target_point }
    this.direction = {
      source: Constants.port_direction[source_port],
      target: Constants.port_direction[target_port]
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
  getPathLength() {
    let length = 0
    for (let i = 1; i < this.full_array.length; i++) {
      const seg_len = mathnorm(
        mathsubtract(this.full_array[i], this.full_array[i - 1])
      )
      length += seg_len
    }
    return length
  }

  //gets the point at the given fraction of our path length
  getFractionalPoint(position) {
    const length = this.getPathLength()
    if (length === 0) return [0, 0]
    const point = this.full_array[1]
    let run_length = 0
    const target_length = length * position
    for (let i = 1; i < this.full_array.length; i++) {
      const seg = mathsubtract(this.full_array[i], this.full_array[i - 1])
      const seg_len = mathnorm(seg)
      if (run_length + seg_len < target_length) run_length += seg_len
      else {
        const remaining_len = target_length - run_length
        return mathadd(
          this.full_array[i - 1],
          mathmultiply(seg, remaining_len / seg_len)
        )
      }
    }
    return point
  }

  //Recursively checks to see whether we need to move around a node, if not, we just need to join the arrays
  findNextPoint() {
    if (this.findcounter > 8) return
    this.findcounter++
    //Determine which case we have:
    if (
      mathdot(
        this.direction['source'],
        mathsubtract(this.last_point['target'], this.last_point['source'])
      ) < 0
    ) {
      this.tickPerpendicular('source')
      this.findNextPoint()
    } else if (
      mathdot(
        this.direction['target'],
        mathsubtract(this.last_point['source'], this.last_point['target'])
      ) < 0
    ) {
      this.tickPerpendicular('target')
      this.findNextPoint()
    }
  }

  addPoint(point, port = 'source') {
    this.point_arrays[port].push(point)
    this.last_point[port] = point
  }

  addDelta(delta, port = 'source') {
    this.addPoint(mathadd(delta, this.last_point[port]), port)
  }

  //Pads out away from the node edge
  padOut(port) {
    this.addDelta(
      mathmultiply(Constants.port_padding, this.direction[port]),
      port
    )
  }

  //Turns perpendicular to move around the edge of the node
  tickPerpendicular(port = 'source') {
    let otherport = 'target'
    if (port === 'target') otherport = 'source'
    this.padOut(port)
    const new_direction = mathmultiply(
      mathmatrix([
        mathmultiply([1, 0], this.direction[port][1] ** 2),
        mathmultiply([0, 1], this.direction[port][0] ** 2)
      ]),
      mathsubtract(this.last_point[otherport], this.last_point[port])
    )._data
    const norm = mathnorm(new_direction)
    if (norm === 0) throw 'Non-numeric'
    this.direction[port] = mathmultiply(
      1.0 / mathnorm(new_direction),
      new_direction
    )
    this.addDelta(
      mathmultiply(
        this.getNodeOutline(this.direction[port], port),
        this.direction[port]
      ),
      port
    )
  }

  //Determines how far we need to move in order to move around the edge of the node
  getNodeOutline(direction, port) {
    if (this.hasTicked[port]) {
      return Math.abs(mathdot(direction, this.node_dims[port]))
    } else {
      this.hasTicked[port] = true
      return Math.abs(mathdot(direction, this.node_dims[port]) / 2)
    }
  }

  //joins the two arrays, either as a corner or a double corner
  joinArrays() {
    const joined = this.point_arrays['source'].slice()
    //We have remaining either a corner or both point towards each other
    if (mathdot(this.direction['source'], this.direction['target']) == 0) {
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
      const diff = mathsubtract(
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
      joined.push(mathadd(this.last_point['source'], mid1))
      joined.push(mathadd(this.last_point['target'], mid2))
    }
    for (let i = this.point_arrays['target'].length - 1; i >= 0; i--) {
      joined.push(this.point_arrays['target'][i])
    }
    return joined
  }
}

class NodeLinkSVG extends Component {
  // componentDidUpdate() {
  //   if (
  //     this.props.hovered ||
  //     this.state.hovered ||
  //     this.props.selected ||
  //     this.props.node_selected
  //   ) {
  //     // d3.select(this.maindiv.current).raise();
  //     // d3.selectAll(".node-ports").raise();
  //   }
  // }

  getPathArray(source_point, source_port, target_point, target_port) {
    const source_dims = [
      this.props.source_dimensions.width,
      this.props.source_dimensions.height
    ]
    const target_dims = [
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

  getPath(path_array) {
    let path = 'M'
    for (let i = 0; i < path_array.length; i++) {
      if (i > 0) path += ' L'
      const thispoint = path_array[i]
      path += thispoint[0] + ' ' + thispoint[1]
    }
    return path
  }

  render() {
    // @todo this  try / catch is too broad and hiding too many potential errors
    try {
      console.log('this.props.source_port_handle')
      console.log(this.props.source_port_handle)

      console.log('this.props.target_port_handle')
      console.log(this.props.target_port_handle)

      const source_transform = Utility.getSVGTranslation(
        this.props.source_port_handle
          .select(function () {
            console.log('this.parentNode')
            console.log(this.parentNode)
            return this.parentNode
          })
          .attr('transform')
      )
      const target_transform = Utility.getSVGTranslation(
        this.props.target_port_handle
          .select(function () {
            console.log('this.parentNode')
            console.log(this.parentNode)
          })
          .attr('transform')
      )
      console.log('this.props.source_port_handle')
      console.log(this.props.source_port_handle)

      // @todo what is all this doing?
      const source_point = [
        parseInt(this.props.source_port_handle.attr('cx')) +
          parseInt(source_transform[0]),
        parseInt(this.props.source_port_handle.attr('cy')) +
          parseInt(source_transform[1])
      ]
      const target_point = [
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

      let style
      if (this.props.style) style = { ...this.props.style }
      else style = {}
      if (this.props.hovered || this.state.hovered) {
        style.stroke = 'yellow'
        style.opacity = 1
      } else if (this.props.node_selected) {
        style.stroke = myColour
        style.opacity = 0.4
      } else if (this.props.selected) {
        style.stroke = myColour
        style.opacity = 1
      } else if (this.props.lock) {
        style.stroke = lock.user_colour
        style.opacity = 1
      } else {
        style.stroke = 'black'
        style.opacity = 0.4
      }

      let title
      if (this.props.title && this.props.title !== '') {
        const text_position = path_array.getFractionalPoint(
          this.props.text_position / 100.0
        )
        title = (
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

      return (
        <g ref={this.maindiv} stroke="black" fill="none">
          <path
            opacity="0"
            strokeWidth="10px"
            d={path}
            onClick={this.props.clickFunction}
            onMouseEnter={() => this.setState({ hovered: true })}
            onMouseLeave={() => this.setState({ hovered: false })}
            className={'nodelink'}
          />
          <path
            style={style}
            strokeWidth="2px"
            d={path}
            markerEnd="url(#arrow)"
          />
          {title}
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
