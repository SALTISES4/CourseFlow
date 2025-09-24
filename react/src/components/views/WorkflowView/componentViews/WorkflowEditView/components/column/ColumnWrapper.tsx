import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import useHover from '@cf/hooks/useHover'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import { HoverMenu, MenuItemType } from '@cfComponents/menu/Menu'
import { selectColumnById } from '@cfRedux/selectors/column.selector'
import { RootState } from '@cfRedux/store'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import DeleteIcon from '@mui/icons-material/Delete'
import DragHandleIcon from '@mui/icons-material/DragHandle'
import QueueIcon from '@mui/icons-material/Queue'
import {
  useCreateColumnMutation,
  useDeleteColumnMutation
} from '@XMLHTTP/API/workflowObjects/column.rtk'
import mergeRefs from 'merge-refs'
import { Ref } from 'react'
import { useSelector } from 'react-redux'

import Column from './Column'
import * as Styled from '../../styles'

// Define the props for the component
type OwnProps = {
  objectId: number
  parentId: number
}

const ColumnHoverMenu = ({
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
      content: _t('Insert new'),
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
  const column = useSelector((state: RootState) =>
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
  if (!column) {
    return <></>
  }

  return (
    <Styled.Cell
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
        order={column.order}
        show={isHovered}
      />
    </Styled.Cell>
  )
}

export default ColumnWrapper
