import * as Constants from '@cf/utility/constants'
import { _t } from '@cf/utility/Utility.class'
import LegendLine from '@cfComponents/UIPrimitives/LegendLine'
import { AppState, TNode, TWeek } from '@cfRedux/types/type'
import Legend from '@cfViews/common/Legend'
import * as React from 'react'
import { useSelector } from 'react-redux'

const choices = COURSEFLOW_APP.globalContextData.workflowChoices

/*******************************************************
 * first pass on FV conversion is done
 *******************************************************/
const WorkflowLegend = () => {
  const stateNodes = useSelector<AppState, TNode[]>(
    (state: AppState) => state.workspace.node
  )
  const stateWeeks = useSelector<AppState, TWeek[]>(
    (state: AppState) => state.workspace.week
  )

  /*******************************************************
   * COMPONENTS
   *******************************************************/

  const Strategies = () => {
    const strategies = stateWeeks
      .map((week) => parseInt(week.strategyClassification.toString(), 10))
      .filter((value, index, self) => self.indexOf(value) === index)
      .filter((value) => value > 0)

    if (!strategies.length) {
      return <></>
    }
    const renderedStrategies = strategies.map((value, index) => (
      <LegendLine
        key={index}
        icon={Constants.strategyKeys[value]}
        text={
          choices.strategyClassificationChoices.find(
            (obj) => obj.type === value
          )?.name
        }
      />
    ))

    return (
      <>
        <hr />
        <h5>Strategies:</h5>
        {renderedStrategies}
      </>
    )
  }

  const Contexts = () => {
    const contexts = stateNodes
      .map((node) => parseInt(node.contextClassification.toString(), 10))
      .filter((value, index, self) => self.indexOf(value) === index)
      .filter((value) => value > 0)

    if (!contexts.length) {
      return <></>
    }
    const renderedContexts = contexts.map((value, index) => (
      <LegendLine
        key={index}
        icon={Constants.contextKeys[value]}
        text={choices.contextChoices.find((obj) => obj.type === value)?.name}
      />
    ))

    return (
      <>
        <hr />
        <h5>Contexts:</h5>
        {renderedContexts}
      </>
    )
  }

  const Tasks = () => {
    const tasks = stateNodes
      .map((node) => parseInt(node.taskClassification.toString(), 10))
      .filter((value, index, self) => self.indexOf(value) === index)
      .filter((value) => value > 0)

    if (!tasks.length) {
      return <></>
    }

    const renderedTasks = tasks.map((value, index) => (
      <LegendLine
        key={index}
        icon={Constants.taskKeys[value]}
        text={choices.taskChoices.find((obj) => obj.type === value)?.name}
      />
    ))

    return (
      <>
        <hr />
        <h5>Tasks:</h5>
        {renderedTasks}
      </>
    )
  }

  const LegendContent = () => {
    return (
      <>
        <h4>Legend</h4>
        <Strategies />
        <Tasks />
        <Contexts />
      </>
    )
  }

  /*******************************************************
   * RENDER RETURN
   *******************************************************/
  return (
    <Legend>
      <LegendContent />
    </Legend>
  )
}

export default WorkflowLegend
