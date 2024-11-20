import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import useHover from '@cf/hooks/useHover'
import { CfObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import { HoverMenu, MenuItemType } from '@cfComponents/menu/Menu'
import SortableDragAndDropManager from '@cfEditableComponents/SortableDragAndDropManager.class'
import ActionCreator from '@cfRedux/ActionCreator'
import { selectWeekById } from '@cfRedux/selectors/week.selector'
import { AppState } from '@cfRedux/types/type'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import DeleteIcon from '@mui/icons-material/Delete'
import DragHandleIcon from '@mui/icons-material/DragHandle'
import QueueIcon from '@mui/icons-material/Queue'
import {
  useCreateWeekMutation,
  useDeleteWeekMutation
} from '@XMLHTTP/API/workflowObjects/week.rtk'
import { insertedAt } from '@XMLHTTP/postTemp'
import clsx from 'clsx'
import mergeRefs from 'merge-refs'
import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

import Term from './Term'
import Week from './Week'

type PropsType = {
  condensed: boolean
  objectId: number
  parentId: number
}

/*******************************************************
 * DEPRECATED
 * KEEP FOR REFERENCE
 *  call backs like microUpdate abd  insertedAt not yet migrated
 *******************************************************/
// class WeekWorkflowDragAndDropManager extends SortableDragAndDropManager {
//   stopSortFunction() {
//     ThemeHelper.triggerHandlerEach($('.week .node'), 'component-updated')
//   }
//
//   /**
//    * Overrides the sortableMovedFunction method from DragAndDropManager
//    */
//   onMovedIn(
//     id: number,
//     newPosition: number,
//     type: string,
//     newParent: number,
//     childId: number
//   ) {
//     this.context.editableMethods.microUpdate(
//       ActionCreator.moveColumnWorkflow(id, newPosition, newParent, childId)
//     )
//
//     insertedAt(
//       this.context.selectionManager,
//       childId,
//       CfObjectType.COLUMN,
//       newParent,
//       CfObjectType.WORKFLOW,
//       newPosition,
//       CfObjectType.COLUMNWORKFLOW
//     )
//   }
// }

/**
 *
 **/
const WeekHoverMenu = ({
  objectId,
  order,
  show
}: {
  objectId: number
  order: number
  show: boolean
}) => {
  /*******************************************************
   * API HOOKS
   *******************************************************/
  const { onError, onSuccess } = useGenericMsgHandler()

  const [
    createMutate,
    { isSuccess: createSuccess, isError: createError, data: createData }
  ] = useCreateWeekMutation()

  const [
    deleteMutate,
    { isSuccess: deleteSuccess, isError: deleteError, data: deleteData }
  ] = useDeleteWeekMutation()

  const createButtonHandler = async () => {
    try {
      const resp = await createMutate({
        payload: {
          rank: order + 1
        }
      }).unwrap()
      onSuccess(resp)
    } catch (e) {
      onError(e)
    }
  }

  const deleteButtonHandler = async () => {
    try {
      const resp = await deleteMutate({
        id: objectId
      }).unwrap()
      onSuccess(resp)
    } catch (e) {
      onError(e)
    }
  }

  const menuItems: MenuItemType[] = [
    {
      content: _t('Delete'),
      action: () => deleteButtonHandler(CfObjectType.WEEK),
      icon: <DeleteIcon />,
      show: true
    },
    {
      content: _t('Insert New'),
      action: () => createButtonHandler(CfObjectType.WEEK),
      icon: <QueueIcon />,
      show: true
    }
  ]
  /*******************************************************
   * RENDER
   *******************************************************/

  if (!show) {
    return <></>
  }

  return (
    <>
      <HoverMenu
        id="hover-menu"
        data-test-id="hover-menu"
        menuItems={menuItems}
      />
    </>
  )
}

/**
 * this component should not exist...roll it into week
 * and disambiguate parentId: week is not a 'child' of weekworkflow
 **/
const WeekWrapper = ({ condensed, objectId, parentId }: PropsType) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: objectId })

  const [ref, isHovered] = useHover()

  /*******************************************************
   * REDUX
   *******************************************************/
  const weekData = useSelector((state: AppState) =>
    selectWeekById(state, objectId)
  )

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  /**
   * Choose between standard Week and term (for workflow type program)
    @todo investigate this switch
  it doesn't make sense why is term (label for program week) being used for the UI dropped view (as in drop down drawer)
    **/
  const WeekChooser = () => {
    if (condensed) {
      return (
        <Term
          objectId={objectId}
          //  rank={weekData.order.indexOf(weekData.week.id)}
          parentId={parentId}
        />
      )
    }
    return <Week objectId={objectId} parentId={parentId} />
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  const style = {
    position: 'relative',
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      id={'week-block-' + String(objectId)}
      style={style}
      {...attributes}
      className={clsx('week-workflow', {
        // legacy name of through model, still being used for jquery drag and drop i think
        //   'no-drag': weekData.week?.noDrag, // find out about noDrag
        //  dragging: mainDiv.current?.classList.contains('dragging')
      })}
      ref={mergeRefs(setNodeRef, ref)}
      data-scroll-to-id={'week-block-' + String(objectId)}
      data-child-id={objectId}
    >
      {/*
      Need to solve this
      drag n drop sort zone take over whole object and hides inside click event  (hover menu etc)
      */}
      <div {...listeners}>
        <DragHandleIcon />
      </div>
      <WeekChooser />
      <WeekHoverMenu show={isHovered} />
    </div>
  )
}

export default WeekWrapper

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
