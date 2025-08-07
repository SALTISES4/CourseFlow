import { Outcome as OutcomeType } from '@cf/redux/slices/outcomes.slice'
import { useCallback, useEffect, useRef, useState } from 'react'

import * as Styled from './styles'
import TreeView from './TreeView'

type PropsType = {
  outcomes: OutcomeType[]
}

const LinkedOutcomes = ({ outcomes }: PropsType) => {
  const [show, setShow] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLSpanElement>(null)

  const onWrapEnter = useCallback(() => {
    setShow(true)
  }, [])

  const onWrapLeave = useCallback(() => {
    setShow(false)
  }, [])

  useEffect(() => {
    const target = badgeRef?.current

    if (!target) {
      return
    }

    target.addEventListener('click', onWrapEnter)

    return () => {
      target.removeEventListener('click', onWrapEnter)
    }
  }, [onWrapEnter])

  return (
    <Styled.Wrap ref={wrapRef}>
      <Styled.Badge ref={badgeRef} badgeContent={4} />
      <Styled.Popover
        open={show}
        anchorEl={wrapRef?.current}
        onClose={onWrapLeave}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        {/* <TreeView outcomes={outcomes} /> */}
        <h1>Hello</h1>
      </Styled.Popover>
    </Styled.Wrap>
  )
}

export default LinkedOutcomes
