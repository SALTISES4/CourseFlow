import BinarySlider from '@cfComponents/UIPrimitives/Slider'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import React, { ReactElement, useState } from 'react'

const Legend = ({ children }: { children: ReactElement }) => {
  const key = 'show_legend'

  const [showLegend, setShowLegend] = useState<boolean>(() => {
    return JSON.parse(localStorage.getItem('show_legend') || 'false')
  })

  function toggleLegend() {
    const newShowLegend = !showLegend
    localStorage.setItem(key, JSON.stringify(newShowLegend))
    setShowLegend(newShowLegend)
  }

  /*******************************************************
   * RETURN
   *******************************************************/
  return (
    <>
      <h4>Legend</h4>
      <BinarySlider handleChange={toggleLegend} value={showLegend} />
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
