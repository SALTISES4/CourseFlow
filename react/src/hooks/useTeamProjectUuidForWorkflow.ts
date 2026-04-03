import { getProjectGraph, listProjects } from '@cf/api/gen/sdk.gen'
import { useQuery } from '@tanstack/react-query'

/**
 * Resolves the owning project UUID for a workflow by scanning the current user's
 * projects (listProjects) and matching workflow UUID in each project's graph.
 */
export function useTeamProjectUuidForWorkflow(workflowUuid: string | undefined) {
  return useQuery({
    queryKey: ['teamProjectUuidForWorkflow', workflowUuid],
    enabled: Boolean(workflowUuid),
    queryFn: async (): Promise<string | null> => {
      const { data: lp } = await listProjects({ throwOnError: true })
      const items = lp?.items ?? []
      for (const p of items) {
        const { data: graph } = await getProjectGraph({
          path: { uuid: p.uuid },
          throwOnError: true
        })
        if (graph?.workflowUuids?.includes(workflowUuid!)) {
          return p.uuid
        }
      }
      return null
    }
  })
}
