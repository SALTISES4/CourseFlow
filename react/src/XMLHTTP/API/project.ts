import {
  DisciplineQueryResp,
  GetProjectByIdQueryResp
} from '@XMLHTTP/types/query'
import { EDiscipline } from '@XMLHTTP/types/entity'
import { API_GET } from '@XMLHTTP/CallWrapper'

/**
 * Get the list of possible disciplines
 * @param callBackFunction
 * @todo not used
 */
export async function getDisciplines(
  callBackFunction = (_data: EDiscipline[]) => console.log('success')
) {
  const url = COURSEFLOW_APP.path.json_api.project.discipline__list

  API_GET<DisciplineQueryResp>(url)
    .then((response) => {
      callBackFunction(response)
    })
    .catch((error) => {
      console.error('Error fetching library data:', error)
    })
}

export async function getProjectById(id: string) {
  const params = new URLSearchParams({ id }).toString()
  const url = `${COURSEFLOW_APP.path.json_api.project.detail}?${params}`
  return API_GET<GetProjectByIdQueryResp>(url)
}
