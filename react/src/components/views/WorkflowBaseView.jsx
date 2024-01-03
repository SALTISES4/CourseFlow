import * as React from 'react'
import * as reactDom from 'react-dom'
import { connect } from 'react-redux'
import { EditableComponentWithActions } from '@cfParentComponents'
import { MenuBar } from '@cfCommonComponents/components'
import { CollapsibleText, WorkflowTitle, TitleText } from '@cfUIComponents'
import RightSideBar from '@cfCommonComponents/rightSideBarContent/RightSideBar'
import { renderMessageBox } from '../common/menu/MenuComponents'
import * as Constants from '@cfConstants'
import * as Utility from '@cfUtility'
import { ConnectionBar } from '@cfModule/ConnectedUsers'
import { getWeekWorkflowByID, getWeekByID } from '@cfFindState'
import {
  getParentWorkflowInfo,
  getPublicParentWorkflowInfo,
  restoreSelfQuery,
  deleteSelfQuery,
  toggleDrop
} from '@XMLHTTP/PostFunctions'
import { getTargetProjectMenu } from '@XMLHTTP/postTemp'

import { WorkflowView } from './WorkflowView'
import { OutcomeEditView } from './OutcomeEditView'
import { AlignmentView } from './AlignmentView'
import { CompetencyMatrixView } from './CompetencyMatrixView'
import { OutcomeTableView } from './OutcomeTableView'
import { GridView } from './GridView'
import closeMessageBox from '../common/menu/components/closeMessageBox'
import {
  duplicateBaseItemQuery,
  getUsersForObjectQuery
} from '@XMLHTTP/APIFunctions'

/**
 * The base component of our workflow view. This renders the menu bar
 * above itself, the right sidebar, the header (description, sharing etc),
 * and then the tabs that allow the user to select a "type" of workflow view.
 */
class WorkflowBaseViewUnconnected extends EditableComponentWithActions {
  constructor(props) {
    super(props)
    console.log('props')
    console.log(props)

    this.objectType = 'workflow'
    this.allowed_tabs = [0, 1, 2, 3, 4]
    this.state = {
      users: null
    }
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.getUserData()
    this.updateTabs()
    COURSEFLOW_APP.makeDropdown('#jump-to')
    COURSEFLOW_APP.makeDropdown('#expand-collapse-all')
  }

  componentDidUpdate(prev_props) {}

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getUserData() {
    if (this.props.renderer.public_view || this.props.renderer.is_student)
      return null
    getUsersForObjectQuery(this.props.data.id, this.props.data.type, (data) => {
      this.setState({ users: data })
    })
  }

  deleteWorkflow() {
    if (
      window.confirm(
        window.gettext('Are you sure you want to delete this workflow?')
      )
    ) {
      deleteSelfQuery(this.props.data.id, 'workflow', true, () => {})
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
      deleteSelfQuery(this.props.data.id, 'workflow', false, () => {
        window.location = COURSEFLOW_APP.config.update_path['project'].replace(
          0,
          renderer.project.id
        )
      })
    }
  }

  restoreWorkflow() {
    restoreSelfQuery(this.props.data.id, 'workflow', () => {})
  }

  updateTabs() {
    //If the view type has changed, enable only appropriate tabs, and change the selection to none
    this.props.renderer.selection_manager.changeSelection(null, null)
    const disabled_tabs = []
    for (let i = 0; i <= 4; i++)
      if (this.allowed_tabs.indexOf(i) < 0) disabled_tabs.push(i)

    /*******************************************************
     * JQUERY
     *******************************************************/
    $('#sidebar').tabs({ disabled: false })
    const current_tab = $('#sidebar').tabs('option', 'active')
    if (this.allowed_tabs.indexOf(current_tab) < 0) {
      if (this.allowed_tabs.length == 0) $('#sidebar').tabs({ active: false })
      else $('#sidebar').tabs({ active: this.allowed_tabs[0] })
    }
    if (this.props.renderer.read_only) disabled_tabs.push(5)
    $('#sidebar').tabs({ disabled: disabled_tabs })
    /*******************************************************
     * // JQUERY
     *******************************************************/
  }

  changeView(type) {
    //this.props.renderer.selection_manager.changeSelection(null,null);
    this.props.renderer.render(this.props.renderer.container, type)
  }

  getHeader() {
    const data = this.props.data
    const style = {}
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
    const data = this.props.data
    let type_text = window.gettext(data.type)
    if (data.is_strategy) type_text += window.gettext(' strategy')
    return (
      <div className={'workflow-type-indicator ' + data.type}>{type_text}</div>
    )
  }

  getUsers() {
    if (!this.state.users) return null
    const author = this.state.users.author
    const editors = this.state.users.editors
    const commenters = this.state.users.commentors
    const viewers = this.state.users.viewers
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
    const users = [<div className="users-group">{users_group}</div>]
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
    const component = this
    const data = this.props.data
    renderMessageBox(data, 'share_menu', () => {
      closeMessageBox()
      component.getUserData()
    })
  }

  getOverflowLinks() {
    const overflow_links = []
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

  getExportButton() {
    if (this.props.renderer.public_view && !this.props.renderer.user_id)
      return null
    if (this.props.renderer.is_student && !this.props.renderer.can_view)
      return null
    const export_button = (
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
    if (!this.props.renderer.user_id) return null
    const export_button = [
      <div
        id="copy-button"
        className="hover-shade"
        onClick={() => {
          const loader = COURSEFLOW_APP.tiny_loader
          if (this.props.data.is_strategy) {
            loader.startLoad()
            duplicateBaseItemQuery(
              this.props.data.id,
              this.props.data.type,
              null,
              (response_data) => {
                loader.endLoad()
                window.location = COURSEFLOW_APP.config.update_path[
                  response_data.new_item.type
                ].replace('0', response_data.new_item.id)
              }
            )
          } else {
            getTargetProjectMenu(-1, (response_data) => {
              if (response_data.parentID != null) {
                const utilLoader = new Utility.Loader('body')
                duplicateBaseItemQuery(
                  this.props.data.id,
                  this.props.data.type,
                  response_data.parentID,
                  (response_data) => {
                    utilLoader.endLoad()
                    window.location = COURSEFLOW_APP.config.update_path[
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
      this.props.renderer.project_permission === Constants.permission_keys.edit
    )
      export_button.unshift(
        <div
          id="copy-to-project-button"
          className="hover-shade"
          onClick={() => {
            const loader = COURSEFLOW_APP.tiny_loader
            duplicateBaseItem(
              this.props.data.id,
              this.props.data.type,
              this.props.renderer.project.id,
              (response_data) => {
                loader.endLoad()
                window.location = COURSEFLOW_APP.config.update_path[
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
    const imports = [<hr />]
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
    const renderer = this.props.renderer
    const data = this.props.data
    const return_links = []
    if (renderer.project && !renderer.is_student && !renderer.public_view) {
      return_links.push(
        <a
          className="hover-shade no-underline"
          id="project-return"
          href={COURSEFLOW_APP.config.update_path['project'].replace(
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
          href={COURSEFLOW_APP.config.update_path['project'].replace(
            0,
            renderer.project.id
          )}
        >
          <span className="material-symbols-rounded green">arrow_back_ios</span>
          <div>{window.gettext('Return to Editable Workflow')}</div>
        </a>
      )
    }

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
    const data = this.props.data
    const renderer = this.props.renderer

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

    const view_buttons = [
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

    const view_buttons_sorted = view_buttons.slice(0, 2)
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
    const data = this.props.data
    const nodebarweekworkflows = data.weekworkflow_set.map(
      (weekworkflow, index) => (
        <JumpToWeekWorkflow
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

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const renderer = this.props.renderer
    const data = this.props.data
    const visible_buttons = (() => {
      return [this.getEdit(), this.getShare()]
    }).bind(this)
    const overflow_links = this.getOverflowLinks.bind(this)
    const viewbar = (() => {
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
          <div className="body-wrapper">
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

/**
 * Just a quick way to decide which type of table to render
 */
class WorkflowTableView extends React.Component {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    if (data.table_type == 1)
      return (
        <CompetencyMatrixView
          view_type={this.props.view_type}
          renderer={this.props.renderer}
        />
      )
    else
      return (
        <OutcomeTableView
          view_type={this.props.view_type}
          renderer={this.props.renderer}
        />
      )
  }
}

/**
 * Shows the parent workflows for the current workflow, as well
 * as the workflows that have been used, for quick navigation in the
 * left-hand sidebar.
 */
class ParentWorkflowIndicatorUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
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

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getTypeIndicator(data) {
    const type = data.type
    let type_text = gettext(type)
    if (data.is_strategy) type_text += gettext(' strategy')
    return <div className={'workflow-type-indicator ' + type}>{type_text}</div>
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    if (this.state.has_loaded) {
      if (
        this.state.parent_workflows.length == 0 &&
        this.props.child_workflows.length == 0
      )
        return null
      const parent_workflows = this.state.parent_workflows.map(
        (parent_workflow, index) => (
          <WorkflowTitle
            key={`WorkflowTitleParent-${index}`}
            data={parent_workflow}
            test_id="panel-favourite"
          />
        )
      )
      const child_workflows = this.props.child_workflows.map(
        (child_workflow, index) => (
          <WorkflowTitle
            key={`WorkflowTitleChild-${index}`}
            data={child_workflow}
            test_id="panel-favourite"
          />
        )
      )
      const return_val = [
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

/**
 * The weekworkflow representation for the "jump to" menu
 */
class JumpToWeekWorkflowUnconnected extends React.Component {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    return (
      <JumpToWeekView
        objectID={data.week}
        rank={this.props.order.indexOf(data.id)}
        parentID={this.props.parentID}
        throughParentID={data.id}
        renderer={this.props.renderer}
      />
    )
  }
}
const mapWeekWorkflowStateToProps = (state, own_props) =>
  getWeekWorkflowByID(state, own_props.objectID)
const JumpToWeekWorkflow = connect(
  mapWeekWorkflowStateToProps,
  null
)(JumpToWeekWorkflowUnconnected)

/**
 * The week represenation for the "jump to" menu
 */
export class JumpToWeekViewUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'week'
    this.objectClass = '.week'
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  jumpTo() {
    const week_id = this.props.data.id
    const week = $(".week-workflow[data-child-id='" + week_id + "'] > .week")
    if (week.length > 0) {
      const container = $('#container')

      $('#container').animate(
        {
          scrollTop:
            week.offset().top +
            container[0].scrollTop -
            container.offset().top -
            200
        },
        300
      )
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const renderer = this.props.renderer
    let default_text
    if (!renderer.is_strategy)
      default_text = data.week_type_display + ' ' + (this.props.rank + 1)
    let src = COURSEFLOW_APP.config.icon_path + 'plus.svg'
    if (data.is_dropped) src = COURSEFLOW_APP.config.icon_path + 'minus.svg'
    return (
      <div className="hover-shade" onClick={this.jumpTo.bind(this)}>
        <TitleText text={data.title} defaultText={default_text} />
      </div>
    )
  }
}
const mapWeekStateToProps = (state, own_props) =>
  getWeekByID(state, own_props.objectID)
const JumpToWeekView = connect(
  mapWeekStateToProps,
  null
)(JumpToWeekViewUnconnected)
