import * as React from 'react'
import WorkflowCard from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard'
import { debounce } from '@cfUtility'
import { searchAllObjectsQuery } from '@XMLHTTP/APIFunctions'
// import $ from 'jquery'
import { Discipline, QueryPages, Workflow } from '@cfModule/types/common'

type Filter = {
  name: string
  display: string
}

type PropsType = {
  disciplines: Discipline[]
  workflows: Workflow[]
  pages: QueryPages
  context: string
}

type StateType = {
  workflows: any
  pages: any
  hasSearched: any
  activeSort: any
  activeFilters: any
  activeDisciplines: any
  reversed: boolean
  fromSaltise: boolean
  contentRich: boolean
}

class ExploreFilter extends React.Component<PropsType, StateType> {
  private readonly filterDOM: React.RefObject<HTMLDivElement>
  private readonly searchDOM: React.RefObject<HTMLDivElement>
  private readonly sortDOM: React.RefObject<HTMLDivElement>
  private readonly disciplineDOM: React.RefObject<HTMLDivElement>
  private readonly filters: Filter[]
  private readonly sorts: Filter[]

  constructor(props: PropsType) {
    super(props)
    this.filters = [
      { name: 'activity', display: window.gettext('Activity') },
      { name: 'course', display: window.gettext('Course') },
      { name: 'program', display: window.gettext('Program') },
      { name: 'project', display: window.gettext('Project') }
    ]

    this.sorts = [
      { name: 'relevance', display: window.gettext('Relevance') },
      { name: 'title', display: window.gettext('A-Z') },
      { name: 'created_on', display: window.gettext('Creation date') }
    ]
    this.state = {
      workflows: this.props.workflows,
      pages: this.props.pages,
      hasSearched: false,
      activeSort: 0,
      activeFilters: [],
      activeDisciplines: [],
      reversed: false,
      fromSaltise: false,
      contentRich: true
    }
    this.filterDOM = React.createRef()
    this.searchDOM = React.createRef()
    this.sortDOM = React.createRef()
    this.disciplineDOM = React.createRef()
  }

  /*******************************************************
   * Lifecycle hooks
   *******************************************************/
  componentDidMount() {
    COURSEFLOW_APP.makeDropdown(this.disciplineDOM.current)
    COURSEFLOW_APP.makeDropdown(this.filterDOM.current)
    COURSEFLOW_APP.makeDropdown(this.sortDOM.current)
    COURSEFLOW_APP.makeDropdown(this.searchDOM.current)
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.workflows !== this.props.workflows)
      this.setState({ workflows: this.props.workflows })
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  getFilter() {
    return (
      <div id="workflow-filter" ref={this.filterDOM} className="hover-shade">
        <div
          className={
            'workflow-sort-indicator hover-shade item-' +
            this.state.activeFilters.length
          }
        >
          <span className="material-symbols-rounded">filter_alt</span>
          <div>{window.gettext('Type')}</div>
        </div>
        <div className="create-dropdown">
          {this.filters.map((filter, i) => {
            let css_class = 'filter-option flex-middle'
            if (this.state.activeFilters.indexOf(filter.name) >= 0)
              css_class += ' active'
            return (
              <div
                className={css_class}
                onClick={(evt) => {
                  evt.stopPropagation()
                  this.filterChange(filter)
                  //This is very hacky, but if we're updating we need to re-open the sort dropdown
                  $(this.filterDOM.current)
                    .children('.create-dropdown')
                    .addClass('active')
                }}
              >
                <input
                  type="checkbox"
                  checked={this.state.activeFilters.indexOf(filter.name) >= 0}
                />
                {filter.display}
              </div>
            )
          })}
        </div>
        <div
          data-attr-number={this.state.activeFilters.length}
          className="dropdown-number-indicator"
        >
          {this.state.activeFilters.length}
        </div>
      </div>
    )
  }

  getSort() {
    const active_sort = this.sorts[this.state.activeSort]
    return (
      <div id="workflow-sort" ref={this.sortDOM} className="hover-shade">
        <div
          className={
            'workflow-sort-indicator hover-shade item-' + this.state.activeSort
          }
        >
          <span className="material-symbols-rounded">sort</span>
          <div>{active_sort.display}</div>
        </div>
        <div className="create-dropdown">
          {this.sorts.map((sort, i) => {
            let sort_dir
            let css_class = 'filter-option filter-checkbox'
            if (this.state.activeSort == i) {
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
    if (this.state.activeSort === index)
      this.setState({
        reversed: !this.state.reversed,
        hasSearched: false
      })
    else
      this.setState({
        activeSort: index,
        reversed: false,
        hasSearched: false
      })
  }

  searchChange(evt) {
    this.setState({ hasSearched: false })
  }

  searchWithout(request, responseFunction, pageNumber = 1) {
    this.setState({
      hasSearched: true
    })
    COURSEFLOW_APP.tinyLoader.startLoad()
    searchAllObjectsQuery(
      request,
      {
        nresults: 20,
        published: true,
        full_search: true,
        disciplines: this.state.activeDisciplines,
        types: this.state.activeFilters,
        sort: this.sorts[this.state.activeSort].name,
        sort_reversed: this.state.reversed,
        page: pageNumber,
        fromSaltise: this.state.fromSaltise,
        contentRich: this.state.contentRich
      },
      (responseData) => {
        responseFunction(responseData.workflow_list, responseData.pages)
        COURSEFLOW_APP.tinyLoader.endLoad()
      }
    )
  }

  // not common
  getDisciplines() {
    return (
      <div
        id="workflow-disciplines"
        ref={this.disciplineDOM}
        className="hover-shade"
      >
        <div
          className={
            'workflow-sort-indicator hover-shade item-' +
            this.state.activeDisciplines.length
          }
        >
          <span className="material-symbols-rounded">science</span>
          <div>{window.gettext('Discipline')}</div>
        </div>
        <div className="create-dropdown">
          {this.props.disciplines.map((discipline, i) => {
            let css_class = 'filter-option flex-middle'
            if (this.state.activeDisciplines.indexOf(discipline.id) >= 0)
              css_class += ' active'
            return (
              <div
                className={css_class}
                onClick={(evt) => {
                  evt.stopPropagation()
                  this.disciplineChange(discipline)
                  //This is very hacky, but if we're updating we need to re-open the sort dropdown
                  $(this.disciplineDOM.current)
                    .children('.create-dropdown')
                    .addClass('active')
                }}
              >
                <input
                  type="checkbox"
                  checked={
                    this.state.activeDisciplines.indexOf(discipline.id) >= 0
                  }
                />
                {discipline.title}
              </div>
            )
          })}
        </div>
        <div
          data-attr-number={this.state.activeDisciplines.length}
          className="dropdown-number-indicator"
        >
          {this.state.activeDisciplines.length}
        </div>
      </div>
    )
  }
  getFromSaltise() {
    return (
      <div
        title={window.gettext(
          'Restrict results to content provided by SALTISE'
        )}
        id="content-rich"
        className="hover-shade"
        onClick={() => {
          this.setState({
            fromSaltise: !this.state.fromSaltise,
            hasSearched: false
          })
          this.doSearch()
        }}
      >
        <input type="checkbox" checked={this.state.fromSaltise} />
        <label>{window.gettext('SALTISE content')}</label>
      </div>
    )
  }

  searchResults(responseData, pages) {
    this.setState({ workflows: responseData, pages: pages })
  }

  filterChange(filter) {
    const name = filter.name
    const newFilter = this.state.activeFilters.slice()
    if (newFilter.indexOf(name) >= 0)
      newFilter.splice(newFilter.indexOf(name), 1)
    else newFilter.push(name)
    this.setState({ activeFilters: newFilter, hasSearched: false })
  }

  disciplineChange(discipline) {
    const name = discipline.id
    const newFilter = this.state.activeDisciplines.slice()
    if (newFilter.indexOf(name) >= 0)
      newFilter.splice(newFilter.indexOf(name), 1)
    else newFilter.push(name)
    this.setState({ activeDisciplines: newFilter, hasSearched: false })
  }

  toPage(number) {
    const inputElement: HTMLInputElement = $(this.searchDOM.current).children(
      '#workflow-search-input'
    )[0] as HTMLInputElement
    this.searchWithout(
      inputElement.value,
      this.searchResults.bind(this),
      number
    )
  }

  getPages() {
    if (this.state.workflows.length) {
      const pageButtons = [
        <button
          id="prev-page-button"
          disabled={this.state.pages.current_page === 1}
          onClick={this.toPage.bind(this, this.state.pages.current_page - 1)}
        >
          <span className="material-symbols-rounded">arrow_left</span>
        </button>
      ]
      if (this.state.pages.current_page > 3) {
        pageButtons.push(
          <button className="page-button" onClick={this.toPage.bind(this, 1)}>
            {1}
          </button>
        )
        if (this.state.pages.current_page > 4) {
          pageButtons.push(<div className="page-button no-button">...</div>)
        }
      }

      for (
        let i = Math.max(this.state.pages.current_page - 2, 1);
        i <=
        Math.min(
          this.state.pages.current_page + 2,
          this.state.pages.page_count
        );
        i++
      ) {
        let buttonClass = 'page-button'
        if (i === this.state.pages.current_page)
          buttonClass += ' active-page-button'
        pageButtons.push(
          <button className={buttonClass} onClick={this.toPage.bind(this, i)}>
            {i}
          </button>
        )
      }

      if (this.state.pages.current_page < this.state.pages.page_count - 2) {
        if (this.state.pages.current_page < this.state.pages.page_count - 3) {
          pageButtons.push(<div className="page-button no-button">...</div>)
        }
        pageButtons.push(
          <button
            className="page-button"
            onClick={this.toPage.bind(this, this.state.pages.page_count)}
          >
            {this.state.pages.page_count}
          </button>
        )
      }

      pageButtons.push(
        <button
          id="next-page-button"
          disabled={
            this.state.pages.current_page == this.state.pages.page_count
          }
          onClick={this.toPage.bind(this, this.state.pages.current_page + 1)}
        >
          <span className="material-symbols-rounded">arrow_right</span>
        </button>
      )

      return [
        <p>
          {window.gettext('Showing results')}{' '}
          {this.state.pages.results_per_page *
            (this.state.pages.current_page - 1) +
            1}
          -{this.state.pages.results_per_page * this.state.pages.current_page} (
          {this.state.pages.total_results} {window.gettext('total results')})
        </p>,
        <div className="explore-page-buttons">{pageButtons}</div>
      ]
    } else {
      return <p>{window.gettext('No results were found.')}</p>
    }
  }
  doSearch() {
    const inputEl: HTMLInputElement = $(this.searchDOM.current).children(
      '#workflow-search-input'
    )[0] as HTMLInputElement
    this.searchWithout(inputEl.value, this.searchResults.bind(this))
  }
  getInfo() {
    if (this.state.workflows === this.props.workflows)
      return (
        <p>
          {window.gettext(
            "Enter a search term or filter then click 'search' to get started."
          )}
        </p>
      )
    return null
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const workflows = this.state.workflows.map((workflow) => (
      <WorkflowCard
        key={workflow.type + workflow.id}
        workflowData={workflow}
        // context={this.props.context} @todo this is no used in component, check git history if bad refactor
      />
    ))
    return [
      <div className="workflow-filter-top">
        <div className="flex-middle">
          <div id="workflow-search" ref={this.searchDOM}>
            <input
              placeholder={window.gettext('Search the public library')}
              onChange={debounce(this.searchChange.bind(this))}
              id="workflow-search-input"
              className="search-input"
            />
            <span className="material-symbols-rounded">search</span>
          </div>
          <button
            className="primary-button"
            disabled={this.state.hasSearched}
            onClick={this.doSearch.bind(this)}
          >
            {window.gettext('Search')}
          </button>
        </div>
        <div className="workflow-filter-sort">
          {this.getFromSaltise()}
          {this.getFilter()}
          {this.getDisciplines()}
          {this.getSort()}
        </div>
      </div>,
      this.getInfo(),
      <div className="menu-grid">{workflows}</div>,
      this.getPages()
    ]
  }
}
export default ExploreFilter
