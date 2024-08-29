import * as React from 'react'
import WorkflowFilter from '@cfCommonComponents/filters/WorkflowFilter/index.jsx'
import { Workflow } from '@cfModule/types/common'
import { LibraryQueryResp } from '@XMLHTTP/types/query'
import { getLibraryQuery } from '@XMLHTTP/API/pages'
import MenuBar from '@cfCommonComponents/layout/MenuBar'
import AddCircleIcon from '@mui/icons-material/AddCircle';

type PropsType = Record<string, never>
type StateType = {
  project_data?: Workflow[]
}
/*******************************************************
 * @LibraryRenderer
 *******************************************************/
class LibraryPage extends React.Component<PropsType, StateType> {
  private createDiv: React.RefObject<HTMLDivElement>

  constructor(props: PropsType) {
    super(props)
    this.state = {}
    this.createDiv = React.createRef()
  }

  /*******************************************************
   * LIFECYCLE HOOKS
   *******************************************************/
  componentDidMount() {
    getLibraryQuery((data: LibraryQueryResp) => {
      this.setState({
        project_data: data.data_package
      })
    })
    COURSEFLOW_APP.makeDropdown(this.createDiv.current)
  }


  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    return (

          <WorkflowFilter
            workflows={this.state.project_data}
            context="library"
          />
    )
  }
}

export default LibraryPage
