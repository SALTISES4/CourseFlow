import { selectOutcomeTagGroups } from '@cf/redux/selectors/outcomes.selector'
import { _t } from '@cf/utility/Utility.class'
import Alert from '@cfComponents/UIPrimitives/Alert'
import Typography from '@mui/material/Typography'
import { useSelector } from 'react-redux'

import * as Styled from '../../styles'
import { OutcomeGroup } from '../OutcomesTab/Outcome'

const RelatedTab = () => {
  // TODO: figure out where the outcomes data actually comes from
  const outcomeGroups = useSelector(selectOutcomeTagGroups)
  const alert = true

  return (
    <Styled.SidebarInnerWrap>
      <Styled.SidebarContent>
        <Styled.SidebarTitle as="h3" variant="h6">
          {_t('Outcomes from parent workflows')}
        </Styled.SidebarTitle>
        <Typography variant="body2" sx={{ mb: 3 }}>
          {_t(
            'Drag and drop to associate outcomes from parents workflows to outcomes of your current workflow. Click on an outcome to highlight relevant nodes.'
          )}
        </Typography>
        {alert && (
          <Alert
            severity="warning"
            persistent
            subtitle="You have linked this workflow to multiple nodes. You may see outcomes from different parent workflows, or duplicates of outcomes."
          />
        )}
        {outcomeGroups.map(
          (tagGroup) =>
            !!tagGroup.outcomes.length && (
              <Styled.GroupWrap key={tagGroup.id}>
                <Typography component="h6" variant="body2">
                  {tagGroup.title}
                </Typography>
                {/* TODO: actually render tag group outcomes */}
                <OutcomeGroup prefix={[]} parentId={null} />
              </Styled.GroupWrap>
            )
        )}
      </Styled.SidebarContent>
    </Styled.SidebarInnerWrap>
  )
}

export default RelatedTab
