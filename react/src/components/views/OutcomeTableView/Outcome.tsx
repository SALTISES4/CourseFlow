// @ts-nocheck
import * as React from 'react'
import { connect } from 'react-redux'
import { updateOutcomenodeDegree } from '@XMLHTTP/PostFunctions'
import { getOutcomeByID } from '@cfFindState'
import { OutcomeTitle } from '@cfUIComponents/index.js'
import {Component} from "@cfParentComponents";

type PropsType = {
  outcomesType: number
  total: boolean
  readOnly: boolean
  degree: number
  nodeID?: number
  outcomeID?: number
  grandTotal?: boolean

  // renderer={this.props.renderer}
}

/**
 *
 */
class TableCell extends React.Component<PropsType> {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  toggleFunction() {
    let value
    if (this.props.degree) value = 0
    else value = 1
    COURSEFLOW_APP.tinyLoader.startLoad()
    updateOutcomenodeDegree(
      this.props.nodeID,
      this.props.outcomeID,
      value,
      (response_data) => {
        COURSEFLOW_APP.tinyLoader.endLoad()
      }
    )
  }

  changeFunction(evt) {
    const value = evt.target.value
    COURSEFLOW_APP.tinyLoader.startLoad()
    updateOutcomenodeDegree(
      this.props.nodeID,
      this.props.outcomeID,
      value,
      (response_data) => {
        COURSEFLOW_APP.tinyLoader.endLoad()
        $(':focus').blur()
      }
    )
  }

  getContents(completion_status, self_completion) {
    const contents = []
    let divclass = ''

    if (completion_status === 0) {
      return <img src={COURSEFLOW_APP.config.icon_path + 'nocheck.svg'} />
    } else if (!completion_status) {
      return ''
    }
    if (this.props.outcomesType === 0 || completion_status & 1) {
      if (self_completion)
        return (
          <img
            className="self-completed"
            src={COURSEFLOW_APP.config.icon_path + 'solid_check.svg'}
          />
        )
      else return <img src={COURSEFLOW_APP.config.icon_path + 'check.svg'} />
    }

    // @todo why is bitwise being used here? needs explanation comments
    if (completion_status & 2) {
      if (self_completion & 2) divclass = ' self-completed'
      contents.push(
        <div className={'outcome-introduced outcome-degree' + divclass}>I</div>
      )
    }
    if (completion_status & 4) {
      if (self_completion & 4) divclass = ' self-completed'
      contents.push(
        <div className={'outcome-developed outcome-degree' + divclass}>D</div>
      )
    }
    if (completion_status & 8) {
      if (self_completion & 8) divclass = ' self-completed'
      contents.push(
        <div className={'outcome-advanced outcome-degree' + divclass}>A</div>
      )
    }
    return contents
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const degree = this.props.degree
    let class_name = 'table-cell'
    let input

    if (this.props.total) class_name += ' total-cell'
    if (this.props.grandTotal) class_name += ' grand-total-cell'

    let checked = false
    if (degree) checked = true

    if (!this.props.readOnly && !this.props.total) {
      if (this.props.outcomesType === 0) {
        input = (
          <input
            type="checkbox"
            onChange={this.toggleFunction.bind(this)}
            checked={checked}
          />
        )
      } else {
        input = (
          <select value={degree} onChange={this.changeFunction.bind(this)}>
            <option value={0}>{'-'}</option>
            <option value={1}>{'C'}</option>
            <option value={2}>{'I'}</option>
            <option value={4}>{'D'}</option>
            <option value={8}>{'A'}</option>
            <option value={6}>{'ID'}</option>
            <option value={10}>{'IA'}</option>
            <option value={12}>{'DA'}</option>
            <option value={14}>{'IDA'}</option>
          </select>
        )
      }
    }

    return (
      <div className={class_name} ref={this.maindiv}>
        {this.getContents(degree, !this.props.total)}
        {input}
      </div>
    )
  }
}

/**
 *
 */
export class OutcomeUnconnected extends Component {
  constructor(props) {
    super(props)
    this.objectType = 'outcome'
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getIsDropped() {
    return this.props.data.is_dropped
  }

  getChildOutcomeView(child) {
    return (
      <Outcome
        outcomes_type={this.props.outcomes_type}
        objectID={child.id}
        outcome_tree={child}
        renderer={this.props.renderer}
      />
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const is_dropped = this.getIsDropped()
    let dropIcon
    if (is_dropped) dropIcon = 'droptriangleup'
    else dropIcon = 'droptriangledown'

    let droptext
    if (is_dropped) droptext = window.gettext('hide')
    else
      droptext =
        window.gettext('show ') +
        data.child_outcome_links.length +
        ' ' +
        window.gettext(
          'descendant',
          'descendants',
          data.child_outcome_links.length
        )

    let comments

    let style

    const outcome_head = (
      <div className="outcome-wrapper">
        <div
          className="outcome-head"
          ref={this.maindiv}
          style={{ paddingLeft: data.depth * 12 }}
        >
          <div className="outcome-title" style={style}>
            <OutcomeTitle
              data={this.props.data}
              prefix={this.props.prefix}
              hovertext={this.props.hovertext}
            />
          </div>
          {data.child_outcome_links.length > 0 && (
            <div className="outcome-drop" onClick={this.toggleDrop.bind(this)}>
              <div className="outcome-drop-img">
                <img
                  src={COURSEFLOW_APP.config.icon_path + dropIcon + '.svg'}
                />
              </div>
              <div className="outcome-drop-text">{droptext}</div>
            </div>
          )}
          <div className="mouseover-actions">{comments}</div>
          <div className="side-actions">
            <div className="comment-indicator-container" />
          </div>
        </div>
      </div>
    )

    const outcome_row = this.props.outcome_tree.outcomenodes.map(
      (outcomenodegroup) => {
        const group_row = outcomenodegroup.map((outcomenode) => (
          <TableCell
            outcomesType={this.props.outcomes_type}
            degree={outcomenode.degree}
            readOnly={this.props.read_only}
            nodeID={outcomenode.node_id}
            outcomeID={this.props.outcome_tree.id}
            // renderer={this.props.renderer}
          />
        ))
        group_row.unshift(
          <TableCell
            outcomesType={this.props.outcomes_type}
            readOnly={this.props.read_only}
            total={true}
            degree={outcomenodegroup.total}
            // renderer={this.props.renderer}
          />
        )
        return (
          <div className="table-group">
            <div className="table-cell blank-cell" />
            {group_row}
          </div>
        )
      }
    )
    outcome_row.push(<div className="table-cell blank-cell" />)
    outcome_row.push(
      <TableCell
        outcomesType={this.props.outcomes_type}
        degree={this.props.outcome_tree.outcomenodes.total}
        readOnly={this.props.read_only}
        total={true}
        grandTotal={true}
        // renderer={this.props.renderer}
      />
    )
    const full_row = (
      <div className={'outcome-row depth-' + data.depth}>
        {outcome_head}
        <div className="outcome-cells">{outcome_row}</div>
      </div>
    )

    let child_rows
    if (is_dropped)
      child_rows = this.props.outcome_tree.children.map((child) =>
        this.getChildOutcomeView(child)
      )
    return [full_row, child_rows]
  }
}

const mapOutcomeStateToProps = (state, own_props) =>
  getOutcomeByID(state, own_props.objectID)

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const Outcome = connect(mapOutcomeStateToProps, null)(OutcomeUnconnected)

export default Outcome
