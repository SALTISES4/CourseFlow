import { Link } from 'react-router-dom'
import { OuterContentWrap } from '@cf/mui/helper'

const Favorites = () => {
  return (
    <OuterContentWrap>
      <h2>My Favorites</h2>
      <Link to={''}>Go back Home</Link>
    </OuterContentWrap>
  )
}

export default Favorites
