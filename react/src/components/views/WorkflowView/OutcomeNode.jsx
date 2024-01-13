import * as React from 'react'
import { connect } from 'react-redux'
import { Component } from '@cfParentComponents'
import ActionButton from '@cfUIComponents/ActionButton'
import { getOutcomeNodeByID } from '@cfFindState'
import { updateOutcomenodeDegree } from '@XMLHTTP/PostFunctions'
import * as Utility from '@cfUtility'
import { SimpleOutcome } from '../OutcomeEditView'
// import $ from 'jquery'

/**
 * The link between nodes and their tagged outcomes,
 * primarily used in the outcome edit view
 */
class OutcomeNodeUnconnected extends Component {
  constructor(props) {
    super(props)
    console.log('props')
    console.log(props)
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
    const icon = 'close.svg'
    return (
      <ActionButton
        buttonIcon={icon}
        buttonClass="delete-self-button"
        titleText={window.gettext('Delete')}
        handleClick={this.deleteSelf.bind(this, data)}
      />
    )
  }

  deleteSelf(data) {
    if (this.props.deleteSelfOverride) this.props.deleteSelfOverride()
    //Temporary confirmation; add better confirmation dialogue later
    else {
      COURSEFLOW_APP.tinyLoader.startLoad()
      updateOutcomenodeDegree(data.node, data.outcome, 0, (response_data) => {
        COURSEFLOW_APP.tinyLoader.endLoad()
      })
    }
  }

  checkHidden() {
    if ($(this.mainDiv.current).children('.outcome').length === 0) {
      $(this.mainDiv.current).css('display', 'none')
    } else {
      $(this.mainDiv.current).css('display', '')
    }

    const indicator = $(this.mainDiv.current).closest('.outcome-node-indicator')

    if (indicator.length >= 0) {
      const num_outcomenodes = indicator
        .children('.outcome-node-container')
        .children('.outcome-node:not([style*="display: none"])').length
      indicator
        .children('.outcome-node-indicator-number')
        .html(num_outcomenodes)
      if (num_outcomenodes === 0) indicator.css('display', 'none')
      else indicator.css('display', '')
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    // @todo component blows up on re-render by losing redux state
    // results in

    if (data?.outcome === -1 || !data?.outcome) return null

    return (
      <div
        className={'outcome-node outcomenode-' + data.id}
        id={data.id}
        ref={this.mainDiv}
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
const mapStateToProps = (state, own_props) =>
  getOutcomeNodeByID(state, own_props.objectID)

const OutcomeNode = connect(mapStateToProps, null)(OutcomeNodeUnconnected)

export default OutcomeNode
