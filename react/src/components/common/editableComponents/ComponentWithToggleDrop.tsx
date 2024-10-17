import * as Constants from '@cf/constants'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import { toggleDropReduxAction } from '@cfRedux/utility/helpers'
import { Dispatch } from '@reduxjs/toolkit'
import * as React from 'react'
import { Action } from 'redux'

/**
 *  Extends the React component to add a few features
 *  that are used in a large number of components
 */

export type ComponentWithToggleProps = {
  objectId?: number
  dispatch?: Dispatch<Action>
  data?: {
    id?: number
    isDropped?: boolean
    depth?: number
    columnTypeDisplay?: string
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
      this.props.objectId,
      Constants.objectDictionary[this.objectType],
      // so previously every single movable component in the workflow 'extends' as class
      // one of these 'editable' components
      // the previous developer was taking the entity related info and just dumping it in 'data'
      // specifically in order to share this property
      // local state and DB state are mixed together without structure
      // current: individual compoents like 'node' 'week' have had entitiy data moved to a key in the connected props
      // i.e. week: TWeek
      // not sure where this leaves the legacy data property
      !this.props.data?.isDropped,
      this.props.dispatch,
      this.props.data.depth
    )
  }
}

export default ComponentWithToggleDrop
