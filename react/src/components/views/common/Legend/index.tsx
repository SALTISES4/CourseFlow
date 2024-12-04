import { viewsettingsUpdate } from '@cfRedux/slices/viewsettings.slice'
import { RootState } from '@cfRedux/store'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import React, { ReactElement, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const Legend = ({ children }: { children: ReactElement }) => {
  const showLegend = useSelector(
    (state: RootState) => state.viewsettings.legend
  )
  const dispatch = useDispatch()

  function toggleLegend() {
    const newShowLegend = !showLegend
    dispatch(viewsettingsUpdate({ legend: newShowLegend }))
  }

  /*******************************************************
   * RETURN
   *******************************************************/
  return (
    <>
      {showLegend && (
        <div // imported from legacy css
          style={{
            cursor: 'move',
            position: 'fixed',
            background: '#fff',
            zIndex: 5,
            padding: '20px',
            border: '2px solid #00a86b',
            left: 'calc(100% - 460px)',
            boxShadow: '0px 2px 2px 0px rgba(0, 0, 0, 0.3)'
          }}
        >
          {children}
          <div
            style={{
              right: '8px',
              top: '8px',
              position: 'absolute',
              cursor: 'pointer'
            }}
            onClick={toggleLegend}
          >
            <HighlightOffIcon />
          </div>
        </div>
      )}
    </>
  )
}

export default Legend
