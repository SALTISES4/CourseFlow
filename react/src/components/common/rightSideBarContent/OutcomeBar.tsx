// @ts-nocheck
import * as React from 'react'
import { connect } from 'react-redux'
import * as Utility from '@cfUtility'
import OutcomeBarOutcome from './OutcomeBarOutcome'
import {
  getSortedOutcomesFromOutcomeWorkflowSet,
  SortedOutcomesFromOutcomeWorkflowSetType
} from '@cfFindState'
import { ViewType, WorkflowType } from '@cfModule/types/enum'
import { AppState } from '@cfRedux/type'

/**
 * The outcomes tab of the right sidebar (which can be either this
 * component or the ParentOutcomeBar)
 */
type ConnectedProps = {
  data: SortedOutcomesFromOutcomeWorkflowSetType
  workflow_type: WorkflowType
}

type StateProps = ReturnType<typeof mapStateToProps>

type SelfProps = {
  readOnly: boolean
  renderMethod: (container, view_type: ViewType) => void
}

type PropsType = SelfProps & StateProps
class OutcomeBarUnconnected extends React.Component<PropsType, any> {
  private readOnly: boolean
  private renderMethod: (container, view_type: ViewType) => void

  constructor(props: PropsType) {
    super(props)

    this.readOnly = this.props.readOnly
    this.renderMethod = this.props.renderMethod
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  editOutcomesClick() {
    // @todo, manage view change with state update
    this.renderMethod($('#container'), ViewType.OUTCOME_EDIT)
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    const outcomeBarOutcomes = data.map((category) => {
      return (
        <>
          <hr />
          <div>
            <h4>{category.objectset.title}</h4>
            {category.outcomes.map((outcome) => (
              <OutcomeBarOutcome
                key={outcome.id}
                objectID={outcome.id}
                // renderer={this.props.renderer}
                readOnly={this.props.readOnly}
              />
            ))}
          </div>
        </>
      )
    })

    const outcomeBlock = outcomeBarOutcomes.length
      ? outcomeBarOutcomes
      : outcomeBarOutcomes

    const edittext = Utility.capWords(
      window.gettext('Edit') +
        ' ' +
        window.gettext(this.props.workflow_type + ' outcomes')
    )

    return (
      <div id="outcome-bar-workflow" className="right-panel-inner">
        <h3 className="drag-and-drop">{window.gettext('Outcomes')}</h3>
        <div className="outcome-bar-outcome-block">{outcomeBlock}</div>
        {!this.readOnly && (
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

const mapStateToProps = (state: AppState): ConnectedProps => ({
  data: getSortedOutcomesFromOutcomeWorkflowSet(
    state,
    state.workflow.outcomeworkflow_set
  ),
  workflow_type: state.workflow.type
})

const test = connect<
  ConnectedProps,
  NonNullable<unknown>,
  SelfProps,
  AppState
>(
  mapStateToProps,
  null
)(OutcomeBarUnconnected)

export default test
