import * as React from 'react'
import { updateLiveProjectValue } from '../../../PostFunctions.js'
import { LiveProjectSection } from './LiveProjectSection.js'

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
    console.log(this.state)
    let data = this.state.data.liveproject
    let changeField = this.changeField.bind(this)

    return (
      <div className="workflow-details">
        <h4>{gettext('Classroom configuration')}:</h4>
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
            title={gettext(
              'Whether to mark the assignment as complete if any user has completed it.'
            )}
          >
            {gettext(
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
            title={gettext(
              'Whether creating an assignment automatically adds all students to it.'
            )}
          >
            {gettext('Assign new assignments to all students by default')}
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
            title={gettext(
              'Whether students can mark their own assignments as complete.'
            )}
          >
            {gettext(
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
            title={gettext(
              'Whether all workflows in the project will be visible to students by default.'
            )}
          >
            {gettext('All Workflows Visible To Students')}
          </label>
        </div>
        <div>
          <button
            className="primary-button"
            disabled={!this.state.has_changed}
            onClick={this.saveChanges.bind(this)}
          >
            {gettext('Save classroom changes')}
          </button>
        </div>
      </div>
    )
  }
}

export default LiveProjectSettings