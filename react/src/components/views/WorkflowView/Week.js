import * as React from 'react'
import { connect } from 'react-redux'
import * as Utility from '@cfUtility'
import { getWeekByID } from '@cfFindState'
import * as Constants from '@cfConstants'
import { insertedAt, columnChanged, addStrategy } from '@XMLHTTP/PostFunctions'
import { columnChangeNode, moveNodeWeek } from '@cfReducers'
import { EditableComponentWithSorting } from '@cfParentComponents'
import { TitleText } from '@cfUIComponents'
import NodeWeek from './NodeWeek.js'

/**
 * Renders a standard 'week-style' block of nodes, wherein the
 * nodes appear one above the other, never side by side
 */
class WeekUnconnected extends EditableComponentWithSorting {
  constructor(props) {
    super(props)
    this.objectType = 'week'
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
      $(this.maindiv.current).find('.node'),
      'component-updated'
    )
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getNodes() {
    let nodes = this.props.data.nodeweek_set.map((nodeweek) => (
      <NodeWeek
        key={nodeweek}
        objectID={nodeweek}
        parentID={this.props.data.id}
        renderer={this.props.renderer}
        column_order={this.props.column_order}
      />
    ))
    if (nodes.length == 0)
      nodes.push(
        <div className="node-week placeholder" style={{ height: '100%' }}>
          Drag and drop nodes from the sidebar to add.
        </div>
      )
    return nodes
  }

  makeDragAndDrop() {
    //Makes the nodeweeks in the node block draggable
    this.makeSortableNode(
      $(this.node_block.current).children('.node-week').not('.ui-draggable'),
      this.props.objectID,
      'nodeweek',
      '.node-week',
      false,
      [200, 1],
      null,
      '.node',
      '.week-block'
    )
    this.makeDroppable()
  }

  sortableColumnChangedFunction(id, delta_x, old_column) {
    let columns = this.props.column_order
    let old_column_index = columns.indexOf(old_column)
    let new_column_index = old_column_index + delta_x
    if (new_column_index < 0 || new_column_index >= columns.length) return
    let new_column = columns[new_column_index]

    //A little hack to stop ourselves from sending this update a hundred times per second
    if (this.recently_sent_column_change) {
      if (
        this.recently_sent_column_change.column == new_column &&
        Date.now() - this.recently_sent_column_change.lastCall <= 500
      ) {
        this.recently_sent_column_change.lastCall = Date.now()
        return
      }
    }
    this.recently_sent_column_change = {
      column: new_column,
      lastCall: Date.now()
    }
    this.lockChild(id, true, 'nodeweek')
    this.props.renderer.micro_update(columnChangeNode(id, new_column))
    columnChanged(this.props.renderer, id, new_column)
  }

  sortableMovedFunction(id, new_position, type, new_parent, child_id) {
    //Correction for if we are in a term
    if (this.props.nodes_by_column) {
      for (var col in this.props.nodes_by_column) {
        if (this.props.nodes_by_column[col].indexOf(id) >= 0) {
          let previous = this.props.nodes_by_column[col][new_position]
          new_position = this.props.data.nodeweek_set.indexOf(previous)
        }
      }
    }

    this.props.renderer.micro_update(
      moveNodeWeek(id, new_position, new_parent, child_id)
    )
    insertedAt(
      this.props.renderer,
      child_id,
      'node',
      new_parent,
      'week',
      new_position,
      'nodeweek'
    )
  }

  makeDroppable() {
    var props = this.props
    $(this.maindiv.current).droppable({
      tolerance: 'pointer',
      droppable: '.strategy-ghost',
      over: (e, ui) => {
        var drop_item = $(e.target)
        var drag_item = ui.draggable
        var drag_helper = ui.helper
        var new_index = drop_item.prevAll().length
        var new_parent_id = parseInt(drop_item.parent().attr('id'))

        if (drag_item.hasClass('new-strategy')) {
          drag_helper.addClass('valid-drop')
          drop_item.addClass('new-strategy-drop-over')
        } else {
          return
        }
      },
      out: (e, ui) => {
        var drag_item = ui.draggable
        var drag_helper = ui.helper
        var drop_item = $(e.target)
        if (drag_item.hasClass('new-strategy')) {
          drag_helper.removeClass('valid-drop')
          drop_item.removeClass('new-strategy-drop-over')
        }
      },
      drop: (e, ui) => {
        $('.new-strategy-drop-over').removeClass('new-strategy-drop-over')
        var drop_item = $(e.target)
        var drag_item = ui.draggable
        var new_index = drop_item.parent().prevAll().length + 1
        if (drag_item.hasClass('new-strategy')) {
          let loader = new Utility.Loader('body')
          addStrategy(
            this.props.parentID,
            new_index,
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
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data
    let renderer = this.props.renderer
    let selection_manager = renderer.selection_manager
    var nodes = this.getNodes()
    let css_class = 'week'
    if (data.is_strategy) css_class += ' strategy'
    if (data.lock) css_class += ' locked locked-' + data.lock.user_id
    if (data.is_dropped) css_class += ' dropped'

    let default_text
    if (!renderer.is_strategy)
      default_text = data.week_type_display + ' ' + (this.props.rank + 1)

    let style = {}
    if (data.lock) {
      style.border = '2px solid ' + data.lock.user_colour
    }
    let dropIcon
    if (data.is_dropped) dropIcon = 'droptriangleup'
    else dropIcon = 'droptriangledown'

    let mouseover_actions = []
    if (!this.props.renderer.read_only && !renderer.is_strategy) {
      mouseover_actions.push(this.addInsertSibling(data))
      mouseover_actions.push(this.addDuplicateSelf(data))
      mouseover_actions.push(this.addDeleteSelf(data))
    }
    if (renderer.view_comments) mouseover_actions.push(this.addCommenting(data))

    return (
      <div
        style={style}
        className={css_class}
        ref={this.maindiv}
        onClick={(evt) => selection_manager.changeSelection(evt, this)}
      >
        <div className="mouseover-container-bypass">
          <div className="mouseover-actions">{mouseover_actions}</div>
        </div>
        <TitleText text={data.title} defaultText={default_text} />
        <div
          className="node-block"
          id={this.props.objectID + '-node-block'}
          ref={this.node_block}
        >
          {nodes}
        </div>
        <div
          className="week-drop-row hover-shade"
          onClick={this.toggleDrop.bind(this)}
        >
          <div className="node-drop-side node-drop-left"></div>
          <div className="node-drop-middle">
            <img src={COURSEFLOW_APP.config.icon_path + dropIcon + '.svg'} />
          </div>
          <div className="node-drop-side node-drop-right"></div>
        </div>
        {this.addEditable(data)}
        {data.strategy_classification > 0 && (
          <div className="strategy-tab">
            <div className="strategy-tab-triangle"></div>
            <div className="strategy-tab-square">
              <div className="strategy-tab-circle">
                <img
                  title={
                    renderer.strategy_classification_choices.find(
                      (obj) => obj.type == data.strategy_classification
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
const mapWeekStateToProps = (state, own_props) =>
  getWeekByID(state, own_props.objectID)
const Week = connect(mapWeekStateToProps, null)(WeekUnconnected)

export default Week
export { WeekUnconnected }
