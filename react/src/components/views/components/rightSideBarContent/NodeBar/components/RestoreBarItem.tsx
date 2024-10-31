import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
// import $ from 'jquery'
import {
  deleteSelfQueryLegacy,
  restoreSelfQueryLegacy
} from '@XMLHTTP/API/workspace.rtk'
import { EWorkflow } from '@XMLHTTP/types/entity'
import * as React from 'react'
import { useContext, useRef, useState } from 'react'

type PropsType = {
  id: number
  title: string
  deletedOn: string
  objectType: CfObjectType
  representsWorkflow?: boolean // only on node
  linkedWorkflowData?: EWorkflow // only on node
}

const RestoreBarItem = ({
  id,
  title,
  deletedOn,
  objectType,
  representsWorkflow,
  linkedWorkflowData
}: PropsType) => {
  const context = useContext(WorkflowConfigContext)
  const mainDiv = useRef<HTMLDivElement>(null)
  const [disabled, setDisabled] = useState(false)

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  const getTitle = () => {
    if (title && title !== '') {
      return title
    }
    if (
      objectType === 'node' &&
      representsWorkflow &&
      linkedWorkflowData &&
      linkedWorkflowData.title &&
      linkedWorkflowData.title !== ''
    ) {
      return linkedWorkflowData.title
    }

    return _t('Untitled')
  }

  const restore = () => {
    setDisabled(true)
    COURSEFLOW_APP.tinyLoader.startLoad()
    restoreSelfQueryLegacy(id, objectType, () => {
      COURSEFLOW_APP.tinyLoader.endLoad()
    })
  }

  const deleteItem = () => {
    if (
      window.confirm(
        _t('Are you sure you want to permanently delete this object?')
      )
    ) {
      if (mainDiv.current) {
        // @todo don't know what this is doing yet
        // @ts-ignore
        $(mainDiv.current).children('button').attr('disabled', true)
      }
      COURSEFLOW_APP.tinyLoader.startLoad()
      deleteSelfQueryLegacy(id, objectType, false, () => {
        COURSEFLOW_APP.tinyLoader.endLoad()
      })
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <div ref={mainDiv} className="restore-bar-item">
      <div>{getTitle()}</div>
      <div className="workflow-created">{_t('Deleted') + ' ' + deletedOn}</div>
      <button onClick={restore} disabled={disabled}>
        {_t('Restore')}
      </button>
      <button onClick={deleteItem} disabled={disabled}>
        {_t('Permanently Delete')}
      </button>
    </div>
  )
}

export default RestoreBarItem

// class RestoreBarItem extends React.Component<OwnProps> {
//   static contextType = WorkflowConfigContext
//   mainDiv: React.RefObject<HTMLDivElement>
//
//   constructor(props: OwnProps) {
//     super(props)
//     this.mainDiv = React.createRef()
//   }
//
//   declare context: React.ContextType<typeof WorkflowConfigContext>
//   /*******************************************************
//    * FUNCTIONS
//    *******************************************************/
//   getTitle() {
//     if (this.props.data.title && this.props.data.title !== '')
//       return this.props.data.title
//     if (
//       this.props.objectType == 'node' &&
//       this.props.data.representsWorkflow &&
//       this.props.linkedWorkflowData &&
//       this.props.data.linkedWorkflowData.title &&
//       this.props.data.linkedWorkflowData.title !== ''
//     )
//       return this.props.data.linkedWorkflowData.title
//     return _t('Untitled')
//   }
//
//   restore() {
//     this.setState({ disabled: true })
//     COURSEFLOW_APP.tinyLoader.startLoad()
//     restoreSelfQueryLegacy(this.props.data.id, this.props.objectType, () => {
//       COURSEFLOW_APP.tinyLoader.endLoad()
//     })
//   }
//
//   delete() {
//     if (
//       window.confirm(
//         _t('Are you sure you want to permanently delete this object?')
//       )
//     ) {
//       // @ts-ignore
//       $(this.mainDiv.current).children('button').attr('disabled', true)
//       COURSEFLOW_APP.tinyLoader.startLoad()
//       deleteSelfQueryLegacy(
//         this.props.data.id,
//         this.props.objectType,
//         false,
//         () => {
//           COURSEFLOW_APP.tinyLoader.endLoad()
//         }
//       )
//     }
//   }
//
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     return (
//       <div ref={this.mainDiv} className="restore-bar-item">
//         <div>{this.getTitle()}</div>
//         <div className="workflow-created">
//           {_t('Deleted') + ' ' + this.props.data.deletedOn}
//         </div>
//         <button onClick={this.restore.bind(this)}>{_t('Restore')}</button>
//         <button onClick={this.delete.bind(this)}>
//           {_t('Permanently Delete')}
//         </button>
//       </div>
//     )
//   }
// }
//
// export default RestoreBarItem
