import { selectOutcomeTagGroups } from '@cf/redux/selectors/outcomes.selector'
import { _t } from '@cf/utility/Utility.class'
import Alert from '@cfComponents/UIPrimitives/Alert'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useSelector } from 'react-redux'

import { OutcomeGroup } from './Outcome'
import * as Styled from '../../styles'

const OutcomeTab = () => {
  // TODO: figure out where the outcomes data actually comes from
  const outcomeGroups = useSelector(selectOutcomeTagGroups)

  console.log({ outcomeGroups })

  if (!outcomeGroups.length) {
    return (
      <Styled.SidebarInnerWrap>
        <Styled.SidebarContent>
          <Styled.SidebarTitle as="h3" variant="h6">
            {_t('Outcomes')}
          </Styled.SidebarTitle>
          <Alert
            severity="info"
            persistent
            subtitle={_t('No outcomes have been added yet.')}
          />
        </Styled.SidebarContent>
      </Styled.SidebarInnerWrap>
    )
  }

  return (
    <Styled.SidebarInnerWrap>
      <Styled.SidebarContent>
        <Styled.SidebarTitle as="h3" variant="h6">
          {_t('Outcomes')}
        </Styled.SidebarTitle>
        <Typography variant="body2" sx={{ mb: 3 }}>
          {_t(
            'Drag and drop to associate outcomes from parents workflows to outcomes of your current workflow. Click on an outcome to highlight relevant nodes.'
          )}
        </Typography>
        {outcomeGroups.map(
          (group, idx) =>
            !!group.outcomes.length && (
              <Styled.GroupWrap key={idx}>
                <Typography component="h6" variant="body2">
                  {group.title}
                </Typography>
                {/* TODO: actually render tag group outcomes */}
                <OutcomeGroup prefix={[]} parentId={null} />
              </Styled.GroupWrap>
            )
        )}
      </Styled.SidebarContent>
      <Styled.SidebarActions>
        <Button variant="contained" color="secondary">
          {_t('Edit outcomes')}
        </Button>
      </Styled.SidebarActions>
    </Styled.SidebarInnerWrap>
  )
}

export default OutcomeTab
