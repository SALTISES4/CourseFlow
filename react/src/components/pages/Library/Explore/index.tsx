// @ts-nocheck
import * as React from 'react'
import {
  Discipline,
  ExploreViewContextDataDTO,
  InitialPages,
  InitialWorkflow
} from '@cfPages/Library/Explore/types'
import { getLibraryQuery } from '@XMLHTTP/APIFunctions'
import ExploreFilter from '@cfCommonComponents/workflow/filters/ExploreFilter'

/*******************************************************
 * @ExploreRenderer
 *******************************************************/
class ExplorePage extends React.Component<ExploreViewContextDataDTO> {
  private readonly disciplines: Discipline[]
  private readonly initial_pages: InitialPages
  private readonly initial_workflows: InitialWorkflow[]
  private createDiv: React.RefObject<HTMLDivElement>

  constructor(props: ExploreViewContextDataDTO) {
    super(props)
    this.disciplines = this.props.disciplines
    this.initial_workflows = this.props.initial_workflows
    this.initial_pages = this.props.initial_pages
    this.createDiv = React.createRef()
  }

  componentDidMount() {
    getLibraryQuery((data) => {
      this.setState({ project_data: data.data_package })
    })
    COURSEFLOW_APP.makeDropdown(this.createDiv.current)
    COURSEFLOW_APP.makeDropdown(this.createDiv.current)
  }

  render() {
    return (
      <div className="project-menu">
        <ExploreFilter
          disciplines={this.disciplines}
          workflows={this.initial_workflows}
          pages={this.initial_pages}
          context="library"
        />
      </div>
    )
  }
}

export default ExplorePage
