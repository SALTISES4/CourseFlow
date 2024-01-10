// @ts-nocheck
import * as React from 'react'
import { getFavouritesQuery } from '@XMLHTTP/PostFunctions.js'
import WorkflowFilter from '@cfCommonComponents/workflow/filters/WorkflowFilter/index.js'

/*******************************************************
 * @FavouritesRenderer
 *******************************************************/
class FavouritesPage extends React.Component {
  private createDiv: React.RefObject<HTMLDivElement>
  constructor(props) {
    super(props)
    this.state = {}
    // this.read_only = this.props.renderer.read_only
    this.createDiv = React.createRef()
  }

  /*******************************************************
   * Lifecycle hooks
   *******************************************************/
  componentDidMount() {
    getFavouritesQuery((data) => {
      console.log('data')
      console.log(data)
      this.setState({ project_data: data.data_package })
    })
    COURSEFLOW_APP.makeDropdown(this.createDiv.current)
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    return (
      <div className="project-menu">
        <WorkflowFilter
          renderer={this.props.renderer}
          workflows={this.state.project_data}
          context="library"
        />
      </div>
    )
  }
}

export default FavouritesPage
