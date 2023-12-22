import * as React from 'react'
import { TinyLoader } from '@cfModule/utility/TinyLoader.js'

const TinyLoaderContext = React.createContext()

export class TinyLoaderProvider extends React.Component {
  constructor(props) {
    super(props)
    this.tinyLoader = new TinyLoader($('body')[0])
  }

  render() {
    return (
      <TinyLoaderContext.Provider value={this.tinyLoader}>
        {this.props.children}
      </TinyLoaderContext.Provider>
    )
  }
}
