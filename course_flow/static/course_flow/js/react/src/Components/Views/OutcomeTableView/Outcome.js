import * as React from 'react'
import { connect } from 'react-redux'
import { OutcomeTitle } from '@cfUIComponents'
import { Component } from '@cfParentComponents'
import { updateOutcomenodeDegree } from '@XMLHTTP/PostFunctions'
import { getOutcomeByID } from '@cfFindState'

/**
 *
 */
class TableCell extends React.Component {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  toggleFunction() {
    let props = this.props
    let value
    if (props.degree) value = 0
    else value = 1
    props.renderer.tiny_loader.startLoad()
    updateOutcomenodeDegree(
      props.nodeID,
      props.outcomeID,
      value,
      (response_data) => {
        props.renderer.tiny_loader.endLoad()
      }
    )
  }

  changeFunction(evt) {
    let props = this.props
    let value = evt.target.value
    props.renderer.tiny_loader.startLoad()
    updateOutcomenodeDegree(
      props.nodeID,
      props.outcomeID,
      value,
      (response_data) => {
        props.renderer.tiny_loader.endLoad()
        $(':focus').blur()
      }
    )
  }

  getContents(completion_status, self_completion) {
    let contents = []
    let divclass = ''

    if (completion_status === 0) {
      return <img src={COURSEFLOW_APP.config.icon_path + 'nocheck.svg'} />
    } else if (!completion_status) {
      return ''
    }
    if (this.props.outcomes_type === 0 || completion_status & 1) {
      if (self_completion)
        return (
          <img
            className="self-completed"
            src={COURSEFLOW_APP.config.icon_path + 'solid_check.svg'}
          />
        )
      else return <img src={COURSEFLOW_APP.config.icon_path + 'check.svg'} />
    }

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
    let degree = this.props.degree
    let class_name = 'table-cell'
    let input

    if (this.props.total) class_name += ' total-cell'
    if (this.props.grand_total) class_name += ' grand-total-cell'

    let checked = false
    if (degree) checked = true

    if (!this.props.renderer.read_only && !this.props.total) {
      if (this.props.outcomes_type === 0) {
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
    let data = this.props.data
    let is_dropped = this.getIsDropped()
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
        nwindow.gettext(
          'descendant',
          'descendants',
          data.child_outcome_links.length
        )

    let comments

    let style

    let outcome_head = (
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
            <div className="comment-indicator-container"></div>
          </div>
        </div>
      </div>
    )

    let outcome_row = this.props.outcome_tree.outcomenodes.map(
      (outcomenodegroup) => {
        let group_row = outcomenodegroup.map((outcomenode) => (
          <TableCell
            outcomes_type={this.props.outcomes_type}
            renderer={this.props.renderer}
            nodeID={outcomenode.node_id}
            degree={outcomenode.degree}
            outcomeID={this.props.outcome_tree.id}
          />
        ))
        group_row.unshift(
          <TableCell
            outcomes_type={this.props.outcomes_type}
            renderer={this.props.renderer}
            total={true}
            degree={outcomenodegroup.total}
          />
        )
        return (
          <div className="table-group">
            <div className="table-cell blank-cell"></div>
            {group_row}
          </div>
        )
      }
    )
    outcome_row.push(<div className="table-cell blank-cell"></div>)
    outcome_row.push(
      <TableCell
        outcomes_type={this.props.outcomes_type}
        renderer={this.props.renderer}
        total={true}
        grand_total={true}
        degree={this.props.outcome_tree.outcomenodes.total}
      />
    )
    let full_row = (
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
