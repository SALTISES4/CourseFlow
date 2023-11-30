import * as React from 'react'
import { LiveProjectSection } from './LiveProjectSection.js'
import { StudentManagement } from '../../components/StudentManagement.js'

class LiveProjectStudents extends LiveProjectSection {
  render() {
    if (!this.state.data) return this.defaultRender()
    let liveproject = this.state.data.liveproject

    let register_link
    if (liveproject && liveproject.registration_hash) {
      let register_url = config.registration_path.replace(
        'project_hash',
        liveproject.registration_hash
      )
      register_link = (
        <div className="user-text">
          <div className="user-panel">
            <h4>Student Registration:</h4>
            <p>{gettext('Student Registration Link: ')}</p>
            <div>
              <img
                id="copy-text"
                className="hover-shade"
                onClick={() => {
                  navigator.clipboard.writeText(register_url)
                  $('#copy-text').attr(
                    'src',
                    config.icon_path + 'duplicate_checked.svg'
                  )
                  $('#url-text').text('Copied to Clipboard')
                  setTimeout(() => {
                    $('#copy-text').attr(
                      'src',
                      config.icon_path + 'duplicate_clipboard.svg'
                    )
                    $('#url-text').text(register_url)
                  }, 1000)
                }}
                title={gettext('Copy to clipboard')}
                src={config.icon_path + 'duplicate_clipboard.svg'}
              />
              <a id="url-text" className="selectable" href={register_url}>
                {register_url}
              </a>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="workflow-details">
        <StudentManagement data={this.state.data.liveproject} />
        {register_link}
      </div>
    )
  }
}

export default LiveProjectStudents
