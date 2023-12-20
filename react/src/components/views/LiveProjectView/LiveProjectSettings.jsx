import * as React from 'react'
import { updateLiveProjectValue } from '@XMLHTTP/PostFunctions'
import LiveProjectSection from './LiveProjectSection'

class LiveProjectSettings extends LiveProjectSection {
  constructor(props) {
    super(props)
    this.state = { has_changed: false, liveproject: null }
    this.changed_values = {}
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  changeField(type, new_value) {
    let new_state = { ...this.state.data.liveproject }
    new_state[type] = new_value
    this.changed_values[type] = new_value
    this.setState({
      has_changed: true,
      data: { ...this.state.data, liveproject: new_state }
    })
  }

  saveChanges() {
    updateLiveProjectValue(
      this.state.data.liveproject.id,
      'liveproject',
      this.changed_values
    )
    this.props.updateLiveProject({
      liveproject: { ...this.state.data.liveproject, ...this.changed_values }
    })
    this.changed_values = {}
    this.setState({ has_changed: false })
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    if (!this.state.data) return this.defaultRender()
    let data = this.state.data.liveproject
    let changeField = this.changeField.bind(this)

    return (
      <div className="workflow-details">
        <h4>{window.gettext('Classroom configuration')}:</h4>
        <div>
          <input
            id="default-single-completion"
            name="default-single-completion"
            type="checkbox"
            checked={data.default_single_completion}
            onChange={(evt) =>
              changeField('default_single_completion', evt.target.checked)
            }
          />
          <label
            htmlFor="default-signle-completion"
            title={window.gettext(
              'Whether to mark the assignment as complete if any user has completed it.'
            )}
          >
            {window.gettext(
              'By default, mark assignments as complete when a single user has completed them'
            )}
          </label>
        </div>
        <div>
          <input
            id="default-assign-to-all"
            name="default-assign-to-all"
            type="checkbox"
            checked={data.default_assign_to_all}
            onChange={(evt) =>
              changeField('default_assign_to_all', evt.target.checked)
            }
          />
          <label
            htmlFor="default-assign-to-all"
            title={window.gettext(
              'Whether creating an assignment automatically adds all students to it.'
            )}
          >
            {window.gettext(
              'Assign new assignments to all students by default'
            )}
          </label>
        </div>
        <div>
          <input
            id="default-self-reporting"
            name="default-self-reporting"
            type="checkbox"
            checked={data.default_self_reporting}
            onChange={(evt) =>
              changeField('default_self_reporting', evt.target.checked)
            }
          />
          <label
            htmlFor="default-self-reporting"
            title={window.gettext(
              'Whether students can mark their own assignments as complete.'
            )}
          >
            {window.gettext(
              'Let students self-report their assignment completion by default'
            )}
          </label>
        </div>
        <div>
          <input
            id="default-all-workflows-visible"
            name="default-all-workflows-visible"
            type="checkbox"
            checked={data.default_all_workflows_visible}
            onChange={(evt) =>
              changeField('default_all_workflows_visible', evt.target.checked)
            }
          />
          <label
            htmlFor="default-all-workflows-visible"
            title={window.gettext(
              'Whether all workflows in the project will be visible to students by default.'
            )}
          >
            {window.gettext('All Workflows Visible To Students')}
          </label>
        </div>
        <div>
          <button
            className="primary-button"
            disabled={!this.state.has_changed}
            onClick={this.saveChanges.bind(this)}
          >
            {window.gettext('Save classroom changes')}
          </button>
        </div>
      </div>
    )
  }
}

export default LiveProjectSettings
