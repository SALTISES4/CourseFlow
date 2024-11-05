import Alert from '@cfComponents/UIPrimitives/Alert'

import EditNode from './components/EditNode'
import EditNodeCategory from './components/EditNodeCategory'
import EditNodeLink from './components/EditNodeLink'
import EditOutcome from './components/EditOutcome'
import EditPart from './components/EditPart'
import EditTerm from './components/EditTerm'
import EditWeek from './components/EditWeek'
import { EditableType } from '../../hooks/useEditable/types'

const EditTab = ({ type }: { type: EditableType }) => {
  if (!type) {
    return null
  }

  switch (type) {
    case EditableType.TERM:
      return (
        <div>
          <h2>EditableType.TERM</h2>
        </div>
      )
    // return <EditTerm {...(data as TermForm)} />
    case EditableType.WEEK:
      return (
        <div>
          <h2>EditableType.WEEK</h2>
        </div>
      )
    // return <EditWeek {...(data as WeekForm)} />
    case EditableType.PART:
      return (
        <div>
          <h2>EditableType.PART</h2>
        </div>
      )
    // return <EditPart {...(data as PartForm)} />
    case EditableType.OUTCOME:
      return (
        <div>
          <h2>EditableType.OUTCOME</h2>
        </div>
      )
    // return <EditOutcome {...(data as OutcomeForm)} />
    case EditableType.NODE_LINK:
      return (
        <div>
          <h2>EditableType.NODE_LINK</h2>
        </div>
      )
    // return <EditNodeLink {...(data as NodeLinkForm)} />
    case EditableType.NODE_CATEGORY:
      return (
        <div>
          <h2>EditableType.NODE_CATEGORY</h2>
        </div>
      )
    // return <EditNodeCategory {...(data as NodeCategoryForm)} />
    case EditableType.NODE:
      return (
        <div>
          <h2>EditableType.NODE</h2>
        </div>
      )
    // return <EditNode {...(data as NodeForm)} />
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
