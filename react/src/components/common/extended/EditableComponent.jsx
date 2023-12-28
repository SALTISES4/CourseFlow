import * as React from 'react'
import * as Constants from '@cfConstants'
import * as Utility from '@cfUtility'
import * as reactDom from 'react-dom'
import { toggleStrategy, updateObjectSet } from '@XMLHTTP/PostFunctions'
import { getLinkedWorkflowMenu } from '@XMLHTTP/postTemp'
import ComponentWithToggleDrop from './ComponentWithToggleDrop.tsx'

//Quill div for inputs, as a react component
class QuillDiv extends React.Component {
  constructor(props) {
    super(props)
    this.maindiv = React.createRef()
    if (props.text) this.state = { charlength: props.text.length }
    else this.state = { charlength: 0 }
  }

  render() {
    return (
      <div>
        <div ref={this.maindiv} className="quill-div" />
        <div className={'character-length'}>
          {this.state.charlength + ' ' + window.gettext('characters')}
        </div>
      </div>
    )
  }

  componentDidMount() {
    let renderer = this.props.renderer
    let quill_container = this.maindiv.current
    let toolbarOptions = [
      ['bold', 'italic', 'underline'],
      [{ script: 'sub' }, { script: 'super' }],
      [{ list: 'bullet' }, { list: 'ordered' }],
      ['link'] /*,['formula']*/
    ]
    let quill = new Quill(quill_container, {
      theme: 'snow',
      modules: {
        toolbar: toolbarOptions
      },
      placeholder: this.props.placeholder
    })
    this.quill = quill
    if (this.props.text) quill.clipboard.dangerouslyPasteHTML(this.props.text)
    quill.on('text-change', () => {
      let text = quill_container.childNodes[0].innerHTML.replace(
        /\<p\>\<br\>\<\/p\>\<ul\>/g,
        '<ul>'
      )
      this.props.textChangeFunction(text)
      this.setState({ charlength: text.length })
    })
    let toolbar = quill.getModule('toolbar')
    toolbar.defaultLinkFunction = toolbar.handlers['link']
    toolbar.addHandler('link', function customLinkFunction(value) {
      var select = quill.getSelection()
      if (value && select['length'] == 0 && !renderer.read_only) {
        quill.insertText(select['index'], 'link')
        quill.setSelection(select['index'], 4)
      }
      this.defaultLinkFunction(value)
    })
    this.quill.enable(!this.props.disabled)
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.disabled != this.props.disabled) {
      if (prevProps.text != this.props.text)
        this.quill.clipboard.dangerouslyPasteHTML(this.props.text, 'silent')
      this.quill.enable(!this.props.disabled)
    }
    $(this.maindiv.current)
      .find('a')
      .click(() => {
        $(this).attr('target', '_blank')
      })
  }
}

//Extends the react component to add a few features that are used in a large number of components
class EditableComponent extends ComponentWithToggleDrop {
  //Makes the item selectable
  addEditable(data, no_delete = false) {
    let read_only = this.props.renderer.read_only
    if (this.state.selected) {
      var type = Constants.object_dictionary[this.objectType]
      let title_length = '100'
      if (type == 'outcome') title_length = '500'
      var props = this.props
      let override = false
      let title = Utility.unescapeCharacters(data.title || '')
      let description = data.description || ''
      if (data.represents_workflow) override = true

      let sets
      if (this.props.object_sets && ['node', 'outcome'].indexOf(type) >= 0) {
        let term_type = data.type
        if (type == 'node') term_type = Constants.node_type_keys[data.node_type]

        let allowed_sets = this.props.object_sets.filter(
          (set) => set.term == term_type
        )
        if (allowed_sets.length >= 0) {
          let disable_sets = false
          if (data.depth || read_only) disable_sets = true
          let set_options = allowed_sets.map((set) => (
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

      return reactDom.createPortal(
        <div
          className="right-panel-inner"
          onClick={(evt) => evt.stopPropagation()}
        >
          <h3>
            {window.gettext('Edit ') +
              Constants.get_verbose(data, this.objectType)}
          </h3>
          {[
            'node',
            'week',
            'column',
            'workflow',
            'outcome',
            'nodelink'
          ].indexOf(type) >= 0 && (
            <div>
              <h4>{window.gettext('Title')}</h4>
              <textarea
                resize="none"
                disabled={override || read_only}
                autoComplete="off"
                id="title-editor"
                type="text"
                value={title}
                maxLength={title_length}
                onChange={this.inputChanged.bind(this, 'title')}
              />
              <div className="character-length">
                {title.length}/{title_length} {window.gettext('characters')}
              </div>
            </div>
          )}
          {['node', 'workflow', 'outcome'].indexOf(type) >= 0 && (
            <div>
              <h4>{window.gettext('Description')}</h4>
              <QuillDiv
                disabled={override || read_only}
                text={description}
                maxlength="500"
                textChangeFunction={this.valueChanged.bind(this, 'description')}
                placholder="Insert description here"
              />
            </div>
          )}
          {type == 'column' && (
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
                disabled={override || read_only}
                autoComplete="off"
                id="column-icon-editor"
                type="text"
                value={data.icon}
                maxLength={50}
                onChange={this.inputChanged.bind(this, 'icon')}
              />
            </div>
          )}
          {((type == 'outcome' && data.depth == 0) ||
            (type == 'workflow' && data.type == 'course')) && (
            <div>
              <h4>{window.gettext('Code (Optional)')}</h4>
              <input
                autoComplete="off"
                disabled={read_only}
                id="code-editor"
                type="text"
                value={data.code}
                maxLength="50"
                onChange={this.inputChanged.bind(this, 'code')}
              />
            </div>
          )}
          {type == 'node' && data.node_type < 2 && (
            <div>
              <h4>{window.gettext('Context')}</h4>
              <select
                id="context-editor"
                disabled={read_only}
                value={data.context_classification}
                onChange={this.inputChanged.bind(
                  this,
                  'context_classification'
                )}
              >
                {this.props.renderer.context_choices
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
          )}
          {type == 'node' && data.node_type < 2 && (
            <div>
              <h4>{window.gettext('Task')}</h4>
              <select
                id="task-editor"
                disabled={read_only}
                value={data.task_classification}
                onChange={this.inputChanged.bind(this, 'task_classification')}
              >
                {this.props.renderer.task_choices
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
          )}
          {(type == 'node' || type == 'workflow') && (
            <div>
              <h4>{window.gettext('Time')}</h4>
              <div>
                <input
                  disabled={override || read_only}
                  autoComplete="off"
                  id="time-editor"
                  className="half-width"
                  type="text"
                  value={data.time_required}
                  maxLength="30"
                  onChange={this.inputChanged.bind(this, 'time_required')}
                />
                <select
                  disabled={override || read_only}
                  id="time-units-editor"
                  className="half-width"
                  value={data.time_units}
                  onChange={this.inputChanged.bind(this, 'time_units')}
                >
                  {this.props.renderer.time_choices.map((choice) => (
                    <option value={choice.type}>{choice.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {type == 'column' && (
            <div>
              <h4>{window.gettext('Colour')}</h4>
              <div>
                <input
                  disabled={read_only}
                  autoComplete="off"
                  id="colour-editor"
                  className="half-width"
                  type="color"
                  value={'#' + data.colour?.toString(16)}
                  maxLength="30"
                  onChange={this.inputChanged.bind(this, 'colour')}
                />
              </div>
            </div>
          )}
          {((type == 'workflow' && data.type == 'course') ||
            (type == 'node' && data.node_type == 2)) && (
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
              <div className="half-width">
                {window.gettext('hrs. Practical')}
              </div>
              <input
                disabled={override || read_only}
                className="half-width"
                autoComplete="off"
                id="ponderation-individual"
                type="number"
                value={data.ponderation_individual}
                onChange={this.inputChanged.bind(
                  this,
                  'ponderation_individual'
                )}
              />
              <div className="half-width">
                {window.gettext('hrs. Individual')}
              </div>
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
          )}
          {type == 'node' && data.node_type != 0 && (
            <div>
              <h4>{window.gettext('Linked Workflow')}</h4>
              <div>
                {data.linked_workflow && data.linked_workflow_data.title}
              </div>
              <button
                className="primary-button"
                disabled={read_only}
                id="linked-workflow-editor"
                onClick={() => {
                  props.renderer.tiny_loader.startLoad()
                  getLinkedWorkflowMenu(
                    data,
                    (response_data) => {
                      console.log('linked a workflow')
                    },
                    () => {
                      props.renderer.tiny_loader.endLoad()
                    }
                  )
                }}
              >
                {window.gettext('Change')}
              </button>
              <input
                disabled={read_only}
                type="checkbox"
                name="respresents_workflow"
                checked={data.represents_workflow}
                onChange={this.checkboxChanged.bind(
                  this,
                  'represents_workflow'
                )}
              />
              <label htmlFor="repesents_workflow">
                {window.gettext('Display linked workflow data')}
              </label>
            </div>
          )}
          {type == 'node' && data.node_type != 2 && (
            <div>
              <h4>{window.gettext('Other')}</h4>
              <input
                disabled={read_only}
                type="checkbox"
                name="has_autolink"
                checked={data.has_autolink}
                onChange={this.checkboxChanged.bind(this, 'has_autolink')}
              />
              <label htmlFor="has_autolink">
                {window.gettext('Draw arrow to next node')}
              </label>
            </div>
          )}
          {type == 'nodelink' && (
            <div>
              <h4>{window.gettext('Style')}</h4>
              <div>
                <input
                  disabled={read_only}
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
                    disabled={read_only}
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
          )}
          {type == 'workflow' && (
            <div>
              <h4>{window.gettext('Settings')}</h4>
              <div>
                <label htmlFor="outcomes_type">
                  {window.gettext('Outcomes Style')}
                </label>
                <select
                  disabled={read_only}
                  name="outcomes_type"
                  value={data.outcomes_type}
                  onChange={this.inputChanged.bind(this, 'outcomes_type')}
                >
                  {this.props.renderer.outcome_type_choices.map((choice) => (
                    <option value={choice.type}>{choice.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="condensed">
                  {window.gettext('Condensed View')}
                </label>
                <input
                  disabled={read_only}
                  type="checkbox"
                  name="condensed"
                  checked={data.condensed}
                  onChange={this.checkboxChanged.bind(this, 'condensed')}
                />
              </div>
              {data.is_strategy && (
                <div>
                  <label htmlFor="is_published">
                    {window.gettext('Published')}
                  </label>
                  <input
                    disabled={read_only}
                    type="checkbox"
                    name="is_published"
                    checked={data.published}
                    onChange={this.checkboxChanged.bind(this, 'published')}
                  />
                </div>
              )}
            </div>
          )}
          {type == 'week' && data.week_type < 2 && (
            <div>
              <h4>{window.gettext('Strategy')}</h4>
              <select
                disabled={read_only}
                value={data.strategy_classification}
                onChange={this.inputChanged.bind(
                  this,
                  'strategy_classification'
                )}
              >
                {this.props.renderer.strategy_classification_choices.map(
                  (choice) => (
                    <option value={choice.type}>{choice.name}</option>
                  )
                )}
              </select>
              <button
                disabled={read_only}
                id="toggle-strategy-editor"
                onClick={() => {
                  let loader = new Utility.Loader('body')
                  toggleStrategy(data.id, data.is_strategy, (response_data) => {
                    loader.endLoad()
                  })
                }}
              >
                {data.is_strategy && window.gettext('Remove Strategy Status')}
                {!data.is_strategy && window.gettext('Save as Template')}
              </button>
            </div>
          )}
          {sets}
          {this.getDeleteForSidebar(read_only, no_delete, type, data)}
        </div>,
        $('#edit-menu')[0]
      )
    }
  }

  getDeleteForSidebar(read_only, no_delete, type, data) {
    if (!read_only && !no_delete && (type != 'outcome' || data.depth > 0)) {
      if (type == 'workflow') return [null]
      else
        return [<h4>{window.gettext('Delete')}</h4>, this.addDeleteSelf(data)]
    }
  }

  inputChanged(field, evt) {
    let value = evt.target.value
    if (evt.target.type == 'number') value = parseInt(value) || 0
    else if (!value) value = ''
    if (field == 'colour') value = parseInt(value.replace('#', ''), 16)
    if (evt.target.type == 'number' && value == '') value = 0
    this.props.renderer.change_field(
      this.props.data.id,
      Constants.object_dictionary[this.objectType],
      field,
      value
    )
  }

  setChanged(set_id, evt) {
    this.props.renderer.tiny_loader.startLoad()
    updateObjectSet(
      this.props.data.id,
      Constants.object_dictionary[this.objectType],
      set_id,
      evt.target.checked,
      () => {
        this.props.renderer.tiny_loader.endLoad()
      }
    )
  }

  checkboxChanged(field, evt) {
    let do_change = true
    if (do_change)
      this.props.renderer.change_field(
        this.props.data.id,
        Constants.object_dictionary[this.objectType],
        field,
        evt.target.checked
      )
  }

  valueChanged(field, new_value) {
    this.props.renderer.change_field(
      this.props.data.id,
      Constants.object_dictionary[this.objectType],
      field,
      new_value
    )
  }

  get_border_style() {
    let data = this.props.data
    if (!data) return
    let style = {}
    if (data.lock) {
      style.border = '2px solid ' + data.lock.user_colour
    }
    return style
  }
}

export default EditableComponent
