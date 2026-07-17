import { getProjectGraph, listProjects } from '@cf/api/gen/sdk.gen'
import { useQuery } from '@tanstack/react-query'

/**
 * Resolves the owning project UUID for a workflow by scanning the current user's
 * projects (listProjects) and matching workflow UUID in each project's graph.
 * ...eww
 */
export function useTeamProjectUuidForWorkflow(
  workflowUuid: string | undefined
) {
  return useQuery({
    queryKey: ['teamProjectUuidForWorkflow', workflowUuid],
    enabled: Boolean(workflowUuid),
    queryFn: async (): Promise<string | null> => {
      if (!workflowUuid) {
        return null
      }

      const { data: projectList } = await listProjects({ throwOnError: true })
      const projects = projectList?.items ?? []
      for (const project of projects) {
        const { data: graph } = await getProjectGraph({
          path: { uuid: project.uuid },
          throwOnError: true
        })
        if (graph?.graphUuids?.includes(workflowUuid)) {
          return project.uuid
        }
      }
      return null
    }
  })
}
