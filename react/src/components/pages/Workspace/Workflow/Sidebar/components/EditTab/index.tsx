import Alert from '@cfComponents/UIPrimitives/Alert'

import EditNode from './components/EditNode'
import EditNodeCategory from './components/EditNodeCategory'
import EditNodeLink from './components/EditNodeLink'
import EditOutcome from './components/EditOutcome'
import EditPart from './components/EditPart'
import EditTerm from './components/EditTerm'
import EditWeek from './components/EditWeek'
import { EditableType } from './types'

const EditTab = ({ type }: { type: EditableType }) => {
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
      return <EditNodeLink />
    case EditableType.NODE_CATEGORY:
      return <EditNodeCategory />
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
