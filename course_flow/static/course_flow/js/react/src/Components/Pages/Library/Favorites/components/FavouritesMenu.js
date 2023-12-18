import * as React from 'react'
import { getFavourites } from '@XMLHTTP/PostFunctions.js'
import WorkflowFilter from '@cfComponents/Workflow/WorkflowFilter'
import LibraryMenu from '../../Library/components/LibraryMenu.js'

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
