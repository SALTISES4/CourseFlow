import * as React from 'react'
import * as reactDom from 'react-dom'
import WorkflowsMenu from '../dialog/WorkflowsMenu'
import { Dialog, DialogTitle } from '@mui/material'
import $ from 'jquery'

/**
 *
 * @todo we need a context driven modal to handle this
 *  component should be passed to the modal
 *  the modal should not be aware of context
 *
 *  // legacy comment
 * Creates a message box with a screen barrier for popups.
 * The choice of which menu is displayed is determined by props.message_type.
 *
 */
export class MessageBox extends React.Component {
  getMenu = () => {
    switch (this.props.message_type) {
      case 'linked_workflow_menu':
      case 'target_project_menu':
      case 'added_workflow_menu':
      case 'workflow_select_menu':
        return (
          <WorkflowsMenu
            type={this.props.message_type}
            data={this.props.message_data}
            actionFunction={this.props.actionFunction}
          />
        )
      // case 'project_edit_menu':
      //   return (
      //     <ProjectEditMenu
      //       type={this.props.message_type}
      //       data={this.props.message_data}
      //       actionFunction={this.props.actionFunction}
      //     />
      //   )
      // case 'share_menu':
      //   return (
      //     <ShareMenu
      //       data={this.props.message_data}
      //       actionFunction={this.props.actionFunction}
      //     />
      //   )
      // case 'import':
      //   return (
      //     <ImportMenu
      //       data={this.props.message_data}
      //       actionFunction={this.props.actionFunction}
      //     />
      //   )
      // case 'export':
      //   return (
      //     <ExportMenu
      //       data={this.props.message_data}
      //       actionFunction={this.props.actionFunction}
      //     />
      //   )

      default:
        return <></>
    }
  }

  render() {
    return (
      <div className="screen-barrier" onClick={(evt) => evt.stopPropagation()}>
        <div className={'message-box ' + this.props.message_type}>
          {this.getMenu()}
        </div>
      </div>
    )
  }
}

/*
Function calls to create or unmount the popup box.
*/
export function renderMessageBox(data, type, updateFunction) {
  reactDom.render(
    <MessageBox
      message_data={data}
      message_type={type}
      actionFunction={updateFunction}
    />,
    $('#popup-container')[0]
  )
}
