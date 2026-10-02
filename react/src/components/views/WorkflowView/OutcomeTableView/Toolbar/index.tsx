import * as Styled from '@cfPages/Workflow/Sidebar/components/AddTab/styles'
import ToggleButton from '@mui/material/ToggleButton'

type PropsType = {
  viewType: 'normal' | 'matrix'
  onViewTypeChange: (_: any, newVal: PropsType['viewType']) => void
}

const OutcomeTableViewToolbar = ({ viewType, onViewTypeChange }: PropsType) => {
  return (
    <div style={{ width: '250px' }}>
      <Styled.InsertButtonGroup
        exclusive
        value={viewType}
        onChange={onViewTypeChange}
      >
        <ToggleButton color="primary" size="small" value="normal">
          Normal
        </ToggleButton>
        <ToggleButton color="primary" size="small" value="matrix">
          Competency matrix
        </ToggleButton>
      </Styled.InsertButtonGroup>
    </div>
  )
}

export default OutcomeTableViewToolbar
