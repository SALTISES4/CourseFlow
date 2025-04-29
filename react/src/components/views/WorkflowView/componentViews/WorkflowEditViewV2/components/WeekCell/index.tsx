import {
  draggable,
  dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import useHover from '@cf/hooks/useHover'
import AutoLink from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/AutoLink'
import NodeLink from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeLink'
import NodePorts from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodePorts'
import { alpha } from '@mui/material'
import { produce } from 'immer'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import HoverMenu from './components/HoverMenu'
import * as StyledNode from './styles'
import { NodePropsType, PhantomPropsType, WeekCellNodeType } from './types'
import * as Styled from '../../styles'
import { CellDataType, DraggableType } from '../../types'
import { isGridCell } from '../../types'

type PropsType = PhantomPropsType | NodePropsType

const WeekCell = (props: PropsType) => {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState({
    draggedOver: false
  })

  useEffect(() => {
    const el = ref.current

    return dropTargetForElements({
      element: el,
      onDragEnter: () => {
        setState(
          produce((draft) => {
            draft.draggedOver = true
          })
        )
      },
      onDragLeave: () => {
        setState(
          produce((draft) => {
            draft.draggedOver = false
          })
        )
      },
      canDrop: ({ source }) => {
        const data = source.data

        if (!isGridCell(data)) {
          return
        }

        // early exit if different row - and to disable column swapping with the new row
        // if (data.coords.y !== props.coords.y) {
        //   return false
        // }

        return true
      },
      onDrop: ({ source }) => {
        const data = source.data

        if (!isGridCell(data)) {
          return
        }

        if (
          data.coords.x !== props.coords.x &&
          props.type === WeekCellNodeType.PHANTOM
        ) {
          props.onReorder(data.coords, props.coords.x)
        }

        setState(
          produce((draft) => {
            draft.draggedOver = false
          })
        )
      }
    })
  }, [props])

  return (
    <Styled.Cell
      ref={ref}
      sx={{
        minHeight: '50px',
        backgroundColor: state.draggedOver && alpha(props.borderColor, 0.2)
      }}
    >
      <WeekCellInner {...props} />
    </Styled.Cell>
  )
}

const WeekCellInner = (props: PropsType) => {
  const [ref, isHovered] = useHover()
  const [state, setState] = useState({
    dragging: false,
    initialRender: true,

    // circles where the node lines start from
    nodePorts: null,
    // lines between the nodes
    nodeLinks: null,
    // ??
    nodeAutoLink: null
  })

  const { coords, type, borderColor } = props

  // TODO: navigate to workflow
  const onMouseDoubleClick = useCallback((evt: MouseEvent) => {
    evt.stopPropagation()
    console.log('navigate to workflow')
  }, [])

  useEffect(() => {
    const el = ref.current

    if (!el) {
      return
    }

    return draggable({
      element: el,
      getInitialData: (): CellDataType => ({
        coords,
        type: DraggableType.CELL
      }),
      onDragStart: () => {
        setState(
          produce((draft) => {
            draft.dragging = !draft.dragging
          })
        )
      },
      onDrop: () => {
        setState(
          produce((draft) => {
            draft.dragging = false
          })
        )
      }
    })
  }, [ref, coords])

  useEffect(() => {
    if (state.initialRender) {
      setState(
        produce((draft) => {
          draft.initialRender = false
        })
      )
    }

    const component = ref.current
    if (component) {
      component.addEventListener('dblclick', onMouseDoubleClick)
    }

    return () => {
      if (component) {
        component.removeEventListener('dblclick', onMouseDoubleClick)
      }
    }
  }, [ref, onMouseDoubleClick, state.initialRender])

  useEffect(() => {
    if (!state.initialRender && props.type === WeekCellNodeType.NODE) {
      const objectId = props.id
      setState(
        produce((draft) => {
          draft.nodePorts = createPortal(
            <NodePorts
              show={isHovered}
              nodeId={objectId}
              nodeDiv={ref}
              // dispatch={dispatch}
            />,
            $('.workflow-canvas')[0]
          )
        })
      )

      // nodeLinks = node.outgoingLinks.map((link) => (
      //   <NodeLink key={link} objectId={link} nodeDiv={ref} />
      // ))

      // if (node.hasAutolink) {
      //   autoLink = <AutoLink nodeId={objectId} nodeDiv={ref} />
      // }
    }
  }, [isHovered, state.initialRender, props, ref])

  if (type === WeekCellNodeType.PHANTOM) {
    return <div style={{ backgroundColor: borderColor }} />
  } else {
    const { id, title, description, onClick } = props

    return (
      <Styled.CellInner id={`'node-${id}`} ref={ref} dragging={state.dragging}>
        <HoverMenu show={isHovered} />
        <StyledNode.Border sx={{ backgroundColor: borderColor }} />
        <StyledNode.Content onClick={onClick}>
          <StyledNode.Title variant="subtitle2">{title}</StyledNode.Title>
          {description && (
            <StyledNode.Subtitle variant="caption">
              {description}
            </StyledNode.Subtitle>
          )}
        </StyledNode.Content>
        {state.nodePorts}
        {state.nodeLinks}
        {state.nodeAutoLink}
      </Styled.CellInner>
    )
  }
}

export default WeekCell
