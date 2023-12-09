import * as React from 'react'
import * as reactDom from 'react-dom'
import { connect } from 'react-redux'
import {
  WorkflowTitle,
  CollapsibleText,
  MenuBar,
  RightSideBar
} from '../components/CommonComponents/UIComponents'
import {
  Component,
  EditableComponentWithActions,
  EditableComponentWithSorting
} from '../components/CommonComponents/Extended'
import ColumnWorkflowView from './ColumnWorkflowView.js'
import WeekWorkflowView from './WeekWorkflowView.js'
import { NodeBarColumnWorkflow } from './ColumnWorkflowView.js'
import { NodeBarWeekWorkflow } from './WeekWorkflowView.js'
import { renderMessageBox } from '../components/MenuComponents/MenuComponents.js'
import * as Constants from '../../Constants.js'
import * as Utility from '../../UtilityFunctions.js'
import {
  changeField,
  moveColumnWorkflow,
  moveWeekWorkflow,
  toggleObjectSet
} from '../../redux/Reducers.js'
import { ConnectionBar } from '../../ConnectedUsers.js'
import { OutcomeBar } from './OutcomeEditView.js'
import StrategyView from '../components/Strategy.js'
import WorkflowOutcomeView from './WorkflowOutcomeView.js'
import WorkflowLegend from '../components/WorkflowLegend.js'
import { WorkflowOutcomeLegend } from '../components/WorkflowLegend.js'
import {
  getPublicParentWorkflowInfo,
  insertedAt,
  restoreSelf,
  deleteSelf,
  toggleDrop,
  getUsersForObject,
  duplicateBaseItem
} from '../../XMLHTTP/PostFunctions.js'
import { getTargetProjectMenu } from '../../XMLHTTP/postTemp.js'

import OutcomeEditView from './OutcomeEditView.js'
import AlignmentView from './AlignmentView.js'
import CompetencyMatrixView from './CompetencyMatrixView.js'
import GridView from './GridView.js'
import closeMessageBox from '../components/MenuComponents/components/closeMessageBox.js'

class WorkflowBaseViewUnconnected extends EditableComponentWithActions {
  constructor(props) {
    super(props)
    this.objectType = 'workflow'
    this.allowed_tabs = [0, 1, 2, 3, 4]
  }

  render() {
    let renderer = this.props.renderer
    let data = this.props.data
    let visible_buttons = (() => {
      return [this.getEdit(), this.getShare()]
    }).bind(this)
    let overflow_links = this.getOverflowLinks.bind(this)
    let viewbar = (() => {
      return [this.getJump(), this.getExpand()]
    }).bind(this)
    let userbar
    if (!renderer.always_static)
      userbar = (() => (
        <ConnectionBar
          updateSocket={renderer.updateSocket}
          renderer={renderer}
        />
      )).bind(this)

    return (
      <div className="main-block">
        <MenuBar
          overflow_links={overflow_links}
          visible_buttons={visible_buttons}
          viewbar={viewbar}
          userbar={userbar}
        />
        <div className="right-panel-wrapper">
          <div class="body-wrapper">
            <div id="workflow-wrapper" className="workflow-wrapper">
              {this.getHeader()}
              {this.addEditable(data)}

              <div className="workflow-container">
                {this.getWorkflowContent()}
              </div>
              {this.getReturnLinks()}
              {this.getParentWorkflowIndicator()}
            </div>
          </div>
          <RightSideBar
            context="workflow"
            renderer={this.props.renderer}
            data={data}
          />
        </div>
      </div>
    )
  }

  componentDidMount() {
    this.getUserData()
    this.updateTabs()
    makeDropdown('#jump-to')
    makeDropdown('#expand-collapse-all')
  }

  componentDidUpdate(prev_props) {}

  updateTabs() {
    //If the view type has changed, enable only appropriate tabs, and change the selection to none
    this.props.renderer.selection_manager.changeSelection(null, null)
    let disabled_tabs = []
    for (let i = 0; i <= 4; i++)
      if (this.allowed_tabs.indexOf(i) < 0) disabled_tabs.push(i)
    $('#sidebar').tabs({ disabled: false })
    let current_tab = $('#sidebar').tabs('option', 'active')
    if (this.allowed_tabs.indexOf(current_tab) < 0) {
      if (this.allowed_tabs.length == 0) $('#sidebar').tabs({ active: false })
      else $('#sidebar').tabs({ active: this.allowed_tabs[0] })
    }
    if (this.props.renderer.read_only) disabled_tabs.push(5)
    $('#sidebar').tabs({ disabled: disabled_tabs })
  }

  changeView(type) {
    //this.props.renderer.selection_manager.changeSelection(null,null);
    this.props.renderer.render(this.props.renderer.container, type)
  }

  getHeader() {
    let data = this.props.data
    let style = {}
    if (data.lock) {
      style.border = '2px solid ' + data.lock.user_colour
    }
    return (
      <div
        className="project-header"
        style={style}
        onClick={(evt) =>
          this.props.renderer.selection_manager.changeSelection(evt, this)
        }
      >
        {this.getProjectLink()}
        <div className="project-header-top-line">
          <WorkflowTitle
            data={data}
            no_hyperlink={true}
            class_name="project-title"
          />
          {this.getTypeIndicator()}
        </div>
        <div className="project-header-info">
          <div className="project-info-section project-members">
            <h4>{window.gettext('Permissions')}</h4>
            {this.getUsers()}
          </div>
          <div className="project-other">
            <div className="project-info-section project-description">
              <h4>{window.gettext('Description')}</h4>
              <CollapsibleText
                text={data.description}
                defaultText={window.gettext('No description')}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  getTypeIndicator() {
    let data = this.props.data
    let type_text = window.gettext(data.type)
    if (data.is_strategy) type_text += window.gettext(' strategy')
    return (
      <div className={'workflow-type-indicator ' + data.type}>{type_text}</div>
    )
  }

  getUsers() {
    if (!this.state.users) return null
    let author = this.state.users.author
    let editors = this.state.users.editors
    let commenters = this.state.users.commentors
    let viewers = this.state.users.viewers
    let users_group = []
    if (this.state.users.published) {
      users_group.push(
        <div className="user-name">
          {Utility.getUserTag('view')}
          <span className="material-symbols-rounded">public</span>{' '}
          {window.gettext('All CourseFlow')}
        </div>
      )
    }
    if (author)
      users_group.push(
        <div className="user-name">
          {Utility.getUserTag('author')}
          {Utility.getUserDisplay(author)}
        </div>
      )
    users_group.push([
      editors
        .filter((user) => user.id !== author.id)
        .map((user) => (
          <div className="user-name">
            {Utility.getUserTag('edit')}
            {Utility.getUserDisplay(user)}
          </div>
        )),
      commenters.map((user) => (
        <div className="user-name">
          {Utility.getUserTag('comment')}
          {Utility.getUserDisplay(user)}
        </div>
      )),
      viewers.map((user) => (
        <div className="user-name">
          {Utility.getUserTag('view')}
          {Utility.getUserDisplay(user)}
        </div>
      ))
    ])
    users_group = users_group.flat(2)
    let users = [<div className="users-group">{users_group}</div>]
    if (users_group.length > 4) {
      users.push(
        <div className="workflow-created">
          +{users_group.length - 4} {window.gettext('more')}
        </div>
      )
    }
    if (!this.props.renderer.read_only)
      users.push(
        <div
          className="user-name collapsed-text-show-more"
          onClick={this.openShareMenu.bind(this)}
        >
          {window.gettext('Modify')}
        </div>
      )
    return users
  }

  getEdit() {
    let edit
    if (!this.props.renderer.read_only)
      edit = (
        <div
          className="hover-shade"
          id="edit-project-button"
          title={window.gettext('Edit Workflow')}
          onClick={this.openEditMenu.bind(this)}
        >
          <span className="material-symbols-rounded filled">edit</span>
        </div>
      )
    return edit
  }

  openEditMenu(evt) {
    this.props.renderer.selection_manager.changeSelection(evt, this)
  }

  getShare() {
    let share
    if (!this.props.renderer.read_only)
      share = (
        <div
          className="hover-shade"
          id="share-button"
          title={window.gettext('Sharing')}
          onClick={this.openShareMenu.bind(this)}
        >
          <span className="material-symbols-rounded filled">person_add</span>
        </div>
      )
    return share
  }

  openShareMenu() {
    let component = this
    let data = this.props.data
    renderMessageBox(data, 'share_menu', () => {
      closeMessageBox()
      component.getUserData()
    })
  }

  getUserData() {
    if (this.props.renderer.public_view || this.props.renderer.is_student)
      return null
    let component = this
    getUsersForObject(this.props.data.id, this.props.data.type, (data) => {
      component.setState({ users: data })
    })
  }

  getOverflowLinks() {
    let data = this.state.data
    let liveproject

    let overflow_links = []
    overflow_links.push(this.getExportButton())
    overflow_links.push(this.getCopyButton())
    overflow_links.push(this.getImportButton())
    overflow_links.push(this.getDeleteWorkflow())
    if (overflow_links.filter((x) => x != null).length == 0)
      $('#overflow-options').addClass('hidden')
    return overflow_links
  }

  getDeleteWorkflow() {
    if (this.props.renderer.read_only) return null
    if (!this.props.data.deleted)
      return [
        <hr />,
        <div
          id="delete-workflow"
          className="hover-shade"
          onClick={this.deleteWorkflow.bind(this)}
        >
          <div>{window.gettext('Archive workflow')}</div>
        </div>
      ]
    else
      return [
        <hr />,
        <div
          id="restore-workflow"
          className="hover-shade"
          onClick={this.restoreWorkflow.bind(this)}
        >
          <div>{window.gettext('Restore workflow')}</div>
        </div>,
        <div
          id="permanently-delete-workflow"
          className="hover-shade"
          onClick={this.deleteWorkflowHard.bind(this)}
        >
          <div>{window.gettext('Permanently delete workflow')}</div>
        </div>
      ]
  }

  deleteWorkflow() {
    if (
      window.confirm(
        window.gettext('Are you sure you want to delete this workflow?')
      )
    ) {
      deleteSelf(this.props.data.id, 'workflow', true, () => {})
    }
  }

  deleteWorkflowHard() {
    if (
      window.confirm(
        window.gettext(
          'Are you sure you want to permanently delete this workflow?'
        )
      )
    ) {
      deleteSelf(this.props.data.id, 'workflow', false, () => {
        window.location = window.config.update_path['project'].replace(
          0,
          renderer.project.id
        )
      })
    }
  }

  restoreWorkflow() {
    restoreSelf(this.props.data.id, 'workflow', () => {})
  }

  getExportButton() {
    if (this.props.renderer.public_view && !user_id) return null
    if (this.props.renderer.is_student && !this.props.renderer.can_view)
      return null
    let export_button = (
      <div
        id="export-button"
        className="hover-shade"
        onClick={() =>
          renderMessageBox(
            { ...this.props.data, object_sets: this.props.object_sets },
            'export',
            closeMessageBox
          )
        }
      >
        <div>{window.gettext('Export')}</div>
      </div>
    )
    return export_button
  }

  getCopyButton() {
    if (!user_id) return null
    let export_button = [
      <div
        id="copy-button"
        className="hover-shade"
        onClick={() => {
          let loader = this.props.renderer.tiny_loader
          if (this.props.data.is_strategy) {
            loader.startLoad()
            duplicateBaseItem(
              this.props.data.id,
              this.props.data.type,
              null,
              (response_data) => {
                loader.endLoad()
                window.location = window.config.update_path[
                  response_data.new_item.type
                ].replace('0', response_data.new_item.id)
              }
            )
          } else {
            getTargetProjectMenu(-1, (response_data) => {
              if (response_data.parentID != null) {
                let loader = new Utility.Loader('body')
                duplicateBaseItem(
                  this.props.data.id,
                  this.props.data.type,
                  response_data.parentID,
                  (response_data) => {
                    loader.endLoad()
                    window.location = window.config.update_path[
                      response_data.new_item.type
                    ].replace('0', response_data.new_item.id)
                  }
                )
              }
            })
          }
        }}
      >
        <div>{window.gettext('Copy to my library')}</div>
      </div>
    ]
    if (
      !this.props.data.is_strategy &&
      this.props.renderer.project_permission == Constants.permission_keys.edit
    )
      export_button.unshift(
        <div
          id="copy-to-project-button"
          className="hover-shade"
          onClick={() => {
            let loader = this.props.renderer.tiny_loader
            duplicateBaseItem(
              this.props.data.id,
              this.props.data.type,
              this.props.renderer.project.id,
              (response_data) => {
                loader.endLoad()
                window.location = window.config.update_path[
                  response_data.new_item.type
                ].replace('0', response_data.new_item.id)
              }
            )
          }}
        >
          <div>{window.gettext('Copy into current project')}</div>
        </div>
      )
    return export_button
  }

  getImportButton() {
    if (this.props.renderer.read_only) return null
    let disabled
    if (this.props.data.importing) disabled = true
    let imports = [<hr />]
    this.pushImport(
      imports,
      'outcomes',
      window.gettext('Import Outcomes'),
      disabled
    )
    this.pushImport(imports, 'nodes', window.gettext('Import Nodes'), disabled)

    return imports
  }

  pushImport(imports, import_type, text, disabled) {
    let a_class = 'hover-shade'
    if (disabled) a_class = ' disabled'
    imports.push(
      <a className={a_class} onClick={this.clickImport.bind(this, import_type)}>
        {text}
      </a>
    )
  }

  clickImport(import_type, evt) {
    evt.preventDefault()
    renderMessageBox(
      {
        object_id: this.props.data.id,
        object_type: this.objectType,
        import_type: import_type
      },
      'import',
      () => {
        closeMessageBox()
      }
    )
  }

  getReturnLinks() {
    let renderer = this.props.renderer
    let data = this.props.data
    let return_links = []
    if (renderer.project && !renderer.is_student && !renderer.public_view) {
      return_links.push(
        <a
          className="hover-shade no-underline"
          id="project-return"
          href={window.config.update_path['project'].replace(
            0,
            renderer.project.id
          )}
        >
          <span className="material-symbols-rounded green">arrow_back_ios</span>
          <div>
            {window.gettext('Return to')}{' '}
            <WorkflowTitle
              class_name="inline"
              no_hyperlink={true}
              data={renderer.project}
            />
          </div>
        </a>
      )
    }
    if (renderer.public_view && renderer.can_view) {
      return_links.push(
        <a
          className="hover-shade no-underline"
          id="project-return"
          href={window.config.update_path['project'].replace(
            0,
            renderer.project.id
          )}
        >
          <span className="material-symbols-rounded green">arrow_back_ios</span>
          <div>{window.gettext('Return to Editable Workflow')}</div>
        </a>
      )
    }
    // if(!renderer.public_view && renderer.project && (renderer.is_teacher || renderer.is_student)){
    //     return_links.push(
    //         <a className="hover-shade no-underline" id='live-project-return' href={update_path["liveproject"].replace(0,renderer.project.id)}>
    //             <span className="material-symbols-rounded green">arrow_back_ios</span>
    //             <div>{window.gettext("Return to classroom (")}<WorkflowTitle class_name={"inline-title"} data={renderer.project} no_hyperlink={true}/>{")"}</div>
    //         </a>
    //     );
    // }
    return reactDom.createPortal(return_links, $('.titlebar .title')[0])
  }

  getProjectLink() {
    return null
    // let renderer=this.props.renderer;
    // if(renderer.project && !renderer.is_student && !renderer.public_view)return(
    //     <WorkflowTitle class_name={"project-title-in-workflow"} data={this.props.renderer.project}/>
    // );
    // else return null;
  }

  getWorkflowContent() {
    let data = this.props.data
    let renderer = this.props.renderer

    let workflow_content
    if (renderer.view_type == 'outcometable') {
      workflow_content = (
        <WorkflowTableView
          data={data}
          renderer={renderer}
          view_type={renderer.view_type}
        />
      )
      this.allowed_tabs = [3]
    } else if (renderer.view_type == 'outcomeedit') {
      workflow_content = <OutcomeEditView renderer={renderer} />
      if (data.type == 'program') this.allowed_tabs = [3]
      else this.allowed_tabs = [2, 3]
    } else if (renderer.view_type == 'alignmentanalysis') {
      workflow_content = (
        <AlignmentView renderer={renderer} view_type={renderer.view_type} />
      )
      this.allowed_tabs = [3]
    } else if (renderer.view_type == 'grid') {
      workflow_content = (
        <GridView renderer={renderer} view_type={renderer.view_type} />
      )
      this.allowed_tabs = [3]
    } else {
      workflow_content = <WorkflowView renderer={renderer} />
      this.allowed_tabs = [1, 2, 3, 4]
      if (renderer.read_only) this.allowed_tabs = [2, 3]
    }

    if (data.is_strategy) return workflow_content

    let view_buttons = [
      {
        type: 'workflowview',
        name: window.gettext('Workflow View'),
        disabled: []
      },
      {
        type: 'outcomeedit',
        name: Utility.capWords(
          window.gettext('View') + ' ' + window.gettext(data.type + ' outcomes')
        ),
        disabled: []
      },
      {
        type: 'outcometable',
        name: Utility.capWords(
          window.gettext(data.type + ' outcome') + ' ' + window.gettext('Table')
        ),
        disabled: []
      },
      {
        type: 'alignmentanalysis',
        name: Utility.capWords(
          window.gettext(data.type + ' outcome') +
            ' ' +
            window.gettext('Analytics')
        ),
        disabled: ['activity']
      },
      {
        type: 'grid',
        name: window.gettext('Grid View'),
        disabled: ['activity', 'course']
      }
    ]
      .filter((item) => item.disabled.indexOf(data.type) == -1)
      .map((item) => {
        let view_class = 'hover-shade'
        if (item.type == renderer.view_type) view_class += ' active'
        //if(item.disabled.indexOf(data.type)>=0)view_class+=" disabled";
        return (
          <a
            id={'button_' + item.type}
            className={view_class}
            onClick={this.changeView.bind(this, item.type)}
          >
            {item.name}
          </a>
        )
      })

    let view_buttons_sorted = view_buttons.slice(0, 2)
    view_buttons_sorted.push(
      <div
        className="hover-shade other-views"
        onClick={() => $('.views-dropdown')[0].classList.toggle('toggled')}
      >
        {window.gettext('Other Views')}
        <div className="views-dropdown">{view_buttons.slice(2)}</div>
      </div>
    )

    return [
      <div className="workflow-view-select hide-print">
        {view_buttons_sorted}
      </div>,
      workflow_content
    ]
  }

  getParentWorkflowIndicator() {
    return (
      <ParentWorkflowIndicator
        renderer={this.props.renderer}
        workflow_id={this.props.data.id}
      />
    )
  }

  getJump() {
    if (this.props.renderer.view_type != 'workflowview') return null
    let data = this.props.data
    let nodebarweekworkflows = data.weekworkflow_set.map(
      (weekworkflow, index) => (
        <NodeBarWeekWorkflow
          key={`weekworkflow-${index}`}
          order={data.weekworkflow_set}
          renderer={this.props.renderer}
          objectID={weekworkflow}
        />
      )
    )
    return (
      <div id="jump-to">
        <div className="hover-shade flex-middle">
          <span className="green material-symbols-rounded">
            keyboard_double_arrow_down
          </span>
          <div>{window.gettext('Jump to')}</div>
        </div>
        <div className="create-dropdown">{nodebarweekworkflows}</div>
      </div>
    )
  }

  getExpand() {
    return (
      <div id="expand-collapse-all">
        <div className="hover-shade flex-middle">
          <span className="green material-symbols-rounded">zoom_out_map</span>
          <div>{window.gettext('Expand/Collapse')}</div>
        </div>
        <div className="create-dropdown">
          <div
            className="flex-middle hover-shade"
            onClick={this.expandAll.bind(this, 'week')}
          >
            <span className="green material-symbols-rounded">zoom_out_map</span>
            <div>{window.gettext('Expand all weeks')}</div>
          </div>
          <div
            className="flex-middle hover-shade"
            onClick={this.collapseAll.bind(this, 'week')}
          >
            <span className="green material-symbols-rounded">zoom_in_map</span>
            <div>{window.gettext('Collapse all weeks')}</div>
          </div>
          <hr />
          <div
            className="flex-middle hover-shade"
            onClick={this.expandAll.bind(this, 'node')}
          >
            <span className="green material-symbols-rounded">zoom_out_map</span>
            <div>{window.gettext('Expand all nodes')}</div>
          </div>
          <div
            className="flex-middle hover-shade"
            onClick={this.collapseAll.bind(this, 'node')}
          >
            <span className="green material-symbols-rounded">zoom_in_map</span>
            <div>{window.gettext('Collapse all nodes')}</div>
          </div>
          <hr />
          <div
            className="flex-middle hover-shade"
            onClick={this.expandAll.bind(this, 'outcome')}
          >
            <span className="green material-symbols-rounded">zoom_out_map</span>
            <div>{window.gettext('Expand all outcomes')}</div>
          </div>
          <div
            className="flex-middle hover-shade"
            onClick={this.collapseAll.bind(this, 'outcome')}
          >
            <span className="green material-symbols-rounded">zoom_in_map</span>
            <div>{window.gettext('Collapse all outcomes')}</div>
          </div>
        </div>
      </div>
    )
  }

  expandAll(type) {
    this.props[type].forEach((week) =>
      toggleDrop(week.id, type, true, this.props.dispatch)
    )
  }

  collapseAll(type) {
    this.props[type].forEach((week) =>
      toggleDrop(week.id, type, false, this.props.dispatch)
    )
  }
}
const mapWorkflowStateToProps = (state) => ({
  data: state.workflow,
  object_sets: state.objectset,
  week: state.week,
  node: state.node,
  outcome: state.outcome
})
const mapWorkflowDispatchToProps = {}
export const WorkflowBaseView = connect(
  mapWorkflowStateToProps,
  null
)(WorkflowBaseViewUnconnected)

//Basic component representing the workflow
class WorkflowViewUnconnected extends EditableComponentWithSorting {
  constructor(props) {
    super(props)
    this.objectType = 'workflow'
    this.state = {}
  }

  render() {
    let data = this.props.data
    let renderer = this.props.renderer
    var columnworkflows = data.columnworkflow_set.map(
      (columnworkflow, index) => (
        <ColumnWorkflowView
          key={`columnworkflow-${index}`}
          objectID={columnworkflow}
          parentID={data.id}
          renderer={renderer}
        />
      )
    )
    var weekworkflows = data.weekworkflow_set.map((weekworkflow, index) => (
      <WeekWorkflowView
        condensed={data.condensed}
        key={`weekworkflow-${index}`}
        objectID={weekworkflow}
        parentID={data.id}
        renderer={renderer}
      />
    ))

    let css_class = 'workflow-details'
    if (data.condensed) css_class += ' condensed'

    return (
      <div className={css_class}>
        <WorkflowLegend renderer={renderer} />
        <div className="column-row" id={data.id + '-column-block'}>
          {columnworkflows}
        </div>
        <div className="week-block" id={data.id + '-week-block'}>
          {weekworkflows}
        </div>
        <svg className="workflow-canvas" width="100%" height="100%">
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          </defs>
        </svg>
      </div>
    )
  }

  componentDidMount() {
    this.makeDragAndDrop()
  }

  componentDidUpdate() {
    this.makeDragAndDrop()
  }

  makeDragAndDrop() {
    this.makeSortableNode(
      $('.column-row').children('.column-workflow').not('.ui-draggable'),
      this.props.objectID,
      'columnworkflow',
      '.column-workflow',
      'x',
      false,
      null,
      '.column',
      '.column-row'
    )
    this.makeSortableNode(
      $('.week-block').children('.week-workflow').not('.ui-draggable'),
      this.props.objectID,
      'weekworkflow',
      '.week-workflow',
      'y',
      false,
      null,
      '.week',
      '.week-block'
    )
  }

  stopSortFunction() {
    Utility.triggerHandlerEach($('.week .node'), 'component-updated')
  }

  sortableMovedFunction(id, new_position, type, new_parent, child_id) {
    if (type == 'columnworkflow') {
      this.props.renderer.micro_update(
        moveColumnWorkflow(id, new_position, new_parent, child_id)
      )
      insertedAt(
        this.props.renderer,
        child_id,
        'column',
        new_parent,
        'workflow',
        new_position,
        'columnworkflow'
      )
    }
    if (type == 'weekworkflow') {
      this.props.renderer.micro_update(
        moveWeekWorkflow(id, new_position, new_parent, child_id)
      )
      insertedAt(
        this.props.renderer,
        child_id,
        'week',
        new_parent,
        'workflow',
        new_position,
        'weekworkflow'
      )
    }
  }
}
export const WorkflowView = connect(
  mapWorkflowStateToProps,
  null
)(WorkflowViewUnconnected)

class WorkflowTableView extends React.Component {
  render() {
    let data = this.props.data
    if (data.table_type == 1)
      return (
        <CompetencyMatrixView
          view_type={this.props.view_type}
          renderer={this.props.renderer}
        />
      )
    else
      return (
        <WorkflowView_Outcome
          view_type={this.props.view_type}
          renderer={this.props.renderer}
        />
      )
  }
}

class ViewBarUnconnected extends React.Component {
  render() {
    let data = this.props.data
    let sort_block
    if (
      this.props.renderer.view_type == 'outcometable' ||
      this.props.renderer.view_type == 'horizontaloutcometable'
    ) {
      let table_type_value = data.table_type || 0
      let sort_type = (
        <div className="node-bar-sort-block">
          {this.props.renderer.outcome_sort_choices.map((choice) => (
            <div>
              <input
                disabled={
                  table_type_value == 1 ||
                  (data.type == 'program' && choice.type > 1)
                }
                type="radio"
                id={'sort_type_choice' + choice.type}
                name={'sort_type_choice' + choice.type}
                value={choice.type}
                checked={data.outcomes_sort == choice.type}
                onChange={this.changeSort.bind(this)}
              />
              <label htmlFor={'sort_type_choice' + choice.type}>
                {choice.name}
              </label>
            </div>
          ))}
        </div>
      )
      let table_type = (
        <div className="node-bar-sort-block">
          <div>
            <input
              type="radio"
              id={'table_type_table'}
              name="table_type_table"
              value={0}
              checked={table_type_value == 0}
              onChange={this.changeTableType.bind(this)}
            />
            <label htmlFor="table_type_table">
              {window.gettext('Table Style')}
            </label>
          </div>
          <div>
            <input
              type="radio"
              id={'table_type_matrix'}
              name="table_type_matrix"
              value={1}
              checked={table_type_value == 1}
              onChange={this.changeTableType.bind(this)}
            />
            <label htmlFor="table_type_matrix">
              {window.gettext('Competency Matrix Style')}
            </label>
          </div>
        </div>
      )
      sort_block = (
        <div>
          <h4>{window.gettext('Sort Nodes')}:</h4>
          {sort_type}
          <h4>{window.gettext('Table Type')}:</h4>
          {table_type}
        </div>
      )
    }

    let sets = (
      <div className="node-bar-sort-block">
        {this.props.object_sets
          .sort((a, b) => {
            let x = a.term
            let y = b.term
            if (x < y) return -1
            if (x > y) return 1
            return 0
          })
          .map((set) => (
            <div>
              <input
                type="checkbox"
                id={'set' + set.id}
                value={set.id}
                checked={!set.hidden}
                onChange={this.toggleHidden.bind(this, set.id, !set.hidden)}
              />
              <label htmlFor={'set' + set.id}>{set.title}</label>
            </div>
          ))}
      </div>
    )

    return (
      <div id="node-bar-workflow" className="right-panel-inner">
        <h3>{window.gettext('View options')}</h3>
        <hr />
        {sort_block}
        <h4>{window.gettext('Object Sets')}</h4>
        {sets}
      </div>
    )
  }

  toggleHidden(id, hidden) {
    this.props.dispatch(toggleObjectSet(id, hidden))
  }

  changeSort(evt) {
    this.props.dispatch(
      changeField(this.props.data.id, 'workflow', {
        outcomes_sort: evt.target.value
      })
    )
  }
  changeTableType(evt) {
    this.props.dispatch(
      changeField(this.props.data.id, 'workflow', {
        table_type: evt.target.value
      })
    )
  }
}
export const ViewBar = connect(
  (state) => ({
    object_sets: state.objectset
  }),
  null
)(ViewBarUnconnected)

class NodeBarUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'workflow'
  }

  render() {
    let data = this.props.data

    var nodebarcolumnworkflows = data.columnworkflow_set.map(
      (columnworkflow, index) => (
        <NodeBarColumnWorkflow
          key={`NodeBarColumnWorkflow-${index}`}
          renderer={this.props.renderer}
          objectID={columnworkflow}
        />
      )
    )
    var columns_present = this.props.columns.map((col) => col.column_type)
    for (var i = 0; i < data.DEFAULT_COLUMNS.length; i++) {
      if (columns_present.indexOf(data.DEFAULT_COLUMNS[i]) < 0) {
        nodebarcolumnworkflows.push(
          <NodeBarColumnWorkflow
            key={`NodeBarColumnWorkflow-${i}`}
            renderer={this.props.renderer}
            columnType={data.DEFAULT_COLUMNS[i]}
          />
        )
      }
    }
    nodebarcolumnworkflows.push(
      <NodeBarColumnWorkflow
        key={`NodeBarColumnWorkflow-last-${i}`}
        renderer={this.props.renderer}
        columnType={data.DEFAULT_CUSTOM_COLUMN}
      />
    )

    let nodebar_nodes
    if (!this.props.renderer.read_only)
      nodebar_nodes = [
        <h4>{window.gettext('Nodes')}</h4>,
        <div className="node-bar-column-block">{nodebarcolumnworkflows}</div>
      ]

    var strategies = this.props.available_strategies.map((strategy) => (
      <StrategyView key={strategy.id} objectID={strategy.id} data={strategy} />
    ))
    var saltise_strategies = this.props.saltise_strategies.map((strategy) => (
      <StrategyView key={strategy.id} objectID={strategy.id} data={strategy} />
    ))

    return (
      <div id="node-bar-workflow" className="right-panel-inner">
        <h3 className="drag-and-drop">{window.gettext('Add to workflow')}</h3>
        <hr />
        {nodebar_nodes}
        <hr />
        <h4>{window.gettext('My strategies')}</h4>
        <div className="strategy-bar-strategy-block">{strategies}</div>
        {saltise_strategies.length > 0 && [
          <h4>{window.gettext('SALTISE strategies')}</h4>,
          <div className="strategy-bar-strategy-block">
            {saltise_strategies}
          </div>
        ]}
      </div>
    )
  }
}
const mapNodeBarStateToProps = (state) => ({
  data: state.workflow,
  columns: state.column,
  available_strategies: state.strategy,
  saltise_strategies: state.saltise_strategy
})
export const NodeBar = connect(mapNodeBarStateToProps, null)(NodeBarUnconnected)

class RestoreBarUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'workflow'
  }

  render() {
    let columns = this.props.columns.map((column) => (
      <RestoreBarItem
        key={column.id}
        objectType="column"
        data={column}
        renderer={this.props.renderer}
      />
    ))
    let weeks = this.props.weeks.map((week) => (
      <RestoreBarItem
        key={week.id}
        objectType="week"
        data={week}
        renderer={this.props.renderer}
      />
    ))
    let nodes = this.props.nodes.map((node) => (
      <RestoreBarItem
        key={node.id}
        objectType="node"
        data={node}
        renderer={this.props.renderer}
      />
    ))
    let outcomes = this.props.outcomes.map((outcome) => (
      <RestoreBarItem
        key={outcome.id}
        objectType="outcome"
        data={outcome}
        renderer={this.props.renderer}
      />
    ))
    let nodelinks = this.props.nodelinks.map((nodelink) => (
      <RestoreBarItem
        key={nodelink.id}
        objectType="nodelink"
        data={nodelink}
        renderer={this.props.renderer}
      />
    ))

    return (
      <div id="restore-bar-workflow" className="right-panel-inner">
        <h3>{window.gettext('Restore items')}</h3>
        <hr />
        <h4>{window.gettext('Nodes')}</h4>
        <div className="node-bar-column-block">{nodes}</div>
        <hr />
        <h4>{window.gettext('Weeks')}</h4>
        <div className="node-bar-column-block">{weeks}</div>
        <hr />
        <h4>{window.gettext('Columns')}</h4>
        <div className="node-bar-column-block">{columns}</div>
        <hr />
        <h4>{window.gettext('Outcomes')}</h4>
        <div className="node-bar-column-block">{outcomes}</div>
        <hr />
        <h4>{window.gettext('Node Links')}</h4>
        <div className="node-bar-column-block">{nodelinks}</div>
      </div>
    )
  }

  componentDidMount() {
    this.checkVisible()
  }
  componentDidUpdate() {
    this.checkVisible()
  }

  checkVisible() {
    if (
      this.props.nodes.length == 0 &&
      this.props.weeks.length == 0 &&
      this.props.columns.length == 0 &&
      this.props.outcomes.length == 0 &&
      this.props.nodelinks.length == 0
    ) {
      $("a[href='#restore-bar']").parent().addClass('hidden')
    } else {
      $("a[href='#restore-bar']").parent().removeClass('hidden')
    }
  }
}
const mapRestoreBarStateToProps = (state) => ({
  weeks: state.week.filter((x) => x.deleted),
  columns: state.column.filter((x) => x.deleted),
  nodes: state.node.filter((x) => x.deleted),
  outcomes: state.outcome.filter((x) => x.deleted),
  nodelinks: state.nodelink.filter((x) => x.deleted)
})
export const RestoreBar = connect(
  mapRestoreBarStateToProps,
  null
)(RestoreBarUnconnected)

class RestoreBarItem extends Component {
  render() {
    return (
      <div ref={this.maindiv} className="restore-bar-item">
        <div>{this.getTitle()}</div>
        <div className="workflow-created">
          {window.gettext('Deleted') + ' ' + this.props.data.deleted_on}
        </div>
        <button onClick={this.restore.bind(this)}>
          {window.gettext('Restore')}
        </button>
        <button onClick={this.delete.bind(this)}>
          {window.gettext('Permanently Delete')}
        </button>
      </div>
    )
  }

  getTitle() {
    if (this.props.data.title && this.props.data.title !== '')
      return this.props.data.title
    if (
      this.props.objectType == 'node' &&
      this.props.data.represents_workflow &&
      this.props.linked_workflow_data &&
      this.props.data.linked_workflow_data.title &&
      this.props.data.linked_workflow_data.title !== ''
    )
      return this.props.data.linked_workflow_data.title
    return window.gettext('Untitled')
  }

  restore() {
    this.setState({ disabled: true })
    this.props.renderer.tiny_loader.startLoad()
    restoreSelf(this.props.data.id, this.props.objectType, () => {
      this.props.renderer.tiny_loader.endLoad()
    })
  }

  delete() {
    if (
      window.confirm(
        window.gettext(
          'Are you sure you want to permanently delete this object?'
        )
      )
    ) {
      $(this.maindiv.current).children('button').attr('disabled', true)
      this.props.renderer.tiny_loader.startLoad()
      deleteSelf(this.props.data.id, this.props.objectType, false, () => {
        this.props.renderer.tiny_loader.endLoad()
      })
    }
  }
}

// class StrategyBarUnconnected extends React.Component{

//     constructor(props){
//         super(props);
//         this.objectType="workflow";
//     }

//     render(){

//         var strategies = this.props.available_strategies.map((strategy)=>
//             <StrategyView key={strategy.id} objectID={strategy.id} data={strategy}/>
//         );
//         var saltise_strategies = this.props.saltise_strategies.map((strategy)=>
//             <StrategyView key={strategy.id} objectID={strategy.id} data={strategy}/>
//         );

//         return reactDom.createPortal(
//             <div id="strategy-bar-workflow" className="right-panel-inner">
//                 <h4 className="drag-and-drop">{window.gettext("My Strategies")}:</h4>
//                 <div className="strategy-bar-strategy-block">
//                     {strategies}
//                 </div>
//                 {(saltise_strategies.length>0) &&
//                     [<h4 className="drag-and-drop">{window.gettext("SALTISE Strategies")}:</h4>,
//                     <div className="strategy-bar-strategy-block">
//                         {saltise_strategies}
//                     </div>
//                      ]
//                 }
//             </div>
//         ,$("#strategy-bar")[0]);
//     }

// }
// const mapStrategyBarStateToProps = state=>({
//     data:state.workflow,
//     available_strategies:state.strategy,
//     saltise_strategies:state.saltise_strategy,
// })
// export const StrategyBar = connect(
//     mapStrategyBarStateToProps,
//     null
// )(StrategyBarUnconnected)

//Basic component representing the workflow
class WorkflowView_Outcome_Unconnected extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'workflow'
    this.state = {}
  }

  render() {
    let data = this.props.data

    var selector = this
    let renderer = this.props.renderer

    return (
      <div className="workflow-details">
        <WorkflowOutcomeLegend
          renderer={renderer}
          outcomes_type={data.outcomes_type}
        />
        <WorkflowOutcomeView
          renderer={renderer}
          outcomes_type={data.outcomes_type}
        />
      </div>
    )
  }
}
export const WorkflowView_Outcome = connect(
  mapWorkflowStateToProps,
  null
)(WorkflowView_Outcome_Unconnected)

class ParentWorkflowIndicatorUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    if (this.state.has_loaded) {
      if (
        this.state.parent_workflows.length == 0 &&
        this.props.child_workflows.length == 0
      )
        return null
      let parent_workflows = this.state.parent_workflows.map(
        (parent_workflow, index) => (
          <WorkflowTitle
            key={`WorkflowTitleParent-${index}`}
            data={parent_workflow}
            test_id="panel-favourite"
          />
        )
      )
      let child_workflows = this.props.child_workflows.map(
        (child_workflow, index) => (
          <WorkflowTitle
            key={`WorkflowTitleChild-${index}`}
            data={child_workflow}
            test_id="panel-favourite"
          />
        )
      )
      let return_val = [
        <hr key="br" />,
        <a key="quick-nav" className="panel-item">
          {window.gettext('Quick Navigation')}
        </a>
      ]
      if (parent_workflows.length > 0)
        return_val.push(
          <a className="panel-item">{window.gettext('Used in:')}</a>,
          ...parent_workflows
        )
      if (child_workflows.length > 0)
        return_val.push(
          <a className="panel-item">{window.gettext('Workflows Used:')}</a>,
          ...child_workflows
        )
      // return reactDom.createPortal(return_val, $('.left-panel-extra')[0])
      // @todo see https://course-flow.atlassian.net/browse/COUR-246
      return reactDom.createPortal(
        return_val,
        $('#react-portal-left-panel-extra')[0]
      )
    }

    return null
  }

  componentDidMount() {
    if (this.props.renderer.public_view) {
      getPublicParentWorkflowInfo(this.props.workflow_id, (response_data) =>
        this.setState({
          parent_workflows: response_data.parent_workflows,
          has_loaded: true
        })
      )
    } else {
      getParentWorkflowInfo(this.props.workflow_id, (response_data) =>
        this.setState({
          parent_workflows: response_data.parent_workflows,
          has_loaded: true
        })
      )
    }
  }

  getTypeIndicator(data) {
    let type = data.type
    let type_text = window.gettext(type)
    if (data.is_strategy) type_text += window.gettext(' strategy')
    return <div className={'workflow-type-indicator ' + type}>{type_text}</div>
  }
}
const mapParentWorkflowIndicatorStateToProps = (state) => ({
  child_workflows: state.node
    .filter((node) => node.linked_workflow_data)
    .map((node) => ({
      id: node.linked_workflow,
      title: node.linked_workflow_data.title,
      description: node.linked_workflow_data.description,
      url: node.linked_workflow_data.url,
      deleted: node.linked_workflow_data.deleted
    }))
})
export const ParentWorkflowIndicator = connect(
  mapParentWorkflowIndicatorStateToProps,
  null
)(ParentWorkflowIndicatorUnconnected)
