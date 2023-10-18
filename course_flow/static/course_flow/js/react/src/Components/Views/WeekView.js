import * as React from 'react'
import { Provider, connect } from 'react-redux'
import {
  EditableComponentWithSorting,
  TitleText
} from '../components/CommonComponents.js'
import NodeWeekView from './NodeWeekView.js'
import { NodeWeekComparisonView } from './NodeWeekView.js'
import { getWeekByID, getNodeWeekByID } from '../../FindState.js'
import * as Constants from '../../Constants.js'
import { columnChangeNode, moveNodeWeek } from '../../Reducers.js'
import {
  toggleDrop,
  insertedAt,
  insertedAtInstant,
  columnChanged,
  addStrategy,
  updateValueInstant
} from '../../PostFunctions.js'
import * as Utility from '../../UtilityFunctions.js'

//Basic component to represent a Week
export class WeekViewUnconnected extends EditableComponentWithSorting {
  constructor(props) {
    super(props)
    this.objectType = 'week'
    this.objectClass = '.week'
    this.node_block = React.createRef()
  }

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
        class={css_class}
        ref={this.maindiv}
        onClick={(evt) => selection_manager.changeSelection(evt, this)}
      >
        <div class="mouseover-container-bypass">
          <div class="mouseover-actions">{mouseover_actions}</div>
        </div>
        <TitleText text={data.title} defaultText={default_text} />
        <div
          class="node-block"
          id={this.props.objectID + '-node-block'}
          ref={this.node_block}
        >
          {nodes}
        </div>
        <div
          class="week-drop-row hover-shade"
          onClick={this.toggleDrop.bind(this)}
        >
          <div class="node-drop-side node-drop-left"></div>
          <div class="node-drop-middle">
            <img src={config.icon_path + dropIcon + '.svg'} />
          </div>
          <div class="node-drop-side node-drop-right"></div>
        </div>
        {this.addEditable(data)}
        {data.strategy_classification > 0 && (
          <div class="strategy-tab">
            <div class="strategy-tab-triangle"></div>
            <div class="strategy-tab-square">
              <div class="strategy-tab-circle">
                <img
                  title={
                    renderer.strategy_classification_choices.find(
                      (obj) => obj.type == data.strategy_classification
                    ).name
                  }
                  src={
                    config.icon_path +
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

  getNodes() {
    let nodes = this.props.data.nodeweek_set.map((nodeweek) => (
      <NodeWeekView
        key={nodeweek}
        objectID={nodeweek}
        parentID={this.props.data.id}
        renderer={this.props.renderer}
        column_order={this.props.column_order}
      />
    ))
    if (nodes.length == 0)
      nodes.push(
        <div class="node-week placeholder" style={{ height: '100%' }}>
          Drag and drop nodes from the sidebar to add.
        </div>
      )
    return nodes
  }

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
}
const mapWeekStateToProps = (state, own_props) =>
  getWeekByID(state, own_props.objectID)
export default connect(mapWeekStateToProps, null)(WeekViewUnconnected)

//Basic component to represent a Week
export class WeekComparisonViewUnconnected extends WeekViewUnconnected {
  sortableColumnChangedFunction(id, delta_x, old_column) {
    console.log('column change not sent')
  }

  sortableMovedFunction(id, new_position, type, new_parent, child_id) {
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

  sortableMovedOutFunction(id, new_position, type, new_parent, child_id) {
    if (
      confirm(
        gettext(
          "You've moved a node to another workflow. Nodes lose all tagged outcomes when transferred between workflows. Do you want to continue?"
        )
      )
    ) {
      insertedAt(
        this.props.renderer,
        null,
        'node',
        new_parent,
        'week',
        new_position,
        'nodeweek'
      )
      insertedAtInstant(
        this.props.renderer,
        child_id,
        'node',
        new_parent,
        'week',
        new_position,
        'nodeweek'
      )
    }
  }

  makeDroppable() {}

  getNodes() {
    let nodes = this.props.data.nodeweek_set.map((nodeweek) => (
      <NodeWeekComparisonView
        key={nodeweek}
        objectID={nodeweek}
        parentID={this.props.data.id}
        renderer={this.props.renderer}
        column_order={this.props.column_order}
      />
    ))
    if (nodes.length == 0)
      nodes.push(
        <div class="node-week placeholder" style={{ height: '100%' }}>
          Drag and drop nodes from the sidebar to add.
        </div>
      )
    return nodes
  }

  alignAllWeeks() {
    let rank = this.props.rank + 1
    $('.week-block .week-workflow:nth-child(' + rank + ') .week').css({
      height: ''
    })
    let max_height = 0
    $('.week-block .week-workflow:nth-child(' + rank + ') .week').each(
      function () {
        let this_height = $(this).height()
        if (this_height > max_height) max_height = this_height
      }
    )
    $('.week-block .week-workflow:nth-child(' + rank + ') .week').css({
      height: max_height + 'px'
    })
  }

  componentDidMount() {
    this.makeDragAndDrop()
    this.alignAllWeeks()
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
      '#workflow-' + this.props.workflow_id,
      '.node',
      '.workflow-array'
    )
    this.makeDroppable()
  }

  componentDidUpdate() {
    this.makeDragAndDrop()
    Utility.triggerHandlerEach(
      $(this.maindiv.current).find('.node'),
      'component-updated'
    )
    this.alignAllWeeks()
  }
}
export const WeekComparisonView = connect(
  mapWeekStateToProps,
  null
)(WeekComparisonViewUnconnected)

//Represents a week in the nodebar
export class NodeBarWeekViewUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'week'
    this.objectClass = '.week'
  }

  render() {
    let data = this.props.data
    let renderer = this.props.renderer
    let default_text
    if (!renderer.is_strategy)
      default_text = data.week_type_display + ' ' + (this.props.rank + 1)
    let src = config.icon_path + 'plus.svg'
    if (data.is_dropped) src = config.icon_path + 'minus.svg'
    return (
      <div class="hover-shade" onClick={this.jumpTo.bind(this)}>
        <TitleText text={data.title} defaultText={default_text} />
      </div>
    )
  }

  jumpTo() {
    let week_id = this.props.data.id
    let week = $(".week-workflow[data-child-id='" + week_id + "'] > .week")
    if (week.length > 0) {
      let container = $('#container')

      $('#container').animate(
        {
          scrollTop:
            week.offset().top +
            container[0].scrollTop -
            container.offset().top -
            200
        },
        300
      )
    }
  }
}
export const NodeBarWeekView = connect(
  mapWeekStateToProps,
  null
)(NodeBarWeekViewUnconnected)
