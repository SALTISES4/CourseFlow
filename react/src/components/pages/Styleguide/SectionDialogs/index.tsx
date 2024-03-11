import Section from '@cfComponents/pages/Library/Home/components/Section'
import Button from '@mui/material/Button'
import EditProjectDialog from '../dumb/dialog/EditProject'
import editProjectData from '../dumb/dialog/EditProject/data'
import { DIALOG_TYPE, useDialog } from '@cfComponents/common/dialog'

const SectionDialogs = () => {
  // used to trigger the corresponding dialog
  const { dispatch } = useDialog()

  return (
    <Section header={{ title: 'Dialogs' }}>
      <Button
        variant="contained"
        onClick={() => dispatch(DIALOG_TYPE.EDIT_PROJECT)}
      >
        Open Edit Project dialog
      </Button>
      <EditProjectDialog {...editProjectData} />
    </Section>
  )
}

export default SectionDialogs
