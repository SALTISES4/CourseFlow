// A block of collapsible text.
import * as React from 'react'
import Component from './Component.js'

class CollapsibleText extends Component {
  componentDidMount() {
    this.checkSize()
  }

  componentDidUpdate() {
    this.checkSize()
  }

  checkSize() {
    if (this.state.is_dropped) return
    if (this.maindiv.current.scrollHeight > this.maindiv.current.clientHeight) {
      if (!this.state.overflow) this.setState({ overflow: true })
    } else {
      if (this.state.overflow) this.setState({ overflow: false })
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let css_class = ''
    if (this.props.css_class) css_class = this.props.css_class + ' '
    css_class += 'title-text collapsible-text'
    let drop_text = gettext('show more')
    if (this.state.is_dropped) {
      css_class += ' dropped'
      drop_text = gettext('show less')
    }
    let overflow
    if (this.state.overflow)
      overflow = (
        <div
          onClick={(evt) => {
            this.setState({ is_dropped: !this.state.is_dropped })
            evt.stopPropagation()
          }}
          className="collapsed-text-show-more"
        >
          {drop_text}
        </div>
      )

    var text = this.props.text
    if (
      (this.props.text == null || this.props.text == '') &&
      this.props.defaultText != null
    ) {
      text = this.props.defaultText
    }
    return [
      <div
        ref={this.maindiv}
        className={css_class}
        title={text}
        dangerouslySetInnerHTML={{ __html: text }}
      />,
      overflow
    ]
  }
}

export default CollapsibleText
