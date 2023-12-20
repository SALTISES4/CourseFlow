import * as React from 'react'
import LibraryRenderer from '@cfModule/components/pages/Library/Library'
import { FavouritesMenu } from '@cfCommonComponents/menu/menus'

/*******************************************************
 * @FavouritesRenderer
 *******************************************************/
class Favourites extends LibraryRenderer {
  getContents() {
    return <FavouritesMenu renderer={this} />
  }
}

export default Favourites