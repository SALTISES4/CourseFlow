import * as React from 'react'

class ExportMenu extends React.Component {
  constructor(props) {
    super(props)
    this.state = { type: 'outcome' }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getExportTypes() {
    let type = this.props.data.type
    const exports = []
    exports.push([
      <input
        name="export_type"
        type="radio"
        value="outcome"
        onChange={this.inputChange.bind(this, 'type', '')}
        checked={this.state.type == 'outcome'}
      />,
      <label htmlFor="export_type">{window.gettext('Outcomes')}</label>
    ])
    exports.push([
      <input
        name="export_type"
        type="radio"
        value="node"
        onChange={this.inputChange.bind(this, 'type', '')}
        checked={this.state.type == 'node'}
      />,
      <label htmlFor="export_type">{window.gettext('Nodes')}</label>
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
        <label htmlFor="export_type">
          {window.gettext('Course Framework')}
        </label>
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
        <label htmlFor="export_type">
          {window.gettext('Competency Matrix')}
        </label>
      ])

    // brought from master branch
    if (type == 'project' || type == 'program')
      exports.push([
        <input
          name="export_type"
          type="radio"
          value="sobec"
          onChange={this.inputChange.bind(this, 'type', '')}
          checked={this.state.type == 'sobec'}
        />,
        <label htmlFor="export_type">
          {window.gettext('Sobec Validation')}
        </label>
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
      $('#export-form')[0].action =
        COURSEFLOW_APP.config.post_paths.get_export_download
    }
  }

  submit(evt) {
    $('#submit-button').attr('disabled', true)
    setTimeout(() => {
      if (!this.ctrlKey) this.props.actionFunction()
      alert(
        window.gettext(
          'Your file is being generated and will be emailed to you shortly.'
        )
      )
    }, 100)
    return true
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let object_sets
    if (this.props.data.object_sets.length > 0) {
      object_sets = [
        <h4>{window.gettext('Object Set Visibility')}:</h4>,
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
        <h2>{window.gettext('Export files')}</h2>
        <p>{window.gettext('Use this menu to export files.')}</p>
        <form
          id="export-form"
          encType="multipart/form-data"
          action={COURSEFLOW_APP.config.post_paths.get_export}
          method="POST"
          target="redirect-iframe"
          onSubmit={this.submit.bind(this)}
        >
          <input
            type="hidden"
            name="csrfmiddlewaretoken"
            value={window.getCsrfToken()}
          />
          <h4>{window.gettext('Export Type')}:</h4>
          {this.getExportTypes()}
          <h4>{window.gettext('Export Format')}:</h4>
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
        <div
          className="window-close-button"
          onClick={this.props.actionFunction}
        >
          <img src={COURSEFLOW_APP.config.icon_path + 'close.svg'} />
        </div>
      </div>
    )
  }
}

export default ExportMenu
