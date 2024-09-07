// @ts-nocheck
// import { WorkflowTitle } from '@cfComponents/UIPrimitives/Titles'

// import { WorkflowCardProps } from '@cfComponents/cards/WorkflowCard/type'
import { _t } from '@cf/utility/utilityFunctions'
import { WorkflowCardWrapperPropsType } from '@cfComponents/cards/WorkflowCardWrapper'
import { Component } from 'react'

type PropsType = WorkflowCardWrapperPropsType
// type StateType = WorkflowCardWrapperState

/*******************************************************
  A container for workflow cards that allows searching and filtering

  Accepts a list of workflows as props.
  Optional prop search_within restricts searches to the existing list of workflows.
 *******************************************************/
// @todo define props
class WorkflowCardCondensed extends Component<PropsType, StateType> {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  ProjectTitle = () => {
    if (this.props.workflowData.project_title) {
      return (
        <div className="project-title">
          {this.props.workflowData.project_title}
        </div>
      )
    } else {
      return '-'
    }
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.workflowData
    return <></>
    // return (
    //   <WorkflowCardDumb
    //     ref={this.mainDiv}
    //     className={'workflow-for-menu simple-workflow hover-shade ' + data.type}
    //     title={
    //       <>
    //         <WorkflowTitle
    //           no_hyperlink={this.props.no_hyperlink}
    //           class_name="workflow-title"
    //           data={data}
    //         />
    //         <this.ProjectTitle />
    //       </>
    //     }
    //     id={data.id}
    //     chips={[this.getTypeChip()]}
    //     onClick={this.clickAction.bind(this)}
    //     onMouseDown={(evt) => {
    //       evt.preventDefault()
    //     }}
    //   />
    // )
  }
}

export default WorkflowCardCondensed
