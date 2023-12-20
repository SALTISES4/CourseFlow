import * as React from 'react'
import { connect } from 'react-redux'
import * as Utility from '@cfUtility'
import OutcomeBarOutcome from './OutcomeBarOutcome'
import { getSortedOutcomesFromOutcomeWorkflowSet } from '@cfFindState'

/**
 * The outcomes tab of the right sidebar (which can be either this
 * component or the ParentOutcomeBar)
 */
class OutcomeBarUnconnected extends React.Component {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  editOutcomesClick() {
    this.props.renderer.render($('#container'), 'outcomeedit')
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data
    var outcomebaroutcomes = data.map((category) => [
      <hr />,
      <div>
        <h4>{category.objectset.title}</h4>
        {category.outcomes.map((outcome) => (
          <OutcomeBarOutcome
            key={outcome.id}
            objectID={outcome.id}
            renderer={this.props.renderer}
          />
        ))}
      </div>
    ])

    if (outcomebaroutcomes.length == 0) {
      outcomebaroutcomes = gettext(
        'Add outcomes to this workflow in by clicking the button below.'
      )
    }
    let edittext = Utility.capWords(
      gettext('Edit') + ' ' + gettext(this.props.workflow_type + ' outcomes')
    )
    return (
      <div id="outcome-bar-workflow" className="right-panel-inner">
        <h3 className="drag-and-drop">{gettext('Outcomes')}</h3>
        <div className="outcome-bar-outcome-block">{outcomebaroutcomes}</div>
        {!this.props.renderer.read_only && (
          <button
            className="primary-button"
            id="edit-outcomes-button"
            onClick={this.editOutcomesClick.bind(this)}
          >
            {edittext}
          </button>
        )}
        <hr />
      </div>
    )
  }
}
const mapOutcomeBarStateToProps = (state) => ({
  data: getSortedOutcomesFromOutcomeWorkflowSet(
    state,
    state.workflow.outcomeworkflow_set
  ),
  workflow_type: state.workflow.type
})
export default connect(mapOutcomeBarStateToProps, null)(OutcomeBarUnconnected)
