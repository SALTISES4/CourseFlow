import Alert from '@cfComponents/UIPrimitives/Alert'

import EditNode from './components/EditNode'
import { NodeForm } from './components/EditNode/types'
import EditNodeCategory from './components/EditNodeCategory'
import { NodeCategoryForm } from './components/EditNodeCategory/types'
import EditNodeLink from './components/EditNodeLink'
import { NodeLinkForm } from './components/EditNodeLink/types'
import EditOutcome from './components/EditOutcome'
import { OutcomeForm } from './components/EditOutcome/types'
import EditPart from './components/EditPart'
import { PartForm } from './components/EditPart/types'
import EditTerm from './components/EditTerm'
import { TermForm } from './components/EditTerm/types'
import EditWeek from './components/EditWeek'
import { EditablePropsType, EditableType } from '../../hooks/useEditable/types'
import { WeekForm } from './components/EditWeek/types'

const EditTab = ({ type, data }: EditablePropsType) => {
  if (!type) {
    return null
  }

  switch (type) {
    case EditableType.TERM:
      return <EditTerm {...(data as TermForm)} />
    case EditableType.WEEK:
      return <EditWeek {...(data as WeekForm)} />
    case EditableType.PART:
      return <EditPart {...(data as PartForm)} />
    case EditableType.OUTCOME:
      return <EditOutcome {...(data as OutcomeForm)} />
    case EditableType.NODE_LINK:
      return <EditNodeLink {...(data as NodeLinkForm)} />
    case EditableType.NODE_CATEGORY:
      return <EditNodeCategory {...(data as NodeCategoryForm)} />
    case EditableType.NODE:
      return <EditNode {...(data as NodeForm)} />
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
