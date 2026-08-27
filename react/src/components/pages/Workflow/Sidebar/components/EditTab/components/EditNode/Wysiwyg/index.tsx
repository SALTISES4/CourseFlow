import RichTextDescription from '@cfComponents/dialog/Workflow/components/RichTextDescription'
import { ControllerRenderProps } from 'react-hook-form'

import { NodeForm } from '../types'

type PropsType = {
  placeholder?: string
  field: ControllerRenderProps<NodeForm, 'description'>
  readOnly?: boolean
}

const WysiwygField = ({ placeholder, field, readOnly = false }: PropsType) => {
  return (
    <RichTextDescription
      label={placeholder}
      readOnly={readOnly}
      value={field.value || ''}
      onChange={field.onChange}
    />
  )
}

export default WysiwygField
