import * as React from 'react'
import WorkflowCard from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard'
import { duplicateBaseItemQuery } from '@XMLHTTP/API/duplication'
import { UtilityLoader } from '@cfModule/utility/UtilityLoader'
import { GridWrap } from '@cfModule/mui/helper'

type PropsType = {
  no_hyperlink: any
  type: any
  replacement_text: any
  section_data: any
  add: any
  selected_id: any
  dispatch: any
  selectAction: any
  parentID: any
  duplicate: any
}

class MenuSection extends React.Component<PropsType> {
  private dropdownDiv: React.RefObject<HTMLDivElement>
  constructor(props: PropsType) {
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
    const section_type = this.props.section_data.object_type
    const is_strategy = this.props.section_data.is_strategy
    const parentID = this.props.parentID
    let add_button

    let objects = this.props.section_data.objects.map((object) => (
      <WorkflowCard
        key={object.id}
        no_hyperlink={this.props.no_hyperlink}
        type={this.props.type}
        workflowData={object}
        objectType={section_type}
        selected={this.props.selected_id === object.id}
        dispatch={this.props.dispatch}
        selectAction={this.props.selectAction}
        // parentID={this.props.parentID} @todo this is no used in component, check git history if bad refactor
        // duplicate={this.props.duplicate} @todo this is no used in component, check git history if bad refactor
      />
    ))
    if (this.props.replacement_text) objects = this.props.replacement_text

    return (
      <div className={'section-' + this.props.section_data.object_type}>
        {add_button}
        <GridWrap>{objects}</GridWrap>
      </div>
    )
  }
}

export default MenuSection
