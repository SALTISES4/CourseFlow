import * as Redux from 'redux'
import * as React from 'react'
import * as reactDom from 'react-dom'
import {
  setUserPermission,
  getUsersForObject,
  getUserList
} from '../../PostFunctions.js'
import { Loader } from '../../UtilityFunctions.js'

export class ExportMenu extends React.Component {
  constructor(props) {
    super(props)
    this.state = { type: 'outcome' }
  }

  render() {
    let object_sets
    if (this.props.data.object_sets.length > 0) {
      object_sets = [
        <h4>{gettext('Object Set Visibility')}:</h4>,
        this.props.data.object_sets.map((objectset) => (
          <div>
            <input
              onChange={this.inputChange.bind(this, 'set', objectset.id)}
              name="object_sets[]"
              value={objectset.id}
              type="checkbox"
              id={objectset.id}
              checked={!this.state[objectset.id]}
            />
            <label>{objectset.title}</label>
          </div>
        ))
      ]
    }

    return (
      <div className="message-wrap">
        <h2>{gettext('Export files')}</h2>
        <p>{gettext('Use this menu to export files.')}</p>
        <form
          id="export-form"
          enctype="multipart/form-data"
          action={post_paths.get_export}
          method="POST"
          target="redirect-iframe"
          onSubmit={this.submit.bind(this)}
        >
          <input
            type="hidden"
            name="csrfmiddlewaretoken"
            value={root.getCsrfToken()}
          />
          <h4>{gettext('Export Type')}:</h4>
          {this.getExportTypes()}
          <h4>{gettext('Export Format')}:</h4>
          <select name="export_format">
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
          </select>
          {object_sets}
          <input
            type="hidden"
            id="objectID"
            name="objectID"
            value={JSON.stringify(this.props.data.id)}
          />
          <input
            type="hidden"
            id="objectType"
            name="objectType"
            value={JSON.stringify(this.props.data.type)}
          />
          <input
            onClick={this.click.bind(this)}
            id="submit-button"
            type="submit"
          />
        </form>
        <iframe hidden name="redirect-iframe" id="redirect-iframe"></iframe>
        <div className="window-close-button" onClick={this.props.actionFunction}>
          <img src={config.icon_path + 'close.svg'} />
        </div>
      </div>
    )
  }

  getExportTypes() {
    let type = this.props.data.type
    let exports = []
    exports.push([
      <input
        name="export_type"
        type="radio"
        value="outcome"
        onChange={this.inputChange.bind(this, 'type', '')}
        checked={this.state.type == 'outcome'}
      />,
      <label for="export_type">{gettext('Outcomes')}</label>
    ])
    exports.push([
      <input
        name="export_type"
        type="radio"
        value="node"
        onChange={this.inputChange.bind(this, 'type', '')}
        checked={this.state.type == 'node'}
      />,
      <label for="export_type">{gettext('Nodes')}</label>
    ])
    if (type == 'project' || type == 'course')
      exports.push([
        <input
          name="export_type"
          type="radio"
          value="framework"
          onChange={this.inputChange.bind(this, 'type', '')}
          checked={this.state.type == 'framework'}
        />,
        <label for="export_type">{gettext('Course Framework')}</label>
      ])
    if (type == 'project' || type == 'program')
      exports.push([
        <input
          name="export_type"
          type="radio"
          value="matrix"
          onChange={this.inputChange.bind(this, 'type', '')}
          checked={this.state.type == 'matrix'}
        />,
        <label for="export_type">{gettext('Competency Matrix')}</label>
      ])
    return exports
  }

  inputChange(type, id, evt) {
    if (type == 'set') {
      let new_state = {}
      new_state[id] = !evt.target.checked
      this.setState(new_state)
    } else if (type == 'type' && evt.target.checked) {
      this.setState({ type: evt.target.value })
    }
  }

  click(evt) {
    if (evt.ctrlKey) {
      this.ctrlKey = true
      $('#export-form')[0].action = post_paths.get_export_download
    }
  }

  submit(evt) {
    $('#submit-button').attr('disabled', true)
    setTimeout(() => {
      if (!this.ctrlKey) this.props.actionFunction()
      alert(
        gettext(
          'Your file is being generated and will be emailed to you shortly.'
        )
      )
    }, 100)
    return true
  }
}
