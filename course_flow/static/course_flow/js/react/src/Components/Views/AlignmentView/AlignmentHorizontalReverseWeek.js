import * as React from 'react'
import * as reactDom from 'react-dom'
import { Provider, connect } from 'react-redux'
import { EditableComponentWithComments, TitleText } from '@cfCommonComponents'
import * as Utility from '@cfUtility'
import AlignmentHorizontalReverseNode from './AlignmentHorizontalReverseNode.js'

/**
 * The representation of a week in the alignment view.
 */
class AlignmentHorizontalReverseWeek extends EditableComponentWithComments {
  constructor(props) {
    super(props)
    this.objectType = 'week'
    this.state = {}
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data

    let default_text = data.week_type_display + ' ' + (this.props.week_rank + 1)

    let nodeweeks = this.props.nodeweeks.map((nodeweek) => {
      if (
        this.props.restriction_set &&
        this.props.restriction_set.nodes &&
        this.props.restriction_set.nodes.indexOf(nodeweek.node) == -1
      )
        return null
      return (
        <AlignmentHorizontalReverseNode
          objectID={nodeweek.node}
          renderer={this.props.renderer}
          restriction_set={this.props.restriction_set}
        />
      )
    })

    let comments
    if (this.props.renderer.view_comments) comments = this.addCommenting()

    return (
      <div
        className="week"
        ref={this.maindiv}
        style={this.get_border_style()}
        onClick={(evt) =>
          this.props.renderer.selection_manager.changeSelection(evt, this)
        }
      >
        <TitleText text={data.title} defaultText={default_text} />
        <div className="node-block">{nodeweeks}</div>
        {this.addEditable(data, true)}
        <div className="side-actions">
          <div className="comment-indicator-container"></div>
        </div>
        <div className="mouseover-actions">{comments}</div>
      </div>
    )
  }
}

const mapAlignmentHorizontalReverseWeekStateToProps = (state, own_props) => {
  for (var i = 0; i < state.week.length; i++) {
    if (state.week[i].id == own_props.objectID) {
      let week = state.week[i]
      let nodeweeks = Utility.filterThenSortByID(
        state.nodeweek,
        week.nodeweek_set
      )
      return { data: week, nodeweeks: nodeweeks }
    }
  }
}

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
export default connect(
  mapAlignmentHorizontalReverseWeekStateToProps,
  null
)(AlignmentHorizontalReverseWeek)
