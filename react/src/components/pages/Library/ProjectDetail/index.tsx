import * as React from 'react'
import * as Constants from '@cfConstants'
import ProjectMenu from '@cfModule/components/pages/Library/ProjectDetail/components/ProjectMenu'
import { ProjectViewDTO } from '@cfPages/Library/ProjectDetail/types'
import { Discipline } from '@cfModule/types/common'
import { EProject } from '@cfModule/XMLHTTP/types/entity'

console.log('hsd asdf fs')

class ProjectPage extends React.Component<ProjectViewDTO> {
  private readonly readOnly: boolean
  private readonly projectData: EProject
  private readonly allDisciplines: Discipline[]
  private readonly userId: number
  private readonly projectPaths: {
    activity: string
    course: string
    program: string
  }

  constructor(props: ProjectViewDTO) {
    super(props)

    this.readOnly = true
    this.projectData = this.props.project_data
    this.allDisciplines = this.props.disciplines
    this.userId = this.props.user_id
    this.projectPaths = this.props.create_path_this_project

    if (
      this.projectData.object_permission &&
      this.projectData.object_permission.permission_type ===
        Constants.permission_keys['edit']
    ) {
      this.readOnly = false
    }
  }

  render() {
    // this.container = container
    // TODO: how is container used if at all, need clarification
    return (
      <ProjectMenu
        projectPaths={this.projectPaths}
        allDisciplines={this.allDisciplines}
        readOnly={'asdf'}
        project={this.projectData}
        userId={this.userId}
      />
    )
  }
}

export default ProjectPage
