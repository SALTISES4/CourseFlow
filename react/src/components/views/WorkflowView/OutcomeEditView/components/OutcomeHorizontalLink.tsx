import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import { _t } from '@cf/utility/Utility.class'
import ActionButton from '@cfComponents/UIPrimitives/ActionButton'
import {
  TOutcomeHorizontalLinkByID,
  getOutcomeHorizontalLinkByID
} from '@cfFindState'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import { updateOutcomehorizontallinkDegree } from '@XMLHTTP/API/update'
import * as React from 'react'
import { connect } from 'react-redux'

import SimpleOutcome from './SimpleOutcome'

type ConnectedProps = {
  workflow: TWorkflow
  outcomeHorizontalLink: TOutcomeHorizontalLinkByID
}
type OwnProps = {
  parentId?: number
  objectId?: number
}
type PropsType = ConnectedProps & OwnProps

/**
 * The link to tagged outcomes. Used when an outcome
 * is tagged with other outcomes from a parent workflow
 */
class OutcomeHorizontalLinkUnconnected extends React.Component<PropsType> {
  static contextType = WorkflowConfigContext
  declare context: React.ContextType<typeof WorkflowConfigContext>

  objectType: CfObjectType
  mainDiv: React.RefObject<HTMLDivElement>

  constructor(props: PropsType) {
    super(props)
    this.mainDiv = React.createRef()
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
          Constants.getLabelForCfObject({
            objectType: this.objectType
          }).toLowerCase() +
          '?'
      )
    ) {
      updateOutcomehorizontallinkDegree(
        data.outcome,
        data.parentOutcome,
        0,
        (responseData) => {}
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
    return (
      <ActionButton
        buttonIcon={<HighlightOffIcon />}
        buttonClass="delete-self-button"
        titleText={_t('Delete')}
        onClickHandler={this.deleteSelf.bind(this, data)}
      />
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.outcomeHorizontalLink.data
    //It's possible we don't actually have this data, if the horizontal link is dead
    if (!data) {
      return null
    }
    return (
      <div
        className={'outcome-node outcome-' + data.id}
        id={data.id}
        ref={this.mainDiv}
      >
        {this.props.workflow.workflowPermissions.write && (
          <div>
            <this.DeleteSelf data={data} />{' '}
          </div>
        )}

        <SimpleOutcome
          // renderer={this.context}
          checkHidden={this.checkHidden.bind(this)}
          objectId={data.parentOutcome}
          parentId={this.props.parentId}
          throughParentId={data.id}
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
