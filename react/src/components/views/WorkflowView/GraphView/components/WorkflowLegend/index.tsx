import {
  selectNodesByGraphUuid,
  selectSectionsOrderedByGraphUuid
} from '@cf/features/graph/state/selectors/canonical.selectors'
import * as Constants from '@cf/utility/constants'
import { _t } from '@cf/utility/Utility.class'
import LegendLine from '@cfComponents/UIPrimitives/LegendLine'
import Legend from '@cfViews/common/Legend'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

const choices = COURSEFLOW_APP.globalContextData.workflowChoices

/*******************************************************
 * first pass on FV conversion is done
 *******************************************************/
const WorkflowLegend = () => {
  const { uuid: graphUuid = '' } = useParams()
  const sectionsSelector = useMemo(
    () => selectSectionsOrderedByGraphUuid(graphUuid),
    [graphUuid]
  )
  const nodesSelector = useMemo(
    () => selectNodesByGraphUuid(graphUuid),
    [graphUuid]
  )
  const nodes = useSelector(nodesSelector)
  const sections = useSelector(sectionsSelector)

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const Strategies = () => {
    const strategies = sections
      .map((section) =>
        parseInt(
          String(
            (section as { strategyClassification?: string | number })
              .strategyClassification ?? '0'
          ),
          10
        )
      )
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
          )?.name ?? ''
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
      .map((node) =>
        parseInt(
          String(
            (node as { contextClassification?: string | number })
              .contextClassification ?? '0'
          ),
          10
        )
      )
      .filter((value, index, self) => self.indexOf(value) === index)
      .filter((value) => value > 0)

    if (!contexts.length) {
      return <></>
    }

    const renderedContexts = contexts.map((value, index) => (
      <LegendLine
        key={index}
        icon={Constants.contextKeys[value]}
        text={
          choices.contextChoices.find((obj) => obj.type === value)?.name ?? ''
        }
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
      .map((node) =>
        parseInt(
          String(
            (node as { taskClassification?: string | number })
              .taskClassification ?? '0'
          ),
          10
        )
      )
      .filter((value, index, self) => self.indexOf(value) === index)
      .filter((value) => value > 0)

    if (!tasks.length) {
      return <></>
    }

    const renderedTasks = tasks.map((value, index) => (
      <LegendLine
        key={index}
        icon={Constants.taskKeys[value]}
        text={choices.taskChoices.find((obj) => obj.type === value)?.name ?? ''}
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
