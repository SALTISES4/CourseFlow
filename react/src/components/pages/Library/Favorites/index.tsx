import * as React from 'react'
import WorkflowFilter from '@cfCommonComponents/workflow/filters/WorkflowFilter'
import { getFavouritesQuery } from '@XMLHTTP/API/pages'

type StateType = {
  project_data: any
}

/*******************************************************
 * @FavouritesRenderer
 *******************************************************/
class Favourites extends React.Component<JSX.IntrinsicAttributes, StateType> {
  private createDiv: React.RefObject<HTMLDivElement>
  constructor(props: JSX.IntrinsicAttributes) {
    super(props)
    this.state = {} as StateType
    // this.read_only = this.props.renderer.read_only
    this.createDiv = React.createRef()
  }

  /*******************************************************
   * Lifecycle hooks
   *******************************************************/
  componentDidMount() {
    getFavouritesQuery((data) => {
      this.setState({
        project_data: data.data_package
      })
    })

    COURSEFLOW_APP.makeDropdown(this.createDiv.current)
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    console.log('this.state.project_data')
    console.log(this.state.project_data)
    return (
      <div className="project-menu">
        <WorkflowFilter
          // renderer={this.props.renderer}
          workflows={this.state.project_data}
          context="library"
          // updateWorkflow={this.props.renderer.updateWorkflow}
          // read_only={this.props.renderer.read_only}
          // project_data={this.props.renderer.project_data}
        />
      </div>
    )
  }
}

export default Favourites
