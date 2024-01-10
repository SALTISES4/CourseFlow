// A block of collapsible text.
import * as React from 'react'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfParentComponents/ComponentWithToggleDrop'

type PropsType = {
  css_class?: string
  defaultText: string
  text?: string | null
} & ComponentWithToggleProps

type StateType = {
  is_dropped?: boolean
  overflow?: boolean
}

class CollapsibleText extends ComponentWithToggleDrop<PropsType, StateType> {
  private readonly css_class: any
  private readonly defaultText: string
  private readonly text: string

  constructor(props: PropsType) {
    super(props)
    this.state = {}
    this.mainDiv = React.createRef()
    this.css_class = this.props.css_class
    this.defaultText = this.props.defaultText
    this.text = this.props.text
  }
  /*******************************************************
   * LIFECYCLE HOOKS
   *******************************************************/
  componentDidMount() {
    this.checkSize()
  }

  componentDidUpdate() {
    this.checkSize()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  checkSize() {
    if (this.state.is_dropped) return
    if (this.mainDiv.current.scrollHeight > this.mainDiv.current.clientHeight) {
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
    if (this.css_class) css_class = this.css_class + ' '
    css_class += 'title-text collapsible-text'
    let drop_text = window.gettext('show more')
    if (this.state.is_dropped) {
      css_class += ' dropped'
      drop_text = window.gettext('show less')
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

    let text = this.text
    if ((this.text == null || this.text == '') && this.defaultText != null) {
      text = this.defaultText
    }
    return [
      <div
        ref={this.mainDiv}
        className={css_class}
        title={text}
        dangerouslySetInnerHTML={{ __html: text }}
      />,
      overflow
    ]
  }
}

export default CollapsibleText
