// @ts-nocheck
import * as React from 'react'
import { TitleText } from '@cfUIComponents'
import { getWeekByID } from '@cfFindState'
import { connect } from 'react-redux'
import {CfObjectType} from "@cfModule/types/enum";
// import $ from 'jquery'

/**
 * The week represenation for the "jump to" menu
 */
export class JumpToWeekViewUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = CfObjectType.WEEK
    this.objectClass = '.week'
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  jumpTo() {
    const week_id = this.props.data.id
    const week = $(".week-workflow[data-child-id='" + week_id + "'] > .week")
    if (week.length > 0) {
      const container = $('#container')

      $('#container').animate(
        {
          scrollTop:
            week.offset().top +
            container[0].scrollTop -
            container.offset().top -
            200
        },
        300
      )
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const renderer = this.props.renderer
    let default_text
    if (!renderer.is_strategy)
      default_text = data.week_type_display + ' ' + (this.props.rank + 1)
    let src = COURSEFLOW_APP.config.icon_path + 'plus.svg'
    if (data.is_dropped) src = COURSEFLOW_APP.config.icon_path + 'minus.svg'
    return (
      <div className="hover-shade" onClick={this.jumpTo.bind(this)}>
        <TitleText text={data.title} defaultText={default_text} />
      </div>
    )
  }
}
const mapWeekStateToProps = (state, own_props) =>
  getWeekByID(state, own_props.objectID)
const JumpToWeekView = connect(
  mapWeekStateToProps,
  null
)(JumpToWeekViewUnconnected)

export default JumpToWeekView
