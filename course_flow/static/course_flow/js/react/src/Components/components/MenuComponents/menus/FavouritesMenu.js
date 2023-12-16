import * as React from 'react'
import { getFavourites } from '@XMLHTTP/PostFunctions'
import WorkflowFilter from './WorkFlowFilter.js'
import LibraryMenu from './LibraryMenu.js'

class FavouritesMenu extends LibraryMenu {
  /*******************************************************
   * Lifecycle hooks
   *******************************************************/
  componentDidMount() {
    let component = this
    getFavourites((data) => {
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
