import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { WorkflowFilter } from './WorkFlowFilter.js'

export default function LibraryMenu(props) {
  const [projectData, setProjectData] = useState({})
  const createDiv = useRef(null)

  useEffect(() => {
    getLibrary((data) => {
      setProjectData(data.data_package)
    })
    makeDropdown(createDiv.current)
  }, []) // Empty dependency array to mimic componentDidMount

  const getCreate = () => {
    if (!props.renderer.read_only) {
      return (
        <div
          className="hover-shade"
          id="create-project-button"
          title={gettext('Create project or strategy')}
          ref={createDiv}
        >
          <span className="material-symbols-rounded filled green">
            add_circle
          </span>
          <div id="create-links-project" className="create-dropdown">
            {/* Links here */}
          </div>
        </div>
      )
    }
    return null
  }

  const getOverflowLinks = () => {
    return (
      <a id="import-old" className="hover-shade" href={config.get_paths.import}>
        {gettext('Import from old CourseFlow')}
      </a>
    )
  }

  return (
    <div className="project-menu">
      {ReactDOM.createPortal(
        getCreate(),
        document.getElementById('visible-icons')
      )}
      {ReactDOM.createPortal(
        getOverflowLinks(),
        document.getElementById('overflow-links')
      )}
      <WorkflowFilter
        renderer={props.renderer}
        workflows={projectData}
        context="library"
      />
    </div>
  )
}
