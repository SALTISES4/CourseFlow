import * as React from 'react'
import Library from '@cfModule/components/pages/Library/Library'
import { ExploreMenu } from '@cfCommonComponents/menu/menus'
import {
  Discipline,
  ExploreViewContextDataDTO,
  InitialPages,
  InitialWorkflow
} from '@cfPages/Library/Explore/types'

/*******************************************************
 * @ExploreRenderer
 *******************************************************/
class ExploreRenderer extends Library {
  private disciplines: Discipline[]
  private initial_pages: InitialPages
  private initial_workflows: InitialWorkflow[]

  constructor(props: ExploreViewContextDataDTO) {
    super(props)
    this.disciplines = props.disciplines
    this.initial_workflows = props.initial_workflows
    this.initial_pages = props.initial_pages
  }

  getContents() {
    return <ExploreMenu disciplines={this.disciplines} renderer={this} />
  }
}

export default ExploreRenderer
