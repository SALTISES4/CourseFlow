import { CfObjectType } from '@cfModule/types/enum'
import ActionCreator from '@cfRedux/ActionCreator'
import { Action } from 'redux'
import { Dispatch } from '@reduxjs/toolkit'
import React from 'react'
import * as Constants from '@cfModule/constants'

/**
 *
 *  @toggleDrop
 *
 *  Toggles whether an object is dropped. No longer sent to database.
 * @param objectID
 * @param objectType
 * @param is_dropped
 * @param dispatch
 * @param depth
 */
export function toggleDropReduxAction(
  objectID: number,
  objectType: CfObjectType, //i thibnk this is CfObjectType
  is_dropped: string | boolean,
  dispatch: Dispatch<Action>,
  depth = 1
) {
  try {
    const default_drop = Constants.get_default_drop_state(
      objectID,
      objectType,
      depth
    )
    if (is_dropped !== default_drop)
      window.localStorage.setItem(objectType + objectID, String(is_dropped))
    else window.localStorage.removeItem(objectType + objectID)
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
    ActionCreator.changeField(objectID, objectType, { is_dropped: is_dropped })
  )
}
