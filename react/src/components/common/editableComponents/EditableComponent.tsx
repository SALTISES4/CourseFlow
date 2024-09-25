import * as Constants from '@cf/constants'
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import { CfObjectType, WorkflowType } from '@cf/types/enum'
import * as Utility from '@cf/utility/utilityFunctions'
// import $ from 'jquery'
import { _t } from '@cf/utility/utilityFunctions'
import { UtilityLoader } from '@cf/utility/UtilityLoader'
import WorkflowLinkDialog from '@cfComponents/dialog/Workflow/WorkflowLinkDialog'
import QuillDiv from '@cfEditableComponents/components/QuillDiv'
import ComponentWithToggleDrop from '@cfEditableComponents/ComponentWithToggleDrop'
import Button from '@mui/material/Button'
import { toggleStrategyQuery } from '@XMLHTTP/API/update'
import { updateObjectSet } from '@XMLHTTP/API/update'
import { ReactElement, ReactPortal } from 'react'
import * as React from 'react'
import ReactDOM from 'react-dom'

const choices = COURSEFLOW_APP.globalContextData.workflow_choices

const LinkedWorkflowButton = (id: any) => {
  const { dispatch } = useDialog()

  return (
    <Button onClick={() => dispatch(DIALOG_TYPE.LINK_WORKFLOW)}>
      {_t('Change')}
    </Button>
  )
}

//Extends the React component to add a few features that are used in a large number of components

export type EditableComponentProps = {
  data?: any
  placeholder?: any
  text?: any
  textChangeFunction?: any
  disabled?: any
  objectSets?: any
}

type StateType = {
  selected: boolean
}
export type EditableComponentStateType = StateType

class EditableComponent<
  P extends EditableComponentProps,
  S extends StateType
> extends ComponentWithToggleDrop<P, S> {
  contextType = WorkFlowConfigContext
  declare context: React.ContextType<typeof WorkFlowConfigContext>

  //Makes the item selectable

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  setChanged(set_id, evt) {
    COURSEFLOW_APP.tinyLoader.startLoad()
    updateObjectSet(
      this.props.data.id,
      Constants.objectDictionary[this.objectType],
      set_id,
      evt.target.checked,
      () => {
        COURSEFLOW_APP.tinyLoader.endLoad()
      }
    )
  }

  checkboxChanged(field, evt) {
    const do_change = true
    if (do_change)
      this.context.editableMethods.changeField(
        this.props.data.id,
        Constants.objectDictionary[this.objectType],
        field,
        evt.target.checked
      )
  }

  valueChanged(field, newValue) {
    this.context.editableMethods.changeField(
      this.props.data.id,
      Constants.objectDictionary[this.objectType],
      field,
      newValue
    )
  }

  getBorderStyle() {
    const data = this.props.data
    if (!data) return

    const border = data.lock ? '2px solid ' + data.lock.userColour : undefined
    return {
      border
    }
  }

  inputChanged(field, evt) {
    let value = evt.target.value
    if (evt.target.type == 'number') value = parseInt(value) || 0
    else if (!value) value = ''
    if (field == 'colour') value = parseInt(value.replace('#', ''), 16)
    if (evt.target.type == 'number' && value == '') value = 0
    this.context.editableMethods.changeField(
      this.props.data.id,
      Constants.objectDictionary[this.objectType],
      field,
      value
    )
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/

  BrowseOptions = ({ data, override, readOnly }) => {
    return (
      <div>
        <h4>{_t('Custom Icon')}</h4>
        <p>
          Browse options{' '}
          <a href="https://fonts.google.com/icons?icon.style=Rounded&icon.platform=android&icon.category=Activities">
            here
          </a>
          .
        </p>
        <input
          disabled={override || readOnly}
          autoComplete="off"
          id="column-icon-editor"
          type="text"
          value={data.icon}
          maxLength={50}
          onChange={this.inputChanged.bind(this, 'icon')}
        />
      </div>
    )
  }

  Task = ({ data, readOnly }) => {
    return (
      <div>
        <h4>{_t('Task')}</h4>
        <select
          id="task-editor"
          disabled={readOnly}
          value={data.taskClassification}
          onChange={this.inputChanged.bind(this, 'taskClassification')}
        >
          {choices.task_choices
            .filter(
              (choice) =>
                // @todo clearly not properly typed
                // @ts-ignore
                Math.floor(choice.type / 100) == data.nodeType ||
                choice.type == 0
            )
            .map((choice) => (
              <option value={choice.type}>{choice.name}</option>
            ))}
        </select>
      </div>
    )
  }

  Time = ({ data, readOnly, override }) => {
    return (
      <div>
        <h4>{_t('Time')}</h4>
        <div>
          <input
            disabled={override || readOnly}
            autoComplete="off"
            id="time-editor"
            className="half-width"
            type="text"
            value={data.timeRequired}
            maxLength={30}
            onChange={this.inputChanged.bind(this, 'timeRequired')}
          />
          <select
            disabled={override || readOnly}
            id="time-units-editor"
            className="half-width"
            value={data.timeUnits}
            onChange={this.inputChanged.bind(this, 'timeUnits')}
          >
            {choices.time_choices.map((choice) => (
              <option value={choice.type}>{choice.name}</option>
            ))}
          </select>
        </div>
      </div>
    )
  }

  Colour = ({ data, readOnly }) => {
    return (
      <div>
        <h4>{_t('Colour')}</h4>
        <div>
          <input
            disabled={readOnly}
            autoComplete="off"
            id="colour-editor"
            className="half-width"
            type="color"
            value={'#' + data.colour?.toString(16)}
            maxLength={30}
            onChange={this.inputChanged.bind(this, 'colour')}
          />
        </div>
      </div>
    )
  }

  CodeOptional = ({ data, readOnly }) => {
    return (
      <div>
        <h4>{_t('Code (Optional)')}</h4>
        <input
          autoComplete="off"
          disabled={readOnly}
          id="code-editor"
          type="text"
          value={data.code}
          maxLength={50}
          onChange={this.inputChanged.bind(this, 'code')}
        />
      </div>
    )
  }

  Description = ({ readOnly, override, description }) => {
    return (
      <div>
        <h4>{_t('Description')}</h4>
        <QuillDiv
          disabled={override || readOnly}
          text={description}
          // maxlength={500}
          textChangeFunction={this.valueChanged.bind(this, 'description')}
          placeholder="Insert description here"
          // @todo probably don't need to fix this
          // readOnly={this.context.permissions.workflowPermissions.readOnly}
          readOnly={false}
        />
      </div>
    )
  }

  Context = ({ data, readOnly }) => {
    return (
      <div>
        <h4>{_t('Context')}</h4>
        <select
          id="context-editor"
          disabled={readOnly}
          value={data.contextClassification}
          onChange={this.inputChanged.bind(this, 'contextClassification')}
        >
          {choices.contextChoices
            .filter(
              (choice) =>
                // @ts-ignore
                Math.floor(choice.type / 100) == data.nodeType ||
                choice.type == 0
            )
            .map((choice) => (
              <option value={choice.type}>{choice.name}</option>
            ))}
        </select>
      </div>
    )
  }

  Ponderation = ({ data, override, readOnly }) => (
    <div>
      <h4>{_t('Ponderation')}</h4>
      <input
        disabled={override || readOnly}
        autoComplete="off"
        className="half-width"
        id="ponderation-theory"
        type="number"
        value={data.ponderationTheory}
        onChange={this.inputChanged.bind(this, 'ponderationTheory')}
      />
      <div className="half-width">{_t('hrs. Theory')}</div>
      <input
        disabled={override || readOnly}
        autoComplete="off"
        className="half-width"
        id="ponderation-practical"
        type="number"
        value={data.ponderationPractical}
        onChange={this.inputChanged.bind(this, 'ponderationPractical')}
      />
      <div className="half-width">{_t('hrs. Practical')}</div>
      <input
        disabled={override || readOnly}
        className="half-width"
        autoComplete="off"
        id="ponderation-individual"
        type="number"
        value={data.ponderationIndividual}
        onChange={this.inputChanged.bind(this, 'ponderationIndividual')}
      />
      <div className="half-width">{_t('hrs. Individual')}</div>
      <input
        disabled={override || readOnly}
        className="half-width"
        autoComplete="off"
        id="time-general-hours"
        type="number"
        value={data.timeGeneralHours}
        onChange={this.inputChanged.bind(this, 'timeGeneralHours')}
      />
      <div className="half-width">{_t('hrs. General Education')}</div>
      <input
        disabled={override || readOnly}
        className="half-width"
        autoComplete="off"
        id="time-specific-hours"
        type="number"
        value={data.timeSpecificHours}
        onChange={this.inputChanged.bind(this, 'timeSpecificHours')}
      />
      <div className="half-width">{_t('hrs. Specific Education')}</div>
    </div>
  )

  Workflow = ({ data, readOnly }) => {
    return (
      <div>
        <h4>{_t('Settings')}</h4>
        <div>
          <label htmlFor="outcomesType">{_t('Outcomes Style')}</label>
          <select
            disabled={readOnly}
            name="outcomesType"
            value={data.outcomesType}
            onChange={this.inputChanged.bind(this, 'outcomesType')}
          >
            {choices.contextChoices.map((choice) => (
              <option value={choice.type}>{choice.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="condensed">{_t('Condensed View')}</label>
          <input
            disabled={readOnly}
            type="checkbox"
            name="condensed"
            checked={data.condensed}
            onChange={this.checkboxChanged.bind(this, 'condensed')}
          />
        </div>
        {data.isStrategy && (
          <div>
            <label htmlFor="is_published">{_t('Published')}</label>
            <input
              disabled={readOnly}
              type="checkbox"
              name="is_published"
              checked={data.published}
              onChange={this.checkboxChanged.bind(this, 'published')}
            />
          </div>
        )}
      </div>
    )
  }

  Style = ({ readOnly, data }) => {
    return (
      <div>
        <h4>{_t('Style')}</h4>
        <div>
          <input
            disabled={readOnly}
            type="checkbox"
            name="dashed"
            checked={data.dashed}
            onChange={this.checkboxChanged.bind(this, 'dashed')}
          />
          <label htmlFor="dashed">{_t('Dashed Line')}</label>
        </div>
        <div>
          <label htmlFor="text-position-range">{_t('Text Position')}</label>
          <div className="slidecontainer">
            <input
              disabled={readOnly}
              type="range"
              min="1"
              max="100"
              value={data.textPosition}
              className="range-slider"
              id="text-position-range"
              onChange={this.inputChanged.bind(this, 'textPosition')}
            />
          </div>
        </div>
      </div>
    )
  }

  Title = ({ readOnly, override, title, titleLength }) => {
    return (
      <div>
        <h4>{_t('Title')}</h4>
        <textarea
          // resize="none"  @todo resize is not a valid attribute
          style={{ resize: 'none' }}
          disabled={override || readOnly}
          autoComplete="off"
          id="title-editor"
          // type="text" @todo type is not a valid attribute
          value={title}
          maxLength={Number(titleLength)}
          onChange={this.inputChanged.bind(this, 'title')}
        />
        <div className="character-length">
          {title.length}/{titleLength} {_t('characters')}
        </div>
      </div>
    )
  }

  Other = ({ readOnly, data }) => {
    return (
      <div>
        <h4>{_t('Other')}</h4>
        <input
          disabled={readOnly}
          type="checkbox"
          name="hasAutolink"
          checked={data.hasAutolink}
          onChange={this.checkboxChanged.bind(this, 'hasAutolink')}
        />
        <label htmlFor="hasAutolink">{_t('Draw arrow to next node')}</label>
      </div>
    )
  }

  LinkedWorkflow = ({ readOnly, data }) => {
    return (
      <div>
        <h4>{_t('Linked Workflow')}</h4>
        <div>{data.linkedWorkflow && data.linkedWorkflowData.title}</div>
        <LinkedWorkflowButton id={data.id} />
        <input
          disabled={readOnly}
          type="checkbox"
          name="respresents_workflow"
          checked={data.representsWorkflow}
          onChange={this.checkboxChanged.bind(this, 'representsWorkflow')}
        />
        <label htmlFor="repesents_workflow">
          {_t('Display linked workflow data')}
        </label>
      </div>
    )
  }

  Strategy = ({ readOnly, data }) => {
    return (
      <div>
        <h4>{_t('Strategy')}</h4>
        <select
          disabled={readOnly}
          value={data.strategyClassification}
          onChange={this.inputChanged.bind(this, 'strategyClassification')}
        >
          {choices.contextChoices.map((choice) => (
            <option value={choice.type}>{choice.name}</option>
          ))}
        </select>
        <button
          disabled={readOnly}
          id="toggle-strategy-editor"
          onClick={() => {
            const loader = new UtilityLoader('body')
            toggleStrategyQuery(data.id, data.isStrategy, (responseData) => {
              loader.endLoad()
            })
          }}
        >
          {data.isStrategy && _t('Remove Strategy Status')}
          {!data.isStrategy && _t('Save as Template')}
        </button>
      </div>
    )
  }

  DeleteForSidebar = ({ readOnly, no_delete, type, data }) => {
    if (!readOnly && !no_delete && (type != 'outcome' || data.depth > 0)) {
      if (type == 'workflow') {
        return <></>
      } else {
        return (
          <>
            <h4>{_t('Delete')}</h4>
            <this.AddDeleteSelf data={data} />
          </>
        )
      }
    }
  }

  //  @todo only implemented in children
  AddDeleteSelf = ({ data, alt_icon }: { data: any; alt_icon?: string }) => {
    return <></>
  }

  //
  EditForm = ({ data, noDelete }) => {
    let sets

    // @todo probably don't need to fix this
    // const readOnly = this.context.permissions.workflowPermissions.readOnly
    const readOnly = false
    const title = Utility.unescapeCharacters(data.title || '')
    const type = Constants.objectDictionary[this.objectType]
    const override = data.representsWorkflow ? true : false
    const title_length = type === 'outcome' ? 500 : 100
    const description = data.description || ''

    if (this.props.objectSets && ['node', 'outcome'].indexOf(type) >= 0) {
      const term_type =
        type == 'node' ? Constants.nodeTypeKeys[data.nodeType] : data.type

      const allowed_sets = this.props.objectSets.filter(
        (set) => set.term == term_type
      )

      if (allowed_sets.length >= 0) {
        const disable_sets = data.depth || readOnly ? true : false
        const set_options = allowed_sets.map((set) => (
          <div>
            <input
              disabled={disable_sets}
              type="checkbox"
              name={set.id}
              checked={data.sets.indexOf(set.id) >= 0}
              onChange={this.setChanged.bind(this, set.id)}
            />
            <label htmlFor={set.id}>{set.title}</label>
          </div>
        ))
        sets = [<h4>{_t('Sets')}</h4>, set_options]
      }
    }

    return (
      <div
        className="right-panel-inner"
        onClick={(evt) => evt.stopPropagation()}
      >
        <h3>{_t('Edit ') + Constants.getVerbose(data, this.objectType)}</h3>

        {[
          CfObjectType.NODE,
          CfObjectType.WEEK,
          CfObjectType.COLUMN,
          CfObjectType.WORKFLOW,
          CfObjectType.OUTCOME,
          CfObjectType.NODELINK
        ].includes(type) && (
          <this.Title
            readOnly={readOnly}
            override={override}
            title={title}
            titleLength={title_length}
          />
        )}

        {/*
            @todo this needs to be done with composition
          */}
        {[
          CfObjectType.NODE,
          CfObjectType.WORKFLOW,
          CfObjectType.OUTCOME
        ].indexOf(type) >= 0 && (
          <this.Description
            readOnly={readOnly}
            override={override}
            description={description}
          />
        )}

        {type === CfObjectType.COLUMN && (
          <this.BrowseOptions
            data={data}
            readOnly={readOnly}
            override={override}
          />
        )}

        {((type === CfObjectType.OUTCOME && data.depth === 0) ||
          (type === CfObjectType.WORKFLOW &&
            data.type == WorkflowType.COURSE)) && (
          <this.CodeOptional data={data} readOnly={readOnly} />
        )}

        {type === CfObjectType.NODE && data.nodeType < 2 && (
          <this.Context data={data} readOnly={readOnly} />
        )}

        {type === CfObjectType.NODE && data.nodeType < 2 && (
          <this.Task data={data} readOnly={readOnly} />
        )}

        {(type === CfObjectType.NODE || type == CfObjectType.WORKFLOW) && (
          <this.Time data={data} readOnly={readOnly} override={override} />
        )}

        {type === CfObjectType.COLUMN && (
          <this.Colour data={data} readOnly={readOnly} />
        )}

        {
          // @todo this is mixed up data types
          //  type should notbe able to be worklow OR course OR  outcome etc
          ((type === CfObjectType.WORKFLOW &&
            data.type == WorkflowType.COURSE) ||
            (type == CfObjectType.NODE && data.nodeType == 2)) && (
            <this.Ponderation
              data={data}
              override={override}
              readOnly={readOnly}
            />
          )
        }

        {type === CfObjectType.NODE && data.nodeType !== 0 && (
          <>
            <WorkflowLinkDialog id={data.id} />
            <this.LinkedWorkflow data={data} readOnly={readOnly} />
          </>
        )}

        {type == CfObjectType.NODE && data.nodeType != 2 && (
          <this.Other data={data} readOnly={readOnly} />
        )}

        {type == CfObjectType.NODELINK && (
          <this.Style data={data} readOnly={readOnly} />
        )}

        {type === CfObjectType.WORKFLOW && (
          <this.Workflow data={data} readOnly={readOnly} />
        )}

        {type === CfObjectType.WEEK && data.objectType < 2 && (
          <this.Strategy data={data} readOnly={readOnly} />
        )}

        {sets}
        <this.DeleteForSidebar
          readOnly={readOnly}
          no_delete={noDelete}
          type={type}
          data={data}
        />
      </div>
    )
  }

  /*******************************************************
   * PORTAL (RENDER)
   *******************************************************/
  addEditable(data, noDelete = false): ReactPortal | ReactElement {
    if (!this.state.selected) {
      return <></>
    }

    // #edit-menu dynamic, in RightSideBar component
    return ReactDOM.createPortal(
      <this.EditForm data={data} noDelete={noDelete} />,
      document.getElementById('edit-menu')
    ) as unknown as ReactPortal
  }
}

export default EditableComponent
