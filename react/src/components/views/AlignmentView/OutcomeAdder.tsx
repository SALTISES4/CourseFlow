import * as React from 'react'
import { connect } from 'react-redux'
import { getOutcomeTitle } from '@cfCommonComponents/UIComponents/Titles'
import { getOutcomeByID, TGetOutcomeByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
// import $ from 'jquery'

type ConnectedProps = TGetOutcomeByID
type OwnProps = {
  objectID: number
}

type PropsType = ConnectedProps & OwnProps

class OutcomeAdderOptionUnconnected extends React.Component<PropsType> {
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

const mapOutcomeStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TGetOutcomeByID => {
  return getOutcomeByID(state, ownProps.objectID)
}

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const OutcomeAdderOption = connect<ConnectedProps, object, OwnProps, AppState>(
  mapOutcomeStateToProps,
  null
)(OutcomeAdderOptionUnconnected)

/**
 * A small module to add missing outcomes in the alignment view to a node
 */

type OutcomeAdderProps = {
  // renderer: any
  outcome_set: any
  addFunction: any
}
class OutcomeAdder extends React.Component<OutcomeAdderProps> {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  onChange(evt) {
    if (evt.target.value == 0) return
    COURSEFLOW_APP.tinyLoader.startLoad()
    this.props.addFunction(evt.target.value, 1, (response_data) => {
      COURSEFLOW_APP.tinyLoader.endLoad()
    })
    $('.outcome-adder').val(0)
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const options = this.props.outcome_set.map((outcome) => (
      <OutcomeAdderOption objectID={outcome} />
    ))

    return (
      <select className="outcome-adder" onChange={this.onChange.bind(this)}>
        <option value={0}>{window.gettext('Add outcome')}</option>
        {options}
      </select>
    )
  }
}

export default OutcomeAdder
