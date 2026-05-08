import * as Constants from '@cf/utility/constants'
import { _t } from '@cf/utility/Utility.class'
import LegendLine from '@cfComponents/UIPrimitives/LegendLine'
import { selectAllNodes } from '@cfRedux/selectors/node.selector'
import { selectAllSections } from '@cfRedux/selectors/section.selector'
import { RootState } from '@cfRedux/store'
import Legend from '@cfViews/common/Legend'
import { useSelector } from 'react-redux'

const choices = COURSEFLOW_APP.globalContextData.workflowChoices

/*******************************************************
 * first pass on FV conversion is done
 *******************************************************/
const WorkflowLegend = () => {
  const nodes = useSelector((state: RootState) => selectAllNodes(state))
  const sections = useSelector((state: RootState) => selectAllSections(state))

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const Strategies = () => {
    const strategies = sections
      .map((section) => parseInt(section.strategyClassification.toString(), 10))
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
        <h5>{_t('Strategies')}:</h5>
        {renderedStrategies}
      </>
    )
  }

  const Contexts = () => {
    const contexts = nodes
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
        <h5>{_t('Contexts')}:</h5>
        {renderedContexts}
      </>
    )
  }

  const Tasks = () => {
    const tasks = nodes
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
        <h5>{_t('Tasks')}:</h5>
        {renderedTasks}
      </>
    )
  }

  /*******************************************************
   * RENDER RETURN
   *******************************************************/
  return (
    <Legend>
      <h4>{_t('Legend')}</h4>
      <Strategies />
      <Tasks />
      <Contexts />
    </Legend>
  )
}

export default WorkflowLegend
