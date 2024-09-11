import { OuterContentWrap } from '@cf/mui/helper'
import WorkspaceSidebar from '@cfPages/Styleguide/components/WorkspaceSidebar'
import { Wrap as DraggablePlaceholder } from '@cfPages/Styleguide/components/WorkspaceSidebar/components/DraggableBlock/styles'
import { DraggableType } from '@cfPages/Styleguide/components/WorkspaceSidebar/components/DraggableBlock/types'
import workspaceSidebarData from '@cfPages/Styleguide/components/WorkspaceSidebar/data'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent
} from '@dnd-kit/core'
import { grey, yellow } from '@mui/material/colors'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useLayoutEffect, useRef, useState } from 'react'

import DropTarget from './components/DropTarget'

const WorkspaceTab = () => {
  const [validDrop, setValidDrop] = useState(false)
  const [activeDrag, setActiveDrag] = useState<DraggableType | null>(null)
  const [height, setHeight] = useState<number>()
  const wrapRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (wrapRef.current) {
      const bcr = wrapRef.current.getBoundingClientRect()
      const diff = window.innerHeight - bcr.bottom + bcr.height
      setHeight(diff)
    }
  }, [])

  function handleDragStart(event: DragStartEvent) {
    setActiveDrag(event.active.data.current as DraggableType)
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!validDrop) {
      return
    }

    console.log(event, 'dropped draggable:', activeDrag)
    setActiveDrag(null)
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <OuterContentWrap ref={wrapRef} sx={{ height: `${height}px`, pb: 0 }}>
        <Stack direction="row" style={{ height: '100%', overflow: 'hidden' }}>
          <DropTarget
            id="unique-container-id"
            sx={{
              mt: 3,
              padding: 3,
              flexGrow: 1,
              backgroundColor: grey[100]
            }}
            dragOverStyles={{
              backgroundColor: yellow[300]
            }}
            setIsDropValid={setValidDrop}
          >
            <Typography variant="h5">This is the Workspace tab</Typography>
          </DropTarget>

          <DragOverlay>
            {activeDrag ? (
              <DraggablePlaceholder
                sx={{
                  opacity: 0.7,
                  backgroundColor: grey[300],
                  borderLeftColor: grey[400]
                }}
              >
                <Typography variant="body2">{activeDrag.label}</Typography>
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
