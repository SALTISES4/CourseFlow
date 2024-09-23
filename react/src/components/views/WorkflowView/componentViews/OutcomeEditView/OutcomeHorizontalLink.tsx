import * as Constants from '@cf/constants'
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import ActionButton from '@cfComponents/UIPrimitives/ActionButton'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfEditableComponents/ComponentWithToggleDrop'
import {
  TOutcomeHorizontalLinkByID,
  getOutcomeHorizontalLinkByID
} from '@cfFindState'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import SimpleOutcome from '@cfViews/WorkflowView/componentViews/OutcomeEditView/SimpleOutcome'
import { updateOutcomehorizontallinkDegree } from '@XMLHTTP/API/update'
import * as React from 'react'
import { connect } from 'react-redux'

type ConnectedProps = {
  workflow: TWorkflow
  outcomeHorizontalLink: TOutcomeHorizontalLinkByID
}
type OwnProps = { parentID?: number } & ComponentWithToggleProps
type PropsType = ConnectedProps & OwnProps

/**
 * The link to tagged outcomes. Used when an outcome
 * is tagged with other outcomes from a parent workflow
 */
class OutcomeHorizontalLinkUnconnected extends ComponentWithToggleDrop<PropsType> {
  static contextType = WorkFlowConfigContext

  declare context: React.ContextType<typeof WorkFlowConfigContext>

  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.OUTCOMEHORIZONTALLINK
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
    //Temporary confirmation; add better confirmation dialogue later
    if (
      window.confirm(
        _t('Are you sure you want to delete this ') +
          Constants.getVerbose(this.props.data, this.objectType).toLowerCase() +
          '?'
      )
    ) {
      COURSEFLOW_APP.tinyLoader.startLoad()
      updateOutcomehorizontallinkDegree(
        data.outcome,
        data.parentOutcome,
        0,
        (responseData) => {
          COURSEFLOW_APP.tinyLoader.endLoad()
        }
      )
    }
  }

  /**
   * @todo what is this doing?
   */
  checkHidden() {
    const display =
      $(this.mainDiv.current).children('.outcome').length == 0 ? 'none' : ''
    $(this.mainDiv.current).css('display', display)

    const indicator = $(this.mainDiv.current).closest('.outcome-node-indicator')

    if (indicator.length >= 0) {
      const numOutcomenodes = indicator
        .children('.outcome-node-container')
        .children('.outcome-node:not([style*="display: none"])').length

      indicator
        .children('.outcome-node-indicator-number')
        // @ts-ignore // @todo what is this
        .html(numOutcomenodes)

      if (numOutcomenodes == 0) {
        indicator.css('display', 'none')
      } else {
        indicator.css('display', '')
      }
    }
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/

  /**
   * Adds a button that deletes the item (with a confirmation). The callback function is called after the object is removed from the DOM
   * @param data
   * @returns {JSX.Element}
   */
  DeleteSelf = ({ data }) => {
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
    const data = this.props.outcomeHorizontalLink.data
    //It's possible we don't actually have this data, if the horizontal link is dead
    if (!data) return null
    return (
      <div
        className={'outcome-node outcome-' + data.id}
        id={data.id}
        ref={this.mainDiv}
      >
        {this.props.workflow.workflowPermission.write && (
          <div>
            <this.DeleteSelf data={data} />{' '}
          </div>
        )}

        <SimpleOutcome
          // renderer={this.context}
          checkHidden={this.checkHidden.bind(this)}
          objectId={data.parentOutcome}
          parentID={this.props.parentID}
          throughParentID={data.id}
        />
      </div>
    )
  }
}

const mapOutcomeHorizontalLinkStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  return {
    outcomeHorizontalLink: getOutcomeHorizontalLinkByID(
      state,
      ownProps.objectId
    ),
    workflow: state.workflow
  }
}

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const OutcomeHorizontalLink = connect<
  ConnectedProps,
  object,
  OwnProps,
  AppState
>(
  mapOutcomeHorizontalLinkStateToProps,
  null
)(OutcomeHorizontalLinkUnconnected)

export default OutcomeHorizontalLink
