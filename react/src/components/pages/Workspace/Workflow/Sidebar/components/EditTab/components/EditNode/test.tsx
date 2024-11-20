import { selectNodeById } from '@cfRedux/selectors/node.selector'
import { AppState } from '@cfRedux/types/type'
import { produce } from 'immer'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

const EditNode = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/

  const [state, setState] = useState<{ test: string }>({ title: 'asdasdf' })

  let hello: number = 10

  hello = 'sss'

  /*******************************************************
   * LIFECYCLE
   *******************************************************/

  useEffect(() => {
    setState(
      produce((draft) => {
        draft = 'New Title' // Example assignment
      })
    )
  }, [])

  return <></>
}
