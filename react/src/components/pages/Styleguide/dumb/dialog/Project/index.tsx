import { ChangeEvent, useState } from 'react'
import { produce } from 'immer'
import {
  Discipline,
  ObjectSet,
  FormFieldSerialized
} from '@cfModule/types/common'
import { DIALOG_TYPE, useDialog } from '@cfComponents/common/dialog'

import CreateProjectDialog from '../CreateProject'
import EditProjectDialog from '../EditProject'

type ObjectSetUpdateType = {
  index: number
  newVal?: ObjectSet
}

export type PropsType = {
  showNoProjectsAlert?: boolean
  objectSets?: ObjectSet[]
  disciplines: Discipline[]
  formFields: FormFieldSerialized[]
}

type StateType = {
  fields: {
    [index: string]: string
  }
  objectSets: ObjectSet[]
  objectSetsExpanded: boolean
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
      objectSets: state.objectSets.filter(
        (set) => set.id !== '' && set.title !== ''
      )
    }

    // API_POST<{ redirect: string }>(
    //   COURSEFLOW_APP.config.json_api_paths.create_project,
    //   postData
    // )
    //   .then((resp) => {
    //     window.location.href = resp.redirect
    //   })
    //   .catch((error) => setErrors(error.data.errors))

    console.log('posting', type, ' dialog with', postData)
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
        draft.objectSets.push({ id: '', title: '' })
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
  const dialogProps = {
    // State / data
    showNoProjectsAlert,
    objectSets,
    disciplines,
    formFields,
    state,
    errors,

    // Callbacks
    onInputChange,
    onObjectSetUpdate,
    onObjectSetAddNew,
    onObjectSetsClick,

    // Dialog
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
