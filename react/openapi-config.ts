import type { ConfigFile } from '@rtk-query/codegen-openapi'

const config: ConfigFile = {
  schemaFile: 'http://127.0.0.1:8000/api/openapi.json',
  apiFile: './src/api/store/emptyApi.ts',
  apiImport: 'emptySplitApi',
  outputFile: './src/api/store/cfApi.ts',
  exportName: 'cf',
  hooks: true
}

export default config
