import { CfObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { selectWeekById } from '@cfRedux/selectors/week.selector'
import { weekChangeField } from '@cfRedux/slices/week.slice'
import { RootState } from '@cfRedux/store'
import { AppState } from '@cfRedux/types/type'
import NodeWrapper from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeWrapper'
import StrategyTabIcon from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/week/components/StrategyTabIcon'
import WorkflowFunctions from '@cfViews/WorkflowView/componentViews/WorkflowEditView/workflow.actions.class'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import clsx from 'clsx'
import { useCallback, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import DroppableCell from '../DroppableCell'
import * as Styled from './styles'
import { Cell, CellRow, DebugCellInfo } from '../../styles'

type PropsType = {
  objectId: number
  parentId: number
  reordering: boolean
}

export type WeekUnconnectedPropsType = PropsType

/**
 *
 **/
const Week = ({ objectId, parentId, reordering = false }: PropsType) => {
  /*******************************************************
   * REDUX
   *******************************************************/
  const dispatch = useDispatch()
  const week = useSelector((state: RootState) =>
    selectWeekById(state, objectId)
  )
  const sidebarDragTarget = useSelector(
    (state: RootState) => state.sidebar.dragging.target
  )
  const workflow = useSelector((state: RootState) => state.workspace.workflow)
  /*******************************************************
   * HOOKS: STATE
   *******************************************************/
  const [nodesDragState, setNodesDragState] = useState(week.nodes || [])

  /*******************************************************
   * REFS
   *******************************************************/
  const nodeBlock = useRef(null)
  const mainDiv = useRef(null)
  const manager = useRef(new BetterSelectionManager(dispatch))

  /*******************************************************
   * DRAGGABLE NODES
   *******************************************************/
  const handleNodeDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = nodesDragState.indexOf(active.id)
    const newIndex = nodesDragState.indexOf(over.id)

    const reorderedColumns = WorkflowFunctions.reorderArray(
      nodesDragState,
      oldIndex,
      newIndex
    )
    // set local state
    setNodesDragState(reorderedColumns)
    // commit to DB
    //    WorkflowAction.
  }

  const handleNodeDragStart = () => {
    //  dispatch(updateAllEntities(CfObjectType.WEEK, () => ({ isDropped: false })))
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const Nodes = () => {
    if (!nodesDragState?.length) {
      return (
        <CellRow sx={{ position: 'relative' }}>
          {/* <Styled.EmptyText>
            Drag and drop nodes from the sidebar to add.
          </Styled.EmptyText> */}

          {workflow.columns.map((colNum) => (
            <DroppableCell
              key={colNum}
              groupId={weekData.week.id}
              coords={{
                row: 0,
                column: colNum
              }}
            >
              <Cell sx={{ height: 64 }}>
                <DebugCellInfo>row: 0, col: {colNum}</DebugCellInfo>
              </Cell>
            </DroppableCell>
          ))}
        </CellRow>
      )
    }

    return nodesDragState.map((nodeId, row) => (
      <CellRow key={`node-${nodeId}`}>
        <NodeWrapper objectId={nodeId} parentId={week.id} row={row} />
      </CellRow>
    ))
  }

  const defaultText = !workflow.isStrategy
    ? `${week.weekTypeDisplay} ${week.order + 1}`
    : undefined

  const toggleCollapse = useCallback((evt) => {
    evt.stopPropagation()
    dispatch(
      weekChangeField({
        id: objectId,
        data: { isDropped: !week.isDropped }
      })
    )
  }, [])

  // always collapse if reordering is ongoing, otherwise rely on week data
  const expanded = reordering === true ? false : week.isDropped

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <Styled.WeekWrapper
      style={ThemeHelper.getBorderStyle({
        isLocked: week?.lock?.lock,
        colour: week?.lock?.userColour
      })}
      className={clsx('week', {
        strategy: week.isStrategy,
        dropped:week.isDropped,
        [`locked`]: week?.lock,
        [`locked-${week.lock?.userId}`]: week.lock
      })}
      //      ref={mainDiv}
      onClick={(e) => {
        e.stopPropagation()
        manager.current.updateSidebar(
          week.id,
          CfObjectType.WEEK,
          parentId
        )
      }}
    >
      <Styled.WeekHeader expanded={expanded}>
        <Styled.WeekTitle variant="subtitle2">
          <TitleText text={week.title} defaultText={defaultText} />
        </Styled.WeekTitle>
        <IconButton
          onClick={toggleCollapse}
          sx={{ opacity: reordering ? 0 : 1 }}
        >
          <KeyboardArrowDown />
        </IconButton>
      </Styled.WeekHeader>

      {/*
       .node-block being used
       as jquery target for drag and drop
       and css
      */}

      {expanded && (
        <div
          id={`${objectId}-node-block`}
          className="node-block"
          ref={nodeBlock}
        >
          {sidebarDragTarget ? (
            <Nodes />
          ) : (
            <DndContext
              onDragEnd={handleNodeDragEnd}
              onDragStart={handleNodeDragStart}
            >
              <SortableContext
                items={nodesDragState}
                strategy={rectSortingStrategy}
              >
                <Nodes />
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
      <StrategyTabIcon
        strategyClassification={week.strategyClassification}
      />
    </Styled.WeekWrapper>
  )
}

export default Week

// /**
//  * Renders a standard 'week-style' block of nodes, wherein the
//  * nodes appear one above the other, never side by side
//  */
// class WeekUnconnected extends React.Component<WeekUnconnectedPropsType> {
//   protected nodeBlock: React.RefObject<HTMLDivElement>
//   protected manager: BetterSelectionManager
//   private mainDiv: React.RefObject<HTMLDivElement>
//   private objectType: CfObjectType
//   private dragAndDropManager: WeekDragAndDropManager // Add this line
//
//   constructor(props: WeekUnconnectedPropsType) {
//     super(props)
//
//     this.manager = new BetterSelectionManager(this.props.dispatch)
//     this.objectType = CfObjectType.WEEK
//     this.nodeBlock = React.createRef()
//     this.mainDiv = React.createRef()
//     // Initialize the drag and drop manager
//     this.dragAndDropManager = new WeekDragAndDropManager({
//       // Assuming that WeekDragAndDropManager expects some props for initialization
//       objectId: this.props.objectId,
//       parentId: this.props.parentId
//     })
//   }
//
//   /*******************************************************
//    * LIFECYCLE
//    *******************************************************/
//   componentDidMount() {
//     this.makeDragAndDrop()
//   }
//
//   componentDidUpdate() {
//     this.makeDragAndDrop()
//     ThemeHelper.triggerHandlerEach(
//       $(this.mainDiv.current).find('.node'),
//       'component-updated'
//     )
//   }
//
//   /*******************************************************
//    * FUNCTIONS
//    *******************************************************/
//   makeDragAndDrop() {
//     const classIdentifiers = {
//       objectClass: '.node-week',
//       handle: '.node',
//       container: '.week-block'
//     }
//
//     const jQuerySortableBlockTarget = $(this.nodeBlock.current)
//       .children('.node-week')
//       .not('.ui-draggable')
//
//     this.dragAndDropManager.makeSortableNode(
//       jQuerySortableBlockTarget,
//       this.props.objectId,
//       CfObjectType.NODEWEEK,
//       classIdentifiers.objectClass,
//       null,
//       [200, 1],
//       null,
//       classIdentifiers.handle,
//       classIdentifiers.container
//     )
//
//     this.dragAndDropManager.makeDroppable(this.mainDiv?.current)
//   }
//
//   /*******************************************************
//    * COMPONENTS
//    *******************************************************/
//   Nodes = ({ nodeweekSet }: { nodeweekSet: any }) => {
//     if (!nodeweekSet?.length) {
//       return (
//         <div className="node-week placeholder" style={{ height: '100%' }}>
//           Drag and drop nodes from the sidebar to add.
//         </div>
//       )
//     }
//     return this.props.week.data.nodeweekSet.map((nodeId) => (
//       <NodeWeek
//         key={nodeId}
//         objectId={nodeId}
//         parentId={this.props.week.data.id}
//         columnOrder={this.props.week.columnOrder}
//       />
//     ))
//   }
//
//   StrategyTab = () => {
//     const data = this.props.week.data
//
//     if (data.strategyClassification <= 0) {
//       return <></>
//     }
//     return (
//       <div className="strategy-tab">
//         <div className="strategy-tab-triangle" />
//         <div className="strategy-tab-square">
//           <div className="strategy-tab-circle">
//             <img
//               title={
//                 choices.strategyClassificationChoices?.find(
//                   (obj) => obj.type === data.strategyClassification
//                 ).name
//               }
//               src={
//                 apiPaths.external.static_assets.icon +
//                 Constants.strategyKeys[data.strategyClassification] +
//                 '.svg'
//               }
//             />
//           </div>
//         </div>
//       </div>
//     )
//   }
//
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     const data = this.props.week.data
//
//     const cssClasses = [
//       'week',
//       data.isStrategy ? 'strategy' : '',
//       data.lock ? 'locked locked-' + data.lock.userId : '',
//       data.isDropped ? ' dropped' : ''
//     ].join(' ')
//
//     const defaultText = !this.props.workflow.isStrategy
//       ? data.weekTypeDisplay + ' ' + (this.props.rank + 1)
//       : undefined
//
//     const dropIcon = data.isDropped ? (
//       <ArrowDropDownIcon />
//     ) : (
//       <ArrowDropUpIcon />
//     )
//     return (
//       <>
//         <div
//           style={ThemeHelper.getBorderStyle({
//             isLocked: data.lock?.lock,
//             colour: data.lock?.userColour
//           })}
//           className={cssClasses}
//           ref={this.mainDiv}
//           onClick={(e) => {
//             e.stopPropagation()
//             this.manager.updateSidebar(
//               data.id,
//               this.objectType,
//               this.props.parentId
//             )
//           }}
//         >
//           <div className="mouseover-container-bypass">
//             <HoverMenu
//               canWrite={
//                 this.props.workflow.workflowPermissions.write &&
//                 !this.props.workflow.isStrategy
//               }
//               canComment={this.props.workflow.workflowPermissions.viewComments}
//               objectId={this.props.objectId}
//               parentId={this.props.parentId}
//               objectType={this.objectType}
//             />
//           </div>
//
//           <TitleText text={data.title} defaultText={defaultText} />
//
//           <div
//             className="node-block"
//             id={this.props.objectId + '-node-block'}
//             ref={this.nodeBlock}
//           >
//             <this.Nodes nodeweekSet={this.props.week.data.nodeweekSet} />
//           </div>
//
//           <div
//             className="week-drop-row hover-shade"
//             onClick={(evt) => {
//               evt.stopPropagation()
//               this.manager.toggleDropReduxAction({
//                 objectId: this.props.objectId,
//                 objectType: this.objectType,
//                 newDropState: !this.props.week.data?.isDropped
//               })
//             }}
//           >
//             <div
//               style={{
//                 textAlign: 'center',
//                 width: '100%',
//                 height: '100%'
//               }}
//             >
//               {dropIcon}
//             </div>
//           </div>
//
//           <this.StrategyTab />
//         </div>
//       </>
//     )
//   }
// }
//
// const mapWeekStateToProps = (
//   state: AppState,
//   ownProps: OwnProps
// ): ConnectedProps => {
//   return {
//     week: getWeekById(state, ownProps.objectId),
//     workflow: state.workflow
//   }
// }
//
// const Week = connect<ConnectedProps, object, OwnProps, AppState>(
//   mapWeekStateToProps,
//   null
// )(WeekUnconnected)
//
// export default Week
// export { WeekUnconnected }
