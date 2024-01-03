import * as React from 'react'
import * as Utility from '@cfUtility'
import * as Constants from '@cfConstants'
import {
  addTerminology,
  deleteSelfQuery,
  updateValueInstant
} from '@XMLHTTP/PostFunctions'

/*
The menu for editing a project.
*/
class ProjectEditDialog extends React.Component {
  constructor(props) {
    super(props)
    this.state = { ...this.props.data, selected_set: 'none' }
    this.object_set_updates = {}
    this.close = this.props.closeAction
  }
  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    if (this.state.all_disciplines) this.autocompleteDiscipline()
  }

  componentDidUpdate() {
    if (this.state.all_disciplines) this.autocompleteDiscipline()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  deleteTerm(id) {
    if (
      window.confirm(
        window.gettext('Are you sure you want to delete this ') +
          window.gettext('set') +
          '?'
      )
    ) {
      const new_state_dict = this.state.object_sets.slice()
      for (let i = 0; i < new_state_dict.length; i++) {
        if (new_state_dict[i].id === id) {
          deleteSelfQuery(id, 'objectset')
          new_state_dict.splice(i, 1)
          this.setState({ object_sets: new_state_dict })
          break
        }
      }
    }
  }

  addTerm() {
    const term = $('#nomenclature-select')[0].value
    const title = $('#term-singular')[0].value
    addTerminology(this.state.id, term, title, '', (response_data) => {
      this.setState({
        object_sets: response_data.new_dict,
        selected_set: 'none',
        termsingular: ''
      })
    })
  }

  termChanged(id, evt) {
    const new_sets = this.state.object_sets.slice()
    for (var i = 0; i < new_sets.length; i++) {
      if (new_sets[i].id == id) {
        new_sets[i] = { ...new_sets[i], title: evt.target.value }
        this.object_set_updates[id] = { title: evt.target.value }
      }
    }
    this.setState({ object_sets: new_sets, changed: true })
  }

  updateTerms() {
    for (var object_set_id in this.object_set_updates) {
      updateValueInstant(
        object_set_id,
        'objectset',
        this.object_set_updates[object_set_id]
      )
    }
  }

  addTermDisabled(selected_set) {
    if (!selected_set) return true
    if (!this.state.termsingular) return true
    return false
  }

  addDiscipline(id) {
    this.setState((state, props) => {
      return { disciplines: [...state.disciplines, id], changed: true }
    })
  }

  removeDiscipline(id) {
    this.setState((state, props) => {
      return {
        disciplines: state.disciplines.filter((value) => value != id),
        changed: true
      }
    })
  }

  inputChanged(field, evt) {
    var new_state = { changed: true }
    new_state[field] = evt.target.value
    if (field === 'selected_set') new_state['termsingular'] = ''
    this.setState(new_state)
  }

  getActions() {
    var actions = []
    actions.push(
      <button className="secondary-button" onClick={this.close}>
        {window.gettext('Cancel')}
      </button>
    )
    actions.push(
      <button
        id="save-changes"
        className="primary-button"
        disabled={!this.state.changed}
        onClick={() => {
          updateValueInstant(this.state.id, 'project', {
            title: this.state.title,
            description: this.state.description,
            published: this.state.published,
            disciplines: this.state.disciplines
          })
          this.updateTerms()
          this.props.actionFunction({ ...this.state, changed: false })
          this.close()
        }}
      >
        {window.gettext('Save Changes')}
      </button>
    )
    return actions
  }

  // getLiveProjectSettings() {
  //   if (this.props.user_role === Constants.role_keys.teacher) {
  //     return (
  //       <div>
  //         <LiveProjectSettings
  //           // renderer={this.props.renderer}
  //           role={'teacher'}
  //           objectID={this.state.id}
  //           view_type={'settings'}
  //           updateLiveProject={this.props.actionFunction}
  //         />
  //       </div>
  //     )
  //   }
  //   return null
  // }

  autocompleteDiscipline() {
    const choices = this.state.all_disciplines
      .filter((discipline) => this.state.disciplines.indexOf(discipline.id) < 0)
      .map((discipline) => ({
        value: discipline.title,
        label: discipline.title,
        id: discipline.id
      }))
    $('#project-discipline-input')
      .autocomplete({
        source: choices,
        minLength: 0,
        focus: null,
        select: (evt, ui) => {
          this.addDiscipline(ui.item.id)
          $('#project-discipline-input').val('')
          return false
        }
      })
      .focus(function () {
        $('#project-discipline-input').autocomplete(
          'search',
          $('#project-discipline-input').val()
        )
      })
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    var data = this.state

    let disciplines
    if (data.all_disciplines) {
      disciplines = data.all_disciplines
        .filter((discipline) => data.disciplines.indexOf(discipline.id) >= 0)
        .map((discipline) => (
          <div className="flex-middle discipline-tag">
            {discipline.title}
            <span
              className="material-symbols-rounded green"
              onClick={this.removeDiscipline.bind(this, discipline.id)}
            >
              close
            </span>
          </div>
        ))
    }
    const title = Utility.unescapeCharacters(data.title || '')
    const description = Utility.unescapeCharacters(data.description || '')

    const object_sets = Constants.object_sets_types()
    const set_options = Object.keys(object_sets).map((key) => (
      <option value={key}>{object_sets[key]}</option>
    ))

    let selected_set
    if (this.state.selected_set)
      selected_set = object_sets[this.state.selected_set]
    const sets_added = data.object_sets.map((item) => (
      <div className="nomenclature-row">
        <div>{object_sets[item.term]}</div>
        <input
          value={item.title}
          onChange={this.termChanged.bind(this, item.id)}
        />
        <div
          className="nomenclature-delete-button"
          onClick={this.deleteTerm.bind(this, item.id)}
        >
          <span className="material-symbols-rounded filled green hover-shade">
            delete
          </span>
        </div>
      </div>
    ))

    const published_enabled = data.title && data.disciplines.length > 0
    if (data.published && !published_enabled)
      this.setState({ published: false })
    let disabled_publish_text
    if (!published_enabled)
      disabled_publish_text = window.gettext(
        'A title and at least one discipline is required for publishing.'
      )
    let add_term_css = 'material-symbols-rounded filled'
    let clickEvt
    if (this.addTermDisabled(selected_set)) {
      clickEvt = () => console.log('Disabled')
      add_term_css += ' grey'
    } else {
      clickEvt = this.addTerm.bind(this)
      add_term_css += ' green hover-shade'
    }
    return (
      <div className="message-wrap">
        <h2>{window.gettext('Edit project')}</h2>
        <div>
          <h4>{window.gettext('Title')}</h4>
          <textarea
            autoComplete="off"
            id="project-title-input"
            value={title}
            onChange={this.inputChanged.bind(this, 'title')}
          />
        </div>
        <div>
          <h4>{window.gettext('Description')}</h4>
          <textarea
            autoComplete="off"
            id="project-description-input"
            value={description}
            onChange={this.inputChanged.bind(this, 'description')}
          />
        </div>
        <div>
          <h4>{window.gettext('Disciplines')}</h4>
          <div className="flex-middle disciplines-div">{disciplines}</div>
          <input
            autoComplete="off"
            id="project-discipline-input"
            placeholder="Search"
          />
        </div>

        <div>
          <h4>{window.gettext('Object sets')}</h4>
          <div className="workflow-created">
            {'Define categories for outcomes or nodes'}
          </div>
          {sets_added}
          <div className="nomenclature-row">
            <select
              id="nomenclature-select"
              value={this.state.selected_set}
              onChange={this.inputChanged.bind(this, 'selected_set')}
            >
              <option value="none">{window.gettext('Select a type')}</option>
              {set_options}
            </select>
            <input
              placeholder={window.gettext('Set name')}
              type="text"
              id="term-singular"
              maxLength="50"
              value={this.state.termsingular}
              onChange={this.inputChanged.bind(this, 'termsingular')}
              disabled={selected_set == null}
            />
            <div className="nomenclature-add-button" onClick={clickEvt}>
              <span className={add_term_css}>add_circle</span>
            </div>
          </div>
        </div>

        {/*{this.getLiveProjectSettings()}*/}

        <div className="action-bar">{this.getActions()}</div>
        <div className="window-close-button" onClick={this.close}>
          <span className="material-symbols-rounded green">close</span>
        </div>
      </div>
    )
  }
}
export default ProjectEditDialog
