import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import SortableDragAndDropManager from '@cfEditableComponents/SortableDragAndDropManager.class'
import ActionCreator from '@cfRedux/ActionCreator'
import { selectOutcomesFromWorkflows } from '@cfRedux/selectors/outcomesFromWorkflow.selector'
import { RootState } from '@cfRedux/store'
import { newOutcomeQuery } from '@XMLHTTP/API/create'
import { insertedAt } from '@XMLHTTP/postTemp.js'
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
  const data = useSelector((state: RootState) =>
    selectOutcomesFromWorkflows(state, state.workflow.outcomes)
  )
  const workflow = useSelector((state: RootState) => state.workspace.workflow)

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

  const addNewWrapper = (objectSet: any) => {
    newOutcomeQuery(workflow.id, objectSet.id)
  }
  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const AddNew: React.FC<{ objectSet: any }> = ({ objectSet }) => {
    if (workflow.workflowPermissions.write) {
      return (
        <div
          id="add-new-outcome"
          className="menu-create hover-shade"
          onClick={() => addNewWrapper(objectSet)}
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
          <AddNew objectSet={{}} />
        </>
      )
    }

    return data.map((category: any, index: number) => (
      <div key={index} className="outcome-category">
        <h4>{`${category.objectSet.title}:`}</h4>
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
          <AddNew objectSet={category.objectSet} />
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
