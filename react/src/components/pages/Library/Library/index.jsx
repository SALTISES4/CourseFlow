import * as React from 'react'
import LibraryMenu from '@cfModule/components/pages/Library/Library/components/LibraryMenu'

/*******************************************************
 * @LibraryRenderer
 *******************************************************/
class LibraryPage extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    // this.container = container // @todo this.container does not appear to be used
    return <LibraryMenu renderer={this} />
  }
}

export default LibraryPage
