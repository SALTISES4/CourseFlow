import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  dropTargetForElements,
  monitorForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import type { NodeDropPayload } from '@cf/features/graph/state/resolveNodeDropRow'
import { selectGraphBoard } from '@cf/features/graph/state/selectors/graphBoard.selectors'
import { graphUiActions } from '@cf/features/graph/state/slices/graphUi.slice'
import {
  moveNodeGrid,
  reorderChannels,
  reorderSections
} from '@cf/features/graph/state/thunks/graphMutations.thunks'
import type { AppDispatch, RootState } from '@cf/redux/store'
import DeleteNodeCategoryDialog from '@cfComponents/dialog/Workflow/DeleteNodeCategory'
import DeleteSectionDialog from '@cfComponents/dialog/Workflow/DeleteSection'
import { produce } from 'immer'
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useResizeObserver } from 'usehooks-ts'

import ColumnsHeader from './components/ColumnsHeader'
import LineSVG from './components/LineSVG'
import Section from './components/Section'
import { createGraphLayoutSignature } from './layoutSignature'
import { GraphViewWrap, SectionsWrapper } from './styles'
import {
  CellReorderCallbackFn,
  ColumnReorderCallbackFn,
  SectionInsertCallbackFn,
  SectionReorderCallbackFn,
  isGridSection,
  isSidebarPart
} from './types'

type StateType = {
  collapseAllForDrag: boolean
  layoutRevision: number
}

const GraphView = ({
  graphUuid,
  publicView = false
}: {
  graphUuid: string
  publicView?: boolean
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const canManageCategories = useResourcePermission(
    WorkflowPermission.NODE_CATEGORY_MANAGEMENT
  )
  const canManageParts = useResourcePermission(
    WorkflowPermission.PART_MANAGEMENT
  )
  const canManageNodes = useResourcePermission(
    WorkflowPermission.NODE_MANAGEMENT
  )
  const nodeInsertMode = useSelector(
    (state: RootState) => state.graph.graphUi.nodeInsertMode
  )
  const collapsedSectionUuids = useSelector(
    (state: RootState) => state.graph.graphUi.collapsedSectionUuids
  )

  const graphBoard = useSelector((state: RootState) =>
    selectGraphBoard(state, graphUuid)
  )

  const dragging = useSelector((state: RootState) => state.svglink.allowDnd)
  const sectionsWrapperRef = useRef<HTMLDivElement>(null)

  const [state, setState] = useState<StateType>({
    collapseAllForDrag: false,
    layoutRevision: 0
  })

  useEffect(() => {
    dispatch(graphUiActions.setCollapsedSectionUuids([]))

    return () => {
      dispatch(graphUiActions.setCollapsedSectionUuids([]))
    }
  }, [dispatch, graphUuid])

  const { width: sectionsWidth = 0, height: sectionsHeight = 0 } =
    useResizeObserver({
      ref: sectionsWrapperRef,
      box: 'border-box'
    })

  const graphLayoutSignature = useMemo(
    () => createGraphLayoutSignature(graphBoard),
    [graphBoard]
  )
  const collapsedSectionSignature = JSON.stringify(collapsedSectionUuids)

  useEffect(() => {
    const el = sectionsWrapperRef.current
    if (!el) {
      return
    }
    return combine(
      // because the user can technically drag elements outside the drop container
      // we use a global monitor to reset the sections/parts into non-condensed state
      // when a drop (or error, or drop cancel) happens
      monitorForElements({
        onDrop({ source }) {
          if (!isGridSection(source.data) && !isSidebarPart(source.data)) {
            return
          }
          setState(
            produce((draft) => {
              draft.collapseAllForDrag = false
            })
          )
          dispatch(graphUiActions.setCollapsedSectionUuids([]))
        }
      }),
      dropTargetForElements({
        element: el,
        canDrop({ source }) {
          return (
            canManageParts &&
            (isGridSection(source.data) || isSidebarPart(source.data))
          )
        },
        onDragStart({ source }) {
          if (!isGridSection(source.data) && !isSidebarPart(source.data)) {
            return
          }
          setState(
            produce((draft) => {
              draft.collapseAllForDrag = true
            })
          )
        }
      })
    )
  }, [canManageParts, dispatch])

  // Geometry is read from the DOM during render. Advance the revision from a
  // layout effect so sections and edges render once more after React commits a
  // canonical layout change. This remains correct when mutations resolve
  // asynchronously and also covers wrapper resizes and collapsed sections.
  useLayoutEffect(() => {
    setState(
      produce((draft) => {
        draft.layoutRevision += 1
      })
    )
  }, [
    collapsedSectionSignature,
    graphLayoutSignature,
    sectionsHeight,
    sectionsWidth,
    state.collapseAllForDrag
  ])

  const onColumnReorder: ColumnReorderCallbackFn = useCallback(
    (oldIndex: number, newIndex: number) => {
      if (!canManageCategories) {
        return
      }
      const channelUuids = [...graphBoard.columns.ids]
      const [moved] = channelUuids.splice(oldIndex, 1)
      channelUuids.splice(newIndex, 0, moved)
      dispatch(reorderChannels({ graphUuid, channelUuids }))
    },
    [canManageCategories, dispatch, graphBoard.columns.ids, graphUuid]
  )

  const onSectionCollapse = useCallback(
    (sectionUuid: string) => {
      dispatch(graphUiActions.toggleSectionCollapsed(sectionUuid))
    },
    [dispatch]
  )

  const onSectionDragStart = useCallback(() => {
    setState(
      produce((draft) => {
        draft.collapseAllForDrag = true
      })
    )
  }, [])

  const onSectionDragEnd = useCallback(() => {
    setState(
      produce((draft) => {
        draft.collapseAllForDrag = false
      })
    )
    dispatch(graphUiActions.setCollapsedSectionUuids([]))
  }, [dispatch])

  const onSectionInsert: SectionInsertCallbackFn = useCallback(
    (insertIndex) => {
      console.log('+++ WEEK INSERT', { insertIndex })
      // TODO: figure out how sidebar parts/strategies work
      // dispatch workflow section insert
      // state.sections.splice(insertIndex, 0, dataForTheInsertedSection)
    },
    []
  )

  const onSectionReorder: SectionReorderCallbackFn = useCallback(
    (from, to) => {
      if (!canManageParts) {
        return
      }
      const sectionUuids = graphBoard.sections.map((section) => section.uuid)
      const [moved] = sectionUuids.splice(from, 1)
      sectionUuids.splice(to, 0, moved)
      dispatch(reorderSections({ graphUuid, sectionUuids }))
    },
    [canManageParts, dispatch, graphBoard.sections, graphUuid]
  )

  const onNodeDrop: CellReorderCallbackFn = useCallback(
    (payload: NodeDropPayload) => {
      if (!canManageNodes) {
        return
      }
      const mode =
        payload.mode ?? (nodeInsertMode === 'manual' ? 'row' : nodeInsertMode)
      dispatch(
        moveNodeGrid({
          graphUuid,
          nodeUuid: payload.uuid,
          toSectionUuid: String(payload.toSection),
          toChannelUuid: String(payload.toColumn),
          rowHint: payload.toRow,
          mode,
          edge: payload.edge
        })
      )
    },
    [canManageNodes, dispatch, graphUuid, nodeInsertMode]
  )

  return (
    <GraphViewWrap dragging={dragging} data-test-id="workflow-view">
      <ColumnsHeader board={graphBoard} onReorder={onColumnReorder} />
      <SectionsWrapper data-test-id="sections-block" ref={sectionsWrapperRef}>
        {graphBoard.sections.map((section, index) => (
          <Section
            // Maybe this should be called CFSection since Section is used everywhere from MUI
            key={`section_${section.uuid}`}
            index={index}
            sectionId={section.uuid}
            sectionRows={section.rows}
            boardId={graphBoard.uuid}
            columnIds={graphBoard.columns.ids}
            columnColors={graphBoard.columns.colors}
            condensed={
              state.collapseAllForDrag ||
              collapsedSectionUuids.includes(section.uuid)
            }
            onSectionCollapse={onSectionCollapse}
            onSectionDragStart={onSectionDragStart}
            onSectionDragEnd={onSectionDragEnd}
            onSectionInsert={onSectionInsert}
            onSectionReorder={onSectionReorder}
            onNodeDrop={onNodeDrop}
            layoutRevision={state.layoutRevision}
          />
        ))}
        <LineSVG
          graphUuid={graphUuid}
          layoutRevision={state.layoutRevision}
          condensed={
            state.collapseAllForDrag
              ? graphBoard.sections.length
              : collapsedSectionUuids.length
          }
        />
      </SectionsWrapper>

      {!publicView && (
        <>
          <DeleteNodeCategoryDialog />
          <DeleteSectionDialog />
        </>
      )}
    </GraphViewWrap>
  )
}

export default memo(GraphView)
