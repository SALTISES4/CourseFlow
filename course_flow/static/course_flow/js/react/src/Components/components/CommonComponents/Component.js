//Extends the react component to add a few features that are used in a large number of components
import * as React from 'react'
import * as Constants from '../../../Constants.js'

class Component extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.maindiv = React.createRef()
  }

  // @todo inheritance not approporiate here, create a hook
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
