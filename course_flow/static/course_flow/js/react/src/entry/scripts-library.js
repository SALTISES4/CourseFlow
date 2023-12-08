/**
 * Individual Page/View React Renderers
 */
import * as reactDom from 'react-dom'
import * as React from 'react'
import * as Constants from '../Constants.js'
import { TinyLoader } from '../redux/helpers.js'
import {
  LibraryMenu,
  FavouritesMenu,
  ExploreMenu,
  ProjectMenu,
  HomeMenu
} from '../Components/components/MenuComponents/menus/index.js'

/*******************************************************
 * @LibraryRenderer
 *******************************************************/
export class LibraryRenderer {
  constructor() {}

  render(container) {
    this.container = container
    this.tiny_loader = new TinyLoader($('body')[0])

    reactDom.render(this.getContents(), container[0])
  }

  getContents() {
    return <LibraryMenu renderer={this} />
  }
}

/*******************************************************
 * @FavouritesRenderer
 *******************************************************/
export class FavouritesRenderer extends LibraryRenderer {
  getContents() {
    return <FavouritesMenu renderer={this} />
  }
}

/*******************************************************
 * @ExploreRenderer
 *  disciplines: any
 *  initial_workflows: any[]
 *  initial_pages: any
 *******************************************************/
export class ExploreRenderer extends LibraryRenderer {
  constructor(disciplines, initial_workflows = [], initial_pages = {}) {
    super()
    this.disciplines = disciplines
    this.initial_workflows = initial_workflows
    this.initial_pages = initial_pages
    this.tiny_loader = new TinyLoader($('body')[0])
  }

  getContents() {
    return <ExploreMenu disciplines={this.disciplines} renderer={this} />
  }
}

/*******************************************************
 * @ProjectRenderer
 *******************************************************/

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
export class ProjectRenderer {
  constructor(data /*: ProjectViewDTO */) {
    this.read_only = true
    this.project_data = data.project_data
    this.all_disciplines = data.disciplines
    this.user_role = data.user_role
    this.user_permission = data.user_permission
    this.userId = data.user_id

    if (
      this.project_data.object_permission &&
      this.project_data.object_permission.permission_type ===
        Constants.permission_keys['edit']
    ) {
      this.read_only = false
    }
  }

  render(container) {
    this.container = container
    this.tiny_loader = new TinyLoader($('body')[0])

    reactDom.render(this.getContents(), container[0])
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

/*******************************************************
 * @HomeRenderer
 *******************************************************/
export class HomeRenderer {
  constructor(is_teacher) {
    this.is_teacher = is_teacher
  }

  render(container) {
    this.container = container
    this.tiny_loader = new TinyLoader($('body')[0])

    reactDom.render(this.getContents(), container[0])
  }

  getContents() {
    return <HomeMenu renderer={this} />
  }
}
