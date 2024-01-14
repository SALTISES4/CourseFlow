import * as React from 'react'
import * as Constants from '@cfConstants'
import { toggleDropReduxAction } from '@cfRedux/helpers'
import { Dispatch } from '@reduxjs/toolkit'
import { Action } from 'redux'
/**
 *  Extends the React component to add a few features
 *  that are used in a large number of components
 */

export type ComponentWithToggleProps = {
  objectID?: number
  dispatch?: Dispatch<Action>
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

  constructor(props: P) {
    super(props)

    this.mainDiv = React.createRef()
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
