import { CfObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import Utility from '@cf/utility/Utility.class'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import { HoverMenu } from '@cfEditableComponents/hoverEditActions'
import {
  TGetWeekByIDType,
  getColumnWorkflowByID,
  getColumnWorkflowByID2
} from '@cfFindState'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import NodeWeek from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeWeek'
import WeekDragAndDropManager from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/week/WeekDragAndDropManager.class'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import clsx from 'clsx'
import * as React from 'react'
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createSelector } from 'reselect'

type ConnectedProps = {
  week: TGetWeekByIDType
  workflow: TWorkflow
}

type OwnProps = {
  objectId: number
  parentId: number
  throughParentId: number
  rank?: number
  columnOrder?: any // @todo i think this is delivered by redux
  nodesByColumn?: any
} & ConnectedProps

export type WeekUnconnectedPropsType = OwnProps
/**
 * Reselect selector that gets the workflow from state only when needed.
 */

const selectWeeks = (state: AppState) => state.week
const selectWorkflow = (state: AppState) => state.workflow
const selectNodeWeeks = (state: AppState) => state.nodeweek
const selectColumnWorkflow = (state: AppState) => state.columnworkflow

// @todo why are weeks and terms handled differently
export const getWeekById = createSelector(
  [
    selectWeeks,
    selectWorkflow,
    selectNodeWeeks,
    selectColumnWorkflow,
    (state: AppState, id: number) => id
  ],
  (weeks, workflow, nodeweeks, columnworkflow, id) => {
    const week = weeks.find((w) => w.id === id)

    if (!week) {
      Utility.logger('No week found with id', id)
      return undefined
    }

    // Ensure immutability and derive additional properties
    //  const isDropped = week.isDropped ?? getDropped(id, 'week')
    const isDropped = true
    return {
      data: { ...week, isDropped },
      columnOrder: workflow.columnworkflowSet.map((columnId) => {
        const columnWorkflow = getColumnWorkflowByID2(
          columnworkflow,
          workflow,
          columnId
        )
        return columnWorkflow?.data?.column
      }),
      siblingCount: workflow.weekworkflowSet.length,
      nodeweeks,
      workflowId: workflow.id
    }
  }
)

/**
 *
 **/
const Week = ({ objectId, parentId, rank, columnOrder, nodesByColumn }) => {
  /*******************************************************
   * REDUX
   *******************************************************/
  const dispatch = useDispatch()
  const week = useSelector((state) => getWeekById(state, objectId));
  const workflow = useSelector((state: AppState) => state.workflow)


  /*******************************************************
   * REFS
   *******************************************************/
  const nodeBlock = useRef(null)
  const mainDiv = useRef(null)
  const manager = useRef(new BetterSelectionManager(dispatch))
  const dragAndDropManager = useRef(null)

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  useEffect(() => {
    dragAndDropManager.current = new WeekDragAndDropManager({
      objectId,
      parentId
    })

    const classIdentifiers = {
      objectClass: '.node-week',
      handle: '.node',
      container: '.week-block'
    }

    const jQuerySortableBlockTarget = $(nodeBlock.current)
      .children('.node-week')
      .not('.ui-draggable')

    dragAndDropManager.current.makeSortableNode(
      //       nodeBlock.current,
      jQuerySortableBlockTarget,
      objectId,
      classIdentifiers
    )

    dragAndDropManager.current.makeDroppable(mainDiv.current)
    return () => {}
  }, [objectId, parentId])

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const Nodes = ({ nodeweekSet }: {nodeweekSet: number[]}) => {
    if (!nodeweekSet?.length) {
      return (
        <div className="node-week placeholder" style={{ height: '100%' }}>
          Drag and drop nodes from the sidebar to add.
        </div>
      )
    }
    return nodeweekSet.map((nodeId) => (
      <NodeWeek
        key={nodeId}
        objectId={nodeId}
        parentId={week.data.id}
        columnOrder={week.columnOrder}
      />
    ))
  }

  const StrategyTab = () => {
    const { strategyClassification } = week.data
    if (strategyClassification <= 0) {
      return null
    }
    return (
      <div className="strategy-tab">
        <div className="strategy-tab-triangle" />
        <div className="strategy-tab-square">
          <div className="strategy-tab-circle">
            // check class for what goese here
          </div>
        </div>
      </div>
    )
  }

  const defaultText = !workflow.isStrategy
    ? `${week.data.weekTypeDisplay} ${rank + 1}`
    : undefined
  const dropIcon = week.data.isDropped ? (
    <ArrowDropDownIcon />
  ) : (
    <ArrowDropUpIcon />
  )

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <div
      style={ThemeHelper.getBorderStyle({
        isLocked: week.data?.lock?.lock,
        colour: week.data?.lock?.userColour
      })}
      className={clsx('week', {
        strategy: week.data.isStrategy,
        dropped: week.data.isDropped,
        [`locked`]: week.data?.lock,
        [`locked-${week.data.lock?.userId}`]: week.data.lock
      })}
      ref={mainDiv}
      onClick={(e) => {
        e.stopPropagation()
        manager.current.updateSidebar(week.data.id, objectId, parentId)
      }}
    >
      <div className="mouseover-container-bypass">
        <HoverMenu
          canWrite={workflow.workflowPermissions.write && !workflow.isStrategy}
          canComment={workflow.workflowPermissions.viewComments}
          objectId={objectId}
          parentId={parentId}
          objectType={CfObjectType.WEEK}
        />
      </div>
      <TitleText text={week.data.title} defaultText={defaultText} />
      <div className="node-block" id={`${objectId}-node-block`} ref={nodeBlock}>
        <Nodes nodeweekSet={week.data.nodeweekSet} />
      </div>
      <div
        className="week-drop-row hover-shade"
        onClick={(evt) => {
          evt.stopPropagation()
          manager.current.toggleDropReduxAction({
            objectId,
            objectType: CfObjectType.WEEK,
            newDropState: !week.data?.isDropped
          })
        }}
      >
        <div style={{ textAlign: 'center', width: '100%', height: '100%' }}>
          {dropIcon}
        </div>
      </div>
      <StrategyTab />
    </div>
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
