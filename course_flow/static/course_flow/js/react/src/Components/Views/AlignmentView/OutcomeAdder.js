import * as React from 'react'
import * as reactDom from 'react-dom'
import { Provider, connect } from 'react-redux'
import { getOutcomeTitle, WeekTitle } from '@cfCommonComponents'
import { getOutcomeByID } from '@cfFindState'

/**
 * A small module to add missing outcomes in the alignment view to a node
 */

export default class extends React.Component {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  onChange(evt) {
    if (evt.target.value == 0) return
    this.props.renderer.tiny_loader.startLoad()
    this.props.addFunction(evt.target.value, 1, (response_data) => {
      this.props.renderer.tiny_loader.endLoad()
    })
    $('.outcome-adder').val(0)
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let options = this.props.outcome_set.map((outcome) => (
      <OutcomeAdderOption objectID={outcome} />
    ))

    return (
      <select className="outcome-adder" onChange={this.onChange.bind(this)}>
        <option value={0}>{gettext('Add outcome')}</option>
        {options}
      </select>
    )
  }
}

class OutcomeAdderOptionUnconnected extends React.Component {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    return (
      <option value={this.props.objectID}>
        {'\u00A0 '.repeat(this.props.data.depth) +
          getOutcomeTitle(this.props.data, this.props.prefix)}
      </option>
    )
  }
}
const mapOutcomeStateToProps = (state, own_props) =>
  getOutcomeByID(state, own_props.objectID)

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const OutcomeAdderOption = connect(
  mapOutcomeStateToProps,
  null
)(OutcomeAdderOptionUnconnected)
