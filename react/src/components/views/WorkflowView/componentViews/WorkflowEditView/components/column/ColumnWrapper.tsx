import { CfObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import SortableDragAndDropManager from '@cfEditableComponents/SortableDragAndDropManager.class'
import ActionCreator from '@cfRedux/ActionCreator'
import { getColumnById } from '@cfRedux/selectors/column.selector'
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
  onMovedIn(
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
const ColumnWrapper = ({ objectId, parentId }: OwnProps) => {
  const mainDivRef = useRef<HTMLDivElement>(null)
  /*******************************************************
   * HOOKS
   *******************************************************/
  const columnData = useSelector((state: AppState) =>
    getColumnById(state, objectId)
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

    columnWorkflowDragAndDropManager.makeSortableElement(
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

  /*******************************************************
   * RENDER
   *******************************************************/
  if (!columnData) {
    return <></>
  }

  return (
    <div
      className={clsx(`column-workflow`, `column-${objectId}`, {
        'no-drag': columnData.column?.noDrag
      })}
      ref={mainDivRef}
      id={String(objectId)}
      data-child-id={objectId}
    >
      <Column objectId={objectId} parentId={parentId} />
    </div>
  )
}

export default ColumnWrapper

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
