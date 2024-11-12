import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import SortableDragAndDropManager from '@cfEditableComponents/SortableDragAndDropManager.class'
import ActionCreator from '@cfRedux/ActionCreator'
import { selectOutcomesFromWorkflows } from '@cfRedux/selectors/outcomesFromWorkflow.selector'
import { AppState } from '@cfRedux/types/type'
import { newOutcomeQuery } from '@XMLHTTP/API/create'
import { insertedAt } from '@XMLHTTP/postTemp.jsx'
import * as React from 'react'
import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

import Outcome from './components/Outcome'

class OutcomeDragAndDropManager extends SortableDragAndDropManager {
  onMovedIn(id, newPosition, type, newParent, childId) {
    this.context.editableMethods.microUpdate(
      ActionCreator.moveOutcomeWorkflow(
        id,
        newPosition,
        this.props.workflow.id,
        childId
      )
    )
    insertedAt(
      this.context.selectionManager,
      childId,
      CfObjectType.OUTCOME,
      this.props.workflow.id,
      CfObjectType.WORKFLOW,
      newPosition,
      CfObjectType.OUTCOMEWORKFLOW
    )
  }
}

type ConnectedProps = {
  data: any
  workflow: any
}

type OwnProps = {
  objectId: number
  parentId: number
}

type PropsType = ConnectedProps & OwnProps

const OutcomeEditView: React.FC<PropsType> = ({ objectId, parentId }) => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const data = useSelector((state: AppState) =>
    selectOutcomesFromWorkflows(state, state.workflow.outcomes)
  )
  const workflow = useSelector((state: AppState) => state.workflow)

  const mainDiv = useRef<HTMLDivElement>(null)
  const outcomeDragAndDropManager = useRef(
    new OutcomeDragAndDropManager({ objectId, parentId })
  )

  useEffect(() => {
    outcomeDragAndDropManager.current.makeSortableElement(
      $(mainDiv.current).find('.outcome-workflow').not('ui-draggable'),
      objectId,
      'outcomeworkflow',
      '.outcome-workflow'
    )

    if (data?.depth === 0) {
      //    makeDroppable()
      // as far as i can tell this is not defined anywhere
      // but i'm not sure it matters
      // the current 'tree view' mechanism is broken and should be torn out anyway
      // don't spend more time recovering this
    }
  }, [data])

  const addNewWrapper = (objectset: any) => {
    newOutcomeQuery(workflow.id, objectset.id)
  }
  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const AddNew: React.FC<{ objectset: any }> = ({ objectset }) => {
    if (workflow.workflowPermissions.write) {
      return (
        <div
          id="add-new-outcome"
          className="menu-create hover-shade"
          onClick={() => addNewWrapper(objectset)}
        >
          <img
            className="create-button"
            src={`${apiPaths.external.static_assets.icon}add_new_white.svg`}
          />
          <div>{_t('Add new')}</div>
        </div>
      )
    }
    return null
  }

  const Outcomes = () => {
    if (!data.length) {
      return (
        <>
          <div className="emptytext">
            {_t(
              'Here you can add and edit outcomes for the current workflow. They will then be available in the Workflow view to tag nodes in the Outcomes tab of the sidebar.'
            )}
          </div>
          <AddNew objectset={{}} />
        </>
      )
    }

    return data.map((category: any, index: number) => (
      <div key={index} className="outcome-category">
        <h4>{`${category.objectset.title}:`}</h4>
        <div className="outcome-category-block">
          {category.outcomes.map((outcome: any) => {
            const myClass = outcome.throughNoDrag
              ? 'outcome-workflow no-drag'
              : 'outcome-workflow'

            return (
              <div
                className={myClass}
                data-child-id={outcome.id}
                id={outcome.outcomeworkflow}
                key={outcome.outcomeworkflow}
              >
                <Outcome
                  key={outcome.id}
                  objectId={outcome.id}
                  parentId={workflow.id}
                  showHorizontal={true}
                />
              </div>
            )
          })}
          <AddNew objectset={category.objectset} />
        </div>
      </div>
    ))
  }

  /*******************************************************
   * RETURN
   *******************************************************/
  return (
    <div id={`#workflow-${workflow.id}`} className="workflow-details">
      <div className="outcome-edit" ref={mainDiv}>
        <Outcomes />
      </div>
    </div>
  )
}

export default OutcomeEditView

// // import $ from 'jquery'
// type ConnectedProps = {
//   data: any
//   workflow: any
// }
//
// type OwnProps = {
//   objectId: number
//   parentId: number
// }
// type PropsType = ConnectedProps & OwnProps
//
// /**
//  * The view of a workflow in which the outcomes can be added,
//  * edited, removed
//  */
// export class OutcomeEditViewUnconnected<
//   P extends PropsType
// > extends React.Component<P> {
//   static contextType = WorkflowConfigContext
//   declare context: React.ContextType<typeof WorkflowConfigContext>
//   private mainDiv: React.RefObject<HTMLDivElement>
//   private outcomeDragAndDropManager
//
//   constructor(props: P) {
//     super(props)
//     this.outcomeDragAndDropManager = new OutcomeDragAndDropManager({
//       objectId: this.props.objectId,
//       parentId: this.props.parentId
//     })
//     this.mainDiv = React.createRef()
//   }
//
//   /*******************************************************
//    * LIFECYCLE
//    *******************************************************/
//   componentDidMount() {
//     this.makeDragAndDrop()
//   }
//
//   componentDidUpdate() {
//     this.makeDragAndDrop()
//   }
//
//   /*******************************************************
//    * FUNCTIONS
//    *******************************************************/
//
//   makeDragAndDrop() {
//     this.outcomeDragAndDropManager.makeSortableNode(
//       $(this.mainDiv.current).find('.outcome-workflow').not('ui-draggable'),
//       this.props.objectId,
//       'outcomeworkflow',
//       '.outcome-workflow'
//     )
//     if (this.props.data.depth === 0) {
//       this.outcomeDragAndDropManager.makeDroppable()
//     }
//   }
//
//   addNewWrapper(objectset) {
//     newOutcomeQuery(this.props.workflow.id, objectset.id)
//   }
//
//   /*******************************************************
//    * COMPONENTS
//    *******************************************************/
//   AddNew = ({ objectset }: any) => {
//     if (this.props.workflow.workflowPermissions.write) {
//       return (
//         <div
//           id="add-new-outcome"
//           className="menu-create hover-shade"
//           onClick={this.addNewWrapper.bind(this, objectset)}
//         >
//           <img
//             className="create-button"
//             src={apiPaths.external.static_assets.icon + 'add_new_white.svg'}
//           />
//           <div>{_t('Add new')}</div>
//         </div>
//       )
//     }
//     return <></>
//   }
//
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     const defaultMessage = (
//       <>
//         <div className="emptytext">
//           {_t(
//             'Here you can add and edit outcomes for the current workflow. They will then be available in the Workflow view to tag nodes in the Outcomes tab of the sidebar.'
//           )}
//         </div>
//         <this.AddNew objectset={{}} />
//       </>
//     )
//
//     const outcomes = this.props.data.length
//       ? this.props.data.map((category, index) => (
//           <div key={index} className="outcome-category">
//             <h4>{category.objectset.title + ':'}</h4>
//             <div className="outcome-category-block">
//               {category.outcomes.map((outcome) => {
//                 let myClass = 'outcome-workflow'
//                 if (outcome.throughNoDrag) {
//                   myClass += ' no-drag'
//                 }
//                 return (
//                   <div
//                     className={myClass}
//                     data-child-id={outcome.id}
//                     id={outcome.outcomeworkflow}
//                     key={outcome.outcomeworkflow}
//                   >
//                     <Outcome
//                       key={outcome.id}
//                       objectId={outcome.id}
//                       parentId={this.props.workflow.id}
//                       showHorizontal={true}
//                     />
//                   </div>
//                 )
//               })}
//
//               <this.AddNew objectset={category.objectset} />
//             </div>
//           </div>
//         ))
//       : defaultMessage
//
//     return (
//       <div
//         id={'#workflow-' + this.props.workflow.id}
//         className="workflow-details"
//       >
//         <div className="outcome-edit" ref={this.mainDiv}>
//           {outcomes}
//         </div>
//       </div>
//     )
//   }
// }
//
// const mapStateToProps = (state: AppState): ConnectedProps => {
//   return {
//     data: getSortedOutcomesFromOutcomeWorkflowSet(
//       state,
//       state.workflow.outcomeworkflowSet
//     ),
//     workflow: state.workflow
//   }
// }
//
// export default connect<ConnectedProps, object, OwnProps, AppState>(
//   mapStateToProps,
//   null
// )(OutcomeEditViewUnconnected)
