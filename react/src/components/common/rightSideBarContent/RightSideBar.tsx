// @ts-nocheck
import * as React from 'react'
import ViewBar from './ViewBar'
import RestoreBar from './RestoreBar'
import OutcomeBar from './OutcomeBar'
import ParentOutcomeBar from './ParentOutcomeBar'
import ComparisonViewBar from './ComparisonViewBar'
import NodeBar from '@cfCommonComponents/rightSideBarContent/NodeBar'
import { ViewType, WFContext } from '@cfModule/types/enum.js'
import $ from 'jquery'

/**
 * Creates the right-hand panel with edit, view, etc for workflows,
 * including the comparison view.
 */

class RightSideBar extends React.Component {
  /*******************************************************
   * props
   *  renderer.view_type
   *  is_strategy
   *  read_only
   *
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

  getNodeBar() {
    if (this.props.context === 'workflow')
      return (
        <NodeBar
          // view_type={this.props.renderer.view_type}
          // renderer={this.props.renderer}
          readOnly={this.props.renderer.read_only}
          columnChoices={this.props.renderer.column_choices}
        />
      )
    return null
  }

  getOutcomeBar() {
    const renderer = this.props.renderer

    if (this.props.context === WFContext.COMPARISON) {
      return null
    }
    if (renderer.view_type === ViewType.OUTCOME_EDIT) {
      return <ParentOutcomeBar renderer={renderer}  />
    }
    return (
      <OutcomeBar
        // renderer={renderer}
        renderMethod={
          this.props.parentRender as (
            container: any,
            view_type: ViewType
          ) => void
        }
        readOnly={true}
        yes={true}
      />
    )
  }

  getViewBar() {
    if (this.props.context === WFContext.WORKFLOW) {
      return <ViewBar data={this.props.data} renderer={this.props.renderer} />
    }
    if (this.props.context === WFContext.COMPARISON) {
      return (
        <ComparisonViewBar
          toggleObjectSet={this.props.toggleObjectSet}
          object_sets={this.props.object_sets}
          renderer={this.props.renderer}
        />
      )
    }
    return null
  }

  getRestoreBar() {
    if (this.props.context === WFContext.WORKFLOW)
      return <RestoreBar renderer={this.props.renderer} />
    return null
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const renderer = this.props.renderer
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

          {!renderer.is_strategy && (
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
          {this.getNodeBar()}
        </div>
        {!this.props.renderer.is_strategy && (
          <>
            <div id="outcome-bar" className="right-panel-container">
              {this.getOutcomeBar()}
            </div>
            <div id="view-bar" className="right-panel-container">
              {this.getViewBar()}
            </div>
          </>
        )}
        {!renderer.read_only && (
          <div id="restore-bar" className="right-panel-container">
            {this.getRestoreBar()}
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
