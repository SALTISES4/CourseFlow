import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import { calcWorkflowPermissions } from '@cf/utility/permissions'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import Utility from '@cf/utility/Utility.class'
import { getChildWorkflowById } from '@cfFindState'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { AppState, TColumn, TNode, TWorkflow } from '@cfRedux/types/type'
import OutcomeNode from '@cfViews/common/OutcomeNode'
import NodeTitle from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeTitle'
import { Dispatch } from '@reduxjs/toolkit'
import { newOutcomeQuery } from '@XMLHTTP/API/create'
import { updateOutcomenodeDegree } from '@XMLHTTP/API/update'
import * as React from 'react'
import { connect } from 'react-redux'
import { Action } from 'redux'

import AlignmentHorizontalReverseChildOutcome from './AlignmentHorizontalReverseChildOutcome'
import OutcomeAdder from './OutcomeAdder'

type ConnectedProps = {
  workflow: TWorkflow
  node: TNode
  column: TColumn
  childOutcomes: any
  outcomenodes: any
  allNodeOutcomes: any
}

type OwnProps = {
  restrictionSet: any
  objectId: number
  parentId: number
} & { dispatch?: Dispatch<Action> }

type StateProps = {
  showAll?: boolean
}
type PropsType = ConnectedProps & OwnProps

/**
 * The representation of a node in the alignment view. It will display
 * the outcomes that the child workflow has that have the required parent outcomes
 * tagged to them
 */
class AlignmentHorizontalReverseNode extends React.Component<
  PropsType,
  StateProps
> {
  private manager: BetterSelectionManager
  private objectType: CfObjectType
  private mainDiv: React.RefObject<HTMLDivElement>

  constructor(props: PropsType) {
    super(props)
    this.manager = new BetterSelectionManager(this.props.dispatch)
    this.mainDiv = React.createRef()
    this.objectType = CfObjectType.NODE
    this.state = {}
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  /**
   * Adds a new outcome to the linked workflow
   */
  addNewChildOutcome() {
    newOutcomeQuery(this.props.node.linkedWorkflow, null)
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  ChildOutcomesHeader = () => {
    const node = this.props.node
    if (this.props.childOutcomes.length > 0) {
      return (
        <div className="child-outcome child-outcome-header">
          <div className="half-width alignment-column">
            {ThemeHelper.capWords(
              _t(`${node.linkedWorkflowData.type} outcomes`)
            )}{' '}
            {_t('From Linked Workflow')}
          </div>
          <div className="half-width alignment-column">
            {_t('Associated ')}
            {ThemeHelper.capWords(_t(`${this.props.workflow.type} outcomes`))}
          </div>
        </div>
      )
    }

    if (node.linkedWorkflow) {
      if (this.props.childOutcomes === -1) {
        // TS2339: Property childWorkflowDataNeeded does not exist on type ChildRenderer
        // @ts-ignore
        this.context.childWorkflowDataNeeded(this.props.data.id)
        return (
          <div className="child-outcome child-outcome-header">
            {_t('... LOADING')}
          </div>
        )
      }

      if (node.linkedWorkflowData.deleted) {
        return (
          <div className="child-outcome child-outcome-header">
            {_t('The linked workflow has been deleted.')}
          </div>
        )
      }

      return (
        <div className="child-outcome child-outcome-header">
          {_t(
            'No outcomes have been added to the linked workflow. When added, they will appear here.'
          )}
        </div>
      )
    }

    return (
      <div className="child-outcome child-outcome-header">
        {_t(
          'No workflow has been linked to this node. If you link a workflow, its outcomes will appear here.'
        )}
      </div>
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.node
    let dataOverride

    if (data.representsWorkflow) {
      dataOverride = { ...data, ...data.linkedWorkflowData, id: data.id }
    } else {
      dataOverride = { ...data }
    }

    // let childOutcomesHeader
    const childOutcomesHeader = <this.ChildOutcomesHeader />

    // if (this.props.childOutcomes.length > 0) {
    //   childOutcomesHeader = (
    //     <div className="child-outcome child-outcome-header">
    //       <div className="half-width alignment-column">
    //         {Utility.capWords(
    //           window.gettext(data.linkedWorkflowData.type + ' outcomes')
    //         ) + _t(' From Linked Workflow')}
    //       </div>
    //       <div className="half-width alignment-column">
    //         {_t('Associated ') +
    //           Utility.capWords(
    //             window.gettext(this.props.workflow.type + ' outcomes')
    //           )}
    //       </div>
    //     </div>
    //   )
    // } else {
    //   if (data.linkedWorkflow) {
    //     if (this.props.childOutcomes == -1) {
    //       childOutcomesHeader = (
    //         <div className="child-outcome child-outcome-header">
    //           {_t('... LOADING')}
    //         </div>
    //       )
    //       this.context.childWorkflowDataNeeded(this.props.data.id)
    //     } else {
    //       if (data.linkedWorkflowData.deleted) {
    //         childOutcomesHeader = (
    //           <div className="child-outcome child-outcome-header">
    //             {_t('The linked workflow has been deleted.')}
    //           </div>
    //         )
    //       } else {
    //         childOutcomesHeader = (
    //           <div className="child-outcome child-outcome-header">
    //             {window.gettext(
    //               'No outcomes have been added to the linked workflow. When added, they will appear here.'
    //             )}
    //           </div>
    //         )
    //       }
    //     }
    //   } else {
    //     childOutcomesHeader = (
    //       <div className="child-outcome child-outcome-header">
    //         {window.gettext(
    //           'No workflow has been linked to this node. If you link a workflow, its outcomes will appear here.'
    //         )}
    //       </div>
    //     )
    //   }
    // }

    let childOutcomes
    if (this.props.childOutcomes != -1) {
      childOutcomes = this.props.childOutcomes.map((childOutcome, index) => {
        if (
          !this.state.showAll &&
          this.props.restrictionSet?.childOutcomes?.indexOf(childOutcome) === -1
        ) {
          return null
        }

        return (
          <AlignmentHorizontalReverseChildOutcome
            key={index}
            objectId={childOutcome}
            nodeData={data}
            // renderer={this.props.renderer}
            restrictionSet={this.props.restrictionSet}
          />
        )
      })
    }
    let showAll

    //if child outcomes are restricted, we need a show all button that expands to show all of them instead. Otherwise we only need to show the outcomes currently attached to the node.
    const outcomenodes = this.props.outcomenodes.map((outcomenode) => (
      <OutcomeNode key={outcomenode.id} objectId={outcomenode.id} />
    ))

    const outcomeRestriction = this.props.restrictionSet.parentOutcomes.filter(
      (oc) => this.props.allNodeOutcomes.indexOf(oc) === -1
    )

    let outcomeadder

    if (this.props.workflow.workflowPermissions.write) {
      outcomeadder = (
        <OutcomeAdder
          outcomeSet={outcomeRestriction}
          addFunction={updateOutcomenodeDegree.bind(this, this.props.objectId)}
        />
      )
    }

    const outcomesForNode = (
      <div>
        <div className="node-outcomes-header">
          {ThemeHelper.capWords(_t(this.props.workflow.type + ' outcomes')) +
            _t(' for node:')}
        </div>
        {outcomenodes}
        {outcomeadder}
      </div>
    )

    let addNewOutcome

    if (this.props.workflow.workflowPermissions.write && data.linkedWorkflow) {
      addNewOutcome = (
        <div
          id="add-new-outcome"
          className="menu-create hover-shade"
          onClick={this.addNewChildOutcome.bind(this)}
        >
          <img
            className="create-button"
            src={apiPaths.external.static_assets.icon + 'add_new_white.svg'}
          />
          <div>{_t('Add new')}</div>
        </div>
      )
    }

    if (data.linkedWorkflow && this.props.restrictionSet?.childOutcomes) {
      if (this.state.showAll) {
        showAll = (
          <div className="alignment-added-outcomes">
            {addNewOutcome}
            {outcomesForNode}
            <div
              className="alignment-show-all"
              onClick={() => this.setState({ showAll: false })}
            >
              {'-' + _t('Hide Unused')}
            </div>
          </div>
        )
      } else {
        showAll = (
          <div className="alignment-added-outcomes">
            <div
              className="alignment-show-all"
              onClick={() => this.setState({ showAll: true })}
            >
              {'+' + _t('Show All')}
            </div>
          </div>
        )
      }
    } else {
      showAll = (
        <div className="alignment-added-outcomes">
          {addNewOutcome}
          {outcomesForNode}
        </div>
      )
    }

    const style: React.CSSProperties = {
      backgroundColor: ThemeHelper.gerColumnColour({
        columnType: this.props.column.columnType,
        colour: this.props.column.colour
      })
    }
    if (data.lock) {
      style.outline = '2px solid ' + data.lock.userColour
    }

    const permissions = calcWorkflowPermissions(
      this.props.workflow.userPermissions
    )
    //    const comments = permissions.read ? <AddCommenting /> : ''
    const comments = permissions.read ? <> comment box placeholdr </> : ''

    return (
      <div className="node-week">
        <div
          style={style}
          className={'node column-' + data.column}
          // onClick={(evt) =>
          //   selectionManager.changeSelection({ evt, newSelection: this })
          // }
          onClick={(e) => {
            e.stopPropagation()
            this.manager.updateSidebar(
              data.id,
              this.objectType,
              this.props.parentId
            )
          }}
          ref={this.mainDiv}
        >
          <div className="node-top-row">
            <NodeTitle node={data} />
          </div>
          <div className="outcome-block">
            {childOutcomesHeader}
            {childOutcomes}
          </div>
          <div className="node-drop-row">{showAll}</div>
          {/*          {this.addEditable(dataOverride, true)}*/}
          <div className="side-actions">
            <div className="comment-indicator-container"></div>
          </div>
          <div className="mouseover-actions">{comments}</div>
        </div>
      </div>
    )
  }
}

const mapAlignmentHorizontalReverseNodeStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  for (let i = 0; i < state.node.length; i++) {
    if (state.node[i].id == ownProps.objectId) {
      const node = state.node[i]
      const column = state.column.find((column) => column.id == node.column)
      let outcomenodes = Utility.filterThenSortById(
        state.outcomenode,
        node.outcomenodeUniqueSet
      )
      if (ownProps.restrictionSet && ownProps.restrictionSet.parentOutcomes) {
        outcomenodes = outcomenodes.filter(
          (ocn) =>
            ownProps.restrictionSet.parentOutcomes.indexOf(ocn.outcome) >= 0
        )
      }
      const nodeOutcomes = Utility.filterThenSortById(
        state.outcomenode,
        node.outcomenodeSet
      ).map((ocn) => ocn.outcome)

      if (!node.linkedWorkflow || node.linkedWorkflowData.deleted) {
        return {
          workflow: state.workflow,
          node: node,
          column: column,
          childOutcomes: [],
          outcomenodes: outcomenodes,
          allNodeOutcomes: nodeOutcomes
        }
      }

      const childWorkflow = getChildWorkflowById(state, node.linkedWorkflow)

      let childOutcomes

      if (childWorkflow != -1) {
        childOutcomes = Utility.filterThenSortById(
          state.outcomeworkflow,
          childWorkflow.data.outcomeworkflowSet
        ).map((outcomeworkflow) => outcomeworkflow.outcome)
      } else {
        childOutcomes = -1
      }

      return {
        workflow: state.workflow,
        node: node,
        column: column,
        childOutcomes: childOutcomes,
        outcomenodes: outcomenodes,
        allNodeOutcomes: nodeOutcomes
      }
    }
  }
}

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapAlignmentHorizontalReverseNodeStateToProps,
  null
)(AlignmentHorizontalReverseNode)
