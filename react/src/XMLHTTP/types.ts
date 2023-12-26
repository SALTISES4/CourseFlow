import { QueryPages, Workflow } from '@cfModule/types/common'

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
