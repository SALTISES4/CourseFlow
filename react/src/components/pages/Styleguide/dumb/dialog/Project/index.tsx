import { ChangeEvent, useState } from 'react'
import { produce } from 'immer'
import {
  Discipline,
  // ObjectSet,
  FormFieldSerialized
} from '@cfModule/types/common'
import { DIALOG_TYPE, useDialog } from '@cfComponents/common/dialog'

import CreateProjectDialog from '../CreateProject'
import EditProjectDialog from '../EditProject'
import {
  OBJECT_SET_TYPE,
  ObjectSetType
} from '@cfCommonComponents/dialog/CreateProject/type'

type ObjectSetUpdateType = {
  index: number
  newVal?: ObjectSetType
}

type StateType = {
  fields: {
    [index: string]: string
  }
  objectSets: ObjectSetType[]
  objectSetsExpanded: boolean
}

export type DataType = {
  showNoProjectsAlert?: boolean
  objectSets: ObjectSetType[]
  disciplines: Discipline[]
  formFields: FormFieldSerialized[]
}

export type ProjectDialogPropsType = DataType & {
  // Input state / errors
  state: StateType
  errors: {
    [index: string]: string[]
  }

  // Input callbacks
  onInputChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: FormFieldSerialized
  ) => void
  onObjectSetsClick: () => void
  onObjectSetUpdate: ({ index, newVal }: ObjectSetUpdateType) => void
  onObjectSetAddNew: () => void

  // Dialog
  show: boolean
  onClose: () => void
  onCloseAnimationEnd: () => void
  onSubmit: () => void
}

export type PropsType = {
  showNoProjectsAlert?: boolean
  objectSets?: ObjectSetType[]
  disciplines: Discipline[]
  formFields: FormFieldSerialized[]
}

const ProjectDialog = ({
  showNoProjectsAlert,
  objectSets,
  disciplines,
  formFields,
  type
}: PropsType & {
  type:
    | DIALOG_TYPE.STYLEGUIDE_PROJECT_CREATE
    | DIALOG_TYPE.STYLEGUIDE_PROJECT_EDIT
}) => {
  // set the inital state based on inputs
  const initialState: StateType = {
    fields: {},
    objectSets,
    objectSetsExpanded: objectSets?.length !== 0
  }
  formFields.map((field) => (initialState.fields[field.name] = field.value))

  const [state, setState] = useState(initialState)
  const [errors, setErrors] = useState({})
  const { show, onClose } = useDialog(type)

  function onSubmit() {
    // early exit if there are validation errors
    if (Object.keys(errors).length) {
      return false
    }

    const postData = {
      ...state.fields,
      objectSets: state.objectSets
    }

    // TODO: Handle submit based on the type of the dialog
    switch (type) {
      case DIALOG_TYPE.STYLEGUIDE_PROJECT_CREATE:
        console.log('submitted CREATE PROJECT with', postData)
        break

      case DIALOG_TYPE.STYLEGUIDE_PROJECT_EDIT:
        console.log('submitted EDIT PROJECT with', postData)
        break
    }

    // NOTE: Example using API_POST to create the project
    // API_POST<{ redirect: string }>(
    //   COURSEFLOW_APP.config.json_api_paths.create_project,
    //   postData
    // )
    //   .then((resp) => {
    //     window.location.href = resp.redirect
    //   })
    //   .catch((error) => setErrors(error.data.errors))
  }

  function onCloseAnimationEnd() {
    setState(initialState)
    setErrors({})
  }

  function onInputChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: FormFieldSerialized
  ) {
    if (errors[field.name]) {
      setErrors(
        produce((draft) => {
          delete draft[field.name]
        })
      )
    }

    setState(
      produce((draft) => {
        const { fields } = draft
        fields[e.target.name] = e.target.value
      })
    )
  }

  // either updating existing one
  // or deleting when no newVal is supplied
  function onObjectSetUpdate({ index, newVal }: ObjectSetUpdateType) {
    setState(
      produce((draft) => {
        const sets = draft.objectSets
        if (newVal) {
          sets.splice(index, 1, newVal)
        } else {
          sets.splice(index, 1)
        }
      })
    )
  }

  function onObjectSetAddNew() {
    setState(
      produce((draft) => {
        draft.objectSets.push({ type: '' as OBJECT_SET_TYPE, label: '' })
      })
    )
  }

  function onObjectSetsClick() {
    setState(
      produce((draft) => {
        draft.objectSetsExpanded = !draft.objectSetsExpanded
      })
    )
  }

  // Drill that maaaaaaan
  const dialogProps: ProjectDialogPropsType = {
    showNoProjectsAlert,
    objectSets,
    disciplines,
    formFields,
    state,
    errors,

    onInputChange,
    onObjectSetUpdate,
    onObjectSetAddNew,
    onObjectSetsClick,

    show,
    onClose,
    onCloseAnimationEnd,
    onSubmit
  }

  return type === DIALOG_TYPE.STYLEGUIDE_PROJECT_CREATE ? (
    <CreateProjectDialog {...dialogProps} />
  ) : (
    <EditProjectDialog {...dialogProps} />
  )
}

export default ProjectDialog
