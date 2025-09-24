import { CfObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import Utility from '@cf/utility/Utility.class'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { selectNodeById } from '@cfRedux/selectors/node.selector'
import {
  AppState,
  TNode,
  TNodeweek,
  TWeek,
  TWorkflow
} from '@cfRedux/types/type'
import React, { useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import GridNode from './GridNode'
import {RootState} from "@cfRedux/store";

type OwnProps = {
  objectId: number
  parentId: number
  rank: number
  week: TWeek
}

const GridWeek: React.FC<OwnProps> = ({ objectId, parentId, rank, week }) => {
  const dispatch = useDispatch()
  const mainDiv = useRef<HTMLDivElement>(null)
  const manager = useRef(new BetterSelectionManager(dispatch))
  const objectType = CfObjectType.WEEK

  const workflow = useSelector((state: RootState) => state.workspace.workflow)

  const nodeWeeks = Utility.filterThenSortById<TNodeweek>(
    useSelector((state: RootState) => state.nodeweek),
    week.nodeweekSet
  )

// @todo no mapped hooks
  const nodesData = nodeWeeks
    .map(
      (nodeweek) =>
        selectNodeById(
          useSelector((state: RootState) => state),
          nodeweek.node
        ).data
    )
    .filter(
      (node) =>
        !Utility.checkSetHidden(
          node,
          useSelector((state: RootState) => state.objectSet)
        )
    )

  const overrideData = nodesData.map((node) =>
    node.representsWorkflow ? { ...node, ...node.linkedWorkflowData } : node
  )

  const generalEducation = overrideData.reduce(
    (sum, node) => sum + (node?.timeGeneralHours || 0),
    0
  )
  const specificEducation = overrideData.reduce(
    (sum, node) => sum + (node?.timeSpecificHours || 0),
    0
  )
  const totalTheory = overrideData.reduce(
    (sum, node) => sum + (node?.ponderationTheory || 0),
    0
  )
  const totalPractical = overrideData.reduce(
    (sum, node) => sum + (node?.ponderationPractical || 0),
    0
  )
  const totalIndividual = overrideData.reduce(
    (sum, node) => sum + (node?.ponderationIndividual || 0),
    0
  )
  const totalTime = totalTheory + totalPractical + totalIndividual
  const totalRequired = overrideData.reduce(
    (sum, node) => sum + parseInt(node?.timeRequired || '0'),
    0
  )

  const defaultText = `${week.weekTypeDisplay} ${rank + 1}`

  const nodes = overrideData.map((node) => (
    <GridNode key={node.id} node={node} parentId={objectId} />
  ))

  const comments = workflow.workflowPermissions.viewComments ? (
    /* <AddCommenting />*/
    <></>
  ) : (
    <></>
  )

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    manager.current.updateSidebar(week.id, objectType, parentId)
  }

  return (
    <div
      className="week"
      ref={mainDiv}
      style={ThemeHelper.getBorderStyle({ isLocked: !!workflow, colour: '' })}
      onClick={handleClick}
    >
      <div className="week-title">
        <TitleText text={week.title} defaultText={defaultText} />
        <div className="grid-ponderation">
          {`${totalTheory}/${totalPractical}/${totalIndividual}`}
        </div>
      </div>
      {nodes}
      <div className="mouseover-actions">{comments}</div>
      <div className="side-actions">
        <div className="comment-indicator-container"></div>
      </div>
    </div>
  )
}

export default GridWeek

// import { CfObjectType } from '@cf/types/enum'
// import ThemeHelper from '@cf/utility/ThemeHelper.class'
// import Utility from '@cf/utility/Utility.class'
// import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
// import { getNodeByID } from '@cfFindState'
// import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
// import {
//   AppState,
//   TNode,
//   TNodeweek,
//   TWeek,
//   TWorkflow
// } from '@cfRedux/types/type'
// import { Dispatch } from '@reduxjs/toolkit'
// import React from 'react'
// import { connect } from 'react-redux'
// import { Action } from 'redux'
//
// import GridNode from './GridNode'
//
// /**
//  * A block representing a term in the grid view
//  */
// type OwnProps = {
//   objectId: number
//   parentId: number
//   rank: number
//   week: TWeek
// } & { dispatch?: Dispatch<Action> }
//
// type ConnectedProps = {
//   workflow: TWorkflow
//   nodes: TNode[]
//   generalEducation: number
//   specificEducation: number
//   totalTheory: number
//   totalPractical: number
//   totalIndividual: number
//   totalTime: number
//   totalRequired: number
// }
//
// type PropsType = OwnProps & ConnectedProps
//
// class GridWeekUnconnected extends React.Component<PropsType> {
//   private manager: BetterSelectionManager
//   private objectType: CfObjectType
//   private mainDiv: React.RefObject<HTMLDivElement>
//
//   constructor(props: PropsType) {
//     super(props)
//     this.manager = new BetterSelectionManager(this.props.dispatch)
//     this.mainDiv = React.createRef()
//     this.objectType = CfObjectType.WEEK
//   }
//
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//
//   render() {
//     const data = this.props.week
//
//     const defaultText = data.weekTypeDisplay + ' ' + (this.props.rank + 1)
//     const nodes = this.props.nodes.map((node) => (
//       <GridNode node={node} parentId={this.props.objectId} />
//     ))
//
//     const comments = this.props.workflow.workflowPermissions.viewComments ? (
//       /* <AddCommenting />*/
//       <></>
//     ) : (
//       <></>
//     )
//
//     // this.addEditable(data, true)
//
//     return (
//       <div
//         className="week"
//         ref={this.mainDiv}
//         // @todo figure out where the lock and color are
//         style={ThemeHelper.getBorderStyle({
//           isLocked: !!this.props,
//           colour: ''
//         })}
//         onClick={(e) => {
//           e.stopPropagation()
//           this.manager.updateSidebar(
//             data.id,
//             this.objectType,
//             this.props.parentId
//           )
//         }}
//       >
//         <div className="week-title">
//           <TitleText text={data.title} defaultText={defaultText} />
//           <div className="grid-ponderation">
//             {this.props.totalTheory +
//               '/' +
//               this.props.totalPractical +
//               '/' +
//               this.props.totalIndividual}
//           </div>
//         </div>
//         {nodes}
//         {/*{this.addEditable(data, true)}*/}
//         <div className="mouseover-actions">{comments}</div>
//         <div className="side-actions">
//           <div className="comment-indicator-container"></div>
//         </div>
//       </div>
//     )
//   }
// }
//
// const mapStateToProps = (
//   state: AppState,
//   ownProps: OwnProps
// ): ConnectedProps => {
//   const data = ownProps.week
//
//   const nodeWeeks = Utility.filterThenSortById<TNodeweek>(
//     state.nodeweek,
//     data.nodeweekSet
//   )
//   const nodesData = nodeWeeks
//     .map((nodeweek) => getNodeByID(state, nodeweek.node).data)
//     .filter((node) => !Utility.checkSetHidden(node, state.objectSet))
//   // let nodesData = Utility.filterThenSortByID(state.node,nodeWeeks.map(nodeWeek=>nodeWeek.node)).filter(node=>!Utility.checkSetHidden(node,state.objectSet));
//
//   // @todo getNodeByID returns GetNodeByIDType
//   // which does not contain representsWorkflow property
//   // so this will always be false, verify and remove check
//   const overrideData = nodesData.map((node) => {
//     if (node.representsWorkflow) {
//       return {
//         ...node,
//         ...node.linkedWorkflowData
//       }
//     } else {
//       return node
//     }
//   })
//
//   const generalEducation = overrideData.reduce(
//     (previousValue, currentValue) => {
//       if (currentValue && currentValue.timeGeneralHours) {
//         return previousValue + currentValue.timeGeneralHours
//       }
//       return previousValue
//     },
//     0
//   )
//
//   const specificEducation = overrideData.reduce(
//     (previousValue, currentValue) => {
//       if (currentValue && currentValue.timeSpecificHours) {
//         return previousValue + currentValue.timeSpecificHours
//       }
//       return previousValue
//     },
//     0
//   )
//
//   const totalTheory = overrideData.reduce((previousValue, currentValue) => {
//     if (currentValue && currentValue.ponderationTheory) {
//       return previousValue + currentValue.ponderationTheory
//     }
//     return previousValue
//   }, 0)
//
//   const totalPractical = overrideData.reduce((previousValue, currentValue) => {
//     if (currentValue && currentValue.ponderationPractical) {
//       return previousValue + currentValue.ponderationPractical
//     }
//     return previousValue
//   }, 0)
//
//   const totalIndividual = overrideData.reduce((previousValue, currentValue) => {
//     if (currentValue && currentValue.ponderationIndividual) {
//       return previousValue + currentValue.ponderationIndividual
//     }
//     return previousValue
//   }, 0)
//
//   const totalTime = totalTheory + totalPractical + totalIndividual
//
//   const totalRequired = overrideData.reduce((previousValue, currentValue) => {
//     if (currentValue && currentValue.timeRequired) {
//       return previousValue + parseInt(currentValue.timeRequired)
//     }
//     return previousValue
//   }, 0)
//
//   return {
//     workflow: state.workflow,
//     nodes: overrideData,
//     generalEducation: generalEducation,
//     specificEducation: specificEducation,
//     totalTheory: totalTheory,
//     totalPractical: totalPractical,
//     totalIndividual: totalIndividual,
//     totalTime: totalTime,
//     totalRequired: totalRequired
//   }
// }
// const GridWeek = connect<ConnectedProps, object, OwnProps, AppState>(
//   mapStateToProps,
//   null
// )(GridWeekUnconnected)
//
// export default GridWeek
