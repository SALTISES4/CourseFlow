// @ts-nocheck
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { Discipline, EObjectSet, FormFieldSerialized } from '@cf/types/common'
import { produce } from 'immer'
import { ChangeEvent, useState } from 'react'

import CreateProjectDialog from './CreateProject'
import EditProjectDialog from './EditProject'

type ObjectSetUpdateType = {
  index: number
  newVal?: EObjectSet
}

type StateType = {
  fields: {
    [index: string]: string
  }
  objectSets?: EObjectSet[]
  objectSetsExpanded: boolean
}

export type DataType = {
  showNoProjectsAlert?: boolean
  objectSets?: EObjectSet[]
  disciplines?: Discipline[]
  formFields: FormFieldSerialized[]
}

export type TInnerDialog = DataType & {
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
  objectSets?: EObjectSet[]
  disciplines?: Discipline[]
  formFields: FormFieldSerialized[]
}

type ErorrType = {
  [index: string]: any
}

const ProjectDialog = ({
  showNoProjectsAlert,
  objectSets,
  disciplines,
  formFields,
  type
}: PropsType & {
  type: DialogMode.PROJECT_CREATE | DialogMode.PROJECT_EDIT
}) => {
  // set the inital state based on inputs
  const initialState: StateType = {
    fields: {},
    objectSets,
    objectSetsExpanded: objectSets?.length !== 0
  }

  formFields.map((field) => {
    if (field.value) {
      initialState.fields[field.name] = field.value
    }
  })

  const [state, setState] = useState(initialState)
  const [errors, setErrors] = useState<ErorrType>({})
  const { show, onClose } = useDialog(type)

  function onSubmit() {
    // early exit if there are validation errors
    if (Object.keys(errors).length) {
      return false
    }

    const postData = {
      ...state.fields,
      objectSets: state.objectSets?.filter(
        (set) => set.id !== '' && set.title !== ''
      )
    }

    // TODO: Handle submit based on the type of the dialog
    switch (type) {
      case DialogMode.PROJECT_CREATE:
        console.log('submitted CREATE PROJECT with', postData)
        break

      case DialogMode.PROJECT_EDIT:
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
        if (sets) {
          if (newVal) {
            sets.splice(index, 1, newVal)
          } else {
            sets.splice(index, 1)
          }
        }
      })
    )
  }

  function onObjectSetAddNew() {
    setState(
      produce((draft) => {
        draft.objectSets?.push({ id: '', title: '' })
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
  const dialogProps: TInnerDialog = {
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

  return type === DialogMode.PROJECT_CREATE ? (
    <CreateProjectDialog {...dialogProps} />
  ) : (
    <EditProjectDialog {...dialogProps} />
  )
}

export default ProjectDialog
