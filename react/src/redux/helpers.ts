// @ts-nocheck
import * as Constants from '../constants'
import ActionCreator from "@cfRedux/ActionCreator"
import $ from 'jquery'

/**
 * Manages the current selection, ensuring we only have one at a time
 */
export class SelectionManager {
  private mouseClicked: boolean
  private readOnly: boolean
  private lastSidebarTab: number
  private currentSelection: any

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
  changeSelection(evt?: JQuery.Event, newSelection?: any): void {
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
    // Lock logic goes here, e.g.:
    // this.currentSelection.props.renderer.lock_update(...);
  }

  private unlockCurrentSelection(): void {
    // Unlock logic goes here, e.g.:
    // this.currentSelection.props.renderer.lock_update(...);
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

/**
 *
 *  @toggleDrop
 *
 *  Toggles whether an object is dropped. No longer sent to database.
 * @param objectID
 * @param objectType
 * @param is_dropped
 * @param dispatch
 * @param depth
 */
export function toggleDropReduxAction(
  objectID,
  objectType,
  is_dropped,
  dispatch,
  depth = 1
) {
  try {
    const default_drop = Constants.get_default_drop_state(
      objectID,
      objectType,
      depth
    )
    if (is_dropped !== default_drop)
      window.localStorage.setItem(objectType + objectID, is_dropped)
    else window.localStorage.removeItem(objectType + objectID)
  } catch (err) {
    if (
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    ) {
      window.localStorage.clear()
    }
  }
  dispatch(
    ActionCreator.changeField(objectID, objectType, { is_dropped: is_dropped })
  )
}
