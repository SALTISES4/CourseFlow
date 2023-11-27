// Creates a datetime picker using flatpickr
import * as React from 'react'

class DatePicker extends React.Component {
  constructor(props) {
    super(props)
    this.input = React.createRef()
  }
  componentDidMount() {
    $(this.input.current).flatpickr({
      enableTime: true,
      dateFormat: 'Z',
      altInput: true,
      altFormat: 'D M J, Y - H:i',
      onChange: (dates, datestring) => {
        this.props.onChange(datestring)
      }
    })
  }
  render() {
    let disabled = false
    if (this.props.disabled) disabled = true
    return (
      <input
        disabled={disabled}
        ref={this.input}
        id={this.props.id}
        defaultValue={this.props.default_value}
      />
    )
  }
}

export default DatePicker
