import * as React from 'react'
import * as Constants from '@cfConstants'
import ProjectMenu from '@cfModule/components/pages/Library/ProjectDetail/components/ProjectMenu'
import {
  ProjectData,
  ProjectViewDTO
} from '@cfPages/Library/ProjectDetail/types'
import { Discipline } from '@cfModule/types/common'

class ProjectPage extends React.Component<ProjectViewDTO> {
  private readonly readOnly: boolean
  private readonly projectData: ProjectData
  private readonly allDisciplines: Discipline[]
  private readonly userRole: number
  private userPermission: number
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
    this.userRole = this.props.user_role
    this.userPermission = this.props.user_permission
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
    // this.container = container @todo how is container used if at all, need clarification
    return (
      <ProjectMenu
        projectPaths={this.projectPaths}
        allDisciplines={this.allDisciplines}
        userRole={this.userRole}
        readOnly={this.readOnly}
        data={this.projectData}
        userId={this.userId}
      />
    )
  }
}

export default ProjectPage
