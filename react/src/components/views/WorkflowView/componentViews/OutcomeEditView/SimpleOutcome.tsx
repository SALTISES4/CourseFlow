import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import {OutcomeTitle} from "@cfComponents/UIPrimitives/Titles.ts";
import EditableComponentWithComments from '@cfEditableComponents/EditableComponentWithComments'
import {
  EditableComponentWithCommentsStateType,
  EditableComponentWithCommentsType
} from '@cfEditableComponents/EditableComponentWithComments'
import { TGetOutcomeByID, getOutcomeByID } from '@cfFindState'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import * as Utility from '@cfUtility'
import * as React from 'react'
import { connect } from 'react-redux'

import SimpleOutcomeOutcome from './SimpleOutcomeOutcome'

/**
 *  Basic component representing an outcome in a node, or somewhere else where it doesn't have to do anything
 */

type ConnectedProps = {
  outcome: TGetOutcomeByID
  workflow: TWorkflow
}
type OwnProps = {
  objectId: number
  parentID: number
  throughParentID?: number
  checkHidden?: () => void
  comments?: boolean
  edit?: boolean
  // throughParentID: number
  // legacyRenderer: EditableComponentWithCommentsType['legacyRenderer'] & {
  //   viewComments: any
  //   selectionManager: any
  // }
} & EditableComponentWithCommentsType

export type SimpleOutcomeUnconnectedPropsType = OwnProps

type StateProps = {
  isDropped: boolean
} & EditableComponentWithCommentsStateType

type PropsType = ConnectedProps & OwnProps

/**
 * A simple outcome block without any action buttons for displaying
 * outcomes tagged to nodes or other outcomes.
 */
export class SimpleOutcomeUnconnected extends EditableComponentWithComments<
  PropsType,
  StateProps
> {
  static contextType = WorkFlowConfigContext
  private children_block: React.RefObject<HTMLDivElement>
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.OUTCOME
    this.children_block = React.createRef()
    this.state = { isDropped: false } as StateProps
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    if (this.props.checkHidden) this.props.checkHidden()
  }

  componentDidUpdate() {
    if (this.props.checkHidden) this.props.checkHidden()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  toggleDrop = (_evt: React.MouseEvent) => {
    this.setState({ isDropped: !this.state.isDropped })
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  ChildType = ({ outcomeoutcome }) => {
    return (
      <SimpleOutcomeOutcome
        key={outcomeoutcome}
        objectId={outcomeoutcome}
        parentID={this.props.data.id}
        // renderer={this.props.renderer}
        comments={this.props.comments}
        edit={this.props.edit}
        //  legacyRenderer={this.props.legacyRenderer}
      />
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    if (Utility.checkSetHidden(data, this.props.objectSets)) return null

    //Child outcomes. See comment in models/outcome.py for more info.
    const children = this.state.isDropped ? (
      data.childOutcomeLinks.map((outcomeoutcome) => (
        <this.ChildType outcomeoutcome={outcomeoutcome} />
      ))
    ) : (
      <></>
    )

    const dropIcon = this.state.isDropped
      ? 'droptriangleup'
      : 'droptriangledown'

    const droptext = this.state.isDropped
      ? _t('hide')
      : _t('show ') +
        data.childOutcomeLinks.length +
        ' ' +
        window.ngettext(
          'descendant',
          'descendants',
          data.childOutcomeLinks.length
        )

    const comments = this.props.workflow.workflowPermissions.viewComments ? (
      <this.AddCommenting />
    ) : null
    const editPortal = this.props.edit ? this.addEditable(data, true) : null

    const onClick = (evt) => {
      return this.context.selectionManager.changeSelection({ evt, newSelection: this })
    }

    const cssClass = [
      'outcome outcome-' + data.id,
      this.state.isDropped ? ' dropped' : '',
      data.lock ? 'locked locked-' + data.lock.userId : ''
    ].join(' ')

    return (
      <>
        {editPortal}
        <div
          className={cssClass}
          style={this.getBorderStyle()}
          ref={this.mainDiv}
          onClick={onClick}
        >
          <div className="outcome-title">
            <OutcomeTitle
              title={this.props.outcome.data.title}
              prefix={this.props.outcome.prefix}
              hovertext={this.props.outcome.hovertext}
            />
          </div>

          {data.depth < 2 && data.childOutcomeLinks.length > 0 && (
            <div className="outcome-drop" onClick={this.toggleDrop.bind(this)}>
              <div className="outcome-drop-img">
                <img
                  src={apiPaths.external.static_assets.icon + dropIcon + '.svg'}
                />
              </div>
              <div className="outcome-drop-text">{droptext}</div>
            </div>
          )}

          {data.depth < 2 && (
            <div
              className="children-block"
              id={this.props.objectId + '-children-block'}
              ref={this.children_block}
            >
              {children}
            </div>
          )}

          <div className="mouseover-actions">{comments}</div>
          <div className="side-actions">
            <div className="comment-indicator-container" />
          </div>
        </div>
      </>
    )
  }
}

/*******************************************************
 * MAP STATE
 *******************************************************/
const mapOutcomeStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  return {
    outcome: getOutcomeByID(state, ownProps.objectId),
    workflow: state.workflow
  }
}
/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const SimpleOutcome = connect<ConnectedProps, object, OwnProps, AppState>(
  mapOutcomeStateToProps,
  null
)(SimpleOutcomeUnconnected)

export default SimpleOutcome
