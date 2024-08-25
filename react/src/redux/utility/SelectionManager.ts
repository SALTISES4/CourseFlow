import React from 'react'
import { EventUnion } from '@cfModule/types/common'
import * as Constants from '@cfConstants'
import EditableComponent from '@cfEditableComponents/EditableComponent'
import {
  EditableComponentProps,
  EditableComponentStateType
} from '@cfEditableComponents/EditableComponent'

/**
 * Manages the current selection and locks it to prevent
 * other users from editing it.
 */
export class SelectionManager {
  private mouseClicked: boolean
  private readOnly: boolean
  private lastSidebarTab: number
  private currentSelection: null | EditableComponent<
    EditableComponentProps,
    EditableComponentStateType
  >

  constructor(readOnly: boolean) {
    this.currentSelection = null
    this.mouseClicked = false
    this.readOnly = readOnly
    this.setupEventListeners()
    this.lastSidebarTab = this.getActiveTab()
  }

  private setupEventListeners(): void {
    $(document).on('mousedown', () => {
      this.mouseClicked = true
      setTimeout(() => {
        this.mouseClicked = false
      }, 500)
    })

    $(document).on('mousemove', () => {
      this.mouseClicked = false
    })

    $(document).on('mouseup', (evt) => {
      if (this.mouseClicked) {
        this.changeSelection(evt)
      }
    })
  }

  private getActiveTab(): number {
    return $('#sidebar').tabs('option', 'active')
  }

  private setActiveTab(tabIndex: number): void {
    $('#sidebar').tabs('option', 'active', tabIndex)
  }

  private enableTab(tabIndex: number): void {
    $('#sidebar').tabs('enable', tabIndex)
  }

  private disableTab(tabIndex: number): void {
    $('#sidebar').tabs('disable', tabIndex)
  }

  /**
   * Changes the current selection to the new selection.
   * @param evt - The event that triggered the selection change.
   * @param newSelection - The new selection object.
   */
  changeSelection(
    evt?: EventUnion,
    newSelection?: null | EditableComponent<
      EditableComponentProps,
      EditableComponentStateType
    >
  ): void {
    if (evt) {
      evt.stopPropagation()
    }

    if (!this.readOnly && newSelection?.props?.data?.lock) {
      return
    }

    // Deselect current selection
    if (this.currentSelection) {
      this.deselectCurrentSelection()
    }

    console.log('newSelection')
    console.log(newSelection)

    // Select new selection
    this.currentSelection = newSelection
    if (this.currentSelection) {
      this.selectCurrentSelection()
    } else {
      this.resetSidebarTab()
    }
  }

  private deselectCurrentSelection(): void {
    this.currentSelection.setState({ selected: false })
    if (!this.readOnly) {
      this.unlockCurrentSelection()
    }
  }

  private selectCurrentSelection(): void {
    if (!this.readOnly) {
      this.lockCurrentSelection()
    }

    const SIDEBAR_FIRST_TAB_INDEX = 0
    if (this.getActiveTab() !== SIDEBAR_FIRST_TAB_INDEX) {
      this.lastSidebarTab = this.getActiveTab()
    }

    this.enableTab(SIDEBAR_FIRST_TAB_INDEX)
    this.setActiveTab(SIDEBAR_FIRST_TAB_INDEX)
    this.currentSelection.setState({ selected: true })
  }

  private resetSidebarTab(): void {
    const SIDEBAR_FIRST_TAB_INDEX = 0
    if (this.getActiveTab() === SIDEBAR_FIRST_TAB_INDEX) {
      this.setActiveTab(this.lastSidebarTab)
    }
    this.disableTab(SIDEBAR_FIRST_TAB_INDEX)
  }

  private lockCurrentSelection(): void {
    this.currentSelection.context.lock_update(
      {
        object_id: this.currentSelection.props.data.id,
        object_type:
          Constants.object_dictionary[this.currentSelection.objectType]
      },
      60 * 1000,
      true
    )
  }

  private unlockCurrentSelection(): void {
    this.currentSelection.context.lock_update(
      {
        object_id: this.currentSelection.props.data.id,
        object_type:
          Constants.object_dictionary[this.currentSelection.objectType]
      },
      60 * 1000,
      false
    )
  }

  /**
   * Handles the deletion of a selection.
   * @param selection - The selection to be deleted.
   */
  deleted(selection: any): void {
    if (selection === this.currentSelection) {
      this.changeSelection(null)
    }
  }
}

// export class SelectionManager {
//   constructor(read_only) {
//     this.currentSelection
//     this.mouse_isclick = false
//     this.read_only = read_only
//     var selector = this
//
//     $(document).on('mousedown', () => {
//       selector.mouse_isclick = true
//       setTimeout(() => {
//         selector.mouse_isclick = false
//       }, 500)
//     })
//
//     $(document).on('mousemove', () => {
//       selector.mouse_isclick = false
//     })
//
//     $(document).on('mouseup', (evt, newSelection) => {
//       if (selector.mouse_isclick) {
//         selector.changeSelection(evt, null)
//       }
//     })
//
//     this.last_sidebar_tab = $('#sidebar').tabs('option', 'active')
//   }
//
//   changeSelection(evt, newSelection) {
//     if (evt) {
//       evt.stopPropagation()
//     }
//
//     if (
//       !this.read_only &&
//       newSelection &&
//       newSelection.props.data &&
//       newSelection.props.data.lock
//     ) {
//       return
//     }
//
//     if (this.currentSelection) {
//       this.currentSelection.setState({ selected: false })
//       if (!this.read_only) {
//         this.currentSelection.props.renderer.lock_update(
//           {
//             object_id: this.currentSelection.props.data.id,
//             object_type:
//               Constants.object_dictionary[this.currentSelection.objectType]
//           },
//           60 * 1000,
//           false
//         )
//       }
//     }
//
//     this.currentSelection = newSelection
//
//     if (this.currentSelection) {
//       if (!this.read_only) {
//         this.currentSelection.props.renderer.lock_update(
//           {
//             object_id: this.currentSelection.props.data.id,
//             object_type:
//               Constants.object_dictionary[this.currentSelection.objectType]
//           },
//           60 * 1000,
//           true
//         )
//       }
//
//       if ($('#sidebar').tabs('option', 'active') !== 0) {
//         this.last_sidebar_tab = $('#sidebar').tabs('option', 'active')
//       }
//
//       $('#sidebar').tabs('enable', 0)
//       $('#sidebar').tabs('option', 'active', 0)
//       this.currentSelection.setState({ selected: true })
//     } else {
//       if ($('#sidebar').tabs('option', 'active') === 0) {
//         $('#sidebar').tabs('option', 'active', this.last_sidebar_tab)
//       }
//       $('#sidebar').tabs('disable', 0)
//     }
//   }
//
//   deleted(selection) {
//     if (selection === this.currentSelection) {
//       this.changeSelection(null, null)
//     }
//   }
// }
