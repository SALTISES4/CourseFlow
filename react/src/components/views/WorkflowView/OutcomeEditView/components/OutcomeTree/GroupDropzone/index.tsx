import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { _t } from '@cf/utility/Utility.class'
import { moveOutcome } from '@cfRedux/slices/outcomes.slice'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'

import * as Styled from '../styles'

const GroupDropzone = ({
  id,
  children,
  level,
  hasChildren
}: {
  id: number
  children: ReactNode
  level: number
  hasChildren: boolean
}) => {
  const dispatch = useDispatch()
  const dropRef = useRef<HTMLDivElement>(null)
  const [draggingOver, setDraggingOver] = useState(false)

  const highlight = draggingOver && !hasChildren

  useEffect(() => {
    const el = dropRef.current

    return dropTargetForElements({
      element: el,
      onDragEnter: () => {
        setDraggingOver(true)
      },
      onDragLeave: () => {
        setDraggingOver(false)
      },
      // only allow dropping in same level items
      // (since otherwise DropIndicator/Outcome handles everything else)
      // and only if there are no children
      canDrop: ({ source }) => {
        const data = source.data
        return !hasChildren && data.level === level
      },
      // move dragged outcome from its original tree location into this outcome
      onDrop: ({ source }) => {
        const data = source.data
        dispatch(
          moveOutcome({
            targetId: data.id as number,
            destinationId: id
          })
        )
        setDraggingOver(false)
      }
    })
  }, [dispatch, hasChildren, level, id])

  return (
    <Styled.GroupDropzone ref={dropRef} highlight={highlight}>
      {children}
    </Styled.GroupDropzone>
  )
}

export default GroupDropzone
