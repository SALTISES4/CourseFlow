import * as React from 'react'
import { connect } from 'react-redux'
import { Component } from './CommonComponents/Extended'
import { ActionButton } from './CommonComponents'
import {
  getOutcomeNodeByID,
  getOutcomeByID,
  getOutcomeOutcomeByID
} from '../../redux/FindState.js'
import { updateOutcomenodeDegree } from '../../XMLHTTP/PostFunctions.js'
import * as OutcomeNode from './OutcomeNode/outcomeNode.js'
import { SimpleOutcomeView } from '../Views/OutcomeView'

//Basic component representing an outcome to node link
class OutcomeNodeView extends Component {
  constructor(props) {
    super(props)
    this.objectType = 'outcomenode'
  }

  render() {
    let data = this.props.data
    if (data.outcome === -1) return null

    return (
      <div
        className={'outcome-node outcomenode-' + data.id}
        id={data.id}
        ref={this.maindiv}
      >
        {!this.props.renderer.read_only && (
          <div>{this.addDeleteSelf(data, 'close.svg')}</div>
        )}
        {OutcomeNode.getCompletionImg(data.degree, this.props.outcomes_type)}
        <SimpleOutcomeView
          checkHidden={this.checkHidden.bind(this)}
          comments={true}
          edit={true}
          objectID={data.outcome}
          parentID={this.props.parentID}
          throughParentID={data.id}
          renderer={this.props.renderer}
        />
      </div>
    )
  }

  //Adds a button that deletes the item (with a confirmation). The callback function is called after the object is removed from the DOM
  addDeleteSelf(data) {
    let icon = 'close.svg'
    return (
      <ActionButton
        button_icon={icon}
        button_class="delete-self-button"
        titletext={gettext('Delete')}
        handleClick={this.deleteSelf.bind(this, data)}
      />
    )
  }

  deleteSelf(data) {
    let props = this.props
    if (this.props.deleteSelfOverride) this.props.deleteSelfOverride()
    //Temporary confirmation; add better confirmation dialogue later
    else {
      props.renderer.tiny_loader.startLoad()
      updateOutcomenodeDegree(data.node, data.outcome, 0, (response_data) => {
        props.renderer.tiny_loader.endLoad()
      })
    }
  }

  checkHidden() {
    if ($(this.maindiv.current).children('.outcome').length == 0)
      $(this.maindiv.current).css('display', 'none')
    else $(this.maindiv.current).css('display', '')
    let indicator = $(this.maindiv.current).closest('.outcome-node-indicator')
    if (indicator.length >= 0) {
      let num_outcomenodes = indicator
        .children('.outcome-node-container')
        .children('.outcome-node:not([style*="display: none"])').length
      indicator
        .children('.outcome-node-indicator-number')
        .html(num_outcomenodes)
      if (num_outcomenodes == 0) indicator.css('display', 'none')
      else indicator.css('display', '')
    }
  }

  componentDidMount() {
    this.checkHidden()
  }

  componentDidUpdate() {
    this.checkHidden()
  }

  componentWillUnmount() {
    this.checkHidden()
  }
}
const mapOutcomeNodeStateToProps = (state, own_props) =>
  getOutcomeNodeByID(state, own_props.objectID)
export default connect(mapOutcomeNodeStateToProps, null)(OutcomeNodeView)

//Component representing a cell in a totals column
class TableTotalCellUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'outcomenode'
  }

  render() {
    let class_name = 'table-cell total-cell'
    if (this.props.grand_total) class_name += ' grand-total-cell'
    return (
      <div className={class_name} ref={this.maindiv}>
        {this.getContents(this.getCompletionStatus())}
      </div>
    )
  }

  getCompletionStatus() {
    let completion = {}
    let nodes = this.props.nodes
    //If we are not restricted to a nodes list, use all
    if (!nodes) nodes = Object.keys(this.props.descendant_completion_status)
    for (var i = 0; i < nodes.length; i++) {
      let node = nodes[i]
      if (this.props.descendant_completion_status[node]) {
        for (let oc in this.props.descendant_completion_status[node]) {
          completion[oc] |= this.props.descendant_completion_status[node][oc]
        }
      }
    }
    if (!$.isEmptyObject(completion)) {
      return this.checkOutcomeTree(completion, this.props.outcometree)
    }
  }

  checkOutcomeTree(completion, outcometree) {
    let self_completion = completion[outcometree.id]
    let child_completion = 15
    let child_count = 0
    for (var i = 0; i < outcometree.descendants.length; i++) {
      let check_child = this.checkOutcomeTree(
        completion,
        outcometree.descendants[i]
      )
      child_completion &= check_child
      if (check_child !== undefined) child_count++
    }
    if (child_count > 0) self_completion |= child_completion
    return self_completion
  }

  getContents(completion_status, self_completion) {
    if (completion_status === 0) {
      return <img src={window.config.icon_path + 'nocheck.svg'} />
    } else if (!completion_status) {
      return ''
    }
    if (this.props.outcomes_type == 0 || completion_status & 1) {
      if (self_completion)
        return (
          <img
            className="self-completed"
            src={window.config.icon_path + 'solid_check.svg'}
          />
        )
      else return <img src={window.config.icon_path + 'check.svg'} />
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
const getOutcomeDescendants = (state, outcome) => {
  let descendants = []
  for (let i = 0; i < outcome.child_outcome_links.length; i++) {
    let outcomeoutcome = getOutcomeOutcomeByID(
      state,
      outcome.child_outcome_links[i]
    ).data
    let child = getOutcomeByID(state, outcomeoutcome.child).data
    descendants.push(getOutcomeDescendants(state, child))
  }
  return { id: outcome.id, descendants: descendants }
}
const mapTableTotalCellStateToProps = (state, own_props) => ({
  outcometree: getOutcomeDescendants(
    state,
    getOutcomeByID(state, own_props.outcomeID).data
  )
})

export const TableTotalCell = connect(
  mapTableTotalCellStateToProps,
  null
)(TableTotalCellUnconnected)
