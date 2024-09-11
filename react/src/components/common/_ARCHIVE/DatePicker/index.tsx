import flatpickr from 'flatpickr'
import * as React from 'react'

// Define props type
interface DatePickerProps {
  onChange: (datestring: string) => void
  disabled?: boolean
  id?: string
  default_value?: string
}

class DatePicker extends React.Component<DatePickerProps> {
  private readonly input: React.RefObject<HTMLInputElement>
  private flatpickrInstance?: flatpickr.Instance

  constructor(props: DatePickerProps) {
    super(props)
    this.input = React.createRef()
  }

  componentDidMount() {
    if (this.input.current) {
      this.flatpickrInstance = flatpickr(this.input.current, {
        enableTime: true,
        dateFormat: 'Z',
        altInput: true,
        altFormat: 'D M J, Y - H:i',
        onChange: (selectedDates, dateStr) => {
          this.props.onChange(dateStr)
        }
      })
    }
  }

  componentWillUnmount() {
    // Destroy the flatpickr instance when the component unmounts
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy()
    }
  }

  render() {
    return (
      <input
        disabled={this.props.disabled || false}
        ref={this.input}
        id={this.props.id}
        defaultValue={this.props.default_value}
      />
    )
  }
}

export default DatePicker
