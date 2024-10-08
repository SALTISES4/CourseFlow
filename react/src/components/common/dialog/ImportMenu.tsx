import * as React from 'react'
// import $ from 'jquery'

type PropsType = {
  data: any
  actionFunction: any
}

class ImportMenu extends React.Component<PropsType> {
  constructor(props) {
    super(props)
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  submit(evt) {
    // @ts-ignore
    $('#submit-button').attr('disabled', true)
    setTimeout(() => {
      this.props.actionFunction()
      alert(
        window.gettext(
          'Your file has been submitted. Please wait while it is imported. You may close this message.'
        )
      )
    }, 100)
    return true
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    return (
      <div className="message-wrap">
        <h2>{window.gettext('Import Files')}</h2>
        <p>
          {window.gettext(
            'Use this menu to upload content in either .xls or .csv format. Ensure you have the correct format.'
          )}
        </p>
        <form
          encType="multipart/form-data"
          action={COURSEFLOW_APP.path.post_paths.import_data}
          method="POST"
          id="upload-form"
          target="redirect-iframe"
          onSubmit={this.submit.bind(this)}
        >
          <input
            type="hidden"
            name="csrfmiddlewaretoken"
            value={window.getCsrfToken()}
          />
          <input
            type="hidden"
            id="objectID"
            name="objectID"
            value={JSON.stringify(this.props.data.object_id)}
          />
          <input
            type="hidden"
            id="objectType"
            name="objectType"
            value={JSON.stringify(this.props.data.object_type)}
          />
          <input
            type="hidden"
            id="importType"
            name="importType"
            value={this.props.data.import_type}
          />
          <input
            type="file"
            id="myFile"
            name="myFile"
            accept=".xls, .xlsx, .csv"
            required
          />
          <input id="submit-button" type="submit" />
        </form>
        <iframe hidden name="redirect-iframe" id="redirect-iframe"></iframe>
        <p>
          {window.gettext(
            'The uploading process may take some time. It is not recommended to continue editing until it is complete.'
          )}
        </p>
        <div
          className="window-close-button"
          onClick={this.props.actionFunction}
        >
          <img src={COURSEFLOW_APP.path.static_assets.icon + 'close.svg'} />
        </div>
      </div>
    )
  }
}

export default ImportMenu
