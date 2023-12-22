import * as React from 'react'
import LibraryMenu from '@cfModule/components/pages/Library/Library/components/LibraryMenu'

/*******************************************************
 * @LibraryRenderer
 *******************************************************/
class LibraryPage extends React.Component {
  constructor(props) {
    super(props)
    console.log('props')
    console.log(props)
  }

  render() {
    this.container = container
    return <LibraryMenu renderer={this} />
  }
}

export default LibraryPage
