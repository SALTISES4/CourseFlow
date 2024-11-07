import { TitleText } from '@cf/components/common/UIPrimitives/Titles.ts'
import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import { _t } from '@cf/utility/Utility.class'
import Utility from '@cf/utility/Utility.class'
import { HoverMenu } from '@cfEditableComponents/hoverEditActions'
import { TGetNodeById, getNodeByID } from '@cfFindState'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import OutcomeNode from '@cfViews/common/OutcomeNode'
import NodeTitle from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeTitle'
import { Dispatch } from '@reduxjs/toolkit'
import * as React from 'react'
import { connect } from 'react-redux'
import { Action } from 'redux'

type ConnectedProps = { node: TGetNodeById; workflow: TWorkflow }
type OwnProps = {
  objectId: number
  parentId: number
} & { dispatch?: Dispatch<Action> }
type StateProps = {
  showOutcomes: boolean
}
type PropsType = ConnectedProps & OwnProps

/**
 * Represents the node in the comparison view
 */
const choices = COURSEFLOW_APP.globalContextData.workflowChoices

/**
 * renderer.selectionManager
 * renderer.viewComments
 * renderer.contextChoices
 * renderer.taskChoices
 * renderer.readOnly
 */
class ComparisonNodeUnconnected extends React.Component<PropsType, StateProps> {
  private manager: BetterSelectionManager
  private mainDiv: React.RefObject<HTMLDivElement>
  private objectType: CfObjectType

  constructor(props: PropsType) {
    super(props)
    this.manager = new BetterSelectionManager(this.props.dispatch)

    this.objectType = CfObjectType.NODE
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const sideActions = []
    let dataOverride
    let lefticon
    let righticon

    const node = this.props.node.data

    if (node.representsWorkflow) {
      dataOverride = {
        ...node,
        ...node.linkedWorkflowData,
        id: node.id
      }
    } else {
      dataOverride = { ...node }
    }

    const style: React.CSSProperties = {
      backgroundColor: Constants.getColumnColour({
        columnType: this.props.node.column.columnType,
        colour: this.props.node.column.colour
      })
    }
    if (node.lock) {
      style.outline = '2px solid ' + node.lock.userColour
    }
    if (Utility.checkSetHidden(node, this.props.node.objectSets)) {
      style.display = 'none'
    }

    let outcomenodes
    if (this.state.showOutcomes) {
      outcomenodes = (
        <div
          className={'outcome-node-container column-111111-' + node.column}
          onMouseLeave={() => {
            this.setState({
              showOutcomes: false
            })
          }}
          style={{
            borderColor: Constants.getColumnColour({
              columnType: this.props.node.column.columnType,
              colour: this.props.node.column.colour
            })
          }}
        >
          {node.outcomenodeUniqueSet.map((outcomenode) => (
            <OutcomeNode key={outcomenode} objectId={outcomenode} />
          ))}
        </div>
      )
    }

    if (node.outcomenodeUniqueSet.length > 0) {
      sideActions.push(
        <div className="outcome-node-indicator">
          <div
            className={'outcome-node-indicator-number column-' + node.column}
            onMouseEnter={() => {
              this.setState({ showOutcomes: true })
            }}
            style={{
              borderColor: Constants.getColumnColour({
                columnType: this.props.node.column.columnType,
                colour: this.props.node.column.colour
              })
            }}
          >
            {node.outcomenodeUniqueSet.length}
          </div>
          {outcomenodes}
        </div>
      )
    }

    if (node.contextClassification > 0) {
      lefticon = (
        <img
          title={
            choices.contextChoices.find(
              (obj) => obj.type == node.contextClassification
            ).name
          }
          src={
            apiPaths.external.static_assets.icon +
            Constants.contextKeys[node.contextClassification] +
            '.svg'
          }
        />
      )
    }

    if (node.taskClassification > 0) {
      righticon = (
        <img
          title={
            choices.taskChoices.find(
              (obj) => obj.type == node.taskClassification
            ).name
          }
          src={
            apiPaths.external.static_assets.icon +
            Constants.taskKeys[node.taskClassification] +
            '.svg'
          }
        />
      )
    }

    const titleText = <NodeTitle node={node} />

    // let cssClass =
    //   'node column-' + data.column + ' ' + Constants.nodeKeys[data.nodeType]
    // if (data.lock) cssClass += ' locked locked-' + data.lock.userId

    const cssClasses = [
      'node column-' + node.column + ' ' + Constants.nodeKeys[node.nodeType],
      node.lock ? 'locked locked-' + node.lock.userId : ''
    ].join(' ')

    return (
      <>
        {/*{this.addEditable(dataOverride)}*/}
        <div
          style={style}
          className={cssClasses}
          id={String(node.id)}
          ref={this.mainDiv}
          // onClick={(evt) => {
          //   return () =>
          //     selectionManager.changeSelection({ evt, newSelection: this })
          // }}
          onClick={(e) => {
            e.stopPropagation()
            this.manager.updateSidebar(
              node.id,
              this.objectType,
              this.props.parentId
            )
          }}
        >
          <div className="node-top-row">
            <div className="node-icon">{lefticon}</div>
            {titleText}
            <div className="node-icon">{righticon}</div>
          </div>
          <div className="node-details">
            <TitleText
              text={dataOverride.description}
              defaultText={_t('Click to edit')}
            />
          </div>
          <HoverMenu
            canWrite={this.props.workflow.workflowPermissions.write}
            canComment={this.props.workflow.workflowPermissions.viewComments}
            objectId={this.props.objectId}
            parentId={this.props.parentId}
            objectType={this.objectType}
          />
          <div className="side-actions">{sideActions}</div>
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
