import { apiPaths } from '@cf/router/apiRoutes'
import * as Constants from '@cfConstants'
import { TStrategyByID, getStrategyById } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'
// import $ from 'jquery'

/**
 * Represents a strategy (SALTISE) or node group (user generated)
 * in the sidebar, to be dragged in and dropped. The actual dropping functionality
 * is handled in the Week component, not here.
 */
type OwnPropsType = {
  objectId: number
  data: any // strategy is untyped
}
type ReduxProps = TStrategyByID

type PropsType = OwnPropsType & ReduxProps
class StrategyUnconnected extends React.Component<PropsType> {
  mainDiv: React.RefObject<HTMLDivElement>

  constructor(props: PropsType) {
    super(props)
    this.mainDiv = React.createRef()

    // this.nodeBlock = React.createRef() // @todo check addEditable
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.makeDraggable()
    // @todo HACK, this is being used to bypass react and pass information around the DOM
    // @ts-ignore
    $(this.mainDiv.current)[0].dataDraggable = { strategy: this.props.data.id }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  makeDraggable() {
    const draggableSelector = 'week-workflow'
    const draggableType = 'weekworkflow'

    $(this.mainDiv?.current).draggable({
      helper: (_e, _item) => {
        const helper = $(document.createElement('div'))
        helper.addClass('week-ghost')
        helper.appendTo(document.body)
        return helper
      },
      cursor: 'move',
      cursorAt: { top: 20, left: 100 },
      distance: 10,
      start: (_e, _ui) => {
        $('.workflow-canvas').addClass('dragging-' + draggableType)
        $(draggableSelector).addClass('dragging')
      },
      stop: (_e, _ui) => {
        $('.workflow-canvas').removeClass('dragging-' + draggableType)
        $(draggableSelector).removeClass('dragging')
      }
    })
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const { data } = this.props

    const title = data && data.title ? data.title : 'untitled strategy'
    const strategyIcon =
      data && data.strategy_icon ? (
        <img
          src={`${apiPaths.external.static_assets.icon}${
            Constants.strategyKeys[data.strategy_icon]
          }.svg`}
        />
      ) : null

    return (
      <div
        className="strategy-bar-strategy strategy new-strategy"
        ref={this.mainDiv}
      >
        {strategyIcon}
        <div>{title}</div>
      </div>
    )
  }
}

const mapStrategyStateToProps = (
  state: AppState,
  ownProps: OwnPropsType
): TStrategyByID => {
  return getStrategyById(state, ownProps.objectId)
}

const Strategy = connect(mapStrategyStateToProps, null)(StrategyUnconnected)
export default Strategy
