import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import useHover from '@cf/hooks/useHover'
import { CfObjectType } from '@cf/types/enum'
import { nodelinkOutcome } from '@cfRedux/slices/node.slice'
import { isOutcomeLink } from '@cfRedux/slices/outcomes.slice'
import { AppState, TNode } from '@cfRedux/types/type'
import LinkedOutcomes from '@cfViews/WorkflowView/OutcomeEditView/components/LinkedOutcomes'
import Autolink from '@cfViews/WorkflowView/WorkflowEditView/components/_node/Autolink'
import Nodelink from '@cfViews/WorkflowView/WorkflowEditView/components/_node/Nodelink'
import NodePorts from '@cfViews/WorkflowView/WorkflowEditView/components/_node/NodePorts'
import { alpha } from '@mui/material'
import { produce } from 'immer'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'

import HoverMenu from './components/HoverMenu'
import Meta from './components/Meta'
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

        return isGridCell(data)
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
  const dispatch = useDispatch()
  const sidebarData = useSelector((state: AppState) => state.sidebar.edit)
  const [ref, isHovered] = useHover()
  const [state, setState] = useState({
    dragging: false,
    dropHighlight: false,
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

  const toggleState = useCallback(
    (property: 'dragging' | 'dropHighlight', value?: boolean) => {
      setState(
        produce((draft) => {
          draft[property] = value ?? !draft[property]
        })
      )
    },
    []
  )

  useEffect(() => {
    const el = ref.current

    if (!el) {
      return
    }

    return combine(
      dropTargetForElements({
        element: el,
        canDrop: ({ source }) => {
          return isOutcomeLink(source.data)
        },
        onDragEnter: () => toggleState('dropHighlight', true),
        onDragLeave: () => toggleState('dropHighlight', false),
        onDrop: ({ source }) => {
          const data = source.data
          if (isOutcomeLink(data) && props.type === WeekCellNodeType.NODE) {
            dispatch(
              nodelinkOutcome({ outcomeId: data.id, nodeId: props.node.id })
            )
            toggleState('dropHighlight', false)
          }
        }
      }),
      draggable({
        element: el,
        getInitialData: (): CellDataType => ({
          coords,
          type: DraggableType.CELL
        }),
        onDragStart: () => toggleState('dragging', true),
        onDrop: () => toggleState('dragging', false)
      })
    )
  }, [ref, dispatch, coords, props, toggleState])

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
      const { node } = props
      setState(
        produce((draft) => {
          draft.nodePorts = createPortal(
            <NodePorts show={isHovered} nodeId={node.id} nodeDiv={ref} />,
            $('.workflow-canvas')[0]
          )

          if (node.outgoingLinks.length) {
            draft.nodeLinks = node.outgoingLinks.map((link) => (
              <Nodelink key={link} objectId={link} nodeDiv={ref} />
            ))
          }

          if (node.hasAutolink) {
            draft.nodeAutoLink = <Autolink nodeId={node.id} nodeDiv={ref} />
          }
        })
      )
    }
  }, [isHovered, state.initialRender, props, ref])

  if (type === WeekCellNodeType.PHANTOM) {
    return <div style={{ backgroundColor: borderColor }} />
  } else {
    const { node } = props

    const selected =
      sidebarData.objectType === CfObjectType.NODE && sidebarData.id === node.id

    return (
      <Styled.CellInner
        id={`node-${node.id}`}
        ref={ref}
        selected={selected}
        dropHighlight={state.dropHighlight}
        dragShrink={state.dragging}
      >
        <HoverMenu show={isHovered} id={node.id} />
        {!!node.outcomenodeSet?.length && (
          <LinkedOutcomes
            parent={{ id: node.id, type: 'node' }}
            outcomes={node.outcomenodeSet}
          />
        )}
        <StyledNode.Border sx={{ backgroundColor: borderColor }} />
        <StyledNode.Content onClick={props.onClick}>
          <StyledNode.Title variant="body2">
            {node.title ?? `Empty title (#${node.id})`}
          </StyledNode.Title>
          {node.description && (
            <StyledNode.Subtitle variant="caption">
              {node.description}
            </StyledNode.Subtitle>
          )}
          <Meta
            workflow="#"
            contextType={node.contextClassification}
            taskType={node.taskClassification}
            time={{
              length: node.timeRequired,
              unit: node.timeUnits
            }}
          />
        </StyledNode.Content>
        {state.nodePorts}
        {state.nodeLinks}
        {state.nodeAutoLink}
      </Styled.CellInner>
    )
  }
}

export default WeekCell
