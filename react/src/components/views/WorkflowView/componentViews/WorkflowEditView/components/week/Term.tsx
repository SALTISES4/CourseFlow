import { CfObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import { HoverMenu } from '@cfEditableComponents/hoverEditActions'
import { getTermById } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import NodeWeek from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeWeek'
import WeekDragAndDropManager from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/week/WeekDragAndDropManager.class'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import clsx from 'clsx'
import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

type OwnProps = {
  objectId: number
  parentId: number
  rank: number
  columnOrder: any[]
  nodesByColumn: Record<string, number[]>
}

const Term = ({
  objectId,
  parentId,
  rank,
  columnOrder,
  nodesByColumn
}: OwnProps) => {
  const term = useSelector((state: AppState) => getTermById(state, objectId))
  const workflow = useSelector((state: AppState) => state.workflow)
  const dragAndDropManager = useRef(null)

  const mainDiv = useRef<HTMLDivElement>(null)
  const nodeBlock = useRef<HTMLDivElement>(null)

  const makeDragAndDrop = () => {
    const nodeWeeks = Array.from(
      nodeBlock.current?.querySelectorAll('.node-week') || []
    ).filter((el) => !el.classList.contains('ui-draggable'))
  }

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

    // which selector
    //     const nodeWeeks = Array.from(
    //   nodeBlock.current?.querySelectorAll('.node-week') || []
    // ).filter((el) => !el.classList.contains('ui-draggable'))

    const jQueryNodeBlock = $(this.nodeBlock.current)
      .children()
      .children('.node-week')
      .not('.ui-draggable')

    //Makes the nodeweeks in the node block draggable
    dragAndDropManager.current.makeSortableNode(
      nodeBlock,
      objectId,
      CfObjectType.NODEWEEK,
      classIdentifiers.objectClass,
      false,
      [200, 1],
      null,
      classIdentifiers.handle
    )
  }, [term, columnOrder])

  const data = term.data
  const nodeBlocks = columnOrder.map((col) => {
    const nodeweeks = nodesByColumn[col]?.map((nodeweek) => (
      <NodeWeek
        key={nodeweek}
        objectId={nodeweek}
        parentId={data.id}
        columnOrder={columnOrder}
      />
    ))

    if (!nodeweeks || nodeweeks.length === 0) {
      nodeweeks?.push(
        <div className="node-week placeholder" style={{ height: '100%' }}></div>
      )
    }

    return (
      <div
        className={`node-block term column-${col}`}
        id={`${objectId}-node-block-column-${col}`}
        key={col}
      >
        {nodeweeks}
      </div>
    )
  })

  return (
    <div
      style={ThemeHelper.getBorderStyle({
        isLocked: data.lock.lock,
        colour: data.lock.userColour
      })}
      className={clsx('week', {
        strategy: data.isStrategy,
        dropped: data.isDropped,
        [`locked`]: data.lock,
        [`locked-${data.lock.userId}`]: data.lock
      })}
      ref={mainDiv}
      onClick={(e) => {
        e.stopPropagation()
        // selection manager goes here
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
      <TitleText
        text={data.title}
        defaultText={`${data.weekTypeDisplay} ${rank + 1}`}
      />
      <div className="node-block" id={`${objectId}-node-block`} ref={nodeBlock}>
        {nodeBlocks}
      </div>
      <div
        className="week-drop-row hover-shade"
        onClick={(evt) => {
          evt.stopPropagation()
          //  toggleDropReduxAction goes here
        }}
      >
        <div className="node-drop-side node-drop-left"></div>
        <div className="node-drop-middle">
          <ArrowDropDownIcon />
        </div>
        <div className="node-drop-side node-drop-right"></div>
      </div>
    </div>
  )
}

export default Term

// import { apiPaths } from '@cf/router/apiRoutes'
// import { CfObjectType } from '@cf/types/enum'
// import * as Constants from '@cf/utility/constants'
// import ThemeHelper from '@cf/utility/ThemeHelper.class'
// import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
// import { HoverMenu } from '@cfEditableComponents/hoverEditActions'
// import { TTermByID, getTermById } from '@cfFindState'
// import { AppState, TWorkflow } from '@cfRedux/types/type'
// import NodeWeek from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeWeek'
// import {
//   WeekUnconnected,
//   WeekUnconnectedPropsType
// } from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/week/Week'
// import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
// import * as React from 'react'
// import { connect } from 'react-redux'
//
// type ConnectedProps = {
//   term: TTermByID
//   workflow: TWorkflow
// }
//
// type OwnProps = WeekUnconnectedPropsType
//
// type PropsType = OwnProps & ConnectedProps
//
// // this should not be handled like this
// // term and week are the same model
// // term should definitely NOT extend week
// // they are siblings
// /**
//  * The term variation of a week, used in the program level or in the
//  * condensed view. This displays the nodes side by side.
//  */
// class Term extends WeekUnconnected<PropsType> {
//   /*******************************************************
//    * FUNCTIONS
//    *******************************************************/
//   makeDragAndDrop() {
//     //Makes the nodeweeks in the node block draggable
//     this.makeSortableNode(
//       $(this.nodeBlock.current)
//         .children()
//         .children('.node-week')
//         .not('.ui-draggable'),
//       this.props.objectId,
//       'nodeweek',
//       '.node-week',
//       false,
//       [200, 1],
//       null,
//       '.node'
//     )
//   }
//
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     const data = this.props.term.data
//     const nodeBlocks = []
//
//     for (let i = 0; i < this.props.columnOrder.length; i++) {
//       const col = this.props.columnOrder[i]
//       const nodeweeks = []
//       for (let j = 0; j < data.nodeweekSet.length; j++) {
//         const nodeweek = data.nodeweekSet[j]
//         if (this.props.nodesByColumn[col].indexOf(nodeweek) >= 0) {
//           nodeweeks.push(
//             <NodeWeek
//               key={nodeweek}
//               objectId={nodeweek}
//               parentId={data.id}
//               // renderer={this.props.renderer}
//               columnOrder={this.props.columnOrder}
//             />
//           )
//         }
//       }
//       if (nodeweeks.length == 0) {
//         nodeweeks.push(
//           <div
//             className="node-week placeholder"
//             style={{ height: '100%' }}
//           ></div>
//         )
//       }
//       nodeBlocks.push(
//         <div
//           className={'node-block term column-' + col}
//           id={this.props.objectId + '-node-block-column-' + col}
//           key={col}
//         >
//           {nodeweeks}
//         </div>
//       )
//     }
//
//     const cssClasses = [
//       'week',
//       data.isStrategy ? 'strategy' : '',
//       data.lock ? 'locked locked-' + data.lock.userId : '',
//       data.isDropped ? ' dropped' : ''
//     ].join(' ')
//     // const cssClass = 'week'
//     // if (data.isStrategy) cssClass += ' strategy'
//     // if (data.lock) cssClass += ' locked locked-' + data.lock.userId
//     //    if (data.isDropped) cssClass += ' dropped'
//
//     return (
//       <>
//         {/*{this.addEditable(data)}*/}
//
//         <div
//           style={ThemeHelper.getBorderStyle({
//             isLocked: data.lock.lock,
//             colour: data.lock.userColour
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
//           <TitleText
//             text={data.title}
//             defaultText={data.weekTypeDisplay + ' ' + (this.props.rank + 1)}
//           />
//           <div
//             className="node-block"
//             id={this.props.objectId + '-node-block'}
//             ref={this.nodeBlock}
//           >
//             {nodeBlocks}
//           </div>
//           <div
//             className="week-drop-row hover-shade"
//             onClick={(evt) => {
//               evt.stopPropagation()
//               this.manager.toggleDropReduxAction({
//                 objectId: this.props.objectId,
//                 objectType: Constants.objectDictionary[
//                   this.objectType
//                 ] as CfObjectType,
//                 newDropState: !this.props.term.data?.isDropped
//               })
//             }}
//           >
//             <div className="node-drop-side node-drop-left"></div>
//             <div className="node-drop-middle">
//               <ArrowDropDownIcon />
//             </div>
//             <div className="node-drop-side node-drop-right"></div>
//           </div>
//         </div>
//       </>
//     )
//   }
// }
//
// const mapStateToProps = (
//   state: AppState,
//   ownProps: OwnProps
// ): ConnectedProps => {
//   return {
//     term: getTermById(state, ownProps.objectId),
//     workflow: state.workflow
//   }
// }
//
// export default connect<ConnectedProps, object, OwnProps, AppState>(
//   mapStateToProps,
//   null
// )(Term)
