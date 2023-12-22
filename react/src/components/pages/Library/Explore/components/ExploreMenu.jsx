import * as React from 'react'
import ExploreFilter from '@cfCommonComponents/workflow/ExploreFilter/index.jsx'
import { getLibraryQuery } from '@XMLHTTP/PostFunctions.js'

// from renderer:
//   initial_pages
//   tiny loader

// @todo fix consitent props drilling
// this.props.disciplines
//  this.props.renderer.initial_workflows
// etc
class ExploreMenu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.read_only = this.props.renderer.read_only
    this.renderer = this.props.renderer
    this.createDiv = React.createRef()
  }

  componentDidMount() {
    getLibraryQuery((data) => {
      this.setState({ project_data: data.data_package })
    })
    COURSEFLOW_APP.makeDropdown(this.createDiv.current)
  }

  render() {
    return (
      <div className="project-menu">
        <ExploreFilter
          // @todo from renderer:
          // initial_pages
          disciplines={this.props.disciplines}
          renderer={this.props.renderer}
          workflows={this.props.renderer.initial_workflows}
          pages={this.props.renderer.initial_pages}
          context="library"
        />
      </div>
    )
  }
}

export default ExploreMenu
