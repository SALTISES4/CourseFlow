import Base from '@cf/base'
import {
  selectAuthStatus,
  selectIsBootstrapping
} from '@cf/features/auth/state/auth.slice'
import WorkflowPage from '@cfPages/Workflow'
import { useSelector } from 'react-redux'

export function WorkflowRoute() {
  const bootstrapping = useSelector(selectIsBootstrapping)
  const status = useSelector(selectAuthStatus)

  if (bootstrapping) {
    return <div style={{ padding: 24 }}>Loading…</div>
  }

  if (status === 'authenticated') {
    return (
      <Base>
        <WorkflowPage />
      </Base>
    )
  }

  return (
    <div data-test-id="public-workflow-shell">
      <WorkflowPage publicView />
    </div>
  )
}
