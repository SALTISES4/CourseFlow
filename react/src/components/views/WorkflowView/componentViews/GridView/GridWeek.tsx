import { CfObjectType } from '@cf/types/enum'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import EditableComponent, {
  EditableComponentProps,
  EditableComponentStateType
} from '@cfEditableComponents/EditableComponent'
import { getNodeByID } from '@cfFindState'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { AppState, TNodeweek, TWorkflow } from '@cfRedux/types/type'
import * as Utility from '@cfUtility'
import { connect } from 'react-redux'

import GridNode from './GridNode'

/**
 * A block representing a term in the grid view
 */
type OwnProps = {
  rank: number
  data: any
} & EditableComponentProps

type ConnectedProps = {
  workflow: TWorkflow
  nodes: any
  generalEducation: number
  specificEducation: number
  totalTheory: number
  totalPractical: number
  totalIndividual: number
  totalTime: number
  totalRequired: number
}

type PropsType = OwnProps & ConnectedProps

class GridWeekUnconnected extends EditableComponent<
  PropsType,
  EditableComponentStateType
> {
  private manager: BetterSelectionManager

  constructor(props: PropsType) {
    super(props)
    this.manager = new BetterSelectionManager(this.props.dispatch)

    // viewComments
    // selectionManager
    this.objectType = CfObjectType.WEEK // @todo check addEditable
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    const defaultText = data.weekTypeDisplay + ' ' + (this.props.rank + 1)
    const nodes = this.props.nodes.map((node) => <GridNode data={node} />)

    const comments = this.props.workflow.workflowPermissions.viewComments ? (
      <this.AddCommenting />
    ) : (
      <></>
    )

    // this.addEditable(data, true)

    return (
      <div
        className="week"
        ref={this.mainDiv}
        style={this.getBorderStyle()}
        onClick={(e) => {
          e.stopPropagation()
          this.manager.updateSidebar(
            data.id,
            this.objectType,
            this.props.parentId
          )
        }}
      >
        <div className="week-title">
          <TitleText text={data.title} defaultText={defaultText} />
          <div className="grid-ponderation">
            {this.props.totalTheory +
              '/' +
              this.props.totalPractical +
              '/' +
              this.props.totalIndividual}
          </div>
        </div>
        {nodes}
        {/*{this.addEditable(data, true)}*/}
        <div className="mouseover-actions">{comments}</div>
        <div className="side-actions">
          <div className="comment-indicator-container"></div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  const data = ownProps.data

  const nodeWeeks = Utility.filterThenSortByID<TNodeweek>(
    state.nodeweek,
    data.nodeweekSet
  )
  const nodesData = nodeWeeks
    .map((nodeweek) => getNodeByID(state, nodeweek.node).data)
    .filter((node) => !Utility.checkSetHidden(node, state.objectset))
  // let nodesData = Utility.filterThenSortByID(state.node,nodeWeeks.map(nodeWeek=>nodeWeek.node)).filter(node=>!Utility.checkSetHidden(node,state.objectset));

  // @todo getNodeByID returns GetNodeByIDType
  // which does not contain representsWorkflow property
  // so this will always be false, verify and remove check
  const overrideData = nodesData.map((node) => {
    // @ts-ignore
    if (node.representsWorkflow) {
      return {
        ...node,
        // @ts-ignore
        ...node.linkedWorkflowData
      }
    } else {
      return node
    }
  })

  const generalEducation = overrideData.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.timeGeneralHours) {
        return previousValue + currentValue.timeGeneralHours
      }
      return previousValue
    },
    0
  )

  const specificEducation = overrideData.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.timeSpecificHours) {
        return previousValue + currentValue.timeSpecificHours
      }
      return previousValue
    },
    0
  )

  const totalTheory = overrideData.reduce((previousValue, currentValue) => {
    if (currentValue && currentValue.ponderationTheory) {
      return previousValue + currentValue.ponderationTheory
    }
    return previousValue
  }, 0)

  const totalPractical = overrideData.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.ponderationPractical) {
        return previousValue + currentValue.ponderationPractical
      }
      return previousValue
    },
    0
  )

  const totalIndividual = overrideData.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.ponderationIndividual) {
        return previousValue + currentValue.ponderationIndividual
      }
      return previousValue
    },
    0
  )

  const totalTime = totalTheory + totalPractical + totalIndividual

  const totalRequired = overrideData.reduce((previousValue, currentValue) => {
    if (currentValue && currentValue.timeRequired) {
      return previousValue + parseInt(currentValue.timeRequired)
    }
    return previousValue
  }, 0)

  return {
    workflow: state.workflow,
    nodes: overrideData,
    generalEducation: generalEducation,
    specificEducation: specificEducation,
    totalTheory: totalTheory,
    totalPractical: totalPractical,
    totalIndividual: totalIndividual,
    totalTime: totalTime,
    totalRequired: totalRequired
  }
}
const GridWeek = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(GridWeekUnconnected)

export default GridWeek
