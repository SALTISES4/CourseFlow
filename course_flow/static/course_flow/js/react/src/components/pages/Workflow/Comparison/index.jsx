import React from 'react'
import * as reactDom from 'react-dom'
import WorkflowLoader from '@cfUIComponents/WorkflowLoader.jsx'
import { SelectionManager, TinyLoader } from '@cfRedux/helpers.js'
import * as Constants from '@cfConstants'
import { ComparisonView } from '@cfViews/ComparisonView'

/**
 * export interface Welcome2 {
 *     project_data:    ProjectData;
 *     is_strategy:     boolean;
 *     user_permission: number;
 *     user_role:       number;
 *     public_view:     boolean;
 *     user_name:       string;
 *     user_id:         number;
 *     myColour:        string;
 *     changeFieldID:   number;
 * }
 *
 * export interface ProjectData {
 *     deleted:             boolean;
 *     deleted_on:          string;
 *     id:                  number;
 *     title:               string;
 *     description:         string;
 *     author:              string;
 *     author_id:           number;
 *     published:           boolean;
 *     created_on:          string;
 *     last_modified:       string;
 *     workflowproject_set: number[];
 *     disciplines:         any[];
 *     type:                string;
 *     object_sets:         any[];
 *     favourite:           boolean;
 *     liveproject:         null;
 *     object_permission:   ObjectPermission;
 * }
 *
 * export interface ObjectPermission {
 *     permission_type: number;
 *     last_viewed:     Date;
 * }
 */
export class WorkflowComparison {
  constructor(props) {
    this.project_data = props.data.project_data
    this.user_permission = props.user_permission
    makeActiveSidebar('#project' + this.project_data.id)
  }

  render(container, view_type = 'workflowview') {
    this.container = container
    this.view_type = view_type

    reactDom.render(<WorkflowLoader />, container[0])

    this.tiny_loader = new TinyLoader($('body')[0])

    switch (this.user_permission) {
      case Constants.permission_keys['none']:
      case Constants.permission_keys['view']:
        this.read_only = true
        break

      case Constants.permission_keys['comment']:
        this.read_only = true
        this.view_comments = true
        this.add_comments = true
        break

      case Constants.permission_keys['edit']:
        this.read_only = false
        this.view_comments = true
        this.add_comments = true
        break
      default:
        break
    }

    this.selection_manager = new SelectionManager(this.read_only)

    if (view_type === 'workflowview' || view_type === 'outcomeedit') {
      reactDom.render(
        <ComparisonView
          view_type={view_type}
          // turn this into config object
          renderer={this}
          data={this.project_data}
          selection_manager={this.selection_manager}
          tiny_loader={this.tiny_loader}
        />,
        container[0]
      )
    }
  }
}

export default WorkflowComparison
