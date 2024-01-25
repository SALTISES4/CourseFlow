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
  constructor(props: PropsType) {
    super(props)
    this.state = {}
    this.mainDiv = React.createRef()
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
    if (!this.state.is_dropped) {
      const isOverflowing =
        this.mainDiv.current.scrollHeight > this.mainDiv.current.clientHeight
      if (this.state.overflow !== isOverflowing) {
        this.setState({ overflow: isOverflowing })
      }
    }
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/

  Overflow = ({ text }: { text: string }) => {
    if (this.state.overflow) {
      return (
        <div
          onClick={(evt) => {
            this.setState({ is_dropped: !this.state.is_dropped })
            evt.stopPropagation()
          }}
          className="collapsed-text-show-more"
        >
          {text}
        </div>
      )
    }
    return <></>
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const cssClasses = [
      this.props.css_class ?? '',
      'title-text collapsible-text',
      this.state.is_dropped ? 'dropped' : ''
    ].join(' ')

    // if (this.props.css_class) css_class = this.props.css_class + ' '
    // css_class += 'title-text collapsible-text'

    // let drop_text = window.gettext('show more')
    // if (this.state.is_dropped) {
    //   css_class += ' dropped'
    //   drop_text = window.gettext('show less')
    // }

    const dropText = this.state.is_dropped
      ? window.gettext('show less')
      : window.gettext('show more')

    const text =
      (this.props.text == null || this.props.text == '') &&
      this.props.defaultText != null
        ? this.props.defaultText
        : this.props.text

    return (
      <>
        <div
          ref={this.mainDiv}
          className={cssClasses}
          title={text}
          dangerouslySetInnerHTML={{ __html: text }}
        />
        <this.Overflow text={dropText} />
      </>
    )
  }
}

export default CollapsibleText
