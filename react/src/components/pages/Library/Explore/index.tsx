import * as React from 'react'
import { ExploreViewContextDataDTO } from '@cfPages/Library/Explore/types'
import ExploreFilter from '@cfCommonComponents/workflow/filters/ExploreFilter'
import { getLibraryQuery } from '@XMLHTTP/API/pages'

/*******************************************************
 * @ExploreRenderer
 *******************************************************/
class ExplorePage extends React.Component<ExploreViewContextDataDTO> {
  private createDiv: React.RefObject<HTMLDivElement>
  constructor(props: ExploreViewContextDataDTO) {
    super(props)
    this.createDiv = React.createRef()
  }

  componentDidMount() {
    getLibraryQuery((data) => {
      this.setState({
        project_data: data.data_package
      })
    })
    COURSEFLOW_APP.makeDropdown(this.createDiv.current)
    // COURSEFLOW_APP.makeDropdown(this.createDiv.current) // @todo double check in git hitstory these were both correct
  }

  render() {
    return (
      <div className="project-menu">
        <ExploreFilter
          disciplines={this.props.disciplines}
          workflows={this.props.initial_workflows}
          pages={this.props.initial_pages}
          context="library"
        />
      </div>
    )
  }
}

export default ExplorePage
