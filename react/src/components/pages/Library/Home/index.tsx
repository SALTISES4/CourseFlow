import * as React from 'react'
import HomeMenu from '@cfPages/Library/Home/components/HomeMenu'

/*******************************************************
 * @HomeRenderer
 *******************************************************/
type PropsType = {
  is_teacher: string
}

class HomePage extends React.Component {
  private is_teacher

  constructor(props: PropsType) {
    super(props)
    this.is_teacher = props.is_teacher
  }

  render() {
    return <HomeMenu renderer={this} />
  }

}

export default HomePage
