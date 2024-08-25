import * as React from 'react'
import * as Constants from '@cfConstants'
import ProjectDetailContent from '@cfPages/ProjectDetail/components/ProjectDetailContent'
import { useQuery } from '@tanstack/react-query'
import { getProjectById } from '@XMLHTTP/API/project'
import { GetProjectByIdQueryResp } from '@XMLHTTP/types/query'
import { useEffect, useState } from 'react'
import Loader from '@cfCommonComponents/UIComponents/Loader'
import { useParams } from 'react-router-dom'

// class ProjectPage extends React.Component {
//   private readonly readOnly: boolean
//   private readonly projectData: EProject
//   private readonly allDisciplines: Discipline[]
//   private readonly userId: number
//   private readonly projectPaths: {
//     activity: string
//     course: string
//     program: string
//   }
//
//   constructor(props: ProjectViewDTO) {
//     super(props)
//
//     this.readOnly = true
//     this.projectData = this.props.project_data
//     this.allDisciplines = this.props.disciplines
//     this.userId = this.props.user_id
//     this.projectPaths = this.props.create_path_this_project
//
//     if (
//       this.projectData.object_permission &&
//       this.projectData.object_permission.permission_type ===
//         Constants.permission_keys['edit']
//     ) {
//       this.readOnly = false
//     }
//   }
//
//   render() {
//     return (
//       <ProjectMenu
//         projectPaths={this.projectPaths}
//         allDisciplines={this.allDisciplines}
//         readOnly={'asdf'}
//         project={this.projectData}
//         userId={this.userId}
//       />
//     )
//   }
// }
//
// export default ProjectPage

const ProjectPage = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const { id } = useParams()
  const { data, error, isLoading, isError } = useQuery<GetProjectByIdQueryResp>(
    {
      queryKey: ['getProjectById', id],
      queryFn: () => getProjectById(id)
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
