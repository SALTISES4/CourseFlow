import * as React from 'react'
import { TinyLoader } from '@cfRedux/helpers'
import HomeMenu from '@cfPages/Library/Home/components/HomeMenu'

/*******************************************************
 * @HomeRenderer
 *******************************************************/
type PropsType = {
  is_teacher: string
}

class HomeRenderer extends React.Component {
  private is_teacher

  constructor(props: PropsType) {
    super(props)
    this.is_teacher = props.is_teacher
  }

  render() {
    // @ts-ignore
    this.tiny_loader = new TinyLoader($('body')[0])

    return this.getContents()
  }

  getContents() {
    return <HomeMenu renderer={this} />
  }
}

export default HomeRenderer
