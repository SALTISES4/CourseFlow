import * as React from 'react'
import WorkflowCardCondensed from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCardCondensed/index.jsx'
import Loader from '@cfCommonComponents/UIComponents/Loader.js'
import WorkflowCard from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard/index.jsx'
import { debounce } from '@cfUtility'
import { Workflow } from '@cfModule/types/common'
import { GridWrap } from '@cfModule/mui/helper'
import { libraryObjectsSearchQuery } from '@XMLHTTP/API/pages'

/*******************************************************
 * workflow filter is a shared component that
 *******************************************************/

type PropsType = {
  workflows: Workflow[]
  context: string
  read_only?: any
  project_data?: any
  updateWorkflow?: any
}

type Filters = { display: string; name: string }[]

type Sorts = { display: string; name: string }[]

type StateType = {
  workflows: Workflow[]
  activeFilter: number
  activeSort: number
  reversed: boolean
  searchResults: Workflow[]
  searchFilterLock: null | number | string
  searchFilter?: string
}

class WorkflowFilter extends React.Component<PropsType, StateType> {
  private readonly filters: Filters
  private readonly sorts: Sorts
  private readonly filterDOM: React.RefObject<HTMLDivElement>
  private readonly searchDOM: React.RefObject<HTMLDivElement>
  private readonly sortDOM: React.RefObject<HTMLDivElement>

  constructor(props: PropsType) {
    super(props)

    this.state = {
      workflows: props.workflows,
      activeFilter: 0,
      activeSort: 0,
      reversed: false,
      searchResults: [],
      searchFilterLock: null
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
    const url_params = new URL(window.location.href).searchParams
    if (url_params.get('favourites') === 'true') {
      this.setState({
        ...this.state,
        activeFilter: this.filters.findIndex(
          (elem) => elem.name === 'favourite'
        )
      })
    }
    if (this.props.context === 'library') {
      // @ts-ignore
      this.searchWithout = true // ??
    }
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
      this.setState({
        ...this.state,
        workflows: this.props.workflows
      })
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getPlaceholder() {
    if (this.props.context === 'project') {
      return window.gettext('Search the project')
    } else {
      return window.gettext('Search the library')
    }
  }

  sortWorkflows(workflows) {
    const sort = this.sorts[this.state.activeSort].name

    // Create a new sorted array
    const sortedWorkflows = [...workflows].sort((a, b) => {
      const aValue =
        sort === 'last_viewed' ? a.object_permission[sort] : a[sort]
      const bValue =
        sort === 'last_viewed' ? b.object_permission[sort] : b[sort]

      return String(aValue).localeCompare(String(bValue))
    })

    // Reverse the order if required
    if (this.state.reversed) {
      return sortedWorkflows.reverse()
    }

    return sortedWorkflows
  }

  sortChange(index) {
    if (this.state.activeSort === index) {
      this.setState({
        ...this.state,
        reversed: !this.state.reversed
      })
    } else {
      this.setState({
        ...this.state,
        activeSort: index,
        reversed: false
      })
    }
  }

  filterWorkflows(workflows) {
    const filter = this.filters[this.state.activeFilter].name
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

  searchWithin(request, responseFunction) {
    const workflows = this.state.workflows.filter(
      (workflow) => workflow.title.toLowerCase().indexOf(request) >= 0
    )
    responseFunction(workflows)
  }

  seeAll() {
    COURSEFLOW_APP.tinyLoader.startLoad()
    const { searchFilter } = this.state

    libraryObjectsSearchQuery(searchFilter, { nresults: 0 }, (responseData) => {
      this.setState({
        ...this.state,
        workflows: responseData.workflow_list,
        searchFilterLock: searchFilter
      })

      COURSEFLOW_APP.tinyLoader.endLoad()
      this.removeActiveFromDropdowns()
      this.disableWorkflowSearch()
    })
  }

  removeActiveFromDropdowns() {
    const dropdowns = document.querySelectorAll(
      '#workflow-search .create-dropdown'
    )
    dropdowns.forEach((dropdown) => dropdown.classList.remove('active'))
  }

  disableWorkflowSearch() {
    const workflowSearch = document.getElementById('workflow-search')
    if (workflowSearch) {
      workflowSearch.setAttribute('disabled', 'true')
    }

    const workflowSearchInput = document.getElementById('workflow-search-input')
    if (workflowSearchInput) {
      workflowSearchInput.setAttribute('disabled', 'true')
    }
  }

  searchChange(evt) {
    const searchTerm = evt.target.value

    // Exit early if the search term is empty
    if (!searchTerm) {
      this.setState({
        ...this.state,
        searchResults: [],
        searchFilter: ''
      })
      $(this.searchDOM.current).removeClass('active')
      return
    }

    // Set the search filter function based on the existence of this.searchWithout
    const searchFunction = this.searchWithout
      ? this.searchWithout
      : this.searchWithin
    const filter = searchTerm.toLowerCase()

    searchFunction.call(this, filter, (response) => {
      this.setState({
        ...this.state,
        searchResults: response,
        searchFilter: filter
      })
      $(this.searchDOM.current).addClass('active')
    })
  }

  searchWithout(request, response_function) {
    libraryObjectsSearchQuery(
      request,
      {
        nresults: 10
      },
      (responseData) => {
        response_function(responseData.workflow_list)
      }
    )
  }

  clearSearchLock(evt) {
    this.setState({
      ...this.state,
      workflows: this.props.workflows,
      searchFilterLock: null
    })
    $('#workflow-search').attr('disabled', String(false))
    $('#workflow-search-input').attr('disabled', String(false))
    evt.stopPropagation()
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  Filter = () => {
    const activeFilter = this.filters[this.state.activeFilter]

    const filters = this.filters.map((filter, i) => {
      let css_class = 'filter-option'
      if (this.state.activeFilter === i) css_class += ' active'

      return (
        <div
          className={css_class}
          onClick={() =>
            this.setState({
              ...this.state,
              activeFilter: i
            })
          }
        >
          {filter.display}
        </div>
      )
    })

    return (
      <div id="workflow-filter" ref={this.filterDOM} className="hover-shade">
        <div
          className={
            'workflow-sort-indicator hover-shade item-' +
            this.state.activeFilter
          }
        >
          <span className="material-symbols-rounded">filter_alt</span>
          <div>{activeFilter.display}</div>
        </div>
        <div className="create-dropdown">{filters}</div>
      </div>
    )
  }

  Sort = () => {
    const activeSort = this.sorts[this.state.activeSort]

    const sorts = this.sorts.map((sort, i) => {
      const cssClasses = [
        'filter-option',
        this.state.activeSort === i ? 'active' : ''
      ].join(' ')

      const SortDir = () => {
        if (this.state.activeSort !== i) {
          return <></>
        }

        if (this.state.reversed) {
          return <span className="material-symbols-rounded">north</span>
        }

        return <span className="material-symbols-rounded">south</span>
      }

      return (
        <div
          className={cssClasses}
          onClick={(evt) => {
            evt.stopPropagation()
            this.sortChange(i)
            //This is very hacky, but if we're updating we need to re-open the sort dropdown
            $(this.sortDOM.current)
              .children('.create-dropdown')
              .addClass('active')
          }}
        >
          <SortDir />
          {sort.display}
        </div>
      )
    })

    return (
      <div id="workflow-sort" ref={this.sortDOM} className="hover-shade">
        <div
          className={
            'workflow-sort-indicator hover-shade item-' + this.state.activeSort
          }
        >
          <span className="material-symbols-rounded">sort</span>
          <div>{activeSort.display}</div>
        </div>
        <div className="create-dropdown">{sorts}</div>
      </div>
    )
  }

  WorkflowCards = () => {
    if (!this.state.workflows) return <Loader />

    const sortedAndFilteredWorkflows = this.sortWorkflows(
      this.filterWorkflows(this.state.workflows)
    )
    return sortedAndFilteredWorkflows.map((workflow) => (
      <WorkflowCard
        key={workflow.type + workflow.id}
        workflowData={workflow}
        updateWorkflow={this.props.updateWorkflow}
        readOnly={this.props.read_only} // from renderer
        projectData={this.props.project_data} // from renderer
      />
    ))
  }

  SearchResults = () => {
    const { searchResults, searchFilter } = this.state
    const results = searchResults.map((workflow) => (
      <WorkflowCardCondensed
        key={workflow.type + workflow.id}
        workflowData={workflow}
        context={this.props.context}
      />
    ))

    if (searchFilter && !searchResults.length) {
      results.push(<div>{window.gettext('No results found')}</div>)
    } else if (results.length === 10) {
      results.push(
        <div className="hover-shade" onClick={this.seeAll}>
          {window.gettext('+ See all')}
        </div>
      )
    }
    return results
  }

  SearchFilterLock = () => {
    if (!this.state.searchFilterLock) return null

    return (
      <div className="search-filter-lock">
        <span
          onClick={this.clearSearchLock.bind(this)}
          className="material-symbols-rounded hover-shade"
        >
          close
        </span>
        {window.gettext('Search: ' + this.state.searchFilterLock)}
      </div>
    )
  }
  /*******************************************************
   * RENDER
   *******************************************************/

  render() {
    return (
      <>
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
            <div className="create-dropdown">
              <this.SearchResults />
            </div>
            <this.SearchFilterLock />
          </div>
          <div className="workflow-filter-sort">
            <this.Filter />
            <this.Sort />
          </div>
        </div>
        <GridWrap>
          <this.WorkflowCards />
        </GridWrap>
      </>
    )
  }
}

export default WorkflowFilter
