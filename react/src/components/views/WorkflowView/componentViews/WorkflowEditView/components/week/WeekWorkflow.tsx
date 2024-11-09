import { CfObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import SortableDragAndDropManager from '@cfEditableComponents/SortableDragAndDropManager.class'
import { getWeekWorkflowByID } from '@cfFindState'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState } from '@cfRedux/types/type'
import { insertedAt } from '@XMLHTTP/postTemp'
import clsx from 'clsx'
import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

import Term from './Term'
import Week from './Week'

type PropsType = {
  condensed: boolean
  objectId: number
  parentId: number
}

class WeekWorkflowDragAndDropManager extends SortableDragAndDropManager {
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
 * this component should not exist...roll it into week
 * and disambiguate parentId: week is not a 'child' of weekworkflow
 **/
const WeekWorkflow = ({ condensed, objectId, parentId }: PropsType) => {
  const mainDiv = useRef<HTMLDivElement>(null)
  /*******************************************************
   * HOOKS
   *******************************************************/
  const weekWorkflow = useSelector((state: AppState) =>
    getWeekWorkflowByID(state, objectId)
  )

  useEffect(() => {
    const classIdentifiers = {
      objectClass: '.week-workflow',
      handle: '.week',
      container: '.week-block'
    }

    const weekWorkflowDragAndDropManager = new WeekWorkflowDragAndDropManager({
      objectId,
      parentId
    })

    const jQuerySortableBlockTarget = $('.week-block')
      .children('.week-workflow')
      .not('.ui-draggable')

    weekWorkflowDragAndDropManager.makeSortableNode(
      jQuerySortableBlockTarget,
      objectId,
      CfObjectType.WEEKWORKFLOW,
      classIdentifiers.objectClass,
      'y',
      false,
      null,
      classIdentifiers.handle,
      classIdentifiers.container
    )
  }, [objectId, parentId])

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const WeekWrapper = () => {
    // investigate this switch it doesn't make sense why is term (label for program week) being used for the UI dropped view (as in drop down drawer)
    if (condensed) {
      return (
        <Term
          objectId={weekWorkflow.data.week}
          rank={weekWorkflow.order.indexOf(weekWorkflow.data.id)}
          parentId={parentId}
          throughParentId={weekWorkflow.data.id}
        />
      )
    }
    return (
      <Week
        objectId={weekWorkflow.data.week}
        rank={weekWorkflow.order.indexOf(weekWorkflow.data.id)}
        parentId={parentId}
        throughParentId={weekWorkflow.data.id}
      />
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/

  return (
    <div
      className={clsx('week-workflow', {
        'no-drag': weekWorkflow.data.noDrag,
        dragging: mainDiv.current?.classList.contains('dragging')
      })}
      id={String(weekWorkflow.data.id)}
      ref={mainDiv}
      data-child-id={weekWorkflow.data.week}
    >
      <WeekWrapper />
    </div>
  )
}

export default WeekWorkflow

// import { CfObjectType } from '@cf/types/enum'
// import { TGetWeekWorkflowById, getWeekWorkflowByID } from '@cfFindState'
// import { AppState } from '@cfRedux/types/type'
// import React from 'react'
// import { connect } from 'react-redux'
//
// import Term from './Term'
// import Week from './Week'
//
// type ConnectedProps = TGetWeekWorkflowById
// type OwnProps = {
//   condensed: boolean
//   objectId: number
//   parentId: number
// }
//
// export type WeekWorkflowUnconnectedProps = OwnProps
// type PropsType = OwnProps & ConnectedProps
//
// /**
//  * The week-workflow throughmodel
//  */
// class WeekWorkflowUnconnected<P extends PropsType> extends React.Component<P> {
//   mainDiv: React.RefObject<HTMLDivElement>
//   objectType: CfObjectType
//   protected objectClass: string
//
//   constructor(props: P) {
//     super(props)
//     this.objectType = CfObjectType.WEEKWORKFLOW
//     this.objectClass = '.week-workflow'
//     this.mainDiv = React.createRef()
//   }
//   /*******************************************************
//    * COMPONENTS
//    *******************************************************/
//   WeekWrapper = () => {
//     const data = this.props.data
//     if (this.props.condensed) {
//       return (
//         <Term
//           objectId={data.week}
//           rank={this.props.order.indexOf(data.id)}
//           parentId={this.props.parentId}
//           throughParentId={data.id}
//         />
//       )
//     }
//
//     return (
//       <Week
//         objectId={data.week}
//         rank={this.props.order.indexOf(data.id)}
//         parentId={this.props.parentId}
//         throughParentId={data.id}
//       />
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
//       'week-workflow',
//       data.noDrag ? 'no-drag' : '',
//       $(this.mainDiv?.current).hasClass('dragging') ? 'dragging' : ''
//     ].join(' ')
//
//     return (
//       <div
//         className={cssClasses}
//         id={String(data.id)}
//         ref={this.mainDiv}
//         data-child-id={data.week}
//       >
//         <this.WeekWrapper />
//       </div>
//     )
//   }
// }
// const mapWeekWorkflowStateToProps = (
//   state: AppState,
//   ownProps: OwnProps
// ): TGetWeekWorkflowById => {
//   return getWeekWorkflowByID(state, ownProps.objectId)
// }
//
// const WeekWorkflow = connect<ConnectedProps, object, OwnProps, AppState>(
//   mapWeekWorkflowStateToProps,
//   null
// )(WeekWorkflowUnconnected)
//
// export default WeekWorkflow
// export { WeekWorkflowUnconnected }
