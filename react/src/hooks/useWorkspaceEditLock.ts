import {
  acquireWorkspaceEditLock,
  getWorkspaceEditLock,
  refreshWorkspaceEditLock,
  takeoverWorkspaceEditLock
} from '@cf/api/gen/sdk.gen'
import {
  ResourceRole,
  type WorkspaceEditLockOut,
  WorkspaceEditLockState,
  WorkspaceResourceType
} from '@cf/api/gen/types.gen'
import {
  WORKSPACE_EDIT_LOCK_ERROR_EVENT,
  type WorkspaceEditLockErrorDetail
} from '@cf/api/workspaceEditLockEvents'
import { enqueueSnackbar } from 'notistack'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const REFRESH_INTERVAL_MS = 5_000
const STATUS_POLL_INTERVAL_MS = 15_000

type Workspace = 'project' | 'workflow'
type LockPhase = 'ineligible' | 'resolving' | 'held' | 'locked' | 'unavailable'

type UseWorkspaceEditLockOptions = {
  workspace: Workspace
  resourceUuid: string
  resourceRole: string | null | undefined
  resourceState: string | null | undefined
  reload: () => Promise<unknown | null>
}

type LockViewState = {
  phase: LockPhase
  lock: WorkspaceEditLockOut | null
  lockLost: boolean
}

function isSameLock(
  left: WorkspaceEditLockOut | null,
  right: WorkspaceEditLockOut | null
): boolean {
  return (
    left?.state === right?.state &&
    left?.version === right?.version &&
    left?.holder?.uuid === right?.holder?.uuid &&
    left?.holder?.displayName === right?.holder?.displayName
  )
}

function isEligible(
  role: string | null | undefined,
  state: string | null | undefined
): boolean {
  return (
    (role === ResourceRole.OWNER || role === ResourceRole.EDITOR) &&
    state !== 'archived'
  )
}

export function useWorkspaceEditLock({
  workspace,
  resourceUuid,
  resourceRole,
  resourceState,
  reload
}: UseWorkspaceEditLockOptions) {
  const { t } = useTranslation('common')
  const eligible = isEligible(resourceRole, resourceState)
  const resourceKey = `${workspace}:${resourceUuid}`
  const currentResourceKeyRef = useRef(resourceKey)
  const requestInFlightRef = useRef(false)
  const requestHandledByLockEventRef = useRef(false)
  const unavailableNotifiedRef = useRef(false)
  const [takeoverPending, setTakeoverPending] = useState(false)
  const [viewState, setViewState] = useState<LockViewState>({
    phase: eligible ? 'resolving' : 'ineligible',
    lock: null,
    lockLost: false
  })

  currentResourceKeyRef.current = resourceKey

  const isCurrentResource = useCallback(
    () => currentResourceKeyRef.current === resourceKey,
    [resourceKey]
  )

  const showUnavailable = useCallback(() => {
    if (unavailableNotifiedRef.current) {
      return
    }
    unavailableNotifiedRef.current = true
    enqueueSnackbar(t('editLock.unavailable'), { variant: 'error' })
  }, [t])

  const applyResponse = useCallback(
    async (lock: WorkspaceEditLockOut, reloadBeforeEnable: boolean) => {
      if (!isCurrentResource()) {
        return
      }
      if (lock.state === WorkspaceEditLockState.LOCKED) {
        unavailableNotifiedRef.current = false
        setViewState((current) => {
          const lockLost = current.lockLost || current.phase === 'held'
          if (
            current.phase === 'locked' &&
            current.lockLost === lockLost &&
            isSameLock(current.lock, lock)
          ) {
            return current
          }
          return { phase: 'locked', lock, lockLost }
        })
        return
      }
      if (lock.state === WorkspaceEditLockState.AVAILABLE) {
        setViewState((current) =>
          current.phase === 'unavailable' && current.lock === null
            ? current
            : { phase: 'unavailable', lock: null, lockLost: false }
        )
        return
      }

      if (reloadBeforeEnable) {
        const reloadError = await reload()
        if (!isCurrentResource()) {
          return
        }
        if (reloadError) {
          setViewState({ phase: 'unavailable', lock, lockLost: false })
          showUnavailable()
          return
        }
      }

      unavailableNotifiedRef.current = false
      setViewState((current) =>
        current.phase === 'held' && isSameLock(current.lock, lock)
          ? current
          : { phase: 'held', lock, lockLost: false }
      )
    },
    [isCurrentResource, reload, showUnavailable]
  )

  const acquireLease = useCallback(async () => {
    if (!eligible || requestInFlightRef.current) {
      return
    }
    requestInFlightRef.current = true
    requestHandledByLockEventRef.current = false
    try {
      const { data } = await acquireWorkspaceEditLock({
        path: {
          resource_type: workspace,
          resource_uuid: resourceUuid
        },
        throwOnError: true
      })
      await applyResponse(data, data.state === WorkspaceEditLockState.HELD)
    } catch {
      if (isCurrentResource() && !requestHandledByLockEventRef.current) {
        setViewState({ phase: 'unavailable', lock: null, lockLost: false })
        showUnavailable()
      }
    } finally {
      requestInFlightRef.current = false
    }
  }, [
    applyResponse,
    eligible,
    isCurrentResource,
    resourceUuid,
    showUnavailable,
    workspace
  ])

  useEffect(() => {
    unavailableNotifiedRef.current = false
    requestInFlightRef.current = false
    requestHandledByLockEventRef.current = false
    setTakeoverPending(false)
    if (!eligible) {
      setViewState({ phase: 'ineligible', lock: null, lockLost: false })
      return
    }
    setViewState({ phase: 'resolving', lock: null, lockLost: false })
    void acquireLease()
  }, [acquireLease, eligible, resourceKey])

  useEffect(() => {
    if (!eligible || viewState.phase === 'resolving') {
      return
    }

    const intervalMs =
      viewState.phase === 'held' ? REFRESH_INTERVAL_MS : STATUS_POLL_INTERVAL_MS
    const interval = window.setInterval(() => {
      if (viewState.phase !== 'held') {
        if (requestInFlightRef.current) {
          return
        }
        requestInFlightRef.current = true
        requestHandledByLockEventRef.current = false
        void getWorkspaceEditLock({
          path: {
            resource_type: workspace,
            resource_uuid: resourceUuid
          },
          throwOnError: true
        })
          .then(async ({ data }) => {
            if (data.state === WorkspaceEditLockState.AVAILABLE) {
              setViewState({
                phase: 'unavailable',
                lock: null,
                lockLost: false
              })
              requestInFlightRef.current = false
              await acquireLease()
              return
            }
            await applyResponse(data, false)
          })
          .catch(() => {
            if (isCurrentResource() && !requestHandledByLockEventRef.current) {
              setViewState({
                phase: 'unavailable',
                lock: null,
                lockLost: false
              })
              showUnavailable()
            }
          })
          .finally(() => {
            requestInFlightRef.current = false
          })
        return
      }
      if (requestInFlightRef.current) {
        return
      }
      requestInFlightRef.current = true
      requestHandledByLockEventRef.current = false
      void refreshWorkspaceEditLock({
        path: {
          resource_type: workspace,
          resource_uuid: resourceUuid
        },
        throwOnError: true
      })
        .then(({ data }) => {
          if (data.state === WorkspaceEditLockState.AVAILABLE) {
            setViewState({
              phase: 'unavailable',
              lock: null,
              lockLost: false
            })
            requestInFlightRef.current = false
            return acquireLease()
          }
          return applyResponse(data, false)
        })
        .catch(() => {
          if (isCurrentResource() && !requestHandledByLockEventRef.current) {
            setViewState({
              phase: 'unavailable',
              lock: null,
              lockLost: false
            })
            showUnavailable()
          }
        })
        .finally(() => {
          requestInFlightRef.current = false
        })
    }, intervalMs)

    return () => window.clearInterval(interval)
  }, [
    acquireLease,
    applyResponse,
    eligible,
    isCurrentResource,
    resourceUuid,
    showUnavailable,
    viewState.phase,
    workspace
  ])

  useEffect(() => {
    if (!eligible) {
      return
    }
    const onLockError = (event: Event) => {
      const detail = (event as CustomEvent<WorkspaceEditLockErrorDetail>).detail
      if (
        detail.workspace !== workspace ||
        detail.resourceUuid !== resourceUuid
      ) {
        return
      }
      requestHandledByLockEventRef.current = true
      if (detail.code === 'edit_lock_expired') {
        setViewState({ phase: 'unavailable', lock: null, lockLost: false })
        return
      }
      setViewState((current) => ({
        phase: 'locked',
        lockLost: current.lockLost || current.phase === 'held',
        lock: {
          resourceType:
            workspace === 'project'
              ? WorkspaceResourceType.PROJECT
              : WorkspaceResourceType.WORKFLOW,
          resourceUuid,
          state: WorkspaceEditLockState.LOCKED,
          holder:
            detail.holderUuid && detail.holderDisplayName
              ? {
                  uuid: detail.holderUuid,
                  displayName: detail.holderDisplayName
                }
              : null,
          version: detail.version ?? null,
          expiresAt: null
        }
      }))
    }
    window.addEventListener(WORKSPACE_EDIT_LOCK_ERROR_EVENT, onLockError)
    return () =>
      window.removeEventListener(WORKSPACE_EDIT_LOCK_ERROR_EVENT, onLockError)
  }, [eligible, resourceUuid, workspace])

  const takeover = useCallback(async () => {
    const priorLock = viewState.lock
    const expectedVersion = priorLock?.version
    if (!expectedVersion || takeoverPending) {
      return
    }
    setTakeoverPending(true)
    requestHandledByLockEventRef.current = false
    try {
      const { data } = await takeoverWorkspaceEditLock({
        body: { expectedVersion },
        path: {
          resource_type: workspace,
          resource_uuid: resourceUuid
        },
        throwOnError: true
      })
      if (data.state !== WorkspaceEditLockState.HELD) {
        await applyResponse(data, false)
        return
      }
      const reloadError = await reload()
      if (!isCurrentResource()) {
        return
      }
      if (reloadError) {
        setViewState({ phase: 'locked', lock: priorLock, lockLost: false })
        showUnavailable()
        return
      }
      unavailableNotifiedRef.current = false
      setViewState({ phase: 'held', lock: data, lockLost: false })
    } catch {
      if (isCurrentResource() && !requestHandledByLockEventRef.current) {
        setViewState({ phase: 'locked', lock: priorLock, lockLost: false })
        showUnavailable()
      }
    } finally {
      setTakeoverPending(false)
    }
  }, [
    applyResponse,
    isCurrentResource,
    reload,
    resourceUuid,
    showUnavailable,
    takeoverPending,
    viewState.lock,
    workspace
  ])

  return {
    editingEnabled:
      viewState.phase === 'held' || viewState.phase === 'ineligible',
    initialResolving: viewState.phase === 'resolving',
    locked: viewState.phase === 'locked' ? viewState.lock : null,
    lockLost: viewState.lockLost,
    takeover,
    takeoverPending
  }
}
