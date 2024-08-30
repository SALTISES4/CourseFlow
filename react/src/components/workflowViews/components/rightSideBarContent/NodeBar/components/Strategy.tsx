// @ts-ignore
import * as React from 'react'
import { connect } from 'react-redux'
import ComponentWithToggleDrop from '@cfEditableComponents/ComponentWithToggleDrop'
import * as Constants from '@cfConstants'
import { AppState } from '@cfRedux/types/type'
import { getStrategyByID, TStrategyByID } from '@cfFindState'
import { CfObjectType } from '@cfModule/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
// import $ from 'jquery'

/**
 * Represents a strategy (SALTISE) or node group (user generated)
 * in the sidebar, to be dragged in and dropped. The actual dropping functionality
 * is handled in the Week component, not here.
 */
type OwnPropsType = {
  objectID: number
  data: any // strategy is untyped
}
type ReduxProps = TStrategyByID

type PropsType = OwnPropsType & ReduxProps
class StrategyUnconnected extends ComponentWithToggleDrop<PropsType> {
  // @todo not used?
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.STRATEGY // @todo check addEditable
    this.objectClass = '.strategy' // @todo check addEditable

    // @ts-ignore
    this.node_block = React.createRef() // @todo check addEditable
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.makeDraggable()
    // @todo
    // @ts-ignore
    $(this.mainDiv.current)[0].dataDraggable = { strategy: this.props.data.id }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  makeDraggable() {
    const draggable_selector = 'week-workflow'
    const draggable_type = 'weekworkflow'

    // @ts-ignore
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
        $('.workflow-canvas').addClass('dragging-' + draggable_type)
        $(draggable_selector).addClass('dragging')
      },
      stop: (_e, _ui) => {
        $('.workflow-canvas').removeClass('dragging-' + draggable_type)
        $(draggable_selector).removeClass('dragging')
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
          src={`${COURSEFLOW_APP.globalContextData.path.static_assets.icon}${
            Constants.strategy_keys[data.strategy_icon]
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
  return getStrategyByID(state, ownProps.objectID)
}

const Strategy = connect(mapStrategyStateToProps, null)(StrategyUnconnected)
export default Strategy
