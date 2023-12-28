import * as React from 'react'
import * as Constants from '@cfConstants'
import ActionButton from '@cfUIComponents/ActionButton'
import {
  deleteSelfQuery,
  duplicateSelf,
  insertChild,
  insertSibling,
  restoreSelfQuery
} from '@XMLHTTP/PostFunctions'
import EditableComponentWithComments from './EditableComponentWithComments'

//Extends the react component to add a few features that are used in a large number of components
class EditableComponentWithActions extends EditableComponentWithComments {
  //Adds a button that restores the item.
  addRestoreSelf(data, alt_icon) {
    let icon = alt_icon || 'restore.svg'
    return (
      <ActionButton
        buttonIcon={icon}
        buttonClass="delete-self-button"
        titleText={window.gettext('Restore')}
        handleClick={this.restoreSelf.bind(this, data)}
      />
    )
  }

  restoreSelf(data) {
    var props = this.props
    props.renderer.tiny_loader.startLoad()
    restoreSelfQuery(
      data.id,
      Constants.object_dictionary[this.objectType],
      (response_data) => {
        props.renderer.tiny_loader.endLoad()
      }
    )
  }

  //Adds a button that deletes the item (with a confirmation). The callback function is called after the object is removed from the DOM
  addDeleteSelf(data, alt_icon) {
    let icon = alt_icon || 'rubbish.svg'
    return (
      <ActionButton
        buttonIcon={icon}
        buttonClass="delete-self-button"
        titleText={window.gettext('Delete')}
        handleClick={this.deleteSelf.bind(this, data)}
      />
    )
  }

  deleteSelf(data) {
    var props = this.props
    //Temporary confirmation; add better confirmation dialogue later
    if (this.props.renderer) this.props.renderer.selection_manager.deleted(this)
    if (
      (this.objectType == 'week' || this.objectType == 'column') &&
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
      props.renderer.tiny_loader.startLoad()
      deleteSelfQuery(
        data.id,
        Constants.object_dictionary[this.objectType],
        true,
        (response_data) => {
          props.renderer.tiny_loader.endLoad()
        }
      )
    }
  }

  //Adds a button that duplicates the item (with a confirmation).
  addDuplicateSelf(data) {
    return (
      <ActionButton
        buttonIcon="duplicate.svg"
        buttonClass="duplicate-self-button"
        titleText={window.gettext('Duplicate')}
        handleClick={this.duplicateSelf.bind(this, data)}
      />
    )
  }

  duplicateSelf(data) {
    var props = this.props
    var type = this.objectType
    props.renderer.tiny_loader.startLoad()
    duplicateSelf(
      data.id,
      Constants.object_dictionary[type],
      props.parentID,
      Constants.parent_dictionary[type],
      Constants.through_parent_dictionary[type],
      (response_data) => {
        props.renderer.tiny_loader.endLoad()
      }
    )
  }

  //Adds a button that inserts a sibling below the item.
  addInsertSibling(data) {
    return (
      <ActionButton
        buttonIcon="add_new.svg"
        buttonClass="insert-sibling-button"
        titleText={window.gettext('Insert Below')}
        handleClick={this.insertSibling.bind(this, data)}
      />
    )
  }

  insertSibling(data) {
    var props = this.props
    var type = this.objectType
    props.renderer.tiny_loader.startLoad()
    insertSibling(
      data.id,
      Constants.object_dictionary[type],
      props.parentID,
      Constants.parent_dictionary[type],
      Constants.through_parent_dictionary[type],
      (response_data) => {
        props.renderer.tiny_loader.endLoad()
      }
    )
  }

  //Adds a button that inserts a child to them item
  addInsertChild(data) {
    return (
      <ActionButton
        buttonIcon="create_new_child.svg"
        buttonClass="insert-child-button"
        titleText={window.gettext('Insert Child')}
        handleClick={this.insertChild.bind(this, data)}
      />
    )
  }

  insertChild(data) {
    var props = this.props
    var type = this.objectType
    props.renderer.tiny_loader.startLoad()
    insertChild(data.id, Constants.object_dictionary[type], (response_data) => {
      props.renderer.tiny_loader.endLoad()
    })
  }
}

export default EditableComponentWithActions