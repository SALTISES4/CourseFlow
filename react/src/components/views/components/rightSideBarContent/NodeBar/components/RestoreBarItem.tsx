import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfEditableComponents/ComponentWithToggleDrop'
// import $ from 'jquery'
import * as React from 'react'
import { deleteSelfQueryLegacy, restoreSelfQueryLegacy } from '@XMLHTTP/API/delete'
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { _t } from '@cf/utility/utilityFunctions'

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
    return _t('Untitled')
  }

  restore() {
    this.setState({ disabled: true })
    COURSEFLOW_APP.tinyLoader.startLoad()
    restoreSelfQueryLegacy(this.props.data.id, this.props.objectType, () => {
      COURSEFLOW_APP.tinyLoader.endLoad()
    })
  }

  delete() {
    if (
      window.confirm(
        _t('Are you sure you want to permanently delete this object?')
      )
    ) {
      // @ts-ignore
      $(this.mainDiv.current).children('button').attr('disabled', true)
      COURSEFLOW_APP.tinyLoader.startLoad()
      deleteSelfQueryLegacy(this.props.data.id, this.props.objectType, false, () => {
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
          {_t('Deleted') + ' ' + this.props.data.deleted_on}
        </div>
        <button onClick={this.restore.bind(this)}>{_t('Restore')}</button>
        <button onClick={this.delete.bind(this)}>
          {_t('Permanently Delete')}
        </button>
      </div>
    )
  }
}

export default RestoreBarItem
