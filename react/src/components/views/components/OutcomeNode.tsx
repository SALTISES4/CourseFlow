import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import ActionButton from '@cfComponents/UIPrimitives/ActionButton'
import CompletionImg from '@cfComponents/UIPrimitives/CompletionIng'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfEditableComponents/ComponentWithToggleDrop'
import { TOutcomeNodeByID, getOutcomeNodeByID } from '@cfFindState'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import SimpleOutcome from '@cfViews/WorkflowView/componentViews/OutcomeEditView/SimpleOutcome'
import { updateOutcomenodeDegree } from '@XMLHTTP/API/update'
import * as React from 'react'
import { connect } from 'react-redux'
// import $ from 'jquery'

type ConnectedProps = {
  outcomeNode: TOutcomeNodeByID
  workflow: TWorkflow
}

type OwnProps = {
  parentID?: number // is this required:
  outcomesType?: any
  deleteSelfOverride?: any
} & ComponentWithToggleProps
type PropsType = ConnectedProps & OwnProps

/**
 * The link between nodes and their tagged outcomes,
 * primarily used in the outcome edit view
 *
 * renderer.readOnly
 *
 */
class OutcomeNodeUnconnected extends ComponentWithToggleDrop<PropsType> {
  static contextType = WorkFlowConfigContext
  declare context: React.ContextType<typeof WorkFlowConfigContext>

  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.OUTCOMENODE
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

  deleteSelf(data) {
    if (this.props.deleteSelfOverride) this.props.deleteSelfOverride()
    //Temporary confirmation; add better confirmation dialogue later
    else {
      COURSEFLOW_APP.tinyLoader.startLoad()
      updateOutcomenodeDegree(data.node, data.outcome, 0, (responseData) => {
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
      const numOutcomenodes = indicator
        .children('.outcome-node-container')
        .children('.outcome-node:not([style*="display: none"])').length

      indicator
        .children('.outcome-node-indicator-number')
        .html(String(numOutcomenodes))

      if (numOutcomenodes === 0) {
        indicator.css('display', 'none')
      } else indicator.css('display', '')
    }
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/

  /**
   * Adds a button that deletes the item (with a confirmation). The callback function is called after the object is removed from the DOM
   */
  AddDeleteSelf = ({ data }: { data: any }) => {
    const icon = 'close.svg'
    return (
      <ActionButton
        buttonIcon={icon}
        buttonClass="delete-self-button"
        titleText={_t('Delete')}
        handleClick={this.deleteSelf.bind(this, data)}
      />
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.outcomeNode.data

    // @todo component blows up on re-render by losing redux state
    // results in

    if (data?.outcome === -1 || !data?.outcome) return null

    return (
      <div
        className={'outcome-node outcomenode-' + data.id}
        id={data.id}
        ref={this.mainDiv}
      >
        {this.props.workflow.workflowPermissions.write && (
          <div>
            <this.AddDeleteSelf data={data} />
          </div>
        )}

        <CompletionImg
          completionStatus={data.degree}
          outcomesType={this.props.outcomesType}
        />

        <SimpleOutcome
          checkHidden={this.checkHidden.bind(this)}
          comments={true}
          edit={true}
          objectId={data.outcome}
          parentID={this.props.parentID}
          throughParentID={data.id}
        />
      </div>
    )
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  return {
    outcomeNode: getOutcomeNodeByID(state, ownProps.objectId),
    workflow: state.workflow
  }
}

const OutcomeNode = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(OutcomeNodeUnconnected)

export default OutcomeNode
