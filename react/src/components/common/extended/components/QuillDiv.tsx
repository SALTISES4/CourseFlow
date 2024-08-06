//Quill div for inputs, as a React component
import * as React from 'react'
// import $ from 'jquery'

type PropsType = {
  text: string
  placeholder: string
  disabled: boolean
  textChangeFunction: (text: string) => void
  maxlength: number
  readOnly: boolean
}
type StateType = {
  charlength: number
}

class QuillDiv extends React.Component<PropsType, StateType> {
  private mainDiv: React.RefObject<HTMLDivElement>
  // @todo see below, referencing global quill object
  // @ts-ignore
  private quill: Quill
  constructor(props) {
    super(props)
    this.mainDiv = React.createRef()

    const charlength = this.props.text ? this.props.text.length : 0
    this.state = {
      charlength
    }
  }

  componentDidMount() {
    const quill_container = this.mainDiv.current
    const readOnly = this.props.readOnly

    const toolbarOptions = [
      ['bold', 'italic', 'underline'],
      [{ script: 'sub' }, { script: 'super' }],
      [{ list: 'bullet' }, { list: 'ordered' }],
      ['link'] /*,['formula']*/
    ]

    // @todo where is quill coming from here?
    // @ts-ignore
    const quill = new Quill(quill_container, {
      theme: 'snow',
      modules: {
        toolbar: toolbarOptions
      },
      placeholder: this.props.placeholder
    })
    this.quill = quill

    if (this.props.text) {
      quill.clipboard.dangerouslyPasteHTML(this.props.text)
    }

    quill.on('text-change', () => {
      // @ts-ignore
      const text = quill_container.childNodes[0].innerHTML.replace(
        /\<p\>\<br\>\<\/p\>\<ul\>/g,
        '<ul>'
      )
      this.props.textChangeFunction(text)
      this.setState({ charlength: text.length })
    })

    const toolbar = quill.getModule('toolbar')

    toolbar.defaultLinkFunction = toolbar.handlers['link']

    toolbar.addHandler('link', function customLinkFunction(value) {
      const select = quill.getSelection()
      if (value && select['length'] == 0 && !readOnly) {
        quill.insertText(select['index'], 'link')
        quill.setSelection(select['index'], 4)
      }
      // @todo unclear this scope
      // @ts-ignore
      this.defaultLinkFunction(value)
    })
    this.quill.enable(!this.props.disabled)
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.disabled != this.props.disabled) {
      if (prevProps.text != this.props.text)
        this.quill.clipboard.dangerouslyPasteHTML(this.props.text, 'silent')
      this.quill.enable(!this.props.disabled)
    }
    $(this.mainDiv.current)
      .find('a')
      .click(() => {
        $(this).attr('target', '_blank')
      })
  }

  render() {
    return (
      <div>
        <div ref={this.mainDiv} className="quill-div" />
        <div className={'character-length'}>
          {this.state.charlength + ' ' + window.gettext('characters')}
        </div>
      </div>
    )
  }
}

export default QuillDiv
