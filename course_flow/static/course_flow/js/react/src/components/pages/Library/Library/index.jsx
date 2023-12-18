import * as React from 'react'
import { TinyLoader } from '@cfRedux/helpers'
import LibraryMenu from '@cfModule/components/pages/Library/Library/components/LibraryMenu.js'

/*******************************************************
 * @LibraryRenderer
 *******************************************************/
class LibraryRenderer extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    this.container = container
    this.tiny_loader = new TinyLoader($('body')[0])
    return this.getContents()
  }

  getContents() {
    return <LibraryMenu renderer={this} />
  }
}

export default LibraryRenderer
