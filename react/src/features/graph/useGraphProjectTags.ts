import {
  getWorkflowOptions,
  listProjectTagsOptions
} from '@cf/api/gen/@tanstack/react-query.gen'
import type { GraphUuid } from '@cf/features/graph/state/model/types'
import { selectGraphByUuid } from '@cf/features/graph/state/selectors/canonical.selectors'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

export const useGraphProjectTags = (graphUuid: GraphUuid) => {
  const graphSelector = useMemo(
    () => (graphUuid ? selectGraphByUuid(graphUuid) : () => undefined),
    [graphUuid]
  )
  const graph = useSelector(graphSelector)
  const { data: workflowResponse } = useQuery({
    ...getWorkflowOptions({
      path: { uuid: graph?.workflowUuid ?? '' }
    }),
    enabled: Boolean(graph?.workflowUuid)
  })
  const projectUuid = workflowResponse?.item.projectUuid ?? ''

  return useQuery({
    ...listProjectTagsOptions({ path: { uuid: projectUuid } }),
    enabled: Boolean(projectUuid)
  })
}
