import RichTextDescription from '@cfComponents/dialog/Workflow/components/RichTextDescription'

type BaseProps = {
  label?: string
  placeholder?: string
  readOnly?: boolean
}

type PropsType =
  | (BaseProps & {
      field: {
        value: string | null | undefined
        onChange: (value: string) => void
      }
    })
  | (BaseProps & {
      value: string
      onChange?: (value: string) => void
    })

const WysiwygField = (props: PropsType) => {
  const isFormField = 'field' in props
  const value = isFormField ? props.field.value || '' : props.value
  const onChange = isFormField ? props.field.onChange : props.onChange

  return (
    <RichTextDescription
      label={props.label ?? props.placeholder}
      readOnly={props.readOnly}
      value={value}
      onChange={onChange}
    />
  )
}

export default WysiwygField
