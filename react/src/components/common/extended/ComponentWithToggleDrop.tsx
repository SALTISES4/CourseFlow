import * as React from 'react'
import * as Constants from '@cfConstants'
import {toggleDropReduxAction} from "@cfRedux/helpers";
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
  mainDiv: React.RefObject<HTMLDivElement>
  maindiv: React.RefObject<HTMLDivElement> // @todo reconcile the two var spellings

  constructor(props: P) {
    super(props)

    this.mainDiv = React.createRef()
    this.maindiv = React.createRef() // @todo we recreated this since all the components which inherit from ComponentWithToggleDrop currently break, unify it / just spelling issue
    this.state = {} as S
  }

  toggleDrop = (evt: React.MouseEvent) => {
    evt.stopPropagation()
    toggleDropReduxAction(
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
