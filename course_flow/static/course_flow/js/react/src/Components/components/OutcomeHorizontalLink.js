import * as React from 'react'
import * as reactDom from 'react-dom'
import { Provider, connect } from 'react-redux'
import {
  getNodeByID,
  getOutcomeByID,
  getOutcomeWorkflowByID
} from '../../FindState.js'
import { updateOutcomehorizontallinkDegree } from '../../PostFunctions.js'

export class TableHorizontalOutcomeLinkUnconnected extends React.Component {
  render() {
    let data = this.props.data
    let outcomenode = this.props.outcomenode

    let completion_status = null
    if (outcomenode !== null && data !== null)
      completion_status = outcomenode.degree
    else if (this.props.descendant_completion_status[this.props.outcomeID])
      completion_status = 0
    let checked = false
    if (data) checked = true

    let input
    if (!this.props.renderer.read_only && outcomenode !== null) {
      input = (
        <input
          type="checkbox"
          onChange={this.toggleFunction.bind(this)}
          checked={checked}
        />
      )
    }

    let class_name = 'table-cell'
    if (outcomenode === null) class_name += ' disabled'
    if (this.props.index > 0) class_name += ' not-first-child-outcome'
    return (
      <div className={class_name} ref={this.maindiv}>
        {this.getContents(completion_status, completion_status)}
        {input}
      </div>
    )
  }

  toggleFunction() {
    let props = this.props
    let value
    if (props.data) value = 0
    else value = 1
    props.renderer.tiny_loader.startLoad()
    updateOutcomehorizontallinkDegree(
      props.outcomeID,
      props.parent_outcomeID,
      value,
      (response_data) => {
        props.renderer.tiny_loader.endLoad()
      }
    )
  }

  componentDidUpdate(prevProps) {
    if (!this.props.updateParentCompletion) return
    if (prevProps.data && this.props.data) {
      if (prevProps.data.degree != this.props.data.degree)
        this.props.updateParentCompletion(
          this.props.outcomeID,
          this.props.parent_outcomeID,
          this.props.data.degree
        )
    } else if (!prevProps.data && this.props.data) {
      this.props.updateParentCompletion(
        this.props.outcomeID,
        this.props.parent_outcomeID,
        this.props.data.degree
      )
    } else if (prevProps.data && !this.props.data) {
      this.props.updateParentCompletion(
        this.props.outcomeID,
        this.props.parent_outcomeID,
        0
      )
    }
  }

  componentDidMount() {
    let value = null
    if (this.props.data) value = this.props.data.degree
    if (this.props.updateParentCompletion && value)
      this.props.updateParentCompletion(
        this.props.outcomeID,
        this.props.parent_outcomeID,
        value
      )
  }

  getContents(completion_status, self_completion) {
    if (completion_status === 0) {
      return <img src={config.icon_path + 'nocheck.svg'} />
    } else if (!completion_status) {
      return ''
    }
    if (this.props.outcomes_type == 0 || completion_status & 1) {
      if (self_completion)
        return (
          <img
            className="self-completed"
            src={config.icon_path + 'solid_check.svg'}
          />
        )
      else return <img src={config.icon_path + 'check.svg'} />
    }
    let contents = []
    if (completion_status & 2) {
      let divclass = ''
      if (self_completion & 2) divclass = ' self-completed'
      contents.push(
        <div className={'outcome-introduced outcome-degree' + divclass}>I</div>
      )
    }
    if (completion_status & 4) {
      let divclass = ''
      if (self_completion & 4) divclass = ' self-completed'
      contents.push(
        <div className={'outcome-developed outcome-degree' + divclass}>D</div>
      )
    }
    if (completion_status & 8) {
      let divclass = ''
      if (self_completion & 8) divclass = ' self-completed'
      contents.push(
        <div className={'outcome-advanced outcome-degree' + divclass}>A</div>
      )
    }
    return contents
  }
}
const mapTableHorizontalOutcomeLinkStateToProps = (state, own_props) => {
  let outcomenode = null
  for (var i = 0; i < state.outcomenode.length; i++) {
    if (
      state.outcomenode[i].outcome == own_props.parent_outcomeID &&
      state.outcomenode[i].node == own_props.nodeID
    ) {
      outcomenode = state.outcomenode[i]
      break
    }
  }
  let child_outcome = getOutcomeWorkflowByID(state, own_props.outcomeworkflowID)
    .data.outcome
  if (outcomenode == null)
    return { data: null, outcomenode: null, outcomeID: child_outcome }
  for (var i = 0; i < state.outcomehorizontallink.length; i++) {
    if (
      state.outcomehorizontallink[i].outcome == child_outcome &&
      state.outcomehorizontallink[i].parent_outcome ==
        own_props.parent_outcomeID
    )
      return {
        data: state.outcomehorizontallink[i],
        outcomenode: outcomenode,
        outcomeID: child_outcome
      }
  }
  return { data: null, outcomenode: outcomenode, outcomeID: child_outcome }
}
export const TableHorizontalOutcomeLink = connect(
  mapTableHorizontalOutcomeLinkStateToProps,
  null
)(TableHorizontalOutcomeLinkUnconnected)

export class TableChildWorkflowViewUnconnected extends React.Component {
  render() {
    if (!this.props.data || this.props.data.outcomeworkflow_set.length == 0) {
      return <div className="table-cell disabled"></div>
    }

    let cells = this.props.data.outcomeworkflow_set.map(
      (outcomeworkflow, index) => (
        <TableHorizontalOutcomeLink
          renderer={this.props.renderer}
          descendant_completion_status={this.props.descendant_completion_status}
          updateParentCompletion={this.props.updateParentCompletion}
          outcomeworkflowID={outcomeworkflow}
          parent_outcomeID={this.props.outcomeID}
          nodeID={this.props.nodeID}
          index={index}
        />
      )
    )

    return cells
  }
}
const mapTableChildWorkflowStateToProps = (state, own_props) => {
  let node = getNodeByID(state, own_props.nodeID).data
  let linked_workflow = node.linked_workflow
  if (linked_workflow)
    for (var i = 0; i < state.child_workflow.length; i++) {
      if (linked_workflow == state.child_workflow[i].id) {
        return { data: state.child_workflow[i], node_data: node }
      }
    }
  return { node_data: node }
}
export const TableChildWorkflowView = connect(
  mapTableChildWorkflowStateToProps,
  null
)(TableChildWorkflowViewUnconnected)

class TableChildWorkflowHeaderUnconnected extends React.Component {
  render() {
    let node = this.props.node_data
    let node_title = <NodeTitle data={node} />

    if (!this.props.data || this.props.data.outcomeworkflow_set.length == 0) {
      return (
        <div className="horizontal-table-header">
          <div className="horizontal-table-node">{node_title}</div>
          <div className="table-cell disabled">
            <div className="child-outcome">
              {gettext('No outcomes or linked workflow')}
            </div>
          </div>
        </div>
      )
    }

    let cells = this.props.data.outcomeworkflow_set.map(
      (outcomeworkflow, index) => (
        <TableChildOutcomeHeader
          renderer={this.props.renderer}
          index={index}
          outcomeworkflowID={outcomeworkflow}
        />
      )
    )

    return (
      <div className="horizontal-table-header">
        <div
          className="horizontal-table-node"
          style={{ width: 32 * cells.length + 'px' }}
        >
          {node_title}
        </div>
        {cells}
      </div>
    )
  }
}
export const TableChildWorkflowHeader = connect(
  mapTableChildWorkflowStateToProps,
  null
)(TableChildWorkflowHeaderUnconnected)

class TableChildOutcomeHeaderUnconnected extends React.Component {
  render() {
    let data = this.props.data
    let class_name = 'table-cell nodewrapper'
    if (this.props.index > 0) class_name += ' not-first-child-outcome'
    return (
      <div className={class_name}>
        <div className="child-outcome" title={data.title}>
          {data.title}
        </div>
      </div>
    )
  }
}
const mapTableChildOutcomeHeaderStateToProps = (state, own_props) =>
  getOutcomeByID(
    state,
    getOutcomeWorkflowByID(state, own_props.outcomeworkflowID).data.outcome
  )
export const TableChildOutcomeHeader = connect(
  mapTableChildOutcomeHeaderStateToProps,
  null
)(TableChildOutcomeHeaderUnconnected)
