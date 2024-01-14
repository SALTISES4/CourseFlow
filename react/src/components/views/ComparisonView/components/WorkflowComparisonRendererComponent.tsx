import * as React from 'react'
import * as Utility from '@cfModule/utility/utilityFunctions'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfModule/components/common/extended/ComponentWithToggleDrop'
import { getWorkflowContext } from '@XMLHTTP/API/workflow'

type OwnProps = {
  workflowID: any
  selection_manager: any
  tiny_loader: any
  view_type: any
  object_sets: any
  removeFunction: any
} & ComponentWithToggleProps

/**
 * Acts as a loader, fetching workflow data from the server then creating a
 * WorkflowBaseView for the comparison
 */
class WorkflowComparisonRendererComponent extends ComponentWithToggleDrop<OwnProps> {
  private renderer: any;
  constructor(props: OwnProps) {
    super(props)
    this.mainDiv = React.createRef()
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    const loader = new Utility.Loader('body')

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

    getWorkflowContext(this.props.workflowID, (context_response_data) => {
      const context_data = context_response_data.data_package

      // @todo this will need to be unpacked, type unified with parent and called into parent
      // is there a reason #workflow-inner-wrapper is a real dom element?
      // this needs to be imported directly but that would cuase Circ D.
      // @todo lost global'renderers'
      // @ts-ignore
      this.renderer = new renderers.WorkflowComparisonRenderer(
        this.props.workflowID,
        JSON.parse(context_data.data_package),
        '#workflow-inner-wrapper',
        this.props.selection_manager,
        this.props.tiny_loader,
        this.props.view_type,
        this.props.object_sets
      )

      this.renderer.silent_connect_fail = true
      this.renderer.connect()

      loader.endLoad()
    })
  }

  componentDidUpdate(prev_props) {
    if (prev_props.view_type != this.props.view_type)
      this.renderer.render(this.props.view_type)
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
        <div id="workflow-inner-wrapper" ref={this.mainDiv}></div>
        <div
          className="window-close-button"
          onClick={this.props.removeFunction}
        >
          <img src={COURSEFLOW_APP.config.icon_path + 'close.svg'} />
        </div>
      </div>
    )
  }
}

export default WorkflowComparisonRendererComponent
