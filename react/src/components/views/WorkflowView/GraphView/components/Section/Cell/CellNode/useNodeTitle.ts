import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { nodeTitleFallback } from '@cf/components/pages/Workflow/Sidebar/components/EditTab/components/EditNode/linkedWorkflowUi'
import { NodeEntity } from '@cf/features/graph/state/model/types'
import { selectWorkflowByUuid } from '@cf/features/graph/state/selectors/canonical.selectors'
import { displaySystemTitle } from '@cf/i18n/systemTitles'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

export const NodeTitle = ({ node }: { node: NodeEntity }) => useNodeTitle(node)

export const useNodeTitle = (node: NodeEntity): string => {
  const { t } = useTranslation('workflow')

  const linkedWorkflowSelector = useMemo(
    () =>
      node?.linkedWorkflowUuid
        ? selectWorkflowByUuid(node.linkedWorkflowUuid)
        : () => undefined,
    [node?.linkedWorkflowUuid]
  )

  const linkedWorkflow = useSelector(linkedWorkflowSelector)

  const { data: linkedWorkflowResp } = useQuery({
    ...getWorkflowOptions({
      path: { uuid: node?.linkedWorkflowUuid ?? '' }
    }),
    enabled: Boolean(node?.linkedWorkflowUuid)
  })

  const fallback = nodeTitleFallback(t('linked.untitledNode'))

  if (node.linkedWorkflowUuid) {
    return (
      linkedWorkflowResp?.item?.title ||
      linkedWorkflow?.title ||
      node.title ||
      fallback
    )
  }

  return displaySystemTitle(t, node, fallback)
}

export default useNodeTitle
