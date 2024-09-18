// @ts-nocheck
import { _t } from '@cf/utility/utilityFunctions'
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
        _t(
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
        <h2>{_t('Import Files')}</h2>
        <p>
          {_t(
            'Use this menu to upload content in either .xls or .csv format. Ensure you have the correct format.'
          )}
        </p>
        <form
          encType="multipart/form-data"
          action={COURSEFLOW_APP.globalContextData.path.post_paths.import_data}
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
            id="objectId"
            name="objectId"
            value={JSON.stringify(this.props.data.objectId)}
          />
          <input
            type="hidden"
            id="objectType"
            name="objectType"
            value={JSON.stringify(this.props.data.objectType)}
          />
          <input
            type="hidden"
            id="importType"
            name="importType"
            value={this.props.data.importType}
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
          {_t(
            'The uploading process may take some time. It is not recommended to continue editing until it is complete.'
          )}
        </p>
        <div
          className="window-close-button"
          onClick={this.props.actionFunction}
        >
          <img
            src={
              COURSEFLOW_APP.globalContextData.path.static_assets.icon +
              'close.svg'
            }
          />
        </div>
      </div>
    )
  }
}

export default ImportMenu
