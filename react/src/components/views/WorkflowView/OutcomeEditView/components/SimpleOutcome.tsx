import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import Utility from '@cf/utility/Utility.class'
import { OutcomeTitle } from '@cfComponents/UIPrimitives/Titles.ts.tsx'
import { TGetOutcomeByID, getOutcomeByID } from '@cfFindState'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import { Dispatch } from '@reduxjs/toolkit'
import * as React from 'react'
import { connect } from 'react-redux'
import { Action } from 'redux'

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
  parentId: number
  throughParentId?: number
  checkHidden?: () => void
  comments?: boolean
  edit?: boolean
} & { dispatch?: Dispatch<Action> }

export type SimpleOutcomeUnconnectedPropsType = OwnProps

type StateProps = {
  isDropped: boolean
}

type PropsType = ConnectedProps & OwnProps

/**
 * A simple outcome block without any action buttons for displaying
 * outcomes tagged to nodes or other outcomes.
 */
export class SimpleOutcomeUnconnected extends React.Component<
  PropsType,
  StateProps
> {
  private childrenBlock: React.RefObject<HTMLDivElement>
  private manager: BetterSelectionManager
  private objectType: CfObjectType
  private mainDiv: React.RefObject<HTMLDivElement>

  constructor(props: PropsType) {
    super(props)
    this.mainDiv = React.createRef()
    this.objectType = CfObjectType.OUTCOME
    this.manager = new BetterSelectionManager(this.props.dispatch)

    this.childrenBlock = React.createRef()
    this.state = { isDropped: false } as StateProps
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    if (this.props.checkHidden) {
      this.props.checkHidden()
    }
  }

  componentDidUpdate() {
    if (this.props.checkHidden) {
      this.props.checkHidden()
    }
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
        parentId={this.props.parentId}
        comments={this.props.comments}
        edit={this.props.edit}
      />
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.outcome.data

    if (Utility.checkSetHidden(data, this.props.outcome.objectSets)) {
      return null
    }

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
      // <this.AddCommenting />
      <>add commentbox</>
    ) : null
    //     const editPortal = this.props.edit ? this.addEditable(data, true) : null

    const cssClass = [
      'outcome outcome-' + data.id,
      this.state.isDropped ? ' dropped' : '',
      data.lock ? 'locked locked-' + data.lock.userId : ''
    ].join(' ')

    return (
      <>
        {/*{editPortal}*/}
        <div
          className={cssClass}
          style={ThemeHelper.getBorderStyle({
            isLocked: !!this.props.outcome.data.lock,
            colour: this.props.outcome.data.lock.userColour
          })}
          ref={this.mainDiv}
          onClick={(e) => {
            e.stopPropagation()
            this.manager.updateSidebar(
              data.id,
              this.objectType,
              this.props.parentId
            )
          }}
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
                <ArrowDropDownIcon />
              </div>
              <div className="outcome-drop-text">{droptext}</div>
            </div>
          )}

          {data.depth < 2 && (
            <div
              className="children-block"
              id={this.props.objectId + '-children-block'}
              ref={this.childrenBlock}
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
