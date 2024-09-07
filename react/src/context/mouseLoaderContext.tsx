import { MouseCursorLoader } from '@cf/utility/mouseCursorLoader'
import * as React from 'react'
// import $ from 'jquery';

interface TinyLoaderContextType {
  tinyLoader: MouseCursorLoader
  // You can add additional properties if needed
}

const TinyLoaderContext = React.createContext<TinyLoaderContextType | null>(
  null
)

type PropsType = {
  children?: React.ReactNode
}

export class TinyLoaderProvider extends React.Component<PropsType> {
  private tinyLoader: MouseCursorLoader

  constructor(props: PropsType) {
    super(props)
    this.tinyLoader = new MouseCursorLoader(document.body)
  }

  render() {
    return (
      <TinyLoaderContext.Provider value={{ tinyLoader: this.tinyLoader }}>
        {this.props.children}
      </TinyLoaderContext.Provider>
    )
  }
}
