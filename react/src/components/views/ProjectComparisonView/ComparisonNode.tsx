import EditableComponent, {
  EditableComponentProps,
  EditableComponentStateType
} from '@cf/components/common/editableComponents/EditableComponent'
import { TitleText } from '@cf/components/common/UIPrimitives/Titles.ts'
import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import { NodeTitle } from '@cfComponents/UIPrimitives/Titles'
import * as Constants from '@cfConstants'
import {
  DeleteSelfButton,
  DuplicateSelfButton,
  InsertSiblingButton
} from '@cfEditableComponents/hoverEditActions'
import { TGetNodeById, getNodeByID } from '@cfFindState'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import * as Utility from '@cfUtility'
import OutcomeNode from '@cfViews/components/OutcomeNode'
import * as React from 'react'
import { connect } from 'react-redux'

type ConnectedProps = { node: TGetNodeById; workflow: TWorkflow }
type OwnProps = EditableComponentProps
type StateProps = {
  show_outcomes: boolean
} & EditableComponentStateType
type PropsType = ConnectedProps & OwnProps

/**
 * Represents the node in the comparison view
 */
const choices = COURSEFLOW_APP.globalContextData.workflowChoices

/**
 * renderer.selectionManager
 * renderer.viewComments
 * renderer.contextChoices
 * renderer.task_choices
 * renderer.readOnly
 */
class ComparisonNodeUnconnected extends EditableComponent<
  PropsType,
  StateProps
> {
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.NODE
  }

  HoverMenu = () => {
    const mouseoverActions = []
    if (this.props.workflow.workflowPermissions.write) {
      mouseoverActions.push(
        <InsertSiblingButton
          id={this.props.objectId}
          objectType={this.objectType}
          parentId={this.props.parentId}
        />
      )
      mouseoverActions.push(
        <DuplicateSelfButton
          id={this.props.objectId}
          objectType={this.objectType}
          parentId={this.props.parentId}
        />
      )
      mouseoverActions.push(
        <DeleteSelfButton
          id={this.props.objectId}
          objectType={this.objectType}
        />
      )
    }

    if (this.props.workflow.workflowPermissions.viewComments) {
      mouseoverActions.push(<this.AddCommenting />)
    }
    return mouseoverActions
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const side_actions = []
    let data_override
    let lefticon
    let righticon

    const data = this.props.data

    if (data.representsWorkflow) {
      data_override = {
        ...data,
        ...data.linkedWorkflowData,
        id: data.id
      }
    } else {
      data_override = { ...data }
    }
    const selectionManager = this.context.selectionManager

    const style: React.CSSProperties = {
      backgroundColor: Constants.getColumnColour(this.props.node.column)
    }
    if (data.lock) {
      style.outline = '2px solid ' + data.lock.userColour
    }
    if (Utility.checkSetHidden(data, this.props.objectSets)) {
      style.display = 'none'
    }

    let outcomenodes
    if (this.state.show_outcomes)
      outcomenodes = (
        <div
          className={'outcome-node-container column-111111-' + data.column}
          onMouseLeave={() => {
            this.setState({
              show_outcomes: false
            })
          }}
          style={{
            borderColor: Constants.getColumnColour(this.props.node.column)
          }}
        >
          {data.outcomenodeUniqueSet.map((outcomenode) => (
            <OutcomeNode key={outcomenode} objectId={outcomenode} />
          ))}
        </div>
      )

    if (data.outcomenodeUniqueSet.length > 0) {
      side_actions.push(
        <div className="outcome-node-indicator">
          <div
            className={'outcome-node-indicator-number column-' + data.column}
            onMouseEnter={() => {
              this.setState({ show_outcomes: true })
            }}
            style={{
              borderColor: Constants.getColumnColour(this.props.node.column)
            }}
          >
            {data.outcomenodeUniqueSet.length}
          </div>
          {outcomenodes}
        </div>
      )
    }

    if (data.contextClassification > 0) {
      lefticon = (
        <img
          title={
            choices.contextChoices.find(
              (obj) => obj.type == data.contextClassification
            ).name
          }
          src={
            apiPaths.external.static_assets.icon +
            Constants.contextKeys[data.contextClassification] +
            '.svg'
          }
        />
      )
    }

    if (data.taskClassification > 0) {
      righticon = (
        <img
          title={
            choices.taskChoices.find(
              (obj) => obj.type == data.taskClassification
            ).name
          }
          src={
            apiPaths.external.static_assets.icon +
            Constants.taskKeys[data.taskClassification] +
            '.svg'
          }
        />
      )
    }

    const titleText = <NodeTitle data={data} />

    // let cssClass =
    //   'node column-' + data.column + ' ' + Constants.nodeKeys[data.nodeType]
    // if (data.lock) cssClass += ' locked locked-' + data.lock.userId

    const cssClasses = [
      'node column-' + data.column + ' ' + Constants.nodeKeys[data.nodeType],
      data.lock ? 'locked locked-' + data.lock.userId : ''
    ].join(' ')

    return (
      <>
        {this.addEditable(data_override)}
        <div
          style={style}
          className={cssClasses}
          id={data.id}
          ref={this.mainDiv}
          onClick={(evt) => {
            return () =>
              selectionManager.changeSelection({ evt, newSelection: this })
          }}
        >
          <div className="node-top-row">
            <div className="node-icon">{lefticon}</div>
            {titleText}
            <div className="node-icon">{righticon}</div>
          </div>
          <div className="node-details">
            <TitleText
              text={data_override.description}
              defaultText={_t('Click to edit')}
            />
          </div>
          <div className="mouseover-actions">
            <this.HoverMenu />
          </div>
          <div className="side-actions">{side_actions}</div>
        </div>
      </>
    )
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  return {
    node: getNodeByID(state, ownProps.objectId),
    workflow: state.workflow
  }
}

const ComparisonNode = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(ComparisonNodeUnconnected)

export default ComparisonNode
