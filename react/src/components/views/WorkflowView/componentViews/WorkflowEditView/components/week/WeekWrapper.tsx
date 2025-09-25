import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import useHover from '@cf/hooks/useHover'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import { HoverMenu, MenuItemType } from '@cfComponents/menu/Menu'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import DeleteIcon from '@mui/icons-material/Delete'
import DragHandleIcon from '@mui/icons-material/DragHandle'
import QueueIcon from '@mui/icons-material/Queue'
import {
  useCreateWeekMutation,
  useDeleteWeekMutation
} from '@XMLHTTP/API/workflowObjects/week.rtk'
import clsx from 'clsx'
import mergeRefs from 'merge-refs'
import { Ref } from 'react'

import * as Styled from './styles'
import Week from './Week'

type PropsType = {
  condensed: boolean
  objectId: number
  parentId: number
  reordering: boolean
}

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

  const createButtonHandler = async (type: CfObjectType) => {
    // try {
    //   const resp = await createMutate({
    //     payload: {
    //       rank: order + 1
    //     }
    //   }).unwrap()
    //   onSuccess(resp)
    // } catch (e) {
    //   onError(e)
    // }
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
    <HoverMenu
      id={`hover-menu-${objectId}`}
      data-test-id="hover-menu"
      menuItems={menuItems}
    />
  )
}

/**
 * this component should not exist...roll it into week
 * and disambiguate parentId: week is not a 'child' of weekworkflow
 **/
const WeekWrapper = ({
  condensed,
  objectId,
  parentId,
  reordering
}: PropsType) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: objectId })

  const [ref, isHovered] = useHover()

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  /**
   * Choose between standard Week and term (for workflow type program)
    @todo investigate this switch
  it doesn't make sense why is term (label for program week) being used for the UI dropped view (as in drop down drawer)
    **/
  const WeekOrTerm = () => {
    if (condensed) {
      // TODO: figure this out
      return <></>
      // return (
      //   <Term
      //     objectId={objectId}
      //     //  rank={weekData.order.indexOf(weekData.week.id)}
      //     parentId={parentId}
      //   />
      // )
    }

    return (
      <Week objectId={objectId} parentId={parentId} reordering={reordering} />
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <div
      id={'week-block-' + String(objectId)}
      style={{
        position: 'relative',
        transform: CSS.Transform.toString(transform),
        transition
      }}
      {...attributes}
      className={clsx('week-workflow', {})}
      ref={mergeRefs(setNodeRef as Ref<HTMLDivElement>, ref)}
      data-scroll-to-id={'week-block-' + String(objectId)}
      data-child-id={objectId}
    >
      {/*
      Need to solve this
      drag n drop sort zone take over whole object and hides inside click event  (hover menu etc)
      */}
      {reordering ? (
        <Styled.DraggingWeekWrapper {...listeners}>
          <DragHandleIcon />
          <WeekOrTerm />
        </Styled.DraggingWeekWrapper>
      ) : (
        <>
          <WeekOrTerm />
          <WeekHoverMenu objectId={objectId} show={isHovered} order={1} />
        </>
      )}
    </div>
  )
}

export default WeekWrapper
