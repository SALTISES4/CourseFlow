import { EventUnion } from '@cf/types/common'
import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cfConstants'
import EditableComponent from '@cfEditableComponents/EditableComponent'
import {
  EditableComponentProps,
  EditableComponentStateType
} from '@cfEditableComponents/EditableComponent'
import React from 'react'

type CurrentSelectionDataType = {
  hash: ''
  id: number
  contentType: CfObjectType.WEEK
}

/**
 * Manages the current selection and locks it to prevent
 * other users from editing it.
 */
export class SelectionManager {
  private mouseClicked: boolean = false
  private readOnly: boolean
  private currentSelectionData: CurrentSelectionDataType
  // private lastSidebarTab: number
  private currentSelection: null | EditableComponent<
    EditableComponentProps,
    EditableComponentStateType
  >

  constructor(readOnly: boolean) {
    this.currentSelection = null
    this.mouseClicked = false
    this.readOnly = readOnly
    this.setupEventListeners()
    // this.lastSidebarTab = this.getActiveTab()
  }

  private setupEventListeners(): void {
    document.addEventListener('mousedown', this.handleMouseDown)
    document.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('mouseup', this.handleMouseUp)
  }

  // Optional cleanup for event listeners
  public removeEventListeners(): void {
    document.removeEventListener('mousedown', this.handleMouseDown)
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
  }

  private handleMouseDown = (): void => {
    this.mouseClicked = true
    setTimeout(() => {
      this.mouseClicked = false
    }, 500)
  }

  private handleMouseMove = (): void => {
    this.mouseClicked = false
  }

  /*
  @todo what is this one for?
  maybe to clear the section if the 2nd param of   changeSelection is not defined ?
  bad
  * */
  private handleMouseUp = (evt: MouseEvent): void => {
    if (this.mouseClicked) {
      this.changeSelection({ evt })
    }
  }

  // private resetSidebarTab(): void {
  //   const SIDEBAR_FIRST_TAB_INDEX = 0
  //   if (this.getActiveTab() === SIDEBAR_FIRST_TAB_INDEX) {
  //     this.setActiveTab(this.lastSidebarTab)
  //   }
  //   this.disableTab(SIDEBAR_FIRST_TAB_INDEX)
  // }

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

    // const SIDEBAR_FIRST_TAB_INDEX = 0
    // if (this.getActiveTab() !== SIDEBAR_FIRST_TAB_INDEX) {
    //   this.lastSidebarTab = this.getActiveTab()
    // }

    // this.enableTab(SIDEBAR_FIRST_TAB_INDEX)
    // this.setActiveTab(SIDEBAR_FIRST_TAB_INDEX)

    // this is passing in the full selected object and then setting the object state
    // feels bad
    // alt:
    // set the hash into context or whatever
    // have the component listen to that state fop its own hash

    //
    this.currentSelection.setState({ selected: true })
  }

  private lockCurrentSelection(): void {
    this.currentSelection.context.editableMethods.lockUpdate(
      {
        objectId: this.currentSelection.props.data.id,
        objectType: Constants.objectDictionary[this.currentSelection.objectType]
      },
      60 * 1000,
      true
    )
  }

  private unlockCurrentSelection(): void {
    this.currentSelection.context.editableMethods.lockUpdate(
      {
        objectId: this.currentSelection.props.data.id,
        objectType: Constants.objectDictionary[this.currentSelection.objectType]
      },
      60 * 1000,
      false
    )
  }

  // private getActiveTab(): number {
  //   return $('#sidebar').tabs('option', 'active')
  // }
  //
  // private setActiveTab(tabIndex: number): void {
  //   $('#sidebar').tabs('option', 'active', tabIndex)
  // }
  //
  // private enableTab(tabIndex: number): void {
  //   $('#sidebar').tabs('enable', tabIndex)
  // }
  //
  // private disableTab(tabIndex: number): void {
  //   $('#sidebar').tabs('disable', tabIndex)
  // }

  /**
   * Changes the current selection to the new selection.
   * @param evt - The event that triggered the selection change.
   * @param newSelection - The new selection object.
   */
  public changeSelection({
    evt,
    newSelection,
    payload
  }: {
    evt?: EventUnion
    newSelection?: null | EditableComponent<
      EditableComponentProps,
      EditableComponentStateType
    >
    payload?: any
  }): void {
    console.log('changeSelection')
    console.log(newSelection)
    console.log(evt)

    if (evt) {
      evt.stopPropagation()
    }

    //keep this check for readonly but this.readonly is not being set properly i guess
    // if (this.readOnly || newSelection?.props?.data?.lock) {
    if (newSelection?.props?.data?.lock) {
      return
    }

    // Deselect current selection
    if (this.currentSelection) {
      this.deselectCurrentSelection()
    }

    // Select new selection
    if (newSelection) {
      this.currentSelection = newSelection
      this.selectCurrentSelection()
    } else {
      this.deselectCurrentSelection()
    }

    // new part:
    if (payload) {
      this.currentSelectionData = payload
    }
  }

  public getCurrentSelectionData(): CurrentSelectionDataType {
    return this.currentSelectionData
  }

  /**
   * Handles the deletion of a selection.
   * @param selection - The selection to be deleted.
   * @todo i don't think this is ever used, it can be used to reset the selection
   */
  // deleted(selection: any): void {
  //   if (selection === this.currentSelection) {
  //     this.changeSelection(null)
  //   }
  // }
}
