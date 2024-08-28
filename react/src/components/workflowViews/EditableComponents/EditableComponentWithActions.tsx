import * as React from 'react'
import * as Constants from '@cfConstants'
import ActionButton from '@cfCommonComponents/UIComponents/ActionButton'
import EditableComponentWithComments, {
  EditableComponentWithCommentsStateType,
  EditableComponentWithCommentsType
} from './EditableComponentWithComments'
import { duplicateSelfQuery } from '@XMLHTTP/API/duplication'
import { deleteSelfQuery, restoreSelfQuery } from '@XMLHTTP/API/delete'
import { insertChildQuery, insertSiblingQuery } from '@XMLHTTP/API/create'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'

type OwnProps = {
  sibling_count?: any
  parentID?: any
} & EditableComponentWithCommentsType
export type EditableComponentWithActionsProps = OwnProps

type StateType = EditableComponentWithCommentsStateType
export type EditableComponentWithActionsState = StateType

/**
 * Extends the React component to add a few features that are used in a large number of components
 */
class EditableComponentWithActions<
  P extends OwnProps,
  S extends StateType
> extends EditableComponentWithComments<P, S> {
  static contextType = WorkFlowConfigContext

  declare context: React.ContextType<typeof WorkFlowConfigContext>

  restoreSelf(data) {
    COURSEFLOW_APP.tinyLoader.startLoad()
    restoreSelfQuery(
      data.id,
      Constants.object_dictionary[this.objectType],
      (response_data) => {
        COURSEFLOW_APP.tinyLoader.endLoad
      }
    )
  }

  deleteSelf(data) {
    //@todo Temporary confirmation; add better confirmation dialogue later
    if (this.context) {
      this.context.selectionManager.deleted(this)
    }

    if (
      (this.objectType === 'week' || this.objectType === 'column') &&
      this.props.sibling_count < 2
    ) {
      alert(window.gettext('You cannot delete the last ') + this.objectType)
      return
    }

    if (
      window.confirm(
        window.gettext('Are you sure you want to delete this ') +
          Constants.get_verbose(
            this.props.data,
            this.objectType
          ).toLowerCase() +
          '?'
      )
    ) {
      COURSEFLOW_APP.tinyLoader.startLoad()
      deleteSelfQuery(
        data.id,
        Constants.object_dictionary[this.objectType],
        true,
        (response_data) => {
          COURSEFLOW_APP.tinyLoader.endLoad()
        }
      )
    }
  }

  duplicateSelf(data) {
    const props = this.props
    const type = this.objectType
    COURSEFLOW_APP.tinyLoader.startLoad()
    duplicateSelfQuery(
      data.id,
      Constants.object_dictionary[type],
      this.props.parentID,
      Constants.parent_dictionary[type],
      Constants.through_parent_dictionary[type],
      (response_data) => {
        COURSEFLOW_APP.tinyLoader.endLoad()
      }
    )
  }

  insertSibling(data) {
    const type = this.objectType
    COURSEFLOW_APP.tinyLoader.startLoad()
    insertSiblingQuery(
      data.id,
      Constants.object_dictionary[type],
      this.props.parentID,
      Constants.parent_dictionary[type],
      Constants.through_parent_dictionary[type],
      (response_data) => {
        COURSEFLOW_APP.tinyLoader.endLoad()
      }
    )
  }

  insertChild(data) {
    const type = this.objectType
    COURSEFLOW_APP.tinyLoader.startLoad()
    insertChildQuery(
      data.id,
      Constants.object_dictionary[type],
      (response_data) => {
        COURSEFLOW_APP.tinyLoader.endLoad()
      }
    )
  }
  /*******************************************************
   * COMPONENTS
   *******************************************************/

  //Adds a button that restores the item.
  // addRestoreSelf(data, alt_icon) {
  //   const icon = alt_icon || 'restore.svg'
  //   return (
  //     <ActionButton
  //       buttonIcon={icon}
  //       buttonClass="delete-self-button"
  //       titleText={window.gettext('Restore')}
  //       handleClick={this.restoreSelf.bind(this, data)}
  //     />
  //   )
  // }

  //Adds a button that duplicates the item (with a confirmation).
  AddDuplicateSelf = ({ data }) => {
    return (
      <ActionButton
        buttonIcon="duplicate.svg"
        buttonClass="duplicate-self-button"
        titleText={window.gettext('Duplicate')}
        handleClick={this.duplicateSelf.bind(this, data)}
      />
    )
  }

  //Adds a button that inserts a child to them item
  AddInsertChild = ({ data }) => {
    return (
      <ActionButton
        buttonIcon="create_new_child.svg"
        buttonClass="insert-child-button"
        titleText={window.gettext('Insert Child')}
        handleClick={this.insertChild.bind(this, data)}
      />
    )
  }

  //Adds a button that inserts a sibling below the item.
  AddInsertSibling = ({ data }) => {
    return (
      <ActionButton
        buttonIcon="add_new.svg"
        buttonClass="insert-sibling-button"
        titleText={window.gettext('Insert Below')}
        handleClick={this.insertSibling.bind(this, data)}
      />
    )
  }

  //Adds a button that deletes the item (with a confirmation). The callback function is called after the object is removed from the DOM
  AddDeleteSelf = ({ data, alt_icon }: { data: any; alt_icon?: string }) => {
    const icon = alt_icon || 'rubbish.svg'
    return (
      <ActionButton
        buttonIcon={icon}
        buttonClass="delete-self-button"
        titleText={window.gettext('Delete')}
        handleClick={this.deleteSelf.bind(this, data)}
      />
    )
  }
}

export default EditableComponentWithActions
