import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  Edge,
  attachClosestEdge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box'
import { selectSectionByUuid } from '@cf/features/graph/state/selectors/canonical.selectors'
import { GraphBoard } from '@cf/features/graph/state/selectors/graphBoard.selectors'
import BetterSelectionManager from '@cf/features/selection/betterSelectionManager'
import useHover from '@cf/hooks/useHover'
import { CfObjectType } from '@cf/types/enum'
import { RootState } from '@cfRedux/store'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import IconButton from '@mui/material/IconButton'
import { produce } from 'immer'
import {
  MouseEvent,
  MutableRefObject,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useResizeObserver } from 'usehooks-ts'

import HoverMenu from './HoverMenu'
import SectionRow from './Row'
import * as StyledSection from './styles'
import { DraggableType, isGridSection, isSidebarPart } from '../../types'
import {
  CellReorderCallbackFn,
  SectionInsertCallbackFn,
  SectionReorderCallbackFn
} from '../../types'

export type SectionPropsType = {
  index: number
  sectionId: string
  sectionRows: GraphBoard['sections'][0]['rows']
  condensed: boolean
  boardId: GraphBoard['uuid']
  columnIds: GraphBoard['columns']['ids']
  columnColors: GraphBoard['columns']['colors']
  onSectionCollapse: (sectionId: string) => void
  onNodeDrop: CellReorderCallbackFn
  onSectionReorder: SectionReorderCallbackFn
  onSectionInsert: SectionInsertCallbackFn
  memoBuster: (number | boolean)[]
}

type SectionStateType = {
  closestEdge: Edge | null
  dragging: boolean
  draggedOver: boolean
}

const Section = (props: SectionPropsType) => {
  const dispatch = useDispatch()
  const [state, setState] = useState<SectionStateType>({
    closestEdge: null,
    draggedOver: false,
    dragging: false
  })
  const selected = useSelector(
    (state: RootState) =>
      state.sidebar.edit.objectType === CfObjectType.SECTION &&
      state.sidebar.edit.uuid === props.sectionId
  )
  const sectionWrapperRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)
  // TODO(graph-state): `isStrategy` lived on legacy workspace.workflow (not mounted); expose on WorkflowMetaEntity or workflow detail when modeled in graph.
  const isStrategy = false
  const sectionSelector = useMemo(
    () => selectSectionByUuid(props.sectionId),
    [props.sectionId]
  )
  const section = useSelector(sectionSelector)
  const manager = useRef(new BetterSelectionManager(dispatch))

  const [_, isHovered] = useHover(dragHandleRef)

  const resetState = useCallback(() => {
    setState(
      produce((draft) => {
        draft.draggedOver = false
        draft.closestEdge = null
      })
    )
  }, [])

  useEffect(() => {
    const outerEl = sectionWrapperRef.current
    const el = dragHandleRef.current
    return combine(
      draggable({
        element: el,
        getInitialData: () => ({
          index: props.index,
          type: DraggableType.WEEK
        })
      }),
      dropTargetForElements({
        element: outerEl,
        getData: ({ element, input }) => {
          const data = {
            index: props.index,
            type: DraggableType.WEEK
          }
          return attachClosestEdge(data, {
            element,
            input,
            allowedEdges: ['top', 'bottom']
          })
        },
        canDrop({ source }) {
          return isGridSection(source.data) || isSidebarPart(source.data)
        },
        onDragStart() {
          setState(
            produce((draft) => {
              draft.dragging = true
            })
          )
        },
        onDragLeave() {
          resetState()
        },
        onDrag({ source, self }) {
          const dragging = source.data
          if (!isGridSection(dragging) && !isSidebarPart(dragging)) {
            return
          }

          const closestEdge = extractClosestEdge(self.data)
          if (!closestEdge) {
            return
          }

          setState(
            produce((draft) => {
              draft.closestEdge = closestEdge
            })
          )
        },
        onDrop({ source, self }) {
          const from = source.data
          const to = self.data

          if (!isGridSection(to)) {
            return
          }

          const closestEdge = extractClosestEdge(to)

          if (isGridSection(from)) {
            let moveToIndex = to.index
            if (from.index < to.index && closestEdge === 'top') {
              moveToIndex -= 1
            }
            if (from.index > to.index && closestEdge === 'bottom') {
              moveToIndex += 1
            }
            if (from.index !== moveToIndex) {
              props.onSectionReorder(from.index, moveToIndex)
            }
          } else if (isSidebarPart(from)) {
            const insertIndex =
              closestEdge === 'bottom' ? to.index + 1 : to.index
            props.onSectionInsert(insertIndex)
          } else {
            return
          }

          setState(
            produce((draft) => {
              draft.dragging = false
            })
          )
          resetState()
        }
      })
    )
  }, [resetState, props])

  const onSectionWrapperClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      manager.current.updateSidebar(
        props.sectionId,
        CfObjectType.SECTION,
        props.boardId
      )
    },
    [props.boardId, props.sectionId]
  )

  const onNodeClick = useCallback(
    (e: MouseEvent<HTMLDivElement>, nodeId: string) => {
      e.stopPropagation()
      manager.current.updateSidebar(nodeId, CfObjectType.NODE, props.boardId)
    },
    [props.boardId]
  )

  const onCollapseIconClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      props.onSectionCollapse(props.sectionId)
    },
    [props]
  )

  if (!section) {
    return null
  }

  const sectionGrid = !props.sectionRows.length ? (
    <SectionRow
      rowIndex="empty"
      graphUuid={props.boardId}
      sectionId={props.sectionId}
      columnIds={props.columnIds}
      columnColors={props.columnColors}
      onNodeDrop={props.onNodeDrop}
    />
  ) : (
    props.sectionRows.map((nodes, rowIndex) => (
      <SectionRow
        key={`section_${props.sectionId}_${rowIndex}`}
        nodes={nodes}
        rowIndex={rowIndex}
        sectionId={props.sectionId}
        graphUuid={props.boardId}
        columnIds={props.columnIds}
        columnColors={props.columnColors}
        onNodeDrop={props.onNodeDrop}
        onNodeClick={onNodeClick}
      />
    ))
  )

  const defaultText = !isStrategy
    ? `Section ${(section.position ?? 0) + 1}`
    : undefined

  return (
    <>
      <StyledSection.SectionWrapper
        ref={sectionWrapperRef}
        selected={selected}
        hovering={isHovered}
        data-section-id={props.sectionId}
        data-selected={selected ? 'true' : undefined}
      >
        <StyledSection.SectionHeader
          ref={dragHandleRef}
          dragging={state.dragging}
          expanded={!props.condensed}
          onClick={onSectionWrapperClick}
        >
          <StyledSection.SectionTitle variant="subtitle2">
            <StyledSection.SectionNumber>
              {props.index + 1}
            </StyledSection.SectionNumber>
            {section.title ?? defaultText}
          </StyledSection.SectionTitle>

          <IconButton
            onClick={onCollapseIconClick}
            className="arrow-icon"
            aria-label={props.condensed ? 'Expand section' : 'Collapse section'}
            aria-expanded={!props.condensed}
          >
            <KeyboardArrowDown />
          </IconButton>

          <HoverMenu
            graphUuid={props.boardId}
            sectionId={props.sectionId}
            show={isHovered}
          />
        </StyledSection.SectionHeader>
        {!props.condensed && sectionGrid}
        {state.closestEdge && (
          <DropIndicator
            edge={state.closestEdge}
            type="no-terminal"
            gap="16px"
          />
        )}
      </StyledSection.SectionWrapper>
      <Background sectionRef={sectionWrapperRef} />
    </>
  )
}

// fake section wrapper background element that syncs with the section's BCR
const Background = ({
  sectionRef
}: {
  sectionRef: MutableRefObject<HTMLDivElement>
}) => {
  const { height = 0 } = useResizeObserver({
    ref: sectionRef,
    box: 'border-box'
  })

  const section = sectionRef.current
  const sectionTop = section?.getBoundingClientRect().top ?? 0
  const wrapTop = section?.parentElement.getBoundingClientRect().top ?? 0
  const top: number = sectionTop - wrapTop

  if (height === 0) {
    return null
  }

  return (
    <StyledSection.SectionBackground
      style={{
        top: `${top}px`,
        height: `${height}px`
      }}
    />
  )
}

export default memo(Section)
