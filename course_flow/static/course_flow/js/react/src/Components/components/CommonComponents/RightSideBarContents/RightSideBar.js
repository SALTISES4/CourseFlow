/**
 * Creates the right-hand panel with edit, view, etc for workflows,
 * including the comparison view.
 */
import * as React from 'react'
import NodeBar from './NodeBar.js'
import ViewBar from './ViewBar.js'
import RestoreBar from './RestoreBar.js'
import OutcomeBar from './OutcomeBar.js'
import ParentOutcomeBar from './ParentOutcomeBar.js'
import ComparisonViewBar from './ComparisonViewBar.js'

export default class extends React.Component {
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
        if (ui.oldTab.length == 0) $('#sidebar').removeClass('collapsed')
        else if (ui.newTab.length == 0) $('#sidebar').addClass('collapsed')
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
    if (this.props.context == 'workflow')
      return (
        <NodeBar
          view_type={this.props.renderer.view_type}
          renderer={this.props.renderer}
        />
      )
    return null
  }

  getOutcomeBar() {
    if (this.props.context == 'comparison') return null
    let renderer = this.props.renderer
    if (renderer.view_type == 'outcomeedit')
      return <ParentOutcomeBar renderer={renderer} />
    else return <OutcomeBar renderer={renderer} />
  }

  getViewBar() {
    if (this.props.context == 'workflow')
      return <ViewBar data={this.props.data} renderer={this.props.renderer} />
    else if (this.props.context == 'comparison')
      return (
        <ComparisonViewBar
          toggleObjectSet={this.props.toggleObjectSet}
          object_sets={this.props.object_sets}
          renderer={this.props.renderer}
        />
      )
  }

  getRestoreBar() {
    if (this.props.context == 'workflow')
      return <RestoreBar renderer={this.props.renderer} />
    return null
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let renderer = this.props.renderer
    return (
      <div id="sidebar" class="side-bar hide-print">
        <ul>
          <li class="hover-shade">
            <a href="#edit-menu">
              <span
                class="material-symbols-rounded filled"
                title={gettext('Edit')}
              >
                edit
              </span>
            </a>
          </li>
          <li class="hover-shade">
            <a href="#node-bar">
              <span
                class="material-symbols-rounded filled"
                title={gettext('Add')}
              >
                add_circle
              </span>
            </a>
          </li>

          {!renderer.is_strategy && (
            <>
              <li class="hover-shade">
                <a href="#outcome-bar">
                  <span
                    class="material-symbols-rounded filled"
                    title={gettext('Outcomes')}
                  >
                    spoke
                  </span>
                </a>
              </li>
              <li class="hover-shade">
                <a href="#view-bar">
                  <span
                    class="material-symbols-rounded filled"
                    title={gettext('View Options')}
                  >
                    remove_red_eye
                  </span>
                </a>
              </li>
            </>
          )}

          <li class="hover-shade">
            <a href="#restore-bar">
              <span
                class="material-symbols-rounded filled"
                title={gettext('Restore Deleted')}
              >
                restore_from_trash
              </span>
            </a>
          </li>
        </ul>
        <div id="edit-menu" class="right-panel-container"></div>
        <div id="node-bar" class="right-panel-container">
          {this.getNodeBar()}
        </div>
        {!this.props.renderer.is_strategy && (
          <>
            <div id="outcome-bar" class="right-panel-container">
              {this.getOutcomeBar()}
            </div>
            <div id="view-bar" class="right-panel-container">
              {this.getViewBar()}
            </div>
          </>
        )}
        {!renderer.read_only && (
          <div id="restore-bar" class="right-panel-container">
            {this.getRestoreBar()}
          </div>
        )}
        <div class="window-close-button" id="side-bar-close-button">
          <span class="material-symbols-rounded green">arrow_forward</span>
        </div>
      </div>
    )
  }
}
