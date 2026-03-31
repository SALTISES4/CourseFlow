import { TTag } from '@cf/redux/types/type'
import { _t } from '@cf/utility/Utility.class'
import * as SC from '@cfViews/WorkflowView/OverviewView/styles'
import Grid from '@mui/material/Grid'
import { produce } from 'immer'
import { useCallback, useState } from 'react'

import Tag from './Tag'

type PropsType = {
  data: TTag[]
}

const Tags = ({ data }: PropsType) => {
  const [state, setState] = useState<TTag[]>(data)

  const onChange = useCallback(
    (id: string, value: string, createNew: boolean) => {
      setState(
        produce((draft) => {
          if (createNew) {
            if (!value) {
              return
            }

            draft.push({
              id,
              title: value
            })
          } else {
            const target = draft.find((t) => t.id === id)
            if (target.title !== value) {
              target.title = value
            }
          }
        })
      )
    },
    []
  )

  const onTagDelete = useCallback((id: string) => {
    setState((oldTags) =>
      produce(oldTags, (draft) => draft.filter((t) => t.id !== id))
    )
  }, [])

  if (!state) {
    return
  }

  return (
    <SC.InfoBlock sx={{ mt: 3 }}>
      <SC.InfoBlockTitle>{_t('Tags')}</SC.InfoBlockTitle>

      <SC.InfoBlockContent sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          {state.map((tag) => (
            <Grid item key={tag.id} xs={4}>
              <Tag
                id={tag.id}
                label={tag.title}
                onChange={onChange}
                onDelete={onTagDelete}
              />
            </Grid>
          ))}
          <Grid item xs={4}>
            <Tag id={state.length + 1} onChange={onChange} create />
          </Grid>
        </Grid>
      </SC.InfoBlockContent>
    </SC.InfoBlock>
  )
}

export default Tags
