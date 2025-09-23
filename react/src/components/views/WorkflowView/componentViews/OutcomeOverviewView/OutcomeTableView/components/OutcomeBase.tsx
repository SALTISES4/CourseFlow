import { createOutcomeNodeBranch } from '@cf/utility/createOutcomeNodeBranch'
import { AppState } from '@cfRedux/types/type'
import CompetencyMatrixView from '@cfViews/WorkflowView/componentViews/OutcomeOverviewView/CompetencyMatrixView/CompetencyMatrixView'
import React from 'react'
import { useSelector } from 'react-redux'

import Outcome from './Outcome'
import {RootState} from "@cfRedux/store";

type PropsType = {
  type: string
  nodecategory: any
  objectId: number
}

const OutcomeBase = ({ type, nodecategory, objectId }: PropsType) => {
  const outcomesType = useSelector(
    (state: AppState) => state.workflow.outcomesType
  )
  const outcome = useSelector((state: RootState) => state.outcome)
  const outcomeNode = useSelector((state: RootState) => state.outcomenode)
  const outcomeOutcome = useSelector((state: RootState) => state.outcomeoutcome)

  const outcomeTree = createOutcomeNodeBranch(
    { outcomesType, outcome, outcomeNode, outcomeOutcome },
    objectId,
    nodecategory
  )

  const OutcomeView = ({ outcomeTree }) => {
    if (type === 'outcome_table') {
      return (
        <Outcome
          outcomesType={outcomesType}
          objectId={outcomeTree.id}
          outcomeTree={outcomeTree}
        />
      )
    }
    return <CompetencyMatrixView objectId={outcomeTree.id} />
  }

  return <OutcomeView outcomeTree={outcomeTree} />
}

export default OutcomeBase

// import { createOutcomeNodeBranch } from '@cf/utility/createOutcomeNodeBranch'
// import { AppState } from '@cfRedux/types/type'
// import CompetencyMatrixView from '@cfViews/WorkflowView/componentViews/CompetencyMatrixView/CompetencyMatrixView'
// import React from 'react'
// import { connect } from 'react-redux'
//
// import Outcome from './Outcome'
// /**
//  * The base representation of an outcome line in a table,
//  * regardless of the orientation of the table
//  */
// type ConnectedProps = {
//   outcomesType: any
//   outcome: any
//   outcomenode: any
//   outcomeoutcome: any
// }
//
// type OwnProps = {
//   type: string
//   nodecategory: any
//   objectId: number
//   // renderer: any
//   outcome_type: any
// }
// type PropsType = OwnProps & ConnectedProps
//
// class OutcomeBaseUnconnected extends React.Component<PropsType> {
//   /*******************************************************
//    * FUNCTIONS
//    *******************************************************/
//   OutcomeView = ({ outcomeTree }) => {
//     if (this.props.type === 'outcome_table') {
//       return (
//         <Outcome
//           outcomesType={this.props.outcomesType}
//           // objectId={this.outcomeTree.id} @todo these were the original vars, but they don't exist
//           // outcomeTree={this.outcomeTree}
//           objectId={outcomeTree.id}
//           outcomeTree={outcomeTree}
//           // renderer={this.props.renderer}
//         />
//       )
//     }
//     return (
//       <CompetencyMatrixView
//         outcomesType={this.props.outcomesType}
//         //objectId={this.outcomeTree.id} @todo these were the original vars, but they don't exist
//         // outcomeTree={this.outcomeTree}
//         objectId={outcomeTree.id}
//         // outcomeTree={outcomeTree} // defined as prop but not used in component
//         // renderer={this.props.renderer}
//       />
//     )
//   }
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     const outcomeTree = createOutcomeNodeBranch(
//       this.props,
//       this.props.objectId,
//       this.props.nodecategory
//     )
//
//     // @todo seem to be re-rendering issue, wait for hooks
//     // avoid further rerenders if possible
//     const outcomeTree_json = JSON.stringify(outcomeTree)
//
//     if (this.outcomeTree_json === outcomeTree_json) {
//       outcomeTree = this.outcomeTree
//     } else {
//       this.outcomeTree = outcomeTree
//       this.outcomeTree_json = outcomeTree_json
//     }
//
//     return <this.OutcomeView outcomeTree={outcomeTree} />
//   }
// }
//
// /*******************************************************
//  * CONNECT REDUX
//  *******************************************************/
// const mapStateToProps = (state: AppState): ConnectedProps => {
//   return {
//     outcomesType: state.workflow.outcomesType,
//     outcome: state.outcome,
//     outcomenode: state.outcomenode,
//     outcomeoutcome: state.outcomeoutcome
//   }
// }
//
// const OutcomeBase = connect<ConnectedProps, object, OwnProps, AppState>(
//   mapStateToProps,
//   null
// )(OutcomeBaseUnconnected)
//
// export default OutcomeBase
