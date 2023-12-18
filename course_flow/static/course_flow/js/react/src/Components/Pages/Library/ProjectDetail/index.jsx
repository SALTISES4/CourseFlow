import * as React from 'react'
import * as Constants from '@cfConstants'
import { TinyLoader } from '@cfRedux/helpers'
import ProjectMenu from '@cfModule/Components/Pages/Library/ProjectDetail/components/ProjectMenu.js'

/**
 * export type ProjectViewDTO = {
 *   project_data: {
 *     deleted: boolean
 *     deleted_on: string
 *     id: number
 *     title: string
 *     description: string
 *     author: string
 *     author_id: number
 *     published: boolean
 *     created_on: string
 *     last_modified: string
 *     workflowproject_set: Array<number>
 *     disciplines: Array<any>
 *     type: string
 *     object_sets: Array<any>
 *     favourite: boolean
 *     liveproject: any
 *     object_permission: {
 *       permission_type: number
 *       last_viewed: string
 *     }
 *   }
 *   user_role: number
 *   user_permission: number
 *   title: string
 *   disciplines: Array<{
 *     id: number
 *     title: string
 *   }>
 * }
 */
class ProjectRenderer extends React.Component {
  constructor(props /*: ProjectViewDTO */) {
    super(props)

    this.read_only = true
    this.project_data = this.props.project_data
    this.all_disciplines = this.props.disciplines
    this.user_role = this.props.user_role
    this.user_permission = this.props.user_permission
    this.userId = this.props.user_id

    if (
      this.project_data.object_permission &&
      this.project_data.object_permission.permission_type ===
        Constants.permission_keys['edit']
    ) {
      this.read_only = false
    }
  }

  render() {
    this.container = container
    this.tiny_loader = new TinyLoader($('body')[0])

    return this.getContents()
  }

  getContents() {
    return (
      <ProjectMenu
        renderer={this}
        data={this.project_data}
        userid={this.userId}
      />
    )
  }
}

export default ProjectRenderer
