// @ts-nocheck
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { WFContext, WorkflowViewType } from '@cf/types/enum.js'
import { _t } from '@cf/utility/utilityFunctions'
import NodeBar from '@cfViews/components/rightSideBarContent/NodeBar'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import EditIcon from '@mui/icons-material/Edit'
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye'
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash'
import SpokeIcon from '@mui/icons-material/Spoke'
import * as React from 'react'

import ComparisonViewBar from './ComparisonViewBar'
import OutcomeBar from './OutcomeBar'
import ParentOutcomeBar from './ParentOutcomeBar'
import RestoreBar from './RestoreBar'
import ViewBar from './ViewBar'
// import $ from 'jquery'

/**
 * Creates the right-hand panel with edit, view, etc for workflows,
 * including the comparison view.
 */

// type ChildRenderer = {
//   viewType: any
//   isStrategy: any
//   readOnly: any
//   column_choices: any
// }

type PropsType = {
  // renderer: ChildRenderer
  wfcontext: WFContext
  // parentRender: (container: any, viewType: ViewType) => void // explicitly define the parent/gp 're-render' method for clarity
  data: any
  readOnly: boolean
  objectSets?: any
  toggleObjectSet?: any
}

const choices = COURSEFLOW_APP.globalContextData.workflow_choices

class RightSideBar extends React.Component<PropsType> {
  static contextType = WorkFlowConfigContext

  declare context: React.ContextType<typeof WorkFlowConfigContext>

  /*******************************************************
   * props from renderer
   *
   *  viewType
   *  isStrategy
   *  readOnly
   *  column_choices
   *******************************************************/

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.makeTabs()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  makeTabs() {
    $('#sidebar').tabs({
      active: 1,
      disabled: [0],
      collapsible: true,
      activate: (evt, ui) => {
        if (ui.oldTab.length === 0) $('#sidebar').removeClass('collapsed')
        else if (ui.newTab.length === 0) $('#sidebar').addClass('collapsed')
      }
    })

    $('#sidebar').on('dblclick mousedown', (evt) => {
      evt.stopPropagation()
    })
    $('#side-bar-close-button').on('click', () => {
      $('#sidebar').addClass('collapsed')
      $('#sidebar').tabs('option', 'active', false)
    })
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  NodeBarWrapper = () => {
    if (this.props.wfcontext === WFContext.WORKFLOW)
      return (
        <NodeBar
          // viewType={this.props.renderer.viewType}
          // renderer={this.props.renderer}
          readOnly={this.context.permissions.workflowPermission.readOnly}
          columnChoices={choices.column_choices}
        />
      )
    return null
  }

  OutcomeBarWrapper = () => {
    if (this.props.wfcontext === WFContext.COMPARISON) {
      return null
    }
    if (this.context.workflowView === WorkflowViewType.OUTCOME_EDIT) {
      return <ParentOutcomeBar />
    }
    return (
      <OutcomeBar
        // renderer={renderer}
        // renderMethod={this.props.parentRender}
        readOnly={this.props.readOnly} // @todo, verify business logic
      />
    )
  }

  ViewBarWrapper = () => {
    if (this.props.wfcontext === WFContext.WORKFLOW) {
      return (
        <ViewBar data={this.props.data} /* renderer={this.props.renderer}*/ />
      )
    }
    if (this.props.wfcontext === WFContext.COMPARISON) {
      return (
        <ComparisonViewBar
          toggleObjectSet={this.props.toggleObjectSet}
          objectSets={this.props.objectSets}
          // renderer={this.props.renderer}
        />
      )
    }
    return null
  }

  RestoreBarWrapper = () => {
    if (this.props.wfcontext === WFContext.WORKFLOW) return <RestoreBar />
    return null
  }

  /*******************************************************
   * RENDER
   *******************************************************/

  // @todo why are these anchor links?
  render() {
    return (
      <div id="sidebar" className="side-bar hide-print">
        <ul>
          <li className="hover-shade">
            <a href="#edit-menu">
              <span className="filled" title={_t('Edit')}>
                <EditIcon />
              </span>
            </a>
          </li>
          <li className="hover-shade">
            <a href="#node-bar">
              <span className=" filled" title={_t('Add')}>
                <AddCircleIcon />
              </span>
            </a>
          </li>

          {!this.context.workflow.isStrategy && (
            <>
              <li className="hover-shade">
                <a href="#outcome-bar">
                  <span title={_t('Outcomes')}>
                    <SpokeIcon />
                  </span>
                </a>
              </li>
              <li className="hover-shade">
                <a href="#view-bar">
                  <span title={_t('View Options')}>
                    <RemoveRedEyeIcon />
                  </span>
                </a>
              </li>
            </>
          )}

          <li className="hover-shade">
            <a href="#restore-bar">
              <span title={_t('Restore Deleted')}>
                <RestoreFromTrashIcon />
              </span>
            </a>
          </li>
        </ul>
        <div id="edit-menu" className="right-panel-container" />

        <div id="node-bar" className="right-panel-container">
          <this.NodeBarWrapper />
        </div>

        {!this.context.workflow.isStrategy && (
          <>
            <div id="outcome-bar" className="right-panel-container">
              <this.OutcomeBarWrapper />
            </div>
            <div id="view-bar" className="right-panel-container">
              <this.ViewBarWrapper />
            </div>
          </>
        )}

        {!this.context.permissions.workflowPermission.readOnly && (
          <div id="restore-bar" className="right-panel-container">
            <this.RestoreBarWrapper />
          </div>
        )}

        <div className="window-close-button" id="side-bar-close-button">
          {/* green */}
          <ArrowForwardIcon />
        </div>
      </div>
    )
  }
}

export default RightSideBar
