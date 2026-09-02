import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import { FormControlLabel } from '@mui/material'
import { Switch } from '@mui/material'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import * as Styled from './styles'
import useLegend from './useLegend'

const Legend = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation('workflow')
  const legend = useLegend()

  return (
    <>
      <FormControlLabel
        control={
          <Switch
            value={'legend'}
            checked={legend.show}
            onChange={legend.toggle}
            inputProps={{ 'aria-label': t('legend.show') }}
          />
        }
        label={t('legend.show')}
      />

      <Styled.LegendWrap show={legend.show}>
        {children}
        <Styled.LegendCloseButton
          aria-label={t('legend.show')}
          onClick={legend.toggle}
        >
          <HighlightOffIcon />
        </Styled.LegendCloseButton>
      </Styled.LegendWrap>
    </>
  )
}

export default Legend
