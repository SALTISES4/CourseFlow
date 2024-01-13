// @ts-nocheck
import * as React from 'react'

import { connect } from 'react-redux'
import ComponentWithToggleDrop from '@cfParentComponents/ComponentWithToggleDrop'
import * as Constants from '@cfConstants'
import { getColumnByID } from '@cfFindState'
import $ from 'jquery'

/**
 * Can be dragged and dropped into the workflow space to create
 * a node of the corresponding column. The actual dropping functionality
 * is handled in the Week component, not here.
 */
class NodeBarColumnUnconnected extends ComponentWithToggleDrop {
  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.makeDraggable()
    $(this.mainDiv.current)[0].dataDraggable = {
      column: this.props.data.id,
      column_type: null
    }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  makeDraggable() {
    const draggable_selector = 'node-week'
    const draggable_type = 'nodeweek'
    $(this.mainDiv?.current).draggable({
      helper: (_e, _item) => {
        const helper = $(document.createElement('div'))
        helper.addClass('node-ghost')
        helper.appendTo(document.body)
        return helper
      },
      cursor: 'move',
      cursorAt: { top: 20, left: 100 },
      distance: 10,
      start: (_e, _ui) => {
        $('.workflow-canvas').addClass('dragging-' + draggable_type)
        $(draggable_selector).addClass('dragging')
      },
      stop: (_e, _ui) => {
        $('.workflow-canvas').removeClass('dragging-' + draggable_type)
        $(draggable_selector).removeClass('dragging')
      }
    })
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const title = data ? data.title || data.column_type_display : undefined

    return (
      <div
        dangerouslySetInnerHTML={{ __html: title }}
        className={
          'new-node node-bar-column node-bar-sortable column-' +
          this.props.objectID
        }
        ref={this.mainDiv}
        style={{ backgroundColor: Constants.getColumnColour(data) }}
      />
    )
  }
}

/**
 * As the NodeBarColumn component, but creates a new column.
 * @todo having a component class that is both connected and unconnected being extended from is too complicated
 * to type properly
 * simplify this
 */
export class NodeBarColumnCreator extends NodeBarColumnUnconnected {
  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.makeDraggable()
    $(this.mainDiv.current)[0].dataDraggable = {
      column: null,
      column_type: this.props.columnType
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const choice = this.props.columnChoices.find(
      (choice) => choice.type === this.props.columnType
    )
    const title = choice ? `New ${choice.name}` : 'New'

    return (
      <div
        className="new-node new-column node-bar-column node-bar-sortable"
        ref={this.mainDiv}
      >
        {title}
      </div>
    )
  }
}

const mapColumnStateToProps = (state, own_props) =>
  getColumnByID(state, own_props.objectID)

export const NodeBarColumn = connect(
  mapColumnStateToProps,
  null
)(NodeBarColumnUnconnected)
