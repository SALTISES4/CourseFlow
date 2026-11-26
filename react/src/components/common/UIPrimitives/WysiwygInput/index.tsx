import InputLabel from '@mui/material/InputLabel'
import { useEffect, useRef } from 'react'
import ReactQuill from 'react-quill'

import { WysiwygWrap } from './styles'

import 'react-quill/dist/quill.snow.css'

const EMPTY_QUILL_HTML = '<p><br></p>'

const TOOLBAR_CONTROL_LABELS = [
  ['.ql-bold', 'Bold'],
  ['.ql-italic', 'Italic'],
  ['.ql-underline', 'Underline'],
  ['.ql-script[value="super"]', 'Superscript'],
  ['.ql-script[value="sub"]', 'Subscript'],
  ['.ql-list[value="bullet"]', 'Bulleted list'],
  ['.ql-list[value="ordered"]', 'Numbered list'],
  ['.ql-link', 'Link']
] as const

type PropsType =
  | {
      label?: string
      placeholder?: string
      readOnly?: boolean
      noBorder?: boolean
      field: {
        value: string | null | undefined
        onChange: (value: string) => void
        onBlur: () => void
      }
    }
  | {
      label?: string
      placeholder?: string
      readOnly?: boolean
      noBorder?: boolean
      value: string
      onChange?: (value: string) => void
      onBlur?: () => void
    }

const WysiwygField = (props: PropsType) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', { script: 'super' }, { script: 'sub' }],
      [{ list: 'bullet' }, { list: 'ordered' }, 'link']
    ]
  }

  const isRHFWrapped = 'field' in props
  const value = isRHFWrapped ? props.field.value || '' : props.value
  const onChange = isRHFWrapped ? props.field.onChange : props.onChange
  const onBlur = isRHFWrapped ? props.field.onBlur : props.onBlur
  const accessibleName = props.label ?? props.placeholder

  useEffect(() => {
    const editor = wrapperRef.current?.querySelector<HTMLElement>('.ql-editor')
    if (editor) {
      editor.setAttribute('role', 'textbox')
      editor.setAttribute('aria-multiline', 'true')
      if (accessibleName) {
        editor.setAttribute('aria-label', accessibleName)
      }
    }

    const toolbar =
      wrapperRef.current?.querySelector<HTMLElement>('.ql-toolbar')
    if (!toolbar) {
      return
    }

    toolbar.setAttribute('role', 'toolbar')
    toolbar.setAttribute(
      'aria-label',
      accessibleName ? `${accessibleName} formatting` : 'Rich text formatting'
    )

    TOOLBAR_CONTROL_LABELS.forEach(([selector, label]) => {
      toolbar
        .querySelector<HTMLElement>(selector)
        ?.setAttribute('aria-label', label)
    })
  }, [accessibleName])

  return (
    <WysiwygWrap
      ref={wrapperRef}
      noBorder={props.noBorder}
      readOnly={props.readOnly}
    >
      {accessibleName && (
        <span>
          <InputLabel shrink>{accessibleName}</InputLabel>
        </span>
      )}
      <ReactQuill
        theme="snow"
        placeholder={props.placeholder}
        modules={modules}
        readOnly={props.readOnly}
        value={value}
        onChange={(nextValue, _delta, source) => {
          if (source === 'user') {
            onChange?.(nextValue === EMPTY_QUILL_HTML ? '' : nextValue)
          }
        }}
        onBlur={onBlur}
      />
    </WysiwygWrap>
  )
}

export default WysiwygField
