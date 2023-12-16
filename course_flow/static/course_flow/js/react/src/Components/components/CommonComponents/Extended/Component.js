import * as React from 'react'
import * as Constants from '@cfConstants'
import { toggleDrop } from '@XMLHTTP/PostFunctions.js'
/**
 *  Extends the react component to add a few features
 *  that are used in a large number of components
 */

/**
 *
 */
class Component extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.maindiv = React.createRef()
  }

  toggleDrop(evt) {
    evt.stopPropagation()
    toggleDrop(
      this.props.objectID,
      Constants.object_dictionary[this.objectType],
      !this.props.data.is_dropped,
      this.props.dispatch,
      this.props.data.depth
    )
  }
}

export default Component
