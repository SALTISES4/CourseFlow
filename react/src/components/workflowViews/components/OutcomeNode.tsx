import * as React from 'react'
import { connect } from 'react-redux'
import { getOutcomeNodeByID, TOutcomeNodeByID } from '@cfFindState'
import { updateOutcomenodeDegree } from '@XMLHTTP/API/update'
import { CfObjectType } from '@cfModule/types/enum'
import CompletionImg from '@cfCommonComponents/UIComponents/CompletionImg'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfEditableComponents/ComponentWithToggleDrop'
import { AppState } from '@cfRedux/types/type'
import ActionButton from '@cfCommonComponents/UIComponents/ActionButton'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'
import SimpleOutcome from '@cfViews/WorkflowView/componentViews/OutcomeEditView/SimpleOutcome'
// import $ from 'jquery'

type ConnectedProps = TOutcomeNodeByID

type OwnProps = {
  parentID?: number // is this required:
  outcomes_type?: any
  deleteSelfOverride?: any
} & ComponentWithToggleProps
type PropsType = ConnectedProps & OwnProps

/**
 * The link between nodes and their tagged outcomes,
 * primarily used in the outcome edit view
 *
 * renderer.read_only
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
        .html(String(num_outcomenodes))

      if (num_outcomenodes === 0) {
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
    console.log('AddDeleteSelf OutcomeNode.tsx')
    console.log(data)
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
        {!this.context.permissions.workflowPermission.readOnly && (
          <div>
            <this.AddDeleteSelf data={data} />
          </div>
        )}

        <CompletionImg
          completionStatus={data.degree}
          outcomesType={this.props.outcomes_type}
        />

        <SimpleOutcome
          checkHidden={this.checkHidden.bind(this)}
          comments={true}
          edit={true}
          objectID={data.outcome}
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
): TOutcomeNodeByID => {
  return getOutcomeNodeByID(state, ownProps.objectID)
}

const OutcomeNode = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(OutcomeNodeUnconnected)

export default OutcomeNode
