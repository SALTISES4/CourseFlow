import * as React from 'react'
import { Provider, connect } from 'react-redux'
import * as Constants from '../../Constants.js'
import { Component } from './CommonComponents/Extended'
import { getStrategyByID } from '../../redux/FindState.js'


//Basic component to represent a Strategy
class StrategyView extends Component {
  constructor(props) {
    super(props)
    this.objectType = 'strategy'
    this.objectClass = '.strategy'
    this.node_block = React.createRef()
  }

  render() {
    let data = this.props.data
    var title
    if (data) title = data.title
    if (!title) title = 'untitled strategy'
    let strategy_icon
    if (data.strategy_icon)
      strategy_icon = (
        <img
          src={
            window.config.icon_path +
            Constants.strategy_keys[data.strategy_icon] +
            '.svg'
          }
        />
      )
    return (
      <div
        className="strategy-bar-strategy strategy new-strategy"
        ref={this.maindiv}
      >
        {strategy_icon}
        <div>{title}</div>
      </div>
    )
  }

  makeDraggable() {
    let draggable_selector = 'week-workflow'
    let draggable_type = 'weekworkflow'
    $(this.maindiv.current).draggable({
      helper: (e, item) => {
        var helper = $(document.createElement('div'))
        helper.addClass('week-ghost')
        helper.appendTo(document.body)
        return helper
      },
      cursor: 'move',
      cursorAt: { top: 20, left: 100 },
      distance: 10,
      start: (e, ui) => {
        $('.workflow-canvas').addClass('dragging-' + draggable_type)
        $(draggable_selector).addClass('dragging')
      },
      stop: (e, ui) => {
        $('.workflow-canvas').removeClass('dragging-' + draggable_type)
        $(draggable_selector).removeClass('dragging')
      }
    })
  }

  componentDidMount() {
    this.makeDraggable()
    $(this.maindiv.current)[0].dataDraggable = { strategy: this.props.data.id }
  }
}
const mapStrategyStateToProps = (state, own_props) =>
  getStrategyByID(state, own_props.objectID)
export default connect(mapStrategyStateToProps, null)(StrategyView)
