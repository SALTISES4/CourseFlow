// @ts-nocheck
import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import { UtilityLoaderClass } from '@cf/utility/UtilityLoader.class'
import { ProjectComparisonClass } from '@cfPages/Workspace/ProjectComparison'
import * as React from 'react'

type OwnProps = {
  workflowId: any
  selectionManager: any
  viewType: CfObjectType
  objectSets: any
  removeFunction: any
}

/**
 * Acts as a loader, fetching workflow data from the server then creating a
 * WorkflowBaseView for the comparison
 */
class WorkflowComparisonRendererComponent extends React.Component<OwnProps> {
  private workflowComparison: ProjectComparisonClass
  constructor(props: OwnProps) {
    super(props)
    this.mainDiv = React.createRef()
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    const loader = new UtilityLoaderClass('body')

    const querystring = window.location.search
    const urlParams = new URLSearchParams(querystring)
    const workflowsAdded = urlParams
      .getAll('workflows')
      .map((workflowId) => parseInt(workflowId))
    if (workflowsAdded.indexOf(this.props.workflowId) < 0) {
      urlParams.append('workflows', this.props.workflowId)

      // @todo
      if (history.pushState) {
        const newurl =
          window.location.protocol +
          '//' +
          window.location.host +
          window.location.pathname +
          '?' +
          urlParams.toString()
        window.history.pushState({ path: newurl }, '', newurl)
      }
    }

    // @todo
    // not sure, i think it's attempting to attach the parent as eaach row in the comparions
    // leave for now
    getWorkflowContextQuery(this.props.workflowId, (contextResponseData) => {
      const contextData = contextResponseData.dataPackage

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
        dataPackage: contextData.dataPackage
      })

      // @todo no...
      // this.workflowComparison.silent_connect_fail = true
      // this.workflowComparison.init()

      loader.endLoad()
    })
  }

  componentDidUpdate(prevProps: OwnProps) {
    if (prevProps.viewType != this.props.viewType) {
      // no this doesn't work any more
      //
      // @ts-ignore
      // @todo create a stable view of the workflow
      this.workflowComparison.render(this.props.viewType)
    }
  }

  componentWillUnmount() {
    const querystring = window.location.search
    const urlParams = new URLSearchParams(querystring)

    const workflowsAdded = urlParams
      .getAll('workflows')
      .map((workflowId) => parseInt(workflowId))

    if (workflowsAdded.indexOf(this.props.workflowId) >= 0) {
      workflowsAdded.splice(workflowsAdded.indexOf(this.props.workflowId), 1)

      // @ts-ignore @todo why are we using parseInt ?
      urlParams.set('workflows', workflowsAdded)
      if (history.pushState) {
        const newurl =
          window.location.protocol +
          '//' +
          window.location.host +
          window.location.pathname +
          '?' +
          urlParams.toString()
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
