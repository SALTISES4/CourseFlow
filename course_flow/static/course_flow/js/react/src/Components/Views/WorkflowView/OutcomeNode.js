import * as React from 'react'
import { connect } from 'react-redux'
import { Component, ActionButton } from '@cfCommonComponents'
import {
  getOutcomeNodeByID,
  getOutcomeByID,
  getOutcomeOutcomeByID
} from '@cfFindState'
import { updateOutcomenodeDegree } from '@cfPostFunctions'
import * as Utility from '@cfUtility'
import { SimpleOutcome } from '../OutcomeEditView'

/**
 * The link between nodes and their tagged outcomes,
 * primarily used in the outcome edit view
 */
class OutcomeNodeUnconnected extends Component {
  constructor(props) {
    super(props)
    this.objectType = 'outcomenode'
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.checkHidden()
  }

  componentDidUpdate() {
    this.checkHidden()
  }

  componentWillUnmount() {
    this.checkHidden()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
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

  /*******************************************************
   * RENDER
   *******************************************************/
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
        {Utility.getCompletionImg(data.degree, this.props.outcomes_type)}
        <SimpleOutcome
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
}
const mapOutcomeNodeStateToProps = (state, own_props) =>
  getOutcomeNodeByID(state, own_props.objectID)
const OutcomeNode = connect(
  mapOutcomeNodeStateToProps,
  null
)(OutcomeNodeUnconnected)

export default OutcomeNode
