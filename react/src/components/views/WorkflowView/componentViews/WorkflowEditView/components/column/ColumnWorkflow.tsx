import { CfObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import SortableDragAndDropManager from '@cfEditableComponents/SortableDragAndDropManager.class'
import { TColumnWorkflowById, getColumnWorkflowByID } from '@cfFindState'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState } from '@cfRedux/types/type'
import { insertedAt } from '@XMLHTTP/postTemp'
import clsx from 'clsx'
import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

import Column from './Column'

// Define the props for the component
type OwnProps = {
  objectId: number
  parentId: number
}

class ColumnWorkflowDragAndDropManager extends SortableDragAndDropManager {
  stopSortFunction() {
    ThemeHelper.triggerHandlerEach($('.week .node'), 'component-updated')
  }

  /**
   * Overrides the sortableMovedFunction method from DragAndDropManager
   */
  sortableMovedFunction(
    id: number,
    newPosition: number,
    type: string,
    newParent: number,
    childId: number
  ) {
    this.context.editableMethods.microUpdate(
      ActionCreator.moveColumnWorkflow(id, newPosition, newParent, childId)
    )

    insertedAt(
      this.context.selectionManager,
      childId,
      CfObjectType.COLUMN,
      newParent,
      CfObjectType.WORKFLOW,
      newPosition,
      CfObjectType.COLUMNWORKFLOW
    )
  }
}

/**
 * this component should not exist...roll it column
 * and disambiguate parentId: column is not a 'child' of columnkflow
 **/
const ColumnWorkflow = ({ objectId, parentId }: OwnProps) => {
  const mainDivRef = useRef<HTMLDivElement>(null)
  /*******************************************************
   * HOOKS
   *******************************************************/
  const data = useSelector((state: AppState) =>
    getColumnWorkflowByID(state, objectId)
  )

  useEffect(() => {
    // do the edit permission check here

    const classIdentifiers = {
      objectClass: '.column-workflow',
      handle: '.column',
      container: '.column-row'
    }
    const columnWorkflowDragAndDropManager =
      new ColumnWorkflowDragAndDropManager({ objectId, parentId })
    const jQuerySortableBlockTarget = $('.column-row')
      .children(classIdentifiers.objectClass)
      .not('.ui-draggable')

    columnWorkflowDragAndDropManager.makeSortableNode(
      jQuerySortableBlockTarget,
      objectId,
      CfObjectType.COLUMNWORKFLOW,
      classIdentifiers.objectClass,
      'x',
      false,
      null,
      classIdentifiers.handle,
      classIdentifiers.container
    )
  }, [objectId, parentId])

  // Ref for the main div

  // Render
  if (!data) {
    return null // Handle case where data is not available
  }

  const columnWorkflow = data.data
  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <div
      className={clsx(`column-workflow`, `column-${columnWorkflow.id}`, {
        'no-drag': columnWorkflow.noDrag
      })}
      ref={mainDivRef}
      id={String(columnWorkflow.id)}
      data-child-id={columnWorkflow.column}
    >
      <Column
        objectId={columnWorkflow.column}
        parentId={parentId}
        throughParentId={columnWorkflow.id}
      />
    </div>
  )
}

export default ColumnWorkflow

// import { CfObjectType } from '@cf/types/enum'
// import { TColumnWorkflowById, getColumnWorkflowByID } from '@cfFindState'
// import { AppState } from '@cfRedux/types/type'
// import * as React from 'react'
// import { connect } from 'react-redux'
//
// import Column from './Column'
//
// type ConnectedProps = TColumnWorkflowById
// type OwnProps = {
//   objectId: number
//   parentId: number
// }
// type PropsType = ConnectedProps & OwnProps
//
// /**
//  * Represents the column-workflow throughmodel
//  */
// class ColumnWorkflow extends React.Component<PropsType> {
//   private objectType: CfObjectType
//   private objectClass: string
//   constructor(props) {
//     super(props)
//     this.objectType = CfObjectType.COLUMNWORKFLOW
//     this.objectClass = '.column-workflow'
//   }
//
//   makeDragAndDrop() {
//     this.makeSortableNode(
//       $('.column-row').children('.column-workflow').not('.ui-draggable'),
//       this.props.objectId,
//       'columnworkflow',
//       '.column-workflow',
//       // @ts-ignore
//       'x',
//       false,
//       null,
//       '.column',
//       '.column-row'
//     )
//   }
//
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     const data = this.props.data
//
//     const cssClasses = [
//       'column-workflow column-' + data.id,
//       data.noDrag ? 'no-drag' : ''
//     ].join(' ')
//
//     return (
//       <div
//         className={cssClasses}
//         // ref={this.mainDiv} // @todo mainDiv not defined
//         id={String(data.id)}
//         data-child-id={data.column}
//       >
//         <Column
//           objectId={data.column}
//           parentId={this.props.parentId}
//           throughParentId={data.id}
//         />
//       </div>
//     )
//   }
// }
// const mapColumnWorkflowStateToProps = (
//   state: AppState,
//   ownProps: OwnProps
// ): TColumnWorkflowById => {
//   return getColumnWorkflowByID(state, ownProps.objectId)
// }
// export default connect<ConnectedProps, object, OwnProps, AppState>(
//   mapColumnWorkflowStateToProps,
//   null
// )(ColumnWorkflow)
