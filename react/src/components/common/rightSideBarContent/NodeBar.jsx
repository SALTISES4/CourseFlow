import * as React from 'react'
import { connect } from 'react-redux'
import * as Constants from '@cfConstants'
import ComponentWithToggleDrop from '@cfParentComponents/ComponentWithToggleDrop.tsx'
import {
  getColumnWorkflowByID,
  getColumnByID,
  getStrategyByID
} from '@cfFindState'

/**
 * The component for the right sidebar's tab in which
 * nodes and strategies can be dragged and added into the workflow
 */
class NodeBarUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'workflow'
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    var nodebarcolumnworkflows = data.columnworkflow_set.map(
      (columnworkflow, index) => (
        <NodeBarColumnWorkflow
          key={`NodeBarColumnWorkflow-${index}`}
          renderer={this.props.renderer}
          objectID={columnworkflow}
        />
      )
    )
    var columns_present = this.props.columns.map((col) => col.column_type)
    for (var i = 0; i < data.DEFAULT_COLUMNS.length; i++) {
      if (columns_present.indexOf(data.DEFAULT_COLUMNS[i]) < 0) {
        nodebarcolumnworkflows.push(
          <NodeBarColumnWorkflow
            key={`NodeBarColumnWorkflow-${i}`}
            renderer={this.props.renderer}
            columnType={data.DEFAULT_COLUMNS[i]}
          />
        )
      }
    }
    nodebarcolumnworkflows.push(
      <NodeBarColumnWorkflow
        key={`NodeBarColumnWorkflow-last-${i}`}
        renderer={this.props.renderer}
        columnType={data.DEFAULT_CUSTOM_COLUMN}
      />
    )

    let nodebar_nodes
    if (!this.props.renderer.read_only)
      nodebar_nodes = [
        <h4>{window.gettext('Nodes')}</h4>,
        <div className="node-bar-column-block">{nodebarcolumnworkflows}</div>
      ]

    var strategies = this.props.available_strategies.map((strategy) => (
      <Strategy key={strategy.id} objectID={strategy.id} data={strategy} />
    ))
    var saltise_strategies = this.props.saltise_strategies.map((strategy) => (
      <Strategy key={strategy.id} objectID={strategy.id} data={strategy} />
    ))

    return (
      <div id="node-bar-workflow" className="right-panel-inner">
        <h3 className="drag-and-drop">{window.gettext('Add to workflow')}</h3>
        <hr />
        {nodebar_nodes}
        <hr />
        <h4>{window.gettext('My strategies')}</h4>
        <div className="strategy-bar-strategy-block">{strategies}</div>
        {saltise_strategies.length > 0 && [
          <h4>{window.gettext('SALTISE strategies')}</h4>,
          <div className="strategy-bar-strategy-block">
            {saltise_strategies}
          </div>
        ]}
      </div>
    )
  }
}
const mapNodeBarStateToProps = (state) => ({
  data: state.workflow,
  columns: state.column,
  available_strategies: state.strategy,
  saltise_strategies: state.saltise_strategy
})
export default connect(mapNodeBarStateToProps, null)(NodeBarUnconnected)

/**
 * More or less a dummy container which renders
 * the column into itself.
 * We can also have this be a "column creator" which
 * instead CREATES a default column which is currently missing
 */
class NodeBarColumnWorkflowUnconnected extends React.Component {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    if (data)
      return (
        <div className="node-bar-column-workflow" ref={this.maindiv}>
          <NodeBarColumn
            objectID={data.column}
            renderer={this.props.renderer}
            throughParentID={data.id}
            parentID={this.props.parentID}
          />
        </div>
      )
    else
      return (
        <div className="node-bar-column-workflow" ref={this.maindiv}>
          <NodeBarColumnCreator
            renderer={this.props.renderer}
            columnType={this.props.columnType}
          />
        </div>
      )
  }
}
const mapColumnWorkflowStateToProps = (state, own_props) =>
  getColumnWorkflowByID(state, own_props.objectID)
const NodeBarColumnWorkflow = connect(
  mapColumnWorkflowStateToProps,
  null
)(NodeBarColumnWorkflowUnconnected)

/**
 * Can be dragged and dropped into the workflow space to create
 * a node of the corresponding column. The actual dropping functionality
 * is handled in the Week component, not here.
 */
class NodeBarColumnUnconnected extends ComponentWithToggleDrop {
  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.makeDraggable()
    $(this.maindiv.current)[0].dataDraggable = {
      column: this.props.data.id,
      column_type: null
    }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  makeDraggable() {
    const draggable_selector = 'node-week'
    const draggable_type = 'nodeweek'
    $(this.maindiv?.current).draggable({
      helper: (e, item) => {
        var helper = $(document.createElement('div'))
        helper.addClass('node-ghost')
        helper.appendTo(document.body)
        return helper
      },
      cursor: 'move',
      cursorAt: { top: 20, left: 100 },
      distance: 10,
      start: (e, ui) => {
        $('.workflow-canvas').addClass('dragging-' + draggable_type)
        $(draggable_selector).addClass('dragging')
      },
      stop: (e, ui) => {
        $('.workflow-canvas').removeClass('dragging-' + draggable_type)
        $(draggable_selector).removeClass('dragging')
      }
    })
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    var title
    if (data) title = data.title
    if (!title) title = data.column_type_display
    return (
      <div
        dangerouslySetInnerHTML={{ __html: title }}
        className={
          'new-node node-bar-column node-bar-sortable column-' +
          this.props.objectID
        }
        ref={this.maindiv}
        style={{ backgroundColor: Constants.getColumnColour(data) }}
      ></div>
    )
  }
}
const mapColumnStateToProps = (state, own_props) =>
  getColumnByID(state, own_props.objectID)
const NodeBarColumn = connect(
  mapColumnStateToProps,
  null
)(NodeBarColumnUnconnected)

/**
 * As the NodeBarColumn component, but creates a new column.
 */
export class NodeBarColumnCreator extends NodeBarColumnUnconnected {
  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.makeDraggable()
    $(this.maindiv.current)[0].dataDraggable = {
      column: null,
      column_type: this.props.columnType
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    var title = 'New '
    for (var i = 0; i < this.props.renderer.column_choices.length; i++) {
      if (this.props.renderer.column_choices[i].type == this.props.columnType) {
        title += this.props.renderer.column_choices[i].name
        break
      }
    }
    return (
      <div
        className="new-node new-column node-bar-column node-bar-sortable"
        ref={this.maindiv}
      >
        {title}
      </div>
    )
  }
}

/**
 * Represents a strategy (SALTISE) or node group (user generated)
 * in the sidebar, to be dragged in and dropped. The actual dropping functionality
 * is handled in the Week component, not here.
 */
class StrategyUnconnected extends ComponentWithToggleDrop {
  constructor(props) {
    super(props)
    this.objectType = 'strategy'
    this.objectClass = '.strategy'
    this.node_block = React.createRef()
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.makeDraggable()
    $(this.maindiv.current)[0].dataDraggable = { strategy: this.props.data.id }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  makeDraggable() {
    const draggable_selector = 'week-workflow'
    const draggable_type = 'weekworkflow'
    $(this.maindiv?.current).draggable({
      helper: (e, item) => {
        var helper = $(document.createElement('div'))
        helper.addClass('week-ghost')
        helper.appendTo(document.body)
        return helper
      },
      cursor: 'move',
      cursorAt: { top: 20, left: 100 },
      distance: 10,
      start: (e, ui) => {
        $('.workflow-canvas').addClass('dragging-' + draggable_type)
        $(draggable_selector).addClass('dragging')
      },
      stop: (e, ui) => {
        $('.workflow-canvas').removeClass('dragging-' + draggable_type)
        $(draggable_selector).removeClass('dragging')
      }
    })
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    var title
    if (data) title = data.title
    if (!title) title = 'untitled strategy'
    let strategy_icon
    if (data.strategy_icon)
      strategy_icon = (
        <img
          src={
            COURSEFLOW_APP.config.icon_path +
            Constants.strategy_keys[data.strategy_icon] +
            '.svg'
          }
        />
      )
    return (
      <div
        className="strategy-bar-strategy strategy new-strategy"
        ref={this.maindiv}
      >
        {strategy_icon}
        <div>{title}</div>
      </div>
    )
  }
}
const mapStrategyStateToProps = (state, own_props) =>
  getStrategyByID(state, own_props.objectID)
const Strategy = connect(mapStrategyStateToProps, null)(StrategyUnconnected)
