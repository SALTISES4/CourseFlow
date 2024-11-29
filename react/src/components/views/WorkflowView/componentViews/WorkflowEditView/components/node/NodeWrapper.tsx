import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import useHover from '@cf/hooks/useHover'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import { HoverMenu, MenuItemType } from '@cfComponents/menu/Menu'
import { selectNodeById } from '@cfRedux/selectors/node.selector'
import { AppState } from '@cfRedux/types/type'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import DeleteIcon from '@mui/icons-material/Delete'
import DragHandleIcon from '@mui/icons-material/DragHandle'
import QueueIcon from '@mui/icons-material/Queue'
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import {
  useCreateNodeMutation,
  useDeleteNodeMutation
} from '@XMLHTTP/API/workflowObjects/node.rtk'
import mergeRefs from 'merge-refs'
import { Ref } from 'react'
import { useSelector } from 'react-redux'

import Node from './Node'

type PropsType = {
  objectId: number
  parentId: number
  columnOrder: number[]
}

/**
 * NodeWrapper:
 * only purpose now is (maybe) as a  wrapper for drag and drop
 * (although make droppable is still in Node right now)
 * this is why we just call getNodeById in both NodeWrapper and child
 * TBD...
 **/

// Define a fixed width for each cell
const cellWidth = 200 // For example, 160px per cell

const StyledCell = styled(Box)(() => ({
  position: 'relative',
  width: `${cellWidth}px` // Fixed width for each cell
}))

const NodeHoverMenu = ({
  objectId,
  show
}: {
  objectId: number
  show: boolean
}) => {
  /*******************************************************
   * API HOOKS
   *******************************************************/
  const { onError, onSuccess } = useGenericMsgHandler()

  const [
    createMutate,
    { isSuccess: createSuccess, isError: createError, data: createData }
  ] = useCreateNodeMutation()

  const [
    deleteMutate,
    { isSuccess: deleteSuccess, isError: deleteError, data: deleteData }
  ] = useDeleteNodeMutation()

  const createButtonHandler = async (type: CfObjectType) => {
    try {
      console.log('creating type', type)
      const resp = await createMutate({
        payload: {
          objectType: type
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
      action: () => createButtonHandler(CfObjectType.WEEK),
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

const NodeWrapper = ({ objectId, parentId, columnOrder }: PropsType) => {
  const data = useSelector((state: AppState) => selectNodeById(state, objectId))
  const workflow = useSelector((state: AppState) => state.workspace.workflow)
  const [ref, isHovered] = useHover()
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: objectId })

  if (!data) {
    return null
  }

  return workflow.columns.map((colNum, index) => (
    <StyledCell key={index}>
      <span
        style={{
          position: 'absolute',
          top: '0.5em',
          left: '0.5em',
          fontWeight: 600,
          fontSize: '12px',
          opacity: 0.5
        }}
      >
        col: {colNum}, order: {data.node.order}
      </span>

      {colNum === data.node.column && (
        <div
          id={String(objectId)}
          className="node-week"
          ref={mergeRefs(setNodeRef as Ref<HTMLDivElement>, ref)}
          style={{
            position: 'relative',
            transform: CSS.Transform.toString(transform),
            transition
          }}
          {...attributes}
          data-child-id={String(objectId)}
          data-column-id={String(data.column)}
        >
          <div {...listeners}>
            <DragHandleIcon />
          </div>

          <Node
            objectId={objectId}
            parentId={parentId}
            columnOrder={columnOrder}
          />
          <NodeHoverMenu objectId={objectId} show={isHovered} />
        </div>
      )}
    </StyledCell>
  ))
}

export default NodeWrapper

// import { TGetNodeWeekById, getNodeWeekByID } from '@cfFindState'
// import { AppState } from '@cfRedux/types/type'
// import Node from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/Node'
// import clsx from 'clsx'
// import * as React from 'react'
// import { connect } from 'react-redux'
//
// type ConnectedProps = TGetNodeWeekById
//
// type OwnProps = {
//   objectId: number
//   parentId: number
//   columnOrder: any
// }
//
// type PropsType = ConnectedProps & OwnProps
//
// /**
//  * Represents the node-week throughmodel
//  * this should not exist...
//  */
// class NodeWeekUnconnected<P extends PropsType> extends React.Component<P> {
//   constructor(props) {
//     super(props)
//   }
//
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     const data = this.props.data
//
//     return (
//       <div
//         className={clsx('node-week', {
//           'no-drag': data.noDrag
//         })}
//         id={data.id}
//         data-child-id={data.node}
//         data-column-id={this.props.column}
//       >
//         <Node
//           objectId={data.node}
//           parentId={this.props.parentId}
//           throughParentId={data.id}
//           columnOrder={this.props.columnOrder}
//         />
//       </div>
//     )
//   }
// }
// const mapStateToProps = (
//   state: AppState,
//   ownProps: OwnProps
// ): TGetNodeWeekById => {
//   return getNodeWeekByID(state, ownProps.objectId)
// }
// const NodeWeek = connect<ConnectedProps, object, OwnProps, AppState>(
//   mapStateToProps,
//   null
// )(NodeWeekUnconnected)
// export default NodeWeek
//
// export { NodeWeekUnconnected }
