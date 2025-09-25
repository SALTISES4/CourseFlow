import { NumTuple, ObjectLock } from '@cf/types/common'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import Utility from '@cf/utility/Utility.class'
import PathGenerator from '@cfViews/WorkflowView/WorkflowEditView/components/_node/NodelinkSVG/PathGenerator.class'
import * as d3 from 'd3'
import * as React from 'react'

/**
 * Creates paths between two ports
 * SVG portion of a NodeLink
 */

export type OwnProps = {
  hovered: boolean
  nodeSelected: boolean
  sourcePortHandle: d3.Selection<SVGElement, unknown, HTMLElement, any>
  sourcePort: number
  targetPortHandle: d3.Selection<SVGElement, unknown, HTMLElement, any>
  targetPort: number
  sourceDimensions: Dimensions
  targetDimensions: Dimensions
  textPosition?: number
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

type PropsType = OwnProps
type State = {
  hovered: boolean
}

class NodelinkSVG extends React.Component<PropsType, State> {
  mainDiv: React.RefObject<SVGGElement>

  constructor(props: PropsType) {
    super(props)

    this.mainDiv = React.createRef()
    this.state = {} as State
  }

  getPathArray(
    sourcePoint: NumTuple,
    sourcePort: number,
    targetPoint: NumTuple,
    targetPort: number
  ) {
    const sourceDims: NumTuple = [
      this.props.sourceDimensions.width,
      this.props.sourceDimensions.height
    ]
    const targetDims: NumTuple = [
      this.props.targetDimensions.width,
      this.props.targetDimensions.height
    ]
    return new PathGenerator(
      sourcePoint,
      sourcePort,
      targetPoint,
      targetPort,
      sourceDims,
      targetDims
    )
  }

  getPath(pathArray: NumTuple[]): string {
    return pathArray.reduce(
      (acc, point, index) =>
        `${acc}${index > 0 ? ' L' : ''}${point[0]} ${point[1]}`,
      'M'
    )
  }

  // getPath(pathArray) {
  //   let path = 'M'
  //   for (let i = 0; i < pathArray.length; i++) {
  //     if (i > 0) path += ' L'
  //     const thispoint = pathArray[i]
  //     path += thispoint[0] + ' ' + thispoint[1]
  //   }
  //   return path
  // }

  getStyle() {
    if (this.props.hovered || this.state.hovered) {
      return {
        ...this.props.style,
        stroke: 'rgb(253, 216, 53)',
        opacity: 1
      }
    }

    if (this.props.nodeSelected) {
      return {
        ...this.props.style,
        // current user's color
        stroke: 'rgb(4, 186, 116)', // maybe get the user id here, we'll see...
        opacity: 0.5
      }
    }

    if (this.props.selected) {
      return {
        ...this.props.style,
        stroke: 'rgb(4, 186, 116)', // maybe get the user id here, we'll see...
        opacity: 0.5
      }
    }

    if (this.props.lock) {
      return {
        ...this.props.style,
        stroke: this.props.lock?.userColour ?? '',
        opacity: 1
      }
    }

    return {
      ...this.props.style,
      stroke: 'rgb(120, 144, 156)',
      opacity: 0.3
    }
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  Title = ({ pathArray }) => {
    if (this.props.title && this.props.title !== '') {
      const textPosition = pathArray.getFractionalPoint(
        this.props.textPosition / 100.0
      )

      return (
        <foreignObject
          width="100"
          height="100"
          x={textPosition[0] - 50}
          y={textPosition[1] - 50}
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
      const sourceTransform = ThemeHelper.getSVGTranslation(
        this.props.sourcePortHandle
          .select(function () {
            // @todo be careful of the scope of this here
            // we need to sort this out
            return this.parentNode as Element
          })
          .attr('transform')
      )

      this.props.targetPortHandle
        .select(function () {
          // @todo be careful of the scope of this here
          return this.parentNode as Element
        })
        .attr('transform')

      const targetTransform = ThemeHelper.getSVGTranslation(
        this.props.targetPortHandle
          .select(function () {
            // @todo be careful of the scope of this here
            return this.parentNode as Element
          })
          .attr('transform')
      )

      // @todo what is all this doing?
      const sourcePoint: NumTuple = [
        parseInt(this.props.sourcePortHandle.attr('cx')) +
          parseInt(sourceTransform[0]),
        parseInt(this.props.sourcePortHandle.attr('cy')) +
          parseInt(sourceTransform[1])
      ]

      const targetPoint: NumTuple = [
        parseInt(this.props.targetPortHandle.attr('cx')) +
          parseInt(targetTransform[0]),
        parseInt(this.props.targetPortHandle.attr('cy')) +
          parseInt(targetTransform[1])
      ]

      const pathArray = this.getPathArray(
        sourcePoint,
        this.props.sourcePort,
        targetPoint,
        this.props.targetPort
      )

      const path = this.getPath(pathArray.findPath())

      const style = this.getStyle()

      return (
        <g ref={this.mainDiv} stroke="black" fill="none">
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
          <this.Title pathArray={pathArray} />
        </g>
      )
    } catch (err) {
      Utility.logger('could not draw a node link')
      // Utility.logger(err)
      return null
    }
  }
}

export default NodelinkSVG
