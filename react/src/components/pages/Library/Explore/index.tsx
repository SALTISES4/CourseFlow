import * as React from 'react'
import {
  Discipline,
  ExploreViewContextDataDTO,
  InitialPages,
  InitialWorkflow
} from '@cfPages/Library/Explore/types'
import ExploreMenu from '@cfPages/Library/Explore/components/ExploreMenu'

/*******************************************************
 * @ExploreRenderer
 *******************************************************/
class ExploreRenderer extends React.Component {
  private disciplines: Discipline[]
  private initial_pages: InitialPages
  private initial_workflows: InitialWorkflow[]

  constructor(props: ExploreViewContextDataDTO) {
    super(props)
    this.disciplines = props.disciplines
    this.initial_workflows = props.initial_workflows
    this.initial_pages = props.initial_pages
  }

  render() {
    return <ExploreMenu disciplines={this.disciplines} renderer={this} />
  }
}

export default ExploreRenderer
