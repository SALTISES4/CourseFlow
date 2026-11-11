import { ControllerRenderProps } from 'react-hook-form'
import ReactQuill from 'react-quill'

import { NodeForm } from '../types'
import { WysiwygWrap } from './styles'

import 'react-quill/dist/quill.snow.css'

type PropsType = {
  placeholder?: string
  field: ControllerRenderProps<NodeForm, 'description'>
}

const WysiwygField = ({ placeholder, field }: PropsType) => {
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

  return (
    <WysiwygWrap>
      <ReactQuill
        placeholder={placeholder}
        theme="snow"
        modules={modules}
        value={field.value || ''}
        onChange={field.onChange}
        onBlur={field.onBlur}
      />
    </WysiwygWrap>
  )
}

export default WysiwygField
