import globalContextData from '@cf/data/globalContextData.mock.json'
import type { CourseflowAppGlobals, GlobalContextData } from '@cf/types/global'

// Stopgap: mirror Django template injection — mock JSON until headless bootstrap is complete.
globalThis.COURSEFLOW_APP ??= {} as CourseflowAppGlobals
// Mock shape may not satisfy every field on GlobalContextData; cast is intentional for dev.
globalThis.COURSEFLOW_APP.globalContextData =
  globalContextData as unknown as GlobalContextData
