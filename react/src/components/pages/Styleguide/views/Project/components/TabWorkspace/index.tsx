// @ts-nocheck
import { useRef, useState, useLayoutEffect } from 'react'
import { OuterContentWrap } from '@cf/mui/helper'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import WorkspaceSidebar from '@cfPages/Styleguide/components/WorkspaceSidebar'
import workspaceSidebarData from '@cfPages/Styleguide/components/WorkspaceSidebar/data'
import { Wrap as DraggablePlaceholder } from '@cfPages/Styleguide/components/WorkspaceSidebar/components/DraggableBlock/styles'
import { DraggableType } from '@cfPages/Styleguide/components/WorkspaceSidebar/components/DraggableBlock/types'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable
} from '@dnd-kit/core'

const WorkspaceTab = () => {
  const [active, setActive] = useState<DraggableType | null>(null)
  const [height, setHeight] = useState<number>()
  const wrapRef = useRef<HTMLDivElement>(null)
  const { isOver, setNodeRef } = useDroppable({
    id: 'droppable'
  })

  useLayoutEffect(() => {
    if (wrapRef.current) {
      const bcr = wrapRef.current.getBoundingClientRect()
      const diff = window.innerHeight - bcr.bottom + bcr.height
      setHeight(diff)
    }
  }, [])

  function handleDragStart(event: DragStartEvent) {
    setActive(event.active.data.current as DraggableType)
  }

  function handleDragEnd(event: DragEndEvent) {
    console.log(event)
    console.log('dropped draggable block:', active)
    setActive(null)
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <OuterContentWrap ref={wrapRef} sx={{ height: `${height}px`, pb: 0 }}>
        <Stack direction="row" style={{ height: '100%', overflow: 'hidden' }}>
          <Box
            ref={setNodeRef}
            sx={{
              mt: 3,
              flexGrow: 1,
              backgroundColor: isOver ? '#0fa' : '#efefef'
            }}
          >
            <Typography variant="h5">This is the Workspace tab</Typography>
          </Box>

          <DragOverlay>
            {active ? (
              <DraggablePlaceholder group={active.group} sx={{ opacity: 0.7 }}>
                <Typography variant="body2">{active.label}</Typography>
              </DraggablePlaceholder>
            ) : null}
          </DragOverlay>

          <WorkspaceSidebar {...workspaceSidebarData} />
        </Stack>
      </OuterContentWrap>
    </DndContext>
  )
}

export default WorkspaceTab
