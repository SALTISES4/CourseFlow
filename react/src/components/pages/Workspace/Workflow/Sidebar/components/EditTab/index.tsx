import Alert from '@cfComponents/UIPrimitives/Alert'

import EditColumn from './components/EditColumn'
import EditNode from './components/EditNode'
import EditNodelink from './components/EditNodelink'
import EditOutcome from './components/EditOutcome'
import EditPart from './components/EditPart'
import EditTerm from './components/EditTerm'
import EditWeek from './components/EditWeek'
import { EditableType } from './types'

const EditTab = ({ id, type }: { id: number; type: EditableType }) => {
  if (!type) {
    return null
  }

  switch (type) {
    case EditableType.TERM:
      return <EditTerm />
    case EditableType.WEEK:
      return <EditWeek />
    case EditableType.PART:
      return <EditPart />
    case EditableType.OUTCOME:
      return <EditOutcome />
    case EditableType.NODE_LINK:
      return <EditNodelink />
    case EditableType.COLUMN:
      return <EditColumn key={id} columnId={id} />
    case EditableType.NODE:
      return <EditNode />
    default:
      return (
        <Alert
          persistent
          severity="error"
          title="Woopsie"
          subtitle={`edit ${type} form not supported yet`}
        />
      )
  }
}

export default EditTab
