import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { WorkflowPermission } from '@cf/api/gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import type { GraphUuid } from '@cf/features/graph/state/model/types'
import { moveOutcome } from '@cf/features/graph/state/thunks/outcomeMutations.thunks'
import type { AppDispatch } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'

import * as Styled from '../styles'

const GroupDropzone = ({
  graphUuid,
  uuid,
  children,
  level,
  hasChildren
}: {
  graphUuid: GraphUuid
  uuid: string | null
  children: ReactNode
  level: number
  hasChildren: boolean
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const canManageOutcomes = useResourcePermission(
    WorkflowPermission.OUTCOME_MANAGEMENT
  )
  const dropRef = useRef<HTMLDivElement>(null)
  const [draggingOver, setDraggingOver] = useState(false)

  const highlight = draggingOver && !hasChildren

  useEffect(() => {
    const el = dropRef.current
    if (!el || uuid === null || !canManageOutcomes) {
      return
    }

    return dropTargetForElements({
      element: el,
      onDragEnter: () => {
        setDraggingOver(true)
      },
      onDragLeave: () => {
        setDraggingOver(false)
      },
      canDrop: ({ source }) => {
        const data = source.data
        return !hasChildren && data.level === level
      },
      onDrop: ({ source }) => {
        const data = source.data
        dispatch(
          moveOutcome({
            graphUuid,
            outcomeUuid: data.uuid as string,
            afterUuid: uuid
          })
        )
        setDraggingOver(false)
      }
    })
  }, [canManageOutcomes, dispatch, graphUuid, hasChildren, level, uuid])

  return (
    <Styled.GroupDropzone ref={dropRef} highlight={highlight}>
      {children}
    </Styled.GroupDropzone>
  )
}

export default GroupDropzone
