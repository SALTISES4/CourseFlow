// A block of collapsible text.
import { _t } from '@cf/utility/utilityFunctions'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfEditableComponents/ComponentWithToggleDrop'
import * as React from 'react'

type PropsType = {
  cssClass?: string
  defaultText: string
  text?: string | null
} & ComponentWithToggleProps

type StateType = {
  isDropped?: boolean
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
    if (!this.state.isDropped) {
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
            this.setState({ isDropped: !this.state.isDropped })
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
      this.props.cssClass ?? '',
      'title-text collapsible-text',
      this.state.isDropped ? 'dropped' : ''
    ].join(' ')

    // if (this.props.cssClass) cssClass = this.props.cssClass + ' '
    // cssClass += 'title-text collapsible-text'

    // let drop_text = _t('show more')
    // if (this.state.isDropped) {
    //   cssClass += ' dropped'
    //   drop_text = _t('show less')
    // }

    const dropText = this.state.isDropped ? _t('show less') : _t('show more')

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
