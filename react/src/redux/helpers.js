import React from 'react'
import * as Constants from '../constants.js'

/**
 * Manages the current selection, ensuring we only have one at a time
 */
export class SelectionManager {
  constructor(read_only) {
    this.currentSelection
    this.mouse_isclick = false
    this.read_only = read_only
    var selector = this

    $(document).on('mousedown', () => {
      selector.mouse_isclick = true
      setTimeout(() => {
        selector.mouse_isclick = false
      }, 500)
    })

    $(document).on('mousemove', () => {
      selector.mouse_isclick = false
    })

    $(document).on('mouseup', (evt, newSelection) => {
      if (selector.mouse_isclick) {
        selector.changeSelection(evt, null)
      }
    })

    this.last_sidebar_tab = $('#sidebar').tabs('option', 'active')
  }

  changeSelection(evt, newSelection) {
    if (evt) {
      evt.stopPropagation()
    }

    if (
      !this.read_only &&
      newSelection &&
      newSelection.props.data &&
      newSelection.props.data.lock
    ) {
      return
    }

    if (this.currentSelection) {
      this.currentSelection.setState({ selected: false })
      if (!this.read_only) {
        this.currentSelection.props.renderer.lock_update(
          {
            object_id: this.currentSelection.props.data.id,
            object_type:
              Constants.object_dictionary[this.currentSelection.objectType]
          },
          60 * 1000,
          false
        )
      }
    }

    this.currentSelection = newSelection

    if (this.currentSelection) {
      if (!this.read_only) {
        this.currentSelection.props.renderer.lock_update(
          {
            object_id: this.currentSelection.props.data.id,
            object_type:
              Constants.object_dictionary[this.currentSelection.objectType]
          },
          60 * 1000,
          true
        )
      }

      if ($('#sidebar').tabs('option', 'active') !== 0) {
        this.last_sidebar_tab = $('#sidebar').tabs('option', 'active')
      }

      $('#sidebar').tabs('enable', 0)
      $('#sidebar').tabs('option', 'active', 0)
      this.currentSelection.setState({ selected: true })
    } else {
      if ($('#sidebar').tabs('option', 'active') === 0) {
        $('#sidebar').tabs('option', 'active', this.last_sidebar_tab)
      }
      $('#sidebar').tabs('disable', 0)
    }
  }

  deleted(selection) {
    if (selection === this.currentSelection) {
      this.changeSelection(null, null)
    }
  }
}

// @todo this should be a component with managed state
export class TinyLoader {
  constructor(identifier) {
    this.identifier = identifier
    this.loadings = 0
  }

  startLoad() {
    $(this.identifier).addClass('waiting')
    this.loadings++
  }

  endLoad() {
    if (this.loadings > 0) {
      this.loadings--
    }

    if (this.loadings <= 0) {
      $(this.identifier).removeClass('waiting')
    }
  }
}
