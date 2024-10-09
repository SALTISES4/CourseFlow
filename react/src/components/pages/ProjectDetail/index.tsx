// @ts-nocheck
import { _t } from '@cf/utility/utilityFunctions'
import Loader from '@cfComponents/UIPrimitives/Loader'
import * as Constants from '@cfConstants'
import ProjectDetailContent from '@cfPages/ProjectDetail/components/ProjectDetailContent'
import * as React from 'react'
import { useParams } from 'react-router-dom'

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
      data.dataPackage.projectData.objectPermission.permissionType ===
      Constants.permissionKeys['edit']
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
      projectPaths={data.dataPackage.create_path_this_project}
      allDisciplines={data.dataPackage.disciplines}
      readOnly={calcIsReadOnly()}
      project={data.dataPackage.projectData}
      userId={data.dataPackage.userId}
    />
  )
}

export default ProjectPage
