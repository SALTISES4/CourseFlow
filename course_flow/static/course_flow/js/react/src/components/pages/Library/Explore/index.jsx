import * as React from 'react'
import { TinyLoader } from '@cfRedux/helpers'
import Library from '@cfModule/components/pages/Library/Library'
import { ExploreMenu } from '@cfCommonComponents/menu/menus'

/*******************************************************
 * @ExploreRenderer
 *  disciplines: any
 *  initial_workflows: any[]
 *  initial_pages: any
 *******************************************************/
class ExploreRenderer extends Library {
  constructor(props) {
    super(props)
    this.disciplines = this.props.disciplines
    this.initial_workflows = this.props.initial_workflows
    this.initial_pages = this.props.initial_pages
    this.tiny_loader = new TinyLoader($('body')[0])
  }

  getContents() {
    return <ExploreMenu disciplines={this.disciplines} renderer={this} />
  }
}

export default ExploreRenderer
