import { Outcome as OutcomeType } from '@cf/redux/slices/outcomes.slice'

import Outcome from './Outcome'

type PropsType = {
  outcomes: OutcomeType[]
}

const TreeView = ({ outcomes }: PropsType) =>
  outcomes.map((outcome) => (
    <li key={outcome.id}>
      <Outcome {...outcome} />
    </li>
  ))

export default TreeView
