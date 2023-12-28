import * as React from 'react'
import * as Constants from '@cfConstants'
import { toggleDrop } from '@XMLHTTP/PostFunctions'
/**
 *  Extends the react component to add a few features
 *  that are used in a large number of components
 */

/**
 *
 */

export type ComponentWithToggleProps = {
  objectID?: number
  dispatch?: () => void
  data?: {
    is_dropped: boolean
    depth: number
  }
}

/**
 *
 */
class ComponentWithToggleDrop<
  P extends ComponentWithToggleProps,
  S = NonNullable<unknown>
> extends React.Component<P, S> {
  protected mainDiv: React.RefObject<HTMLDivElement>

  constructor(props: P) {
    super(props)

    this.mainDiv = React.createRef()
  }

  toggleDrop = (evt: React.MouseEvent) => {
    evt.stopPropagation()
    toggleDrop(
      this.props.objectID,
      // @ts-ignore
      Constants.object_dictionary[this.objectType],
      !this.props.data.is_dropped,
      this.props.dispatch,
      this.props.data.depth
    )
  }
}

export default ComponentWithToggleDrop
