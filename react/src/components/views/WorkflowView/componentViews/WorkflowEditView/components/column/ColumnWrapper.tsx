import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import useHover from '@cf/hooks/useHover'
import { CfObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import { HoverMenu, MenuItemType } from '@cfComponents/menu/Menu'
import SortableDragAndDropManager from '@cfEditableComponents/SortableDragAndDropManager.class'
import ActionCreator from '@cfRedux/ActionCreator'
import { selectColumnById } from '@cfRedux/selectors/column.selector'
import { AppState } from '@cfRedux/types/type'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import DeleteIcon from '@mui/icons-material/Delete'
import DragHandleIcon from '@mui/icons-material/DragHandle'
import QueueIcon from '@mui/icons-material/Queue'
import {
  useCreateColumnMutation,
  useDeleteColumnMutation
} from '@XMLHTTP/API/workflowObjects/column.rtk'
import { insertedAt } from '@XMLHTTP/postTemp'
import clsx from 'clsx'
import mergeRefs from "merge-refs";
import { Ref } from 'react'
import { useSelector } from 'react-redux'

import Column from './Column'

// Define the props for the component
type OwnProps = {
  objectId: number
  parentId: number
}

// class ColumnWorkflowDragAndDropManager extends SortableDragAndDropManager {
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

const ColumnHoverMenu = ({
  objectId,
  order,
  show
}: {
  objectId: number
  order: number,
  show: boolean
}) => {
  /*******************************************************
   * API HOOKS
   *******************************************************/
  const { onError, onSuccess } = useGenericMsgHandler()

  const [createMutate] = useCreateColumnMutation()

  const [deleteMutate] = useDeleteColumnMutation()

  const createButtonHandler = async (type: CfObjectType) => {
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
      action: () => deleteButtonHandler(),
      icon: <DeleteIcon />,
      show: true
    },
    {
      content: _t('Insert New'),
      action: () => createButtonHandler(CfObjectType.COLUMN),
      icon: <QueueIcon />,
      show: true
    }
  ]

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
 * this component should not exist...roll it column
 * and disambiguate parentId: column is not a 'child' of columnkflow
 **/
const ColumnWrapper = ({ objectId, parentId }: OwnProps) => {
  //  const mainDivRef = useRef<HTMLDivElement>(null)
  /*******************************************************
   * HOOKS
   *******************************************************/
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: objectId })
  const columnData = useSelector((state: AppState) =>
    selectColumnById(state, objectId)
  )
  const [ref, isHovered] = useHover()

  // useEffect(() => {
  //   // do the edit permission check here
  //
  //   const classIdentifiers = {
  //     objectClass: '.column-workflow',
  //     handle: '.column',
  //     container: '.column-row'
  //   }
  //   const columnWorkflowDragAndDropManager =
  //     new ColumnWorkflowDragAndDropManager({ objectId, parentId })
  //   const jQuerySortableBlockTarget = $('.column-row')
  //     .children(classIdentifiers.objectClass)
  //     .not('.ui-draggable')
  //
  //   columnWorkflowDragAndDropManager.makeSortableElement(
  //     jQuerySortableBlockTarget,
  //     objectId,
  //     CfObjectType.COLUMNWORKFLOW,
  //     classIdentifiers.objectClass,
  //     'x',
  //     false,
  //     null,
  //     classIdentifiers.handle,
  //     classIdentifiers.container
  //   )
  // }, [objectId, parentId])

  /*******************************************************
   * RENDER
   *******************************************************/
  if (!columnData) {
    return <></>
  }

  return (
    <div
      id={String(objectId)}
      ref={mergeRefs(setNodeRef as Ref<HTMLDivElement>, ref)}
      style={{
        position: 'relative',
        transform: CSS.Transform.toString(transform),
        transition
      }}
      {...attributes}
      data-child-id={objectId}
    >
      <div {...listeners}>
        <DragHandleIcon />
      </div>

      <Column objectId={objectId} parentId={parentId} />
      <ColumnHoverMenu
        objectId={objectId}
        order={columnData.column.order}
        show={isHovered}
      />
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
