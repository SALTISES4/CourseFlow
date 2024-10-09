// @ts-nocheck
import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import { UtilityLoader } from '@cf/utility/UtilityLoader'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfEditableComponents/ComponentWithToggleDrop'
import { ProjectComparisonClass } from '@cfPages/Workspace/ProjectComparison'
import * as React from 'react'

type OwnProps = {
  workflowId: any
  selectionManager: any
  viewType: CfObjectType
  objectSets: any
  removeFunction: any
} & ComponentWithToggleProps

/**
 * Acts as a loader, fetching workflow data from the server then creating a
 * WorkflowBaseView for the comparison
 */
class WorkflowComparisonRendererComponent extends ComponentWithToggleDrop<OwnProps> {
  private workflowComparison: ProjectComparisonClass
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
      .map((workflowId) => parseInt(workflowId))
    if (workflows_added.indexOf(this.props.workflowId) < 0) {
      url_params.append('workflows', this.props.workflowId)

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
    getWorkflowContextQuery(this.props.workflowId, (context_responseData) => {
      const context_data = context_responseData.dataPackage

      // @todo this will need to be unpacked, type unified with parent and called into parent
      // is there a reason #workflow-inner-wrapper is a real dom element?
      // this needs to be imported directly but that would cause   Circ D.
      this.workflowComparison = new ProjectComparisonClass({
        workflowId: this.props.workflowId,
        selectionManager: this.props.selectionManager,
        // container: '#workflow-inner-wrapper',
        // @ts-ignore
        container: $(this.mainDiv.current),
        viewType: this.props.viewType,
        initialObjectSets: this.props.objectSets,
        dataPackage: context_data.dataPackage
      })

      // @todo no...
      // this.workflowComparison.silent_connect_fail = true
      // this.workflowComparison.init()

      loader.endLoad()
    })
  }

  componentDidUpdate(prevProps: OwnProps) {
    if (prevProps.viewType != this.props.viewType)
      // no this doesn't work any more
      //
      // @ts-ignore
      // @todo create a stable view of the workflow
      this.workflowComparison.render(this.props.viewType)
  }

  componentWillUnmount() {
    const querystring = window.location.search
    const url_params = new URLSearchParams(querystring)

    const workflows_added = url_params
      .getAll('workflows')
      .map((workflowId) => parseInt(workflowId))

    if (workflows_added.indexOf(this.props.workflowId) >= 0) {
      workflows_added.splice(workflows_added.indexOf(this.props.workflowId), 1)

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
        id={'workflow-' + this.props.workflowId}
      >
        <div className="workflow-inner-wrapper" ref={this.mainDiv}></div>
        <div
          className="window-close-button"
          onClick={this.props.removeFunction}
        >
          <img src={apiPaths.external.static_assets.icon + 'close.svg'} />
        </div>
      </div>
    )
  }
}

export default WorkflowComparisonRendererComponent
