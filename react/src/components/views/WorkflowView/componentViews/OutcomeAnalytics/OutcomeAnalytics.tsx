import { OutcomeTitle } from '@cf/components/common/UIPrimitives/Titles.ts'
import { _t } from '@cf/utility/utilityFunctions'
import { WeekTitle } from '@cfComponents/UIPrimitives/Titles'
import {
  getOutcomeByID,
  getSortedOutcomesFromOutcomeWorkflowSet,
  getWeekById
} from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import * as Utility from '@cfUtility'
import * as React from 'react'
import { connect } from 'react-redux'

import AlignmentHorizontalReverseBlock from './components/AlignmentHorizontalReverseBlock'
import AlignmentOutcomesBlock from './components/AlignmentOutcomesBlock'

type ConnectedProps = {
  data: any
  outcomes: any
  terms: any
}
type OwnProps = NonNullable<unknown>
type StateProps = any
type PropsType = ConnectedProps & OwnProps

/**
 *Alignment View, also called analytics view.
 *This requires the child outcome data to be present in the redux state.
 */
class OutcomeAnalyticsUnconnected extends React.Component<
  PropsType,
  StateProps
> {
  constructor(props: PropsType) {
    super(props)
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
    let viewButtonsOutcomes = this.props.outcomes.map((category, i) => {
      return [
        <h4>{category.objectset.title}:</h4>,
        <div className=" hide-print">
          {category.outcomes.map((outcome, j) => {
            let viewClass = 'hover-shade'
            if (
              this.state.sort == 'outcome' &&
              i == this.state.active &&
              j == this.state.active2
            ) {
              viewClass += ' active'
            }
            return (
              <div
                id={'button-outcome-' + outcome.data.id}
                className={viewClass}
                onClick={this.changeView.bind(this, i, 'outcome', j)}
              >
                <OutcomeTitle
                  title={outcome.title}
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
    const viewButtonsTerms = this.props.terms.map((week, index: number) => {
      let viewClass = 'hover-shade'
      if (this.state.sort == 'week' && index == this.state.active) {
        viewClass += ' active'
      }
      return (
        <div
          key={index}
          id={'button-week-' + week.id}
          className={viewClass}
          // @ts-ignore
          onClick={this.changeView.bind(this, index, 'week')}
        >
          <WeekTitle data={week} rank={index} />
        </div>
      )
    })

    let outcomesBlock
    let termsBlock
    let alignmentBlock
    let alignmentReverseBlock

    let outcomeData
    if (this.state.sort == 'outcome') {
      const found = false
      try {
        outcomeData =
          this.props.outcomes[this.state.active].outcomes[this.state.active2]
            .data
      } catch (err) {
        for (let i = 0; i < this.props.outcomes.length; i++) {
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
      viewButtonsOutcomes = _t(
        'No outcomes have been added yet. Use the Edit Outcomes menu to get started'
      )
    } else if (this.state.sort == 'outcome') {
      outcomesBlock = (
        <AlignmentOutcomesBlock workflowType={data.type} data={outcomeData} />
      )
      alignmentReverseBlock = (
        <AlignmentHorizontalReverseBlock sort="outcome" data={outcomeData} />
      )
    }

    if (this.state.sort == 'week') {
      alignmentReverseBlock = (
        <AlignmentHorizontalReverseBlock
          sort="week"
          data={this.props.terms[this.state.active]}
          baseOutcomes={this.props.outcomes}
        />
      )
    }

    return (
      <div className="workflow-details">
        <h3>{_t('Filters')}:</h3>
        {viewButtonsOutcomes}
        <h4>{_t('Sections')}:</h4>
        <div className="hide-print">{viewButtonsTerms}</div>
        {outcomesBlock}
        {termsBlock}
        {alignmentBlock}
        {alignmentReverseBlock}
      </div>
    )
  }
}
const mapStateToProps = (state: AppState): ConnectedProps => {
  const outcomes = getSortedOutcomesFromOutcomeWorkflowSet(
    state,
    state.workflow.outcomeworkflowSet
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
      state.workflow.weekworkflowSet
      // @ts-ignore
    ).map((wwf) => getWeekById(state, wwf.week).data)
  }
}
/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const OutcomeAnalytics = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(OutcomeAnalyticsUnconnected)

export default OutcomeAnalytics
