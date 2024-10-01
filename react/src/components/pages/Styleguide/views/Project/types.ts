export enum ProjectPermissionRole {
  'OWNER' = 'owner',
  'EDITOR' = 'editor',
  'COMMENTER' = 'commenter',
  'VIEWER' = 'viewer'
}

export type PermissionUserType = {
  id: number
  name: string
  email: string
  role: ProjectPermissionRole
}

export type ObjectSetType = {
  title: string
  type: string
}

export type ProjectDetailsType = {
  id: number
  title: string
  description: string
  isFavorite?: boolean
  disciplines?: string[]
  created: Date | string
  permissions?: PermissionUserType[]
  objectSets?: ObjectSetType[]
}
