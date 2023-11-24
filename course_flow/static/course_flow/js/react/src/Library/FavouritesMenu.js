import * as React from 'react'
import { getFavourites } from '../PostFunctions.js'
import WorkflowFilter from './WorkFlowFilter.js'
import LibraryMenu from './LibraryMenu.js'

class FavouritesMenu extends LibraryMenu {
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

  componentDidMount() {
    let component = this
    getFavourites((data) => {
      component.setState({ project_data: data.data_package })
    })
    makeDropdown(this.createDiv.current)
  }
}

export default FavouritesMenu
