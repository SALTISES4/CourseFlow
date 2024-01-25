import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfParentComponents/ComponentWithToggleDrop'
// import $ from 'jquery'
import * as React from 'react'
import { deleteSelfQuery, restoreSelfQuery } from '@XMLHTTP/API/delete'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'

type OwnProps = {
  data: any
  objectType: any
  linked_workflow_data?: any
} & ComponentWithToggleProps

class RestoreBarItem extends ComponentWithToggleDrop<OwnProps> {
  static contextType = WorkFlowConfigContext

  declare context: React.ContextType<typeof WorkFlowConfigContext>
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getTitle() {
    if (this.props.data.title && this.props.data.title !== '')
      return this.props.data.title
    if (
      this.props.objectType == 'node' &&
      this.props.data.represents_workflow &&
      this.props.linked_workflow_data &&
      this.props.data.linked_workflow_data.title &&
      this.props.data.linked_workflow_data.title !== ''
    )
      return this.props.data.linked_workflow_data.title
    return window.gettext('Untitled')
  }

  restore() {
    this.setState({ disabled: true })
    COURSEFLOW_APP.tinyLoader.startLoad()
    restoreSelfQuery(this.props.data.id, this.props.objectType, () => {
      COURSEFLOW_APP.tinyLoader.endLoad()
    })
  }

  delete() {
    if (
      window.confirm(
        window.gettext(
          'Are you sure you want to permanently delete this object?'
        )
      )
    ) {
      // @ts-ignore
      $(this.mainDiv.current).children('button').attr('disabled', true)
      COURSEFLOW_APP.tinyLoader.startLoad()
      deleteSelfQuery(this.props.data.id, this.props.objectType, false, () => {
        COURSEFLOW_APP.tinyLoader.endLoad()
      })
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    return (
      <div ref={this.mainDiv} className="restore-bar-item">
        <div>{this.getTitle()}</div>
        <div className="workflow-created">
          {window.gettext('Deleted') + ' ' + this.props.data.deleted_on}
        </div>
        <button onClick={this.restore.bind(this)}>
          {window.gettext('Restore')}
        </button>
        <button onClick={this.delete.bind(this)}>
          {window.gettext('Permanently Delete')}
        </button>
      </div>
    )
  }
}

export default RestoreBarItem
