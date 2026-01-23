import { apiPaths } from '@cf/router/apiRoutes'

type PropsType = {
  icon?: string
  divClass?: string
  div?: string | JSX.Element
  text: string | JSX.Element
}

const LegendLine = ({ icon, divClass, div, text }: PropsType) => {
  const Icon = () => {
    if (icon) {
      return (
        <img
          // imported from legacy css
          style={{
            display: 'inline-block',
            verticalAlign: 'middle',
            width: '24px'
          }}
          src={`${apiPaths.external.static_assets.icon}${icon}.svg`}
          alt="icon"
        />
      )
    }
    return <div className={divClass}>{div}</div>
  }

  return (
    <div
      style={{
        width: '100%',
        padding: '2px'
      }}
    >
      <Icon />
      <div
        // imported from legacy css
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          marginLeft: '8px',
          fontWeight: 600,
          fontSize: '12px'
        }}
      >
        {text}
      </div>
    </div>
  )
}

export default LegendLine
