import * as React from 'react'
import * as Constants from '@cfConstants'
import ProjectDetailContent from '@cfPages/ProjectDetail/components/ProjectDetailContent'
import { useQuery } from '@tanstack/react-query'
import { getProjectById } from '@XMLHTTP/API/project'
import { GetProjectByIdQueryResp } from '@XMLHTTP/types/query'
import { useParams } from 'react-router-dom'
import { _t } from '@cf/utility/utilityFunctions'
import Loader from '@cfComponents/UIPrimitives/Loader'

const ProjectPage = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const { id } = useParams()
  const { data, error, isLoading, isError } = useQuery<GetProjectByIdQueryResp>(
    {
      queryKey: ['getProjectById', id],
      queryFn: () => getProjectById(Number(id))
    }
  )

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  const calcIsReadOnly = (): boolean => {
    return (
      data.data_package.project_data.object_permission.permission_type ===
      Constants.permission_keys['edit']
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  if (isLoading) {
    return <Loader />
  }

  if (!data) {
    return <></>
  }

  return (
    <ProjectDetailContent
      projectPaths={data.data_package.create_path_this_project}
      allDisciplines={data.data_package.disciplines}
      readOnly={calcIsReadOnly()}
      project={data.data_package.project_data}
      userId={data.data_package.user_id}
    />
  )
}

export default ProjectPage
