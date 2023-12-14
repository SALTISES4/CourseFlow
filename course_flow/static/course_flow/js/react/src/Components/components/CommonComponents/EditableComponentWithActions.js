import * as React from 'react'
import * as Constants from '@cfConstants'
import ActionButton from './ActionButton.js'
import {
  deleteSelf,
  duplicateSelf,
  insertChild,
  insertSibling,
  restoreSelf
} from '@cfPostFunctions'
import EditableComponentWithComments from './EditableComponentWithComments.js'

//Extends the react component to add a few features that are used in a large number of components
class EditableComponentWithActions extends EditableComponentWithComments {
  //Adds a button that restores the item.
  addRestoreSelf(data, alt_icon) {
    let icon = alt_icon || 'restore.svg'
    return (
      <ActionButton
        button_icon={icon}
        button_class="delete-self-button"
        titletext={gettext('Restore')}
        handleClick={this.restoreSelf.bind(this, data)}
      />
    )
  }

  restoreSelf(data) {
    var props = this.props
    props.renderer.tiny_loader.startLoad()
    restoreSelf(
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
        button_icon={icon}
        button_class="delete-self-button"
        titletext={gettext('Delete')}
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
      alert(gettext('You cannot delete the last ') + this.objectType)
      return
    }
    if (
      window.confirm(
        gettext('Are you sure you want to delete this ') +
          Constants.get_verbose(
            this.props.data,
            this.objectType
          ).toLowerCase() +
          '?'
      )
    ) {
      props.renderer.tiny_loader.startLoad()
      deleteSelf(
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
        button_icon="duplicate.svg"
        button_class="duplicate-self-button"
        titletext={gettext('Duplicate')}
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
        button_icon="add_new.svg"
        button_class="insert-sibling-button"
        titletext={gettext('Insert Below')}
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
        button_icon="create_new_child.svg"
        button_class="insert-child-button"
        titletext={gettext('Insert Child')}
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
