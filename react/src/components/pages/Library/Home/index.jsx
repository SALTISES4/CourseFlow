import * as React from 'react'
import { TinyLoader } from '@cfRedux/helpers'
import HomeMenu from '@cfModule/components/pages/Library/Home/components/HomeMenu'

/*******************************************************
 * @HomeRenderer
 *******************************************************/
class HomeRenderer extends React.Component {
  constructor(props) {
    super(props)
    this.is_teacher = this.props.is_teacher
  }

  render() {
    this.container = container
    this.tiny_loader = new TinyLoader($('body')[0])

    return this.getContents()
  }

  getContents() {
    return <HomeMenu renderer={this} />
  }
}

export default HomeRenderer
