import * as React from 'react'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfEditableComponents/ComponentWithToggleDrop'
import { getWorkflowContextQuery } from '@XMLHTTP/API/workflow'
import WorkflowComparison from '@cfPages/Workspace/ProjectComparison'
import { CfObjectType } from '@cfModule/types/enum'
import { UtilityLoader } from '@cfModule/utility/UtilityLoader'

type OwnProps = {
  workflowID: any
  selection_manager: any
  view_type: CfObjectType
  object_sets: any
  removeFunction: any
} & ComponentWithToggleProps

/**
 * Acts as a loader, fetching workflow data from the server then creating a
 * WorkflowBaseView for the comparison
 */
class WorkflowComparisonRendererComponent extends ComponentWithToggleDrop<OwnProps> {
  private workflowComparison: WorkflowComparison
  constructor(props: OwnProps) {
    super(props)
    this.mainDiv = React.createRef()
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    const loader = new UtilityLoader('body')

    const querystring = window.location.search
    const url_params = new URLSearchParams(querystring)
    const workflows_added = url_params
      .getAll('workflows')
      .map((workflow_id) => parseInt(workflow_id))
    if (workflows_added.indexOf(this.props.workflowID) < 0) {
      url_params.append('workflows', this.props.workflowID)

      // @todo
      if (history.pushState) {
        const newurl =
          window.location.protocol +
          '//' +
          window.location.host +
          window.location.pathname +
          '?' +
          url_params.toString()
        window.history.pushState({ path: newurl }, '', newurl)
      }
    }

    // @todo
    // not sure, i think it's attempting to attach the parent as eaach row in the comparions
    // leave for now
    getWorkflowContextQuery(this.props.workflowID, (context_response_data) => {
      const context_data = context_response_data.data_package

      // @todo this will need to be unpacked, type unified with parent and called into parent
      // is there a reason #workflow-inner-wrapper is a real dom element?
      // this needs to be imported directly but that would cause   Circ D.
      this.workflowComparison = new WorkflowComparison({
        workflowID: this.props.workflowID,
        selectionManager: this.props.selection_manager,
        // container: '#workflow-inner-wrapper',
        // @ts-ignore
        container: $(this.mainDiv.current),
        viewType: this.props.view_type,
        initial_object_sets: this.props.object_sets,
        dataPackage: context_data.data_package
      })

      this.workflowComparison.silent_connect_fail = true
      this.workflowComparison.init()

      loader.endLoad()
    })
  }

  componentDidUpdate(prevProps: OwnProps) {
    if (prevProps.view_type != this.props.view_type)
      // no this doesn't work any more
      //
      // @ts-ignore
      // @todo create a stable view of the workflow
      this.workflowComparison.render(this.props.view_type)
  }

  componentWillUnmount() {
    const querystring = window.location.search
    const url_params = new URLSearchParams(querystring)

    const workflows_added = url_params
      .getAll('workflows')
      .map((workflow_id) => parseInt(workflow_id))

    if (workflows_added.indexOf(this.props.workflowID) >= 0) {
      workflows_added.splice(workflows_added.indexOf(this.props.workflowID), 1)

      // @ts-ignore @todo why are we using parseInt ?
      url_params.set('workflows', workflows_added)
      if (history.pushState) {
        const newurl =
          window.location.protocol +
          '//' +
          window.location.host +
          window.location.pathname +
          '?' +
          url_params.toString()
        window.history.pushState({ path: newurl }, '', newurl)
      }
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    return (
      <div
        className="workflow-wrapper"
        id={'workflow-' + this.props.workflowID}
      >
        <div className="workflow-inner-wrapper" ref={this.mainDiv}></div>
        <div
          className="window-close-button"
          onClick={this.props.removeFunction}
        >
          <img
            src={
              COURSEFLOW_APP.globalContextData.path.static_assets.icon +
              'close.svg'
            }
          />
        </div>
      </div>
    )
  }
}

export default WorkflowComparisonRendererComponent
