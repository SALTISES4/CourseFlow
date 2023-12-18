import * as React from 'react'
import LibraryRenderer from '@cfModule/Components/Pages/Library/Library'
import { FavouritesMenu } from '@cfComponents/MenuComponents/menus'

/*******************************************************
 * @FavouritesRenderer
 *******************************************************/
class FavouritesRenderer extends LibraryRenderer {
  getContents() {
    return <FavouritesMenu renderer={this} />
  }
}

export default FavouritesRenderer
