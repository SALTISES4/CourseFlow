import { selectNodesByGraphUuid } from '@cf/features/graph/state/selectors/canonical.selectors'
import { useReferenceLabels } from '@cf/i18n/referenceLabels'
import * as Constants from '@cf/utility/constants'
import LegendLine from '@cfComponents/UIPrimitives/LegendLine'
import Legend from '@cfViews/common/Legend'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const uniqueNamedValues = <T extends string>(values: Array<T | null>) =>
  [...new Set(values)].filter((value): value is T =>
    Boolean(value && value !== 'none')
  )

const WorkflowLegend = () => {
  const { t } = useTranslation('workflow')
  const { uuid: graphUuid = '' } = useParams()
  const nodesSelector = useMemo(
    () => selectNodesByGraphUuid(graphUuid),
    [graphUuid]
  )
  const nodes = useSelector(nodesSelector)
  const { contextLabel, taskClassificationLabel } = useReferenceLabels()
  const contexts = uniqueNamedValues(
    nodes.map((node) => node.contextClassification)
  )
  const tasks = uniqueNamedValues(nodes.map((node) => node.taskClassification))

  return (
    <Legend>
      <h4>{t('legend.title')}</h4>
      {tasks.length > 0 && (
        <>
          <hr />
          <h5>{t('legend.tasks')}:</h5>
          {tasks.map((value) => (
            <LegendLine
              key={value}
              icon={
                Constants.taskKeys[value as keyof typeof Constants.taskKeys]
              }
              text={taskClassificationLabel(value)}
            />
          ))}
        </>
      )}
      {contexts.length > 0 && (
        <>
          <hr />
          <h5>{t('legend.contexts')}:</h5>
          {contexts.map((value) => (
            <LegendLine
              key={value}
              icon={
                Constants.contextKeys[
                  value as keyof typeof Constants.contextKeys
                ]
              }
              text={contextLabel(value)}
            />
          ))}
        </>
      )}
    </Legend>
  )
}

export default WorkflowLegend
