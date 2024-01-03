import * as React from 'react'
import { connect } from 'react-redux'
import { OutcomeTitle, WeekTitle } from '@cfUIComponents'
import {
  getOutcomeByID,
  getWeekByID,
  getSortedOutcomesFromOutcomeWorkflowSet
} from '@cfFindState'
import * as Utility from '@cfUtility'
import AlignmentOutcomesBlock from './AlignmentOutcomesBlock'
import AlignmentHorizontalReverseBlock from './AlignmentHorizontalReverseBlock'

/**
 *Alignment View, also called analytics view.
 *This requires the child outcome data to be present in the redux state.
 */
class AlignmentView extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'workflow'
    this.state = { active: 0, active2: 0, sort: 'outcome' }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  /**
   * Changes the view to either a specific term (week) or an outcome
   */
  changeView(index, sort, index2 = 0) {
    this.setState({ active: index, sort: sort, active2: index2 })
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    //Choices of outcomes to sort by
    let view_buttons_outcomes = this.props.outcomes.map((category, i) => {
      return [
        <h4>{category.objectset.title}:</h4>,
        <div className="workflow-view-select hide-print">
          {category.outcomes.map((outcome, j) => {
            let view_class = 'hover-shade'
            if (
              this.state.sort == 'outcome' &&
              i == this.state.active &&
              j == this.state.active2
            )
              view_class += ' active'
            return (
              <div
                id={'button-outcome-' + outcome.data.id}
                className={view_class}
                onClick={this.changeView.bind(this, i, 'outcome', j)}
              >
                <OutcomeTitle
                  data={outcome.data}
                  prefix={outcome.prefix}
                  hovertext={outcome.hovertext}
                />
              </div>
            )
          })}
        </div>
      ]
    })
    //Choices of terms (weeks) to sort by
    const view_buttons_terms = this.props.terms.map((week, i) => {
      let view_class = 'hover-shade'
      if (this.state.sort == 'week' && i == this.state.active)
        view_class += ' active'
      return (
        <div
          id={'button-week-' + week.id}
          className={view_class}
          onClick={this.changeView.bind(this, i, 'week')}
        >
          <WeekTitle data={week} rank={i} />
        </div>
      )
    })

    let outcomes_block
    let terms_block
    let alignment_block
    let alignment_reverse_block

    let outcome_data
    if (this.state.sort == 'outcome') {
      const found = false
      try {
        outcome_data =
          this.props.outcomes[this.state.active].outcomes[this.state.active2]
            .data
      } catch (err) {
        for (var i = 0; i < this.props.outcomes.length; i++) {
          if (this.props.outcomes[i].outcomes.length >= 1) {
            this.changeView(i, 'outcome', 0)
            return null
          }
        }
        if (this.state.active != -1 || this.state.active2 != 0) {
          this.changeView(-1, 'outcome', 0)
          return null
        }
      }
    }

    if (this.state.active == -1) {
      view_buttons_outcomes = gettext(
        'No outcomes have been added yet. Use the Edit Outcomes menu to get started'
      )
    } else if (this.state.sort == 'outcome') {
      outcomes_block = (
        <AlignmentOutcomesBlock
          workflow_type={data.type}
          renderer={this.props.renderer}
          data={outcome_data}
          outcomes_type={data.outcomes_type}
        />
      )
      alignment_reverse_block = (
        <AlignmentHorizontalReverseBlock
          sort="outcome"
          renderer={this.props.renderer}
          data={outcome_data}
          outcomes_type={data.outcomes_type}
        />
      )
    }

    if (this.state.sort == 'week') {
      alignment_reverse_block = (
        <AlignmentHorizontalReverseBlock
          sort="week"
          renderer={this.props.renderer}
          data={this.props.terms[this.state.active]}
          base_outcomes={this.props.outcomes}
          outcomes_type={data.outcomes_type}
        />
      )
    }

    return (
      <div className="workflow-details">
        <h3>{gettext('Filters')}:</h3>
        {view_buttons_outcomes}
        <h4>{gettext('Sections')}:</h4>
        <div className="workflow-view-select hide-print">
          {view_buttons_terms}
        </div>
        {outcomes_block}
        {terms_block}
        {alignment_block}
        {alignment_reverse_block}
      </div>
    )
  }
}
const mapAlignmentStateToProps = (state) => {
  const outcomes = getSortedOutcomesFromOutcomeWorkflowSet(
    state,
    state.workflow.outcomeworkflow_set
  ).map((category) => ({
    ...category,
    outcomes: category.outcomes.map((outcome) =>
      getOutcomeByID(state, outcome.id)
    )
  }))
  return {
    data: state.workflow,
    outcomes: outcomes,
    terms: Utility.filterThenSortByID(
      state.weekworkflow,
      state.workflow.weekworkflow_set
    ).map((wwf) => getWeekByID(state, wwf.week).data)
  }
}
/*******************************************************
 * CONNECT REDUX
 *******************************************************/
export default connect(mapAlignmentStateToProps, null)(AlignmentView)
