import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const workerSource = await readFile(
  new URL('../public/sw.js', import.meta.url),
  'utf8'
)

function loadWorker({ cacheNames = [] } = {}) {
  const listeners = new Map()
  const calls = {
    claim: 0,
    deletedCaches: [],
    skipWaiting: 0,
    unregister: 0
  }

  const context = {
    caches: {
      async delete(cacheName) {
        calls.deletedCaches.push(cacheName)
        return true
      },
      async keys() {
        return cacheNames
      }
    },
    self: {
      addEventListener(eventName, listener) {
        listeners.set(eventName, listener)
      },
      clients: {
        async claim() {
          calls.claim += 1
        }
      },
      registration: {
        async unregister() {
          calls.unregister += 1
          return true
        }
      },
      async skipWaiting() {
        calls.skipWaiting += 1
      }
    }
  }

  vm.runInNewContext(workerSource, context, { filename: 'sw.js' })
  return { calls, listeners }
}

async function dispatchExtendableEvent(listener) {
  let completion
  listener({
    waitUntil(promise) {
      completion = promise
    }
  })
  assert.ok(completion, 'worker event must register asynchronous completion')
  await completion
}

test('retirement worker activates immediately', async () => {
  const { calls, listeners } = loadWorker()

  await dispatchExtendableEvent(listeners.get('install'))

  assert.equal(calls.skipWaiting, 1)
})

test('retirement worker removes only Workbox caches and unregisters', async () => {
  const { calls, listeners } = loadWorker({
    cacheNames: [
      'workbox-precache-v2-https://courseflow.example/',
      'workbox-runtime-https://courseflow.example/',
      'unrelated-application-cache'
    ]
  })

  await dispatchExtendableEvent(listeners.get('activate'))

  assert.equal(calls.claim, 1)
  assert.deepEqual(calls.deletedCaches, [
    'workbox-precache-v2-https://courseflow.example/',
    'workbox-runtime-https://courseflow.example/'
  ])
  assert.equal(calls.unregister, 1)
})
