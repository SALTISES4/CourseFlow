import { _t } from '@cf/utility/Utility.class'
import LegendLine from '@cfComponents/UIPrimitives/LegendLine'
import { AppState } from '@cfRedux/types/type'
import Legend from '@cfViews/common/Legend'
import { useSelector } from 'react-redux'

const OutcomeLegend = () => {
  const outcomesType = useSelector(
    (state: AppState) => state.workflow.outcomesType
  )

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const LegendContent = () => {
    return (
      <>
        <div>
          <hr />
          <h5>Outcomes:</h5>
          <LegendLine icon="solid_check" text="Complete" />
          <LegendLine icon="check" text="Completed (Auto-Calculated)" />
          <LegendLine icon="nocheck" text="Partially Complete" />
        </div>
        {outcomesType === 1 && (
          <>
            <hr />
            <h5>Advanced Outcomes:</h5>
            <LegendLine
              div="I"
              divClass="outcome-introduced self-completed"
              text="Introduced"
            />
            <LegendLine
              div="D"
              divClass="outcome-developed self-completed"
              text="Developed"
            />
            <LegendLine
              div="A"
              divClass="outcome-advanced self-completed"
              text="Advanced"
            />
            <LegendLine
              div="I"
              divClass="outcome-introduced"
              text="Introduced (Auto-Calculated)"
            />
            <LegendLine
              div="D"
              divClass="outcome-developed"
              text="Developed (Auto-Calculated)"
            />
            <LegendLine
              div="A"
              divClass="outcome-advanced"
              text="Advanced (Auto-Calculated)"
            />
          </>
        )}
      </>
    )
  }

  /*******************************************************
   * RETURN
   *******************************************************/
  return (
    <div>
      <Legend>
        <LegendContent />
      </Legend>
    </div>
  )
}

export default OutcomeLegend

// import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
// import { apiPaths } from '@cf/router/apiRoutes'
// import { _t } from '@cf/utility/Utility.class'
// import LegendLine from '@cfComponents/UIPrimitives/LegendLine'
// import Slider from '@cfComponents/UIPrimitives/Slider'
// import { AppState } from '@cfRedux/types/type'
// import React, { useContext, useEffect, useState } from 'react'
// import { useSelector } from 'react-redux'
//
// const OutcomeLegend: React.FC = () => {
//   const workFlowConfigContext = useContext(WorkflowConfigContext)
//
//   const [showLegend, setShowLegend] = useState<boolean>(() => {
//     return !!JSON.parse(localStorage.getItem('show_legend'))
//   })
//
//   const [showSlider, setShowSlider] = useState<boolean>(false)
//
//   const outcomesType = useSelector(
//     (state: AppState) => state.workflow.outcomesType
//   )
//
//   useEffect(() => {
//     // ComponentDidMount logic
//     setShowSlider(true)
//   }, [])
//
//   const toggle = () => {
//     localStorage.setItem('show_legend', String(!showLegend))
//     setShowLegend((prev) => !prev)
//   }
//
//   const getSlider = () => {
//     if (showSlider) {
//       return (
//         <>
//           <div>{_t('Legend')}</div>
//           <Slider checked={showLegend} toggleAction={toggle} />
//         </>
//       )
//     }
//     return null
//   }
//
//   if (!showLegend) {
//     return null
//   }
//
//   return (
//     <div className="workflow-legend">
//       <h4>Legend</h4>
//       {getSlider()}
//       <div className="legend-section">
//         <hr />
//         <h5>Outcomes:</h5>
//         <LegendLine icon="solid_check" text="Complete" />
//         <LegendLine icon="check" text="Completed (Auto-Calculated)" />
//         <LegendLine icon="nocheck" text="Partially Complete" />
//       </div>
//       {outcomesType === 1 && (
//         <div className="legend-section">
//           <hr />
//           <h5>Advanced Outcomes:</h5>
//           <LegendLine
//             div="I"
//             divclass="outcome-introduced self-completed"
//             text="Introduced"
//           />
//           <LegendLine
//             div="D"
//             divclass="outcome-developed self-completed"
//             text="Developed"
//           />
//           <LegendLine
//             div="A"
//             divclass="outcome-advanced self-completed"
//             text="Advanced"
//           />
//           <LegendLine
//             div="I"
//             divclass="outcome-introduced"
//             text="Introduced (Auto-Calculated)"
//           />
//           <LegendLine
//             div="D"
//             divclass="outcome-developed"
//             text="Developed (Auto-Calculated)"
//           />
//           <LegendLine
//             div="A"
//             divclass="outcome-advanced"
//             text="Advanced (Auto-Calculated)"
//           />
//         </div>
//       )}
//       <div className="window-close-button" onClick={toggle}>
//         <img
//           src={`${apiPaths.external.static_assets.icon}close.svg`}
//           alt="Close"
//         />
//       </div>
//     </div>
//   )
// }
//
// export default OutcomeLegend
