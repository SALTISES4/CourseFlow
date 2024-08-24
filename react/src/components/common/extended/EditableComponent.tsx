import * as React from 'react'
import ReactDOM from 'react-dom'
import * as Constants from '@cfConstants'
import * as Utility from '@cfUtility'
// import $ from 'jquery'
import ComponentWithToggleDrop from '@cfParentComponents/ComponentWithToggleDrop'
import QuillDiv from '@cfParentComponents/components/QuillDiv'
import { toggleStrategyQuery } from '@XMLHTTP/API/update'
import { updateObjectSet } from '@XMLHTTP/API/update'
import { CfObjectType } from '@cfModule/types/enum'
import { ReactElement, ReactPortal } from 'react'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'
import { UtilityLoader } from '@cfModule/utility/UtilityLoader'
import { DIALOG_TYPE, useDialog } from '@cfModule/components/common/dialog'
import Button from '@mui/material/Button'
import WorkflowLinkModal from '@cfModule/components/common/dialog/WorkflowLink'

const LinkedWorkflowButton = (id: any) => {
  const { dispatch } = useDialog()

  return (
    <Button onClick={() => dispatch(DIALOG_TYPE.LINK_WORKFLOW)}>
      {window.gettext('Change')}
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
  object_sets?: any
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
      Constants.object_dictionary[this.objectType],
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
      this.context.change_field(
        this.props.data.id,
        Constants.object_dictionary[this.objectType],
        field,
        evt.target.checked
      )
  }

  valueChanged(field, new_value) {
    this.context.change_field(
      this.props.data.id,
      Constants.object_dictionary[this.objectType],
      field,
      new_value
    )
  }

  getBorderStyle() {
    const data = this.props.data
    if (!data) return

    const border = data.lock ? '2px solid ' + data.lock.user_colour : undefined
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
    this.context.change_field(
      this.props.data.id,
      Constants.object_dictionary[this.objectType],
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
        <h4>{window.gettext('Custom Icon')}</h4>
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
        <h4>{window.gettext('Task')}</h4>
        <select
          id="task-editor"
          disabled={readOnly}
          value={data.task_classification}
          onChange={this.inputChanged.bind(this, 'task_classification')}
        >
          {this.context.task_choices
            .filter(
              (choice) =>
                Math.floor(choice.type / 100) == data.node_type ||
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
        <h4>{window.gettext('Time')}</h4>
        <div>
          <input
            disabled={override || readOnly}
            autoComplete="off"
            id="time-editor"
            className="half-width"
            type="text"
            value={data.time_required}
            maxLength={30}
            onChange={this.inputChanged.bind(this, 'time_required')}
          />
          <select
            disabled={override || readOnly}
            id="time-units-editor"
            className="half-width"
            value={data.time_units}
            onChange={this.inputChanged.bind(this, 'time_units')}
          >
            {this.context.time_choices.map((choice) => (
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
        <h4>{window.gettext('Colour')}</h4>
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
        <h4>{window.gettext('Code (Optional)')}</h4>
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
        <h4>{window.gettext('Description')}</h4>
        <QuillDiv
          disabled={override || readOnly}
          text={description}
          // maxlength={500}
          textChangeFunction={this.valueChanged.bind(this, 'description')}
          placeholder="Insert description here"
          readOnly={this.context.read_only}
        />
      </div>
    )
  }

  Context = ({ data, readOnly }) => {
    return (
      <div>
        <h4>{window.gettext('Context')}</h4>
        <select
          id="context-editor"
          disabled={readOnly}
          value={data.context_classification}
          onChange={this.inputChanged.bind(this, 'context_classification')}
        >
          {this.context.context_choices
            .filter(
              (choice) =>
                Math.floor(choice.type / 100) == data.node_type ||
                choice.type == 0
            )
            .map((choice) => (
              <option value={choice.type}>{choice.name}</option>
            ))}
        </select>
      </div>
    )
  }

  Ponderation = ({ data, override, read_only }) => (
    <div>
      <h4>{window.gettext('Ponderation')}</h4>
      <input
        disabled={override || read_only}
        autoComplete="off"
        className="half-width"
        id="ponderation-theory"
        type="number"
        value={data.ponderation_theory}
        onChange={this.inputChanged.bind(this, 'ponderation_theory')}
      />
      <div className="half-width">{window.gettext('hrs. Theory')}</div>
      <input
        disabled={override || read_only}
        autoComplete="off"
        className="half-width"
        id="ponderation-practical"
        type="number"
        value={data.ponderation_practical}
        onChange={this.inputChanged.bind(this, 'ponderation_practical')}
      />
      <div className="half-width">{window.gettext('hrs. Practical')}</div>
      <input
        disabled={override || read_only}
        className="half-width"
        autoComplete="off"
        id="ponderation-individual"
        type="number"
        value={data.ponderation_individual}
        onChange={this.inputChanged.bind(this, 'ponderation_individual')}
      />
      <div className="half-width">{window.gettext('hrs. Individual')}</div>
      <input
        disabled={override || read_only}
        className="half-width"
        autoComplete="off"
        id="time-general-hours"
        type="number"
        value={data.time_general_hours}
        onChange={this.inputChanged.bind(this, 'time_general_hours')}
      />
      <div className="half-width">
        {window.gettext('hrs. General Education')}
      </div>
      <input
        disabled={override || read_only}
        className="half-width"
        autoComplete="off"
        id="time-specific-hours"
        type="number"
        value={data.time_specific_hours}
        onChange={this.inputChanged.bind(this, 'time_specific_hours')}
      />
      <div className="half-width">
        {window.gettext('hrs. Specific Education')}
      </div>
    </div>
  )

  Workflow = ({ data, readOnly }) => {
    return (
      <div>
        <h4>{window.gettext('Settings')}</h4>
        <div>
          <label htmlFor="outcomes_type">
            {window.gettext('Outcomes Style')}
          </label>
          <select
            disabled={readOnly}
            name="outcomes_type"
            value={data.outcomes_type}
            onChange={this.inputChanged.bind(this, 'outcomes_type')}
          >
            {this.context.context_choices.map((choice) => (
              <option value={choice.type}>{choice.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="condensed">{window.gettext('Condensed View')}</label>
          <input
            disabled={readOnly}
            type="checkbox"
            name="condensed"
            checked={data.condensed}
            onChange={this.checkboxChanged.bind(this, 'condensed')}
          />
        </div>
        {data.is_strategy && (
          <div>
            <label htmlFor="is_published">{window.gettext('Published')}</label>
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
        <h4>{window.gettext('Style')}</h4>
        <div>
          <input
            disabled={readOnly}
            type="checkbox"
            name="dashed"
            checked={data.dashed}
            onChange={this.checkboxChanged.bind(this, 'dashed')}
          />
          <label htmlFor="dashed">{window.gettext('Dashed Line')}</label>
        </div>
        <div>
          <label htmlFor="text-position-range">
            {window.gettext('Text Position')}
          </label>
          <div className="slidecontainer">
            <input
              disabled={readOnly}
              type="range"
              min="1"
              max="100"
              value={data.text_position}
              className="range-slider"
              id="text-position-range"
              onChange={this.inputChanged.bind(this, 'text_position')}
            />
          </div>
        </div>
      </div>
    )
  }

  Title = ({ readOnly, override, title, titleLength }) => {
    return (
      <div>
        <h4>{window.gettext('Title')}</h4>
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
          {title.length}/{titleLength} {window.gettext('characters')}
        </div>
      </div>
    )
  }

  Other = ({ readOnly, data }) => {
    return (
      <div>
        <h4>{window.gettext('Other')}</h4>
        <input
          disabled={readOnly}
          type="checkbox"
          name="has_autolink"
          checked={data.has_autolink}
          onChange={this.checkboxChanged.bind(this, 'has_autolink')}
        />
        <label htmlFor="has_autolink">
          {window.gettext('Draw arrow to next node')}
        </label>
      </div>
    )
  }

  LinkedWorkflow = ({ readOnly, data }) => {
    return (
      <div>
        <h4>{window.gettext('Linked Workflow')}</h4>
        <div>{data.linked_workflow && data.linked_workflow_data.title}</div>
        <LinkedWorkflowButton id={data.id} />
        <input
          disabled={readOnly}
          type="checkbox"
          name="respresents_workflow"
          checked={data.represents_workflow}
          onChange={this.checkboxChanged.bind(this, 'represents_workflow')}
        />
        <label htmlFor="repesents_workflow">
          {window.gettext('Display linked workflow data')}
        </label>
      </div>
    )
  }

  Strategy = ({ readOnly, data }) => {
    return (
      <div>
        <h4>{window.gettext('Strategy')}</h4>
        <select
          disabled={readOnly}
          value={data.strategy_classification}
          onChange={this.inputChanged.bind(this, 'strategy_classification')}
        >
          {this.context.context_choices.map((choice) => (
            <option value={choice.type}>{choice.name}</option>
          ))}
        </select>
        <button
          disabled={readOnly}
          id="toggle-strategy-editor"
          onClick={() => {
            const loader = new UtilityLoader('body')
            toggleStrategyQuery(data.id, data.is_strategy, (response_data) => {
              loader.endLoad()
            })
          }}
        >
          {data.is_strategy && window.gettext('Remove Strategy Status')}
          {!data.is_strategy && window.gettext('Save as Template')}
        </button>
      </div>
    )
  }

  DeleteForSidebar = ({ read_only, no_delete, type, data }) => {
    if (!read_only && !no_delete && (type != 'outcome' || data.depth > 0)) {
      if (type == 'workflow') {
        return <></>
      } else {
        return (
          <>
            <h4>{window.gettext('Delete')}</h4>
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

  EditForm = ({ data, noDelete }) => {
    let sets

    const read_only = this.context.read_only
    const title = Utility.unescapeCharacters(data.title || '')
    const type = Constants.object_dictionary[this.objectType]
    const override = data.represents_workflow ? true : false
    const title_length = type === 'outcome' ? 500 : 100
    const description = data.description || ''

    if (this.props.object_sets && ['node', 'outcome'].indexOf(type) >= 0) {
      const term_type =
        type == 'node' ? Constants.node_type_keys[data.node_type] : data.type

      const allowed_sets = this.props.object_sets.filter(
        (set) => set.term == term_type
      )

      if (allowed_sets.length >= 0) {
        const disable_sets = data.depth || read_only ? true : false
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
        sets = [<h4>{window.gettext('Sets')}</h4>, set_options]
      }
    }

    return (
      <div
        className="right-panel-inner"
        onClick={(evt) => evt.stopPropagation()}
      >
        <h3>
          {window.gettext('Edit ') +
            Constants.get_verbose(data, this.objectType)}
        </h3>

        {[
          CfObjectType.NODE,
          CfObjectType.WEEK,
          CfObjectType.COLUMN,
          CfObjectType.WORKFLOW,
          CfObjectType.OUTCOME,
          CfObjectType.NODELINK
        ].includes(type) && (
          <this.Title
            readOnly={read_only}
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
            readOnly={read_only}
            override={override}
            description={description}
          />
        )}

        {type === CfObjectType.COLUMN && (
          <this.BrowseOptions
            data={data}
            readOnly={read_only}
            override={override}
          />
        )}

        {((type === CfObjectType.OUTCOME && data.depth === 0) ||
          (type === CfObjectType.WORKFLOW &&
            data.type == CfObjectType.COURSE)) && (
          <this.CodeOptional data={data} readOnly={read_only} />
        )}

        {type === CfObjectType.NODE && data.node_type < 2 && (
          <this.Context data={data} readOnly={read_only} />
        )}

        {type === CfObjectType.NODE && data.node_type < 2 && (
          <this.Task data={data} readOnly={read_only} />
        )}

        {(type === CfObjectType.NODE || type == CfObjectType.WORKFLOW) && (
          <this.Time data={data} readOnly={read_only} override={override} />
        )}

        {type === CfObjectType.COLUMN && (
          <this.Colour data={data} readOnly={read_only} />
        )}

        {((type === CfObjectType.WORKFLOW &&
          data.type == CfObjectType.COURSE) ||
          (type == CfObjectType.NODE && data.node_type == 2)) && (
          <this.Ponderation
            data={data}
            override={override}
            read_only={read_only}
          />
        )}

        {type === CfObjectType.NODE && data.node_type !== 0 && (
          <>
            <WorkflowLinkModal id={data.id} />
            <this.LinkedWorkflow data={data} readOnly={read_only} />
          </>
        )}

        {type == CfObjectType.NODE && data.node_type != 2 && (
          <this.Other data={data} readOnly={read_only} />
        )}

        {type == CfObjectType.NODELINK && (
          <this.Style data={data} readOnly={read_only} />
        )}

        {type === CfObjectType.WORKFLOW && (
          <this.Workflow data={data} readOnly={read_only} />
        )}

        {type === CfObjectType.WEEK && data.week_type < 2 && (
          <this.Strategy data={data} readOnly={read_only} />
        )}

        {sets}
        <this.DeleteForSidebar
          read_only={read_only}
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
