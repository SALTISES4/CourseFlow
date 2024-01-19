import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfParentComponents/ComponentWithToggleDrop'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'
import { CfObjectType } from '@cfModule/types/enum'
import * as Constants from '@cfModule/constants'
import { updateOutcomehorizontallinkDegree } from '@XMLHTTP/API/outcome'
import { ActionButton } from '@cfUIComponents'
import SimpleOutcome from '@cfViews/OutcomeEditView/SimpleOutcome'
import {
  getOutcomeHorizontalLinkByID,
  OutcomeHorizontalLinkByIDType
} from '@cfFindState'
import { connect } from 'react-redux'
import * as React from 'react'
import { AppState } from '@cfRedux/type'

type ConnectedProps = OutcomeHorizontalLinkByIDType
type OwnProps = { parentID?: number } & ComponentWithToggleProps
type PropsType = ConnectedProps & OwnProps

/**
 * The link to tagged outcomes. Used when an outcome
 * is tagged with other outcomes from a parent workflow
 */
class OutcomeHorizontalLinkUnconnected extends ComponentWithToggleDrop<PropsType> {
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
        window.gettext('Are you sure you want to delete this ') +
          Constants.get_verbose(
            this.props.data,
            this.objectType
          ).toLowerCase() +
          '?'
      )
    ) {
      COURSEFLOW_APP.tinyLoader.startLoad()
      updateOutcomehorizontallinkDegree(
        data.outcome,
        data.parent_outcome,
        0,
        (response_data) => {
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
      const num_outcomenodes = indicator
        .children('.outcome-node-container')
        .children('.outcome-node:not([style*="display: none"])').length

      indicator
        .children('.outcome-node-indicator-number')
        // @ts-ignore // @todo what is this
        .html(num_outcomenodes)

      if (num_outcomenodes == 0) {
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
    //It's possible we don't actually have this data, if the horizontal link is dead
    if (!data) return null
    return (
      <div
        className={'outcome-node outcome-' + data.id}
        id={data.id}
        ref={this.mainDiv}
      >
        {!this.context.read_only && (
          <div>
            <this.DeleteSelf data={data} />{' '}
          </div>
        )}

        <SimpleOutcome
          // renderer={this.context}
          checkHidden={this.checkHidden.bind(this)}
          objectID={data.parent_outcome}
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
): OutcomeHorizontalLinkByIDType => {
  return getOutcomeHorizontalLinkByID(state, ownProps.objectID)
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
