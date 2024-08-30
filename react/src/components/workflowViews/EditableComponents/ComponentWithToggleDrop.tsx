import * as React from 'react'
import * as Constants from '@cfConstants'
import { Dispatch } from '@reduxjs/toolkit'
import { Action } from 'redux'
import { CfObjectType } from '@cfModule/types/enum'
import { toggleDropReduxAction } from '@cfRedux/utility/helpers'
import { _t } from '@cf/utility/utilityFunctions'

/**
 *  Extends the React component to add a few features
 *  that are used in a large number of components
 */

export type ComponentWithToggleProps = {
  objectID?: number
  dispatch?: Dispatch<Action>
  data?: {
    id?: number
    is_dropped?: boolean
    depth?: number
    column_type_display?: string
    title?: any
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
  objectType: CfObjectType
  protected objectClass: string

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
