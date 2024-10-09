// @ts-nocheck
import { apiPaths } from '@cf/router/apiRoutes'
import { API_GET, API_POST } from '@XMLHTTP/CallWrapper'
import { CreateProjectArgs } from '@XMLHTTP/types/args'
import {
  CreateProjectResp,
  GetProjectByIdQueryResp
} from '@XMLHTTP/types/query'
import { generatePath } from 'react-router-dom'

// export async function getProjectById(id: number) {
//   const base = apiPaths.json_api.project.detail
//   const url = generatePath(base, { id })
//   return API_GET<GetProjectByIdQueryResp>(url)
// }

// export async function createProject(
//   args: CreateProjectArgs
// ): Promise<CreateProjectResp> {
//   const url = apiPaths.json_api.project.create
//   return API_POST(url, args)
// }
