import * as React from 'react'
import { getFavouritesQuery } from '@XMLHTTP/PostFunctions'
import WorkflowFilter from '@cfCommonComponents/workflow/WorkflowFilter'

class FavouritesMenu extends React.Component {
  // @todo review constructor
  constructor(props) {
    super(props)
    this.state = {}
    this.read_only = this.props.renderer.read_only
    this.renderer = this.props.renderer
    this.createDiv = React.createRef()
  }

  /*******************************************************
   * LIFECYCLE HOOKS
   *******************************************************/
  componentDidMount() {
    let component = this
    getFavouritesQuery((data) => {
      component.setState({ project_data: data.data_package })
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

export default FavouritesMenu
