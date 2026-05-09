import {
  viewsettingsToggle,
  viewsettingsUpdate
} from '@cf/features/viewSettings/state/viewsettings.slice'
import { AppDispatch, RootState } from '@cfRedux/store'
import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'

// Create the listener middleware instance
export const listenerMiddleware = createListenerMiddleware()

// Create a typed version of startListening for convenience
export const startAppListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>()

// Define a listener that runs whenever viewSettings is updated or toggled
startAppListening({
  matcher: isAnyOf(viewsettingsUpdate, viewsettingsToggle),
  effect: (action, listenerApi) => {
    const state = listenerApi.getState().viewsettings
    localStorage.setItem('viewSettings', JSON.stringify(state))
  }
})
