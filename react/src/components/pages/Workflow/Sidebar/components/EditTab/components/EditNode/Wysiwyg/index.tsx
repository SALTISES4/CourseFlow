import InputLabel from '@mui/material/InputLabel'
import { ControllerRenderProps } from 'react-hook-form'
import ReactQuill from 'react-quill'

import { NodeForm } from '../types'
import { WysiwygWrap } from './styles'

import 'react-quill/dist/quill.snow.css'

type PropsType =
  | {
      label?: string
      placeholder?: string
      readOnly?: boolean
      field: ControllerRenderProps<NodeForm, 'description'>
    }
  | {
      label?: string
      placeholder?: string
      readOnly?: boolean
      value: string
      onChange?: (value: string) => void
      onBlur?: () => void
    }

const WysiwygField = (props: PropsType) => {
  const modules = {
    toolbar: [
      [
        'bold',
        'italic',
        'underline',
        'strike',
        'blockquote',
        { script: 'sub' },
        { script: 'super' }
      ],
      [
        { list: 'ordered' },
        { list: 'bullet' },
        { indent: '-1' },
        { indent: '+1' },
        'link',
        'clean'
      ]
    ]
  }

  const isRHFWrapped = 'field' in props
  const value = isRHFWrapped ? props.field.value || '' : props.value
  const onChange = isRHFWrapped ? props.field.onChange : props.onChange
  const onBlur = isRHFWrapped ? props.field.onBlur : props.onBlur

  return (
    <WysiwygWrap readOnly={props.readOnly ?? false}>
      {props.label && (
        <span>
          <InputLabel shrink>{props.label}</InputLabel>
        </span>
      )}
      <ReactQuill
        theme="snow"
        placeholder={props.placeholder}
        modules={modules}
        readOnly={props.readOnly}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
    </WysiwygWrap>
  )
}

export default WysiwygField
