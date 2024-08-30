import React, { useState, useEffect, useRef } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { _t } from '@cf/utility/utilityFunctions'

interface PropsType {
  text: string
  readOnly: boolean
  placeholder: string
  disabled: boolean
  textChangeFunction: (text: string) => void
}

// Quill modules to enable
const modules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ script: 'sub' }, { script: 'super' }],
    [{ list: 'bullet' }, { list: 'ordered' }],
    ['link'] /*,['formula']*/
  ]
}

const QuillDiv: React.FC<PropsType> = (props) => {
  /*******************************************************
   * STATE
   *******************************************************/
  const [charLength, setCharLength] = useState(
    props.text ? props.text.length : 0
  )
  /*******************************************************
   * REF
   *******************************************************/
  const quillRef = useRef<ReactQuill>(null)

  /*******************************************************
   * LIFE CYCLE
   *******************************************************/
  //   Initialize and Update the Editor's Content
  useEffect(() => {
    const quillInstance = quillRef.current?.getEditor()

    if (
      quillInstance &&
      props.text &&
      props.text !== quillInstance.root.innerHTML
    ) {
      quillInstance.clipboard.dangerouslyPasteHTML(props.text, 'silent')
    }
  }, [props.text])

  // Handle Text Changes
  useEffect(() => {
    const quillInstance = quillRef.current?.getEditor()

    if (quillInstance) {
      const handleTextChange = () => {
        const quillContainer = quillInstance.root
        const text = quillContainer.innerHTML.replace(
          /\<p\>\<br\>\<\/p\>\<ul\>/g,
          '<ul>'
        )

        if (text !== props.text) {
          props.textChangeFunction(text)
          setCharLength(text.length)
        }
      }

      quillInstance.on('text-change', handleTextChange)

      return () => {
        quillInstance.off('text-change', handleTextChange)
      }
    }
  }, [props.text])

  // Customize the Toolbar
  useEffect(() => {
    const quillInstance = quillRef.current?.getEditor()

    if (quillInstance) {
      const toolbar = quillInstance.getModule('toolbar')
      const originalLinkHandler = toolbar.handlers['link']

      toolbar.addHandler('link', function customLinkFunction(value) {
        const select = quillInstance.getSelection()
        if (value && select && select.length === 0 && !props.readOnly) {
          quillInstance.insertText(select.index, 'link')
          quillInstance.setSelection(select.index, 4)
        } else {
          // @ts-ignore
          originalLinkHandler.call(this, value)
        }
      })
    }
  }, [props.readOnly])

  // Enable or Disable the Editor
  useEffect(() => {
    const quillInstance = quillRef.current?.getEditor()

    if (quillInstance) {
      quillInstance.enable(!props.disabled)
    }
  }, [props.disabled])

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <div>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        modules={modules}
        placeholder={props.placeholder}
        readOnly={props.readOnly}
      />
      <div className={'character-length'}>
        {charLength + ' ' + _t('characters')}
      </div>
    </div>
  )
}

export default QuillDiv
