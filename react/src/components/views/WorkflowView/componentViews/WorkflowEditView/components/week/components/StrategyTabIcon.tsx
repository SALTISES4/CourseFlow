import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import AdsClickIcon from '@mui/icons-material/AdsClick'
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive'
import AllInboxIcon from '@mui/icons-material/AllInbox'
import * as React from 'react'

const IconSwitcher = ({ index }: { index: number }) => {
  const icons = [
    <AllInboxIcon />,
    <AirplanemodeActiveIcon />,
    <AddShoppingCartIcon />,
    <AdsClickIcon />
  ]

  return icons[index]
}

const common: React.CSSProperties = {
  display: 'inline-block',
  verticalAlign: 'top',
  boxSizing: 'border-box'
}
const Triangle = () => {
  return (
    <div
      style={{
        ...common,
        width: 0,
        height: 0,
        borderTop: '24px solid transparent',
        borderBottom: '24px solid transparent',
        borderRight: '16px solid #660385' // Use CSS variable or replace with actual color
      }}
    />
  )
}
const StrategyTabIcon = ({
  strategyClassification
}: {
  strategyClassification: number
}) => {
  if (strategyClassification <= 0) {
    return null
  }
  return (
    <div
      style={{
        ...common,
        position: 'absolute',
        right: '-48px',
        top: 'calc(50% - 24px)'
      }}
    >
      <Triangle />
      <div
        style={{
          ...common,
          background: '#660385', // Use your CSS variable or a specific color value
          padding: '4px',
          height: '48px'
        }}
      >
        <div
          style={{
            ...common,
            background: '#fff', // Use CSS variable or replace with actual color
            borderRadius: '20px',
            width: '40px',
            height: '40px',
            textAlign: 'center'
          }}
        >
          <IconSwitcher index={strategyClassification} />
        </div>
      </div>
    </div>
  )
}

export default StrategyTabIcon
