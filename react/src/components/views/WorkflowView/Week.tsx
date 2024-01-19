import * as React from 'react'
import { connect } from 'react-redux'
import * as Utility from '@cfUtility'
import { getWeekByID, GetWeekByIDType } from '@cfFindState'
import * as Constants from '@cfConstants'
import { EditableComponentWithSorting } from '@cfParentComponents'
import { TitleText } from '@cfUIComponents'
import NodeWeek from './NodeWeek'
import { columnChanged, insertedAt } from '@XMLHTTP/postTemp.jsx'
import ActionCreator from '@cfRedux/ActionCreator'
// import $ from 'jquery'
import {
  EditableComponentWithSortingProps,
  EditableComponentWithSortingState
} from '@cfParentComponents/EditableComponentWithSorting'
import { AppState } from '@cfRedux/type'
import { addStrategyQuery } from '@XMLHTTP/API/strategy'
import { CfObjectType } from '@cfModule/types/enum'
import { UtilityLoader } from '@cfModule/utility/UtilityLoader'

type ConnectedProps = GetWeekByIDType
type OwnProps = {
  throughParentID?: number
  rank?: number
  column_order?: any // @todo i think this is delivered by redux
  nodes_by_column?: any
} & EditableComponentWithSortingProps
export type WeekUnconnectedPropsType = OwnProps

type PropsType = OwnProps & ConnectedProps

/**
 * Renders a standard 'week-style' block of nodes, wherein the
 * nodes appear one above the other, never side by side
 */
class WeekUnconnected<P extends PropsType> extends EditableComponentWithSorting<
  P,
  EditableComponentWithSortingState
> {
  protected node_block: React.RefObject<HTMLDivElement>
  constructor(props: P) {
    super(props)
    this.objectType = CfObjectType.WEEK
    this.objectClass = '.week'
    this.node_block = React.createRef()
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.makeDragAndDrop()
  }

  componentDidUpdate() {
    this.makeDragAndDrop()
    Utility.triggerHandlerEach(
      $(this.mainDiv.current).find('.node'),
      'component-updated'
    )
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  makeDragAndDrop() {
    //Makes the nodeweeks in the node block draggable
    this.makeSortableNode(
      $(this.node_block.current).children('.node-week').not('.ui-draggable'),
      this.props.objectID,
      'nodeweek',
      '.node-week',
      false,
      // @ts-ignore
      [200, 1],
      null,
      '.node',
      '.week-block'
    )
    this.makeDroppable()
  }

  sortableColumnChangedFunction(id, delta_x, old_column) {
    const columns = this.props.column_order
    const old_column_index = columns.indexOf(old_column)
    const new_column_index = old_column_index + delta_x
    if (new_column_index < 0 || new_column_index >= columns.length) return
    const new_column = columns[new_column_index]

    //A little hack to stop ourselves from sending this update a hundred times per second
    // @todo ...
    // @ts-ignore
    if (this.recently_sent_column_change) {
      if (
        // @ts-ignore
        this.recently_sent_column_change.column === new_column &&
        // @ts-ignore
        Date.now() - this.recently_sent_column_change.lastCall <= 500
      ) {
        // @ts-ignore
        this.recently_sent_column_change.lastCall = Date.now()
        return
      }
    }

    // @ts-ignore
    this.recently_sent_column_change = {
      column: new_column,
      lastCall: Date.now()
    }

    this.lockChild(id, true, 'nodeweek')
    this.context.micro_update(ActionCreator.columnChangeNode(id, new_column))
    columnChanged(this.context, id, new_column) // @todo again dragaction needs to be designed and is not on renderer (context) any more
  }

  sortableMovedFunction(id, new_position, type, new_parent, child_id) {
    //Correction for if we are in a term
    if (this.props.nodes_by_column) {
      for (const col in this.props.nodes_by_column) {
        if (this.props.nodes_by_column[col].indexOf(id) >= 0) {
          const previous = this.props.nodes_by_column[col][new_position]
          new_position = this.props.data.nodeweek_set.indexOf(previous)
        }
      }
    }

    this.context.micro_update(
      ActionCreator.moveNodeWeek(id, new_position, new_parent, child_id)
    )
    insertedAt(
      // @ts-ignore missing dragaction issued
      this.props.renderer, // @todo again dragaction needs to be designed and is not on renderer (context) any more
      child_id,
      'node',
      new_parent,
      'week',
      new_position,
      'nodeweek'
    )
  }

  makeDroppable() {
    const props = this.props
    $(this.mainDiv?.current).droppable({
      tolerance: 'pointer',
      // @ts-ignore
      droppable: '.strategy-ghost',
      over: (e, ui) => {
        const drop_item = $(e.target)
        const drag_item = ui.draggable
        const drag_helper = ui.helper

        if (drag_item.hasClass('new-strategy')) {
          drag_helper.addClass('valid-drop')
          drop_item.addClass('new-strategy-drop-over')
        } else {
          return
        }
      },
      out: (e, ui) => {
        const drag_item = ui.draggable
        const drag_helper = ui.helper
        const drop_item = $(e.target)
        if (drag_item.hasClass('new-strategy')) {
          drag_helper.removeClass('valid-drop')
          drop_item.removeClass('new-strategy-drop-over')
        }
      },
      drop: (e, ui) => {
        $('.new-strategy-drop-over').removeClass('new-strategy-drop-over')
        const drop_item = $(e.target)
        const drag_item = ui.draggable
        const new_index = drop_item.parent().prevAll().length + 1
        if (drag_item.hasClass('new-strategy')) {
          const loader = new UtilityLoader('body')
          addStrategyQuery(
            this.props.parentID,
            new_index,
            // @ts-ignore
            drag_item[0].dataDraggable.strategy,
            (response_data) => {
              loader.endLoad()
            }
          )
        }
      }
    })
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  Nodes = () => {
    if (!this.props.data.nodeweek_set.length) {
      return (
        <div className="node-week placeholder" style={{ height: '100%' }}>
          Drag and drop nodes from the sidebar to add.
        </div>
      )
    }
    return this.props.data.nodeweek_set.map((nodeweek) => (
      <NodeWeek
        key={nodeweek}
        objectID={nodeweek}
        parentID={this.props.data.id}
        // renderer={this.props.renderer}
        column_order={this.props.column_order}
      />
    ))
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const selection_manager = this.context.selection_manager
    // const css_class = 'week'

    const cssClasses = [
      'week',
      data.is_strategy ? 'strategy' : '',
      data.lock ? 'locked locked-' + data.lock.user_id : '',
      data.is_dropped ? ' dropped' : ''
    ].join(' ')
    // if (data.is_strategy) css_class += ' strategy'
    // if (data.lock) css_class += ' locked locked-' + data.lock.user_id
    // if (data.is_dropped) css_class += ' dropped'

    const default_text = !this.context.is_strategy
      ? data.week_type_display + ' ' + (this.props.rank + 1)
      : undefined
    const dropIcon = data.is_dropped ? 'droptriangleup' : 'droptriangledown'

    const style: React.CSSProperties = {
      border: data.lock ? '2px solid ' + data.lock.user_colour : undefined
    }

    const mouseoverActions = []
    if (!this.context.read_only && !this.context.is_strategy) {
      mouseoverActions.push(this.addInsertSibling(data))
      mouseoverActions.push(this.addDuplicateSelf(data))
      mouseoverActions.push(this.addDeleteSelf(data))
    }
    if (this.context.view_comments) {
      mouseoverActions.push(this.addCommenting())
    }

    this.addEditable(data)
    console.log('this.addEditable(data)')
    console.log(data)

    return (
      <div
        style={style}
        className={cssClasses}
        ref={this.mainDiv}
        onClick={(evt) => selection_manager.changeSelection(evt, this)}
      >
        <div className="mouseover-container-bypass">
          <div className="mouseover-actions">{mouseoverActions}</div>
        </div>
        <TitleText text={data.title} defaultText={default_text} />
        <div
          className="node-block"
          id={this.props.objectID + '-node-block'}
          ref={this.node_block}
        >
          <this.Nodes />
        </div>
        <div
          className="week-drop-row hover-shade"
          onClick={this.toggleDrop.bind(this)}
        >
          <div className="node-drop-side node-drop-left" />
          <div className="node-drop-middle">
            <img src={COURSEFLOW_APP.config.icon_path + dropIcon + '.svg'} />
          </div>
          <div className="node-drop-side node-drop-right" />
        </div>
        {/* // @ts-ignore */}
        {
          // @ts-ignore
          // this.addEditable(data)
        }
        {/*// @todo verify this*/}
        {data.strategy_classification > 0 && (
          <div className="strategy-tab">
            <div className="strategy-tab-triangle" />
            <div className="strategy-tab-square">
              <div className="strategy-tab-circle">
                <img
                  title={
                    this.context.strategy_classification_choices.find(
                      (obj) => obj.type === data.strategy_classification
                    ).name
                  }
                  src={
                    COURSEFLOW_APP.config.icon_path +
                    Constants.strategy_keys[data.strategy_classification] +
                    '.svg'
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
}
const mapWeekStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  return getWeekByID(state, ownProps.objectID)
}

const Week = connect<ConnectedProps, object, OwnProps, AppState>(
  mapWeekStateToProps,
  null
)(WeekUnconnected)

export default Week
export { WeekUnconnected }
