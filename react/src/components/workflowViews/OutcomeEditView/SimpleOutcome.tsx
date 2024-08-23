import * as React from 'react'
import { connect } from 'react-redux'
import { getOutcomeByID, TGetOutcomeByID } from '@cfFindState'
import * as Utility from '@cfUtility'
import EditableComponentWithComments from '@cfParentComponents/EditableComponentWithComments'
import { OutcomeTitle } from '@cfCommonComponents/UIComponents/Titles'
import SimpleOutcomeOutcome from './SimpleOutcomeOutcome'
import { CfObjectType } from '@cfModule/types/enum'
import { AppState } from '@cfRedux/types/type'
import {
  EditableComponentWithCommentsStateType,
  EditableComponentWithCommentsType
} from '@cfParentComponents/EditableComponentWithComments'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'

/**
 *  Basic component representing an outcome in a node, or somewhere else where it doesn't have to do anything
 */

type ConnectedProps = TGetOutcomeByID
type OwnProps = {
  objectID: number
  parentID: number
  throughParentID?: number
  checkHidden?: () => void
  comments?: boolean
  edit?: boolean
  // throughParentID: number
  // legacyRenderer: EditableComponentWithCommentsType['legacyRenderer'] & {
  //   view_comments: any
  //   selection_manager: any
  // }
} & EditableComponentWithCommentsType

export type SimpleOutcomeUnconnectedPropsType = OwnProps

type StateProps = {
  is_dropped: boolean
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
    this.state = { is_dropped: false } as StateProps
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
    this.setState({ is_dropped: !this.state.is_dropped })
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  ChildType = ({ outcomeoutcome }) => {
    return (
      <SimpleOutcomeOutcome
        key={outcomeoutcome}
        objectID={outcomeoutcome}
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

    if (Utility.checkSetHidden(data, this.props.object_sets)) return null

    //Child outcomes. See comment in models/outcome.py for more info.
    const children = this.state.is_dropped ? (
      data.child_outcome_links.map((outcomeoutcome) => (
        <this.ChildType outcomeoutcome={outcomeoutcome} />
      ))
    ) : (
      <></>
    )

    const dropIcon = this.state.is_dropped
      ? 'droptriangleup'
      : 'droptriangledown'

    const droptext = this.state.is_dropped
      ? window.gettext('hide')
      : window.gettext('show ') +
        data.child_outcome_links.length +
        ' ' +
        window.ngettext(
          'descendant',
          'descendants',
          data.child_outcome_links.length
        )

    const comments = this.context.view_comments ? <this.AddCommenting /> : null
    const editPortal = this.props.edit ? this.addEditable(data, true) : null

    const onClick = (evt) => {
      return this.context.selection_manager.changeSelection(evt, this)
    }

    const cssClass = [
      'outcome outcome-' + data.id,
      this.state.is_dropped ? ' dropped' : '',
      data.lock ? 'locked locked-' + data.lock.user_id : ''
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
              data={data}
              prefix={this.props.prefix}
              hovertext={this.props.hovertext}
            />
          </div>

          {data.depth < 2 && data.child_outcome_links.length > 0 && (
            <div className="outcome-drop" onClick={this.toggleDrop.bind(this)}>
              <div className="outcome-drop-img">
                <img
                  src={
                    COURSEFLOW_APP.globalContextData.path.static_assets.icon + dropIcon + '.svg'
                  }
                />
              </div>
              <div className="outcome-drop-text">{droptext}</div>
            </div>
          )}

          {data.depth < 2 && (
            <div
              className="children-block"
              id={this.props.objectID + '-children-block'}
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
): TGetOutcomeByID => {
  return getOutcomeByID(state, ownProps.objectID)
}
/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const SimpleOutcome = connect<ConnectedProps, object, OwnProps, AppState>(
  mapOutcomeStateToProps,
  null
)(SimpleOutcomeUnconnected)

export default SimpleOutcome
