import { _t } from '@cf/utility/utilityFunctions'
import { getNodeByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import React from 'react'
import { useSelector } from 'react-redux'

type OwnProps = {
  objectId: number
}

/**
 * The nodes (specifically the time data) in the matrix view
 */
const MatrixNode = ({ objectId }: OwnProps) => {
  const node = useSelector((state: AppState) => getNodeByID(state, objectId))

  // @todo params here still a mess
  // data is any
  // look at renderer etc
  const TimeData = ({ data }) => {
    return (
      <>
        <div className="table-cell">{data.timeGeneralHours}</div>
        <div className="table-cell">{data.timeSpecificHours}</div>
        <div className="table-cell">
          {(data.timeGeneralHours || 0) + (data.timeSpecificHours || 0)}
        </div>
        <div className="table-cell blank" />
        <div className="table-cell">{data.ponderationTheory}</div>
        <div className="table-cell">{data.ponderationPractical}</div>
        <div className="table-cell">{data.ponderationIndividual}</div>
        <div className="table-cell">
          {data.ponderationTheory +
            data.ponderationPractical +
            data.ponderationIndividual}
        </div>
        <div
          className="table-cell"
          // Note:  'titletext' is not valid attribute
          // @ts-ignore
          titletext={
            data.timeUnits
              ? _t(data.renderer.time_choices[data.timeUnits].name) // @todo no more 'renderer'!
              : ''
          }
        >
          {data.timeRequired}
        </div>
      </>
    )
  }

  // needs work
  const dataOverride = node.data.representsWorkflow
    ? {
        ...node.data,
        ...node.data.linkedWorkflowData,
        id: node.data.id
      }
    : node.data

  return (
    <div className="matrix-time-row">
      <div className="table-cell blank" />
      <TimeData data={dataOverride} />
    </div>
  )
}

export default MatrixNode

/**
 * The nodes (specifically the time data) in the matrix view
 */
// class MatrixNodeUnconnected extends React.Component<PropsType> {
//   objectType: CfObjectType
//
//   constructor(props: PropsType) {
//     super(props)
//     this.objectType = CfObjectType.NODE
//   }
//
//   /*******************************************************
//    * COMPONENTS
//    *******************************************************/
//   TimeData = ({ data }) => {
//     return (
//       <>
//         <div className="table-cell">{data.timeGeneralHours}</div>
//         <div className="table-cell">{data.timeSpecificHours}</div>
//         <div className="table-cell">
//           {(data.timeGeneralHours || 0) + (data.timeSpecificHours || 0)}
//         </div>
//         <div className="table-cell blank" />
//         <div className="table-cell">{data.ponderationTheory}</div>
//         <div className="table-cell">{data.ponderationPractical}</div>
//         <div className="table-cell">{data.ponderationIndividual}</div>
//         <div className="table-cell">
//           {data.ponderationTheory +
//             data.ponderationPractical +
//             data.ponderationIndividual}
//         </div>
//         <div
//           className="table-cell"
//           // @todo this atrribute is not allowed on a div
//           // @ts-ignore
//           titletext={this.props.renderer.time_choices[data.timeUnits].name}
//         >
//           {data.timeRequired}
//         </div>
//       </>
//     )
//   }
//
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     const data = this.props.data
//     const data_override = data.representsWorkflow
//       ? {
//           ...data,
//           ...data.linkedWorkflowData,
//           id: data.id
//         }
//       : data
//
//     return (
//       <div className="matrix-time-row">
//         <div className="table-cell blank" />
//         <this.TimeData data={data_override} />
//       </div>
//     )
//   }
// }
// const mapStateToProps = (state: AppState, ownProps: OwnProps): TGetNodeById => {
//   return getNodeByID(state, ownProps.objectId)
// }
//
// const MatrixNode = connect<ConnectedProps, object, OwnProps, AppState>(
//   mapStateToProps,
//   null
// )(MatrixNodeUnconnected)
//
// export default MatrixNode
