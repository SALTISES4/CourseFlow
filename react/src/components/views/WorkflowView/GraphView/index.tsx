import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  dropTargetForElements,
  monitorForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { selectGraphBoard } from '@cf/features/graph/state'
import { resolveNodeDropSectionRow } from '@cf/features/graph/state/resolveNodeDropRow'
import {
  moveNode,
  reorderChannels,
  reorderSections
} from '@cf/features/graph/state/thunks/graphMutations.thunks'
import type { AppDispatch, RootState } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import DeleteNodeCategoryDialog from '@cfComponents/dialog/Workflow/DeleteNodeCategory'
import DeleteSectionDialog from '@cfComponents/dialog/Workflow/DeleteSection'
import { produce } from 'immer'
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useResizeObserver } from 'usehooks-ts'

import ColumnsHeader from './components/ColumnsHeader'
import LineSVG from './components/LineSVG'
import Section from './components/Section'
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
  condensed: string[] | 'all'
  redrawLines: boolean
}

const GraphView = ({ graphUuid }: { graphUuid: string }) => {
  const dispatch = useDispatch<AppDispatch>()
  const nodeInsertMode = useSelector(
    (state: RootState) => state.graph.graphUi.nodeInsertMode
  )

  const graphBoard = useSelector((state: RootState) =>
    selectGraphBoard(state, graphUuid)
  )

  const dragging = useSelector((state: RootState) => state.svglink.allowDnd)
  const sectionsWrapperRef = useRef<HTMLDivElement>(null)

  const [state, setState] = useState<StateType>({
    condensed: [],
    redrawLines: false // just to trigger LineSVG to redraw on layout change
  })

  // basically retrigger repaint when any width/height change happens
  // to trigger section backgrounds to correctly recalculate their BCR
  useResizeObserver({
    ref: sectionsWrapperRef,
    box: 'border-box'
  })

  useEffect(() => {
    const el = sectionsWrapperRef.current
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
              draft.condensed = []
            })
          )
        }
      }),
      dropTargetForElements({
        element: el,
        canDrop({ source }) {
          return isGridSection(source.data) || isSidebarPart(source.data)
        },
        onDragStart({ source }) {
          if (!isGridSection(source.data) && !isSidebarPart(source.data)) {
            return
          }
          setState(
            produce((draft) => {
              draft.condensed = 'all'
            })
          )
        }
      })
    )
  }, [])

  const triggerLineRerender = useCallback(() => {
    setTimeout(() => {
      setState(
        produce((draft) => {
          draft.redrawLines = !draft.redrawLines
        })
      )
    }, 0) // schedule for next frame
  }, [])

  // just do the initial line rerender once DOM is ready
  useLayoutEffect(() => triggerLineRerender(), [triggerLineRerender])

  const onColumnReorder: ColumnReorderCallbackFn = useCallback(
    (oldIndex: number, newIndex: number) => {
      const channelUuids = [...graphBoard.columns.ids]
      const [moved] = channelUuids.splice(oldIndex, 1)
      channelUuids.splice(newIndex, 0, moved)
      dispatch(reorderChannels({ graphUuid, channelUuids }))
      triggerLineRerender()
    },
    [dispatch, graphBoard.columns.ids, graphUuid, triggerLineRerender]
  )

  const onSectionCollapse = useCallback((sectionUuid: string) => {
    setState(
      produce((draft) => {
        if (Array.isArray(draft.condensed)) {
          const index = draft.condensed.indexOf(sectionUuid)
          if (index !== -1) {
            draft.condensed.splice(index, 1)
          } else {
            draft.condensed.push(sectionUuid)
          }
        }
      })
    )
  }, [])

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
      const sectionUuids = graphBoard.sections.map((section) => section.uuid)
      const [moved] = sectionUuids.splice(from, 1)
      sectionUuids.splice(to, 0, moved)
      dispatch(reorderSections({ graphUuid, sectionUuids }))
      triggerLineRerender()
    },
    [dispatch, graphBoard.sections, graphUuid, triggerLineRerender]
  )

  const onNodeDrop: CellReorderCallbackFn = useCallback(
    (payload) => {
      dispatch(
        moveNode({
          graphUuid,
          nodeUuid: payload.uuid,
          sectionUuid: String(payload.toSection),
          channelUuid: String(payload.toColumn),
          sectionRow: resolveNodeDropSectionRow(payload, nodeInsertMode)
        })
      )
      triggerLineRerender()
    },
    [dispatch, graphUuid, nodeInsertMode, triggerLineRerender]
  )

  return (
    <GraphViewWrap dragging={dragging}>
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
              state.condensed === 'all' ||
              state.condensed.includes(section.uuid)
            }
            onSectionCollapse={onSectionCollapse}
            onSectionInsert={onSectionInsert}
            onSectionReorder={onSectionReorder}
            onNodeDrop={onNodeDrop}
            memoBuster={[state.condensed.length, state.redrawLines]}
          />
        ))}
        <LineSVG
          rerender={state.redrawLines}
          condensed={state.condensed.length}
        />
      </SectionsWrapper>

      {/* dialogs */}
      <DeleteNodeCategoryDialog />
      <DeleteSectionDialog />
    </GraphViewWrap>
  )
}

export default memo(GraphView)
