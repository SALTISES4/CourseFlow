import type { PermissionContextOut } from '@cf/api/gen'
import type {
  ProjectPermission,
  WorkflowPermission
} from '@cf/api/gen/types.gen'
import { createContext, ReactNode, useContext } from 'react'

export type PermissionAction = ProjectPermission | WorkflowPermission

type WorkspacePermissions = {
  resource: PermissionContextOut
  project?: PermissionContextOut | null
}

const WorkspacePermissionsContext = createContext<
  WorkspacePermissions | undefined
>(undefined)

export const WorkspacePermissionsProvider = ({
  resource,
  project,
  children
}: WorkspacePermissions & { children: ReactNode }) => (
  <WorkspacePermissionsContext.Provider value={{ resource, project }}>
    {children}
  </WorkspacePermissionsContext.Provider>
)

export function hasPermission(
  context: PermissionContextOut | null | undefined,
  action: PermissionAction
): boolean {
  return context?.actions.includes(action) ?? false
}

export function useWorkspacePermissions(): WorkspacePermissions {
  const context = useContext(WorkspacePermissionsContext)
  if (!context) {
    throw new Error(
      'useWorkspacePermissions must be used within WorkspacePermissionsProvider'
    )
  }
  return context
}

export function useResourcePermission(action: PermissionAction): boolean {
  return hasPermission(useWorkspacePermissions().resource, action)
}

export function useProjectPermission(action: ProjectPermission): boolean {
  const { project, resource } = useWorkspacePermissions()
  return hasPermission(project ?? resource, action)
}
