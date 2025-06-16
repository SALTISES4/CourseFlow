import { selectOutcomeById } from '@cfRedux/selectors/outcome.selector'
import { AppState } from '@cfRedux/types/type'
import React from 'react'
import { useSelector } from 'react-redux'

import Outcome from './Outcome'
import {RootState} from "@cfRedux/store";

/**
 * The link between an outcome and its children
 */
type PropsType = {
  parentId: number
  objectId: number
  showHorizontal: any
  parentDepth: any
}

// like other wrappers, unclear whether this component still serves a purpose
// wait for end of fixing drag and drop
const OutcomeWrapper = ({
  parentId,
  objectId,
  showHorizontal,
  parentDepth
}: PropsType) => {
  const outcomeData = useSelector((state: RootState) =>
    selectOutcomeById(state, objectId)
  )

  let myClass = `outcome-outcome outcome-outcome-${parentDepth}`
  if (outcomeData.outcome?.noDrag) {
    myClass += ' no-drag'
  }

  return (
    <li
      className={myClass}
      id={String(outcomeData.outcome?.id)}
      data-child-id={objectId}
    >
      <Outcome
        objectId={objectId}
        parentId={parentId}
        throughParentId={objectId}
        showHorizontal={showHorizontal}
      />
    </li>
  )
}

export default OutcomeWrapper

// import { CfObjectType } from '@cf/types/enum'
// import { TOutcomeOutcomeByID, getOutcomeOutcomeById } from '@cfFindState'
// import { AppState } from '@cfRedux/types/type'
// import * as React from 'react'
// import { connect } from 'react-redux'
//
// import Outcome from './Outcome'
//
// /**
//  * The link between an outcome and its children
//  */
// type ConnectedProps = TOutcomeOutcomeByID
// type OwnProps = {
//   parentId: number
//   objectId: number
//   // renderer: any
//   showHorizontal: any
//   parentDepth: any
// }
// type PropsType = OwnProps & ConnectedProps
// class OutcomeOutcomeUnconnected extends React.Component<PropsType> {
//   private objectType: CfObjectType // @todo is it used?
//   constructor(props: PropsType) {
//     super(props)
//     this.objectType = CfObjectType.OUTCOMEOUTCOME // @todo check addEditable
//   }
//
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     const data = this.props.data
//     let myClass = 'outcome-outcome outcome-outcome-' + this.props.parentDepth
//     if (data.noDrag) {
//       myClass += ' no-drag'
//     }
//
//     //Child outcomes. See comment in models/outcome.py for more info.
//     return (
//       <li
//         className={myClass}
//         id={String(data.id)}
//         // ref={this.mainDiv} // @todo verify but this was not used
//         data-child-id={data.child}
//       >
//         <Outcome
//           objectId={data.child}
//           parentId={this.props.parentId}
//           throughParentId={data.id}
//           // renderer={this.props.renderer}
//           showHorizontal={this.props.showHorizontal}
//         />
//       </li>
//     )
//   }
// }
//
// const mapStateToProps = (
//   state: AppState,
//   ownProps: OwnProps
// ): TOutcomeOutcomeByID => {
//   return getOutcomeOutcomeById(state, ownProps.objectId)
// }
//
// const OutcomeOutcome = connect<ConnectedProps, object, OwnProps, AppState>(
//   mapStateToProps,
//   null
// )(OutcomeOutcomeUnconnected)
//
// export default OutcomeOutcome
