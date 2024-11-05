import { createAction } from '@reduxjs/toolkit'

import { EditTabState } from './types'

export const SET_EDIT = createAction<EditTabState>('sidebar/set/edit')
