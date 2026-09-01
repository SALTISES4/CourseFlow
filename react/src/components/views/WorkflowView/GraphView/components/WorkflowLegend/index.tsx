import { selectNodesByGraphUuid } from '@cf/features/graph/state/selectors/canonical.selectors'
import { useReferenceData } from '@cf/hooks/useReferenceData'
import * as Constants from '@cf/utility/constants'
import { _t } from '@cf/utility/Utility.class'
import LegendLine from '@cfComponents/UIPrimitives/LegendLine'
import Legend from '@cfViews/common/Legend'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

const uniqueNamedValues = <T extends string>(values: Array<T | null>) =>
  [...new Set(values)].filter((value): value is T =>
    Boolean(value && value !== 'none')
  )

const WorkflowLegend = () => {
  const { uuid: graphUuid = '' } = useParams()
  const nodesSelector = useMemo(
    () => selectNodesByGraphUuid(graphUuid),
    [graphUuid]
  )
  const nodes = useSelector(nodesSelector)
  const { data: referenceData } = useReferenceData()

  const contextLabels = new Map(
    [
      ...(referenceData?.activityContexts ?? []),
      ...(referenceData?.courseContexts ?? [])
    ].map((option) => [option.value, option.label])
  )
  const taskLabels = new Map(
    (referenceData?.activityTaskClassifications ?? []).map((option) => [
      option.value,
      option.label
    ])
  )
  const contexts = uniqueNamedValues(
    nodes.map((node) => node.contextClassification)
  )
  const tasks = uniqueNamedValues(nodes.map((node) => node.taskClassification))

  return (
    <Legend>
      <h4>{_t('Legend')}</h4>
      {tasks.length > 0 && (
        <>
          <hr />
          <h5>{_t('Tasks')}:</h5>
          {tasks.map((value) => (
            <LegendLine
              key={value}
              icon={
                Constants.taskKeys[value as keyof typeof Constants.taskKeys]
              }
              text={taskLabels.get(value) ?? value}
            />
          ))}
        </>
      )}
      {contexts.length > 0 && (
        <>
          <hr />
          <h5>{_t('Contexts')}:</h5>
          {contexts.map((value) => (
            <LegendLine
              key={value}
              icon={
                Constants.contextKeys[
                  value as keyof typeof Constants.contextKeys
                ]
              }
              text={contextLabels.get(value) ?? value}
            />
          ))}
        </>
      )}
    </Legend>
  )
}

export default WorkflowLegend
