import * as React from 'react'
import { getAddedWorkflowMenu } from '@XMLHTTP/postTemp'
import WorkflowCard from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard'

class MenuSection extends React.Component {
  constructor(props) {
    super(props)
    this.dropdownDiv = React.createRef()
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    COURSEFLOW_APP.makeDropdown(this.dropdownDiv.current)
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let section_type = this.props.section_data.object_type
    let is_strategy = this.props.section_data.is_strategy
    let parentID = this.props.parentID
    let add_button

    let objects = this.props.section_data.objects.map((object) => (
      <WorkflowCard
        key={object.id}
        no_hyperlink={this.props.no_hyperlink}
        type={this.props.type}
        workflow_data={object}
        objectType={section_type}
        selected={this.props.selected_id === object.id}
        dispatch={this.props.dispatch}
        selectAction={this.props.selectAction}
        parentID={this.props.parentID}
        duplicate={this.props.duplicate}
      />
    ))
    if (this.props.replacement_text) objects = this.props.replacement_text

    if (COURSEFLOW_APP.config.create_path && this.props.add) {
      let types
      if (section_type === 'workflow') types = ['program', 'course', 'activity']
      else types = [section_type]
      let adds
      {
        adds = types.map((this_type) => (
          <a
            className="hover-shade"
            href={COURSEFLOW_APP.config.create_path[this_type]}
          >
            {window.gettext('Create new ') + window.gettext(this_type)}
          </a>
        ))
        let import_text =
          window.gettext('Import ') + window.gettext(section_type)
        if (is_strategy) import_text += window.gettext(' strategy')
        adds.push(
          <a
            className="hover-shade"
            onClick={() => {
              getAddedWorkflowMenu(
                parentID,
                section_type,
                is_strategy,
                false,
                (response_data) => {
                  if (response_data.workflowID != null) {
                    let loader = new Utility.Loader('body')
                    duplicateBaseItem(
                      response_data.workflowID,
                      section_type,
                      parentID,
                      (duplication_response_data) => {
                        loader.endLoad()
                        location.reload()
                      }
                    )
                  }
                }
              )
            }}
          >
            {import_text}
          </a>
        )
      }
      add_button = (
        <div className="menu-create hover-shade" ref={this.dropdownDiv}>
          <img
            className={
              'create-button create-button-' +
              this.props.section_data.object_type +
              ' link-image'
            }
            title={window.gettext('Add New')}
            src={COURSEFLOW_APP.config.icon_path + 'add_new_white.svg'}
          />
          <div>{this.props.section_data.title}</div>
          <div className="create-dropdown">{adds}</div>
        </div>
      )
    }

    return (
      <div className={'section-' + this.props.section_data.object_type}>
        {add_button}
        <div className="menu-grid">{objects}</div>
      </div>
    )
  }
}

/*
A tab for the menu of workflows.
*/
class MenuTab extends React.Component {
  render() {
    let is_empty = true
    for (let i = 0; i < this.props.data.sections.length; i++) {
      if (this.props.data.sections[i].objects.length > 0) {
        is_empty = false
        break
      }
    }
    let replacement_text
    if (is_empty) replacement_text = this.props.data.emptytext
    var sections = this.props.data.sections.map((section, i) => (
      <MenuSection
        no_hyperlink={this.props.no_hyperlink}
        type={this.props.type}
        replacement_text={i == 0 ? replacement_text : null}
        section_data={section}
        add={this.props.data.add}
        selected_id={this.props.selected_id}
        dispatch={this.props.dispatch}
        selectAction={this.props.selectAction}
        parentID={this.props.parentID}
        duplicate={this.props.data.duplicate}
      />
    ))
    return <div id={'tabs-' + this.props.identifier}>{sections}</div>
  }
}

export default MenuTab
