import * as Constants from '@cf/constants'
import { CfObjectType } from '@cf/types/enum'
import ActionCreator from '@cfRedux/ActionCreator'
import { Dispatch } from '@reduxjs/toolkit'
import React from 'react'
import { Action } from 'redux'

export function toggleDropWrapper({
  objectId,
  objectType,
  isDropped,
  dispatch,
  depth
}: {
  objectId: number
  objectType: CfObjectType
  isDropped: boolean
  dispatch: Dispatch<Action>
  depth: number
}) {
  toggleDropReduxAction(objectId, objectType, !isDropped, dispatch, depth)
}

/**
 *
 *  @toggleDrop
 *
 *  Toggles whether an object is dropped. No longer sent to database.
 * @param objectId
 * @param objectType
 * @param isDropped
 * @param dispatch
 * @param depth
 */
export function toggleDropReduxAction(
  objectId: number,
  objectType: CfObjectType, //i thibnk this is CfObjectType
  newDropState: string | boolean,
  dispatch: Dispatch<Action>,
  depth = 1
) {
  try {
    const default_drop = Constants.getDefaultDropState(
      objectId,
      objectType,
      depth
    )
    if (newDropState !== default_drop)
      window.localStorage.setItem(objectType + objectId, String(newDropState))
    else window.localStorage.removeItem(objectType + objectId)
  } catch (err) {
    const error = err as Error
    if (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' // lol
    ) {
      window.localStorage.clear()
    }
  }

  console.log(objectId, objectType, { isDropped: newDropState })
  dispatch(
    ActionCreator.changeField(objectId, objectType, { isDropped: newDropState })
  )
}
