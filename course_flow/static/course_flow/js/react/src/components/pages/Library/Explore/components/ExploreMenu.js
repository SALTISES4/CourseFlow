import * as React from 'react'
import { searchAllObjects } from '@XMLHTTP/PostFunctions.js'
import WorkflowCard from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard'
import WorkflowFilter from '@cfCommonComponents/workflow/WorkflowFilter'
import LibraryMenu from '@cfModule/components/pages/Library/Library/components/LibraryMenu.js'

// from renderer:
//   initial_pages
//   tiny loader
class ExploreFilter extends WorkflowFilter {
  constructor(props) {
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
      workflows: props.workflows,
      pages: this.props.renderer.initial_pages,
      has_searched: false,
      active_sort: 0,
      active_filters: [],
      active_disciplines: [],
      reversed: false,
      from_saltise: false,
      content_rich: true
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
    super.componentDidMount()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  doSearch() {
    this.searchWithout(
      $(this.searchDOM.current).children('#workflow-search-input')[0].value,
      this.searchResults.bind(this)
    )
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

  getPages() {
    if (this.state.workflows.length > 0) {
      let page_buttons = [
        <button
          id="prev-page-button"
          disabled={this.state.pages.current_page == 1}
          onClick={this.toPage.bind(this, this.state.pages.current_page - 1)}
        >
          <span className="material-symbols-rounded">arrow_left</span>
        </button>
      ]
      if (this.state.pages.current_page > 3) {
        page_buttons.push(
          <button className="page-button" onClick={this.toPage.bind(this, 1)}>
            {1}
          </button>
        )
        if (this.state.pages.current_page > 4) {
          page_buttons.push(<div className="page-button no-button">...</div>)
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
        let button_class = 'page-button'
        if (i === this.state.pages.current_page)
          button_class += ' active-page-button'
        page_buttons.push(
          <button className={button_class} onClick={this.toPage.bind(this, i)}>
            {i}
          </button>
        )
      }

      if (this.state.pages.current_page < this.state.pages.page_count - 2) {
        if (this.state.pages.current_page < this.state.pages.page_count - 3) {
          page_buttons.push(<div className="page-button no-button">...</div>)
        }
        page_buttons.push(
          <button
            className="page-button"
            onClick={this.toPage.bind(this, this.state.pages.page_count)}
          >
            {this.state.pages.page_count}
          </button>
        )
      }

      page_buttons.push(
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
        <div className="explore-page-buttons">{page_buttons}</div>
      ]
    } else {
      return <p>{window.gettext('No results were found.')}</p>
    }
  }

  toPage(number) {
    this.searchWithout(
      $(this.searchDOM.current).children('#workflow-search-input')[0].value,
      this.searchResults.bind(this),
      number
    )
  }

  getFilter() {
    return (
      <div id="workflow-filter" ref={this.filterDOM} className="hover-shade">
        <div
          className={
            'workflow-sort-indicator hover-shade item-' +
            this.state.active_filters.length
          }
        >
          <span className="material-symbols-rounded">filter_alt</span>
          <div>{window.gettext('Type')}</div>
        </div>
        <div className="create-dropdown">
          {this.filters.map((filter, i) => {
            let css_class = 'filter-option flex-middle'
            if (this.state.active_filters.indexOf(filter.name) >= 0)
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
                  checked={this.state.active_filters.indexOf(filter.name) >= 0}
                />
                {filter.display}
              </div>
            )
          })}
        </div>
        <div
          attr_number={this.state.active_filters.length}
          className="dropdown-number-indicator"
        >
          {this.state.active_filters.length}
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
            let css_class = 'filter-option filter-checkbox'
            if (this.state.active_sort == i) {
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
            this.state.active_disciplines.length
          }
        >
          <span className="material-symbols-rounded">science</span>
          <div>{window.gettext('Discipline')}</div>
        </div>
        <div className="create-dropdown">
          {this.props.disciplines.map((discipline, i) => {
            let css_class = 'filter-option flex-middle'
            if (this.state.active_disciplines.indexOf(discipline.id) >= 0)
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
                    this.state.active_disciplines.indexOf(discipline.id) >= 0
                  }
                />
                {discipline.title}
              </div>
            )
          })}
        </div>
        <div
          attr_number={this.state.active_disciplines.length}
          className="dropdown-number-indicator"
        >
          {this.state.active_disciplines.length}
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
            from_saltise: !this.state.from_saltise,
            has_searched: false
          })
          this.doSearch()
        }}
      >
        <input type="checkbox" checked={this.state.from_saltise} />
        <label>{window.gettext('SALTISE content')}</label>
      </div>
    )
  }

  searchResults(response_data, pages) {
    this.setState({ workflows: response_data, pages: pages })
  }

  filterChange(filter, evt) {
    let name = filter.name
    let new_filter = this.state.active_filters.slice()
    if (new_filter.indexOf(name) >= 0)
      new_filter.splice(new_filter.indexOf(name), 1)
    else new_filter.push(name)
    this.setState({ active_filters: new_filter, has_searched: false })
  }

  sortChange(index) {
    if (this.state.active_sort === index)
      this.setState({
        reversed: !this.state.reversed,
        has_searched: false
      })
    else
      this.setState({
        active_sort: index,
        reversed: false,
        has_searched: false
      })
  }

  disciplineChange(discipline) {
    let name = discipline.id
    let new_filter = this.state.active_disciplines.slice()
    if (new_filter.indexOf(name) >= 0)
      new_filter.splice(new_filter.indexOf(name), 1)
    else new_filter.push(name)
    this.setState({ active_disciplines: new_filter, has_searched: false })
  }

  searchChange(evt) {
    this.setState({ has_searched: false })
  }

  searchWithout(request, response_function, page_number = 1) {
    this.setState({ has_searched: true })
    this.props.renderer.tiny_loader.startLoad()
    searchAllObjects(
      request,
      {
        nresults: 20,
        published: true,
        full_search: true,
        disciplines: this.state.active_disciplines,
        types: this.state.active_filters,
        sort: this.sorts[this.state.active_sort].name,
        sort_reversed: this.state.reversed,
        page: page_number,
        from_saltise: this.state.from_saltise,
        content_rich: this.state.content_rich
      },
      (response_data) => {
        response_function(response_data.workflow_list, response_data.pages)
        this.props.renderer.tiny_loader.endLoad()
      }
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let workflows = this.state.workflows.map((workflow) => (
      <WorkflowCard
        key={workflow.type + workflow.id}
        workflow_data={workflow}
        context={this.props.context}
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
            disabled={this.state.has_searched}
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

// @todo fix consitent props drilling
// this.props.disciplines
//  this.props.renderer.initial_workflows
// etc
class ExploreMenu extends LibraryMenu {
  render() {
    return (
      <div className="project-menu">
        <ExploreFilter
          // @todo from renderer:
          // initial_pages
          // tiny loader
          disciplines={this.props.disciplines}
          renderer={this.props.renderer}
          workflows={this.props.renderer.initial_workflows}
          pages={this.props.renderer.initial_pages}
          context="library"
        />
      </div>
    )
  }
}

export default ExploreMenu
