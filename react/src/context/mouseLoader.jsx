import * as React from 'react'
import { MouseCursorLoader } from '@cfModule/utility/mouseCursorLoader.js'

const TinyLoaderContext = React.createContext()

export class TinyLoaderProvider extends React.Component {
  constructor(props) {
    super(props)
    this.tinyLoader = new MouseCursorLoader($('body')[0])
  }

  render() {
    return (
      <TinyLoaderContext.Provider value={this.tinyLoader}>
        {this.props.children}
      </TinyLoaderContext.Provider>
    )
  }
}
