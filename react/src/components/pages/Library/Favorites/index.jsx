import * as React from 'react'
import FavouritesMenu from '@cfPages/Library/Favorites/components/FavouritesMenu'

/*******************************************************
 * @FavouritesRenderer
 *******************************************************/
class FavouritesPage extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return <FavouritesMenu renderer={this} />
  }
}

export default FavouritesPage
