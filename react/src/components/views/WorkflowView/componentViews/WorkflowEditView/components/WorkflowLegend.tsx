import * as Constants from '@cf/constants'
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { apiPaths } from '@cf/router/apiRoutes'
import { _t } from '@cf/utility/utilityFunctions'
import LegendLine from '@cfComponents/UIPrimitives/LegendLine'
import Slider from '@cfComponents/UIPrimitives/Slider'
import { AppState, TNode, TWeek } from '@cfRedux/types/type'
import * as React from 'react'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

const choices = COURSEFLOW_APP.globalContextData.workflowChoices

/*******************************************************
 * first pass on FV conversion is done
 *******************************************************/
const WorkflowLegend = () => {
  const workFlowConfigContext = React.useContext(WorkFlowConfigContext)

  const [showLegend, setShowLegend] = useState<boolean>(() => {
    return JSON.parse(localStorage.getItem('show_legend'))
  })

  const [showSlider, setShowSlider] = useState<boolean>(false)

  // this was draggable
  useEffect(() => {
    // $('.workflow-legend').draggable();
    setShowSlider(true)
  }, [])

  // this was draggable
  const toggle = () => {
    localStorage.setItem('show_legend', String(!showLegend))
    setShowLegend((prev) => !prev)
  }

  // Redux state selections
  const stateNodes = useSelector<AppState, TNode[]>(
    (state: AppState) => state.node
  )
  const stateWeeks = useSelector<AppState, TWeek[]>(
    (state: AppState) => state.week
  )

  const contexts = stateNodes
    .map((node) => parseInt(node.contextClassification.toString(), 10))
    .filter((value, index, self) => self.indexOf(value) === index)
    .filter((value) => value > 0)

  const tasks = stateNodes
    .map((node) => parseInt(node.taskClassification.toString(), 10))
    .filter((value, index, self) => self.indexOf(value) === index)
    .filter((value) => value > 0)

  const strategies = stateWeeks
    .map((week) => parseInt(week.strategyClassification.toString(), 10))
    .filter((value, index, self) => self.indexOf(value) === index)
    .filter((value) => value > 0)

  const getSlider = () => {
    if (showSlider) {
      return (
        <>
          <div>{_t('Legend')}</div>
          <Slider checked={showLegend} toggleAction={toggle} />
        </>
      )
    }
    return null
  }

  const renderedContexts = contexts.map((value, index) => (
    <LegendLine
      key={index}
      icon={Constants.contextKeys[value]}
      text={choices.contextChoices.find((obj) => obj.type === value)?.name}
    />
  ))

  const renderedTasks = tasks.map((value, index) => (
    <LegendLine
      key={index}
      icon={Constants.taskKeys[value]}
      text={choices.taskChoices.find((obj) => obj.type === value)?.name}
    />
  ))

  const renderedStrategies = strategies.map((value, index) => (
    <LegendLine
      key={index}
      icon={Constants.strategyKeys[value]}
      text={
        choices.strategyClassificationChoices.find((obj) => obj.type === value)
          ?.name
      }
    />
  ))

  const renderLegend = () => {
    if (showLegend === false) {
      return null
    }
    return (
      <div className="workflow-legend">
        <h4>Legend</h4>

        {!!renderedContexts.length && (
          <div className="legend-section">
            <hr />
            <h5>Contexts:</h5>
            {renderedContexts}
          </div>
        )}

        {!!renderedTasks.length && (
          <div className="legend-section">
            <hr />
            <h5>Tasks:</h5>
            {renderedTasks}
          </div>
        )}

        {!!renderedStrategies.length && (
          <div className="legend-section">
            <hr />
            <h5>Strategies:</h5>
            {renderedStrategies}
          </div>
        )}

        <div className="window-close-button" onClick={toggle}>
          <img
            src={`${apiPaths.external.static_assets.icon}close.svg`}
            alt="Close"
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      {getSlider()} {renderLegend()}
    </div>
  )
}

export default WorkflowLegend
