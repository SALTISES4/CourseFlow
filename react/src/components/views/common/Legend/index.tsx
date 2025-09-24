import { _t } from '@cf/utility/Utility.class'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import { FormControlLabel } from '@mui/material'
import { Switch } from '@mui/material'
import { ReactNode } from 'react'

import * as Styled from './styles'
import useLegend from './useLegend'

const Legend = ({ children }: { children: ReactNode }) => {
  const legend = useLegend()

  return (
    <>
      <FormControlLabel
        control={
          <Switch
            value={'legend'}
            checked={legend.show}
            onChange={legend.toggle}
            inputProps={{ 'aria-label': 'controlled' }}
          />
        }
        label={_t('Show Legend')}
      />

      <Styled.LegendWrap show={legend.show}>
        {children}
        <Styled.LegendCloseButton onClick={legend.toggle}>
          <HighlightOffIcon />
        </Styled.LegendCloseButton>
      </Styled.LegendWrap>
    </>
  )
}

export default Legend
