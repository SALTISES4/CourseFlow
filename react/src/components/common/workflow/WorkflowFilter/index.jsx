import * as React from 'react'
import { Component } from '@cfParentComponents'
import { searchAllObjects } from '@XMLHTTP/PostFunctions'
import WorkflowLoader from '@cfUIComponents/WorkflowLoader.jsx'
import WorkflowCardCondensed from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCardCondensed'
import WorkflowCard from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard'


/*******************************************************
 * workflow filter is a shared component that
 *******************************************************/
class WorkflowFilter extends Component {

  constructor(props) {
    super(props)

    this.state = {
      workflows: props.workflows,
      active_filter: 0,
      active_sort: 0,
      reversed: false,
      search_results: []
    }
    this.filters = [
      { name: 'all', display: window.gettext('All') },
      { name: 'owned', display: window.gettext('Owned') },
      { name: 'shared', display: window.gettext('Shared') },
      { name: 'favourite', display: window.gettext('My Favourites') },
      { name: 'archived', display: window.gettext('Archived') }
    ]
    this.sorts = [
      { name: 'last_viewed', display: window.gettext('Recent') },
      { name: 'title', display: window.gettext('A-Z') },
      { name: 'created_on', display: window.gettext('Creation date') },
      { name: 'type', display: window.gettext('Type') }
    ]
    let url_params = new URL(window.location.href).searchParams
    if (url_params.get('favourites') === 'true')
      this.state.active_filter = this.filters.findIndex(
        (elem) => elem.name === 'favourite'
      )
    if (this.props.context === 'library') this.search_without = true
    this.filterDOM = React.createRef()
    this.searchDOM = React.createRef()
    this.sortDOM = React.createRef()
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    COURSEFLOW_APP.makeDropdown(this.filterDOM.current)
    COURSEFLOW_APP.makeDropdown(this.sortDOM.current)
    COURSEFLOW_APP.makeDropdown(this.searchDOM.current)
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.workflows !== this.props.workflows)
      this.setState({ workflows: this.props.workflows })
  }

  /*******************************************************
   *  FUNCTIONS
   *******************************************************/
  getPlaceholder() {
    if (this.props.context === 'project') {
      return window.gettext('Search the project')
    } else {
      return window.gettext('Search the library')
    }
  }

  sortWorkflows(workflows) {
    let sort = this.sorts[this.state.active_sort].name
    if (sort === 'last_viewed') {
      workflows = workflows.sort((a, b) =>
        ('' + a.object_permission[sort]).localeCompare(
          b.object_permission[sort]
        )
      )
      if (!this.state.reversed) return workflows.reverse()
      return workflows
    } else
      workflows = workflows.sort((a, b) =>
        ('' + a[sort]).localeCompare(b[sort])
      )
    if (this.state.reversed) return workflows.reverse()
    return workflows
  }

  filterWorkflows(workflows) {
    let filter = this.filters[this.state.active_filter].name
    if (filter !== 'archived')
      workflows = workflows.filter((workflow) => !workflow.deleted)
    else return workflows.filter((workflow) => workflow.deleted)
    if (filter === 'owned')
      return workflows.filter((workflow) => workflow.is_owned)
    if (filter === 'shared')
      return workflows.filter((workflow) => !workflow.is_owned)
    if (filter === 'favourite')
      return workflows.filter((workflow) => workflow.favourite)
    return workflows
  }

  getFilter() {
    let active_filter = this.filters[this.state.active_filter]
    return (
      <div id="workflow-filter" ref={this.filterDOM} className="hover-shade">
        <div
          className={
            'workflow-sort-indicator hover-shade item-' +
            this.state.active_filter
          }
        >
          <span className="material-symbols-rounded">filter_alt</span>
          <div>{active_filter.display}</div>
        </div>
        <div className="create-dropdown">
          {this.filters.map((filter, i) => {
            let css_class = 'filter-option'
            if (this.state.active_filter === i) css_class += ' active'
            return (
              <div
                className={css_class}
                onClick={() => this.setState({ active_filter: i })}
              >
                {filter.display}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  getSort() {
    let active_sort = this.sorts[this.state.active_sort]
    return (
      <div id="workflow-sort" ref={this.sortDOM} className="hover-shade">
        <div
          className={
            'workflow-sort-indicator hover-shade item-' + this.state.active_sort
          }
        >
          <span className="material-symbols-rounded">sort</span>
          <div>{active_sort.display}</div>
        </div>
        <div className="create-dropdown">
          {this.sorts.map((sort, i) => {
            let sort_dir
            let css_class = 'filter-option'
            if (this.state.active_sort === i) {
              css_class += ' active'
              if (this.state.reversed)
                sort_dir = (
                  <span className="material-symbols-rounded">north</span>
                )
              else
                sort_dir = (
                  <span className="material-symbols-rounded">south</span>
                )
            }
            return (
              <div
                className={css_class}
                onClick={(evt) => {
                  evt.stopPropagation()
                  this.sortChange(i)
                  //This is very hacky, but if we're updating we need to re-open the sort dropdown
                  $(this.sortDOM.current)
                    .children('.create-dropdown')
                    .addClass('active')
                }}
              >
                {sort_dir}
                {sort.display}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  sortChange(index) {
    if (this.state.active_sort === index)
      this.setState({ reversed: !this.state.reversed })
    else this.setState({ active_sort: index, reversed: false })
  }

  searchChange(evt) {
    let component = this
    if (evt.target.value && evt.target.value !== '') {
      let filter = evt.target.value.toLowerCase()
      if (this.search_without)
        component.searchWithout(filter, (response) => {
          component.setState({
            search_results: response,
            search_filter: filter
          })
          $(this.searchDOM.current).addClass('active')
        })
      else
        component.searchWithin(filter, (response) => {
          component.setState({
            search_results: response,
            search_filter: filter
          })
          $(this.searchDOM.current).addClass('active')
        })
    } else {
      component.setState({ search_results: [], search_filter: '' })
      $(this.searchDOM.current).removeClass('active')
    }
  }

  searchWithin(request, response_function) {
    let workflows = this.state.workflows.filter(
      (workflow) => workflow.title.toLowerCase().indexOf(request) >= 0
    )
    response_function(workflows)
  }

  searchWithout(request, response_function) {
    searchAllObjects(
      request,
      {
        nresults: 10
      },
      (response_data) => {
        response_function(response_data.workflow_list)
      }
    )
  }

  seeAll() {
    COURSEFLOW_APP.tinyLoader.startLoad()
    let search_filter = this.state.search_filter
    searchAllObjects(search_filter, { nresults: 0 }, (response_data) => {
      this.setState({
        workflows: response_data.workflow_list,
        search_filter_lock: search_filter
      })
      COURSEFLOW_APP.tinyLoader.endLoad()

      // Remove class from elements
      var dropdowns = document.querySelectorAll(
        '#workflow-search .create-dropdown'
      )
      dropdowns.forEach(function (dropdown) {
        dropdown.classList.remove('active')
      })

      // Set attribute 'disabled' to true for elements
      var workflowSearch = document.getElementById('workflow-search')
      if (workflowSearch) {
        workflowSearch.setAttribute('disabled', true)
      }

      var workflowSearchInput = document.getElementById('workflow-search-input')
      if (workflowSearchInput) {
        workflowSearchInput.setAttribute('disabled', true)
      }
    })
  }

  clearSearchLock(evt) {
    this.setState({ workflows: this.props.workflows, search_filter_lock: null })
    $('#workflow-search').attr('disabled', false)
    $('#workflow-search-input').attr('disabled', false)
    evt.stopPropagation()
  }

  defaultRender() {
    return <WorkflowLoader />
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let workflows
    if (!this.state.workflows) workflows = this.defaultRender()
    else {
      workflows = this.sortWorkflows(this.filterWorkflows(this.state.workflows))
      workflows = workflows.map((workflow) => (
        <WorkflowCard
          renderer={this.props.renderer}
          key={workflow.type + workflow.id}
          workflow_data={workflow}
          context={this.props.context}
          updateWorkflow={this.props.updateWorkflow}
        />
      ))
    }
    let search_results = this.state.search_results.map((workflow) => (
      <WorkflowCardCondensed
        key={workflow.type + workflow.id}
        workflow_data={workflow}
        context={this.props.context}
      />
    ))
    if (
      this.state.search_filter &&
      this.state.search_filter.length > 0 &&
      this.state.search_results.length === 0
    ) {
      search_results.push(<div>{window.gettext('No results found')}</div>)
    } else if (search_results.length === 10) {
      search_results.push(
        <div className="hover-shade" onClick={() => this.seeAll()}>
          {window.gettext('+ See all')}
        </div>
      )
    }
    let search_filter_lock
    if (this.state.search_filter_lock) {
      search_filter_lock = (
        <div className="search-filter-lock">
          <span
            onClick={this.clearSearchLock.bind(this)}
            className="material-symbols-rounded hover-shade"
          >
            close
          </span>
          {window.gettext('Search: ' + this.state.search_filter_lock)}
        </div>
      )
    }
    return [
      <div className="workflow-filter-top">
        <div id="workflow-search" ref={this.searchDOM}>
          <input
            placeholder={this.getPlaceholder()}
            onChange={debounce(this.searchChange.bind(this))}
            id="workflow-search-input"
            className="search-input"
            autoComplete="off"
          />
          <span className="material-symbols-rounded">search</span>
          <div className="create-dropdown">{search_results}</div>
          {search_filter_lock}
        </div>
        <div className="workflow-filter-sort">
          {this.getFilter()}
          {this.getSort()}
        </div>
      </div>,
      <div className="menu-grid">{workflows}</div>
    ]
  }
}

export default WorkflowFilter
