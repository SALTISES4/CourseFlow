import * as Constants from '@cf/constants'
import { CfObjectType } from '@cf/types/enum'
import ActionCreator from '@cfRedux/ActionCreator'
import { Dispatch } from '@reduxjs/toolkit'
import React from 'react'
import { Action } from 'redux'

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
  isDropped: string | boolean,
  dispatch: Dispatch<Action>,
  depth = 1
) {
  try {
    const default_drop = Constants.getDefaultDropState(
      objectId,
      objectType,
      depth
    )
    if (isDropped !== default_drop)
      window.localStorage.setItem(objectType + objectId, String(isDropped))
    else window.localStorage.removeItem(objectType + objectId)
  } catch (err) {
    const error = err as Error
    if (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    ) {
      window.localStorage.clear()
    }
  }
  dispatch(
    ActionCreator.changeField(objectId, objectType, { isDropped: isDropped })
  )
}
