import { QueryPages, Workflow } from '@cfModule/types/common'
import { getWorkflowsForProjectQuery } from '@XMLHTTP/APIFunctions'

export type LibraryQueryResp = {
  data_package: Workflow[]
}

export type SearchAllObjectsQueryResp = {
  action: string
  workflow_list: Workflow[]
  pages: QueryPages
}

export type HomeQueryResp = {
  favourites: Workflow[]
  projects: Workflow[]
}

export type WorkflowsForProjectQueryResp = {
  data_package: Workflow[]
}

export type UsersForObjectQuery = {
  action: string
  author: User
  viewers: any[]
  commentors: any[]
  editors: User[]
  students: any[]
  published: boolean
  public_view: boolean
  cannot_change: number[]
}

export type User = {
  id: number
  username: string
  first_name: string
  last_name: string
}
