import * as React from 'react'
import ViewBar from './ViewBar'
import RestoreBar from './RestoreBar'
import OutcomeBar from './OutcomeBar'
import ParentOutcomeBar from './ParentOutcomeBar'
import ComparisonViewBar from './ComparisonViewBar'
import NodeBar from '@cfViews/components/rightSideBarContent/NodeBar'
import { ViewType, WFContext } from '@cfModule/types/enum.js'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'
// import $ from 'jquery'

/**
 * Creates the right-hand panel with edit, view, etc for workflows,
 * including the comparison view.
 */

// type ChildRenderer = {
//   view_type: any
//   is_strategy: any
//   read_only: any
//   column_choices: any
// }

type PropsType = {
  // renderer: ChildRenderer
  wfcontext: WFContext
  // parentRender: (container: any, view_type: ViewType) => void // explicitly define the parent/gp 're-render' method for clarity
  data: any
  readOnly: boolean
  object_sets?: any
  toggleObjectSet?: any
}

class RightSideBar extends React.Component<PropsType> {
  static contextType = WorkFlowConfigContext

  declare context: React.ContextType<typeof WorkFlowConfigContext>

  /*******************************************************
   * props from renderer
   *
   *  view_type
   *  is_strategy
   *  read_only
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
          // view_type={this.props.renderer.view_type}
          // renderer={this.props.renderer}
          readOnly={this.context.permissions.workflowPermission.readOnly}
          columnChoices={this.context.workflow.choices.column_choices}
        />
      )
    return null
  }

  OutcomeBarWrapper = () => {
    console.log('OutcomeBarWrapper')
    console.log(this.props)
    if (this.props.wfcontext === WFContext.COMPARISON) {
      return null
    }
    if (this.context.viewType === ViewType.OUTCOME_EDIT) {
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
          objectSets={this.props.object_sets}
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
              <span
                className="material-symbols-rounded filled"
                title={window.gettext('Edit')}
              >
                edit
              </span>
            </a>
          </li>
          <li className="hover-shade">
            <a href="#node-bar">
              <span
                className="material-symbols-rounded filled"
                title={window.gettext('Add')}
              >
                add_circle
              </span>
            </a>
          </li>

          {!this.context.workflow.is_strategy && (
            <>
              <li className="hover-shade">
                <a href="#outcome-bar">
                  <span
                    className="material-symbols-rounded filled"
                    title={window.gettext('Outcomes')}
                  >
                    spoke
                  </span>
                </a>
              </li>
              <li className="hover-shade">
                <a href="#view-bar">
                  <span
                    className="material-symbols-rounded filled"
                    title={window.gettext('View Options')}
                  >
                    remove_red_eye
                  </span>
                </a>
              </li>
            </>
          )}

          <li className="hover-shade">
            <a href="#restore-bar">
              <span
                className="material-symbols-rounded filled"
                title={window.gettext('Restore Deleted')}
              >
                restore_from_trash
              </span>
            </a>
          </li>
        </ul>
        <div id="edit-menu" className="right-panel-container" />

        <div id="node-bar" className="right-panel-container">
          <this.NodeBarWrapper />
        </div>

        {!this.context.workflow.is_strategy && (
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
          <span className="material-symbols-rounded green">arrow_forward</span>
        </div>
      </div>
    )
  }
}

export default RightSideBar
