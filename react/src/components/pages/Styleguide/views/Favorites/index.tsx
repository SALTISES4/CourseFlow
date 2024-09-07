import { OuterContentWrap } from '@cf/mui/helper'
import { Link } from 'react-router-dom'

const Favorites = () => {
  return (
    <OuterContentWrap>
      <h2>My Favorites</h2>
      <Link to={''}>Go back Home</Link>
    </OuterContentWrap>
  )
}

export default Favorites
